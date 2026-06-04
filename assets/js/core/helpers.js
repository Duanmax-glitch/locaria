/* ============================================================
   LOCARIA - core/helpers.js
   Formatadores, selecao DOM, badges e helpers de relacionamento compartilhados.
   ============================================================ */
const $ = s => document.querySelector(s);
const fmtBRL = v => 'R$ ' + (Number(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0});
const fmtBRL2 = v => (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const initials = n => (n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const AV_COLORS=['#e0a23c','#3ec58b','#5b9bf0','#9d7bf0','#f06565','#46b6c4','#d98ad9'];
const avColor = id => AV_COLORS[(parseInt(String(id).replace(/\D/g,''))||0)%AV_COLORS.length];
const todayComp = ()=>{ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); };
const monthLabel = c => { const [y,m]=c.split('-'); return ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][+m-1]+'/'+y.slice(2); };
function diasAtraso(venc,status){ if(status==='PAGO')return 0; const d=new Date(venc); const t=new Date(); const diff=Math.floor((t-d)/864e5); return diff>0?diff:0; }
function statusBadge(s){
  const m = {
    PAGO:['b-pago','Pago'],
    ATRASADO:['b-atraso','Atrasado'],
    PENDENTE:['b-pend','Pendente'],
    PARCIAL:['b-parcial','Pago Parcial'],
    CANCELADO:['b-vago','Cancelado'],
    ATIVO:['b-ativo','Ativo'],
    ALUGADO:['b-ativo','Alugado'],
    VAGO:['b-vago','Vago'],
    ATIVA:['b-pago','Ativa'],
    INATIVA:['b-vago','Inativa']
  };
  const [c,l] = m[s] || ['b-vago', esc(s||'—')];
  return `<span class="badge ${c}">${l}</span>`;
}
function tipoBadge(t){ const c=t==='ALUGUEL'?'b-ativo':t==='AGUA'?'b-pend':'b-pago'; const l={ALUGUEL:'Aluguel',AGUA:'Água',LUZ:'Luz'}[t]||esc(t); return `<span class="badge ${c}">${l}</span>`; }

function labelFormaPagamento(f){
  return {PIX:'PIX',DINHEIRO:'Dinheiro',BOLETO:'Boleto',CARTAO_CREDITO:'Cartão de Crédito',CARTAO_DEBITO:'Cartão de Débito',TRANSFERENCIA:'Transferência Bancária',CHEQUE:'Cheque',OUTRO:'Outros'}[f]||f;
}

function statusManutBadge(s){
  const m={ABERTO:['b-aberto','Aberto'],EM_ANDAMENTO:['b-andamento','Em Andamento'],CONCLUIDO:['b-concluido','Concluído'],CANCELADO:['b-vago','Cancelado']};
  const [c,l]=m[s]||['b-vago', esc(s||'—')];
  return `<span class="badge ${c}">${l}</span>`;
}
function optLabel(o){return {ALUGUEL:'Aluguel',AGUA:'Água',LUZ:'Luz',CONDOMINIO:'Condomínio',IPTU:'IPTU',OUTRO:'Outro',ATIVO:'Ativo',ENCERRADO:'Encerrado',SUSPENSO:'Suspenso',ALUGADO:'Alugado',VAGO:'Vago',MANUTENCAO:'Em manutenção',PENDENTE:'Pendente',PAGO:'Pago',ATRASADO:'Atrasado',PARCIAL:'Pago Parcial',CANCELADO:'Cancelado',SIM:'Sim',NAO:'Não',ATIVA:'Ativa',INATIVA:'Inativa',ABERTO:'Aberto',EM_ANDAMENTO:'Em Andamento',CONCLUIDO:'Concluído',PIX:'PIX',DINHEIRO:'Dinheiro',BOLETO:'Boleto',CARTAO_CREDITO:'Cartão de Crédito',CARTAO_DEBITO:'Cartão de Débito',TRANSFERENCIA:'Transferência Bancária',CHEQUE:'Cheque','':'— Selecione —'}[o]||esc(o);}
function nomeProprietario(){ return (STATE.proprietario && STATE.proprietario.Nome_Proprietario) || ''; }

/* ── Helpers de relacionamento (Inquilinos · Contratos · Imóveis) ── */
function imovelPorId(id){ return STATE.imoveis.find(x => String(x.ID_Imovel) === String(id)) || null; }
function inquilinoPorId(id){ return STATE.inquilinos.find(x => String(x.ID_Inquilino) === String(id)) || null; }
function contratoPorId(id){ return STATE.contratos.find(x => String(x.ID_Contrato) === String(id)) || null; }
/* Contrato ATIVO (não excluído) de um imóvel — usado por cobranças e status do imóvel */
function contratoAtivoDoImovel(idImovel){
  return STATE.contratos.find(c =>
    String(c.ID_Imovel) === String(idImovel) &&
    c.Status_Contrato === 'ATIVO' &&
    String(c.ATIVO || 'SIM').toUpperCase() !== 'NAO'
  ) || null;
}
/* Lista de contratos de um inquilino */
function contratosDoInquilino(idInquilino){
  return STATE.contratos.filter(c => String(c.ID_Inquilino) === String(idInquilino));
}

/* Data do próximo reajuste: 12 meses após o último reajuste (ou após o início,
   se nunca reajustado). Retorna 'AAAA-MM-DD' ou '' se não houver data-base válida. */
function proximoReajuste(c){
  const base = (c.Data_Ultimo_Reajuste && /^\d{4}-\d{2}-\d{2}$/.test(c.Data_Ultimo_Reajuste))
    ? c.Data_Ultimo_Reajuste
    : String(c.Data_Inicio_Contrato || '').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(base)) return '';
  const d = new Date(base + 'T00:00');
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0,10);
}
/* Contratos ATIVOS cujo reajuste anual já venceu (precisam de reajuste hoje). */
function contratosParaReajuste(){
  const hoje = new Date().toISOString().slice(0,10);
  return STATE.contratos.filter(c => {
    if(c.Status_Contrato !== 'ATIVO') return false;
    if(String(c.ATIVO || 'SIM').toUpperCase() === 'NAO') return false;
    const p = proximoReajuste(c);
    return p && p <= hoje;
  });
}

