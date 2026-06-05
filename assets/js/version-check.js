/* ============================================================
   LOCARIA - version-check.js
   Auto-atualização: evita que o usuário fique preso numa versão antiga em cache.
   Compara o ETag/Last-Modified do próprio index.html a cada carga; se mudou
   (novo deploy), recarrega uma única vez. Zero manutenção — não precisa bumpar
   versão manualmente.

   Externalizado do <script> inline do index.html para permitir CSP rígido sem
   'unsafe-inline' (blocos de script inline são bloqueados pela política).
   ============================================================ */
(function(){
  try{
    var KEY = 'locaria_version_tag';
    fetch(location.pathname, { method:'HEAD', cache:'no-store' })
      .then(function(r){
        var tag = r.headers.get('ETag') || r.headers.get('Last-Modified');
        if(!tag) return;                          // header ausente: não faz nada
        var stored = localStorage.getItem(KEY);
        if(stored === null){                      // primeira visita: só registra
          localStorage.setItem(KEY, tag);
          return;
        }
        if(stored !== tag){                       // versão publicada mudou → atualiza
          localStorage.setItem(KEY, tag);         // grava antes de recarregar (evita loop)
          if(sessionStorage.getItem('locaria_reloaded') !== tag){
            sessionStorage.setItem('locaria_reloaded', tag);
            location.reload();
          }
        }
      })
      .catch(function(){ /* offline / sem header: ignora silenciosamente */ });
  }catch(e){}
})();
