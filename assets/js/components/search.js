/* ============================================================
   LOCARIA - components/search.js
   Busca global (spotlight).
   ============================================================ */
let gsrSelectedIdx = -1;
function gsrOpen(){
  document.getElementById('gsrOverlay').classList.add('open');
  const inp = document.getElementById('gsrInput');
  inp.value = '';
  gsrSelectedIdx = -1;
  document.getElementById('gsrResults').innerHTML = gsrEmptyState();
  setTimeout(()=>inp.focus(), 60);
}
function gsrClose(){
  document.getElementById('gsrOverlay').classList.remove('open');
  gsrSelectedIdx = -1;
}
function gsrOverlayClick(e){
  if(e.target === document.getElementById('gsrOverlay')) gsrClose();
}

function gsrEmptyState(){
  return `<div class="gsr-empty">Digite para buscar imóveis, inquilinos e cobranças</div>`;
}

function gsrSearch(q){
  q = q.trim().toLowerCase();
  gsrSelectedIdx = -1;
  if(!q){ document.getElementById('gsrResults').innerHTML = gsrEmptyState(); return; }

  const results = [];

  // ── Imóveis ──
  const ims = STATE.imoveis.filter(i =>
    i.Nome_Imovel.toLowerCase().includes(q) ||
    (i.Endereco_Imovel||'').toLowerCase().includes(q)
  ).slice(0,4);
  if(ims.length) results.push({ type:'section', label:'Imóveis' });
  ims.forEach(i => {
    const con = contratoAtivoDoImovel(i.ID_Imovel);
    results.push({
      type:'item', category:'imovel',
      title: i.Nome_Imovel,
      sub: (i.Endereco_Imovel||'') + (con?' · '+con.Nome_Inquilino:''),
      badge: statusBadge(i.Status_Atual),
      color: avColor(i.ID_Imovel),
      initials: initials(i.Nome_Imovel),
      action: () => { navigate('imoveis'); gsrClose(); viewImovel(i.ID_Imovel); }
    });
  });

  // ── Inquilinos ──
  const inqs = STATE.inquilinos.filter(i =>
    i.Nome_Inquilino.toLowerCase().includes(q) ||
    (i.CPF_Inquilino||'').toLowerCase().includes(q) ||
    (i.Telefone_Inquilino||'').toLowerCase().includes(q)
  ).slice(0,4);
  if(inqs.length) results.push({ type:'section', label:'Inquilinos' });
  inqs.forEach(i => {
    const con = contratosDoInquilino(i.ID_Inquilino).find(c=>c.Status_Contrato==='ATIVO');
    results.push({
      type:'item', category:'inquilino',
      title: i.Nome_Inquilino,
      sub: (con?con.Nome_Imovel+' · '+fmtBRL2(con.Valor_Aluguel_Contratual):(i.CPF_Inquilino||'')),
      badge: con?statusBadge('ATIVO'):'',
      color: avColor(i.ID_Inquilino),
      initials: initials(i.Nome_Inquilino),
      action: () => { navigate('inquilinos'); gsrClose(); viewInquilino(i.ID_Inquilino); }
    });
  });

  // ── Contratos ──
  const ctrs = STATE.contratos.filter(c =>
    (c.Nome_Inquilino||'').toLowerCase().includes(q) ||
    (c.Nome_Imovel||'').toLowerCase().includes(q)
  ).slice(0,4);
  if(ctrs.length) results.push({ type:'section', label:'Contratos' });
  ctrs.forEach(c => {
    results.push({
      type:'item', category:'contrato',
      title: c.Nome_Inquilino + ' · ' + c.Nome_Imovel,
      sub: fmtBRL2(c.Valor_Aluguel_Contratual) + (c.Data_Fim_Contrato?' · até '+new Date(c.Data_Fim_Contrato+'T00:00').toLocaleDateString('pt-BR'):''),
      badge: statusBadge(c.Status_Contrato),
      color: avColor(c.ID_Imovel),
      initials: initials(c.Nome_Inquilino),
      action: () => { navigate('contratos'); gsrClose(); viewContrato(c.ID_Contrato); }
    });
  });

  // ── Cobranças pendentes/atrasadas ──
  const cobs = STATE.cobrancas.filter(c =>
    (c.Status_Cobranca==='PENDENTE'||c.Status_Cobranca==='ATRASADO'||c.Status_Cobranca==='PARCIAL') &&
    ((c.Nome_Imovel||'').toLowerCase().includes(q) ||
     (c.Responsavel_Pagamento||'').toLowerCase().includes(q) ||
     (c.Tipo_Cobranca||'').toLowerCase().includes(q) ||
     (c.Competencia||'').toLowerCase().includes(q))
  ).slice(0,4);
  if(cobs.length) results.push({ type:'section', label:'Cobranças em aberto' });
  cobs.forEach(c => {
    results.push({
      type:'item', category:'cobranca',
      title: (c.Nome_Imovel||'') + ' — ' + optLabel(c.Tipo_Cobranca),
      sub: monthLabel(c.Competencia) + ' · venc. ' + new Date(c.Data_Vencimento+'T00:00').toLocaleDateString('pt-BR') + ' · ' + fmtBRL2(c.Valor_Cobrado),
      badge: statusBadge(c.Status_Cobranca),
      color: avColor(c.ID_Imovel),
      initials: initials(c.Nome_Imovel),
      action: () => { navigate('cobrancas'); gsrClose(); openPagamentoModal(c.ID_Cobranca); }
    });
  });

  if(!results.length){
    document.getElementById('gsrResults').innerHTML = `<div class="gsr-empty">Nenhum resultado para "<strong>${esc(q)}</strong>"</div>`;
    return;
  }

  let html = '';
  let itemIdx = 0;
  results.forEach(r => {
    if(r.type === 'section'){
      html += `<div class="gsr-section-title">${esc(r.label)}</div>`;
    } else {
      html += `<div class="gsr-item" data-idx="${itemIdx}" onclick="gsrActivate(${itemIdx})">
        <div class="gsr-item-av" style="background:${r.color}">${esc(r.initials)}</div>
        <div class="gsr-item-body">
          <div class="gsr-item-title">${esc(r.title)}</div>
          <div class="gsr-item-sub">${esc(r.sub)}</div>
        </div>
        <div class="gsr-item-badge">${r.badge}</div>
      </div>`;
      itemIdx++;
    }
  });
  document.getElementById('gsrResults').innerHTML = html;

  // Armazena ações indexadas
  window._gsrActions = results.filter(r=>r.type==='item').map(r=>r.action);
}

function gsrActivate(idx){
  const actions = window._gsrActions || [];
  if(actions[idx]) actions[idx]();
}

function gsrKeyNav(e){
  const items = document.querySelectorAll('.gsr-item');
  if(!items.length) return;
  if(e.key === 'ArrowDown'){
    e.preventDefault();
    gsrSelectedIdx = Math.min(gsrSelectedIdx+1, items.length-1);
  } else if(e.key === 'ArrowUp'){
    e.preventDefault();
    gsrSelectedIdx = Math.max(gsrSelectedIdx-1, 0);
  } else if(e.key === 'Enter'){
    e.preventDefault();
    if(gsrSelectedIdx >= 0) gsrActivate(gsrSelectedIdx);
    else if(items.length) gsrActivate(0);
    return;
  } else if(e.key === 'Escape'){
    gsrClose(); return;
  } else { return; }
  items.forEach((el,i) => el.classList.toggle('selected', i===gsrSelectedIdx));
  if(items[gsrSelectedIdx]) items[gsrSelectedIdx].scrollIntoView({block:'nearest'});
}

