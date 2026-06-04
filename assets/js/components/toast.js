/* ============================================================
   LOCARIA - components/toast.js
   Notificacoes (toast).
   ============================================================ */
function toast(msg,type='ok'){
  const w=$('#toastWrap'); const t=document.createElement('div'); t.className='toast '+type;
  const ic = type==='ok'?'<path d="M20 6L9 17l-5-5"/>':'<path d="M18 6 6 18M6 6l12 12"/>';
  t.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">${ic}</svg><span>${esc(msg)}</span>`;
  w.appendChild(t); setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(40px)';t.style.transition='.3s';setTimeout(()=>t.remove(),300);},2800);
}
