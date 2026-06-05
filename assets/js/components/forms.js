/* ============================================================
   LOCARIA - components/forms.js
   Engine de formularios CRUD: FORMS, mascaras, fieldHtml, openForm, submitForm, delete.
   ============================================================ */
const FORMS={
  cobrancas:{key:'ID_Cobranca',title:'Cobrança',fields:[
    {k:'ID_Imovel',       l:'Imóvel',             t:'imovel',  req:1, full:1},
    {k:'Tipo_Cobranca',   l:'Tipo de Cobrança',   t:'select',  req:1, opts:['','ALUGUEL','AGUA','LUZ','CONDOMINIO','IPTU','OUTRO']},
    {k:'Valor_Cobrado',   l:'Valor Cobrado (R$)',  t:'number',  req:1},
    {k:'Data_Vencimento', l:'Data de Vencimento', t:'date',    req:1},
    {k:'Competencia',     l:'Competência',         t:'month',   req:1},
    // ── Dados de pagamento (preencher se já foi pago) ──────────────
    {k:'Tipo_Pagamento',  l:'Tipo de Pagamento',  t:'select',  full:1, opts:['','TOTAL','PARCIAL']},
    {k:'Valor_Pago',      l:'Valor Pago (R$)',    t:'number'},
    {k:'Data_Pagamento',  l:'Data do Pagamento',  t:'date'},
    {k:'Recebido_Por',    l:'Recebido por',       t:'text'},
    {k:'Forma_Pagamento', l:'Forma de Pagamento', t:'select',  opts:['','PIX','DINHEIRO','BOLETO','CARTAO_CREDITO','CARTAO_DEBITO','TRANSFERENCIA','CHEQUE','OUTRO']},
    {k:'Observacao_Pagamento',l:'Observação',     t:'textarea',full:1},
  ]},
  inquilinos:{key:'ID_Inquilino',title:'Inquilino',sections:[
    {nome:'Dados Pessoais',ico:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',fields:[
      {k:'Nome_Inquilino',l:'Nome completo',t:'text',req:1,full:1},
      {k:'Nacionalidade_Inquilino',l:'Nacionalidade',t:'text'},
      {k:'Estado_Civil_Inquilino',l:'Estado Civil',t:'select',opts:['','SOLTEIRO','CASADO','DIVORCIADO','VIUVO','UNIAO_ESTAVEL']},
      {k:'Profissao_Inquilino',l:'Profissão',t:'text'},
      {k:'CPF_Inquilino',l:'CPF',t:'text',mask:'000.000.000-00'},
      {k:'RG_Inquilino',l:'RG',t:'text'},
      {k:'Telefone_Inquilino',l:'Telefone / WhatsApp',t:'text',mask:'(00) 00000-0000'},
      {k:'Email_Inquilino',l:'E-mail',t:'text',inputmode:'email'},
    ]},
    {nome:'Cônjuge (se houver)',ico:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',fields:[
      {k:'Nome_Conjuge',l:'Nome do cônjuge',t:'text',full:1},
      {k:'CPF_Conjuge',l:'CPF do cônjuge',t:'text',mask:'000.000.000-00'},
      {k:'RG_Conjuge',l:'RG do cônjuge',t:'text'},
    ]},
  ]},
  contratos:{key:'ID_Contrato',title:'Contrato',sections:[
    {nome:'Partes',ico:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',fields:[
      {k:'ID_Inquilino',l:'Inquilino',t:'inquilino',req:1,full:1},
      {k:'ID_Imovel',l:'Imóvel',t:'imovel',req:1,full:1},
      {k:'Natureza_Locacao',l:'Natureza da locação',t:'select',opts:['Residencial','Comercial'],req:1},
    ]},
    {nome:'Prazo & Valores',ico:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',fields:[
      {k:'Prazo_Meses',l:'Prazo (meses)',t:'number',req:1},
      {k:'Data_Inicio_Contrato',l:'Início do contrato',t:'date',req:1},
      {k:'Data_Fim_Contrato',l:'Término (calculado, editável)',t:'date'},
      {k:'Valor_Aluguel_Contratual',l:'Valor do aluguel (R$)',t:'number',req:1},
      {k:'Dia_Vencimento_Aluguel',l:'Dia de vencimento',t:'number',req:1},
      {k:'Multa_Rescisao_Alugueis',l:'Multa rescisão (nº de aluguéis)',t:'number'},
      {k:'Renovacao_Automatica',l:'Renovação automática',t:'select',opts:['NAO','SIM']},
    ]},
    {nome:'Garantia',ico:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',fields:[
      {k:'Garantia_Tipo',l:'Tipo de garantia',t:'select',opts:['Sem Garantia','Caução','Fiança'],req:1,full:1},
      {k:'Caucao_Valor',l:'Valor da caução (R$)',t:'number',full:1},
      {k:'Caucao_Status_Pagamento',l:'Caução — Tipo de pagamento',t:'select',opts:['','TOTAL','PARCIAL']},
      {k:'Caucao_Valor_Pago',l:'Caução — Valor pago (R$)',t:'number'},
      {k:'Caucao_Data_Pagamento',l:'Caução — Data do pagamento',t:'date'},
      {k:'Caucao_Forma_Pagamento',l:'Caução — Forma de pagamento',t:'select',opts:['','PIX','DINHEIRO','BOLETO','CARTAO_CREDITO','CARTAO_DEBITO','TRANSFERENCIA','CHEQUE','OUTRO']},
      {k:'Caucao_Pago_Por',l:'Caução — Pago por',t:'text'},
      {k:'Caucao_Recebido_Por',l:'Caução — Recebido por',t:'text'},
      {k:'Caucao_Observacao',l:'Caução — Observação',t:'textarea',full:1},
      {k:'Fiador_Nome',l:'Fiador — Nome completo',t:'text',full:1},
      {k:'Fiador_Nacionalidade',l:'Fiador — Nacionalidade',t:'text'},
      {k:'Fiador_Estado_Civil',l:'Fiador — Estado Civil',t:'select',opts:['','SOLTEIRO','CASADO','DIVORCIADO','VIUVO','UNIAO_ESTAVEL']},
      {k:'Fiador_Profissao',l:'Fiador — Profissão',t:'text'},
      {k:'Fiador_RG',l:'Fiador — RG',t:'text'},
      {k:'Fiador_CPF',l:'Fiador — CPF',t:'text',mask:'000.000.000-00'},
      {k:'Fiador_Endereco',l:'Fiador — Endereço completo',t:'text',full:1},
      {k:'Fiador_Celular',l:'Fiador — Celular',t:'text',mask:'(00) 00000-0000'},
      {k:'Fiador_Email',l:'Fiador — E-mail',t:'text',inputmode:'email'},
    ]},
    {nome:'Testemunhas & Status',ico:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',fields:[
      {k:'Testemunha_1_Nome',l:'Testemunha 1 — Nome',t:'text'},
      {k:'Testemunha_1_CPF',l:'Testemunha 1 — CPF',t:'text',mask:'000.000.000-00'},
      {k:'Testemunha_2_Nome',l:'Testemunha 2 — Nome',t:'text'},
      {k:'Testemunha_2_CPF',l:'Testemunha 2 — CPF',t:'text',mask:'000.000.000-00'},
      {k:'Status_Contrato',l:'Status',t:'select',opts:['ATIVO','ENCERRADO','SUSPENSO'],req:1},
      {k:'Observacoes',l:'Observações',t:'textarea',full:1},
    ]},
  ]},
  vistorias:{key:'ID_Vistoria',title:'Vistoria',fields:[
    {k:'ID_Contrato',l:'Contrato',t:'contrato',req:1,full:1},
    {k:'Tipo_Vistoria',l:'Tipo de vistoria',t:'select',opts:['Entrada','Saída','Rotina'],req:1},
    {k:'Data_Vistoria',l:'Data da vistoria',t:'date',req:1},
    {k:'Status_Imovel',l:'Estado do imóvel',t:'select',opts:['Sem problemas','Com problemas'],req:1},
    {k:'Descricao_Problemas',l:'Descrição dos problemas',t:'textarea',full:1},
    {k:'Observacoes_Gerais',l:'Observações gerais',t:'textarea',full:1},
    {k:'Responsavel_Vistoria',l:'Responsável pela vistoria',t:'text'},
  ]},
  manutencoes:{key:'ID_Manutencao',title:'Manutenção',fields:[
    {k:'Titulo',l:'Título / Resumo',t:'text',req:1,full:1},
    {k:'ID_Imovel',l:'Imóvel',t:'imovel',req:1,full:1},
    {k:'Status',l:'Status',t:'select',opts:['ABERTO','EM_ANDAMENTO','CONCLUIDO','CANCELADO'],req:1},
    {k:'Responsavel',l:'Responsável / Prestador',t:'text'},
    {k:'Data_Abertura',l:'Data de abertura',t:'date',req:1},
    {k:'Data_Conclusao',l:'Data de conclusão',t:'date'},
    {k:'Custo',l:'Custo (R$)',t:'number'},
    {k:'Descricao',l:'Descrição detalhada',t:'textarea',full:1},
  ]},
  imoveis:{key:'ID_Imovel',title:'Imóvel',sections:[
    {nome:'Identificação',ico:'<path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>',fields:[
      {k:'Nome_Imovel',l:'Nome / identificação',t:'text',req:1,full:1},
      {k:'Natureza_Imovel',l:'Natureza',t:'select',opts:['Residencial','Comercial'],req:1},
      {k:'Endereco_Imovel',l:'Endereço (rua e número)',t:'text',req:1,full:1},
      {k:'Complemento_Imovel',l:'Complemento',t:'text'},
      {k:'Bairro_Imovel',l:'Bairro',t:'text'},
      {k:'Cidade_Imovel',l:'Cidade',t:'text'},
      {k:'Estado_Imovel',l:'Estado (UF)',t:'text'},
      {k:'CEP_Imovel',l:'CEP',t:'text',mask:'00000-000'},
      {k:'Inscricao_IPTU',l:'Inscrição do IPTU',t:'text'},
      {k:'Matricula_Imovel',l:'Matrícula do imóvel',t:'text'},
      {k:'Status_Atual',l:'Status',t:'select',opts:['VAGO','MANUTENCAO'],req:0,hidden_new:1},
      {k:'Data_Cadastro',l:'Data de Cadastro',t:'date'},
    ]},
    {nome:'Conta de Água',ico:'<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',fields:[
      {k:'Endereco_Agua',l:'Endereço da conta (se diferente)',t:'text',full:1},
      {k:'Complemento_Agua',l:'Complemento',t:'text'},
      {k:'Cod_Concessionaria_Agua',l:'Código na concessionária',t:'text'},
      {k:'Titular_Conta_Agua',l:'Titular da conta',t:'text',full:1},
      {k:'CPF_Titular_Agua',l:'CPF do titular',t:'text',mask:'000.000.000-00'},
      {k:'Dia_Vencimento_Agua',l:'Dia de vencimento',t:'number'},
    ]},
    {nome:'Conta de Luz',ico:'<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',fields:[
      {k:'Endereco_Luz',l:'Endereço da conta',t:'text',full:1},
      {k:'Complemento_Luz',l:'Complemento',t:'text'},
      {k:'Cod_Concessionaria_Luz',l:'Código na concessionária',t:'text'},
      {k:'Titular_Conta_Luz',l:'Titular da conta',t:'text',full:1},
      {k:'CPF_Titular_Luz',l:'CPF do titular',t:'text',mask:'000.000.000-00'},
      {k:'Dia_Vencimento_Luz',l:'Dia de vencimento',t:'number'},
    ]},
    {nome:'Condomínio & IPTU',ico:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6"/>',fields:[
      {k:'Valor_Condominio',l:'Valor do condomínio (R$)',t:'number'},
      {k:'Dia_Vencimento_Condominio',l:'Dia venc. condomínio',t:'number'},
      {k:'Valor_IPTU',l:'Valor do IPTU (R$)',t:'number'},
      {k:'Dia_Vencimento_IPTU',l:'Dia venc. IPTU',t:'number'},
    ]},
  ]},
  proprietario:{key:'ID_Proprietario',title:'Proprietário',singleton:true,fields:[
    {k:'Nome_Proprietario',l:'Nome completo',t:'text',req:1,full:1},
    {k:'Nacionalidade_Proprietario',l:'Nacionalidade',t:'text'},
    {k:'Estado_Civil',l:'Estado Civil',t:'select',opts:['','SOLTEIRO','CASADO','DIVORCIADO','VIUVO','UNIAO_ESTAVEL']},
    {k:'Profissao_Proprietario',l:'Profissão',t:'text'},
    {k:'CPF_Proprietario',l:'CPF',t:'text',mask:'000.000.000-00'},
    {k:'RG_Proprietario',l:'RG / CNH',t:'text'},
    {k:'Telefone_Proprietario',l:'Telefone / WhatsApp',t:'text',mask:'(00) 00000-0000'},
    {k:'Email_Proprietario',l:'E-mail',t:'text',inputmode:'email'},
    {k:'Rua_Proprietario',l:'Rua / Logradouro',t:'text',full:1},
    {k:'Numero_Proprietario',l:'Número',t:'text'},
    {k:'Bairro_Proprietario',l:'Bairro',t:'text'},
    {k:'Cidade_Proprietario',l:'Cidade',t:'text'},
    {k:'Estado_Proprietario',l:'Estado (UF)',t:'text'},
    {k:'CEP_Proprietario',l:'CEP',t:'text',mask:'00000-000'},
    {k:'Chave_PIX',l:'Chave PIX',t:'text',full:1,placeholder:'CPF, e-mail, telefone ou chave aleatória'},
    {k:'Banco_Proprietario',l:'Banco',t:'text'},
    {k:'Agencia_Proprietario',l:'Agência',t:'text'},
    {k:'Conta_Proprietario',l:'Conta Bancária',t:'text'},
  ]},
  regras:{key:'ID_Regra',title:'Regra de Cobrança',fields:[
    {k:'ID_Imovel',l:'Imóvel',t:'imovel',req:1,full:1},
    {k:'Tipo_Cobranca',l:'Tipo',t:'select',opts:['ALUGUEL','AGUA','LUZ','CONDOMINIO','IPTU'],req:1},
    {k:'Valor_Padrao',l:'Valor padrão (R$)',t:'number'},
    {k:'Gerar_Automatico',l:'Gerar automático',t:'select',opts:['SIM','NAO'],req:1},
    {k:'Status_Regra',l:'Status',t:'select',opts:['ATIVA','INATIVA'],req:1},
  ]},
};

/* ── Máscara de input (CPF, Telefone, etc.) ── */
function applyInputMask(input){
  const mask = input.dataset.mask;
  if(!mask) return;

  const rawValue  = input.value;
  const cursorPos = input.selectionStart;

  // Quantos dígitos existem ANTES da posição do cursor (rastreia cursor corretamente)
  const digitsBeforeCursor = rawValue.slice(0, cursorPos).replace(/\D/g,'').length;

  // Aplica a máscara sobre todos os dígitos do valor
  const digits = rawValue.replace(/\D/g,'');
  let result = '', di = 0;
  for(let i = 0; i < mask.length && di < digits.length; i++){
    if(mask[i] === '0'){ result += digits[di++]; }
    else { result += mask[i]; }
  }
  input.value = result;

  // Posiciona cursor no mesmo dígito lógico de antes (evita inversão de ordem)
  let newCursor = result.length, digitCount = 0;
  for(let i = 0; i < result.length; i++){
    if(/\d/.test(result[i])) digitCount++;
    if(digitCount === digitsBeforeCursor){ newCursor = i + 1; break; }
  }
  try { input.setSelectionRange(newCursor, newCursor); } catch(_){}
}
document.addEventListener('input', e => {
  if(e.target.matches('input[data-mask]')) applyInputMask(e.target);
  else if(e.target.matches('input[data-money]')) applyMoneyMask(e.target);
});
document.addEventListener('paste', e => {
  if(e.target.matches('input[data-mask]')) setTimeout(() => applyInputMask(e.target), 0);
  else if(e.target.matches('input[data-money]')) setTimeout(() => applyMoneyMask(e.target), 0);
});

function fieldHtml(f,rec,isNew){
  // campos comentados (objeto JS com // no campo k) são ignorados
  if(typeof f !== 'object' || !f.k) return '';
  // Campo marcado como hidden_new: oculto em novo registro, visível em edição
  if(f.hidden_new && isNew) return '';
  const val=rec[f.k]!=null?rec[f.k]:'';
  let input;
  if(f.t==='select'){
    // Se a primeira opção é '' e não há valor salvo, usa como placeholder
    const hasPlaceholder = f.opts[0]==='';
    input=`<select name="${f.k}">${f.opts.map(o=>`<option value="${o}" ${String(val)===o?'selected':''}${o===''?'disabled hidden':''}>` +
      (o===''?'— Selecione —':optLabel(o))+'</option>').join('')}</select>`;
  }else if(f.t==='imovel'){
    input=`<select name="${f.k}"><option value="">— Selecione o imóvel —</option>${STATE.imoveis.map(im=>{
      const conAtivo = contratoAtivoDoImovel(im.ID_Imovel);
      const statusMark = conAtivo ? ' · ALUGADO' : ' · VAGO';
      return `<option value="${im.ID_Imovel}" ${String(val)===String(im.ID_Imovel)?'selected':''}>${esc(im.Nome_Imovel)}${statusMark}</option>`;
    }).join('')}</select>`;
  }else if(f.t==='inquilino'){
    input=`<select name="${f.k}"><option value="">— Selecione o inquilino —</option>${STATE.inquilinos.map(inq=>
      `<option value="${inq.ID_Inquilino}" ${String(val)===String(inq.ID_Inquilino)?'selected':''}>${esc(inq.Nome_Inquilino)}</option>`
    ).join('')}</select>`;
  }else if(f.t==='contrato'){
    input=`<select name="${f.k}"><option value="">— Selecione o contrato —</option>${STATE.contratos.map(ct=>{
      const desc = `${esc(ct.Nome_Inquilino||'?')} · ${esc(ct.Nome_Imovel||'?')}`;
      return `<option value="${ct.ID_Contrato}" ${String(val)===String(ct.ID_Contrato)?'selected':''}>${desc}</option>`;
    }).join('')}</select>`;
  }else if(f.t==='month'){
    input=`<input type="month" name="${f.k}" value="${esc(val)}">`;
  }else if(f.t==='textarea'){
    input=`<textarea name="${f.k}">${esc(val)}</textarea>`;
  }else{
    const isNumeric = f.t==='number';
    const isMoney = isMoneyField(f);   // campos de valor (Valor_*, Custo) → máscara de moeda
    const isDia = f.k.indexOf('Dia_')===0 || f.l.indexOf('Dia')===0;
    let extraAttrs;
    if(isMoney){
      // inputmode numeric: teclado só de dígitos (a vírgula/ponto é inserida pela máscara)
      extraAttrs = `type="text" inputmode="numeric" data-money placeholder="0,00"`;
    } else if(isNumeric){
      extraAttrs = `type="text" inputmode="decimal" ${isDia?'min="1" max="31" maxlength="2"':''}`;
    } else {
      extraAttrs = `type="${f.t}"`;
    }
    // Máscara: CPF, Telefone, etc.
    if(f.mask){
      extraAttrs += ` data-mask="${f.mask}" inputmode="numeric" maxlength="${f.mask.length}" placeholder="${f.mask}"`;
    } else if(f.inputmode){
      extraAttrs += ` inputmode="${f.inputmode}"`;
    } else if(f.placeholder){
      extraAttrs += ` placeholder="${esc(f.placeholder)}"`;
    }
    const valAttr = isMoney ? esc(moneyMaskValue(val)) : esc(val);
    input=`<input name="${f.k}" value="${valAttr}" ${extraAttrs}>`;
  }
  return `<div class="field ${f.full?'full':''}"><label>${f.l}${f.req?' *':''}</label>${input}</div>`;
}

function openForm(sheet,id){
  const cfg=FORMS[sheet];
  // Singleton (proprietario): STATE[sheet] é objeto, não array
  let rec, isNew;
  if(cfg.singleton){
    rec = STATE[sheet] ? {...STATE[sheet]} : {};
    if(!rec[cfg.key]) rec[cfg.key]='PRP_001';
    isNew = !STATE[sheet]?.[cfg.key];
  } else {
    rec = id ? (STATE[sheet].find(r=>String(r[cfg.key])===String(id))||{}) : {};
    isNew = !id;
  }
  let bodyHtml;

  if(cfg.sections){
    const tabs=cfg.sections.map((s,i)=>`<button type="button" class="ftab ${i===0?'on':''}" data-tab="${i}" data-action="switch-tab">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${s.ico}</svg>${s.nome}</button>`).join('');
    const panes=cfg.sections.map((s,i)=>`<div class="fpane ${i===0?'on':''}" data-pane="${i}">
        <div class="form-grid">${s.fields.map(f=>fieldHtml(f,rec,isNew)).join('')}</div></div>`).join('');
    bodyHtml=`<div class="ftabs">${tabs}</div><form id="crudForm">${panes}</form>`;
  }else{
    bodyHtml=`<form id="crudForm"><div class="form-grid">${cfg.fields.map(f=>fieldHtml(f,rec,isNew)).join('')}</div></form>`;
  }

  showModal(`${isNew?'Novo':'Editar'} ${cfg.title}`, bodyHtml,
    `<button class="btn ghost" data-action="close-modal">Cancelar</button>
     <button class="btn primary" data-action="submit-form" data-sheet="${esc(sheet)}" data-id="${esc(id||'')}">Salvar</button>`);

  if(sheet === 'regras') {
    const form = $('#crudForm');
    const selectImovel = form.elements['ID_Imovel'];
    const selectTipo = form.elements['Tipo_Cobranca'];
    selectImovel.addEventListener('change', forcarPreencherValorAluguel);
    selectTipo.addEventListener('change', forcarPreencherValorAluguel);
  }
  if(sheet === 'cobrancas') {
    cobFormUpdate(isNew);
  }

  if(sheet === 'contratos') {
    contratoFormUpdate(isNew, id);
  }
}

function showWarning(id, html){
  const form = $('#crudForm');
  if(!form) return;
  let el = document.getElementById(id);
  if(!el){
    el = document.createElement('div');
    el.id = id;
    setStyle(el, 'background:var(--rose-soft);border:1px solid rgba(240,101,101,.35);color:var(--rose);padding:11px 14px;border-radius:10px;font-size:13px;margin-bottom:14px;line-height:1.5');
    form.parentNode.insertBefore(el, form);
  }
  el.innerHTML = html;
}
function removeWarning(id){
  const el = document.getElementById(id);
  if(el) el.remove();
}
function switchTab(i){
  document.querySelectorAll('.ftab').forEach(t=>t.classList.toggle('on',+t.dataset.tab===i));
  document.querySelectorAll('.fpane').forEach(p=>p.classList.toggle('on',+p.dataset.pane===i));
}
function allFields(cfg){ return cfg.sections ? cfg.sections.flatMap(s=>s.fields) : cfg.fields; }
async function submitForm(sheet,id){
  const cfg=FORMS[sheet];
  const form=$('#crudForm');
  const flds=allFields(cfg);
  const rec={};
  flds.forEach(f=>{
    const el = form.elements[f.k];
    if(!el) return;
    let v=el.value;
    if(isMoneyField(f)) v = parseMoneyBR(v);              // "1.150,00" → 1150 (imune ao teclado)
    else if(f.t==='number') v = v===''?'':parseFloat(v);
    rec[f.k]=v;
  });
  // validação simples
  for(let si=0; si<(cfg.sections?cfg.sections.length:1); si++){
    const list=cfg.sections?cfg.sections[si].fields:cfg.fields;
    for(const f of list){
      if(f.req && (rec[f.k]===''||rec[f.k]==null)){
        if(cfg.sections) switchTab(si);
        toast('Preencha: '+f.l,'err'); return;
      }
    }
  }
  const isNew = cfg.singleton ? !STATE[sheet]?.[cfg.key] : !id;
  if(isNew && !cfg.singleton){ rec[cfg.key]=genId(sheet); }
  else { rec[cfg.key] = cfg.singleton ? 'PRP_001' : id; }

  // Resolve Nome_Inquilino e Nome_Imovel a partir dos IDs selecionados (vínculo Nome + ID)
  if(sheet==='contratos'){
    const im = imovelPorId(rec.ID_Imovel);
    rec.Nome_Imovel = im ? im.Nome_Imovel : '';
    const inq = inquilinoPorId(rec.ID_Inquilino);
    rec.Nome_Inquilino = inq ? inq.Nome_Inquilino : '';
    if(im && !rec.Natureza_Locacao) rec.Natureza_Locacao = im.Natureza_Imovel || 'Residencial';
  }
  if(sheet==='vistorias'){
    const ct = contratoPorId(rec.ID_Contrato);
    rec.Nome_Imovel = ct ? ct.Nome_Imovel : '';
  }

  if(sheet==='cobrancas'){
    const im=STATE.imoveis.find(x=>String(x.ID_Imovel)===String(rec.ID_Imovel));
    rec.Nome_Imovel=im?im.Nome_Imovel:'';
    const con=contratoAtivoDoImovel(rec.ID_Imovel);
    rec.Responsavel_Pagamento=con?con.Nome_Inquilino:'';

    // ── Status calculado automaticamente ──
    // Prioridade: 1) pago/parcial (se preencheu valor+data pagamento), 2) atrasado, 3) pendente
    if(isNew){
      const hoje = new Date().toISOString().slice(0,10);
      const temValorPago = rec.Valor_Pago !== '' && rec.Valor_Pago != null && Number(rec.Valor_Pago) > 0;
      const temDataPag   = !!rec.Data_Pagamento;
      if(temValorPago && temDataPag){
        const valorCob = Number(rec.Valor_Cobrado) || 0;
        const valorPag = Number(rec.Valor_Pago) || 0;
        const tipoPag  = rec.Tipo_Pagamento || ''; // TOTAL, PARCIAL ou vazio

        if(valorPag >= valorCob){
          // Valor pago cobre tudo — sempre PAGO
          rec.Status_Cobranca = 'PAGO';
        } else if(tipoPag === 'PARCIAL'){
          // Usuário escolheu PARCIAL explicitamente — sem perguntar
          rec.Status_Cobranca = 'PARCIAL';
        } else if(tipoPag === 'TOTAL'){
          // Usuário disse TOTAL mas pagou menos — pergunta se é desconto
          window._pendingSubmitRec  = rec;
          window._pendingSubmitData = { sheet, id, isNew, valorCob, valorPag };
          showModal('Confirmar Desconto',
            `<div data-style="text-align:center;padding:8px 0 4px">
               <div data-style="font-size:40px;margin-bottom:12px">⚠️</div>
               <p data-style="font-size:15px;line-height:1.6;color:var(--txt);margin-bottom:16px">
                 Você selecionou <strong>Pago Total</strong>, mas o valor pago
                 <strong data-style="color:var(--emerald)">${fmtBRL2(valorPag)}</strong>
                 é menor que o cobrado
                 <strong data-style="color:var(--txt)">${fmtBRL2(valorCob)}</strong>.
               </p>
               <div data-style="background:rgba(224,162,60,.1);border:1px solid rgba(224,162,60,.3);border-radius:10px;padding:14px;font-size:14px;color:var(--amber)">
                 Confirma que a diferença de <strong>${fmtBRL2(valorCob - valorPag)}</strong>
                 será aplicada como <strong>desconto</strong> e a cobrança será quitada?
               </div>
             </div>`,
            `<button class="btn ghost" data-action="cancel-pending">Voltar e Corrigir</button>
             <button class="btn" data-style="background:var(--amber);color:#000;font-weight:600" data-action="escolher-pagamento" data-tipo="PAGO">Sim, aplicar desconto</button>`
          );
          return;
        } else {
          // Tipo_Pagamento não preenchido e valor menor — pergunta
          window._pendingSubmitRec  = rec;
          window._pendingSubmitData = { sheet, id, isNew, valorCob, valorPag };
          showModal('Como registrar este pagamento?',
            `<p data-style="color:var(--txt-dim);line-height:1.7;margin-bottom:16px">
               O valor pago <strong data-style="color:var(--emerald)">${fmtBRL2(valorPag)}</strong> é menor que o cobrado <strong data-style="color:var(--txt)">${fmtBRL2(valorCob)}</strong>.
               Como você quer registrar?
             </p>
             <div data-style="display:flex;flex-direction:column;gap:10px">
               <div data-action="escolher-pagamento" data-tipo="PAGO" data-style="cursor:pointer;padding:14px 16px;border-radius:12px;border:1px solid var(--emerald);background:var(--emerald-soft);display:flex;align-items:center;gap:12px">
                 <div data-style="width:36px;height:36px;border-radius:50%;background:var(--emerald);display:grid;place-items:center;flex-shrink:0">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                 </div>
                 <div>
                   <div data-style="font-weight:600;color:var(--emerald)">Desconto / Acordo</div>
                   <div data-style="font-size:12px;color:var(--txt-dim);margin-top:2px">Restante de ${fmtBRL2(valorCob - valorPag)} descartado. Cobrança encerrada como PAGO.</div>
                 </div>
               </div>
               <div data-action="escolher-pagamento" data-tipo="PARCIAL" data-style="cursor:pointer;padding:14px 16px;border-radius:12px;border:1px solid var(--blue);background:var(--blue-soft);display:flex;align-items:center;gap:12px">
                 <div data-style="width:36px;height:36px;border-radius:50%;background:var(--blue);display:grid;place-items:center;flex-shrink:0">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                 </div>
                 <div>
                   <div data-style="font-weight:600;color:var(--blue)">Pagamento Parcial</div>
                   <div data-style="font-size:12px;color:var(--txt-dim);margin-top:2px">Restante de ${fmtBRL2(valorCob - valorPag)} continua como dívida ativa.</div>
                 </div>
               </div>
             </div>`,
            `<button class="btn ghost" data-action="cancel-pending">Cancelar</button>`
          );
          return;
        }
      } else {
        rec.Status_Cobranca = rec.Data_Vencimento && rec.Data_Vencimento < hoje ? 'ATRASADO' : 'PENDENTE';
      }
    }
    // Em edições: recalcula o status com base no que foi informado
    if(!isNew){
      const valorCob = Number(rec.Valor_Cobrado) || 0;
      const valorPag = Number(rec.Valor_Pago) || 0;
      const tipoPag  = rec.Tipo_Pagamento || '';
      const temValorPago = valorPag > 0;
      const temDataPag   = !!rec.Data_Pagamento;

      if(temValorPago && temDataPag){
        if(valorPag >= valorCob){
          rec.Status_Cobranca = 'PAGO';
        } else if(tipoPag === 'PARCIAL'){
          rec.Status_Cobranca = 'PARCIAL';
        } else if(tipoPag === 'TOTAL'){
          // Mantém como PAGO com desconto — já confirmado pelo usuário
          rec.Status_Cobranca = 'PAGO';
        } else {
          // Sem tipo definido e valor menor: mantém PARCIAL
          rec.Status_Cobranca = 'PARCIAL';
        }
      } else if(!temValorPago || !temDataPag){
        // Pagamento removido ou incompleto → volta a PENDENTE ou ATRASADO
        const hoje = new Date().toISOString().slice(0,10);
        rec.Status_Cobranca = rec.Data_Vencimento && rec.Data_Vencimento < hoje ? 'ATRASADO' : 'PENDENTE';
      }
    }

    // ── Bloqueio de duplicata por competência/tipo ──
    if(isNew && rec.Competencia && rec.Tipo_Cobranca){
      const existente = STATE.cobrancas.find(c =>
        String(c.ID_Cobranca) !== String(rec.ID_Cobranca) &&
        Number(c.ID_Imovel) === Number(rec.ID_Imovel) &&
        c.Tipo_Cobranca === rec.Tipo_Cobranca &&
        c.Competencia === rec.Competencia &&
        c.Status_Cobranca !== 'CANCELADO'
      );
      if(existente){
        const nomeIm = im ? im.Nome_Imovel : 'este imóvel';
        const tipo = optLabel(rec.Tipo_Cobranca);
        const comp = rec.Competencia.replace('-','/');
        const statusLabel = optLabel(existente.Status_Cobranca);
        toast(`Já existe cobrança de ${tipo} para ${nomeIm} em ${comp} (${statusLabel}). Cancele a anterior para criar nova.`, 'err');
        return;
      }
    }
  }

  // Regras: bloqueio de duplicata (mesmo imóvel + mesmo tipo ativo)
  if(sheet==='regras' && rec.ID_Imovel && rec.Tipo_Cobranca){
    const duplicata = STATE.regras.find(r =>
      String(r.ID_Regra) !== String(rec.ID_Regra) &&
      Number(r.ID_Imovel) === Number(rec.ID_Imovel) &&
      String(r.Tipo_Cobranca).toUpperCase() === String(rec.Tipo_Cobranca).toUpperCase() &&
      r.Status_Regra !== 'INATIVA'
    );
    if(duplicata){
      const im = STATE.imoveis.find(x=>Number(x.ID_Imovel)===Number(rec.ID_Imovel));
      const nomeIm = im ? im.Nome_Imovel : 'este imóvel';
      toast(`Já existe regra de ${optLabel(rec.Tipo_Cobranca)} ativa para ${nomeIm}. Inative a anterior para criar nova.`, 'err');
      return;
    }
  }

  // Imóveis: novo imóvel sempre começa como VAGO + Data_Cadastro automática
  if(sheet==='imoveis' && isNew){
    rec.Status_Atual = 'VAGO';
    if(!rec.Data_Cadastro) rec.Data_Cadastro = new Date().toISOString().slice(0,10);
  }

  // Contratos: bloqueia cadastro/edição se o imóvel já tem outro contrato ATIVO
  if(sheet==='contratos' && rec.Status_Contrato === 'ATIVO'){
    const conflito = STATE.contratos.find(c =>
      Number(c.ID_Imovel) === Number(rec.ID_Imovel) &&
      c.Status_Contrato === 'ATIVO' &&
      String(c.ATIVO||'SIM').toUpperCase() !== 'NAO' &&
      String(c.ID_Contrato) !== String(rec.ID_Contrato)
    );
    if(conflito){
      const im = imovelPorId(rec.ID_Imovel);
      const nomeImovel = im ? im.Nome_Imovel : 'imóvel selecionado';
      toast(`Não é possível: ${nomeImovel} já tem contrato ATIVO com ${conflito.Nome_Inquilino}. Encerre o contrato atual antes.`, 'err');
      return;
    }
  }

  const btn=event.target; btn.textContent='Salvando…'; btn.disabled=true;
  try{
    await saveRecord(sheet,cfg.key,rec,isNew);
    closeModal(); renderView(currentView);
    toast(isNew?'Registro criado':'Registro atualizado');
  }catch(e){ toast('Erro: '+e.message,'err'); btn.textContent='Salvar'; btn.disabled=false; }
}
function genId(sheet){
  const cfg=FORMS[sheet];
  if(sheet==='imoveis'){ return Math.max(0,...STATE.imoveis.map(i=>+i.ID_Imovel||0))+1; }
  const pre={cobrancas:'COB_',inquilinos:'INQ_',contratos:'CTR_',vistorias:'VST_',regras:'REG_',manutencoes:'MAN_'}[sheet];
  const nums=STATE[sheet].map(r=>parseInt(String(r[cfg.key]).replace(/\D/g,''))||0);
  return pre+String(Math.max(0,...nums)+1).padStart(4,'0');
}

async function quickPay(id){
   // Função legada — substituída por openPagamentoModal(id). Mantida apenas para compatibilidade.
   openPagamentoModal(id);
}

function askDelete(sheet,key,id,label){
  showModal('Confirmar exclusão',
    `<p data-style="color:var(--txt-dim);line-height:1.6">Tem certeza que deseja excluir <strong data-style="color:var(--txt)">${esc(label)}</strong>?<br>Esta ação não poderá ser desfeita.</p>`,
    `<button class="btn ghost" data-action="close-modal">Cancelar</button>
     <button class="btn" data-style="background:var(--rose-soft);color:var(--rose);border-color:rgba(240,101,101,.3)" data-action="do-delete" data-sheet="${esc(sheet)}" data-key="${esc(key)}" data-id="${esc(id)}">Excluir</button>`);
}
async function doDelete(sheet,key,id){
  try{ await deleteRecord(sheet,key,id); closeModal(); renderView(currentView); renderDashboard(); toast('Registro excluído'); }
  catch(e){ toast('Erro: '+e.message,'err'); }
}

