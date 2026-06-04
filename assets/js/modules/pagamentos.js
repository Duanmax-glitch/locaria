/* ============================================================
   LOCARIA - modules/pagamentos.js
   Pagamentos e historico: extrato, modal de pagamento, efetivacao.
   ============================================================ */
function verExtratoPagamento(idCobranca){
  const c = STATE.cobrancas.find(x => String(x.ID_Cobranca) === String(idCobranca));
  if(!c) return;
  const valorCobrado = +c.Valor_Cobrado || 0;
  const valorPago    = +c.Valor_Pago || 0;
  const desconto     = Math.max(0, valorCobrado - valorPago);
  const fmt = v => v ? fmtBRL2(v) : '—';
  const fmtDate = d => d ? new Date(d+'T00:00').toLocaleDateString('pt-BR') : '—';

  const linha = (label, valor, destaque) =>
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--line-soft)">
       <span style="font-size:13px;color:var(--txt-dim)">${label}</span>
       <span style="font-size:13px;font-weight:600;color:${destaque||'var(--txt)'}">${valor}</span>
     </div>`;

  const body = `
    <div style="margin-bottom:6px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <div class="av" style="background:${avColor(c.ID_Imovel)};width:40px;height:40px;font-size:15px">${initials(c.Nome_Imovel)}</div>
        <div>
          <div style="font-weight:600;font-size:15px">${esc(c.Nome_Imovel)}</div>
          <div style="font-size:12px;color:var(--txt-dim)">${esc(c.Responsavel_Pagamento||'—')}</div>
        </div>
        <div style="margin-left:auto">${tipoBadge(c.Tipo_Cobranca)}</div>
      </div>
      ${linha('Competência', monthLabel(c.Competencia))}
      ${linha('Vencimento', fmtDate(c.Data_Vencimento))}
      ${linha('Valor cobrado', fmt(valorCobrado), 'var(--txt)')}
      ${linha('Valor pago', fmt(valorPago || valorCobrado), 'var(--emerald)')}
      ${desconto > 0.009 ? linha('Desconto', '− '+fmt(desconto), 'var(--rose)') : ''}
      ${linha('Data do pagamento', fmtDate(c.Data_Pagamento))}
      ${linha('Forma de pagamento', esc(c.Forma_Pagamento||'—'))}
      ${linha('Quem pagou', esc(c.Quem_Pagou||c.Responsavel_Pagamento||'—'))}
      ${linha('Recebido por', esc(c.Recebido_Por||'—'))}
      ${c.Observacao_Pagamento ? linha('Observação', esc(c.Observacao_Pagamento)) : ''}
      ${linha('ID', esc(c.ID_Cobranca), 'var(--txt-mute)')}
    </div>`;

  showModal('Extrato do Pagamento', body,
    `<button class="btn ghost" onclick="closeModal()">Fechar</button>
     <button class="btn ghost" onclick="gerarComprovantePDF('${c.ID_Cobranca}')" title="Abrir comprovante — use o botão de compartilhar do browser para enviar" style="color:#e0a23c;border-color:#e0a23c">
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" style="margin-right:4px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
       Comprovante PDF
     </button>
     <button class="btn primary" onclick="closeModal();openForm('cobrancas','${c.ID_Cobranca}')">Editar</button>`);
}

function renderHistorico(){
  // Aplica filtro de período sobre Data_Pagamento
  let rows = STATE.cobrancas.filter(c=>c.Status_Cobranca==='PAGO').slice();

  if(filtroHist.modo === 'ATUAL'){
    // Mês atual com base em Data_Pagamento
    const comp = todayComp();
    rows = rows.filter(c => (c.Data_Pagamento || '').slice(0,7) === comp);
  }else if(filtroHist.modo === 'PERIODO'){
    const dtIni = filtroHist.inicio;
    const dtFim = filtroHist.fim;
    rows = rows.filter(c => {
      const dp = c.Data_Pagamento || '';
      if(!dp) return false;
      if(dtIni && dp < dtIni) return false;
      if(dtFim && dp > dtFim) return false;
      return true;
    });
  }
  // 'TODOS' não filtra por data

  rows = rows.sort((a,b)=> new Date(b.Data_Pagamento||b.Data_Vencimento)-new Date(a.Data_Pagamento||a.Data_Vencimento));

  const q = filtroHist.q;
  if(q) rows = rows.filter(c=>(c.Nome_Imovel+' '+c.Responsavel_Pagamento+' '+(c.Quem_Pagou||'')).toLowerCase().includes(q.toLowerCase()));

  const totalPago = rows.reduce((s,c)=> s + (+c.Valor_Pago || +c.Valor_Cobrado || 0), 0);

  const body = rows.length ? rows.map(c=>{
    const valorPago = +c.Valor_Pago || +c.Valor_Cobrado || 0;
    const valorCobrado = +c.Valor_Cobrado || 0;
    const desconto = Math.max(0, valorCobrado - valorPago);
    const temDesconto = desconto > 0.009;
    const valorCell = temDesconto
      ? `<div class="money" style="color:var(--emerald)">${fmtBRL2(valorPago)}</div>
         <div style="font-size:11px;color:var(--rose);font-weight:600;margin-top:2px">desconto ${fmtBRL2(desconto)}</div>`
      : `<span class="money" style="color:var(--emerald)">${fmtBRL2(valorPago)}</span>`;
    return `
    <tr onclick="verExtratoPagamento('${c.ID_Cobranca}')" style="cursor:pointer" class="tr-clickable">
      <td><div class="row-flex"><div class="av" style="background:${avColor(c.ID_Imovel)}">${initials(c.Nome_Imovel)}</div>
        <div><div class="cell-strong">${esc(c.Nome_Imovel)}</div><div class="cell-sub">${esc(c.Responsavel_Pagamento)}</div></div></div></td>
      <td>${tipoBadge(c.Tipo_Cobranca)}</td>
      <td>${monthLabel(c.Competencia)}</td>
      <td>${new Date(c.Data_Vencimento+'T00:00').toLocaleDateString('pt-BR')}</td>
      <td>${c.Data_Pagamento ? new Date(c.Data_Pagamento+'T00:00').toLocaleDateString('pt-BR') : '—'}</td>
      <td class="money">${fmtBRL2(valorCobrado)}</td>
      <td>${valorCell}</td>
      <td onclick="event.stopPropagation()"><div class="act-group">
        <button class="act-btn" title="Ver extrato completo" onclick="verExtratoPagamento('${c.ID_Cobranca}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        <button class="act-btn" title="Editar pagamento" onclick="openForm('cobrancas','${c.ID_Cobranca}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="act-btn del" title="Excluir" onclick="askDelete('cobrancas','ID_Cobranca','${c.ID_Cobranca}','${escJs(c.Nome_Imovel)} · ${escJs(c.Tipo_Cobranca)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div></td>
    </tr>`}).join('') : emptyRow(8, 'Nenhum pagamento no período selecionado');

  // Se a estrutura já existe e o filtro de modo NÃO mudou estrutura, atualiza apenas o tbody (preserva foco)
  // O filtro 'modo' muda a estrutura (mostra/esconde inputs de data), então precisa re-render completo
  const existingTbody = document.querySelector('#view-historico tbody');
  const existingModo = document.querySelector('#view-historico [data-current-modo]');
  if(existingTbody && existingModo && existingModo.dataset.currentModo === filtroHist.modo){
    existingTbody.innerHTML = body;
    const totEl = document.querySelector('#view-historico .hist-total');
    if(totEl) totEl.textContent = fmtBRL2(totalPago);
    const countEl = document.querySelector('#view-historico .hist-count');
    if(countEl) countEl.textContent = `${rows.length} pagamentos registrados`;
    const aluguelEl = document.querySelector('#view-historico .hist-aluguel');
    if(aluguelEl) aluguelEl.textContent = fmtBRL2(rows.filter(c=>c.Tipo_Cobranca==='ALUGUEL').reduce((s,c)=>s+(+c.Valor_Pago||+c.Valor_Cobrado||0),0));
    const aluguelQtdEl = document.querySelector('#view-historico .hist-aluguel-qtd');
    if(aluguelQtdEl) aluguelQtdEl.textContent = `${rows.filter(c=>c.Tipo_Cobranca==='ALUGUEL').length} pagamentos`;
    const contasEl = document.querySelector('#view-historico .hist-contas');
    if(contasEl) contasEl.textContent = fmtBRL2(rows.filter(c=>c.Tipo_Cobranca!=='ALUGUEL').reduce((s,c)=>s+(+c.Valor_Pago||+c.Valor_Cobrado||0),0));
    const contasQtdEl = document.querySelector('#view-historico .hist-contas-qtd');
    if(contasQtdEl) contasQtdEl.textContent = `${rows.filter(c=>c.Tipo_Cobranca!=='ALUGUEL').length} pagamentos`;
    return;
  }

  // Filtro de Modo (igual dashboard)
  const filtroModoHtml = `
    <div class="panel" style="margin-bottom:18px">
      <div class="panel-body">
        <div class="dash-filter" data-current-modo="${filtroHist.modo}">
          <div class="field">
            <label>Modo</label>
            <select onchange="filtroHist.modo=this.value; renderHistorico()">
              <option value="TODOS" ${filtroHist.modo==='TODOS'?'selected':''}>Todos os Pagamentos</option>
              <option value="ATUAL" ${filtroHist.modo==='ATUAL'?'selected':''}>Mês Atual</option>
              <option value="PERIODO" ${filtroHist.modo==='PERIODO'?'selected':''}>Personalizado</option>
            </select>
          </div>
          ${filtroHist.modo === 'PERIODO' ? `
          <div class="field">
            <label>Data Inicial</label>
            <input type="date" value="${esc(filtroHist.inicio)}" onchange="filtroHist.inicio=this.value">
          </div>
          <div class="field">
            <label>Data Final</label>
            <input type="date" value="${esc(filtroHist.fim)}" onchange="filtroHist.fim=this.value">
          </div>
          <div class="field btn-wrap">
            <button class="btn primary" onclick="renderHistorico()">Aplicar</button>
          </div>` : ''}
        </div>
      </div>
    </div>`;

  $('#view-historico').innerHTML = `
    ${filtroModoHtml}
    <div class="kpi-grid g3">
      <div class="kpi">
        <div class="kpi-top"><div class="kpi-ico em"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div></div>
        <div class="kpi-label">Total Recebido</div>
        <div class="kpi-value hist-total">${fmtBRL2(totalPago)}</div>
        <div class="kpi-foot hist-count">${rows.length} pagamentos registrados</div>
      </div>
      <div class="kpi">
        <div class="kpi-top"><div class="kpi-ico am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div></div>
        <div class="kpi-label">Aluguéis</div>
        <div class="kpi-value hist-aluguel">${fmtBRL2(rows.filter(c=>c.Tipo_Cobranca==='ALUGUEL').reduce((s,c)=>s+(+c.Valor_Pago||+c.Valor_Cobrado||0),0))}</div>
        <div class="kpi-foot hist-aluguel-qtd">${rows.filter(c=>c.Tipo_Cobranca==='ALUGUEL').length} pagamentos</div>
      </div>
      <div class="kpi">
        <div class="kpi-top"><div class="kpi-ico bl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></div></div>
        <div class="kpi-label">Contas (Água/Luz/Outros)</div>
        <div class="kpi-value hist-contas">${fmtBRL2(rows.filter(c=>c.Tipo_Cobranca!=='ALUGUEL').reduce((s,c)=>s+(+c.Valor_Pago||+c.Valor_Cobrado||0),0))}</div>
        <div class="kpi-foot hist-contas-qtd">${rows.filter(c=>c.Tipo_Cobranca!=='ALUGUEL').length} pagamentos</div>
      </div>
    </div>
    <div class="table-tools">
      <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input id="histSearch" placeholder="Buscar por imóvel, inquilino ou quem pagou…" value="${esc(q)}" oninput="filtroHist.q=this.value;renderHistorico()"></div>
    </div>
    <div class="tbl-card"><div class="tbl-scroll"><table>
      <thead><tr><th>Imóvel / Inquilino</th><th>Tipo</th><th>Competência</th><th>Vencimento</th><th>Pagamento</th><th>Valor Cobrado</th><th>Valor Pago</th><th>Ações</th></tr></thead>
      <tbody>${body}</tbody></table></div></div>`;
}

function openPagamentoModal(idCobranca){
  const c = STATE.cobrancas.find(x => x.ID_Cobranca === idCobranca);
  if(!c){ toast('Cobrança não encontrada','err'); return; }

  const hoje = new Date().toISOString().slice(0,10);
  const valorTotal = +c.Valor_Cobrado || 0;
  const valorJaPago = c.Status_Cobranca === 'PARCIAL' ? (+c.Valor_Pago || 0) : 0;
  const valorRestante = Math.max(0, valorTotal - valorJaPago);
  const dataPagSugerida = c.Data_Pagamento || hoje;
  const isAgua    = c.Tipo_Cobranca === 'AGUA';
  const isLuz     = c.Tipo_Cobranca === 'LUZ';
  const isAluguel = c.Tipo_Cobranca === 'ALUGUEL';
  const formaSugerida  = c.Forma_Pagamento || (isAgua||isLuz ? 'BOLETO' : 'PIX');
  const quemPagouSug   = c.Quem_Pagou || c.Responsavel_Pagamento || '';
  const recebidoPorSug = c.Recebido_Por || (isAgua ? 'SABESP' : isLuz ? 'ENEL' : isAluguel ? nomeProprietario() : nomeProprietario());

  const infoPagAnterior = c.Status_Cobranca === 'PARCIAL' && valorJaPago > 0 ? `
    <div style="background:rgba(224,162,60,.08);border:1px solid rgba(224,162,60,.3);border-radius:8px;padding:10px 14px;margin-top:10px;font-size:13px;color:var(--amber)">
      Já pago anteriormente: <strong>${fmtBRL2(valorJaPago)}</strong> · Restante: <strong>${fmtBRL2(valorRestante)}</strong>
    </div>` : '';

  const body = `
    <div style="background:var(--bg-soft);border:1px solid var(--line-soft);border-radius:10px;padding:14px 16px;margin-bottom:16px">
      <div style="font-size:12px;color:var(--txt-mute);letter-spacing:.4px;text-transform:uppercase">Cobrança</div>
      <div style="font-family:var(--serif);font-size:18px;font-weight:600;margin-top:4px">${esc(c.Nome_Imovel)} · ${tipoBadge(c.Tipo_Cobranca)}</div>
      <div style="font-size:13px;color:var(--txt-dim);margin-top:4px">${esc(c.Responsavel_Pagamento)} · Vencimento ${new Date(c.Data_Vencimento+'T00:00').toLocaleDateString('pt-BR')}</div>
      <div style="font-family:var(--serif);font-size:24px;font-weight:600;color:var(--amber);margin-top:8px">${fmtBRL2(valorTotal)}</div>
      ${infoPagAnterior}
    </div>
    <form id="payForm">
      <div class="form-grid">
        <div class="field">
          <label>Status *</label>
          <select name="Status_Cobranca" id="payStatus" onchange="onPayStatusChange(${valorRestante})">
            <option value="PAGO">Pago (Total)</option>
            <option value="PARCIAL" ${c.Status_Cobranca==='PARCIAL'?'selected':''}>Pago (Parcial)</option>
          </select>
        </div>
        <div class="field">
          <label>Valor Pago Agora (R$) *</label>
          <input type="number" name="Valor_Pago" id="payValor" step="0.01"
            value="${valorRestante}"
            oninput="onPayValorChange(${valorTotal},${valorJaPago})" required>
        </div>
        <div class="field">
          <label>Data do Pagamento *</label>
          <input type="date" name="Data_Pagamento" value="${dataPagSugerida}" required>
        </div>
        <div class="field">
          <label>Forma de Pagamento *</label>
          <select name="Forma_Pagamento">
            ${FORMAS_PAGAMENTO.map(f=>`<option value="${f}" ${formaSugerida===f?'selected':''}>${labelFormaPagamento(f)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Quem Pagou *</label>
          <input type="text" name="Quem_Pagou" value="${esc(quemPagouSug)}" placeholder="Nome de quem efetuou o pagamento" required>
        </div>
        <div class="field">
          <label>Recebido Por *</label>
          <input type="text" name="Recebido_Por" value="${esc(recebidoPorSug)}" placeholder="Nome de quem recebeu" required>
        </div>
        <div class="field full">
          <label>Observações</label>
          <textarea name="Observacao_Pagamento" placeholder="Ex.: comprovante anexo, desconto acordado, etc.">${esc(c.Observacao_Pagamento||'')}</textarea>
        </div>
      </div>
    </form>`;

  showModal('Registrar Pagamento', body,
    `<button class="btn ghost" onclick="closeModal()">Cancelar</button>
     <button class="btn primary" onclick="confirmarPagamento('${idCobranca}',${valorTotal},${valorJaPago})">Confirmar Pagamento</button>`);

  setTimeout(()=>onPayStatusChange(valorRestante), 0);
}

/* Status mudou: preenche valor automaticamente */
function onPayStatusChange(valorRestante){
  const statusEl = document.getElementById('payStatus');
  const valorEl = document.getElementById('payValor');
  if(!statusEl || !valorEl) return;
  if(statusEl.value === 'PAGO'){
    valorEl.value = valorRestante;
    valorEl.style.borderColor = '';
  }else{
    valorEl.value = '';
    valorEl.style.borderColor = 'var(--amber)';
    valorEl.focus();
  }
}

/* Feedback ao digitar o valor */
function onPayValorChange(valorTotal, valorJaPago){
  const valorEl = document.getElementById('payValor');
  const statusEl = document.getElementById('payStatus');
  if(!valorEl || !statusEl) return;
  const valorAgora = parseFloat(valorEl.value) || 0;
  const acumulado = valorJaPago + valorAgora;
  if(statusEl.value === 'PARCIAL'){
    if(acumulado >= valorTotal && valorTotal > 0){
      statusEl.value = 'PAGO';
      valorEl.style.borderColor = 'var(--emerald)';
    }else{
      valorEl.style.borderColor = 'var(--amber)';
    }
  }
}

async function confirmarPagamento(idCobranca, valorTotal, valorJaPago){
  const c = STATE.cobrancas.find(x => x.ID_Cobranca === idCobranca);
  if(!c){ toast('Cobrança não encontrada','err'); return; }
  const form = document.getElementById('payForm');
  if(!form) return;

  const statusSelecionado = form.elements['Status_Cobranca'].value;
  const valorPagoAgora = parseFloat(form.elements['Valor_Pago'].value) || 0;
  const dataPagamento = form.elements['Data_Pagamento'].value;
  const forma = form.elements['Forma_Pagamento'].value;
  const quemPagou = form.elements['Quem_Pagou'].value.trim();
  const recebidoPor = form.elements['Recebido_Por'].value.trim();
  const obs = form.elements['Observacao_Pagamento'].value.trim();

  if(!quemPagou){ toast('Informe quem efetuou o pagamento','err'); return; }
  if(!recebidoPor){ toast('Informe quem recebeu o pagamento','err'); return; }
  if(!dataPagamento){ toast('Informe a data do pagamento','err'); return; }
  if(valorPagoAgora <= 0){ toast('Valor pago deve ser maior que zero','err'); return; }

  const valorAcumulado = valorJaPago + valorPagoAgora;
  const diff = valorTotal - valorAcumulado;
  const isDivergente = statusSelecionado === 'PAGO' && diff > 0.009;

  if(isDivergente){
    // Armazena os dados do pagamento numa variável global temporária para evitar
    // problemas de escape no onclick (JSON.stringify gera aspas duplas que quebram HTML)
    window._pendingPayment = { idCobranca, valorAcumulado, statusFinal:'PAGO', dataPagamento, forma, quemPagou, recebidoPor, obs };

    showModal('Confirmar Desconto',
      `<div style="text-align:center;padding:10px 0">
        <div style="font-size:44px;margin-bottom:12px">⚠️</div>
        <p style="font-size:15px;line-height:1.6;color:var(--txt)">
          Você inseriu <strong>${fmtBRL2(valorAcumulado)}</strong> mas o valor total da cobrança é <strong>${fmtBRL2(valorTotal)}</strong>.
          O status está como <strong>Pago (Total)</strong>.
        </p>
        <div style="background:rgba(224,162,60,.1);border:1px solid rgba(224,162,60,.3);border-radius:10px;padding:14px;margin:16px 0;font-size:14px;color:var(--amber)">
          Confirma que a diferença de <strong>${fmtBRL2(diff)}</strong> será aplicada como <strong>desconto</strong> e a cobrança será considerada <strong>quitada</strong>?
        </div>
      </div>`,
      `<button class="btn ghost" onclick="closeModal();setTimeout(()=>openPagamentoModal('${idCobranca}'),80)">Voltar e Corrigir</button>
       <button class="btn" style="background:var(--amber);color:#000;font-weight:600" onclick="confirmarDescontoAprovado()">Sim, aplicar desconto e quitar</button>`);
    return;
  }

  let statusFinal = statusSelecionado === 'PARCIAL'
    ? (valorAcumulado >= valorTotal ? 'PAGO' : 'PARCIAL')
    : 'PAGO';

  await efetivarPagamento(idCobranca, valorAcumulado, statusFinal, dataPagamento, forma, quemPagou, recebidoPor, obs);
}

async function efetivarPagamento(idCobranca, valorAcumulado, statusFinal, dataPagamento, forma, quemPagou, recebidoPor, obs){
  const c = STATE.cobrancas.find(x => x.ID_Cobranca === idCobranca);
  if(!c){ toast('Cobrança não encontrada','err'); return; }
  // Livro-razão: registra ESTE pagamento como um lançamento imutável (data + valor próprios),
  // em vez de sobrescrever. Permite conciliar com o extrato bancário linha a linha.
  const jaPago = +c.Valor_Pago || 0;
  let histPag = [];
  try { histPag = JSON.parse(c.Historico_Pagamentos || '[]'); if(!Array.isArray(histPag)) histPag = []; } catch(_){ histPag = []; }
  // Backfill: se já havia valor pago que NÃO está no histórico (pagamento feito antes do
  // livro-razão existir), registra esse valor com a última data de pagamento conhecida.
  const somaHist = histPag.reduce((s,p)=> s + (+p.valor||0), 0);
  if(jaPago - somaHist > 0.009){
    histPag.push({ data: c.Data_Pagamento || dataPagamento, valor: +(jaPago - somaHist).toFixed(2), forma: c.Forma_Pagamento || forma, quem: c.Quem_Pagou || quemPagou, por: c.Recebido_Por || recebidoPor });
  }
  // Lançamento deste pagamento (incremento sobre o que já estava pago)
  const incremento = Math.max(0, valorAcumulado - jaPago);
  if(incremento > 0.009){
    histPag.push({ data: dataPagamento, valor: +incremento.toFixed(2), forma: forma, quem: quemPagou, por: recebidoPor });
  }
  c.Historico_Pagamentos = JSON.stringify(histPag);

  c.Status_Cobranca = statusFinal;
  c.Valor_Pago = valorAcumulado;          // soma acumulada (compatibilidade/exibição)
  c.Data_Pagamento = dataPagamento;       // data do último pagamento (compatibilidade/exibição)
  c.Forma_Pagamento = forma;
  c.Quem_Pagou = quemPagou;
  c.Recebido_Por = recebidoPor;
  c.Observacao_Pagamento = obs;
  try{
    await saveRecord('cobrancas','ID_Cobranca', c, false);
    closeModal();
    if(statusFinal === 'PAGO'){
      const desconto = Math.max(0,(+c.Valor_Cobrado||0)-valorAcumulado);
      toast(desconto > 0.009 ? `Quitado com desconto de ${fmtBRL2(desconto)}` : 'Pagamento confirmado · Movido para o Histórico');
    }else{
      toast(`Parcial registrado · Restante: ${fmtBRL2(Math.max(0,(+c.Valor_Cobrado||0)-valorAcumulado))}`);
    }
    renderView(currentView);
  }catch(e){ toast('Erro: '+e.message,'err'); }
}

/* Chamado pelo botão de confirmação do popup de desconto.
   Usa window._pendingPayment para evitar problemas de escape em onclick. */
async function confirmarDescontoAprovado(){
  const p = window._pendingPayment;
  if(!p){ toast('Dados do pagamento não encontrados','err'); return; }
  window._pendingPayment = null;
  await efetivarPagamento(p.idCobranca, p.valorAcumulado, p.statusFinal, p.dataPagamento, p.forma, p.quemPagou, p.recebidoPor, p.obs);
}


async function escolherTipoPagamento(tipo){
  closeModal();
  const rec  = window._pendingSubmitRec;
  const data = window._pendingSubmitData;
  if(!rec || !data) return;
  window._pendingSubmitRec  = null;
  window._pendingSubmitData = null;

  rec.Status_Cobranca = tipo;

  try {
    await saveRecord(data.sheet, FORMS[data.sheet].key, rec, data.isNew);
    // saveRecord já chama loadData().then(renderView)
    toast(data.isNew ? 'Registro criado' : 'Registro atualizado');
  } catch(e){
    toast('Erro: '+e.message,'err');
  }
}
