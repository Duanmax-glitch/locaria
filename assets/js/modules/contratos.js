/* ============================================================
   LOCARIA - modules/contratos.js
   Contratos: listagem, visualizacao, logica do formulario e geracao de documento.
   ============================================================ */
function renderContratos(){
  const f=filters.contratos;
  let rows=STATE.contratos.slice();
  if(f.st && f.st!=='TODOS') rows=rows.filter(c=>c.Status_Contrato===f.st);
  if(f.q){ const q=f.q.toLowerCase(); rows=rows.filter(c=>((c.Nome_Inquilino||'')+' '+(c.Nome_Imovel||'')).toLowerCase().includes(q)); }
  rows.sort((a,b)=> (b.Data_Inicio_Contrato||'').localeCompare(a.Data_Inicio_Contrato||''));

  const body=rows.length?rows.map(c=>{
    const fim = c.Data_Fim_Contrato ? new Date(c.Data_Fim_Contrato+'T00:00').toLocaleDateString('pt-BR') : '—';
    return `<tr>
      <td><div class="row-flex"><div class="av" style="background:${avColor(c.ID_Imovel)}">${initials(c.Nome_Inquilino)}</div>
        <div><div class="cell-strong">${esc(c.Nome_Inquilino||'—')}</div><div class="cell-sub">${esc(c.ID_Contrato)}</div></div></div></td>
      <td>${esc(c.Nome_Imovel||'—')}</td>
      <td class="money">${fmtBRL2(c.Valor_Aluguel_Contratual)}</td>
      <td>Dia ${esc(c.Dia_Vencimento_Aluguel||'—')}</td>
      <td>${fim}</td>
      <td>${statusBadge(c.Status_Contrato)}</td>
      <td><div class="act-group">
        <button class="act-btn" title="Ver contrato" onclick="viewContrato('${c.ID_Contrato}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        ${c.ID_Doc_Contrato
          ? `<button class="act-btn" title="Ver contrato (PDF)" onclick="verContratoPdf('${c.ID_Contrato}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg></button>`
          : `<button class="act-btn" title="Criar documento (modelo)" onclick="criarDocContratoUI('${c.ID_Contrato}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15h6"/></svg></button>`}
        <button class="act-btn" title="Editar" onclick="openForm('contratos','${c.ID_Contrato}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="act-btn del" title="Excluir" onclick="askDelete('contratos','ID_Contrato','${c.ID_Contrato}','${escJs(c.Nome_Inquilino||c.ID_Contrato)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div></td>
    </tr>`;
  }).join('') : emptyRow(7,'Nenhum contrato encontrado');

  const existingTbody = document.querySelector('#view-contratos tbody');
  const existingSeg = document.querySelector('#view-contratos .seg');
  if(existingTbody && existingSeg){
    existingTbody.innerHTML = body;
    existingSeg.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.st===(f.st||'TODOS')));
    return;
  }
  const lbls={TODOS:'Todos',ATIVO:'Ativos',ENCERRADO:'Encerrados',SUSPENSO:'Suspensos'};
  $('#view-contratos').innerHTML=`
    <div class="table-tools">
      <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input placeholder="Buscar por inquilino ou imóvel…" value="${esc(f.q)}" oninput="filters.contratos.q=this.value;renderContratos()"></div>
      <div class="seg">${['TODOS','ATIVO','ENCERRADO','SUSPENSO'].map(s=>`<button class="${(f.st||'TODOS')===s?'on':''}" data-st="${s}" onclick="filters.contratos.st='${s}';renderContratos()">${lbls[s]}</button>`).join('')}</div>
    </div>
    <div class="tbl-card"><div class="tbl-scroll"><table>
      <thead><tr><th>Inquilino</th><th>Imóvel</th><th>Aluguel</th><th>Vencimento</th><th>Término</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody>${body}</tbody></table></div></div>`;
}

function viewContrato(idContrato){
  const c = contratoPorId(idContrato);
  if(!c){ toast('Contrato não encontrado','err'); return; }
  const row=(l,v)=>`<div class="dv-row"><span class="dv-l">${l}</span><span class="dv-v">${esc(v||'—')}</span></div>`;
  const grp=(title,ico,rows)=>`<div class="dv-grp"><div class="dv-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ico}</svg>${title}</div>${rows}</div>`;
  const ini = c.Data_Inicio_Contrato ? new Date(c.Data_Inicio_Contrato+'T00:00').toLocaleDateString('pt-BR') : '';
  const fim = c.Data_Fim_Contrato ? new Date(c.Data_Fim_Contrato+'T00:00').toLocaleDateString('pt-BR') : '';
  const vistorias = STATE.vistorias.filter(v=>String(v.ID_Contrato)===String(c.ID_Contrato) && String(v.ATIVO||'SIM').toUpperCase()!=='NAO');
  const reajustes = (STATE.reajustes||[]).filter(r=>String(r.ID_Contrato)===String(c.ID_Contrato) && String(r.ATIVO||'SIM').toUpperCase()!=='NAO')
    .sort((a,b)=>(b.Data_Reajuste||'').localeCompare(a.Data_Reajuste||''));

  const garantiaRows = c.Garantia_Tipo==='Caução'
    ? row('Caução', fmtBRL2(c.Caucao_Valor))
    : c.Garantia_Tipo==='Fiança'
      ? row('Fiador',c.Fiador_Nome)+row('CPF fiador',c.Fiador_CPF)+row('Celular fiador',c.Fiador_Celular)+row('Endereço fiador',c.Fiador_Endereco)
      : row('Garantia','Sem garantia');

  const vistoriasHtml = vistorias.length ? vistorias.map(v=>{
    const d = v.Data_Vistoria ? new Date(v.Data_Vistoria+'T00:00').toLocaleDateString('pt-BR') : '—';
    return `<div class="dv-row" style="cursor:pointer" onclick="closeModal();navigate('vistorias');viewVistoria('${v.ID_Vistoria}')"><span class="dv-l">${esc(v.Tipo_Vistoria)} · ${d}</span><span class="dv-v">${esc(v.Status_Imovel||'')}</span></div>`;
  }).join('') : row('', 'Nenhuma vistoria registrada');

  const body=`
    ${grp('Partes & Imóvel','<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
      row('Inquilino',c.Nome_Inquilino)+row('Imóvel',c.Nome_Imovel)+row('Natureza',c.Natureza_Locacao))}
    ${grp('Prazo & Valores','<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
      row('Prazo',c.Prazo_Meses?c.Prazo_Meses+' meses':'')+row('Início',ini)+row('Término',fim)+row('Aluguel',fmtBRL2(c.Valor_Aluguel_Contratual))+row('Vencimento',c.Dia_Vencimento_Aluguel?'dia '+c.Dia_Vencimento_Aluguel:'')+row('Multa rescisão',c.Multa_Rescisao_Alugueis?c.Multa_Rescisao_Alugueis+' aluguéis':'')+row('Renovação automática',c.Renovacao_Automatica)+row('Status',c.Status_Contrato))}
    ${grp('Garantia','<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', garantiaRows)}
    ${(c.Testemunha_1_Nome||c.Testemunha_2_Nome)?grp('Testemunhas','<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
      row('Testemunha 1',c.Testemunha_1_Nome)+row('Testemunha 2',c.Testemunha_2_Nome)):''}
    ${grp('Vistorias','<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', vistoriasHtml)}
    ${grp('Reajustes','<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
      (reajustes.length
        ? reajustes.map(r=>{
            const dr = r.Data_Reajuste ? new Date(r.Data_Reajuste+'T00:00').toLocaleDateString('pt-BR') : '—';
            return `<div class="dv-row"><span class="dv-l">${dr}${r.Observacao?' · '+esc(r.Observacao):''}</span><span class="dv-v">${fmtBRL2(r.Valor_Anterior)} → <strong>${fmtBRL2(r.Valor_Novo)}</strong></span></div>`;
          }).join('')
        : row('', 'Nenhum reajuste registrado'))
      + (aniversarioReajuste(c) ? `<div class="dv-row"><span class="dv-l">Próximo aniversário</span><span class="dv-v">${new Date(aniversarioReajuste(c)+'T00:00').toLocaleDateString('pt-BR')}</span></div>` : ''))}
    ${c.Observacoes?grp('Observações','<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', row('', c.Observacoes)):''}`;

  showModal(`Contrato · ${esc(c.Nome_Inquilino||'')}`, `<div class="detail-view">${body}</div>`,
    `<button class="btn ghost" onclick="closeModal()">Fechar</button>
     ${c.ID_Doc_Contrato
       ? `<button class="btn ghost" onclick="verContratoPdf('${c.ID_Contrato}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;margin-right:5px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>Ver contrato (PDF)</button>`
       : `<button class="btn ghost" onclick="criarDocContratoUI('${c.ID_Contrato}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;margin-right:5px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15h6"/></svg>Criar documento</button>`}
     ${c.Garantia_Tipo==='Caução' ? `<button class="btn ghost" onclick="gerarComprovanteCaucao('${c.ID_Contrato}')" style="color:#e0a23c;border-color:#e0a23c"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;margin-right:5px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Comprovante Caução</button>` : ''}
     ${c.Status_Contrato==='ATIVO' ? `<button class="btn ghost" onclick="reajustarAluguelUI('${c.ID_Contrato}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;margin-right:5px"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>Reajustar aluguel</button>` : ''}
     <button class="btn primary" onclick="openForm('contratos','${c.ID_Contrato}')">Editar</button>`);
}

function contratoFormUpdate(isNew, id){
  const form = $('#crudForm');
  if(!form) return;
  const selImovel = form.elements['ID_Imovel'];
  const selInquilino = form.elements['ID_Inquilino'];
  const selNatureza = form.elements['Natureza_Locacao'];
  const inpPrazo = form.elements['Prazo_Meses'];
  const inpInicio = form.elements['Data_Inicio_Contrato'];
  const inpFim = form.elements['Data_Fim_Contrato'];
  const selGarantia = form.elements['Garantia_Tipo'];
  const selStatus = form.elements['Status_Contrato'];

  // Calcula Data_Fim = Data_Inicio + Prazo_Meses (menos 1 dia)
  function calcFim(){
    if(!inpInicio || !inpFim || !inpPrazo) return;
    const ini = inpInicio.value, meses = parseInt(inpPrazo.value);
    if(!ini || !meses) return;
    const d = new Date(ini + 'T00:00');
    d.setMonth(d.getMonth() + meses);
    d.setDate(d.getDate() - 1);
    inpFim.value = d.toISOString().slice(0,10);
  }

  // Natureza puxada do imóvel selecionado
  function onImovelChange(){
    if(!selImovel || !selNatureza) return;
    const im = imovelPorId(selImovel.value);
    if(im && im.Natureza_Imovel) selNatureza.value = im.Natureza_Imovel;
    checkConflito();
  }

  // Pré-preenche os campos de quem pagou/recebeu a caução com valores padrão:
  // "Pago por" = inquilino do contrato; "Recebido por" = proprietário.
  // Só preenche quando o campo está VAZIO — nunca sobrescreve o que o operador digitou.
  function preencherCaucaoPadrao(){
    if(!selGarantia || selGarantia.value !== 'Caução') return;
    const inpPagoPor = form.elements['Caucao_Pago_Por'];
    const inpRecebidoPor = form.elements['Caucao_Recebido_Por'];
    if(inpPagoPor && !inpPagoPor.value.trim()){
      const inq = selInquilino ? inquilinoPorId(selInquilino.value) : null;
      if(inq && inq.Nome_Inquilino) inpPagoPor.value = inq.Nome_Inquilino;
    }
    if(inpRecebidoPor && !inpRecebidoPor.value.trim()){
      const prop = nomeProprietario();
      if(prop) inpRecebidoPor.value = prop;
    }
  }

  // Mostra/oculta campos de garantia
  function onGarantiaChange(){
    if(!selGarantia) return;
    const tipo = selGarantia.value;
    const setVis = (k, vis) => {
      const el = form.elements[k];
      if(el){ const field = el.closest('.field'); if(field) field.style.display = vis ? '' : 'none'; }
    };
    ['Caucao_Valor','Caucao_Status_Pagamento','Caucao_Valor_Pago','Caucao_Data_Pagamento',
     'Caucao_Forma_Pagamento','Caucao_Pago_Por','Caucao_Recebido_Por','Caucao_Observacao'].forEach(k => setVis(k, tipo === 'Caução'));
    ['Fiador_Nome','Fiador_Nacionalidade','Fiador_Estado_Civil','Fiador_Profissao','Fiador_RG',
     'Fiador_CPF','Fiador_Endereco','Fiador_Celular','Fiador_Email'].forEach(k => setVis(k, tipo === 'Fiança'));
    if(tipo === 'Caução') preencherCaucaoPadrao();
  }

  // Conflito: imóvel já alugado em outro contrato ATIVO
  function checkConflito(){
    if(!selImovel || !selStatus) return;
    if(selStatus.value !== 'ATIVO'){ removeWarning('imovelOcupadoWarn'); return; }
    const conflito = STATE.contratos.find(c =>
      String(c.ID_Imovel) === String(selImovel.value) &&
      c.Status_Contrato === 'ATIVO' &&
      String(c.ATIVO||'SIM').toUpperCase() !== 'NAO' &&
      String(c.ID_Contrato) !== String(id||'')
    );
    if(conflito){
      showWarning('imovelOcupadoWarn',
        `⚠ <strong>Imóvel já alugado:</strong> possui contrato ATIVO com <strong>${esc(conflito.Nome_Inquilino)}</strong>. Encerre o contrato atual antes, ou marque este como ENCERRADO/SUSPENSO.`);
    }else{
      removeWarning('imovelOcupadoWarn');
    }
  }

  // Auto-preenche Caucao_Valor_Pago quando tipo de pagamento muda para TOTAL
  function sincronizarValorCaucao(){
    const selStatusCaucao = form.elements['Caucao_Status_Pagamento'];
    const inpValorCaucao  = form.elements['Caucao_Valor'];
    const inpValorPago    = form.elements['Caucao_Valor_Pago'];
    if(!selStatusCaucao || !inpValorCaucao || !inpValorPago) return;
    if(selStatusCaucao.value === 'TOTAL') inpValorPago.value = inpValorCaucao.value;
  }

  if(selImovel)   selImovel.addEventListener('change', onImovelChange);
  if(selInquilino) selInquilino.addEventListener('change', preencherCaucaoPadrao);
  if(inpPrazo)    inpPrazo.addEventListener('input', calcFim);
  if(inpInicio)   inpInicio.addEventListener('change', calcFim);
  if(selGarantia) selGarantia.addEventListener('change', onGarantiaChange);
  if(selStatus)   selStatus.addEventListener('change', checkConflito);

  // Listeners de caução: tipo TOTAL → copia valor; valor muda com TOTAL selecionado → atualiza pago
  const _selSC = form.elements['Caucao_Status_Pagamento'];
  const _inpVC = form.elements['Caucao_Valor'];
  if(_selSC) _selSC.addEventListener('change', sincronizarValorCaucao);
  if(_inpVC) _inpVC.addEventListener('input',  sincronizarValorCaucao);

  // Estado inicial
  onGarantiaChange();
  checkConflito();
  if(isNew && selStatus && !selStatus.value) selStatus.value = 'ATIVO';
}

function _baixarBlob(blob, filename){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=filename;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ try{document.body.removeChild(a);}catch(_){} URL.revokeObjectURL(url); }, 1500);
}

/* Busca o contrato vinculado como PDF no backend e entrega para visualizar/compartilhar.
   Passa SOMENTE o ID_Contrato (chave imutável); o backend resolve o Doc por vínculo verificado. */
async function verContratoPdf(idContrato){
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const win = isMobile ? null : window.open('', '_blank');   // desktop: reserva a aba dentro do clique
  toast('Gerando PDF do contrato…');
  try{
    const r = await apiPost({ action:'getContratoPdf', idContrato });
    const bytes = Uint8Array.from(atob(r.pdfBase64), ch=>ch.charCodeAt(0));
    const blob  = new Blob([bytes], { type:'application/pdf' });
    if(isMobile){
      const file = new File([blob], r.nome, { type:'application/pdf' });
      if(navigator.canShare && navigator.canShare({ files:[file] })){
        try { await navigator.share({ files:[file], title: r.nome.replace('.pdf','').replace(/_/g,' ') }); }
        catch(e){ if(e.name!=='AbortError') _baixarBlob(blob, r.nome); }
      } else { _baixarBlob(blob, r.nome); }
    } else {
      const url = URL.createObjectURL(blob);
      if(win) win.location = url; else window.open(url, '_blank');   // visualizar em nova aba
      setTimeout(()=>URL.revokeObjectURL(url), 60000);
    }
  }catch(e){
    if(win) win.close();
    toast('Erro: '+e.message, 'err');
  }
}

/* Cria o Google Doc do contrato a partir do modelo e abre para edição.
   O vínculo (ID_Doc_Contrato na linha + back-reference no Doc) é gravado pelo backend. */
async function criarDocContratoUI(idContrato){
  if(!confirm('Criar o documento deste contrato a partir do modelo?\nVocê poderá editá-lo no Google Docs.')) return;
  const win = window.open('', '_blank');   // reserva a aba dentro do gesto do clique
  toast('Criando documento…');
  try{
    const r = await apiPost({ action:'criarDocContrato', idContrato });
    toast('Documento criado! Abrindo para edição…');
    if(win) win.location = r.url; else window.open(r.url, '_blank');
    await loadData();              // atualiza o STATE para refletir o vínculo
    renderView(currentView);
  }catch(e){
    if(win) win.close();
    toast('Erro: '+e.message, 'err');
  }
}

/* ============================================================
   REAJUSTE DE ALUGUEL
   O operador digita o NOVO valor. O backend (ação reajustarAluguel) grava o
   histórico, atualiza o contrato e a regra de aluguel — tudo atomicamente.
   ============================================================ */
function _parseValorReaj(s){
  s = String(s||'').trim();
  if(s.indexOf(',')!==-1) s = s.replace(/\./g,'').replace(',','.');
  const n = Number(s);
  return isFinite(n) ? n : NaN;
}

function reajustarAluguelUI(idContrato){
  const c = contratoPorId(idContrato);
  if(!c){ toast('Contrato não encontrado','err'); return; }
  if(c.Status_Contrato !== 'ATIVO'){ toast('Só é possível reajustar contrato ATIVO.','err'); return; }
  const hoje = new Date().toISOString().slice(0,10);
  window._reajAtual = +c.Valor_Aluguel_Contratual || 0;
  showModal('Reajustar Aluguel',
    `<div class="form-grid">
       <div class="field full"><label>Inquilino · Imóvel</label>
         <input type="text" value="${esc((c.Nome_Inquilino||'—')+' · '+(c.Nome_Imovel||'—'))}" disabled></div>
       <div class="field"><label>Valor atual</label>
         <input type="text" value="${fmtBRL2(window._reajAtual)}" disabled></div>
       <div class="field"><label>Novo valor do aluguel (R$) *</label>
         <input id="reajNovoValor" type="text" inputmode="decimal" placeholder="0,00" oninput="reajPreview()"></div>
       <div class="field"><label>Data do reajuste *</label>
         <input id="reajData" type="date" value="${hoje}"></div>
       <div class="field"><label>Observação</label>
         <input id="reajObs" type="text" placeholder="Ex.: reajuste anual IGP-M"></div>
       <div class="field full" id="reajPreviewBox" style="font-size:13px;color:var(--txt-dim);min-height:18px"></div>
     </div>`,
    `<button class="btn ghost" onclick="closeModal()">Cancelar</button>
     <button class="btn primary" onclick="confirmarReajuste('${idContrato}')">Aplicar reajuste</button>`);
}

function reajPreview(){
  const box = document.getElementById('reajPreviewBox');
  if(!box) return;
  const atual = +window._reajAtual || 0;
  const novo = _parseValorReaj((document.getElementById('reajNovoValor')||{}).value);
  if(!(novo > 0) || !(atual > 0)){ box.innerHTML=''; return; }
  const dif = novo - atual;
  const pct = (dif/atual*100);
  const cor = dif >= 0 ? 'var(--emerald)' : 'var(--rose)';
  const sinal = dif >= 0 ? '+' : '';
  box.innerHTML = `Variação: <strong style="color:${cor}">${sinal}${fmtBRL2(dif)} (${sinal}${pct.toFixed(2).replace('.',',')}%)</strong>`;
}

async function confirmarReajuste(idContrato){
  const novo = _parseValorReaj((document.getElementById('reajNovoValor')||{}).value);
  const data = (document.getElementById('reajData')||{}).value;
  const obs  = (document.getElementById('reajObs')||{}).value || '';
  if(!(novo > 0)){ toast('Informe um novo valor válido.','err'); return; }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(data)){ toast('Informe a data do reajuste.','err'); return; }
  const btn = event.target; btn.textContent='Aplicando…'; btn.disabled=true;
  try{
    const resp = await apiPost({ action:'reajustarAluguel', idContrato, novoValor:novo, dataReajuste:data, observacao:obs });
    if(!resp || resp.ok === false) throw new Error((resp && resp.error) || 'Não foi possível reajustar.');
    await loadData();
    closeModal();
    renderView(currentView);
    toast('Aluguel reajustado.');
  }catch(e){
    toast('Erro: '+e.message,'err');
    btn.textContent='Aplicar reajuste'; btn.disabled=false;
  }
}

/* ============================================================
   SINO DE AVISOS DE REAJUSTE (barra superior)
   Mostra contratos cujo aniversário está a até 60 dias — aviso ANTES do
   prazo de comunicação (aniversário − 1 mês). Cada item pode ser ignorado.
   ============================================================ */
function atualizarSinoReajuste(){
  const badge = document.getElementById('reajBadge');
  const btn = document.getElementById('reajSinoBtn');
  const n = contratosReajusteProximos().length;
  // Sino amarelo quando há notificação (indicador principal, funciona em qualquer tela)
  if(btn) btn.classList.toggle('has-notif', n > 0);
  // Badge numérico (fora do botão → aparece também no celular)
  if(badge){
    if(n > 0){ badge.textContent = n; badge.style.display = 'flex'; }
    else { badge.style.display = 'none'; }
  }
  const dd = document.getElementById('reajDropdown');
  if(dd && dd.style.display !== 'none') renderReajusteDropdown();
}

function renderReajusteDropdown(){
  const dd = document.getElementById('reajDropdown');
  if(!dd) return;
  const lista = contratosReajusteProximos();
  if(!lista.length){
    dd.innerHTML = `<div style="padding:24px 16px;text-align:center;color:var(--txt-dim);font-size:13px">Nenhum reajuste a comunicar nos próximos 2 meses. 🎉</div>`;
    return;
  }
  const hoje = new Date().toISOString().slice(0,10);
  const fmt = d => d ? new Date(d+'T00:00').toLocaleDateString('pt-BR') : '—';
  dd.innerHTML = `
    <div style="padding:11px 13px 7px;font-weight:600;color:var(--txt);font-size:13px">🔔 Reajustes a comunicar</div>
    ${lista.map(c=>{
      const aniv = aniversarioReajuste(c);
      const prazo = prazoComunicarReajuste(c);
      const prazoVenc = prazo && prazo < hoje;
      return `<div style="padding:11px 13px;border-top:1px solid rgba(255,255,255,.06)">
        <div style="font-weight:600;color:var(--txt);font-size:13px">${esc(c.Nome_Inquilino||'—')}</div>
        <div style="font-size:12px;color:var(--txt-dim);margin-bottom:6px">${esc(c.Nome_Imovel||'—')} · ${fmtBRL2(c.Valor_Aluguel_Contratual)}</div>
        <div style="font-size:12px;color:var(--txt-dim)">Aniversário do contrato: <strong style="color:var(--txt)">${fmt(aniv)}</strong></div>
        <div style="font-size:12px;color:${prazoVenc?'var(--rose)':'var(--amber)'}">Comunicar até: <strong>${fmt(prazo)}</strong>${prazoVenc?' · vencido':''}</div>
        <div style="display:flex;gap:8px;margin-top:9px">
          <button class="btn primary" style="padding:5px 11px;font-size:12px" onclick="reajustarAluguelUI('${c.ID_Contrato}')">Reajustar</button>
          <button class="btn ghost" style="padding:5px 11px;font-size:12px" onclick="ignorarReajusteUI('${c.ID_Contrato}')">Ignorar</button>
        </div>
      </div>`;
    }).join('')}`;
}

function toggleReajusteDropdown(ev){
  if(ev) ev.stopPropagation();
  const dd = document.getElementById('reajDropdown');
  if(!dd) return;
  if(dd.style.display === 'none'){
    renderReajusteDropdown();
    dd.style.display = '';
    setTimeout(()=>document.addEventListener('click', _fecharReajDropdown), 0);
  } else {
    _fecharReajDropdown();
  }
}
function _fecharReajDropdown(ev){
  const dd = document.getElementById('reajDropdown');
  // clique dentro do dropdown não fecha (deixa os botões funcionarem)
  if(ev && dd && dd.contains(ev.target)) return;
  if(dd) dd.style.display = 'none';
  document.removeEventListener('click', _fecharReajDropdown);
}

async function ignorarReajusteUI(idContrato){
  const c = contratoPorId(idContrato);
  if(!c) return;
  const aniv = aniversarioReajuste(c);
  try{
    const resp = await apiPost({ action:'ignorarReajuste', idContrato, dispensarAte: aniv });
    if(!resp || resp.ok === false) throw new Error((resp && resp.error) || 'Não foi possível ignorar.');
    await loadData();
    atualizarSinoReajuste();
    renderReajusteDropdown();
    toast('Reajuste deste ciclo ignorado.');
  }catch(e){ toast('Erro: '+e.message,'err'); }
}
