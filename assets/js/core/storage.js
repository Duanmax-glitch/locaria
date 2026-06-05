/* ============================================================
   LOCARIA - core/storage.js
   Persistencia local de sessao (sessionStorage/localStorage).
   ============================================================ */
function salvarSessao(u){ try{ sessionStorage.setItem(USER_KEY, JSON.stringify(u)); }catch(e){} }
function limparSessao(){ try{ sessionStorage.removeItem(USER_KEY); localStorage.removeItem(USER_KEY); }catch(e){} }
