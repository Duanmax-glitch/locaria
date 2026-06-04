/* ============================================================
   LOCARIA - components/modal.js
   Modal generico (showModal/closeModal).
   ============================================================ */
function showModal(title,body,foot){
  // Reseta a largura do modal a cada chamada (relatórios podem aumentar para 900px)
  $('#modalBox').style.maxWidth = '';
  $('#modalBox').innerHTML=`
    <div class="modal-head"><h3>${title}</h3><button class="x" onclick="closeModal()">✕</button></div>
    <div class="modal-body">${body}</div>
    <div class="modal-foot">${foot}</div>`;
  $('#modalBg').classList.add('open');
}
function closeModal(){ $('#modalBg').classList.remove('open'); }
$('#modalBg').addEventListener('click',e=>{if(e.target===$('#modalBg'))closeModal();});

