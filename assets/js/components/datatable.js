/* ============================================================
   LOCARIA - components/datatable.js
   Casca de tabela reutilizavel (tableShell/emptyRow/cap).
   ============================================================ */
function tableShell(sheet,q,ph,heads,body){
  return `<div class="table-tools">
    <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input placeholder="${ph}" value="${esc(q)}" data-on-input="filter-search" data-sheet="${sheet}"></div>
  </div>
  <div class="tbl-card"><div class="tbl-scroll"><table>
    <thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${body}</tbody></table></div></div>`;
}
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function emptyRow(cols,msg){return `<tr><td colspan="${cols}"><div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><div>${msg}</div></div></td></tr>`;}
