/* ============================================================
   LOCARIA - main.js
   Bootstrap: restaura sessao salva, atalhos de teclado, listeners de navegacao e init.
   ============================================================ */
(function checkSavedSession(){
  try {
    const saved = JSON.parse(sessionStorage.getItem(USER_KEY));
    if(saved && saved.token && saved.expiresAt > Date.now()){
      currentUser = saved;
      mostrarApp();
      return;
    }
    if(saved) sessionStorage.removeItem(USER_KEY); // sessão inválida/expirada
  } catch(e){}
  // Sem sessão — inicializa o botão GIS
  const tryInit = setInterval(() => {
    if(window.google && window.google.accounts){
      clearInterval(tryInit);
      initGoogleSignIn();
    }
  }, 100);
  setTimeout(() => clearInterval(tryInit), 10000);
})();
document.addEventListener('keydown', e => {
  if(e.key==='/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){
    e.preventDefault(); gsrOpen();
  }
  if(e.key==='Escape' && document.getElementById('gsrOverlay')?.classList.contains('open')){
    gsrClose();
  }
});
document.querySelectorAll('.nav-item').forEach(n=>n.addEventListener('click',()=>navigate(n.dataset.view)));
(async function init(){
  window._appReady = false;
  window.initApp = async function(){
    if(window._appReady) return;
    window._appReady = true;
    await loadData();
    renderTopActions('dashboard');
    renderView('dashboard');
  };
  // Se já tem sessão válida, carrega imediatamente
  if(currentUser) await window.initApp();
})();
