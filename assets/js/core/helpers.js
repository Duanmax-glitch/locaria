/* ============================================================
   LOCARIA - core/helpers.js
   Formatadores, selecao DOM, badges e helpers de relacionamento compartilhados.
   ============================================================ */
const $ = s => document.querySelector(s);
const fmtBRL = v => 'R$ ' + (Number(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0});
const fmtBRL2 = v => (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

/* ===== Máscara/parse de moeda (centavos) — pt-BR, imune ao teclado =====
   O usuário digita SÓ números; a máscara insere os separadores em tempo real
   (12345 → 123,45 ; 115000 → 1.150,00). Como qualquer não-dígito é ignorado,
   funciona igual em Desktop/Android/iOS, mesmo com vírgula no teclado pt-BR. */
function isMoneyField(f){ return !!f && f.t === 'number' && /(Valor|Custo)/.test(f.k); }

/* Número (em reais) → string para o input mascarado: 1150 → "1.150,00". */
function moneyMaskValue(v){
  if(v === '' || v == null) return '';
  const n = Number(v);
  if(!isFinite(n)) return '';
  return (Math.round(n*100)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}

/* String mascarada/BR → número em reais (os 2 últimos dígitos são centavos).
   "1.150,00"→1150 · "81,24"→81.24 · "0,00"→0 · ""→"" (campo vazio). */
function parseMoneyBR(v){
  if(typeof v === 'number') return v;
  const digits = String(v == null ? '' : v).replace(/\D/g,'');
  if(digits === '') return '';
  return Number(digits) / 100;
}

/* Máscara ao vivo de um <input> (chamada a cada digitação/colagem). */
function applyMoneyMask(input){
  let digits = String(input.value).replace(/\D/g,'').replace(/^0+/,'');
  if(digits === ''){ input.value = ''; return; }
  while(digits.length < 3) digits = '0' + digits;       // mínimo 0,0X
  const dec   = digits.slice(-2);
  const reais = digits.slice(0,-2).replace(/\B(?=(\d{3})+(?!\d))/g,'.');  // separador de milhar
  input.value = reais + ',' + dec;
  try { input.setSelectionRange(input.value.length, input.value.length); } catch(e){}
}
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

/* Aniversário do contrato (para reajuste): a próxima recorrência anual da data-base
   — último reajuste, ou início se nunca reajustado — que seja >= hoje.
   Sempre aponta para o PRÓXIMO aniversário futuro. Retorna 'AAAA-MM-DD' ou ''. */
function aniversarioReajuste(c){
  const base = (c.Data_Ultimo_Reajuste && /^\d{4}-\d{2}-\d{2}$/.test(c.Data_Ultimo_Reajuste))
    ? c.Data_Ultimo_Reajuste
    : String(c.Data_Inicio_Contrato || '').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(base)) return '';
  const hoje = new Date(new Date().toISOString().slice(0,10) + 'T00:00');
  const d = new Date(base + 'T00:00');
  d.setFullYear(d.getFullYear() + 1);                  // 1º aniversário após a base
  while(d < hoje) d.setFullYear(d.getFullYear() + 1);  // rola até o próximo futuro
  return d.toISOString().slice(0,10);
}
/* Prazo limite para COMUNICAR o reajuste: 1 mês antes do aniversário. */
function prazoComunicarReajuste(c){
  const aniv = aniversarioReajuste(c);
  if(!aniv) return '';
  const d = new Date(aniv + 'T00:00');
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0,10);
}
/* Contratos ATIVOS cujo aniversário de reajuste está a até 60 dias (≈2 meses),
   ainda não reajustados neste ciclo e não dispensados (ignorados) pelo usuário.
   A antecedência de 60 dias garante o aviso ANTES do prazo de comunicação. */
function contratosReajusteProximos(){
  const hoje = new Date(new Date().toISOString().slice(0,10) + 'T00:00');
  const LIMITE_MS = 60 * 24 * 3600 * 1000;
  return STATE.contratos.filter(c => {
    if(c.Status_Contrato !== 'ATIVO') return false;
    if(String(c.ATIVO || 'SIM').toUpperCase() === 'NAO') return false;
    const aniv = aniversarioReajuste(c);
    if(!aniv) return false;
    // Ignorado para este ciclo (mesmo aniversário)?
    if(c.Reajuste_Dispensado_Ate && String(c.Reajuste_Dispensado_Ate).slice(0,10) === aniv) return false;
    const falta = new Date(aniv + 'T00:00') - hoje;
    return falta <= LIMITE_MS;   // dentro da janela de antecedência
  });
}

