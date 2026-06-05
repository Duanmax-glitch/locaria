/* ============================================================
   LOCARIA - core/styles.js
   Aplicador de estilos dinâmicos via CSSOM — substitui os antigos atributos
   style="..." inline (2ª fase do CSP rígido).

   POR QUÊ: com style-src sem 'unsafe-inline', o navegador bloqueia qualquer
   atributo style="..." no markup (e não há nonce/hash para atributo de estilo,
   igual aos handlers de evento). A saída é não ter style="" no HTML: o markup
   gerado declara os estilos em data-style="prop:val;prop:val" e aqui os
   reaplicamos via element.style.setProperty(), que NÃO é governado pelo CSP
   (a política cobre o atributo style do HTML / <style>, não a CSSOM por
   propriedade). cssText/setAttribute('style') seriam ambíguos entre navegadores
   — por isso aplicamos sempre propriedade a propriedade.

   - Conteúdo renderizado por JS (innerHTML): um MutationObserver no <body>
     aplica data-style em cada nó inserido (callback roda em microtask, antes do
     paint → sem flash).
   - Shell estático do index.html: o grosso virou CSS de verdade; só os poucos
     data-style do shell são aplicados no init.
   - window.setStyle(el, str): helper exposto para os casos que antes usavam
     element.style.cssText (também bloqueio-sensível).
   ============================================================ */
(function(){
  function setStyle(el, str){
    if(!el || !str) return;
    str.split(';').forEach(function(decl){
      if(!decl) return;
      var i = decl.indexOf(':');           // só o primeiro ':' separa prop/val
      if(i < 0) return;                     // (valores como url(https:) ficam intactos)
      var prop = decl.slice(0, i).trim();
      var val  = decl.slice(i + 1).trim();
      if(!prop) return;
      var priority = '';
      if(/!important\s*$/.test(val)){ val = val.replace(/!important\s*$/, '').trim(); priority = 'important'; }
      try { el.style.setProperty(prop, val, priority); } catch(e){ /* prop inválida: ignora */ }
    });
  }
  window.setStyle = setStyle;

  function applyNode(node){
    if(node.nodeType !== 1) return;                       // só elementos
    if(node.hasAttribute('data-style')) setStyle(node, node.getAttribute('data-style'));
    if(node.querySelectorAll){
      var kids = node.querySelectorAll('[data-style]');
      for(var k = 0; k < kids.length; k++) setStyle(kids[k], kids[k].getAttribute('data-style'));
    }
  }

  // 1) Aplica no que já está no DOM (shell do index.html).
  function init(){ applyNode(document.documentElement); }
  // 2) Observa inserções futuras (todas as views/modais renderizados por JS).
  var mo = new MutationObserver(function(muts){
    for(var i = 0; i < muts.length; i++){
      var added = muts[i].addedNodes;
      for(var j = 0; j < added.length; j++) applyNode(added[j]);
    }
  });
  function start(){ init(); mo.observe(document.body, { childList: true, subtree: true }); }

  if(document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
