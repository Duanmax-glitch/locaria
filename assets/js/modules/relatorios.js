/* ============================================================
   LOCARIA - modules/relatorios.js
   Relatorios: extrato do imovel, inquilino, inadimplencia e gerador imprimivel.
   ============================================================ */
function renderRelatorios(){
  $('#view-relatorios').innerHTML = `
    <div class="report-grid">
      <div class="report-card" data-action="rel-imovel">
        <div class="rc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg></div>
        <h4>Extrato do Imóvel</h4>
        <p>Receitas geradas (aluguéis e contas pagas) e despesas com manutenções por imóvel, em qualquer período.</p>
      </div>
      <div class="report-card" data-action="rel-inquilino">
        <div class="rc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
        <h4>Prestação de Contas do Inquilino</h4>
        <p>Documento com todas as contas pagas, datas de pagamento e atrasos. Ideal para mostrar ao inquilino.</p>
      </div>
      <div class="report-card" data-action="rel-inadimplencia">
        <div class="rc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg></div>
        <h4>Inadimplência Geral</h4>
        <p>Lista de todas as cobranças em atraso, agrupadas por inquilino, com totais e dias de atraso.</p>
      </div>
    </div>
  `;
}

/* === Helper: abre relatório como página web com botão PDF/Compartilhar === */
function gerarRelatorioImprimivel(titulo, htmlBody, nomeArq){
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${titulo}</title>
<style>
  :root{
    --bg-soft:#f4f6f9;--panel:#f4f6f9;--panel-2:#eef0f4;
    --line:#d8dde6;--line-soft:#e4e8ef;
    --txt:#1a1a2e;--txt-dim:#4a5568;--txt-mute:#718096;
    --amber:#c9852a;--amber-soft:rgba(201,133,42,.12);
    --emerald:#1a8a50;--emerald-soft:rgba(26,138,80,.12);
    --rose:#c0392b;--rose-soft:rgba(192,57,43,.12);
    --blue:#2b6cb0;--violet:#6b46c1;
    --sans:'Segoe UI',Arial,sans-serif;--serif:Georgia,serif;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:var(--sans);background:#fff;color:#1a1a2e;font-size:14px;line-height:1.5}
  .action-bar{position:fixed;top:0;left:0;right:0;z-index:99;background:#1a2029;padding:10px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 2px 8px rgba(0,0,0,.3)}
  .action-bar h2{color:#e8edf4;font-size:14px;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .btn-save{background:#e0a23c;color:#1a1a2e;border:none;padding:9px 18px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap}
  .spacer{height:50px}
  .doc{max-width:900px;margin:0 auto;padding:16px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#f0f2f5;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#666;border-bottom:2px solid #ddd}
  td{padding:8px 12px;border-bottom:1px solid #eee;color:#1a1a2e}
  tr:last-child td{border-bottom:none}
  .extrato-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}
  .extrato-box{background:#f4f6f9;border:1px solid #dde1ea;border-radius:12px;padding:14px}
  .extrato-box .lbl{font-size:11px;color:#718096;letter-spacing:.4px;text-transform:uppercase}
  .extrato-box .val{font-family:Georgia,serif;font-weight:600;font-size:20px;letter-spacing:-.5px;margin-top:5px}
  .extrato-box.rec .val{color:#1a8a50}
  .extrato-box.desp .val{color:#c0392b}
  .extrato-box.saldo .val{color:#c9852a}
  .tbl-scroll{overflow-x:auto;border-radius:8px;border:1px solid #e0e0e0;margin-bottom:8px}
  .cell-strong{font-weight:600;font-size:13px;color:#1a1a2e}
  .cell-sub{font-size:11px;color:#888;margin-top:2px}
  .money{font-weight:600;font-family:Georgia,serif}
  .empty{text-align:center;padding:32px;color:#888}
  @media(max-width:640px){
    .extrato-summary{grid-template-columns:repeat(2,1fr)}
    .extrato-box .val{font-size:15px}
  }
  @media print{
    .action-bar,.spacer{display:none !important}
    body{font-size:12px}
    .extrato-summary{grid-template-columns:repeat(3,1fr) !important}
  }
</style>
</head>
<body>
  <div class="action-bar">
    <h2>${titulo}</h2>
    <button class="btn-save" id="btnSave">⬇ Salvar PDF / Compartilhar</button>
  </div>
  <div class="spacer"></div>
  <div class="doc">${htmlBody}</div>
  <script>
    document.getElementById('btnSave').addEventListener('click', async function(){
      var isMobile = ${isMobile};
      if(isMobile && navigator.canShare){
        // Tenta compartilhar via print → PDF nativo no iOS/Android
        window.print();
      } else {
        window.print();
      }
    });
  <\/script>
</body>
</html>`;

  const blob = new Blob([html], {type:'text/html;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if(!win){ const a=document.createElement('a'); a.href=url; a.target='_blank'; a.click(); }
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}

/* === Relatório Extrato do Imóvel === */
function abrirRelatorioImovel(){
  const hoje = new Date().toISOString().slice(0,10);
  const umAnoAtras = new Date(); umAnoAtras.setFullYear(umAnoAtras.getFullYear()-1);
  const dtIni = umAnoAtras.toISOString().slice(0,10);

  // Tipos disponíveis com base nas cobranças existentes do imóvel selecionado
  // (popula dinamicamente ao mudar imóvel)
  const optsImovel = STATE.imoveis.map(i=>`<option value="${i.ID_Imovel}">${esc(i.Nome_Imovel)}</option>`).join('');

  showModal('Extrato do Imóvel',
    `<form id="repForm">
       <div class="form-grid">
         <div class="field full">
           <label>Imóvel</label>
           <select name="idImovel" data-on-change="atualizar-tipos">${optsImovel}</select>
         </div>
         <div class="field full">
           <label>Tipo de Extrato</label>
           <select name="tipoExtrato" id="tipoExtratoSel">
             <option value="COMPLETO">Completo (Todos os lançamentos)</option>
             <option value="ALUGUEL">Apenas Aluguéis</option>
             <option value="ENCARGOS">Apenas Encargos (Água · Luz · IPTU · Outros)</option>
           </select>
         </div>
         <div class="field"><label>Data Inicial</label><input type="date" name="dtIni" value="${dtIni}"></div>
         <div class="field"><label>Data Final</label><input type="date" name="dtFim" value="${hoje}"></div>
       </div>
     </form>`,
    `<button class="btn ghost" data-action="close-modal">Cancelar</button>
     <button class="btn primary" data-action="gerar-rel-imovel">Gerar Relatório</button>`);

  // Popula os tipos disponíveis para o primeiro imóvel
  setTimeout(()=>{
    const sel = document.querySelector('[name="idImovel"]');
    if(sel) atualizarTiposExtrato(sel.value);
  }, 0);
}

/* Atualiza o select de tipo com os tipos que existem nas cobranças do imóvel */
function atualizarTiposExtrato(idImovel){
  const sel = document.getElementById('tipoExtratoSel');
  if(!sel) return;
  const tipos = [...new Set(
    STATE.cobrancas
      .filter(c => Number(c.ID_Imovel) === Number(idImovel))
      .map(c => c.Tipo_Cobranca)
  )].sort();

  const labelTipo = {ALUGUEL:'Apenas Aluguéis',AGUA:'Apenas Água',LUZ:'Apenas Luz',IPTU:'Apenas IPTU',CONDOMINIO:'Apenas Condomínio',OUTRO:'Apenas Outros'};
  const prev = sel.value;
  sel.innerHTML = `<option value="COMPLETO">Completo (Todos os lançamentos)</option>
    <option value="ALUGUEL" ${tipos.includes('ALUGUEL')?'':'disabled'}>Apenas Aluguéis</option>
    <option value="ENCARGOS">Apenas Encargos (Água · Luz · IPTU · Outros)</option>
    ${tipos.filter(t=>t!=='ALUGUEL').map(t=>`<option value="${t}">${labelTipo[t]||'Apenas '+t}</option>`).join('')}`;
  // tenta manter a seleção anterior
  if([...sel.options].some(o=>o.value===prev)) sel.value = prev;
}

function gerarRelatorioImovel(){
  const form = document.getElementById('repForm');
  const idImovel = Number(form.elements['idImovel'].value);
  const dtIni = form.elements['dtIni'].value;
  const dtFim = form.elements['dtFim'].value;
  const tipoFiltro = form.elements['tipoExtrato'].value; // COMPLETO | ALUGUEL | ENCARGOS | AGUA | LUZ | ...

  const im = STATE.imoveis.find(i=>Number(i.ID_Imovel)===idImovel);
  if(!im){ toast('Imóvel não encontrado','err'); return; }

  const ENCARGO_TIPOS = ['AGUA','LUZ','IPTU','CONDOMINIO','OUTRO'];

  // Cobranças do imóvel no período — usa Data_Vencimento para filtrar por data
  // Aluguéis: apenas PAGOS (receita confirmada)
  // Encargos (água, luz, etc): TODOS os registrados, independente de status e valor
  //   → importante para ver contas lançadas mesmo sem valor preenchido ainda
  const todasRec = STATE.cobrancas
    .filter(c => {
      if(Number(c.ID_Imovel) !== idImovel) return false;
      const dp = c.Data_Pagamento || c.Data_Vencimento;
      if(!dp) return false;
      if(dtIni && dp < dtIni) return false;
      if(dtFim && dp > dtFim) return false;
      // Aluguel: só PAGO
      if(c.Tipo_Cobranca === 'ALUGUEL') return c.Status_Cobranca === 'PAGO';
      // Encargos: todos os registrados
      return true;
    })
    .sort((a,b)=> new Date(a.Data_Pagamento||a.Data_Vencimento) - new Date(b.Data_Pagamento||b.Data_Vencimento));

  // Filtra por tipo selecionado
  const receitasFiltradas = tipoFiltro === 'COMPLETO' ? todasRec
    : tipoFiltro === 'ALUGUEL' ? todasRec.filter(c=>c.Tipo_Cobranca==='ALUGUEL')
    : tipoFiltro === 'ENCARGOS' ? todasRec.filter(c=>ENCARGO_TIPOS.includes(c.Tipo_Cobranca)||c.Tipo_Cobranca!=='ALUGUEL')
    : todasRec.filter(c=>c.Tipo_Cobranca===tipoFiltro);

  // Despesas: manutenções (mostradas apenas no extrato COMPLETO ou quando não há filtro de tipo específico)
  const mostrarDespesas = tipoFiltro === 'COMPLETO';
  const despesas = mostrarDespesas ? (STATE.manutencoes||[])
    .filter(m => Number(m.ID_Imovel)===idImovel)
    .filter(m => {
      const dp = m.Data_Conclusao || m.Data_Abertura;
      return (!dtIni || dp >= dtIni) && (!dtFim || dp <= dtFim);
    })
    .sort((a,b)=> new Date(a.Data_Abertura) - new Date(b.Data_Abertura)) : [];

  // Separação Receitas → Aluguéis vs Encargos
  const recAlugueis = receitasFiltradas.filter(c=>c.Tipo_Cobranca==='ALUGUEL');
  const recEncargos = receitasFiltradas.filter(c=>c.Tipo_Cobranca!=='ALUGUEL');

  const totalAlugueis  = recAlugueis.reduce((s,c)=>s+(+c.Valor_Pago||+c.Valor_Cobrado||0),0);
  const totalEncargos  = recEncargos.reduce((s,c)=>s+(+c.Valor_Pago||+c.Valor_Cobrado||0),0);
  const totalReceitas  = totalAlugueis + totalEncargos;
  const totalDespesas  = despesas.reduce((s,m)=>s+(+m.Custo||0),0);
  // Saldo = Aluguéis - Despesas (encargos são apenas informativos)
  const saldo          = totalAlugueis - totalDespesas;

  const periodoFmt = (dtIni?new Date(dtIni+'T00:00').toLocaleDateString('pt-BR'):'início') + ' até ' + (dtFim?new Date(dtFim+'T00:00').toLocaleDateString('pt-BR'):'hoje');
  const tipoLabel = {COMPLETO:'Completo',ALUGUEL:'Aluguéis',ENCARGOS:'Encargos',AGUA:'Água',LUZ:'Luz',IPTU:'IPTU',CONDOMINIO:'Condomínio',OUTRO:'Outros'}[tipoFiltro]||tipoFiltro;

  // helper: tabela de receitas
  const tblReceitas = (rows, vazia) => rows.length ? rows.map(c=>`
    <tr>
      <td>${c.Data_Pagamento ? new Date(c.Data_Pagamento+'T00:00').toLocaleDateString('pt-BR') : '—'}</td>
      <td>${tipoBadge(c.Tipo_Cobranca)}</td>
      <td>${esc(c.Responsavel_Pagamento)}</td>
      <td>${monthLabel(c.Competencia)}</td>
      <td class="money" data-style="color:var(--emerald);text-align:right">+ ${fmtBRL2(c.Valor_Pago||c.Valor_Cobrado)}</td>
    </tr>`).join('')
    : `<tr><td colspan="5" data-style="text-align:center;color:var(--txt-mute);padding:14px">${vazia}</td></tr>`;

  // Monta seções conforme o tipo escolhido
  let secoes = '';

  if(tipoFiltro === 'COMPLETO' || tipoFiltro === 'ALUGUEL'){
    secoes += `
      <div data-style="display:flex;align-items:center;gap:10px;margin:18px 0 10px">
        <div data-style="width:3px;height:18px;background:var(--amber);border-radius:2px"></div>
        <h4 data-style="font-family:var(--serif);font-size:15px;font-weight:600;color:var(--amber)">🏠 Aluguéis (${recAlugueis.length})</h4>
      </div>
      <div class="tbl-scroll" data-style="margin-bottom:4px"><table>
        <thead><tr><th>Data Pgto.</th><th>Tipo</th><th>Inquilino</th><th>Competência</th><th data-style="text-align:right">Valor</th></tr></thead>
        <tbody>${tblReceitas(recAlugueis,'Nenhum aluguel no período')}</tbody>
      </table></div>`;
  }

  if(tipoFiltro === 'COMPLETO' || tipoFiltro === 'ENCARGOS' || ENCARGO_TIPOS.includes(tipoFiltro)){
    const rowsEnc = tipoFiltro === 'COMPLETO' || tipoFiltro === 'ENCARGOS' ? recEncargos : receitasFiltradas;
    secoes += `
      <div data-style="display:flex;align-items:center;gap:10px;margin:18px 0 10px">
        <div data-style="width:3px;height:18px;background:#46b6c4;border-radius:2px"></div>
        <h4 data-style="font-family:var(--serif);font-size:15px;font-weight:600;color:#46b6c4">💧 Encargos (${rowsEnc.length})</h4>
      </div>
      <div class="tbl-scroll" data-style="margin-bottom:4px"><table>
        <thead><tr><th>Data Pgto.</th><th>Tipo</th><th>Pago Por</th><th>Competência</th><th data-style="text-align:right">Valor</th></tr></thead>
        <tbody>${tblReceitas(rowsEnc,'Nenhum encargo no período')}</tbody>
      </table></div>`;
  }

  if(mostrarDespesas){
    const linhasDesp = despesas.length ? despesas.map(m=>`
      <tr>
        <td>${m.Data_Conclusao ? new Date(m.Data_Conclusao+'T00:00').toLocaleDateString('pt-BR') : (m.Data_Abertura?new Date(m.Data_Abertura+'T00:00').toLocaleDateString('pt-BR'):'—')}</td>
        <td><div class="cell-strong">${esc(m.Titulo)}</div><div class="cell-sub">${esc(m.Descricao||'')}</div></td>
        <td>${esc(m.Responsavel||'—')}</td>
        <td>${statusManutBadge(m.Status)}</td>
        <td class="money" data-style="color:var(--rose);text-align:right">- ${fmtBRL2(m.Custo||0)}</td>
      </tr>`).join('')
      : `<tr><td colspan="5" data-style="text-align:center;color:var(--txt-mute);padding:14px">Nenhuma despesa no período</td></tr>`;

    secoes += `
      <div data-style="display:flex;align-items:center;gap:10px;margin:18px 0 10px">
        <div data-style="width:3px;height:18px;background:var(--rose);border-radius:2px"></div>
        <h4 data-style="font-family:var(--serif);font-size:15px;font-weight:600;color:var(--rose)">🔧 Despesas / Manutenções (${despesas.length})</h4>
      </div>
      <div class="tbl-scroll"><table>
        <thead><tr><th>Data</th><th>Manutenção</th><th>Responsável</th><th>Status</th><th data-style="text-align:right">Custo</th></tr></thead>
        <tbody>${linhasDesp}</tbody>
      </table></div>`;
  }

  // Cards de resumo: 4 cards (Receitas/Aluguéis, Encargos, Despesas, Saldo)
  // Se o filtro não é completo, simplifica para 2 cards
  let summaryCards;
  if(tipoFiltro === 'COMPLETO'){
    summaryCards = `
      <div class="extrato-summary" data-style="grid-template-columns:repeat(4,1fr)">
        <div class="extrato-box rec"><div class="lbl">Aluguéis</div><div class="val" data-style="font-size:18px">${fmtBRL2(totalAlugueis)}</div></div>
        <div class="extrato-box" data-style="background:rgba(70,182,196,.08);border-color:rgba(70,182,196,.2)"><div class="lbl">Encargos <span data-style="font-size:9px;opacity:.7">(informativo)</span></div><div class="val" data-style="color:#46b6c4;font-size:18px">${fmtBRL2(totalEncargos)}</div></div>
        <div class="extrato-box desp"><div class="lbl">Despesas</div><div class="val" data-style="font-size:18px">${fmtBRL2(totalDespesas)}</div></div>
        <div class="extrato-box saldo"><div class="lbl">Saldo <span data-style="font-size:9px;opacity:.7">(alug. − desp.)</span></div><div class="val" data-style="font-size:18px">${saldo<0?'- ':''}${fmtBRL2(Math.abs(saldo))}</div></div>
      </div>`;
  } else {
    summaryCards = `
      <div class="extrato-summary">
        <div class="extrato-box rec"><div class="lbl">Receitas (${tipoLabel})</div><div class="val">${fmtBRL2(totalReceitas)}</div></div>
        <div class="extrato-box desp"><div class="lbl">Despesas</div><div class="val">${fmtBRL2(totalDespesas)}</div></div>
        <div class="extrato-box saldo"><div class="lbl">Saldo</div><div class="val">${saldo<0?'- ':''}${fmtBRL2(Math.abs(saldo))}</div></div>
      </div>`;
  }

  const body = `
    <div data-style="background:var(--bg-soft);border:1px solid var(--line-soft);border-radius:12px;padding:16px;margin-bottom:18px">
      <div data-style="font-family:var(--serif);font-size:20px;font-weight:600;letter-spacing:-.4px">${esc(im.Nome_Imovel)}</div>
      <div data-style="font-size:13px;color:var(--txt-dim);margin-top:3px">${esc((im.Endereco_Imovel||'')+(im.Complemento_Imovel?' · '+im.Complemento_Imovel:''))}</div>
      <div data-style="display:flex;gap:16px;margin-top:6px;flex-wrap:wrap">
        <span data-style="font-size:13px;color:var(--txt-mute)">📅 Período: ${periodoFmt}</span>
        <span data-style="font-size:13px;color:var(--amber);font-weight:600">Extrato: ${tipoLabel}</span>
      </div>
    </div>
    ${summaryCards}
    ${secoes}`;

  window._rptImovelDados = { im, recAlugueis, recEncargos, despesas, totalAlugueis, totalEncargos, totalDespesas, saldo, tipoFiltro, periodoFmt };
  showModal('Extrato — '+im.Nome_Imovel, body,
    `<button class="btn ghost" data-action="close-modal">Fechar</button>
     <button class="btn primary" data-action="gerar-extrato-imovel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>Gerar Relatório</button>`);
  document.querySelector('#modalBox').style.maxWidth = '960px';
}

/* === Relatório Inquilino === */
function abrirRelatorioInquilino(){
  const hoje = new Date().toISOString().slice(0,10);
  const umAnoAtras = new Date(); umAnoAtras.setFullYear(umAnoAtras.getFullYear()-1);
  const dtIni = umAnoAtras.toISOString().slice(0,10);

  showModal('Prestação de Contas do Inquilino',
    `<form id="repForm">
       <div class="form-grid">
         <div class="field full">
           <label>Inquilino</label>
           <input type="hidden" name="idContrato">
           <input type="text" id="repInqBusca" autocomplete="off" placeholder="Digite o nome do inquilino…"
                  data-on-input="rep-busca" data-on-focus="rep-busca">
           <div class="rep-busca-box" id="repInqResultados" data-style="display:none"></div>
         </div>
         <div class="field"><label>Data Inicial</label><input type="date" name="dtIni" value="${dtIni}"></div>
         <div class="field"><label>Data Final</label><input type="date" name="dtFim" value="${hoje}"></div>
       </div>
       <div data-style="font-size:12px;color:var(--txt-mute);margin-top:6px">Busque pelo nome e escolha o contrato — as datas se ajustam ao período dele.</div>
     </form>`,
    `<button class="btn ghost" data-action="close-modal">Cancelar</button>
     <button class="btn primary" data-action="gerar-rel-inquilino">Gerar Relatório</button>`);
}

/* Busca contratos pelo nome do inquilino (ou imóvel), ignorando acentos.
   ATIVOS primeiro, depois início mais recente. Cada item mostra badge de status. */
function repInqBuscar(q){
  const box = document.getElementById('repInqResultados');
  if(!box) return;
  const norm = s => String(s||'').toLowerCase().normalize('NFD').replace(/[^\x00-\x7f]/g,'');
  const termo = norm(q);
  const fmtP = d => d ? new Date(d+'T00:00').toLocaleDateString('pt-BR') : '';

  let lista = STATE.contratos.slice().sort((a,b)=>{
    const aA = a.Status_Contrato==='ATIVO'?0:1, bA = b.Status_Contrato==='ATIVO'?0:1;
    if(aA !== bA) return aA - bA;
    return (b.Data_Inicio_Contrato||'').localeCompare(a.Data_Inicio_Contrato||'');
  });
  if(termo) lista = lista.filter(c => norm((c.Nome_Inquilino||'')+' '+(c.Nome_Imovel||'')).includes(termo));

  box.style.display = '';
  box.innerHTML = lista.length ? lista.slice(0,50).map(c=>{
    const periodo = `${fmtP(c.Data_Inicio_Contrato)||'—'} a ${fmtP(c.Data_Fim_Contrato)||'atual'}`;
    return `<div class="rep-busca-item" data-action="rep-selecionar" data-id="${esc(c.ID_Contrato)}">
      <div data-style="flex:1;min-width:0">
        <div class="cell-strong">${esc(c.Nome_Inquilino||'—')}</div>
        <div class="cell-sub">${esc(c.Nome_Imovel||'')} · ${periodo}</div>
      </div>
      ${statusBadge(c.Status_Contrato)}
    </div>`;
  }).join('') : `<div class="rep-busca-vazio">Nenhum contrato encontrado para "${esc(q)}"</div>`;
}

/* Seleciona um contrato da busca: grava o ID, preenche o campo e ajusta as datas. */
function repInqSelecionar(id){
  const c = contratoPorId(id);
  if(!c) return;
  const form = document.getElementById('repForm');
  const fmtP = d => d ? new Date(d+'T00:00').toLocaleDateString('pt-BR') : '';
  const periodo = `${fmtP(c.Data_Inicio_Contrato)||'—'} a ${fmtP(c.Data_Fim_Contrato)||'atual'}`;
  form.elements['idContrato'].value = id;
  const inp = document.getElementById('repInqBusca');
  if(inp) inp.value = `${c.Nome_Inquilino||''} · ${c.Nome_Imovel||''} · ${periodo} (${optLabel(c.Status_Contrato)})`;
  const hoje = new Date().toISOString().slice(0,10);
  if(c.Data_Inicio_Contrato && form.elements['dtIni']) form.elements['dtIni'].value = String(c.Data_Inicio_Contrato).slice(0,10);
  if(form.elements['dtFim']) form.elements['dtFim'].value = c.Data_Fim_Contrato ? String(c.Data_Fim_Contrato).slice(0,10) : hoje;
  const box = document.getElementById('repInqResultados');
  if(box) box.style.display = 'none';
}

function gerarRelatorioInquilino(){
  const form = document.getElementById('repForm');
  const idContrato = form.elements['idContrato'].value;
  const dtIni = form.elements['dtIni'].value;
  const dtFim = form.elements['dtFim'].value;

  if(!idContrato){ toast('Busque e selecione um inquilino na lista.','err'); return; }
  const ct = contratoPorId(idContrato);
  if(!ct){ toast('Contrato não encontrado','err'); return; }
  // Mescla dados PESSOAIS do inquilino + dados de CONTRATO vindos do próprio
  // contrato (não dos campos legados do inquilino, que serão removidos da planilha).
  const inq = Object.assign({}, inquilinoPorId(ct.ID_Inquilino) || {}, {
    Nome_Inquilino: ct.Nome_Inquilino,
    Caucao_Valor: ct.Caucao_Valor,
    Caucao_Data: ct.Caucao_Data_Pagamento,   // data da caução vem do contrato
    ID_Imovel: ct.ID_Imovel,
  });
  const im = imovelPorId(ct.ID_Imovel);

  // Escopo ao PERÍODO DO CONTRATO (interseção com o período escolhido). Sem isso,
  // dois contratos do mesmo imóvel mostrariam as MESMAS cobranças (duplicação).
  const cIni = (ct.Data_Inicio_Contrato||'').slice(0,10);
  const cFim = (ct.Data_Fim_Contrato||'').slice(0,10);
  const effIni = (cIni && cIni > (dtIni||'')) ? cIni : (dtIni||'');           // o MAIOR início
  const effFim = cFim ? ((dtFim && dtFim < cFim) ? dtFim : cFim) : (dtFim||''); // o MENOR fim

  const todasCob = STATE.cobrancas
    .filter(c => Number(c.ID_Imovel) === Number(ct.ID_Imovel))
    .filter(c => {
      const dRef = c.Data_Vencimento;
      if(!dRef) return false;
      return (!effIni || dRef >= effIni) && (!effFim || dRef <= effFim);
    })
    .sort((a,b)=> new Date(a.Data_Vencimento) - new Date(b.Data_Vencimento));

  const pagas = todasCob.filter(c => c.Status_Cobranca === 'PAGO');
  const pendentes = todasCob.filter(c => c.Status_Cobranca === 'PENDENTE');
  const atrasadas = todasCob.filter(c => c.Status_Cobranca === 'ATRASADO');
  const parciais = todasCob.filter(c => c.Status_Cobranca === 'PARCIAL');

  const totalPago = pagas.reduce((s,c)=>s+(+c.Valor_Pago||+c.Valor_Cobrado||0), 0);
  const totalAtrasado = atrasadas.reduce((s,c)=>s+(+c.Valor_Cobrado||0), 0);
  const totalPendente = pendentes.reduce((s,c)=>s+(+c.Valor_Cobrado||0), 0);

  const periodoFmt = (dtIni?new Date(dtIni+'T00:00').toLocaleDateString('pt-BR'):'início') + ' até ' + (dtFim?new Date(dtFim+'T00:00').toLocaleDateString('pt-BR'):'hoje');

  const linhasPagas = pagas.length ? pagas.map(c=>`
    <tr>
      <td>${tipoBadge(c.Tipo_Cobranca)}</td>
      <td>${monthLabel(c.Competencia)}</td>
      <td>${new Date(c.Data_Vencimento+'T00:00').toLocaleDateString('pt-BR')}</td>
      <td>${c.Data_Pagamento ? new Date(c.Data_Pagamento+'T00:00').toLocaleDateString('pt-BR') : '—'}</td>
      <td>${esc(c.Forma_Pagamento||'—')}</td>
      <td class="money" data-style="color:var(--emerald)">${fmtBRL2(c.Valor_Pago||c.Valor_Cobrado)}</td>
    </tr>`).join('') : `<tr><td colspan="6" data-style="text-align:center;color:var(--txt-mute);padding:18px">Nenhuma cobrança paga no período</td></tr>`;

  const linhasPendentes = (atrasadas.concat(pendentes).concat(parciais));
  const linhasPendHtml = linhasPendentes.length ? linhasPendentes.map(c=>{
    const dias = diasAtraso(c.Data_Vencimento, c.Status_Cobranca);
    return `<tr>
      <td>${tipoBadge(c.Tipo_Cobranca)}</td>
      <td>${monthLabel(c.Competencia)}</td>
      <td>${new Date(c.Data_Vencimento+'T00:00').toLocaleDateString('pt-BR')}</td>
      <td>${statusBadge(c.Status_Cobranca)}</td>
      <td data-style="text-align:center;color:${dias>0?'var(--rose)':'var(--txt-mute)'};font-weight:600">${dias>0?dias+' d':'—'}</td>
      <td class="money" data-style="color:var(--rose)">${fmtBRL2(c.Valor_Cobrado)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" data-style="text-align:center;color:var(--txt-mute);padding:18px">Sem pendências no período 🎉</td></tr>`;

  const body = `
    <div data-style="background:var(--bg-soft);border:1px solid var(--line-soft);border-radius:12px;padding:16px;margin-bottom:18px">
      <div data-style="font-family:var(--serif);font-size:20px;font-weight:600;letter-spacing:-.4px">${esc(inq.Nome_Inquilino)}</div>
      <div data-style="font-size:13px;color:var(--txt-dim);margin-top:3px">${im?esc(im.Nome_Imovel):''} ${inq.Telefone_Inquilino?'· '+esc(inq.Telefone_Inquilino):''}</div>
      <div data-style="font-size:13px;color:var(--txt-mute);margin-top:6px">Período: ${periodoFmt}</div>
    </div>
    <div class="extrato-summary">
      <div class="extrato-box rec"><div class="lbl">Total Pago</div><div class="val">${fmtBRL2(totalPago)}</div></div>
      <div class="extrato-box desp"><div class="lbl">Em Atraso</div><div class="val">${fmtBRL2(totalAtrasado)}</div></div>
      <div class="extrato-box saldo"><div class="lbl">A Vencer</div><div class="val">${fmtBRL2(totalPendente)}</div></div>
    </div>
    ${inq.Caucao_Valor ? `
    <div data-style="background:rgba(224,162,60,.07);border:1px solid rgba(224,162,60,.22);border-left:3px solid var(--amber);border-radius:10px;padding:13px 16px;margin-bottom:18px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <div data-style="flex:1;min-width:0">
        <div data-style="font-size:10.5px;color:var(--amber);letter-spacing:.6px;text-transform:uppercase;font-weight:600">Caução depositada · Garantia locatícia</div>
        <div data-style="font-family:var(--serif);font-size:21px;font-weight:700;color:var(--amber);margin-top:1px">${fmtBRL2(inq.Caucao_Valor)}</div>
        <div data-style="font-size:11px;color:var(--txt-mute);margin-top:2px">Valor retido como garantia — não compõe o Total Pago do período.</div>
      </div>
      ${inq.Caucao_Data ? `<div data-style="font-size:12.5px;color:var(--txt-dim);text-align:right;white-space:nowrap">Depositada em<br><strong>${new Date(inq.Caucao_Data+'T00:00').toLocaleDateString('pt-BR')}</strong></div>` : ''}
    </div>` : ''}
    <h4 data-style="font-family:var(--serif);font-size:16px;margin-bottom:10px;color:var(--emerald)">✓ Contas Pagas (${pagas.length})</h4>
    <div class="tbl-scroll" data-style="margin-bottom:18px"><table>
      <thead><tr><th>Tipo</th><th>Competência</th><th>Vencimento</th><th>Pago em</th><th>Forma</th><th data-style="text-align:right">Valor</th></tr></thead>
      <tbody>${linhasPagas}</tbody></table></div>
    <h4 data-style="font-family:var(--serif);font-size:16px;margin-bottom:10px;color:var(--rose)">⚠ Pendências e Atrasos (${linhasPendentes.length})</h4>
    <div class="tbl-scroll"><table>
      <thead><tr><th>Tipo</th><th>Competência</th><th>Vencimento</th><th>Status</th><th data-style="text-align:center">Atraso</th><th data-style="text-align:right">Valor</th></tr></thead>
      <tbody>${linhasPendHtml}</tbody></table></div>`;

  window._rptInqDados = { inq, im, pagas, atrasadas, pendentes, totalPago, totalAtrasado, totalPendente, periodoFmt };
  showModal('Prestação de Contas — '+inq.Nome_Inquilino, body,
    `<button class="btn ghost" data-action="close-modal">Fechar</button>
     <button class="btn primary" data-action="gerar-prestacao"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>Gerar Relatório</button>`);
  document.querySelector('#modalBox').style.maxWidth = '900px';
}

/* === Relatório Inadimplência === */
function abrirRelatorioInadimplencia(){
  // agrupa atrasados por inquilino
  const atrasos = STATE.cobrancas.filter(c => c.Status_Cobranca === 'ATRASADO');
  const grupos = {};
  atrasos.forEach(c => {
    const k = c.Responsavel_Pagamento || 'Sem nome';
    if(!grupos[k]) grupos[k] = { nome:k, imovel:c.Nome_Imovel, items:[], total:0 };
    grupos[k].items.push(c);
    grupos[k].total += (+c.Valor_Cobrado || 0);
  });
  const lista = Object.values(grupos).sort((a,b)=>b.total-a.total);
  const totalGeral = lista.reduce((s,g)=>s+g.total, 0);

  const blocos = lista.length ? lista.map(g => `
    <div data-style="border:1px solid var(--line-soft);border-radius:12px;overflow:hidden;margin-bottom:14px">
      <div data-style="padding:12px 16px;background:var(--bg-soft);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line-soft)">
        <div>
          <div class="cell-strong">${esc(g.nome)}</div>
          <div class="cell-sub">${esc(g.imovel)} · ${g.items.length} cobrança(s)</div>
        </div>
        <div class="money" data-style="color:var(--rose);font-size:18px">${fmtBRL2(g.total)}</div>
      </div>
      <div class="tbl-scroll"><table>
        <thead><tr><th>Tipo</th><th>Competência</th><th>Vencimento</th><th data-style="text-align:center">Atraso</th><th data-style="text-align:right">Valor</th></tr></thead>
        <tbody>${g.items.map(c=>{
          const dias = diasAtraso(c.Data_Vencimento, c.Status_Cobranca);
          return `<tr>
            <td>${tipoBadge(c.Tipo_Cobranca)}</td>
            <td>${monthLabel(c.Competencia)}</td>
            <td>${new Date(c.Data_Vencimento+'T00:00').toLocaleDateString('pt-BR')}</td>
            <td data-style="text-align:center;color:var(--rose);font-weight:600">${dias} d</td>
            <td class="money">${fmtBRL2(c.Valor_Cobrado)}</td>
          </tr>`;
        }).join('')}</tbody></table></div>
    </div>`).join('') : '<div class="empty"><div>Sem inadimplência 🎉</div></div>';

  const body = `
    <div class="extrato-summary" data-style="grid-template-columns:1fr 1fr">
      <div class="extrato-box desp"><div class="lbl">Total em Atraso</div><div class="val">${fmtBRL2(totalGeral)}</div></div>
      <div class="extrato-box saldo"><div class="lbl">Inquilinos Inadimplentes</div><div class="val">${lista.length}</div></div>
    </div>
    ${blocos}`;

  window._rptInadDados = { lista, totalGeral };
  showModal('Inadimplência Geral', body,
    `<button class="btn ghost" data-action="close-modal">Fechar</button>
     <button class="btn primary" data-action="gerar-inadimplencia"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>Gerar Relatório</button>`);
  document.querySelector('#modalBox').style.maxWidth = '900px';
}

