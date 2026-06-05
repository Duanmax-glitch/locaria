/* ============================================================
   LOCARIA - core/security.js
   Sanitizacao anti-XSS para conteudo HTML (esc) e para valores
   interpolados em handlers inline (escJs).
   Demais protecoes do sistema (ver docs/arquitetura.md):
     - SRI (integrity) nos scripts de CDN .......... index.html (head)
     - Auto-atualizacao por ETag/Last-Modified ...... index.html (head)
     - Token no corpo (nunca na URL) ................ core/api.js
     - Sessao em sessionStorage + expiracao ......... core/auth.js / core/storage.js
     - Deteccao de sessao invalida + relogin ........ core/auth.js
     - Allow-list de e-mails / perfis ............... servidor (Apps Script)
   Nenhuma mitigacao foi removida na modularizacao.
   ============================================================ */
const esc = s => String(s==null?'':s).replace(/[&<>"'`]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));
/* esc(): conteúdo/atributos normais. escJs(): valores interpolados dentro de um
   handler inline (onclick="...('${x}')..."), onde esc() não é suficiente. */
const escJs = s => String(s==null?'':s).replace(/[\\'"<>&\r\n]/g, c => '\\x'+c.charCodeAt(0).toString(16).padStart(2,'0'));
