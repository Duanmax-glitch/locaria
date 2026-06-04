/* ============================================================
   LOCARIA - modules/imoveis.js
   Imoveis: listagem e visualizacao.
   ============================================================ */
function renderImoveis(){
  const f=filters.imoveis;
  let rows=STATE.imoveis.slice();
  if(f.st && f.st !== 'TODOS') rows = rows.filter(i => i.Status_Atual === f.st);
  if(f.q) rows=rows.filter(i=>(i.Nome_Imovel+' '+(i.Titular_Conta_Agua||'')+' '+(i.Endereco_Imovel||i.Endereco_Agua||'')+' '+(i.Bairro_Imovel||'')+' '+(i.Cidade_Imovel||'')).toLowerCase().includes(f.q.toLowerCase()));
  const inq=id=>{const c=contratoAtivoDoImovel(id);return c?c.Nome_Inquilino:'—';};
  const body=rows.length?rows.map(i=>`<tr>
      <td><div class="row-flex"><div class="av" style="background:${avColor(i.ID_Imovel)};border-radius:10px"><svg viewBox="0 0 24 24" width="16" fill="none" stroke="#fff" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg></div>
        <div><div class="cell-strong">${esc(i.Nome_Imovel)}</div><div class="cell-sub">${esc((i.Endereco_Imovel||i.Endereco_Agua||'')+((i.Complemento_Imovel||i.Complemento_Agua)?' · '+(i.Complemento_Imovel||i.Complemento_Agua):''))||'#'+i.ID_Imovel}</div></div></div></td>
      <td><div class="cell-strong" style="font-weight:500">${esc(i.Titular_Conta_Agua||'—')}</div><div class="cell-sub">${i.Cod_Concessionaria_Agua?'cód. '+esc(i.Cod_Concessionaria_Agua):''}</div></td>
      <td><div class="cell-strong" style="font-weight:500">${esc(i.Titular_Conta_Luz||'—')}</div><div class="cell-sub">${i.Cod_Concessionaria_Luz?'cód. '+esc(i.Cod_Concessionaria_Luz):''}</div></td>
      <td>${esc(inq(i.ID_Imovel))}</td>
      <td>${statusBadge(i.Status_Atual)}</td>
      <td><div class="act-group">
        <button class="act-btn" title="Detalhes" onclick="viewImovel('${i.ID_Imovel}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        <button class="act-btn" title="Editar" onclick="openForm('imoveis','${i.ID_Imovel}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="act-btn del" title="Excluir" onclick="askDelete('imoveis','ID_Imovel','${i.ID_Imovel}','${escJs(i.Nome_Imovel)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div></td>
    </tr>`).join('') : emptyRow(6,'Nenhum imóvel encontrado');

  const existingTbody = document.querySelector('#view-imoveis tbody');
  const existingSeg = document.querySelector('#view-imoveis .seg');
  if(existingTbody && existingSeg){
    existingTbody.innerHTML = body;
    existingSeg.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.st===(f.st||'TODOS')));
    return;
  }

  const lblsIm = {TODOS:'Todos',ALUGADO:'Alugados',VAGO:'Vagos',MANUTENCAO:'Em Manutenção'};
  $('#view-imoveis').innerHTML=`
    <div class="table-tools">
      <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input id="imovSearch" placeholder="Buscar por imóvel, titular ou endereço…" value="${esc(f.q)}" oninput="filters.imoveis.q=this.value;renderImoveis()"></div>
      <div class="seg">${['TODOS','ALUGADO','VAGO','MANUTENCAO'].map(s=>`<button class="${(f.st||'TODOS')===s?'on':''}" data-st="${s}" onclick="filters.imoveis.st='${s}';renderImoveis()">${lblsIm[s]}</button>`).join('')}</div>
    </div>
    <div class="tbl-card"><div class="tbl-scroll"><table>
      <thead><tr><th>Imóvel</th><th>Titular água</th><th>Titular luz</th><th>Inquilino atual</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody>${body}</tbody></table></div></div>`;
}

function viewImovel(id){
  const i=STATE.imoveis.find(x=>String(x.ID_Imovel)===String(id)); if(!i)return;
  const inq=contratoAtivoDoImovel(id);
  const row=(l,v)=>`<div class="dv-row"><span class="dv-l">${l}</span><span class="dv-v">${esc(v||'—')}</span></div>`;
  const grp=(title,ico,rows)=>`<div class="dv-grp"><div class="dv-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ico}</svg>${title}</div>${rows}</div>`;
  const dataCadFmt = i.Data_Cadastro ? new Date(i.Data_Cadastro+'T00:00').toLocaleDateString('pt-BR') : '—';
  const cidadeUf = [i.Cidade_Imovel, i.Estado_Imovel].filter(Boolean).join('/');
  const body=`
    ${grp('Identificação','<path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>',
      row('Nome',i.Nome_Imovel)+row('Natureza',i.Natureza_Imovel)+row('Endereço',i.Endereco_Imovel)+row('Complemento',i.Complemento_Imovel)+row('Bairro',i.Bairro_Imovel)+row('Cidade / UF',cidadeUf)+row('CEP',i.CEP_Imovel)+row('Inscrição IPTU',i.Inscricao_IPTU)+row('Matrícula',i.Matricula_Imovel)+row('Status',i.Status_Atual)+row('Data de Cadastro',dataCadFmt)+row('Inquilino atual',inq?inq.Nome_Inquilino:'—'))}
    ${grp('Conta de Água','<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
      row('Endereço',i.Endereco_Agua)+row('Complemento',i.Complemento_Agua)+row('Concessionária (cód.)',i.Cod_Concessionaria_Agua)+row('Titular',i.Titular_Conta_Agua)+row('CPF',i.CPF_Titular_Agua)+row('Vencimento',i.Dia_Vencimento_Agua?'dia '+i.Dia_Vencimento_Agua:''))}
    ${grp('Conta de Luz','<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
      row('Endereço',i.Endereco_Luz)+row('Complemento',i.Complemento_Luz)+row('Concessionária (cód.)',i.Cod_Concessionaria_Luz)+row('Titular',i.Titular_Conta_Luz)+row('CPF',i.CPF_Titular_Luz)+row('Vencimento',i.Dia_Vencimento_Luz?'dia '+i.Dia_Vencimento_Luz:''))}
    ${grp('Condomínio & IPTU','<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6"/>',
      row('Condomínio',i.Valor_Condominio?fmtBRL2(i.Valor_Condominio):'')+row('Venc. condomínio',i.Dia_Vencimento_Condominio?'dia '+i.Dia_Vencimento_Condominio:'')+row('IPTU',i.Valor_IPTU?fmtBRL2(i.Valor_IPTU):'')+row('Venc. IPTU',i.Dia_Vencimento_IPTU?'dia '+i.Dia_Vencimento_IPTU:''))}`;
  showModal(esc(i.Nome_Imovel), `<div class="detail-view">${body}</div>`,
    `<button class="btn ghost" onclick="closeModal()">Fechar</button>
     <button class="btn primary" onclick="openForm('imoveis','${i.ID_Imovel}')">Editar</button>`);
}

