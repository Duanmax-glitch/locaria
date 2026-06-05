/* ============================================================
   LOCARIA - core/auth.js
   Google Identity Services, sessao, login/logout e tratamento de sessao invalida.
   ============================================================ */
let currentUser = null; // { name, token }
const USER_KEY  = 'locaria_user';
const GIS_CLIENT_ID = '113751346853-s9kqodo6361ca1nhko5t3nhgq29i3bql.apps.googleusercontent.com';
async function handleGoogleCredential(response){
  const msg = document.getElementById('loginMsg');
  msg.style.color = '#64707f';
  msg.textContent = 'Verificando autorização…';

  try {
    const r = await fetch(CONFIG.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'login', credential: response.credential }),
      redirect: 'follow',
    });
    const text = await r.text();
    const j = JSON.parse(text);

    if(!j.ok){
      msg.style.color = '#f06565';
      msg.textContent = '⛔ ' + (j.error || 'Acesso negado. Conta não autorizada.');
      return;
    }

    currentUser = {
      name:      j.nome,
      email:     j.email,
      token:     j.token,
      perfil:    j.perfil || '',
      // Usa o teto absoluto devolvido pelo servidor (autoritativo). Fallback de 2h
      // só para compatibilidade; o servidor é quem realmente decide a validade.
      expiresAt: j.expiresAt || (Date.now() + 2 * 60 * 60 * 1000),
    };
    salvarSessao(currentUser);
    mostrarApp();

  } catch(e) {
    msg.style.color = '#f06565';
    msg.textContent = 'Erro de conexão. Tente novamente.';
  }
}
function initGoogleSignIn(){
  if(!window.google || !window.google.accounts) return;
  window.google.accounts.id.initialize({
    client_id: GIS_CLIENT_ID,
    callback: handleGoogleCredential,
    auto_select: false,
  });
  window.google.accounts.id.renderButton(
    document.getElementById('googleSignInBtn'),
    {
      theme: 'filled_black',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: 300,
    }
  );
}
function mostrarApp(){
  // Rodapé da sidebar: nome do usuário + bolinha de status
  const un = document.getElementById('userName');
  if(un) un.textContent = currentUser.name || 'Usuário';
  const cd = document.getElementById('connDot');
  if(cd){ cd.className = 'dot live'; cd.title = 'Conectado ao Sheets'; }
  const ls = document.getElementById('loginScreen');
  ls.style.transition = 'opacity .35s';
  ls.style.opacity = '0';
  setTimeout(() => { ls.style.display = 'none'; }, 350);
  if(window.initApp) window.initApp();
}
function sessaoInvalida(err){
  const m = String(err||'').toLowerCase();
  return m.includes('sessão expirada') || m.includes('sessao expirada') ||
         m.includes('token inválido')  || m.includes('token invalido') ||
         m.includes('inconsistência de identidade') || m.includes('inconsistencia de identidade');
}

/* Encerra a sessão local imediatamente e devolve o usuário ao login.
   Evita que um token já rejeitado pelo servidor continue sendo reenviado. */
function forcarRelogin(err){
  try{ limparSessao(); }catch(e){}
  currentUser = null;
  try{ toast('Sessão expirada. Faça login novamente.','err'); }catch(e){}
  setTimeout(()=>window.location.reload(), 800);
  return null;
}

function logoutGoogle(){
  if(window.google && window.google.accounts){
    window.google.accounts.id.disableAutoSelect();
  }
  limparSessao();
  currentUser = null;
  window.location.reload();
}
