/* ============================================================
   LOCARIA - modules/dashboard.js
   Dashboard: KPIs, graficos e donut.
   ============================================================ */
function renderDashboard(){
  const comp = todayComp();
  const compData = STATE.cobrancas.filter(c=>String(c.Competencia||'').trim().slice(0,7)===comp);
  
  let dataset = [];
  const modo = dashFilter.modo;
  if(modo === 'PERIODO'){
     const dtIni = dashFilter.inicio;
     const dtFim = dashFilter.fim;
     // Período filtra por Data_Vencimento — mostra tudo que venceu no intervalo
     // Isso inclui água/luz de competência anterior que vencem dentro do período
     dataset = STATE.cobrancas.filter(c => {
        let valid = true;
        if(dtIni) valid = valid && (c.Data_Vencimento >= dtIni);
        if(dtFim) valid = valid && (c.Data_Vencimento <= dtFim);
        return valid;
     });
  }else{
     // Modo Atual: filtra por Competência (mês do consumo)
     // EXCETO para água e luz que têm Data_Vencimento no mês atual mas competência anterior
     // → inclui também encargos com vencimento no mês atual independente da competência
     const compAtual = comp;
     const inicioMes = compAtual + '-01';
     const fimMes    = compAtual + '-31';
     dataset = STATE.cobrancas.filter(c => {
       const compNorm = String(c.Competencia||'').trim().slice(0,7);
       if(c.Tipo_Cobranca === 'CONDOMINIO' || c.Tipo_Cobranca === 'IPTU'){
         // CONDOMINIO e IPTU: competência = mês atual
         return compNorm === compAtual;
       } else {
         // ALUGUEL (usa depois paga), AGUA, LUZ, OUTRO: filtra por vencimento no mês
         return c.Data_Vencimento >= inicioMes && c.Data_Vencimento <= fimMes;
       }
     });
     // Fallback: se não tiver nada, usa o mês com mais cobranças
     if(!dataset.length){
       const mc = maxComp();
       const inicioMc = mc + '-01';
       const fimMc    = mc + '-31';
       dataset = STATE.cobrancas.filter(c => {
         const compNorm = String(c.Competencia||'').trim().slice(0,7);
         if(c.Tipo_Cobranca === 'CONDOMINIO' || c.Tipo_Cobranca === 'IPTU'){
           return compNorm === mc;
         } else {
           return c.Data_Vencimento >= inicioMc && c.Data_Vencimento <= fimMc;
         }
       });
     }
  }

  const usedComp = (modo === 'ATUAL' && dataset.length) ? comp : (modo === 'PERIODO' ? 'Período Personalizado' : comp);

  /* === OCUPAÇÃO === 
     Para modo ATUAL: conta imóveis ALUGADO atualmente (carteira hoje)
     Para modo PERIODO: 
       - total = imóveis cadastrados ATÉ a data final do período (usa Data_Cadastro)
       - ocupados = imóveis que tinham contrato ATIVO durante o período
         (existe inquilino com Data_Inicio_Contrato <= dtFim E (sem fim OU Data_Fim_Contrato >= dtIni))
  */
  let totImoveis, ocupados;
  if(modo === 'PERIODO' && (dashFilter.inicio || dashFilter.fim)){
     const dtIni = dashFilter.inicio || '0000-01-01';
     const dtFim = dashFilter.fim || '9999-12-31';

     // Total: imóveis cuja Data_Cadastro <= dtFim. Se não tiver Data_Cadastro, conta normalmente
     // (assume que já existia antes do período)
     totImoveis = STATE.imoveis.filter(i => {
        const dc = i.Data_Cadastro;
        if(!dc) return true; // sem data: considera que já existia
        return dc <= dtFim;
     }).length;

     // Ocupados: imóveis com pelo menos um contrato vigente no período
     const idsOcupados = new Set();
     STATE.contratos.forEach(ct => {
        if(String(ct.ATIVO||'SIM').toUpperCase()==='NAO') return;
        const di = ct.Data_Inicio_Contrato || '0000-01-01';
        const df = ct.Data_Fim_Contrato || '9999-12-31';
        // sobreposição de intervalos [di, df] com [dtIni, dtFim]
        if(di <= dtFim && df >= dtIni){
          idsOcupados.add(Number(ct.ID_Imovel));
        }
     });
     ocupados = STATE.imoveis.filter(i => {
        const dc = i.Data_Cadastro;
        if(dc && dc > dtFim) return false; // imóvel cadastrado depois do período não conta
        return idsOcupados.has(Number(i.ID_Imovel));
     }).length;
  }else{
     totImoveis = STATE.imoveis.length;
     ocupados = STATE.imoveis.filter(i=>i.Status_Atual==='ALUGADO').length;
  }
  const pctOcup = totImoveis?Math.round(ocupados/totImoveis*100):0;
  const hoje = new Date().toISOString().slice(0,10);

  /* ── Separação: ALUGUEL vs ENCARGOS ── */
  const dsAluguel  = dataset.filter(c => c.Tipo_Cobranca === 'ALUGUEL');
  const dsEncargos = dataset.filter(c => c.Tipo_Cobranca !== 'ALUGUEL');

  // Linha 1 — Aluguéis
  // Previsto = tudo que foi cobrado no período
  const alugPrevisto   = dsAluguel.reduce((s,c)=>s+(+c.Valor_Cobrado||0),0);
  // Recebido = PAGO (valor efetivamente pago, considera desconto)
  const alugRecebido   = dsAluguel.filter(c=>c.Status_Cobranca==='PAGO').reduce((s,c)=>s+(+c.Valor_Pago||+c.Valor_Cobrado||0),0);
  const alugPctReceb   = alugPrevisto ? Math.round(alugRecebido/alugPrevisto*100) : 0;
  // Em Aberto = PENDENTE (qualquer data) + saldo restante de PARCIAL
  // Não filtramos por data — o status já indica que não foi pago
  const alugAberto     = dsAluguel.filter(c=>c.Status_Cobranca==='PENDENTE'||c.Status_Cobranca==='PARCIAL');
  const alugValAberto  = alugAberto.reduce((s,c)=>{
    if(c.Status_Cobranca==='PARCIAL') return s + Math.max(0,(+c.Valor_Cobrado||0)-(+c.Valor_Pago||0));
    return s + (+c.Valor_Cobrado||0);
  },0);
  // Inadimplência = ATRASADO
  const alugInadArr    = dsAluguel.filter(c=>c.Status_Cobranca==='ATRASADO');
  const alugInad       = alugInadArr.reduce((s,c)=>s+(+c.Valor_Cobrado||0),0);

  // Linha 2 — Encargos (água, luz, IPTU, condomínio, outros)
  const encPrevisto   = dsEncargos.reduce((s,c)=>s+(+c.Valor_Cobrado||0),0);
  const encRecebido   = dsEncargos.filter(c=>c.Status_Cobranca==='PAGO').reduce((s,c)=>s+(+c.Valor_Pago||+c.Valor_Cobrado||0),0);
  const encPctReceb   = encPrevisto ? Math.round(encRecebido/encPrevisto*100) : 0;
  const encAberto     = dsEncargos.filter(c=>c.Status_Cobranca==='PENDENTE'||c.Status_Cobranca==='PARCIAL');
  const encValAberto  = encAberto.reduce((s,c)=>{
    if(c.Status_Cobranca==='PARCIAL') return s + Math.max(0,(+c.Valor_Cobrado||0)-(+c.Valor_Pago||0));
    return s + (+c.Valor_Cobrado||0);
  },0);
  const encInadArr    = dsEncargos.filter(c=>c.Status_Cobranca==='ATRASADO');
  const encInad       = encInadArr.reduce((s,c)=>s+(+c.Valor_Cobrado||0),0);

  const periodoLabel = usedComp.replace('-','/');

  // helper para gerar um card KPI
  // tag.cls = 'up'|'down', tag.txt = texto secundário (ex: percentual)
  // val = valor principal (verde se up, vermelho se down)
  const kpiCard = (ic,label,val,foot,svg,tag=null)=>`
    <div class="kpi">
      <div class="kpi-top">
        <div class="kpi-ico ${ic}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svg}</svg></div>
        ${tag?`<span class="kpi-tag ${tag.cls}">${tag.txt}</span>`:''}
      </div>
      <div class="kpi-label">${label}</div>
      <div class="kpi-value" style="${tag?'color:var(--emerald)':''}">${val}</div>
      <div class="kpi-foot">${foot}</div>
    </div>`;

  // ── Linha 1: Aluguéis (5 cards) ──
  const row1Html = [
    kpiCard('am','Aluguel Previsto',fmtBRL(alugPrevisto),periodoLabel+' · '+dsAluguel.length+' cobranças','<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
    kpiCard('em','Recebido',fmtBRL(alugRecebido),alugPctReceb+'% do previsto','<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',{cls:'neutral',txt:alugPctReceb+'%'}),
    kpiCard('bl','Em Aberto',fmtBRL(alugValAberto),alugAberto.length+' não pago(s)','<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/>'),
    kpiCard('ro','Inadimplência',fmtBRL(alugInad),alugInadArr.length+' em atraso','<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>'),
    kpiCard('bl2','Ocupação',pctOcup+'%',ocupados+' de '+totImoveis+' imóveis','<path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>'),
  ].join('');

  // ── Linha 2: Encargos (4 cards) ──
  const row2Html = [
    kpiCard('am2','Encargos Previstos',fmtBRL(encPrevisto),periodoLabel+' · '+dsEncargos.length+' cobranças','<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>'),
    kpiCard('em','Recebido',fmtBRL(encRecebido),encPctReceb+'% do previsto','<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',{cls:'neutral',txt:encPctReceb+'%'}),
    kpiCard('bl','Em Aberto',fmtBRL(encValAberto),encAberto.length+' não paga(s)','<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/>'),
    kpiCard('ro','Inadimplência',fmtBRL(encInad),encInadArr.length+' em atraso','<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>'),
  ].join('');

  // ainda precisamos do dataset total para o gráfico, donut e tabela de pendentes
  const recebido     = dataset.filter(c=>c.Status_Cobranca==='PAGO').reduce((s,c)=>s+(+c.Valor_Cobrado||0),0);
  const inadAtraso   = dataset.filter(c=>c.Status_Cobranca==='ATRASADO');
  const inadimplencia= inadAtraso.reduce((s,c)=>s+(+c.Valor_Cobrado||0),0);
  const previsto     = dataset.reduce((s,c)=>s+(+c.Valor_Cobrado||0),0);
  // pctReceb do total (usado no donut)
  const pctReceb = previsto ? Math.round(recebido/previsto*100) : 0;

  // Pendentes / em atraso:
  // - Exclui cobranças com valor zero (água/luz aguardando valor real)
  // - Prioriza: ATRASADO com valor > PENDENTE com valor > sem valor
  // - Sem limite fixo: mostra todas com valor; sem valor ficam no fim (máx 3)
  const pendComValor = STATE.cobrancas
    .filter(c => (c.Status_Cobranca==='ATRASADO'||c.Status_Cobranca==='PENDENTE'||c.Status_Cobranca==='PARCIAL')
              && (+c.Valor_Cobrado||0) > 0)
    .sort((a,b)=> new Date(a.Data_Vencimento)-new Date(b.Data_Vencimento));

  const pendSemValor = STATE.cobrancas
    .filter(c => (c.Status_Cobranca==='ATRASADO'||c.Status_Cobranca==='PENDENTE')
              && (+c.Valor_Cobrado||0) === 0)
    .sort((a,b)=> new Date(a.Data_Vencimento)-new Date(b.Data_Vencimento))
    .slice(0,3); // mostra no máximo 3 sem valor, para alertar que precisam de preenchimento

  const pend = [...pendComValor, ...pendSemValor];

  const pendRows = pend.length ? pend.map(c=>{
    const dias=diasAtraso(c.Data_Vencimento,c.Status_Cobranca);
    const valorTotal = +c.Valor_Cobrado || 0;
    const valorPagoCob = +c.Valor_Pago || 0;
    const isParcial = c.Status_Cobranca === 'PARCIAL';
    const restante = Math.max(0, valorTotal - valorPagoCob);
    const valorCell = isParcial ?
      `<div class="money">${fmtBRL2(valorTotal)}</div><div style="font-size:11px;color:var(--rose);font-weight:600;margin-top:2px">Devido: ${fmtBRL2(restante)}</div>` :
      `<span class="money">${fmtBRL2(valorTotal)}</span>`;
    // item 5: clicar leva para abrir o modal de pagamento dessa cobrança
    return `<tr class="clickable" onclick="dashboardOpenPay('${c.ID_Cobranca}')" title="Clique para registrar pagamento">
      <td><div class="row-flex"><div class="av" style="background:${avColor(c.ID_Imovel)}">${initials(c.Nome_Imovel)}</div>
        <div><div class="cell-strong">${esc(c.Nome_Imovel)}</div><div class="cell-sub">${esc(c.Responsavel_Pagamento)}</div></div></div></td>
      <td>${tipoBadge(c.Tipo_Cobranca)}</td>
      <td>${valorCell}</td>
      <td>${new Date(c.Data_Vencimento+'T00:00').toLocaleDateString('pt-BR')}</td>
      <td>${statusBadge(c.Status_Cobranca)}</td>
      <td style="text-align:center;font-weight:600;color:${dias>0?'var(--rose)':'var(--txt-mute)'}">${dias>0?dias+' d':'—'}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="6"><div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg><div>Tudo em dia! 🎉</div></div></td></tr>`;

  // ── Consumo água e luz — responde ao filtro do dashboard ──
  const CHART_COLORS = ['#46b6c4','#e0a23c','#3ec58b','#9d7bf0','#f06565','#5b9bf0','#d98ad9'];
  let comps4;
  if(modo === 'PERIODO' && (dashFilter.inicio || dashFilter.fim)){
    // Modo período: usa as competências cujas cobranças de água/luz vencem no intervalo
    const dtIni = dashFilter.inicio || '0000-01-01';
    const dtFim = dashFilter.fim   || '9999-12-31';
    const cobsNoPeriodo = STATE.cobrancas.filter(c =>
      (c.Tipo_Cobranca==='AGUA'||c.Tipo_Cobranca==='LUZ') &&
      c.Data_Vencimento >= dtIni && c.Data_Vencimento <= dtFim
    );
    comps4 = [...new Set(cobsNoPeriodo.map(c=>c.Competencia))].sort();
    if(!comps4.length){
      // fallback: pega competências pelo período mesmo
      comps4 = [...new Set(STATE.cobrancas
        .filter(c=>c.Data_Vencimento>=dtIni&&c.Data_Vencimento<=dtFim)
        .map(c=>c.Competencia))].sort();
    }
  } else {
    // Modo atual: últimos 6 meses
    const compsAll = [...new Set(STATE.cobrancas.map(c=>c.Competencia))].sort();
    comps4 = compsAll.slice(-6);
  }
  const imoveisComAgua = STATE.imoveis.filter(im =>
    STATE.cobrancas.some(c=>Number(c.ID_Imovel)===Number(im.ID_Imovel)&&c.Tipo_Cobranca==='AGUA'&&comps4.includes(c.Competencia))
  );
  const imoveisComLuz = STATE.imoveis.filter(im =>
    STATE.cobrancas.some(c=>Number(c.ID_Imovel)===Number(im.ID_Imovel)&&c.Tipo_Cobranca==='LUZ'&&comps4.includes(c.Competencia))
  );

  $('#view-dashboard').innerHTML=`
    <div class="panel" style="margin-bottom:18px">
      <div class="panel-body">
        <div class="dash-filter">
          <div class="field">
            <label>Modo</label>
            <select id="dashboardModo" onchange="dashFilter.modo=this.value; renderDashboard()">
              <option value="ATUAL" ${dashFilter.modo==='ATUAL'?'selected':''}>Atual</option>
              <option value="PERIODO" ${dashFilter.modo==='PERIODO'?'selected':''}>Personalizado</option>
            </select>
          </div>
          ${dashFilter.modo === 'PERIODO' ? `
          <div class="field">
            <label>Data Inicial</label>
            <input type="date" id="dashboardInicio" value="${esc(dashFilter.inicio)}" onchange="dashFilter.inicio=this.value">
          </div>
          <div class="field">
            <label>Data Final</label>
            <input type="date" id="dashboardFim" value="${esc(dashFilter.fim)}" onchange="dashFilter.fim=this.value">
          </div>
          <div class="field btn-wrap">
            <button class="btn primary" onclick="renderDashboard()">Aplicar</button>
          </div>` : ''}
        </div>
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;margin-top:4px">
      <div style="width:4px;height:22px;background:var(--amber);border-radius:2px;flex-shrink:0"></div>
      <span style="font-family:var(--serif);font-size:16px;font-weight:600;letter-spacing:-.2px;color:var(--txt)">🏠 Aluguéis</span>
    </div>
    <div class="kpi-grid" style="margin-bottom:24px">${row1Html}</div>

    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <div style="width:4px;height:22px;background:#46b6c4;border-radius:2px;flex-shrink:0"></div>
      <span style="font-family:var(--serif);font-size:16px;font-weight:600;letter-spacing:-.2px;color:var(--txt)">💧 Encargos <span style="font-size:13px;font-weight:400;color:var(--txt-dim)">(Água · Luz · IPTU · Outros)</span></span>
    </div>
    <div class="kpi-grid g4" style="margin-bottom:22px">${row2Html}</div>

    <div class="panel" style="margin-bottom:22px">
      <div class="panel-head" style="padding-bottom:14px">
        <div>
          <h3>Cobranças pendentes / em atraso</h3>
          <div class="sub">Clique em uma linha para registrar o pagamento</div>
        </div>
        <button class="btn ghost" onclick="navigate('cobrancas')" style="padding:8px 13px">Ver todas</button>
      </div>
      <div class="panel-body" style="padding-top:0">
        <div class="tbl-scroll"><table>
          <thead><tr><th>Imóvel / Inquilino</th><th>Tipo</th><th>Valor</th><th>Vencimento</th><th>Status</th><th style="text-align:center">Atraso</th></tr></thead>
          <tbody>${pendRows}</tbody>
        </table></div>
      </div>
    </div>

    ${(imoveisComAgua.length||imoveisComLuz.length) ? `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <div style="width:4px;height:22px;background:var(--violet);border-radius:2px;flex-shrink:0"></div>
      <span style="font-family:var(--serif);font-size:16px;font-weight:600;letter-spacing:-.2px;color:var(--txt)">📊 Consumo Água & Luz <span style="font-size:13px;font-weight:400;color:var(--txt-dim)">por imóvel · últimos 6 meses</span></span>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:22px">
      ${imoveisComAgua.length ? `<div class="panel"><div class="panel-head"><div><h3 style="color:#46b6c4">💧 Água</h3><div class="sub">R$ por competência · últimos 6 meses</div></div></div><div class="panel-body"><div class="chart-wrap" style="height:240px"><canvas id="chAgua"></canvas></div></div></div>` : ''}
      ${imoveisComLuz.length  ? `<div class="panel"><div class="panel-head"><div><h3 style="color:var(--amber)">⚡ Luz</h3><div class="sub">R$ por competência · últimos 6 meses</div></div></div><div class="panel-body"><div class="chart-wrap" style="height:240px"><canvas id="chLuz"></canvas></div></div></div>` : ''}
    </div>
    ` : ''}

    <div class="row c2">
      <div class="panel">
        <div class="panel-head"><div><h3>Status (Visão Geral)</h3><div class="sub">${usedComp.replace('-','/')}</div></div></div>
        <div class="panel-body">
          <div class="donut-wrap"><canvas id="chDonut"></canvas>
            <div class="donut-center"><div class="big">${pctReceb}%</div><div class="small">recebido</div></div>
          </div>
          <div class="legend" id="donutLegend"></div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><div><h3>Receita por competência</h3><div class="sub">Recebido vs. previsto nos últimos meses</div></div></div>
        <div class="panel-body"><div class="chart-wrap"><canvas id="chRev"></canvas></div></div>
      </div>
    </div>`;

  // Gráfico receita: modo Atual = últimos 6 meses do total; modo Período = filtrado
  drawRevChart(modo === 'PERIODO' ? dataset : null);
  drawDonut(recebido, inadimplencia, previsto-recebido-inadimplencia);

  // Desenha gráficos de consumo por tipo
  drawConsumoChart('chAgua', imoveisComAgua, 'AGUA', comps4, CHART_COLORS);
  drawConsumoChart('chLuz',  imoveisComLuz,  'LUZ',  comps4, CHART_COLORS);
}

function drawConsumoChart(canvasId, imoveis, tipo, comps, colors){
  const ctx = document.getElementById(canvasId);
  if(!ctx || !imoveis.length) return;
  if(charts[canvasId]) charts[canvasId].destroy();

  // Eixo X: mês de pagamento (Data_Vencimento do mês seguinte à competência)
  // Calcula os meses de vencimento correspondentes às competências
  const mesesVenc = comps.map(cp => {
    const [y, m] = cp.split('-').map(Number);
    const desloc = (tipo==='AGUA'||tipo==='LUZ') ? 1 : 0;
    const mv = m + desloc > 12 ? 1 : m + desloc;
    const yv = m + desloc > 12 ? y + 1 : y;
    return yv+'-'+String(mv).padStart(2,'0');
  });

  const labels = mesesVenc.map(c => monthLabel(c));
  const datasets = imoveis.map((im, i) => {
    const data = comps.map(cp => {
      // Busca pelo valor PAGO (se pago), senão valor cobrado (pendente/atrasado)
      const c = STATE.cobrancas.find(x =>
        Number(x.ID_Imovel)===Number(im.ID_Imovel) &&
        x.Tipo_Cobranca===tipo &&
        x.Competencia===cp
      );
      if(!c) return null;
      // Retorna valor pago se disponível, senão valor cobrado
      return c.Status_Cobranca==='PAGO'
        ? (+c.Valor_Pago||+c.Valor_Cobrado||0)
        : (+c.Valor_Cobrado||0);
    });
    const cor = colors[i % colors.length];
    return {
      label: im.Nome_Imovel,
      data,
      borderColor: cor,
      backgroundColor: cor.replace(')',', .12)').replace('rgb','rgba'),
      fill: false,
      tension: .4,
      borderWidth: 2.5,
      pointBackgroundColor: cor,
      pointRadius: 4,
      pointHoverRadius: 6,
      spanGaps: true,
    };
  });
  const tooltipTitleCb = items => items[0]?.label || '';
  charts[canvasId] = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color:'#97a3b4', font:{family:'Outfit',size:11}, usePointStyle:true, pointStyleWidth:8, padding:14, boxHeight:8 }
        },
        tooltip: {
          backgroundColor:'#202733', borderColor:'#2a323f', borderWidth:1, padding:12,
          titleColor:'#e8edf4', bodyColor:'#97a3b4',
          callbacks: {
            title: tooltipTitleCb,
            label: c => ' '+c.dataset.label+': '+fmtBRL2(c.parsed.y)
          },
          footerColor:'#64707f',
          footer: () => 'valor pago no mês'
        }
      },
      scales: {
        x: { grid:{display:false}, ticks:{color:'#64707f', font:{family:'Outfit',size:11}} },
        y: { grid:{color:'#222a35'}, ticks:{color:'#64707f', font:{family:'Outfit',size:11}, callback: v=>fmtBRL(v)} }
      }
    }
  });
}

/* Ao clicar em uma linha do dashboard, abre o modal de pagamento da cobrança */
function dashboardOpenPay(idCobranca){
  openPagamentoModal(idCobranca);
}
function maxComp(){ const cs=[...new Set(STATE.cobrancas.map(c=>c.Competencia))].sort(); return cs[cs.length-1]||todayComp(); }

function drawRevChart(datasetOverride){
  // Usa dataset filtrado se disponível (modo período), senão usa todos
  const base = datasetOverride || STATE.cobrancas;

  // Previsto: meses presentes no dataset
  // Se não vier datasetOverride (modo Atual), limita aos últimos 6 meses
  let comps = [...new Set(base.map(c=>String(c.Competencia||'').trim().slice(0,7)))].sort().filter(Boolean);
  if(!datasetOverride) comps = comps.slice(-6);

  const prev = comps.map(c =>
    base.filter(x=>String(x.Competencia||'').trim().slice(0,7)===c)
        .reduce((s,x)=>s+(+x.Valor_Cobrado||0),0)
  );

  // Recebido: agrupa por mês de Data_Pagamento (dinheiro que entrou de fato)
  const rec = comps.map(c=>{
    return STATE.cobrancas // sempre do total para capturar pagamentos fora do período filtrado
      .filter(x => x.Status_Cobranca==='PAGO')
      .filter(x => {
        const mesRec = String(x.Data_Pagamento||x.Data_Vencimento||'').slice(0,7);
        return mesRec === c;
      })
      .reduce((s,x)=>s+(+x.Valor_Pago||+x.Valor_Cobrado||0), 0);
  });
  const ctx=$('#chRev'); if(!ctx)return; if(charts.rev)charts.rev.destroy();
  const g=ctx.getContext('2d');
  const grad=g.createLinearGradient(0,0,0,255); grad.addColorStop(0,'rgba(62,197,139,.35)'); grad.addColorStop(1,'rgba(62,197,139,0)');
  charts.rev=new Chart(g,{type:'bar',data:{labels:comps.map(monthLabel),datasets:[
    {label:'Previsto',data:prev,backgroundColor:'rgba(224,162,60,.18)',borderColor:'rgba(224,162,60,.5)',borderWidth:1,borderRadius:7,barPercentage:.62,categoryPercentage:.62},
    {type:'line',label:'Recebido',data:rec,borderColor:'#3ec58b',backgroundColor:grad,fill:true,tension:.4,borderWidth:2.5,pointBackgroundColor:'#3ec58b',pointRadius:4,pointHoverRadius:6}
  ]},options:chartOpts(true)});
}
function drawDonut(rec,atr,pend){
  const ctx=$('#chDonut'); if(!ctx)return; if(charts.donut)charts.donut.destroy();
  pend=Math.max(0,pend);
  charts.donut=new Chart(ctx,{type:'doughnut',data:{labels:['Recebido','Atrasado','A vencer'],datasets:[{data:[rec,atr,pend],
    backgroundColor:['#3ec58b','#f06565','#e0a23c'],borderColor:'#1a2029',borderWidth:3,hoverOffset:6}]},
    options:{cutout:'72%',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:donutTip()}}});
  const tot=rec+atr+pend||1;
  $('#donutLegend').innerHTML=[['Recebido','#3ec58b',rec],['Atrasado','#f06565',atr],['A vencer','#e0a23c',pend]]
    .map(([l,c,v])=>`<div class="legend-item"><span class="legend-sw" style="background:${c}"></span>${l}<span class="legend-val">${fmtBRL(v)}</span></div>`).join('');
}
function chartOpts(money){return{responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:'index'},
  plugins:{legend:{labels:{color:'#97a3b4',font:{family:'Outfit',size:12},usePointStyle:true,pointStyleWidth:8,padding:16}},
    tooltip:{backgroundColor:'#202733',borderColor:'#2a323f',borderWidth:1,padding:12,titleColor:'#e8edf4',bodyColor:'#97a3b4',
      callbacks:{label:c=>c.dataset.label+': '+fmtBRL2(c.parsed.y)}}},
  scales:{x:{grid:{display:false},ticks:{color:'#64707f',font:{family:'Outfit'}}},
    y:{grid:{color:'#222a35'},ticks:{color:'#64707f',font:{family:'Outfit'},callback:v=>fmtBRL(v)}}}};}
function donutTip(){return{backgroundColor:'#202733',borderColor:'#2a323f',borderWidth:1,padding:12,titleColor:'#e8edf4',bodyColor:'#97a3b4',callbacks:{label:c=>c.label+': '+fmtBRL2(c.parsed)}};}
