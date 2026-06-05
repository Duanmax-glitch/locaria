/* ============================================================
   LOCARIA - modules/agenda.js
   Agenda: calendario de recebimentos/pagamentos.
   ============================================================ */
function renderAgenda(){
  const { year, month } = agendaState;
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);

  // Primeiro e último dia do mês
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month+1, 0);
  const daysInMonth = lastDay.getDate();
  // Dia da semana do dia 1 (0=Dom, ajustamos para seg=0)
  const startDow = (firstDay.getDay() + 6) % 7; // segunda-feira como início

  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const dayNames = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

  // Cobranças do mês
  const ym = `${year}-${String(month+1).padStart(2,'0')}`;
  const cobMes = STATE.cobrancas.filter(c => c.Data_Vencimento && c.Data_Vencimento.slice(0,7) === ym);

  // Agrupa cobranças por dia de vencimento
  const cobByDay = {};
  cobMes.forEach(c => {
    const day = parseInt(c.Data_Vencimento.slice(8,10));
    if(!cobByDay[day]) cobByDay[day] = [];
    cobByDay[day].push(c);
  });

  // Gera células do calendário (incluindo dias do mês anterior e seguinte para completar a grade)
  let cells = [];
  // Dias do mês anterior
  const prevMonthLast = new Date(year, month, 0).getDate();
  for(let i = startDow - 1; i >= 0; i--){
    cells.push({ day: prevMonthLast - i, otherMonth: true, cobrancas: [] });
  }
  // Dias do mês atual
  for(let d = 1; d <= daysInMonth; d++){
    cells.push({ day: d, otherMonth: false, cobrancas: cobByDay[d] || [] });
  }
  // Preenche até completar a última semana
  let nextDay = 1;
  while(cells.length % 7 !== 0){
    cells.push({ day: nextDay++, otherMonth: true, cobrancas: [] });
  }

  const dayNamesHtml = dayNames.map(d=>`<div class="agenda-dayname">${d}</div>`).join('');

  const cellsHtml = cells.map(cell => {
    const dateStr = !cell.otherMonth ? `${year}-${String(month+1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}` : '';
    const isToday = dateStr === todayStr;
    const hasEvents = cell.cobrancas.length > 0;

    // Classifica cobranças para pílulas visuais
    const pagas = cell.cobrancas.filter(c=>c.Status_Cobranca==='PAGO');
    const pendentes = cell.cobrancas.filter(c=>c.Status_Cobranca==='PENDENTE');
    const atrasadas = cell.cobrancas.filter(c=>c.Status_Cobranca==='ATRASADO');
    const parciais = cell.cobrancas.filter(c=>c.Status_Cobranca==='PARCIAL');

    let pills = '';
    if(pagas.length) pills += `<div class="agenda-pill ap-pago">${pagas.length} pago${pagas.length>1?'s':''}</div>`;
    if(pendentes.length) pills += `<div class="agenda-pill ap-pendente">${pendentes.length} pendente${pendentes.length>1?'s':''}</div>`;
    if(atrasadas.length) pills += `<div class="agenda-pill ap-atrasado">${atrasadas.length} atrasada${atrasadas.length>1?'s':''}</div>`;
    if(parciais.length) pills += `<div class="agenda-pill ap-parcial">${parciais.length} parcial${parciais.length>1?'is':''}</div>`;

    const cls = [
      'agenda-day',
      cell.otherMonth ? 'other-month' : '',
      isToday ? 'today' : '',
      hasEvents && !cell.otherMonth ? 'has-events' : '',
    ].filter(Boolean).join(' ');

    const dayAttr = hasEvents && !cell.otherMonth ? `data-action="agenda-day" data-date="${esc(dateStr)}"` : '';

    return `<div class="${cls}" ${dayAttr}>
      <div class="day-num">${cell.day}</div>
      ${!cell.otherMonth && pills ? `<div class="agenda-pills">${pills}</div>` : ''}
    </div>`;
  }).join('');

  // Sumário do mês
  const totPrevisto = cobMes.reduce((s,c)=>s+(+c.Valor_Cobrado||0),0);
  const totPago = cobMes.filter(c=>c.Status_Cobranca==='PAGO').reduce((s,c)=>s+(+c.Valor_Pago||+c.Valor_Cobrado||0),0);
  const totPendente = cobMes.filter(c=>c.Status_Cobranca==='PENDENTE' && c.Data_Vencimento >= todayStr).reduce((s,c)=>s+(+c.Valor_Cobrado||0),0);
  const totAtrasado = cobMes.filter(c=>c.Status_Cobranca==='ATRASADO').reduce((s,c)=>s+(+c.Valor_Cobrado||0),0);

  $('#view-agenda').innerHTML = `
    <div class="kpi-grid g4" data-style="margin-bottom:18px">
      <div class="kpi">
        <div class="kpi-top"><div class="kpi-ico am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div></div>
        <div class="kpi-label">Previsto no mês</div>
        <div class="kpi-value">${fmtBRL2(totPrevisto)}</div>
        <div class="kpi-foot">${cobMes.length} cobranças</div>
      </div>
      <div class="kpi">
        <div class="kpi-top"><div class="kpi-ico em"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div></div>
        <div class="kpi-label">Recebido</div>
        <div class="kpi-value">${fmtBRL2(totPago)}</div>
        <div class="kpi-foot">${cobMes.filter(c=>c.Status_Cobranca==='PAGO').length} pagos</div>
      </div>
      <div class="kpi">
        <div class="kpi-top"><div class="kpi-ico bl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg></div></div>
        <div class="kpi-label">A vencer</div>
        <div class="kpi-value">${fmtBRL2(totPendente)}</div>
        <div class="kpi-foot">${cobMes.filter(c=>c.Status_Cobranca==='PENDENTE'&&c.Data_Vencimento>=todayStr).length} pendentes</div>
      </div>
      <div class="kpi">
        <div class="kpi-top"><div class="kpi-ico ro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg></div></div>
        <div class="kpi-label">Em Atraso</div>
        <div class="kpi-value">${fmtBRL2(totAtrasado)}</div>
        <div class="kpi-foot">${cobMes.filter(c=>c.Status_Cobranca==='ATRASADO').length} atrasadas</div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-body">
        <div class="agenda-header">
          <h2>${monthNames[month]} ${year}</h2>
          <div class="agenda-nav">
            <button data-action="agenda-nav" data-delta="-1" title="Mês anterior">‹</button>
            <button data-action="agenda-today" data-style="font-size:12px;padding:7px 14px">Hoje</button>
            <button data-action="agenda-nav" data-delta="1" title="Próximo mês">›</button>
          </div>
        </div>
        <div class="agenda-grid">
          ${dayNamesHtml}
          ${cellsHtml}
        </div>
      </div>
    </div>`;
}

function agendaNav(delta){
  agendaState.month += delta;
  if(agendaState.month < 0){ agendaState.month = 11; agendaState.year--; }
  if(agendaState.month > 11){ agendaState.month = 0; agendaState.year++; }
  renderAgenda();
}

function agendaGoToday(){
  const t = new Date();
  agendaState.year = t.getFullYear();
  agendaState.month = t.getMonth();
  renderAgenda();
}

function agendaOpenDay(dateStr){
  const cobs = STATE.cobrancas.filter(c => c.Data_Vencimento === dateStr);
  if(!cobs.length) return;
  const d = new Date(dateStr+'T00:00');
  const dtFmt = d.toLocaleDateString('pt-BR', {weekday:'long',day:'numeric',month:'long',year:'numeric'});

  const statusOrder = {ATRASADO:0,PARCIAL:1,PENDENTE:2,PAGO:3};
  cobs.sort((a,b)=>(statusOrder[a.Status_Cobranca]??9)-(statusOrder[b.Status_Cobranca]??9));

  const total = cobs.reduce((s,c)=>s+(+c.Valor_Cobrado||0),0);
  const recebido = cobs.filter(c=>c.Status_Cobranca==='PAGO').reduce((s,c)=>s+(+c.Valor_Pago||+c.Valor_Cobrado||0),0);
  const pendente = cobs.filter(c=>c.Status_Cobranca!=='PAGO').reduce((s,c)=>s+(+c.Valor_Cobrado||0),0);

  // Cada cobrança como card expandido, sem tabela com scroll
  const cards = cobs.map(c => {
    const isPago = c.Status_Cobranca === 'PAGO';
    const isParcial = c.Status_Cobranca === 'PARCIAL';
    const valorTotal = +c.Valor_Cobrado || 0;
    const valorPagoC = +c.Valor_Pago || 0;
    const restante = Math.max(0, valorTotal - valorPagoC);

    const statusColor = {PAGO:'var(--emerald)',PENDENTE:'#7ba7f5',ATRASADO:'var(--rose)',PARCIAL:'var(--amber)'}[c.Status_Cobranca] || 'var(--txt-dim)';

    return `
    <div data-style="background:var(--bg-soft);border:1px solid var(--line-soft);border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <!-- Avatar + nome -->
      <div data-style="display:flex;align-items:center;gap:12px;flex:1;min-width:180px">
        <div data-style="width:44px;height:44px;border-radius:12px;background:${avColor(c.ID_Imovel)};display:grid;place-items:center;font-weight:700;font-size:14px;color:#fff;flex-shrink:0">${initials(c.Nome_Imovel)}</div>
        <div>
          <div data-style="font-weight:600;font-size:14px;letter-spacing:-.2px">${esc(c.Nome_Imovel)}</div>
          <div data-style="font-size:12px;color:var(--txt-dim);margin-top:1px">${esc(c.Responsavel_Pagamento)}</div>
        </div>
      </div>
      <!-- Tipo -->
      <div data-style="flex-shrink:0">${tipoBadge(c.Tipo_Cobranca)}</div>
      <!-- Valor -->
      <div data-style="min-width:110px;text-align:right">
        <div data-style="font-family:var(--serif);font-size:18px;font-weight:600">${fmtBRL2(valorTotal)}</div>
        ${isParcial ? `<div data-style="font-size:12px;color:var(--rose);font-weight:600;margin-top:2px">Restante: ${fmtBRL2(restante)}</div>` : ''}
        ${isPago && valorPagoC > 0 && Math.abs(valorPagoC - valorTotal) > 0.009 ? `<div data-style="font-size:11px;color:var(--txt-mute);margin-top:2px">Pago: ${fmtBRL2(valorPagoC)}</div>` : ''}
      </div>
      <!-- Status -->
      <div data-style="flex-shrink:0">${statusBadge(c.Status_Cobranca)}</div>
      <!-- Ação / info pago -->
      <div data-style="flex-shrink:0;min-width:130px;text-align:right">
        ${isPago
          ? `<div data-style="font-size:12px;color:var(--emerald);font-weight:600">✓ Pago em ${c.Data_Pagamento ? new Date(c.Data_Pagamento+'T00:00').toLocaleDateString('pt-BR') : '—'}</div>
             ${c.Quem_Pagou ? `<div data-style="font-size:11px;color:var(--txt-mute);margin-top:2px">por ${esc(c.Quem_Pagou)}</div>` : ''}
             ${c.Forma_Pagamento ? `<div data-style="font-size:11px;color:var(--txt-mute)">${esc(c.Forma_Pagamento)}</div>` : ''}`
          : `<button class="btn primary" data-style="padding:8px 16px;font-size:13px" data-action="close-open-pay" data-id="${esc(c.ID_Cobranca)}">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" data-style="width:14px;height:14px"><path d="M20 6L9 17l-5-5"/></svg>
               Registrar Pagamento
             </button>`
        }
      </div>
    </div>`;
  }).join('');

  showModal(`📅 ${dtFmt}`,
    `<div data-style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:16px">
      <div data-style="background:var(--panel);border:1px solid var(--line-soft);border-radius:10px;padding:10px 8px;min-width:0">
        <div data-style="font-size:10px;color:var(--txt-mute);letter-spacing:.4px;text-transform:uppercase;margin-bottom:4px">Previsto</div>
        <div data-style="font-family:var(--serif);font-size:clamp(12px,3.8vw,18px);font-weight:600;color:var(--amber);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${fmtBRL2(total)}</div>
        <div data-style="font-size:11px;color:var(--txt-mute);margin-top:2px">${cobs.length} cobr.</div>
      </div>
      <div data-style="background:var(--panel);border:1px solid var(--line-soft);border-radius:10px;padding:10px 8px;min-width:0">
        <div data-style="font-size:10px;color:var(--txt-mute);letter-spacing:.4px;text-transform:uppercase;margin-bottom:4px">Recebido</div>
        <div data-style="font-family:var(--serif);font-size:clamp(12px,3.8vw,18px);font-weight:600;color:var(--emerald);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${fmtBRL2(recebido)}</div>
        <div data-style="font-size:11px;color:var(--txt-mute);margin-top:2px">${cobs.filter(c=>c.Status_Cobranca==='PAGO').length} pago${cobs.filter(c=>c.Status_Cobranca==='PAGO').length!==1?'s':''}</div>
      </div>
      <div data-style="background:var(--panel);border:1px solid var(--line-soft);border-radius:10px;padding:10px 8px;min-width:0">
        <div data-style="font-size:10px;color:var(--txt-mute);letter-spacing:.4px;text-transform:uppercase;margin-bottom:4px">Pendente</div>
        <div data-style="font-family:var(--serif);font-size:clamp(12px,3.8vw,18px);font-weight:600;color:var(--rose);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${fmtBRL2(pendente)}</div>
        <div data-style="font-size:11px;color:var(--txt-mute);margin-top:2px">${cobs.filter(c=>c.Status_Cobranca!=='PAGO').length} em aberto</div>
      </div>
    </div>
    <div data-style="display:flex;flex-direction:column;gap:10px">${cards}</div>`,
    `<button class="btn ghost" data-action="close-modal">Fechar</button>`);

  // Expande o modal e remove limite de altura do body para não ter scroll
  const box = document.querySelector('#modalBox');
  const body = document.querySelector('#modalBox .modal-body');
  if(box) box.style.maxWidth = '780px';
  if(body){ body.style.maxHeight = 'none'; body.style.overflow = 'visible'; }
}

let filtroManut = { q:'', st:'TODOS' };
