/* ============================================================
   LOCARIA - components/pdf.js
   Geracao de PDFs e compartilhamento (comprovantes, extratos, prestacao de contas).
   ============================================================ */
async function gerarComprovantePDF(idCobranca){
  const c = STATE.cobrancas.find(x => String(x.ID_Cobranca) === String(idCobranca));
  if(!c) return;

  // Garante jsPDF carregado (loader único, com SRI)
  try{ await _pdfEnsure(); }catch(e){ toast('Sem conexão para gerar PDF','err'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W=210, ml=18, mr=192;
  const amber=[224,162,60], dark=[26,26,46], gray=[110,110,110], lgray=[190,190,190], lbg=[248,249,250], green=[22,130,74];

  const valorCobrado = +c.Valor_Cobrado || 0;
  const valorPago    = +c.Valor_Pago || valorCobrado;
  const desconto     = Math.max(0, valorCobrado - valorPago);
  const fmtDate = d => d ? new Date(d+'T00:00').toLocaleDateString('pt-BR') : '—';
  const fmtV    = v => (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const halfW   = (mr - ml - 6) / 2;

  let y = 22;

  // ── Cabeçalho ──
  // Ícone: fundo preto (#0e1117) + L geométrico âmbar — igual ao ícone do app
  doc.setFillColor(14, 17, 23);
  doc.roundedRect(ml, y-6, 16, 16, 2.5, 2.5, 'F');
  doc.setFillColor(...amber);
  doc.rect(ml+3.5,  y-3.8, 3, 11.5, 'F');   // barra vertical do L
  doc.rect(ml+3.5,  y+5.7, 9,  2,   'F');   // barra horizontal do L

  doc.setTextColor(...dark); doc.setFont('helvetica','bold'); doc.setFontSize(18);
  doc.text('Locaria', ml+20, y+1);
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...gray);
  doc.text('Gestao de Alugueis', ml+20, y+7.5);

  doc.setFontSize(8); doc.setTextColor(...lgray);
  doc.text('Emitido em', mr, y-4, {align:'right'});
  doc.setTextColor(...dark); doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString('pt-BR'), mr, y+2, {align:'right'});
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...lgray);
  doc.text(String(c.ID_Cobranca||''), mr, y+8, {align:'right'});

  y += 16;
  doc.setDrawColor(...amber); doc.setLineWidth(0.7);
  doc.line(ml, y, mr, y);
  y += 9;

  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...amber);
  doc.text('Comprovante de Pagamento', ml, y);
  y += 11;

  // ── Campos ──
  function drawField(label, value, x, fy, w){
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...gray);
    doc.text(String(label).toUpperCase(), x, fy);
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...dark);
    let txt = String(value||'—');
    while(doc.getTextWidth(txt) > w-3 && txt.length > 2) txt = txt.slice(0,-1);
    if(txt !== String(value||'—')) txt += '...';
    doc.text(txt, x, fy+5.5);
  }
  function row2(l1,v1,l2,v2){
    doc.setFillColor(...lbg); doc.rect(ml, y-3, mr-ml, 15, 'F');
    drawField(l1, v1, ml+2, y+1, halfW);
    drawField(l2, v2, ml+halfW+8, y+1, halfW);
    y += 16;
  }
  function row1(label, value){
    doc.setFillColor(...lbg); doc.rect(ml, y-3, mr-ml, 15, 'F');
    drawField(label, value, ml+2, y+1, mr-ml-4);
    y += 16;
  }

  row2('Imovel', c.Nome_Imovel, 'Status', optLabel(c.Status_Cobranca));
  row1('Inquilino / Responsavel', c.Responsavel_Pagamento);
  row2('Tipo de Cobranca', optLabel(c.Tipo_Cobranca), 'Competencia', monthLabel(c.Competencia));
  row2('Vencimento', fmtDate(c.Data_Vencimento), 'Data do Pagamento', fmtDate(c.Data_Pagamento));
  row2('Forma de Pagamento', optLabel(c.Forma_Pagamento||'—'), 'Recebido por', c.Recebido_Por||'—');
  row2('Valor Cobrado', fmtV(valorCobrado), 'Valor Pago', fmtV(valorPago));
  if(desconto > 0.01) row1('Desconto Concedido', fmtV(desconto));
  if(c.Observacao_Pagamento) row1('Observacao', String(c.Observacao_Pagamento));

  // ── Detalhamento dos pagamentos (livro-razão) — só quando houve mais de um lançamento ──
  let histComp = [];
  try { histComp = JSON.parse(c.Historico_Pagamentos || '[]'); if(!Array.isArray(histComp)) histComp = []; } catch(_){ histComp = []; }
  if(histComp.length >= 1){
    y += 3;
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...gray);
    doc.text('DETALHAMENTO DOS PAGAMENTOS', ml, y); y += 5;
    doc.setFont('helvetica','normal'); doc.setFontSize(9.5);
    histComp.forEach((p, idx) => {
      doc.setFillColor(...(idx % 2 ? [255,255,255] : lbg)); doc.rect(ml, y-3.8, mr-ml, 7, 'F');
      doc.setTextColor(...dark);
      doc.text(fmtDate(p.data), ml+2, y+1);
      doc.text(optLabel(p.forma||'—'), ml+45, y+1);
      doc.text(fmtV(p.valor), mr-2, y+1, {align:'right'});
      y += 7;
    });
    y += 3;
  }

  y += 6;
  doc.setFont('helvetica','bold'); doc.setFontSize(26); doc.setTextColor(...green);
  doc.text(fmtV(valorPago), W/2, y, {align:'center'});
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...gray);
  doc.text('Valor Confirmado', W/2, y+7, {align:'center'});
  y += 22;

  doc.setDrawColor(...lgray); doc.setLineWidth(0.4);
  doc.line(ml+8, y, W/2-6, y); doc.line(W/2+6, y, mr-8, y);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...lgray);
  doc.text('Assinatura do Inquilino',   (ml+8+W/2-6)/2, y+5, {align:'center'});
  doc.text('Assinatura do Responsavel', (W/2+6+mr-8)/2, y+5, {align:'center'});
  y += 16;

  doc.setDrawColor(...lgray); doc.setLineWidth(0.2);
  doc.line(ml, y, mr, y); y += 5;
  doc.setFontSize(7.5); doc.setTextColor(...lgray);
  doc.text('Locaria · Gestao de Alugueis · '+new Date().toLocaleString('pt-BR'), W/2, y, {align:'center'});

  // ── Entrega o arquivo ──
  const fileName = 'Comprovante_'+String(c.ID_Cobranca||'locaria')+'.pdf';
  const pdfBlob  = doc.output('blob');
  const pdfFile  = new File([pdfBlob], fileName, {type:'application/pdf'});

  // Detecta mobile (iOS / Android) — desktop usa download direto mesmo com canShare
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if(isMobile && navigator.canShare && navigator.canShare({files:[pdfFile]})){
    // iOS / Android: share sheet nativo
    try {
      await navigator.share({
        files: [pdfFile],
        title: 'Comprovante — '+String(c.Nome_Imovel||''),
        text:  optLabel(c.Tipo_Cobranca)+' · '+monthLabel(c.Competencia),
      });
    } catch(e){
      if(e.name !== 'AbortError') doc.save(fileName);
    }
    return;
  }

  // Desktop: download direto do PDF
  doc.save(fileName);
}

async function gerarComprovanteVistoria(idVistoria){
  const v = STATE.vistorias.find(x => String(x.ID_Vistoria) === String(idVistoria));
  if(!v){ toast('Vistoria não encontrada','err'); return; }

  if(!window.jspdf){
    toast('Preparando PDF…');
    try {
      await new Promise((res, rej) => {
        if(window.jspdf){ res(); return; }
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = res; s.onerror = () => rej(new Error('offline'));
        document.head.appendChild(s);
      });
    } catch(e){ toast('Sem conexão para gerar PDF','err'); return; }
  }

  const ct  = v.ID_Contrato ? contratoPorId(v.ID_Contrato) : null;
  const inq = ct ? ct.Nome_Inquilino : '';
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W=210, ml=18, mr=192;
  const amber=[224,162,60], dark=[26,26,46], gray=[110,110,110], lgray=[190,190,190], lbg=[248,249,250];
  const fmtDate = d => d ? new Date(d+'T00:00').toLocaleDateString('pt-BR') : '—';
  const halfW = (mr - ml - 6) / 2;
  let y = 22;

  // ── Cabeçalho (mesmo padrão do comprovante de pagamento) ──
  doc.setFillColor(14,17,23); doc.roundedRect(ml, y-6, 16, 16, 2.5, 2.5, 'F');
  doc.setFillColor(...amber);
  doc.rect(ml+3.5, y-3.8, 3, 11.5, 'F'); doc.rect(ml+3.5, y+5.7, 9, 2, 'F');
  doc.setTextColor(...dark); doc.setFont('helvetica','bold'); doc.setFontSize(18);
  doc.text('Locaria', ml+20, y+1);
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...gray);
  doc.text('Gestao de Alugueis', ml+20, y+7.5);
  doc.setFontSize(8); doc.setTextColor(...lgray);
  doc.text('Emitido em', mr, y-4, {align:'right'});
  doc.setTextColor(...dark); doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString('pt-BR'), mr, y+2, {align:'right'});
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...lgray);
  doc.text(String(v.ID_Vistoria||''), mr, y+8, {align:'right'});

  y += 16;
  doc.setDrawColor(...amber); doc.setLineWidth(0.7); doc.line(ml, y, mr, y); y += 9;
  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...amber);
  doc.text('Laudo de Vistoria', ml, y); y += 11;

  function drawField(label, value, x, fy, w){
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...gray);
    doc.text(String(label).toUpperCase(), x, fy);
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...dark);
    let txt = String(value||'—');
    while(doc.getTextWidth(txt) > w-3 && txt.length > 2) txt = txt.slice(0,-1);
    if(txt !== String(value||'—')) txt += '...';
    doc.text(txt, x, fy+5.5);
  }
  function row2(l1,v1,l2,v2){ doc.setFillColor(...lbg); doc.rect(ml, y-3, mr-ml, 15, 'F'); drawField(l1,v1,ml+2,y+1,halfW); drawField(l2,v2,ml+halfW+8,y+1,halfW); y+=16; }
  function bloco(label, value){
    const linhas = doc.splitTextToSize(String(value||'—'), mr-ml-6);
    const h = 8 + linhas.length*4.6;
    doc.setFillColor(...lbg); doc.rect(ml, y-3, mr-ml, h, 'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...gray);
    doc.text(String(label).toUpperCase(), ml+2, y+1);
    doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(...dark);
    doc.text(linhas, ml+2, y+6);
    y += h + 1;
  }

  row2('Imovel', v.Nome_Imovel, 'Tipo de Vistoria', v.Tipo_Vistoria);
  row2('Data da Vistoria', fmtDate(v.Data_Vistoria), 'Estado do Imovel', v.Status_Imovel);
  row2('Inquilino', inq, 'Responsavel', v.Responsavel_Vistoria);
  if(v.Descricao_Problemas) bloco('Descricao dos Problemas', v.Descricao_Problemas);
  if(v.Observacoes_Gerais)  bloco('Observacoes Gerais', v.Observacoes_Gerais);

  y += 12;
  doc.setDrawColor(...lgray); doc.setLineWidth(0.4);
  doc.line(ml+8, y, W/2-6, y); doc.line(W/2+6, y, mr-8, y);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...lgray);
  doc.text('Assinatura do Inquilino',   (ml+8+W/2-6)/2, y+5, {align:'center'});
  doc.text('Assinatura do Responsavel', (W/2+6+mr-8)/2, y+5, {align:'center'});
  y += 16;
  doc.setDrawColor(...lgray); doc.setLineWidth(0.2); doc.line(ml, y, mr, y); y += 5;
  doc.setFontSize(7.5); doc.setTextColor(...lgray);
  doc.text('Locaria · Gestao de Alugueis · '+new Date().toLocaleString('pt-BR'), W/2, y, {align:'center'});

  const fileName = 'Vistoria_'+String(v.ID_Vistoria||'locaria')+'.pdf';
  const pdfBlob  = doc.output('blob');
  const pdfFile  = new File([pdfBlob], fileName, {type:'application/pdf'});
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if(isMobile && navigator.canShare && navigator.canShare({files:[pdfFile]})){
    try { await navigator.share({ files:[pdfFile], title:'Laudo de Vistoria — '+String(v.Nome_Imovel||'') }); }
    catch(e){ if(e.name!=='AbortError') doc.save(fileName); }
    return;
  }
  doc.save(fileName);
}

async function gerarComprovanteCaucao(idContrato){
  const c = contratoPorId(idContrato);
  if(!c){ toast('Contrato não encontrado','err'); return; }
  if(c.Garantia_Tipo !== 'Caução'){ toast('Este contrato não tem caução.','err'); return; }

  if(!window.jspdf){
    toast('Preparando PDF…');
    try {
      await new Promise((res, rej) => {
        if(window.jspdf){ res(); return; }
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = res; s.onerror = () => rej(new Error('offline'));
        document.head.appendChild(s);
      });
    } catch(e){ toast('Sem conexão para gerar PDF','err'); return; }
  }

  const inq = inquilinoPorId(c.ID_Inquilino) || {};
  const nomeInq = inq.Nome_Inquilino || c.Nome_Inquilino || '';
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W=210, ml=18, mr=192;
  const amber=[224,162,60], dark=[26,26,46], gray=[110,110,110], lgray=[190,190,190], lbg=[248,249,250], green=[22,130,74];
  const fmtDate = d => d ? new Date(d+'T00:00').toLocaleDateString('pt-BR') : '—';
  const fmtV    = v => (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const halfW   = (mr - ml - 6) / 2;
  let y = 22;

  doc.setFillColor(14,17,23); doc.roundedRect(ml, y-6, 16, 16, 2.5, 2.5, 'F');
  doc.setFillColor(...amber);
  doc.rect(ml+3.5, y-3.8, 3, 11.5, 'F'); doc.rect(ml+3.5, y+5.7, 9, 2, 'F');
  doc.setTextColor(...dark); doc.setFont('helvetica','bold'); doc.setFontSize(18);
  doc.text('Locaria', ml+20, y+1);
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...gray);
  doc.text('Gestao de Alugueis', ml+20, y+7.5);
  doc.setFontSize(8); doc.setTextColor(...lgray);
  doc.text('Emitido em', mr, y-4, {align:'right'});
  doc.setTextColor(...dark); doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString('pt-BR'), mr, y+2, {align:'right'});
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...lgray);
  doc.text(String(c.ID_Contrato||''), mr, y+8, {align:'right'});

  y += 16;
  doc.setDrawColor(...amber); doc.setLineWidth(0.7); doc.line(ml, y, mr, y); y += 9;
  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...amber);
  doc.text('Comprovante de Caucao', ml, y); y += 11;

  function drawField(label, value, x, fy, w){
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...gray);
    doc.text(String(label).toUpperCase(), x, fy);
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...dark);
    let txt = String(value||'—');
    while(doc.getTextWidth(txt) > w-3 && txt.length > 2) txt = txt.slice(0,-1);
    if(txt !== String(value||'—')) txt += '...';
    doc.text(txt, x, fy+5.5);
  }
  function row2(l1,v1,l2,v2){ doc.setFillColor(...lbg); doc.rect(ml, y-3, mr-ml, 15, 'F'); drawField(l1,v1,ml+2,y+1,halfW); drawField(l2,v2,ml+halfW+8,y+1,halfW); y+=16; }
  function row1(label, value){ doc.setFillColor(...lbg); doc.rect(ml, y-3, mr-ml, 15, 'F'); drawField(label,value,ml+2,y+1,mr-ml-4); y+=16; }

  const valorCaucao = +c.Caucao_Valor || 0;
  const valorPago   = +c.Caucao_Valor_Pago || 0;

  row2('Imovel', c.Nome_Imovel, 'Inquilino', nomeInq);
  row2('Valor da Caucao', fmtV(valorCaucao), 'Tipo de Pagamento', optLabel(c.Caucao_Status_Pagamento||'—'));
  row2('Valor Pago', fmtV(valorPago), 'Data do Pagamento', fmtDate(c.Caucao_Data_Pagamento));
  row2('Pago por', c.Caucao_Pago_Por||'—', 'Recebido por', c.Caucao_Recebido_Por||'—');
  row1('Forma de Pagamento', optLabel(c.Caucao_Forma_Pagamento||'—'));
  if(c.Caucao_Observacao) row1('Observacao', String(c.Caucao_Observacao));

  y += 6;
  doc.setFont('helvetica','bold'); doc.setFontSize(26); doc.setTextColor(...green);
  doc.text(fmtV(valorPago || valorCaucao), W/2, y, {align:'center'});
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...gray);
  doc.text('Caucao Recebida', W/2, y+7, {align:'center'});
  y += 22;

  doc.setDrawColor(...lgray); doc.setLineWidth(0.4);
  doc.line(ml+8, y, W/2-6, y); doc.line(W/2+6, y, mr-8, y);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...lgray);
  doc.text('Assinatura do Inquilino',   (ml+8+W/2-6)/2, y+5, {align:'center'});
  doc.text('Assinatura do Responsavel', (W/2+6+mr-8)/2, y+5, {align:'center'});
  y += 16;
  doc.setDrawColor(...lgray); doc.setLineWidth(0.2); doc.line(ml, y, mr, y); y += 5;
  doc.setFontSize(7.5); doc.setTextColor(...lgray);
  doc.text('Locaria · Gestao de Alugueis · '+new Date().toLocaleString('pt-BR'), W/2, y, {align:'center'});

  const fileName = 'Caucao_'+String(c.ID_Contrato||'locaria')+'.pdf';
  const pdfBlob  = doc.output('blob');
  const pdfFile  = new File([pdfBlob], fileName, {type:'application/pdf'});
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if(isMobile && navigator.canShare && navigator.canShare({files:[pdfFile]})){
    try { await navigator.share({ files:[pdfFile], title:'Comprovante de Caução — '+String(c.Nome_Imovel||'') }); }
    catch(e){ if(e.name!=='AbortError') doc.save(fileName); }
    return;
  }
  doc.save(fileName);
}

function compartilharExtratoWhatsApp(idCobranca){
  // Gera e abre o PDF primeiro, depois abre o WhatsApp com link de instrução
  gerarComprovantePDF(idCobranca);

  const c = STATE.cobrancas.find(x => String(x.ID_Cobranca) === String(idCobranca));
  if(!c) return;
  const valorPago = +c.Valor_Pago || +c.Valor_Cobrado || 0;
  const fmtDate = d => d ? new Date(d+'T00:00').toLocaleDateString('pt-BR') : '—';

  // Mensagem de texto simples para WhatsApp
  const msg = [
    '🏠 *Comprovante de Pagamento - Locaria*',
    '',
    `*Imóvel:* ${c.Nome_Imovel}`,
    `*Inquilino:* ${c.Responsavel_Pagamento||'—'}`,
    `*Tipo:* ${optLabel(c.Tipo_Cobranca)} · ${monthLabel(c.Competencia)}`,
    `*Vencimento:* ${fmtDate(c.Data_Vencimento)}`,
    `*Valor pago:* ${fmtBRL2(valorPago)}`,
    `*Data do pagamento:* ${fmtDate(c.Data_Pagamento)}`,
    c.Forma_Pagamento ? `*Forma:* ${optLabel(c.Forma_Pagamento)}` : '',
    '',
    '_O comprovante completo foi gerado em PDF. Salve e anexe nesta conversa._',
    '_Locaria · Gestão de Aluguéis_',
  ].filter(Boolean).join('\n');

  setTimeout(() => {
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  }, 800);
}

/* ─────────────────────────────────────────────────────────────
   HELPERS COMPARTILHADOS — PDF de relatórios (jsPDF)
   ───────────────────────────────────────────────────────────── */
/* Loader único do jsPDF (lazy). Já vem no <head>; se ainda não carregou (ou
   falhou), injeta sob demanda — COM o mesmo SRI do head, para o fallback também
   ser verificado contra adulteração. */
async function _pdfEnsure(){
  if(window.jspdf) return;
  toast('Preparando PDF…');
  await new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.integrity='sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk';
    s.crossOrigin='anonymous';
    s.onload=res; s.onerror=()=>rej(new Error('offline'));
    document.head.appendChild(s);
  });
}
async function _pdfShare(doc,fileName){
  const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const blob=doc.output('blob');
  const file=new File([blob],fileName,{type:'application/pdf'});
  if(isMobile&&navigator.canShare&&navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file],title:fileName.replace('.pdf','').replace(/_/g,' ')}); }
    catch(e){ if(e.name!=='AbortError') doc.save(fileName); }
  } else { doc.save(fileName); }
}
function _pdfPageHeader(doc,W,ml,y,amber,dark,gray,lgray){
  doc.setFillColor(14,17,23); doc.roundedRect(ml,y-5,16,16,2.5,2.5,'F');
  doc.setFillColor(...amber);
  doc.rect(ml+3.5,y-2.8,3,11,'F');
  doc.rect(ml+3.5,y+6.2,9,2,'F');
  doc.setTextColor(...dark); doc.setFont('helvetica','bold'); doc.setFontSize(17);
  doc.text('Locaria',ml+20,y+1);
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...gray);
  doc.text('Gestao de Alugueis',ml+20,y+7.5);
  doc.setFontSize(8); doc.setTextColor(...lgray);
  doc.text(new Date().toLocaleDateString('pt-BR'),W-ml,y+1,{align:'right'});
  return y+16;
}
function _pdfDocHeader(doc,W,ml,y,titulo,sub,info,amber,dark,gray,lgray){
  y=_pdfPageHeader(doc,W,ml,y,amber,dark,gray,lgray);
  doc.setDrawColor(...amber); doc.setLineWidth(0.7); doc.line(ml,y,W-ml,y); y+=8;
  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...amber);
  doc.text(titulo,ml,y); y+=7;
  if(sub){ doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...dark); doc.text(sub,ml,y); y+=6; }
  if(info){ doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...gray); doc.text(info,ml,y); y+=7; }
  return y+2;
}
function _pdfSummary(doc,cards,ml,W,y,amber,dark,gray){
  const n=cards.length, cw=(W-ml*2)/n;
  const clrs={rec:[22,130,74],desp:[192,57,43],saldo:[201,133,42],info:[70,182,196]};
  cards.forEach((c,i)=>{
    const x=ml+i*cw+1;
    doc.setFillColor(248,249,250); doc.roundedRect(x,y,cw-2,18,2,2,'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(100,100,100);
    doc.text(String(c.label).toUpperCase(),x+4,y+6);
    doc.setFont('helvetica','bold'); doc.setFontSize(12);
    doc.setTextColor(...(clrs[c.type]||dark));
    let v=String(c.value||''); while(doc.getTextWidth(v)>cw-8&&v.length>1) v=v.slice(0,-1);
    doc.text(v,x+4,y+14);
  });
  return y+22;
}
function _pdfSecTitle(doc,y,txt,cor){
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...cor);
  doc.text(txt,22,y);
  return y+7;
}
function _pdfTbl(doc,y,ml,mr,heads,widths,rows,rightCols=[]){
  const ROW=7,HDR=8;
  if(y+HDR>268){doc.addPage();y=20;}
  doc.setFillColor(232,236,242); doc.rect(ml,y,mr-ml,HDR,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(100,100,100);
  let x=ml+2;
  heads.forEach((h,i)=>{
    const a=rightCols.includes(i)?'right':'left';
    doc.text(String(h).toUpperCase(),a==='right'?x+widths[i]-3:x,y+5.5,{align:a});
    x+=widths[i];
  });
  y+=HDR;
  if(!rows.length){
    doc.setFillColor(248,249,250); doc.rect(ml,y,mr-ml,9,'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(160,160,160);
    doc.text('Nenhum registro no período',(ml+mr)/2,y+6,{align:'center'});
    return y+12;
  }
  rows.forEach((row,ri)=>{
    if(y+ROW>268){doc.addPage();y=20;}
    if(ri%2===0){doc.setFillColor(248,249,250);doc.rect(ml,y,mr-ml,ROW,'F');}
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(26,26,46);
    x=ml+2;
    row.forEach((cell,ci)=>{
      const a=rightCols.includes(ci)?'right':'left', xP=a==='right'?x+widths[ci]-3:x;
      let t=String(cell||'—'); while(t.length>1&&doc.getTextWidth(t)>widths[ci]-4) t=t.slice(0,-1);
      doc.text(t,xP,y+5,{align:a});
      x+=widths[ci];
    });
    y+=ROW;
  });
  doc.setDrawColor(220,220,220); doc.setLineWidth(0.15); doc.line(ml,y,mr,y);
  return y+5;
}
function _pdfRodape(doc,W,lgray){
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...lgray);
  doc.text('Locaria · Gestao de Alugueis · '+new Date().toLocaleString('pt-BR'),W/2,290,{align:'center'});
}

/* ── Extrato do Imóvel em PDF ── */
async function gerarExtratoImovelPDF(){
  const d=window._rptImovelDados;
  if(!d){toast('Gere o extrato primeiro','err');return;}
  try{await _pdfEnsure();}catch(e){toast('Sem conexão para gerar PDF','err');return;}
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const W=210,ml=18,mr=192;
  const amber=[224,162,60],dark=[26,26,46],gray=[110,110,110],lgray=[190,190,190];
  const fV=v=>(Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const fD=d=>d?new Date(d+'T00:00').toLocaleDateString('pt-BR'):'—';
  let y=22;
  y=_pdfDocHeader(doc,W,ml,y,'Extrato do Imóvel',d.im.Nome_Imovel,(d.im.Endereco_Imovel||'')+' · Período: '+d.periodoFmt,amber,dark,gray,lgray);
  const cards=d.tipoFiltro==='COMPLETO'
    ?[{label:'Aluguéis',value:fV(d.totalAlugueis),type:'rec'},{label:'Encargos',value:fV(d.totalEncargos),type:'info'},{label:'Despesas',value:fV(d.totalDespesas),type:'desp'},{label:'Saldo',value:fV(d.saldo),type:'saldo'}]
    :[{label:'Receitas',value:fV(d.totalAlugueis+d.totalEncargos),type:'rec'},{label:'Despesas',value:fV(d.totalDespesas),type:'desp'},{label:'Saldo',value:fV(d.saldo),type:'saldo'}];
  y=_pdfSummary(doc,cards,ml,W,y,amber,dark,gray); y+=2;
  if(d.tipoFiltro==='COMPLETO'||d.tipoFiltro==='ALUGUEL'){
    y=_pdfSecTitle(doc,y,'Aluguéis ('+d.recAlugueis.length+')',[22,130,74]);
    y=_pdfTbl(doc,y,ml,mr,['Data Pgto.','Tipo','Inquilino','Competência','Valor'],[28,20,60,28,26],d.recAlugueis.map(c=>[fD(c.Data_Pagamento),optLabel(c.Tipo_Cobranca),c.Responsavel_Pagamento||'—',monthLabel(c.Competencia),fV(c.Valor_Pago||c.Valor_Cobrado)]),[4]);
  }
  if(['COMPLETO','ENCARGOS','AGUA','LUZ','IPTU','CONDOMINIO','OUTRO'].includes(d.tipoFiltro)){
    y=_pdfSecTitle(doc,y,'Encargos ('+d.recEncargos.length+')',[70,182,196]);
    y=_pdfTbl(doc,y,ml,mr,['Data Pgto.','Tipo','Pago Por','Competência','Valor'],[28,20,60,28,26],d.recEncargos.map(c=>[fD(c.Data_Pagamento),optLabel(c.Tipo_Cobranca),c.Responsavel_Pagamento||'—',monthLabel(c.Competencia),fV(c.Valor_Pago||c.Valor_Cobrado)]),[4]);
  }
  if(d.tipoFiltro==='COMPLETO'&&d.despesas&&d.despesas.length){
    y=_pdfSecTitle(doc,y,'Despesas / Manutenções ('+d.despesas.length+')',[192,57,43]);
    y=_pdfTbl(doc,y,ml,mr,['Data','Manutenção','Responsável','Status','Custo'],[26,66,34,24,22],d.despesas.map(m=>[fD(m.Data_Conclusao||m.Data_Abertura),m.Titulo||'—',m.Responsavel||'—',optLabel(m.Status),fV(m.Custo||0)]),[4]);
  }
  _pdfRodape(doc,W,lgray);
  await _pdfShare(doc,'Extrato_'+String(d.im.Nome_Imovel).replace(/\s+/g,'_')+'.pdf');
}

/* ── Prestação de Contas em PDF ── */
async function gerarPrestacaoContasPDF(){
  const d=window._rptInqDados;
  if(!d){toast('Gere o relatório primeiro','err');return;}
  try{await _pdfEnsure();}catch(e){toast('Sem conexão para gerar PDF','err');return;}
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const W=210,ml=18,mr=192;
  const amber=[224,162,60],dark=[26,26,46],gray=[110,110,110],lgray=[190,190,190];
  const fV=v=>(Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const fD=dd=>dd?new Date(dd+'T00:00').toLocaleDateString('pt-BR'):'—';
  let y=22;
  const sub=(d.im?d.im.Nome_Imovel:'')+(d.inq.Telefone_Inquilino?' · '+d.inq.Telefone_Inquilino:'');
  y=_pdfDocHeader(doc,W,ml,y,'Prestação de Contas',d.inq.Nome_Inquilino,sub+' · '+d.periodoFmt,amber,dark,gray,lgray);
  y=_pdfSummary(doc,[{label:'Total Pago',value:fV(d.totalPago),type:'rec'},{label:'Em Atraso',value:fV(d.totalAtrasado),type:'desp'},{label:'A Vencer',value:fV(d.totalPendente),type:'saldo'}],ml,W,y,amber,dark,gray); y+=2;
  // Caução
  if(d.inq.Caucao_Valor){
    doc.setFillColor(224,162,60); doc.roundedRect(ml,y,mr-ml,16,2,2,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(35,26,8);
    doc.text('CAUÇÃO DEPOSITADA',ml+4,y+5.5);
    doc.setFontSize(13);
    doc.text(fV(+d.inq.Caucao_Valor),ml+4,y+13);
    if(d.inq.Caucao_Data){
      doc.setFont('helvetica','normal'); doc.setFontSize(9);
      doc.text('Pago em '+fD(d.inq.Caucao_Data),mr-2,y+13,{align:'right'});
    }
    y+=20;
  }
  y=_pdfSecTitle(doc,y,'Contas Pagas ('+d.pagas.length+')',[22,130,74]);
  y=_pdfTbl(doc,y,ml,mr,['Tipo','Competência','Vencimento','Pago em','Forma','Valor'],[20,24,28,28,28,36],d.pagas.map(c=>[optLabel(c.Tipo_Cobranca),monthLabel(c.Competencia),fD(c.Data_Vencimento),fD(c.Data_Pagamento),optLabel(c.Forma_Pagamento||'—'),fV(c.Valor_Pago||c.Valor_Cobrado)]),[5]); y+=2;
  const pendAll=(d.atrasadas||[]).concat(d.pendentes||[]);
  y=_pdfSecTitle(doc,y,'Pendências e Atrasos ('+pendAll.length+')',[192,57,43]);
  y=_pdfTbl(doc,y,ml,mr,['Tipo','Competência','Vencimento','Status','Atraso','Valor'],[20,24,28,24,22,36],pendAll.map(c=>[optLabel(c.Tipo_Cobranca),monthLabel(c.Competencia),fD(c.Data_Vencimento),optLabel(c.Status_Cobranca),diasAtraso(c.Data_Vencimento,c.Status_Cobranca)>0?diasAtraso(c.Data_Vencimento,c.Status_Cobranca)+' d':'—',fV(c.Valor_Cobrado)]),[5]);
  _pdfRodape(doc,W,lgray);
  await _pdfShare(doc,'Prestacao_'+String(d.inq.Nome_Inquilino).replace(/\s+/g,'_')+'.pdf');
}

/* ── Inadimplência Geral em PDF ── */
async function gerarInadimplenciaPDF(){
  const d=window._rptInadDados;
  if(!d){toast('Gere o relatório primeiro','err');return;}
  try{await _pdfEnsure();}catch(e){toast('Sem conexão para gerar PDF','err');return;}
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const W=210,ml=18,mr=192;
  const amber=[224,162,60],dark=[26,26,46],gray=[110,110,110],lgray=[190,190,190];
  const fV=v=>(Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const fD=dd=>dd?new Date(dd+'T00:00').toLocaleDateString('pt-BR'):'—';
  let y=22;
  y=_pdfDocHeader(doc,W,ml,y,'Inadimplência Geral','',new Date().toLocaleDateString('pt-BR'),amber,dark,gray,lgray);
  y=_pdfSummary(doc,[{label:'Total em Atraso',value:fV(d.totalGeral),type:'desp'},{label:'Inadimplentes',value:String(d.lista.length),type:'saldo'}],ml,W,y,amber,dark,gray); y+=2;
  if(!d.lista.length){
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(22,130,74);
    doc.text('Sem inadimplência 🎉',W/2,y+16,{align:'center'});
  }
  d.lista.forEach(g=>{
    if(y+12>268){doc.addPage();y=20;}
    doc.setFillColor(240,241,246); doc.roundedRect(ml,y,mr-ml,12,2,2,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...dark);
    let gn=String(g.nome||''); while(doc.getTextWidth(gn)>120&&gn.length>1) gn=gn.slice(0,-1);
    doc.text(gn,ml+4,y+7.5);
    doc.setTextColor(192,57,43); doc.text(fV(g.total),mr-2,y+7.5,{align:'right'});
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...gray);
    doc.text(String(g.imovel||''),ml+4,y+11.5);
    y+=14;
    y=_pdfTbl(doc,y,ml,mr,['Tipo','Competência','Vencimento','Atraso','Valor'],[28,30,34,28,36],g.items.map(c=>[optLabel(c.Tipo_Cobranca),monthLabel(c.Competencia),fD(c.Data_Vencimento),diasAtraso(c.Data_Vencimento,c.Status_Cobranca)+' d',fV(c.Valor_Cobrado)]),[4]); y+=2;
  });
  _pdfRodape(doc,W,lgray);
  await _pdfShare(doc,'Inadimplencia_Geral.pdf');
}

