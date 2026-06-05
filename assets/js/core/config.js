/* ============================================================
   LOCARIA - core/config.js
   URL do Apps Script, constantes globais, estado (STATE) e indice de modulos.
   ============================================================ */
/* ------------------------------------------------------------
   Carga: classic-scripts que compartilham o escopo global (window).
   Ordem definida em index.html: core/* -> components/* -> modules/*
   -> main.js (bootstrap, sempre por último).
   Mapa de módulos, fluxos e dependências: docs/arquitetura.md
   ------------------------------------------------------------ */

/* ---------- CONFIG DE CONEXÃO ---------- */
const CFG_KEY = 'locaria_cfg';
// URL do Apps Script fixada — não precisa configurar
const CONFIG = { url: 'https://script.google.com/macros/s/AKfycbzX7nF1mnHtIkagkuFNVfH9kaK6PyazMyEILtrSiX5fLGBhqLO4TKwtSGa-UTdS_7OLRQ/exec' };
const LIVE = () => true; // sempre conectado

/* Filtro persistente do Dashboard */
let dashFilter = { modo: 'ATUAL', inicio: '', fim: '' };
/* ---------- ESTADO ---------- */
let STATE = { imoveis:[], inquilinos:[], contratos:[], vistorias:[], cobrancas:[], regras:[], manutencoes:[], reajustes:[], proprietario:{} };
let charts = {};

/* ---------- ESTADO DE UI / FILTROS (compartilhado entre modulos) ---------- */
let filters={cobrancas:{q:'',st:'TODOS'},inquilinos:{q:''},contratos:{q:'',st:'TODOS'},vistorias:{q:'',st:'TODOS'},imoveis:{q:'',st:'TODOS'},regras:{q:'',idImovel:''},manutencoes:{q:''}};
let filtroHist = { q:'', modo:'TODOS', inicio:'', fim:'' };
const FORMAS_PAGAMENTO = ['PIX','DINHEIRO','BOLETO','CARTAO_CREDITO','CARTAO_DEBITO','TRANSFERENCIA','CHEQUE','OUTRO'];
let agendaState = { year: new Date().getFullYear(), month: new Date().getMonth() };
