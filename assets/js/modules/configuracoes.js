/* ============================================================
   LOCARIA - modules/configuracoes.js
   Configuracoes: regras de cobranca, proprietario e modal de conexao.
   ============================================================ */
function renderRegras(){
  const f=filters.regras;
  let rows=STATE.regras.slice();
  const imName=id=>{const im=STATE.imoveis.find(x=>String(x.ID_Imovel)===String(id));return im?im.Nome_Imovel:'#'+id;};
  // Filtro por imóvel
  if(f.idImovel) rows=rows.filter(r=>String(r.ID_Imovel)===String(f.idImovel));
  if(f.q) rows=rows.filter(r=>imName(r.ID_Imovel).toLowerCase().includes(f.q.toLowerCase())||(r.Tipo_Cobranca||'').toLowerCase().includes(f.q.toLowerCase()));
  const body=rows.length?rows.map(r=>`<tr>
      <td class="cell-strong">${esc(r.ID_Regra)}</td>
      <td><div class="row-flex"><div class="av" style="background:${avColor(r.ID_Imovel)}">${initials(imName(r.ID_Imovel))}</div><div class="cell-strong">${esc(imName(r.ID_Imovel))}</div></div></td>
      <td>${tipoBadge(r.Tipo_Cobranca)}</td>
      <td class="money">${r.Valor_Padrao?fmtBRL2(r.Valor_Padrao):'<span style="color:var(--txt-mute)">variável</span>'}</td>
      <td>${r.Gerar_Automatico==='SIM'?'<span class="badge b-pago">Automático</span>':'<span class="badge b-vago">Manual</span>'}</td>
      <td>${statusBadge(r.Status_Regra)}</td>
      <td><div class="act-group">
        <button class="act-btn" onclick="openForm('regras','${r.ID_Regra}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="act-btn del" onclick="askDelete('regras','ID_Regra','${r.ID_Regra}','${escJs(r.ID_Regra)}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div></td>
    </tr>`).join('') : emptyRow(7,'Nenhuma regra encontrada');

  // Sempre re-renderiza porque o select de imóvel precisa do valor selecionado
  const imoveisOpts = `<option value="">Todos os imóveis</option>` +
    STATE.imoveis.map(im=>`<option value="${im.ID_Imovel}" ${String(f.idImovel)===String(im.ID_Imovel)?'selected':''}>${esc(im.Nome_Imovel)}</option>`).join('');

  const existingTbody = document.querySelector('#view-regras tbody');
  if(existingTbody){
    existingTbody.innerHTML = body;
    const selIm = document.querySelector('#view-regras #regrasImovelFiltro');
    if(selIm) selIm.value = f.idImovel || '';
    return;
  }

  $('#view-regras').innerHTML=`
    <div class="table-tools">
      <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input id="regrasSearch" placeholder="Buscar regra…" value="${esc(f.q)}" oninput="filters.regras.q=this.value;renderRegras()"></div>
      <div style="display:flex;align-items:center;gap:8px">
        <label style="font-size:13px;color:var(--txt-dim);white-space:nowrap">Imóvel:</label>
        <select id="regrasImovelFiltro" style="background:var(--bg-soft);border:1px solid var(--line-soft);color:var(--txt);border-radius:8px;padding:8px 12px;font-size:13px;cursor:pointer" onchange="filters.regras.idImovel=this.value;renderRegras()">${imoveisOpts}</select>
      </div>
    </div>
    <div class="tbl-card"><div class="tbl-scroll"><table>
      <thead><tr><th>Regra</th><th>Imóvel</th><th>Tipo</th><th>Valor padrão</th><th>Geração</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody>${body}</tbody></table></div></div>`;
}

function openConn(){
  showModal('Conexão com Google Sheets',
    `<p class="conn-steps" style="margin-bottom:16px">Cole abaixo a <strong style="color:var(--txt)">URL do App da Web</strong> que você gerou no Google Apps Script.</p>
     <div class="field full"><label>URL do Web App</label>
       <input id="connUrl" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(CONFIG.url)}"></div>
     <ol class="conn-steps" style="margin-top:16px">
       <li>Abra sua planilha → <span class="code-chip">Extensões → Apps Script</span></li>
       <li>Cole o código do arquivo <span class="code-chip">Codigo.gs</span> que te enviei</li>
       <li><span class="code-chip">Implantar → Nova implantação → App da Web</span></li>
       <li>Acesso: <span class="code-chip">Qualquer pessoa</span> → copie a URL → cole aqui</li>
     </ol>`,
    `<button class="btn ghost" onclick="closeModal()">Cancelar</button>
     <button class="btn primary" onclick="connectNow()">Conectar</button>`);
}
async function connectNow(){
  const url=$('#connUrl').value.trim();
  if(!url || !/^https:\/\/script\.google\.com/.test(url)){ toast('URL inválida','err'); return; }
  CONFIG.url=url; localStorage.setItem(CFG_KEY,JSON.stringify(CONFIG));
  limparSessao();
  closeModal();
  toast('URL salva! Faça login novamente.');
  setTimeout(()=>window.location.reload(), 1200);
}

function renderProprietario(){
  const p = STATE.proprietario || {};
  const temDados = !!p.Nome_Proprietario;

  if(!temDados){
    $('#view-proprietario').innerHTML=`
      <div style="max-width:520px;margin:48px auto;text-align:center">
        <div style="width:72px;height:72px;border-radius:20px;background:var(--panel);border:1px solid var(--line-soft);display:grid;place-items:center;margin:0 auto 20px">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--txt-mute)" stroke-width="1.5" width="36">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
          </svg>
        </div>
        <div style="font-family:var(--serif);font-size:22px;font-weight:600;margin-bottom:8px">Proprietário não cadastrado</div>
        <div style="color:var(--txt-dim);line-height:1.7">Para cadastrar ou alterar os dados do proprietário, acesse diretamente a aba <strong style="color:var(--txt)">Proprietario</strong> na planilha Google Sheets.<br><br>Os dados aparecerão automaticamente aqui e nos recibos após salvar.</div>
      </div>`;
    return;
  }

  $('#view-proprietario').innerHTML=`
    <div style="max-width:620px">
      <!-- Cabeçalho com nome e contato -->
      <div style="background:linear-gradient(135deg,var(--panel),var(--bg-soft));border:1px solid var(--line-soft);border-radius:16px;padding:24px;margin-bottom:20px;display:flex;align-items:center;gap:20px;flex-wrap:wrap">
        <div style="width:60px;height:60px;border-radius:16px;background:var(--amber);display:grid;place-items:center;flex-shrink:0">
          <svg viewBox="0 0 24 24" fill="none" stroke="#231a08" stroke-width="2.5" width="30">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
          </svg>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-family:var(--serif);font-size:22px;font-weight:700;letter-spacing:-.3px">${esc(p.Nome_Proprietario||'')}</div>
          <div style="font-size:13px;color:var(--txt-dim);margin-top:4px;display:flex;flex-wrap:wrap;gap:10px">
            ${p.Email_Proprietario?`<span>${esc(p.Email_Proprietario)}</span>`:''}
            ${p.Telefone_Proprietario?`<span>${esc(p.Telefone_Proprietario)}</span>`:''}
          </div>
        </div>
      </div>

      <!-- Chave PIX em destaque -->
      ${p.Chave_PIX ? `
      <div style="background:rgba(62,197,139,.08);border:1px solid rgba(62,197,139,.2);border-radius:12px;padding:18px 22px;display:flex;align-items:center;gap:18px;flex-wrap:wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="30"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <div>
          <div style="font-size:11px;color:var(--emerald);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:3px">Chave PIX</div>
          <div style="font-size:18px;font-weight:700;color:var(--txt)">${esc(p.Chave_PIX)}</div>
          ${p.Banco_Proprietario?`<div style="font-size:12px;color:var(--txt-dim);margin-top:3px">${esc(p.Banco_Proprietario)}${p.Agencia_Proprietario?' · Ag. '+esc(p.Agencia_Proprietario):''}${p.Conta_Proprietario?' · Cc. '+esc(p.Conta_Proprietario):''}</div>`:''}
        </div>
      </div>` : ''}

    </div>`;
}

