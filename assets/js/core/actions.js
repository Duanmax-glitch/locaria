/* ============================================================
   LOCARIA - core/actions.js
   Delegação de eventos — substitui os handlers inline (onclick / oninput /
   onchange / onkeydown / onfocus) por atributos data-* declarativos.

   POR QUÊ: uma Content-Security-Policy rígida (sem 'unsafe-inline') bloqueia
   QUALQUER atributo de evento inline no HTML. Não existe nonce/hash que salve
   um onclick="". A única saída é não ter handler inline algum: o HTML gerado
   passa a declarar a ação em data-* e um conjunto único de listeners delegados
   no document resolve a ação no momento do evento.

   PADRÃO DE USO no HTML gerado:
     click   → data-action="nome"            [+ data-* com parâmetros]
     input   → data-on-input="nome"
     change  → data-on-change="nome"
     keydown → data-on-keydown="nome"
     focus   → data-on-focus="nome"   (via focusin, que borbulha)

   Cada ação é uma função (el, ev) registrada em ACTIONS. Os parâmetros viajam
   em atributos data-* — sempre escapados com esc() na geração (contexto de
   atributo HTML). esc()/escJs() permanecem intactos em core/security.js.

   Este arquivo carrega cedo (logo após security.js). As funções de ação
   referenciam globais (closeModal, openForm, filters, …) por nome: elas só são
   resolvidas no momento do clique, quando todos os scripts já carregaram.
   ============================================================ */
(function(){
  const ACTIONS = {};
  window.ACTIONS = ACTIONS;
  window.registerActions = function(map){ Object.assign(ACTIONS, map); };

  function dispatch(attr, el, ev){
    const name = el.getAttribute(attr);
    const fn = ACTIONS[name];
    if(typeof fn === 'function'){ fn(el, ev); }
    else { console.warn('[actions] ação não registrada:', name); }
  }

  // Um listener delegado por tipo de evento. focus não borbulha → usa focusin.
  const bind = (evt, attr) =>
    document.addEventListener(evt, e => {
      const el = e.target.closest && e.target.closest('[' + attr + ']');
      if(el) dispatch(attr, el, e);
    });

  bind('click',   'data-action');
  bind('input',   'data-on-input');
  bind('change',  'data-on-change');
  bind('keydown', 'data-on-keydown');
  bind('focusin', 'data-on-focus');

  // Converte string de data-* em número (undefined se vazio).
  const num = v => (v === '' || v == null) ? undefined : Number(v);

  registerActions({
    /* ---------- genéricos / CRUD ---------- */
    'close-modal':    () => closeModal(),
    'navigate':       el => navigate(el.dataset.view),
    'refresh':        () => refresh(),
    'logout':         () => logoutGoogle(),
    'toggle-sidebar': () => toggleSidebar(),
    'fab':            () => fabAction(),
    'noop':           () => {},

    'form-open':      el => openForm(el.dataset.sheet, el.dataset.id || undefined),
    'delete':         el => askDelete(el.dataset.sheet, el.dataset.key, el.dataset.id, el.dataset.name),
    'do-delete':      el => doDelete(el.dataset.sheet, el.dataset.key, el.dataset.id),
    'submit-form':    el => submitForm(el.dataset.sheet, el.dataset.id || ''),
    'switch-tab':     el => switchTab(num(el.dataset.tab)),
    'cancel-pending': () => { closeModal(); window._pendingSubmitRec = null; },
    'escolher-pagamento': el => escolherTipoPagamento(el.dataset.tipo),

    /* ---------- filtros (objeto global `filters`) ---------- */
    'filter-search': el => { filters[el.dataset.sheet].q = el.value; window['render' + cap(el.dataset.sheet)](); },
    'filter-status': el => { filters[el.dataset.sheet].st = el.dataset.st; window['render' + cap(el.dataset.sheet)](); },
    'filter-field':  el => { filters[el.dataset.sheet][el.dataset.field] = el.value; window['render' + cap(el.dataset.sheet)](); },

    /* ---------- busca global ---------- */
    'gsr-open':     () => gsrOpen(),
    'gsr-close':    () => gsrClose(),
    'gsr-overlay':  (el, e) => gsrOverlayClick(e),
    'gsr-search':   el => gsrSearch(el.value),
    'gsr-keynav':   (el, e) => gsrKeyNav(e),
    'gsr-activate': el => gsrActivate(num(el.dataset.idx)),
    'reaj-toggle':  (el, e) => toggleReajusteDropdown(e),

    /* ---------- views de detalhe ---------- */
    'view-contrato':  el => viewContrato(el.dataset.id),
    'view-inquilino': el => viewInquilino(el.dataset.id),
    'view-imovel':    el => viewImovel(el.dataset.id),
    'view-vistoria':  el => viewVistoria(el.dataset.id),

    /* ---------- contratos ---------- */
    'contrato-pdf':       el => verContratoPdf(el.dataset.id),
    'contrato-doc':       el => criarDocContratoUI(el.dataset.id),
    'comprovante-caucao': el => gerarComprovanteCaucao(el.dataset.id),
    'reajustar':          el => reajustarAluguelUI(el.dataset.id),
    'ignorar-reajuste':   el => ignorarReajusteUI(el.dataset.id),
    'reaj-preview':       () => reajPreview(),
    'confirmar-reajuste': el => confirmarReajuste(el.dataset.id),
    'goto-vistoria':      el => { closeModal(); navigate('vistorias'); viewVistoria(el.dataset.id); },
    'goto-contrato':      el => { closeModal(); navigate('contratos'); viewContrato(el.dataset.id); },

    /* ---------- cobranças / pagamentos ---------- */
    'open-pay':            el => openPagamentoModal(el.dataset.id),
    'ver-extrato':         el => verExtratoPagamento(el.dataset.id),
    'comprovante-pdf':     el => gerarComprovantePDF(el.dataset.id),
    'close-form-open':     el => { closeModal(); openForm(el.dataset.sheet, el.dataset.id || undefined); },
    'close-open-pay':      el => { closeModal(); setTimeout(() => openPagamentoModal(el.dataset.id), 80); },
    'pay-status-change':   el => onPayStatusChange(num(el.dataset.restante)),
    'pay-valor-change':    el => onPayValorChange(num(el.dataset.total), num(el.dataset.pago)),
    'confirmar-pagamento': el => confirmarPagamento(el.dataset.id, num(el.dataset.total), num(el.dataset.pago)),
    'confirmar-desconto':  () => confirmarDescontoAprovado(),

    /* ---------- histórico de pagamentos (filtroHist) ---------- */
    'hist-field':       el => { filtroHist[el.dataset.field] = el.value; if(el.dataset.render) renderHistorico(); },
    'render-historico': () => renderHistorico(),

    /* ---------- dashboard (dashFilter) ---------- */
    'dash-open-pay':    el => dashboardOpenPay(el.dataset.id),
    'dash-field':       el => { dashFilter[el.dataset.field] = el.value; if(el.dataset.render) renderDashboard(); },
    'render-dashboard': () => renderDashboard(),

    /* ---------- manutenções (filtroManut) ---------- */
    'manut-search': el => { filtroManut.q = el.value; renderManutencoes(); },
    'manut-status': el => { filtroManut.st = el.dataset.st; renderManutencoes(); },

    /* ---------- agenda ---------- */
    'agenda-day':   el => agendaOpenDay(el.dataset.date),
    'agenda-nav':   el => agendaNav(num(el.dataset.delta)),
    'agenda-today': () => agendaGoToday(),

    /* ---------- configurações ---------- */
    'connect-now': () => connectNow(),

    /* ---------- relatórios ---------- */
    'rel-imovel':          () => abrirRelatorioImovel(),
    'rel-inquilino':       () => abrirRelatorioInquilino(),
    'rel-inadimplencia':   () => abrirRelatorioInadimplencia(),
    'gerar-rel-imovel':    () => gerarRelatorioImovel(),
    'gerar-rel-inquilino': () => gerarRelatorioInquilino(),
    'gerar-extrato-imovel':() => gerarExtratoImovelPDF(),
    'gerar-prestacao':     () => gerarPrestacaoContasPDF(),
    'gerar-inadimplencia': () => gerarInadimplenciaPDF(),
    'atualizar-tipos':     el => atualizarTiposExtrato(el.value),
    'rep-busca':           el => repInqBuscar(el.value),
    'rep-selecionar':      el => repInqSelecionar(el.dataset.id),

    /* ---------- vistorias ---------- */
    'comprovante-vistoria': el => gerarComprovanteVistoria(el.dataset.id),
  });
})();
