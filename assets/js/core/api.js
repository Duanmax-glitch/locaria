/* ============================================================
   LOCARIA - core/api.js
   Comunicacao com o Apps Script (apiGet/apiPost), carga de dados e engine CRUD.
   ============================================================ */
async function apiGet(){
  if(!currentUser || !currentUser.token){ throw new Error('Sessão não autenticada.'); }
  // Leitura via POST: o token vai no corpo (não na URL), evitando vazamento em logs/histórico.
  try {
    const r = await fetch(CONFIG.url, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify({ action:'getAll', token: currentUser.token, email: currentUser.email }),
      redirect:'follow',
    });
    const text = await r.text();
    let j;
    try { j = JSON.parse(text); }
    catch(_){ throw new Error('Resposta inválida do servidor.'); }
    if(!j.ok){ if(sessaoInvalida(j.error)) return forcarRelogin(j.error); throw new Error(j.error||'Erro'); }
    return j.data;
  } catch(e) {
    throw e;
  }
}
async function apiPost(payload){
  if(!currentUser || !currentUser.token){ throw new Error('Sessão não autenticada.'); }
  payload.token = currentUser.token;
  payload.email = currentUser.email;
  try {
    const r = await fetch(CONFIG.url, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    const text = await r.text();
    let j;
    try { j = JSON.parse(text); }
    catch(_){ throw new Error('Resposta inválida do servidor. Verifique a URL do Apps Script.'); }
    if(!j.ok){ if(sessaoInvalida(j.error)){ forcarRelogin(j.error); return j; } throw new Error(j.error||'Erro no servidor'); }
    return j;
  } catch(e) {
    throw e;
  }
}
async function loadData(){
  try{
    const d = await apiGet();
    STATE = { imoveis:d.imoveis||[], inquilinos:d.inquilinos||[], contratos:d.contratos||[], vistorias:d.vistorias||[], cobrancas:d.cobrancas||[], regras:d.regras||[], manutencoes:d.manutencoes||[], reajustes:d.reajustes||[], proprietario:(d.proprietario&&d.proprietario[0])||{} };
    setConn(true);
  }catch(e){
    // Sem fallback de dados: nunca mostra informação fictícia. Mantém estado vazio e sinaliza erro.
    STATE = { imoveis:[], inquilinos:[], contratos:[], vistorias:[], cobrancas:[], regras:[], manutencoes:[], reajustes:[], proprietario:{} };
    setConn(false,true);
    toast('Falha ao conectar ao servidor. Faça login novamente.','err');
  }
  // Backfill: imóveis antigos sem Data_Cadastro
  STATE.imoveis.forEach(i => {
    if(!i.Data_Cadastro) i.Data_Cadastro = '2020-01-01';
  });

  // ── Auto-ATRASADO ──
  // Cobranças PENDENTE com vencimento anterior a hoje → ATRASADO automático.
  // Atualiza o STATE local para exibição imediata e persiste com UMA única
  // chamada server-side (marcarAtrasadas), em vez de N updates avulsos.
  const hojeAuto = new Date().toISOString().slice(0,10);
  let _houveAtraso = false;
  STATE.cobrancas.forEach(c => {
    if(c.Status_Cobranca === 'PENDENTE' && c.Data_Vencimento < hojeAuto){
      c.Status_Cobranca = 'ATRASADO';
      _houveAtraso = true;
    }
  });
  if(_houveAtraso && LIVE()){
    apiPost({action:'marcarAtrasadas'}).catch(()=>{});
  }

  // ── Auto-ENCERRAMENTO ──
  // Contrato ATIVO cujo término já passou e SEM renovação automática → ENCERRADO.
  // Atualiza o STATE local (exibição imediata + libera o imóvel) e persiste com
  // UMA chamada server-side (encerrarVencidos), que recalcula de forma autoritativa.
  let _houveEncerramento = false;
  STATE.contratos.forEach(c => {
    const fim = String(c.Data_Fim_Contrato || '').slice(0,10);
    const renova = String(c.Renovacao_Automatica || '').toUpperCase() === 'SIM';
    if(c.Status_Contrato === 'ATIVO' && !renova && /^\d{4}-\d{2}-\d{2}$/.test(fim) && fim < hojeAuto){
      c.Status_Contrato = 'ENCERRADO';
      _houveEncerramento = true;
      atualizarStatusImovel(c.ID_Imovel);   // libera o imóvel na tela na hora
    }
  });
  if(_houveEncerramento && LIVE()){
    apiPost({action:'encerrarVencidos'}).catch(()=>{});
  }

  // Atualiza o sino de avisos de reajuste na barra superior
  try{ if(typeof atualizarSinoReajuste === 'function') atualizarSinoReajuste(); }catch(e){}

  // ── Geração automática de cobranças pelas Regras ──
  // Roda depois de um tick para garantir que STATE está totalmente populado
  setTimeout(gerarCobrancasAutomaticas, 0);
}
function setConn(live,error){
  const dot=$('#connDot');
  if(!dot) return;
  if(live){ dot.className='dot live'; dot.title='Conectado ao Sheets'; }
  else if(error){ dot.className='dot demo'; dot.title='Erro de conexão'; }
  else { dot.className='dot demo'; dot.title='Desconectado'; }
}
function atualizarStatusImovel(idImovel){
  const imovel = STATE.imoveis.find(i => Number(i.ID_Imovel) === Number(idImovel));
  if(!imovel) return;
  if(imovel.Status_Atual === 'MANUTENCAO') return; // manutenção é manual, não sobrescreve
  imovel.Status_Atual = contratoAtivoDoImovel(idImovel) ? 'ALUGADO' : 'VAGO';
}

async function saveRecord(sheet, key, record, isNew){
  if(LIVE()){
    // Salva no Sheets — se falhar aqui é erro real
    const resp = await apiPost({action: isNew?'create':'update', sheet, key, record});
    // Em sessão expirada/inválida, apiPost NÃO lança: devolve {ok:false} e dispara
    // o relogin. Se não checarmos aqui, o registro entra só na memória local e
    // vira "fantasma" (aparece na tela, mas nunca foi gravado no servidor).
    if(!resp || resp.ok === false){
      throw new Error((resp && resp.error) || 'Não foi possível salvar. Faça login novamente.');
    }
    // Atualiza o STATE local imediatamente para não depender do loadData
    const arr = STATE[sheet] || [];
    if(isNew){
      arr.push(record);
    } else {
      const i = arr.findIndex(r=>String(r[key])===String(record[key]));
      if(i>=0) arr[i] = record;
    }
    // Recarrega e atualiza a view automaticamente
    loadData().then(()=>{ renderView(currentView); }).catch(()=>{});
  }else{
    // Singleton (ex: proprietario): STATE[sheet] é objeto, não array
    if(FORMS[sheet] && FORMS[sheet].singleton){
      STATE[sheet] = {...record};
    } else {
      const arr = STATE[sheet];
      if(isNew){ arr.push(record); }
      else { const i=arr.findIndex(r=>String(r[key])===String(record[key])); if(i>=0) arr[i]=record; }
    }
  }

  /* ============================================================
     REGRA AUTOMÁTICA IMÓVEL
     ============================================================ */
  if(sheet === 'contratos'){
     atualizarStatusImovel(record.ID_Imovel);
  }
}

async function deleteRecord(sheet, key, id){
  if(LIVE()){
    const resp = await apiPost({action:'delete',sheet,key,id});
    if(!resp || resp.ok === false){ throw new Error((resp && resp.error) || 'Não foi possível excluir. Faça login novamente.'); }
    await loadData();
  }
  else { STATE[sheet] = STATE[sheet].filter(r=>String(r[key])!==String(id)); }
}
