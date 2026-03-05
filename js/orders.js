// ══════════════════════════════════════════════
// SAVE ORDER
// ══════════════════════════════════════════════
function saveOrder() {
  if (!document.getElementById('tc-checkbox').checked) { toast('Please accept the Terms & Conditions first'); return; }
  const q = collectData();
  orders.push(q);
  localStorage.setItem('lh_v3_orders', JSON.stringify(orders));
  toast('Order ' + q.id + ' saved!');
  setTimeout(() => showPage('orders'), 1400);
}

// ══════════════════════════════════════════════
// ORDERS PAGE
// ══════════════════════════════════════════════
const statusClass = {'Quoted':'s-quoted','Deposit Taken':'s-deposit','In Manufacture':'s-manufacture','Delivery Scheduled':'s-delivery','Installed':'s-installed','Complete':'s-complete'};

function renderOrders() {
  const filter = document.getElementById('status-filter').value;
  const list = filter ? orders.filter(o=>o.status===filter) : orders;
  const el = document.getElementById('orders-list');
  if (!list.length) { el.innerHTML=`<div class="muted" style="text-align:center;padding:40px">${filter?'No orders with this status':'No orders yet'}</div>`; return; }
  el.innerHTML = list.slice().reverse().map(o => {
    const idx = orders.indexOf(o);
    const bal = Math.max(0, o.pricing.total-(o.depositActual||0));
    const summary = (o.items||[]).map(i=>`${i.type} — ${i.room}`).join(' · ');
    return `
    <div class="order-card" onclick="openOrderDetail(${idx})">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div class="order-id">${o.id} · ${o.date} · ${o.surveyor||''}</div>
          <div class="order-name">${o.customer.address}</div>
          <div class="order-detail" style="color:var(--text-muted);font-size:12px">${o.customer.name} · ${o.customer.phone}</div>
          <div class="order-detail">${summary}</div>
          <div class="order-detail" style="margin-top:4px">
            💰 <strong>£${o.pricing.total.toLocaleString()}</strong> &nbsp;|&nbsp;
            ✅ Deposit: £${(o.depositActual||0).toLocaleString()} &nbsp;|&nbsp;
            📋 Balance: £${bal.toLocaleString()} &nbsp;|&nbsp;
            📅 ${o.installDate||'TBC'} · ${o.leadTime}
          </div>
        </div>
        <span class="status-badge ${statusClass[o.status]||'s-deposit'}">${o.status}</span>
      </div>
    </div>`;
  }).join('');
}

function openOrderDetail(idx) {
  var o = orders[idx];
  document.getElementById('modal-order-title').textContent = o.id + ' \u2014 ' + o.customer.address;
  var statuses = ['Quoted','Deposit Taken','In Manufacture','Delivery Scheduled','Installed','Complete'];
  var bal = Math.max(0, o.pricing.total-(o.depositActual||0));

  var itemsHTML = (o.items||[]).map(function(item, i) {
    var col = item.customColour || (item.colour ? item.colour.code + ' ' + item.colour.name + ' (' + item.colour.brand + ')' : '\u2014');
    var noteLine = item.bespokeNotes ? '<em style="color:var(--text-muted)">' + item.bespokeNotes + '</em>' : '';
    var sketchLine = item.sketchPNG ? '<img src="' + item.sketchPNG + '" style="width:100%;margin-top:6px;border-radius:6px;border:1px solid var(--border)">' : '';
    return '<div style="background:var(--black3);border-radius:8px;padding:10px;margin-bottom:8px;font-size:12px">' +
      '<strong style="color:var(--red-light)">Item ' + (i+1) + ': ' + item.room + ' \u2014 ' + item.type + '</strong><br>' +
      item.w + '\u00d7' + item.h + '\u00d7' + item.d + 'mm \u00b7 ' + item.doorStyle + ' \u00b7 ' + col + ' \u00b7 Interior: ' + item.interiorFinish + '<br>' +
      noteLine + sketchLine + '</div>';
  }).join('');

  var statusToggles = statuses.map(function(s) {
    return '<div class="toggle-opt' + (o.status===s?' selected':'') + '" onclick="updateStatus(' + idx + ',\'' + s + '\',this)">' + s + '</div>';
  }).join('');

  var notesHTML = (o.notes||[]).map(function(n) {
    return '<div style="padding:8px;background:var(--black3);border-radius:8px;margin-bottom:6px;font-size:12px"><span class="muted">' + n.date + '</span> \u2014 ' + n.text + '</div>';
  }).join('');

  var internalBox = o.internalNotes ? '<div style="background:rgba(243,156,18,0.08);border:1px solid rgba(243,156,18,0.3);border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px;color:#f5b041"><strong>\uD83D\uDD12 Internal Notes:</strong> ' + o.internalNotes + '</div>' : '';

  document.getElementById('modal-order-body').innerHTML =
    '<div style="margin-bottom:14px">' +
      '<label style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted)">Update Status</label>' +
      '<div class="toggle-group" style="margin-top:7px" id="st-tog-' + idx + '">' + statusToggles + '</div>' +
    '</div>' +
    '<div class="divider"></div>' +
    '<div class="form-grid" style="gap:10px;margin-bottom:14px">' +
      '<div><div class="muted">Customer</div>' + o.customer.name + '<br><span class="muted">' + o.customer.email + '<br>' + o.customer.phone + '</span></div>' +
      '<div><div class="muted">Address</div>' + o.customer.address + '</div>' +
      '<div><div class="muted">Lead / Install</div>' + o.leadTime + ' \u00b7 ' + (o.installDate||'TBC') + '</div>' +
      '<div><div class="muted">Agent</div>' + (o.surveyor||'\u2014') + '</div>' +
    '</div>' +
    internalBox +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">' +
      '<div style="background:var(--black3);border-radius:8px;padding:12px;text-align:center"><div class="muted" style="font-size:10px">TOTAL</div><div style="color:var(--red-light);font-size:18px;font-weight:bold">\u00a3' + o.pricing.total.toLocaleString() + '</div></div>' +
      '<div style="background:var(--black3);border-radius:8px;padding:12px;text-align:center"><div class="muted" style="font-size:10px">DEPOSIT PAID</div><div style="color:#58d68d;font-size:18px;font-weight:bold">\u00a3' + (o.depositActual||0).toLocaleString() + '</div></div>' +
      '<div style="background:var(--black3);border-radius:8px;padding:12px;text-align:center"><div class="muted" style="font-size:10px">BALANCE DUE</div><div style="color:var(--warning);font-size:18px;font-weight:bold">\u00a3' + bal.toLocaleString() + '</div></div>' +
    '</div>' +
    '<div style="margin-bottom:14px">' + itemsHTML + '</div>' +
    '<div class="divider"></div>' +
    '<div style="margin-bottom:10px">' +
      '<div class="muted" style="margin-bottom:6px;font-size:10px;letter-spacing:1px;text-transform:uppercase">Add Note</div>' +
      '<div style="display:flex;gap:8px"><input type="text" id="note-input-' + idx + '" placeholder="e.g. Panels ordered, delivery booked..."><button class="btn btn-red btn-sm" onclick="addNote(' + idx + ')">Add</button></div>' +
    '</div>' +
    '<div id="notes-list-' + idx + '">' + notesHTML + '</div>' +
    '<div class="divider"></div>' +
    '<div class="btn-row">' +
      '<button class="btn btn-dark btn-sm" onclick="printOrder(' + idx + ')">\uD83D\uDDA8\uFE0F Print A4</button>' +
      '<button class="btn btn-info btn-sm" onclick="emailOrder(' + idx + ')">\uD83D\uDCE7 Email Customer</button>' +
      '<button class="btn btn-whatsapp btn-sm" onclick="waOrder(' + idx + ')">\uD83D\uDCAC WhatsApp</button>' +
      '<button class="btn btn-dark btn-sm" onclick="emailMfg(' + idx + ')">\uD83C\uDFED Email Manufacturing</button>' +
      '<button class="btn btn-danger btn-sm" onclick="deleteOrder(' + idx + ')">\uD83D\uDDD1 Delete</button>' +
    '</div>';
  document.getElementById('modal-order').classList.add('open');
}
function updateStatus(idx, status, el) {
  const g = el.closest('.toggle-group');
  g.querySelectorAll('.toggle-opt').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
  orders[idx].status = status;
  localStorage.setItem('lh_v3_orders', JSON.stringify(orders));
  renderOrders(); renderPipeline();
  toast('Status updated: ' + status);
}

function addNote(idx) {
  var input = document.getElementById('note-input-'+idx);
  var text = input.value.trim(); if (!text) return;
  if (!orders[idx].notes) orders[idx].notes=[];
  var note = {date:new Date().toLocaleString('en-GB'), text:text};
  orders[idx].notes.push(note);
  localStorage.setItem('lh_v3_orders', JSON.stringify(orders));
  document.getElementById('notes-list-'+idx).innerHTML += '<div style="padding:8px;background:var(--black3);border-radius:8px;margin-bottom:6px;font-size:12px"><span class="muted">'+note.date+'</span> — '+note.text+'</div>';
  input.value=''; toast('Note saved');
}

function deleteOrder(idx) {
  if (!confirm('Delete this order permanently?')) return;
  orders.splice(idx,1); localStorage.setItem('lh_v3_orders',JSON.stringify(orders));
  closeModal('modal-order'); renderOrders(); renderPipeline(); toast('Deleted');
}


function printOrder(idx) {
  const o = orders[idx];
  const html = buildQuoteHTML(o);
  document.getElementById('print-frame-content').innerHTML = html;
  document.getElementById('print-frame').style.display = 'block';
  document.getElementById('modal-order').classList.remove('open');
}

function closePrintFrame() {
  document.getElementById('print-frame').style.display = 'none';
}

function emailOrder(idx) {
  const o=orders[idx], bal=Math.max(0,o.pricing.total-(o.depositActual||0));
  const subj=encodeURIComponent(`Order Update — ${o.id} — Luxury House`);
  const body=encodeURIComponent(`Dear ${o.customer.name},\n\nYour order ${o.id} is now: ${o.status}.\n\nInstall Date: ${o.installDate||'TBC'}\nBalance Due: £${bal.toLocaleString()}\n\nKind regards,\n${o.surveyor||'The Team'}\nLuxury House`);
  window.location.href=`mailto:${o.customer.email}?subject=${subj}&body=${body}`;
}

function waOrder(idx) {
  const o=orders[idx], bal=Math.max(0,o.pricing.total-(o.depositActual||0));
  const name=o.customer.name.split(' ')[0];
  const itemLines=(o.items||[]).map((it,i)=>{
    const tot=it.basePrice+Math.round(it.basePrice*0.2);
    const col=it.customColour||(it.colour?it.colour.code+' '+it.colour.name:'—');
    return '\n─────────────────────'
      +'\n*Item '+(i+1)+':* '+it.type+' — '+it.room
      +'\n'+it.w+'mm W × '+it.h+'mm H × '+it.d+'mm D'
      +'\n'+it.doorStyle+' | '+it.finish+' | '+col
      +'\nInterior: '+it.rails+', '+it.shelves+' shelves'
      +(it.drawers&&it.drawers!=='No Drawers'?', '+it.drawers:'')
      +(it.bespokeNotes?'\nNotes: '+it.bespokeNotes:'')
      +'\n*Item Total:* £'+tot.toLocaleString()+' inc. VAT';
  }).join('');
  const msg=encodeURIComponent(
    'Hi '+name+'! 👋'
    +'\n\n*Order Update — Luxury House*'
    +'\n━━━━━━━━━━━━━━━━━━━━━━'
    +'\n*Ref:* '+o.id+'  |  *Status:* '+o.status
    +'\n*Address:* '+o.customer.address
    +itemLines
    +'\n\n━━━━━━━━━━━━━━━━━━━━━━'
    +'\n*Total:* £'+o.pricing.total.toLocaleString()+' inc. VAT'
    +'\n*Deposit:* £'+(o.depositActual||0).toLocaleString()
    +'\n*Balance Due:* £'+bal.toLocaleString()
    +'\n*Install Date:* '+(o.installDate||'TBC')
    +'\n*Lead Time:* '+o.leadTime
    +'\n━━━━━━━━━━━━━━━━━━━━━━'
    +'\n\n_Luxury House | Luxury Fitted Wardrobes_ 🏠'
    +'\nwww.luxuryhouseonline.com'
  );
  window.open('https://wa.me/'+o.customer.phone.replace(/\D/g,'')+'?text='+msg,'_blank');
}

function emailMfg(idx) {
  const o=orders[idx];
  const lines=(o.items||[]).map((item,i)=>`\nItem ${i+1}: ${item.type} — ${item.room}\n  ${item.w}x${item.h}x${item.d}mm x${item.units}\n  ${item.doorStyle}, ${item.finish}\n  Board: ${item.customColour||(item.colour?item.colour.code+' '+item.colour.name+' ('+item.colour.brand+')':'—')}\n  Handles: ${item.handles}\n  Rails: ${item.rails} | Shelves: ${item.shelves} | Drawers: ${item.drawers}\n  Interior colour: ${item.interiorFinish}\n  Accessories: ${item.addons.join(', ')||'None'}\n  Notes: ${item.bespokeNotes||'None'}`).join('\n');
  const subj=encodeURIComponent(`MANUFACTURING — ${o.id} — ${o.customer.name}`);
  const body=encodeURIComponent(`MANUFACTURING ORDER — Luxury House\n\nRef: ${o.id}\nCustomer: ${o.customer.name}\nAddress: ${o.customer.address}\nInstall: ${o.installDate||'TBC'}\nAgent: ${o.surveyor||'N/A'}\nLead Time: ${o.leadTime}\n${lines}\n\nOrdered: ${o.date}`);
  window.location.href=`mailto:manufacturing@luxuryhouseonline.com?subject=${subj}&body=${body}`;
  toast('Manufacturing email opened');
}

// ══════════════════════════════════════════════
// PIPELINE
// ══════════════════════════════════════════════
const pipeStages=[{key:'Quoted',icon:'📋'},{key:'Deposit Taken',icon:'💳'},{key:'In Manufacture',icon:'🔨'},{key:'Delivery Scheduled',icon:'🚚'},{key:'Installed',icon:'🪞'},{key:'Complete',icon:'✅'}];

function renderPipeline() {
  const total=orders.reduce((s,o)=>s+o.pricing.total,0);
  const outstanding=orders.filter(o=>o.status!=='Complete').reduce((s,o)=>s+Math.max(0,o.pricing.total-(o.depositActual||0)),0);
  document.getElementById('pipeline-summary').textContent=`${orders.length} orders · £${total.toLocaleString()} pipeline · £${outstanding.toLocaleString()} outstanding`;
  document.getElementById('pipeline-board').innerHTML = pipeStages.map(function(stage) {
    var so = orders.filter(function(o) { return o.status === stage.key; });
    var cards = so.map(function(o) {
      return '<div class="pipe-card" onclick="openOrderDetail(' + orders.indexOf(o) + ')">' +
        '<div style="font-weight:bold;margin-bottom:2px;font-size:11px">' + o.customer.address + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted)">' + o.customer.name + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted)">' + o.id + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted)">' + (o.items||[]).length + ' item' + ((o.items||[]).length!==1?'s':'') + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted)">\u00a3' + o.pricing.total.toLocaleString() + ' total</div>' +
        '<div style="font-size:11px;color:var(--text-muted)">Bal: \u00a3' + Math.max(0,o.pricing.total-(o.depositActual||0)).toLocaleString() + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted)">\uD83D\uDCC5 ' + (o.installDate||'TBC') + '</div>' +
        '</div>';
    }).join('') || '<div style="font-size:11px;color:var(--border);padding:6px">Empty</div>';
    return '<div class="pipe-col">' +
      '<div class="pipe-col-title">' + stage.icon + ' ' + stage.key + ' (' + so.length + ')</div>' +
      cards +
      '<div style="font-size:10px;color:var(--text-muted);margin-top:6px">\u00a3' + so.reduce(function(s,o){return s+o.pricing.total;},0).toLocaleString() + '</div>' +
      '</div>';
  }).join('');
}


// ══════════════════════════════════════════════
// SAMPLE DATA
// ══════════════════════════════════════════════
if (orders.length===0) {
  orders.push({
    id:'LH-001',date:'14/02/2025',
    customer:{name:'Sarah Thompson',email:'sarah@example.com',phone:'+44 7700 112233',address:'45 Oak Avenue, Surrey, KT6 4AB'},
    surveyor:'Mark Davies',internalNotes:'Customer agreed £1,000 deposit. Paying remainder 2 weeks before install.',
    items:[
      {id:1,type:'Sliding Door Fitted',room:'Master Bedroom',doors:'4 Door',w:'3200',h:'2260',d:'600',units:1,doorStyle:'Handleless',finish:'Matt',colour:{code:'U708',name:'Light Grey',brand:'Egger',hex:'#c8c8c8'},customColour:'',handles:'None / Handleless',rails:'Double Hang',shelves:6,drawers:'4 Drawers',addons:['LED Lighting','Soft-Close'],interiorFinish:'White',bespokeNotes:'Slight slope on left — 40mm drop over 3.2m.',extraPrice:0,sketchHistory:[],sketchPNG:null,basePrice:7731},
      {id:2,type:'Hinged Door Fitted',room:'Bedroom 2',doors:'2 Door',w:'1800',h:'2260',d:'580',units:1,doorStyle:'Shaker',finish:'Matt',colour:{code:'W1000',name:'Alpine White',brand:'Egger',hex:'#f8f8f8'},customColour:'',handles:'Matt Black',rails:'Long Hang (Full Height)',shelves:3,drawers:'No Drawers',addons:[],interiorFinish:'White',bespokeNotes:'',extraPrice:0,sketchHistory:[],sketchPNG:null,basePrice:3240}
    ],
    pricing:{total:13166,rec:6583,disc:0},depositActual:1000,
    paymentMethod:'Bank Transfer',leadTime:'8–10 Weeks',installDate:'2025-04-28',
    sigCustomerPNG:null,sigAgentPNG:null,sigCustomerName:'Sarah Thompson',sigAgentName:'Mark Davies',
    status:'In Manufacture',notes:[{date:'15/02/2025, 09:30',text:'Order confirmed. £1,000 deposit taken. Sent to manufacturing.'}]
  });
  orders.push({
    id:'LH-002',date:'18/02/2025',
    customer:{name:'James Mitchell',email:'james@example.com',phone:'+44 7711 445566',address:'12 Manor Road, London, SW1A 1AA'},
    surveyor:'Claire Hobbs',internalNotes:'VIP — referred by the Andersons. Only paid £500 today, will pay more next week.',
    items:[
      {id:1,type:'Walk-In Wardrobe',room:'Dressing Room',doors:'Open / No Doors',w:'4800',h:'2260',d:'600',units:2,doorStyle:'Handleless',finish:'High Gloss',colour:{code:'U999',name:'Black',brand:'Egger',hex:'#111111'},customColour:'',handles:'Brushed Gold',rails:'Half & Half',shelves:12,drawers:'Full Drawer Bank',addons:['LED Lighting','Pull-Out Mirror','Shoe Racks','Soft-Close'],interiorFinish:'Matching',bespokeNotes:'Island unit in centre — 1200x600mm, 6 drawers.',extraPrice:1200,sketchHistory:[],sketchPNG:null,basePrice:18955}
    ],
    pricing:{total:22746,rec:11373,disc:0},depositActual:500,
    paymentMethod:'Card (payment link)',leadTime:'10–12 Weeks',installDate:'2025-05-12',
    sigCustomerPNG:null,sigAgentPNG:null,sigCustomerName:'James Mitchell',sigAgentName:'Claire Hobbs',
    status:'Deposit Taken',notes:[{date:'18/02/2025, 16:00',text:'£500 deposit taken on day. Customer paying further £5,000 next week.'}]
  });
  localStorage.setItem('lh_v3_orders',JSON.stringify(orders));
}
