// ==============================================================
// APP — Global Mutable State & UI Utilities
// ==============================================================

let orders = JSON.parse(localStorage.getItem('lh_v3_orders') || '[]');
let currentStep = 1;
let items = [];
let itemCounter = 0;

// ══════════════════════════════════════════════
// NAV & UTILS
// ══════════════════════════════════════════════
function showPage(name) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.getElementById('tab-'+name).classList.add('active');
  if (name==='orders') renderOrders();
  if (name==='pipeline') renderPipeline();
  if (name==='quote') { items=[]; itemCounter=0; currentStep=1; goStep(1); }
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

let toastTimer;
function toast(msg) {
  const el=document.getElementById('toast');
  el.textContent=msg; el.style.display='block';
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.style.display='none',3000);
}

