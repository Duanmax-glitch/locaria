/* ============================================================
   LOCARIA - components/sidebar.js
   Menu lateral, navegacao, top actions, FAB e dispatcher renderView.
   ============================================================ */
const PAGES = {
  dashboard:{title:'Visão Geral',sub:'Resumo gerencial da sua carteira de locação'},
  cobrancas:{title:'Cobranças',sub:'Acompanhe recebimentos e inadimplência'},
  historico:{title:'Histórico de Pagamentos',sub:'Todas as cobranças já pagas'},
  agenda:{title:'Agenda',sub:'Previsão de recebimentos e pagamentos por dia'},
  manutencoes:{title:'Manutenções',sub:'Controle de reparos e manutenções dos imóveis'},
  inquilinos:{title:'Inquilinos',sub:'Cadastro de locatários'},
  contratos:{title:'Contratos',sub:'Gestão de contratos de locação'},
  vistorias:{title:'Vistorias',sub:'Vistorias de entrada, saída e rotina'},
  imoveis:{title:'Imóveis',sub:'Sua carteira de propriedades'},
  relatorios:{title:'Relatórios',sub:'Extratos, prestações de contas e análises'},
  regras:{title:'Regras de Cobrança',sub:'Automação de geração de cobranças'},
  proprietario:{title:'Proprietário',sub:'Dados do proprietário — usados em recibos e contratos'},
};
let currentView='dashboard';

function navigate(v){
  currentView=v;
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===v));
  document.querySelectorAll('.view').forEach(s=>s.classList.toggle('active',s.id==='view-'+v));
  $('#pgTitle').textContent=PAGES[v].title;
  $('#pgSub').textContent=PAGES[v].sub;
  renderTopActions(v);
  renderView(v);
  if(window.innerWidth<=760) closeSidebar();
  updateFab(v);
}
function renderTopActions(v){
  const a=$('#topActions');
  const sync=`<button class="btn ghost" data-action="refresh"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg><span>Atualizar</span></button>`;
  const map={
    dashboard: '',
    cobrancas:`<button class="btn primary" data-action="form-open" data-sheet="cobrancas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span>Nova Cobrança</span></button>`,
    inquilinos:`<button class="btn primary" data-action="form-open" data-sheet="inquilinos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span>Novo Inquilino</span></button>`,
    contratos:`<button class="btn primary" data-action="form-open" data-sheet="contratos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span>Novo Contrato</span></button>`,
    vistorias:`<button class="btn primary" data-action="form-open" data-sheet="vistorias"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span>Nova Vistoria</span></button>`,
    imoveis:`<button class="btn primary" data-action="form-open" data-sheet="imoveis"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span>Novo Imóvel</span></button>`,
    manutencoes:`<button class="btn primary" data-action="form-open" data-sheet="manutencoes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span>Nova Manutenção</span></button>`,
    regras:`<button class="btn primary" data-action="form-open" data-sheet="regras"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span>Nova Regra</span></button>`,
    proprietario:'',
  };
  a.innerHTML = sync + (map[v]||'');
}
async function refresh(){ await loadData(); renderView(currentView); toast('Dados atualizados'); }

/* ── removido: testeGerarProximoMes ── */
/* ── Scroll shadow nas tabelas: remove seta quando chegou no fim ── */
function initTableScrollShadows(){
  document.querySelectorAll('.tbl-scroll').forEach(el => {
    const card = el.closest('.tbl-card');
    if(!card) return;
    const check = () => card.classList.toggle('scroll-end', el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    el.addEventListener('scroll', check, {passive:true});
    check();
  });
}

/* ── FAB: mostra/oculta e define ação conforme a view ── */
const FAB_VIEWS = {
  cobrancas:  () => openForm('cobrancas'),
  inquilinos: () => openForm('inquilinos'),
  contratos:  () => openForm('contratos'),
  vistorias:  () => openForm('vistorias'),
  imoveis:    () => openForm('imoveis'),
  manutencoes:() => openForm('manutencoes'),
  regras:     () => openForm('regras'),
};
function updateFab(v){
  const fab = document.getElementById('fabBtn');
  if(!fab) return;
  if(FAB_VIEWS[v]){ fab.classList.add('visible'); }
  else             { fab.classList.remove('visible'); }
}
function fabAction(){
  if(FAB_VIEWS[currentView]) FAB_VIEWS[currentView]();
}
function toggleSidebar(){ const s=$('#sidebar');s.classList.toggle('open');$('#scrim').classList.toggle('show',s.classList.contains('open')); }
function closeSidebar(){ $('#sidebar').classList.remove('open');$('#scrim').classList.remove('show'); }
function renderView(v){
  if(v==='dashboard')renderDashboard();
  else if(v==='cobrancas')renderCobrancas();
  else if(v==='historico')renderHistorico();
  else if(v==='agenda')renderAgenda();
  else if(v==='inquilinos')renderInquilinos();
  else if(v==='contratos')renderContratos();
  else if(v==='vistorias')renderVistorias();
  else if(v==='imoveis')renderImoveis();
  else if(v==='manutencoes')renderManutencoes();
  else if(v==='relatorios')renderRelatorios();
  else if(v==='regras')renderRegras();
  else if(v==='proprietario')renderProprietario();
  // Ativa shadow de scroll nas tabelas recém-renderizadas
  requestAnimationFrame(initTableScrollShadows);
}

