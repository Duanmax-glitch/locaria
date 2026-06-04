/* ============================================================
   LOCARIA - modules/manutencoes.js
   Manutencoes: listagem e controle.
   ============================================================ */
function renderManutencoes(){
  const f = filtroManut;
  let rows = (STATE.manutencoes||[]).slice().sort((a,b)=> new Date(b.Data_Abertura)-new Date(a.Data_Abertura));
  if(f.st !== 'TODOS') rows = rows.filter(m => m.Status === f.st);
  if(f.q){
    const ql = f.q.toLowerCase();
    rows = rows.filter(m => {
      const im = STATE.imoveis.find(x=>Number(x.ID_Imovel)===Number(m.ID_Imovel));
      return (m.Titulo+' '+(m.Descricao||'')+' '+(m.Responsavel||'')+' '+(im?im.Nome_Imovel:'')).toLowerCase().includes(ql);
    });
  }

  const totAberto = (STATE.manutencoes||[]).filter(m=>m.Status==='ABERTO').length;
  const totAndamento = (STATE.manutencoes||[]).filter(m=>m.Status==='EM_ANDAMENTO').length;
  const totGasto = (STATE.manutencoes||[]).filter(m=>m.Status==='CONCLUIDO').reduce((s,m)=>s+(+m.Custo||0),0);

  const imName = id => { const im = STATE.imoveis.find(x=>Number(x.ID_Imovel)===Number(id)); return im?im.Nome_Imovel:'—'; };

  const body = rows.length ? rows.map(m=>`
    <tr>
      <td><div class="cell-strong">${esc(m.Titulo)}</div><div class="cell-sub">${esc(m.Descricao||'')}</div></td>
      <td><div class="row-flex"><div class="av" style="background:${avColor(m.ID_Imovel)}">${initials(imName(m.ID_Imovel))}</div><div class="cell-strong">${esc(imName(m.ID_Imovel))}</div></div></td>
      <td>${esc(m.Responsavel||'—')}</td>
      <td>${m.Data_Abertura ? new Date(m.Data_Abertura+'T00:00').toLocaleDateString('pt-BR') : '—'}</td>
      <td>${m.Data_Conclusao ? new Date(m.Data_Conclusao+'T00:00').toLocaleDateString('pt-BR') : '—'}</td>
      <td class="money">${m.Custo?fmtBRL2(m.Custo):'<span style="color:var(--txt-mute)">—</span>'}</td>
      <td>${statusManutBadge(m.Status)}</td>
      <td><div class="act-group">
        <button class="act-btn" title="Editar" onclick="openForm('manutencoes','${m.ID_Manutencao}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="act-btn del" title="Excluir" onclick="askDelete('manutencoes','ID_Manutencao','${m.ID_Manutencao}','${escJs(m.Titulo)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div></td>
    </tr>`).join('') : emptyRow(8, 'Nenhuma manutenção registrada');

  // Preservar foco do input
  const existingTbody = document.querySelector('#view-manutencoes tbody');
  const existingSeg = document.querySelector('#view-manutencoes .seg');
  if(existingTbody && existingSeg){
    existingTbody.innerHTML = body;
    existingSeg.querySelectorAll('button').forEach(b=>{
      b.classList.toggle('on', b.dataset.st === f.st);
    });
    return;
  }

  const lblsM = {TODOS:'Todas',ABERTO:'Abertas',EM_ANDAMENTO:'Em Andamento',CONCLUIDO:'Concluídas',CANCELADO:'Canceladas'};
  $('#view-manutencoes').innerHTML = `
    <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="kpi">
        <div class="kpi-top"><div class="kpi-ico bl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div></div>
        <div class="kpi-label">Em Aberto</div>
        <div class="kpi-value">${totAberto}</div>
        <div class="kpi-foot">aguardando início</div>
      </div>
      <div class="kpi">
        <div class="kpi-top"><div class="kpi-ico am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div></div>
        <div class="kpi-label">Em Andamento</div>
        <div class="kpi-value">${totAndamento}</div>
        <div class="kpi-foot">em execução</div>
      </div>
      <div class="kpi">
        <div class="kpi-top"><div class="kpi-ico ro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div></div>
        <div class="kpi-label">Total Gasto (Concluídas)</div>
        <div class="kpi-value">${fmtBRL2(totGasto)}</div>
        <div class="kpi-foot">soma das manutenções concluídas</div>
      </div>
    </div>
    <div class="table-tools">
      <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input id="manutSearch" placeholder="Buscar por título, imóvel ou responsável…" value="${esc(f.q)}" oninput="filtroManut.q=this.value;renderManutencoes()"></div>
      <div class="seg">${['TODOS','ABERTO','EM_ANDAMENTO','CONCLUIDO','CANCELADO'].map(s=>`<button class="${f.st===s?'on':''}" data-st="${s}" onclick="filtroManut.st='${s}';renderManutencoes()">${lblsM[s]}</button>`).join('')}</div>
    </div>
    <div class="tbl-card"><div class="tbl-scroll"><table>
      <thead><tr><th>Manutenção</th><th>Imóvel</th><th>Responsável</th><th>Abertura</th><th>Conclusão</th><th>Custo</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody>${body}</tbody></table></div></div>`;
}

