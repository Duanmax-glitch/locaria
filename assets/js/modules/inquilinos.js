/* ============================================================
   LOCARIA - modules/inquilinos.js
   Inquilinos: listagem e visualizacao.
   ============================================================ */
function renderInquilinos(){
  const f=filters.inquilinos;
  let rows=STATE.inquilinos.slice();
  if(f.q){
    const q=f.q.toLowerCase();
    rows=rows.filter(i=>(i.Nome_Inquilino||'').toLowerCase().includes(q)||(i.CPF_Inquilino||'').toLowerCase().includes(q));
  }
  const body=rows.length?rows.map(i=>{
    const cts=contratosDoInquilino(i.ID_Inquilino);
    const ativo=cts.find(c=>c.Status_Contrato==='ATIVO');
    const contratoInfo = ativo ? `${esc(ativo.Nome_Imovel||'—')} · ${statusBadge('ATIVO')}` : (cts.length?`${cts.length} contrato(s)`:'—');
    return `<tr>
      <td><div class="row-flex"><div class="av" style="background:${avColor(i.ID_Inquilino)}">${initials(i.Nome_Inquilino)}</div>
        <div><div class="cell-strong">${esc(i.Nome_Inquilino)}</div><div class="cell-sub">${esc(i.CPF_Inquilino||i.ID_Inquilino)}</div></div></div></td>
      <td><a href="https://wa.me/55${(i.Telefone_Inquilino||'').replace(/\D/g,'')}" target="_blank" style="color:var(--emerald);text-decoration:none">${esc(i.Telefone_Inquilino||'—')}</a></td>
      <td>${esc(i.Email_Inquilino||'—')}</td>
      <td>${contratoInfo}</td>
      <td><div class="act-group">
        <button class="act-btn" title="Ver cadastro completo" onclick="viewInquilino('${i.ID_Inquilino}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        <button class="act-btn" title="Editar" onclick="openForm('inquilinos','${i.ID_Inquilino}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="act-btn del" title="Excluir" onclick="askDelete('inquilinos','ID_Inquilino','${i.ID_Inquilino}','${escJs(i.Nome_Inquilino)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div></td>
    </tr>`;
  }).join('') : emptyRow(5,'Nenhum inquilino encontrado');

  const existingTbody = document.querySelector('#view-inquilinos tbody');
  if(existingTbody){ existingTbody.innerHTML = body; return; }

  $('#view-inquilinos').innerHTML=`
    <div class="table-tools">
      <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input id="inqSearch" placeholder="Buscar por nome ou CPF…" value="${esc(f.q)}" oninput="filters.inquilinos.q=this.value;renderInquilinos()"></div>
    </div>
    <div class="tbl-card"><div class="tbl-scroll"><table>
      <thead><tr><th>Inquilino</th><th>Telefone</th><th>E-mail</th><th>Contrato atual</th><th>Ações</th></tr></thead>
      <tbody>${body}</tbody></table></div></div>`;
}

/* Visualizar cadastro completo do inquilino (dados pessoais + contratos vinculados) */
function viewInquilino(idInquilino){
  const i = inquilinoPorId(idInquilino);
  if(!i){ toast('Inquilino não encontrado','err'); return; }
  const cts = contratosDoInquilino(i.ID_Inquilino);

  const row=(l,v)=>`<div class="dv-row"><span class="dv-l">${l}</span><span class="dv-v">${esc(v||'—')}</span></div>`;
  const grp=(title,ico,rows)=>`<div class="dv-grp"><div class="dv-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ico}</svg>${title}</div>${rows}</div>`;

  const contratosHtml = cts.length ? cts.map(c=>{
    const fim = c.Data_Fim_Contrato ? new Date(c.Data_Fim_Contrato+'T00:00').toLocaleDateString('pt-BR') : '—';
    return `<div class="dv-row" style="cursor:pointer" onclick="closeModal();navigate('contratos');viewContrato('${c.ID_Contrato}')">
      <span class="dv-l">${esc(c.Nome_Imovel||'—')}</span>
      <span class="dv-v">${fmtBRL2(c.Valor_Aluguel_Contratual)} · até ${fim} · ${esc(c.Status_Contrato||'')}</span></div>`;
  }).join('') : row('', 'Nenhum contrato vinculado');

  const body = `
    ${grp('Dados Pessoais','<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      row('Nome completo', i.Nome_Inquilino) +
      row('Nacionalidade', i.Nacionalidade_Inquilino) +
      row('Estado civil', optLabel(i.Estado_Civil_Inquilino||'')) +
      row('Profissão', i.Profissao_Inquilino) +
      row('CPF', i.CPF_Inquilino) +
      row('RG', i.RG_Inquilino) +
      row('E-mail', i.Email_Inquilino) +
      row('Telefone', i.Telefone_Inquilino)
    )}
    ${(i.Nome_Conjuge)?grp('Cônjuge','<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
      row('Nome', i.Nome_Conjuge)+row('CPF', i.CPF_Conjuge)+row('RG', i.RG_Conjuge)):''}
    ${grp('Contratos','<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>', contratosHtml)}`;

  showModal(esc(i.Nome_Inquilino), `<div class="detail-view">${body}</div>`,
    `<button class="btn ghost" onclick="closeModal()">Fechar</button>
     <button class="btn primary" onclick="openForm('inquilinos','${i.ID_Inquilino}')">Editar</button>`);
}

