/* ============================================================
   LOCARIA - modules/cobrancas.js
   Cobrancas: geracao automatica, listagem e logica do formulario de cobranca.
   ============================================================ */
/* ============================================================
   GERAÇÃO AUTOMÁTICA DE COBRANÇAS PELAS REGRAS
   Roda silenciosamente a cada loadData — sem interação
   ============================================================ */
async function gerarCobrancasAutomaticas(){
  const now = new Date();
  const Y = now.getFullYear();
  const M = String(now.getMonth()+1).padStart(2,'0');
  const comp = Y+'-'+M;
  const pad = n => String(n).padStart(2,'0');

  const regrasAtivas = (STATE.regras||[]).filter(r => r.Gerar_Automatico==='SIM' && r.Status_Regra==='ATIVA');
  if(!regrasAtivas.length) return;

  const ctrlKey = 'locaria_gerado_'+comp;

  // Verifica se todas as regras já têm cobrança gerada com a competência correta
  // ALUGUEL/CONDOMINIO/IPTU → competência = mês atual
  // AGUA/LUZ → competência = mês anterior
  const mesAtual   = Y+'-'+M;
  const mesAnterior = now.getMonth() === 0
    ? (Y-1)+'-12'
    : Y+'-'+pad(now.getMonth());

  const todasJaExistem = regrasAtivas.every(r => {
    const tipo = String(r.Tipo_Cobranca).toUpperCase().trim();
    const compEsperada = (tipo==='AGUA'||tipo==='LUZ'||tipo==='ALUGUEL') ? mesAnterior : mesAtual;
    return STATE.cobrancas.some(c =>
      Number(c.ID_Imovel)===Number(r.ID_Imovel) &&
      String(c.Tipo_Cobranca).toUpperCase().trim()===tipo &&
      String(c.Competencia||'').trim().slice(0,7)===compEsperada
    );
  });
  if(todasJaExistem){
    localStorage.setItem(ctrlKey,'1');
    return;
  }

  // Conjunto auxiliar (usado no forEach abaixo como fallback rápido)
  const jaExistem = new Set(); // preenchido dinamicamente no forEach

  const novas = [];
  let numAtual = Math.max(0, ...STATE.cobrancas.map(c=>parseInt(String(c.ID_Cobranca).replace(/\D/g,''))||0));

  // Regra de competência por tipo (padrão brasileiro):
  // ALUGUEL, CONDOMINIO, IPTU → competência = mês da geração, vencimento = mesmo mês
  // AGUA, LUZ               → competência = mês anterior, vencimento = mês da geração
  // Exemplo: geração em junho/2026
  //   Aluguel: comp=2026-06, venc=2026-06-07
  //   Água:    comp=2026-05, venc=2026-06-10
  //   Luz:     comp=2026-05, venc=2026-06-08

  regrasAtivas.forEach(r => {
    const tipo = String(r.Tipo_Cobranca).toUpperCase().trim();
    // AGUA, LUZ e ALUGUEL: "usa depois paga" → competência = mês anterior
    const isEncargo = tipo === 'AGUA' || tipo === 'LUZ' || tipo === 'ALUGUEL';

    let compAno = Y, compMes = now.getMonth() + 1; // 1-based
    if(isEncargo){
      compMes -= 1;
      if(compMes < 1){ compMes = 12; compAno -= 1; }
    }
    const compStr = compAno+'-'+pad(compMes);

    // Verifica duplicata pela competência correta do tipo
    const keyComp = Number(r.ID_Imovel)+':'+tipo+':'+compStr;
    const jaTemEsseComp = STATE.cobrancas.some(c =>
      Number(c.ID_Imovel)===Number(r.ID_Imovel) &&
      String(c.Tipo_Cobranca).toUpperCase().trim()===tipo &&
      String(c.Competencia||'').trim().slice(0,7)===compStr
    );
    if(jaTemEsseComp) return;

    const im = STATE.imoveis.find(x=>Number(x.ID_Imovel)===Number(r.ID_Imovel));
    if(!im) return;
    const inq = contratoAtivoDoImovel(r.ID_Imovel);

    // Dia de vencimento: sempre no mês da geração (now)
    let diaVenc = 10;
    if(tipo==='ALUGUEL' && inq) diaVenc = +inq.Dia_Vencimento_Aluguel || 10;
    else if(tipo==='AGUA')       diaVenc = +im.Dia_Vencimento_Agua    || 10;
    else if(tipo==='LUZ')        diaVenc = +im.Dia_Vencimento_Luz     || 10;
    else if(tipo==='CONDOMINIO') diaVenc = +im.Dia_Vencimento_Condominio || 5;
    else if(tipo==='IPTU')       diaVenc = +im.Dia_Vencimento_IPTU    || 20;

    // Vencimento: sempre no mês da geração (Y/M)
    const ultimoDia = new Date(Y, now.getMonth()+1, 0).getDate();
    const diaFinal  = Math.min(diaVenc, ultimoDia);
    const dataVenc  = Y+'-'+M+'-'+pad(diaFinal);

    numAtual++;
    novas.push({
      ID_Cobranca: 'COB_'+String(numAtual).padStart(4,'0'),
      ID_Imovel: Number(r.ID_Imovel),
      Nome_Imovel: im.Nome_Imovel,
      Tipo_Cobranca: r.Tipo_Cobranca,
      Valor_Cobrado: +r.Valor_Padrao || 0,
      Competencia: compStr,       // mês anterior para água/luz
      Data_Vencimento: dataVenc,  // sempre mês da geração
      Status_Cobranca: 'PENDENTE',
      Valor_Pago:'', Data_Pagamento:'',
      Recebido_Por:'', Forma_Pagamento:'',
      Responsavel_Pagamento: inq ? inq.Nome_Inquilino : '',
      Observacao_Pagamento:'Gerado automaticamente por regra',
    });
  });

  if(!novas.length){
    localStorage.setItem(ctrlKey,'1'); // já existiam todas, marca como processado
    return;
  }

  try {
    if(LIVE()){
      for(const c of novas){
        await apiPost({action:'create', sheet:'cobrancas', key:'ID_Cobranca', record:c});
      }
      // Recarrega cobranças do servidor para refletir os novos registros
      const d = await apiGet();
      STATE.cobrancas = d.cobrancas || STATE.cobrancas;
    } else {
      novas.forEach(c => STATE.cobrancas.push(c));
    }
    localStorage.setItem(ctrlKey,'1');
    console.log('[Locaria] '+novas.length+' cobrança(s) gerada(s) automaticamente para '+comp);
    toast(novas.length+' cobrança(s) gerada(s) para '+comp.replace('-','/')+'  ✓');
  } catch(e){
    console.warn('[Locaria] Erro na geração automática:', e.message);
  }
}

function renderCobrancas(){
  const f=filters.cobrancas;
  // PAGOs não aparecem mais nesta tela — vão para Histórico de Pagamentos
  let rows=STATE.cobrancas.filter(c=>c.Status_Cobranca!=='PAGO').slice().sort((a,b)=> new Date(b.Data_Vencimento)-new Date(a.Data_Vencimento));
  
  const hoje = new Date();
  if(f.st === 'ATRASADAS_ANTIGAS'){
     rows = rows.filter(c => {
        return c.Status_Cobranca !== 'PAGO' && new Date(c.Data_Vencimento+'T00:00') < hoje;
     });
  }else if(f.st!=='TODOS' && f.st!=='PAGO'){
     rows=rows.filter(c=>c.Status_Cobranca===f.st);
  }

  if(f.q) rows=rows.filter(c=>(c.Nome_Imovel+' '+c.Responsavel_Pagamento).toLowerCase().includes(f.q.toLowerCase()));
  const body=rows.length?rows.map(c=>{
    const dias=diasAtraso(c.Data_Vencimento,c.Status_Cobranca);
    const valorTotal = +c.Valor_Cobrado || 0;
    const valorPago = +c.Valor_Pago || 0;
    const restante = Math.max(0, valorTotal - valorPago);
    const isParcial = c.Status_Cobranca === 'PARCIAL';
    // Para PARCIAL, mostra "R$ 600 (devido R$ 450)"; para outros mostra só o valor
    const valorCell = isParcial ?
      `<div class="money">${fmtBRL2(valorTotal)}</div><div style="font-size:11px;color:var(--rose);font-weight:600;margin-top:2px">Restante: ${fmtBRL2(restante)}</div>` :
      `<span class="money">${fmtBRL2(valorTotal)}</span>`;
    return `<tr onclick="openPagamentoModal('${c.ID_Cobranca}')" style="cursor:pointer" class="tr-clickable">
      <td><div class="row-flex"><div class="av" style="background:${avColor(c.ID_Imovel)}">${initials(c.Nome_Imovel)}</div>
        <div><div class="cell-strong">${esc(c.Nome_Imovel)}</div><div class="cell-sub">${esc(c.Responsavel_Pagamento)}</div></div></div></td>
      <td>${tipoBadge(c.Tipo_Cobranca)}</td>
      <td>${monthLabel(c.Competencia)}</td>
      <td>${new Date(c.Data_Vencimento+'T00:00').toLocaleDateString('pt-BR')}${dias>0?` <span style="color:var(--rose);font-size:11px">(${dias}d)</span>`:''}</td>
      <td>${valorCell}</td>
      <td>${statusBadge(c.Status_Cobranca)}</td>
      <td onclick="event.stopPropagation()"><div class="act-group">
        <button class="act-btn" title="${isParcial?'Registrar pagamento do saldo':'Marcar como pago'}" onclick="openPagamentoModal('${c.ID_Cobranca}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg></button>
        <button class="act-btn" title="Editar" onclick="openForm('cobrancas','${c.ID_Cobranca}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="act-btn del" title="Excluir" onclick="askDelete('cobrancas','ID_Cobranca','${c.ID_Cobranca}','${escJs(c.Nome_Imovel)} · ${escJs(c.Tipo_Cobranca)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"/></svg></button>
      </div></td>
    </tr>`;}).join('') : emptyRow(7,'Nenhuma cobrança encontrada');

  // Se já existe a estrutura na tela, apenas atualiza o tbody (evita re-render destrutivo no input)
  const existingTbody = document.querySelector('#view-cobrancas tbody');
  const existingSeg = document.querySelector('#view-cobrancas .seg');
  if(existingTbody && existingSeg){
    existingTbody.innerHTML = body;
    // atualiza apenas o estado visual dos botões do filtro
    existingSeg.querySelectorAll('button').forEach(b=>{
      b.classList.toggle('on', b.dataset.st === f.st);
    });
    return;
  }

  const lbls = {TODOS:'Todos', PENDENTE:'Pendentes', PARCIAL:'Parciais', ATRASADO:'Atrasados', ATRASADAS_ANTIGAS:'Histórico Atrasadas'};
  $('#view-cobrancas').innerHTML=`
    <div class="table-tools">
      <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input id="cobSearch" placeholder="Buscar por imóvel ou inquilino…" value="${esc(f.q)}" oninput="filters.cobrancas.q=this.value;renderCobrancas()"></div>
      <div class="seg">${['TODOS','PENDENTE','PARCIAL','ATRASADO','ATRASADAS_ANTIGAS'].map(s=>`<button class="${f.st===s?'on':''}" data-st="${s}" onclick="filters.cobrancas.st='${s}';renderCobrancas()">${lbls[s]}</button>`).join('')}</div>
    </div>
    <div class="tbl-card"><div class="tbl-scroll"><table>
      <thead><tr><th>Imóvel / Inquilino</th><th>Tipo</th><th>Competência</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody>${body}</tbody></table></div></div>`;
}

function cobFormUpdate(isNew){
  const form = document.querySelector('#crudForm');
  if(!form) return;
  const selImovel = form.querySelector('[name="ID_Imovel"]');
  const selTipo   = form.querySelector('[name="Tipo_Cobranca"]');
  const inpValor  = form.querySelector('[name="Valor_Cobrado"]');
  const inpVenc   = form.querySelector('[name="Data_Vencimento"]');
  const inpComp   = form.querySelector('[name="Competencia"]');

  // Competência: pré-preenche com mês atual em novas cobranças
  if(isNew && inpComp && !inpComp.value){
    const d = new Date();
    inpComp.value = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  }

  // Retorna a string YYYY-MM do mês anterior ao atual
  function compMesAnterior(){
    const d=new Date(); const prev=new Date(d.getFullYear(),d.getMonth()-1,1);
    return prev.getFullYear()+'-'+String(prev.getMonth()+1).padStart(2,'0');
  }

  // Ao mudar o tipo: preenche valor, competência, recebedor e forma de pagamento
  function onTipoChange(){
    if(!inpValor) return;
    const tipo        = selTipo ? selTipo.value : '';
    const inpRecebido = form.querySelector('[name="Recebido_Por"]');
    const selForma    = form.querySelector('[name="Forma_Pagamento"]');

    if(tipo === 'ALUGUEL'){
      const idIm = selImovel ? selImovel.value : '';
      const con  = contratoAtivoDoImovel(idIm);
      if(con) inpValor.value = con.Valor_Aluguel_Contratual;
      else    inpValor.value = '';
      if(isNew && inpComp) inpComp.value = compMesAnterior();
      // Proprietário sempre recebe; forma sempre PIX — sobrescreve a cada troca
      const nomeProp = nomeProprietario();
      if(inpRecebido && nomeProp) inpRecebido.value = nomeProp;
      if(selForma) selForma.value = 'PIX';

    } else if(tipo === 'AGUA' || tipo === 'LUZ'){
      inpValor.value = '';
      if(isNew && inpComp) inpComp.value = compMesAnterior();
      // Concessionária e boleto — sobrescreve a cada troca (sem condição !value)
      if(inpRecebido) inpRecebido.value = tipo === 'AGUA' ? 'SABESP' : 'ENEL';
      if(selForma)    selForma.value    = 'BOLETO';

    } else {
      inpValor.value = '';
    }
  }

  // Ao mudar imóvel: re-aplica a lógica do tipo
  function onImovelChange(){
    onTipoChange();
    // Preenche dia de vencimento automaticamente
    if(inpVenc && selTipo.value){
      const idIm = selImovel.value;
      const im   = STATE.imoveis.find(x=>Number(x.ID_Imovel)===Number(idIm));
      const con  = contratoAtivoDoImovel(idIm);
      let diaVenc = null;
      if(selTipo.value==='ALUGUEL' && con) diaVenc = +con.Dia_Vencimento_Aluguel||null;
      else if(im){
        if(selTipo.value==='AGUA')        diaVenc = +im.Dia_Vencimento_Agua||null;
        else if(selTipo.value==='LUZ')    diaVenc = +im.Dia_Vencimento_Luz||null;
        else if(selTipo.value==='CONDOMINIO') diaVenc = +im.Dia_Vencimento_Condominio||null;
        else if(selTipo.value==='IPTU')   diaVenc = +im.Dia_Vencimento_IPTU||null;
      }
      if(diaVenc){
        // Deslocamento automático: AGUA, LUZ e ALUGUEL vencem no mês seguinte à competência
        const deslocForm = {AGUA:1, LUZ:1, ALUGUEL:1};
        const desloc = deslocForm[selTipo.value] || 0;

        let baseY, baseM;
        if(inpComp && inpComp.value){
          const [cy, cm] = inpComp.value.split('-').map(Number);
          baseY = cy; baseM = cm - 1; // getMonth é 0-based
        } else {
          const now = new Date();
          baseY = now.getFullYear(); baseM = now.getMonth();
        }
        // Aplica deslocamento ao mês base
        const dVenc = new Date(baseY, baseM + desloc, 1);
        const anoVenc = dVenc.getFullYear();
        const mesVenc = dVenc.getMonth();
        const ultimoDia = new Date(anoVenc, mesVenc + 1, 0).getDate();
        const diaFinal = Math.min(diaVenc, ultimoDia);
        inpVenc.value = anoVenc+'-'+String(mesVenc+1).padStart(2,'0')+'-'+String(diaFinal).padStart(2,'0');
        atualizarBadge();
      }
    }
  }

  if(selTipo)   selTipo.addEventListener('change', () => { onTipoChange(); onImovelChange(); });
  if(selImovel) selImovel.addEventListener('change', onImovelChange);
  // Ao mudar o vencimento: preenche competência automaticamente
  // AGUA e LUZ → competência = mês anterior ao vencimento
  // ALUGUEL e demais → competência = mesmo mês do vencimento
  if(inpVenc) inpVenc.addEventListener('change', () => {
    if(inpComp && inpVenc.value && selTipo && selTipo.value){
      const [vy, vm] = inpVenc.value.split('-').map(Number);
      const isEncargo = selTipo.value==='AGUA' || selTipo.value==='LUZ' || selTipo.value==='ALUGUEL';
      let compMes = vm - (isEncargo ? 1 : 0);
      let compAno = vy;
      if(compMes < 1){ compMes = 12; compAno -= 1; }
      inpComp.value = compAno+'-'+String(compMes).padStart(2,'0');
    }
    atualizarBadge();
  });

  // Ao mudar a competência: recalcula vencimento mantendo o dia
  if(inpComp) inpComp.addEventListener('change', () => {
    if(inpVenc && inpVenc.value && inpComp.value){
      const diaAtual = parseInt(inpVenc.value.split('-')[2]) || 10;
      const [cy, cm] = inpComp.value.split('-').map(Number);
      const isEncargo = selTipo && (selTipo.value==='AGUA'||selTipo.value==='LUZ'||selTipo.value==='ALUGUEL');
      // Vencimento = mês seguinte à competência para AGUA, LUZ e ALUGUEL
      const vencMes = isEncargo ? cm + 1 : cm;
      const vencAno = vencMes > 12 ? cy + 1 : cy;
      const vencMesFinal = vencMes > 12 ? 1 : vencMes;
      const diasNoMes = new Date(vencAno, vencMesFinal, 0).getDate();
      const diaFinal = Math.min(diaAtual, diasNoMes);
      inpVenc.value = vencAno+'-'+String(vencMesFinal).padStart(2,'0')+'-'+String(diaFinal).padStart(2,'0');
      atualizarBadge();
    }
  });

  // Badge indicador de status — atualiza conforme o usuário preenche os campos
  const inpValorPago = form.querySelector('[name="Valor_Pago"]');
  const inpDataPag   = form.querySelector('[name="Data_Pagamento"]');

  function calcStatusVisual(){
    const venc = inpVenc ? inpVenc.value : '';
    const hoje = new Date().toISOString().slice(0,10);
    const temValorPago = inpValorPago && inpValorPago.value !== '' && Number(inpValorPago.value) > 0;
    const temDataPag   = inpDataPag && !!inpDataPag.value;
    const valorCob = inpValor ? Number(inpValor.value)||0 : 0;
    const valorPag = inpValorPago ? Number(inpValorPago.value)||0 : 0;

    if(temValorPago && temDataPag){
      if(valorPag >= valorCob) return 'PAGO';
      const selTipoPag = form.querySelector('[name="Tipo_Pagamento"]');
      const tipoPag = selTipoPag ? selTipoPag.value : '';
      if(tipoPag === 'PARCIAL') return 'PARCIAL';
      if(tipoPag === 'TOTAL')   return 'DESCONTO_OU_PARCIAL';
      return 'DESCONTO_OU_PARCIAL'; // não definido — será perguntado
    }
    if(!venc) return null;
    return venc < hoje ? 'ATRASADO' : 'PENDENTE';
  }

  function atualizarBadge(){
    const status = calcStatusVisual();
    // Badge fica ao lado do campo Vencimento
    let badge = form.querySelector('#statusInfoBadge');
    if(!status){ if(badge) badge.remove(); return; }
    if(!badge){
      badge = document.createElement('div');
      badge.id = 'statusInfoBadge';
      badge.style.cssText = 'font-size:12px;font-weight:600;padding:5px 12px;border-radius:8px;display:inline-flex;align-items:center;gap:6px;margin-top:4px';
      const container = inpVenc ? inpVenc.closest('.field') : null;
      if(container) container.appendChild(badge);
    }
    const estilos = {
      PAGO:                ['var(--emerald-soft)','var(--emerald)','✓ Status: Pago'],
      PARCIAL:             ['var(--blue-soft)',   'var(--blue)',   '◑ Status: Pago Parcial'],
      ATRASADO:            ['var(--rose-soft)',   'var(--rose)',   '⚠ Status: Atrasado'],
      PENDENTE:            ['var(--blue-soft)',   'var(--blue)',   '✓ Status: Pendente'],
      DESCONTO_OU_PARCIAL: ['var(--amber-soft)',  'var(--amber)',  '? Desconto ou Parcial — será perguntado ao salvar'],
    };
    const [bg, cor, txt] = estilos[status] || estilos['PENDENTE'];
    badge.style.background = bg;
    badge.style.color = cor;
    badge.innerHTML = txt + ' <span style="opacity:.6;font-weight:400">(automático)</span>';
  }

  if(inpVenc)     { inpVenc.addEventListener('change', atualizarBadge); inpVenc.addEventListener('input', atualizarBadge); }
  if(inpValorPago){ inpValorPago.addEventListener('input', atualizarBadge); }
  if(inpDataPag)  { inpDataPag.addEventListener('change', atualizarBadge); inpDataPag.addEventListener('input', atualizarBadge); }
  const selTipoPag = form.querySelector('[name="Tipo_Pagamento"]');
  if(selTipoPag){
    selTipoPag.addEventListener('change', function(){
      // TOTAL → preenche valor pago com o valor cobrado automaticamente
      if(this.value === 'TOTAL' && inpValor && inpValorPago){
        inpValorPago.value = inpValor.value || '';
      }
      // PARCIAL → limpa o valor pago para o usuário digitar
      if(this.value === 'PARCIAL' && inpValorPago){
        inpValorPago.value = '';
        inpValorPago.focus();
      }
      // Vazio → limpa
      if(this.value === '' && inpValorPago){
        inpValorPago.value = '';
      }
      atualizarBadge();
    });
  }
}

/* Mantido por compatibilidade com Regras */
function forcarPreencherValorAluguel(){
   const form = document.querySelector('#crudForm');
   if(!form) return;
   const selectTipo = form.querySelector('[name="Tipo_Cobranca"]');
   const selectImovel = form.querySelector('[name="ID_Imovel"]');
   const inputValor = form.querySelector('[name="Valor_Padrao"]') || form.querySelector('[name="Valor_Cobrado"]');
   if(!selectTipo || !selectImovel || !inputValor) return;
   if(selectTipo.value !== 'ALUGUEL'){ inputValor.value = ''; return; }
   const idImovel = selectImovel.value;
   const contratoAtivo = contratoAtivoDoImovel(idImovel);
   if(contratoAtivo) inputValor.value = contratoAtivo.Valor_Aluguel_Contratual;
   else inputValor.value = '';
}

