/* ============================================================
   LOCARIA - modules/vistorias.js
   Vistorias: listagem e visualizacao.
   ============================================================ */
function renderVistorias(){
  const f=filters.vistorias;
  let rows=STATE.vistorias.slice();
  if(f.st && f.st!=='TODOS') rows=rows.filter(v=>v.Tipo_Vistoria===f.st);
  if(f.q){ const q=f.q.toLowerCase(); rows=rows.filter(v=>((v.Nome_Imovel||'')+' '+(v.Responsavel_Vistoria||'')).toLowerCase().includes(q)); }
  rows.sort((a,b)=> (b.Data_Vistoria||'').localeCompare(a.Data_Vistoria||''));

  const tipoBadge=t=>{
    const cor = t==='Entrada' ? 'var(--emerald)' : t==='Saída' ? 'var(--amber)' : 'var(--txt-dim)';
    return `<span data-style="font-size:11px;font-weight:600;color:${cor};border:1px solid ${cor};padding:2px 8px;border-radius:20px">${esc(t||'—')}</span>`;
  };
  const probBadge=s=>{
    const ok = s==='Sem problemas';
    const cor = ok ? 'var(--emerald)' : '#f06565';
    return `<span data-style="font-size:11px;font-weight:600;color:${cor}">${esc(s||'—')}</span>`;
  };
  const body=rows.length?rows.map(v=>{
    const d = v.Data_Vistoria ? new Date(v.Data_Vistoria+'T00:00').toLocaleDateString('pt-BR') : '—';
    return `<tr>
      <td><div class="cell-strong">${esc(v.Nome_Imovel||'—')}</div><div class="cell-sub">${esc(v.ID_Vistoria)}</div></td>
      <td>${tipoBadge(v.Tipo_Vistoria)}</td>
      <td>${d}</td>
      <td>${probBadge(v.Status_Imovel)}</td>
      <td>${esc(v.Responsavel_Vistoria||'—')}</td>
      <td><div class="act-group">
        <button class="act-btn" title="Comprovante (PDF)" data-action="comprovante-vistoria" data-id="${esc(v.ID_Vistoria)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg></button>
        <button class="act-btn" title="Ver vistoria" data-action="view-vistoria" data-id="${esc(v.ID_Vistoria)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        <button class="act-btn" title="Editar" data-action="form-open" data-sheet="vistorias" data-id="${esc(v.ID_Vistoria)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="act-btn del" title="Excluir" data-action="delete" data-sheet="vistorias" data-key="ID_Vistoria" data-id="${esc(v.ID_Vistoria)}" data-name="${esc(v.Nome_Imovel||v.ID_Vistoria)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div></td>
    </tr>`;
  }).join('') : emptyRow(6,'Nenhuma vistoria encontrada');

  const existingTbody = document.querySelector('#view-vistorias tbody');
  const existingSeg = document.querySelector('#view-vistorias .seg');
  if(existingTbody && existingSeg){
    existingTbody.innerHTML = body;
    existingSeg.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.st===(f.st||'TODOS')));
    return;
  }
  const lbls={TODOS:'Todas','Entrada':'Entrada','Saída':'Saída','Rotina':'Rotina'};
  $('#view-vistorias').innerHTML=`
    <div class="table-tools">
      <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input placeholder="Buscar por imóvel ou responsável…" value="${esc(f.q)}" data-on-input="filter-search" data-sheet="vistorias"></div>
      <div class="seg">${['TODOS','Entrada','Saída','Rotina'].map(s=>`<button class="${(f.st||'TODOS')===s?'on':''}" data-st="${s}" data-action="filter-status" data-sheet="vistorias">${lbls[s]}</button>`).join('')}</div>
    </div>
    <div class="tbl-card"><div class="tbl-scroll"><table>
      <thead><tr><th>Imóvel</th><th>Tipo</th><th>Data</th><th>Estado</th><th>Responsável</th><th>Ações</th></tr></thead>
      <tbody>${body}</tbody></table></div></div>`;
}

function viewVistoria(idVistoria){
  const v = STATE.vistorias.find(x=>String(x.ID_Vistoria)===String(idVistoria));
  if(!v){ toast('Vistoria não encontrada','err'); return; }
  const c = contratoPorId(v.ID_Contrato);
  const row=(l,val)=>`<div class="dv-row"><span class="dv-l">${l}</span><span class="dv-v">${esc(val||'—')}</span></div>`;
  const grp=(title,ico,rows)=>`<div class="dv-grp"><div class="dv-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ico}</svg>${title}</div>${rows}</div>`;
  const d = v.Data_Vistoria ? new Date(v.Data_Vistoria+'T00:00').toLocaleDateString('pt-BR') : '';
  const body=`
    ${grp('Vistoria','<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
      row('Imóvel',v.Nome_Imovel)+row('Inquilino',c?c.Nome_Inquilino:'—')+row('Tipo',v.Tipo_Vistoria)+row('Data',d)+row('Estado do imóvel',v.Status_Imovel)+row('Responsável',v.Responsavel_Vistoria))}
    ${v.Descricao_Problemas?grp('Problemas encontrados','<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>', row('', v.Descricao_Problemas)):''}
    ${v.Observacoes_Gerais?grp('Observações','<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', row('', v.Observacoes_Gerais)):''}`;
  showModal(`Vistoria · ${esc(v.Nome_Imovel||'')}`, `<div class="detail-view">${body}</div>`,
    `<button class="btn ghost" data-action="close-modal">Fechar</button>
     <button class="btn ghost" data-action="comprovante-vistoria" data-id="${esc(v.ID_Vistoria)}" data-style="color:#e0a23c;border-color:#e0a23c"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-style="width:15px;height:15px;margin-right:5px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>Comprovante PDF</button>
     <button class="btn primary" data-action="form-open" data-sheet="vistorias" data-id="${esc(v.ID_Vistoria)}">Editar</button>`);
}

