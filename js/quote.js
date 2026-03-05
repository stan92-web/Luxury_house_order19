// ══════════════════════════════════════════════
// SIGNATURE CANVASES
// ══════════════════════════════════════════════
function initSigCanvases() {
  ['sig-customer','sig-agent'].forEach(id => {
    const c = document.getElementById(id);
    if (!c || c._siginit) return;
    c._siginit = true;
    c.width = c.parentElement.clientWidth || 300;
    let drawing = false;
    const getPos = e => {
      const r=c.getBoundingClientRect();
      const src=e.touches?e.touches[0]:e;
      return {x:src.clientX-r.left,y:src.clientY-r.top};
    };
    const start = e => { drawing=true; const p=getPos(e); const ctx=c.getContext('2d'); ctx.beginPath(); ctx.moveTo(p.x,p.y); };
    const move = e => { if(!drawing)return; e.preventDefault(); const p=getPos(e); const ctx=c.getContext('2d'); ctx.lineTo(p.x,p.y); ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.stroke(); };
    const end = () => drawing=false;
    c.addEventListener('mousedown',start); c.addEventListener('touchstart',start,{passive:true});
    c.addEventListener('mousemove',move); c.addEventListener('touchmove',move,{passive:false});
    c.addEventListener('mouseup',end); c.addEventListener('touchend',end);
  });
}

function clearSig(id) {
  const c=document.getElementById(id);
  if(c){const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);}
}

// ══════════════════════════════════════════════
// STEPPER
// ══════════════════════════════════════════════
function goStep(n) {
  if (n > currentStep && !validateStep(currentStep)) return;
  document.querySelectorAll('.quote-section').forEach(s=>s.classList.remove('active'));
  document.getElementById('qs-'+n).classList.add('active');
  for (let i=1;i<=4;i++) {
    const el=document.getElementById('si-'+i);
    el.className='step'+(i<n?' done':i===n?' active':'');
    el.querySelector('.step-num').textContent=i<n?'✓':i;
  }
  currentStep=n;
  if (n===2 && items.length===0) addItem();
  if (n===3) {
    updateGrandTotal();
    setTimeout(initSigCanvases,120);
    // Auto-populate install date to ~4 weeks from today if not already set
    const installEl = document.getElementById('install-date');
    if (installEl && !installEl.value) {
      const d = new Date();
      d.setDate(d.getDate() + 28);
      installEl.value = d.toISOString().split('T')[0];
    }
    // Auto-populate today's date for signatures
    const sigDateEl = document.getElementById('sig-customer-date');
    if (sigDateEl && !sigDateEl.value) {
      sigDateEl.value = new Date().toISOString().split('T')[0];
    }
  }
  if (n===4) { document.getElementById('final-preview').innerHTML=buildQuoteHTML(collectData()); }
  window.scrollTo({top:0,behavior:'smooth'});
}

function validateStep(n) {
  if (n===1) {
    if (!document.getElementById('c-first')?.value.trim() || !document.getElementById('c-phone')?.value.trim() || !document.getElementById('c-address')?.value.trim()) {
      toast('Please enter customer First Name, Phone and Address'); return false;
    }
  }
  if (n===2) {
    for (const item of items) {
      if (!item.w) { toast('Item '+(items.indexOf(item)+1)+': Please enter the width'); return false; }
    }
  }
  return true;
}

// ══════════════════════════════════════════════
// COLLECT DATA
// ══════════════════════════════════════════════
function collectData() {
  const g = calcGrand();
  const actual = parseInt(document.getElementById('deposit-actual')?.value) || g.rec;
  return {
    id: 'LH-' + Date.now().toString().slice(-6),
    date: new Date().toLocaleDateString('en-GB'),
    customer: {
      name: `${document.getElementById('c-first').value} ${document.getElementById('c-last').value}`,
      email: document.getElementById('c-email').value,
      phone: document.getElementById('c-phone').value,
      address: document.getElementById('c-address').value,
    },
    surveyor: document.getElementById('c-surveyor').value,
    internalNotes: document.getElementById('c-notes').value,
    items: items.map(item => ({
      ...item,
      sketchPNG: getSketchPNG(item.id),
      basePrice: calcItemPrice(item),
    })),
    pricing: { total: g.total, rec: g.rec, disc: g.disc },
    depositActual: actual,
    paymentMethod: document.getElementById('payment-method').value,
    leadTime: document.getElementById('lead-time').value,
    installDate: document.getElementById('install-date').value,
    sigCustomerPNG: (function(){ const c=document.getElementById('sig-customer'); return c?c.toDataURL():null; }()),
    sigAgentPNG: (function(){ const c=document.getElementById('sig-agent'); return c?c.toDataURL():null; }()),
    sigCustomerName: document.getElementById('sig-customer-name').value,
    sigCustomerDate: (function(){ const d=document.getElementById('sig-customer-date') && document.getElementById('sig-customer-date').value; if(!d)return ''; const p=d.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }()),
    sigAgentName: document.getElementById('sig-agent-name').value,
    status: (document.getElementById('dep-actual')&&parseFloat(document.getElementById('dep-actual').value)>0)?'Deposit Taken':'Quoted',
    notes: [],
  };
}

// ══════════════════════════════════════════════
// BUILD QUOTE HTML
// ══════════════════════════════════════════════
function buildQuoteHTML(q) {
  var bal = Math.max(0, q.pricing.total - q.depositActual);
  var colFn = function(item) { return item.customColour || (item.colour ? item.colour.code + ' ' + item.colour.name + ' (' + item.colour.brand + ')' : '—'); };

  var itemsHTML = (q.items||[]).map(function(item, idx) {
    var vat = Math.round(item.basePrice * 0.2);
    var tot = item.basePrice + vat;
    var col = colFn(item);
    var addonLine = '';
    if (item.addons && item.addons.length) {
      addonLine = '<div class="qp-row"><span>Accessories</span><span>' + item.addons.join(', ') + (item.customAddon ? ', ' + item.customAddon : '') + '</span></div>';
    } else if (item.customAddon) {
      addonLine = '<div class="qp-row"><span>Accessories</span><span>' + item.customAddon + '</span></div>';
    }
    var notesLine = item.bespokeNotes ? '<div class="qp-row"><span>Special Notes</span><span>' + item.bespokeNotes + '</span></div>' : '';
    var extraLine = item.extraPrice ? '<div class="qp-row"><span>Additional Works</span><span>\u00a3' + parseFloat(item.extraPrice).toLocaleString() + '</span></div>' : '';
    var sketchLine = item.sketchPNG ? '<div style="margin-top:12px"><div style="font-size:10px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px">Design Sketch</div><img src="' + item.sketchPNG + '" style="width:100%;border:1px solid #eee;border-radius:6px"></div>' : '';
    return '<div class="qp-item-box">' +
      '<div class="qp-item-title">Item ' + (idx+1) + ' \u2014 ' + item.room + ' (' + item.type + ')</div>' +
      '<div class="qp-row"><span>Configuration</span><span>' + item.doors + '</span></div>' +
      '<div class="qp-row"><span>Dimensions</span><span>' + item.w + 'mm W \u00d7 ' + item.h + 'mm H \u00d7 ' + item.d + 'mm D \u00d7 ' + item.units + ' unit' + (item.units>1?'s':'') + '</span></div>' +
      '<div class="qp-row"><span>Door Style</span><span>' + item.doorStyle + ' \u2014 ' + item.finish + '</span></div>' +
      '<div class="qp-row"><span>Board Colour</span><span>' + col + '</span></div>' +
      '<div class="qp-row"><span>Handles</span><span>' + item.handles + '</span></div>' +
      '<div class="qp-row"><span>Interior</span><span>' + item.rails + ', ' + item.shelves + ' Shelves, ' + item.drawers + '</span></div>' +
      '<div class="qp-row"><span>Interior Colour</span><span>' + item.interiorFinish + '</span></div>' +
      addonLine + notesLine + extraLine +
      '<div style="margin-top:10px;padding-top:8px;border-top:1px solid #eee">' +
        '<div class="qp-row"><span>Sub-total (ex. VAT)</span><span>\u00a3' + item.basePrice.toLocaleString() + '</span></div>' +
        '<div class="qp-row"><span>VAT (20%)</span><span>\u00a3' + vat.toLocaleString() + '</span></div>' +
        '<div class="qp-row" style="font-weight:bold"><span>Item Total (inc. VAT)</span><span style="color:#c0392b">\u00a3' + tot.toLocaleString() + '</span></div>' +
      '</div>' +
      sketchLine +
      '</div>';
  }).join('');

  var surveyorLine = q.surveyor ? '<div style="font-size:11px;color:#555">Agent: ' + q.surveyor + '</div>' : '';
  var discLine = q.pricing.disc ? '<div class="qp-row"><span>Discount Applied</span><span>\u2212\u00a3' + q.pricing.disc.toLocaleString() + '</span></div>' : '';
  var installLine = q.installDate ? '<div class="qp-row"><span>Expected Install Date</span><span>' + q.installDate + '</span></div>' : '';
  var sigCustImg = q.sigCustomerPNG ? '<img src="' + q.sigCustomerPNG + '" style="width:100%;max-height:80px;object-fit:contain;border:1px solid #eee;border-radius:4px">' : '<div style="height:60px;border:1px dashed #ccc;border-radius:4px"></div>';
  var sigAgentImg = q.sigAgentPNG ? '<img src="' + q.sigAgentPNG + '" style="width:100%;max-height:80px;object-fit:contain;border:1px solid #eee;border-radius:4px">' : '<div style="height:60px;border:1px dashed #ccc;border-radius:4px"></div>';

  return '<div class="qp">' +
    '<div class="qp-header">' +
      '<div><div class="qp-logo">LUXURY HOUSE</div>' +
        '<div style="font-size:10px;color:#888;letter-spacing:2px">LUXURY FITTED WARDROBES</div>' +
        '<div style="font-size:10px;color:#555;margin-top:6px">www.luxuryhouseonline.com<br>www.luxuryfittedwardrobes.com</div></div>' +
      '<div style="text-align:right">' +
        '<div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:2px">Bespoke Quotation</div>' +
        '<div style="font-size:22px;font-weight:bold;color:#c0392b;margin:4px 0">' + q.id + '</div>' +
        '<div style="font-size:11px;color:#555">Date: ' + q.date + ' | Valid 30 days</div>' +
        surveyorLine + '</div>' +
    '</div>' +
    '<div class="qp-section"><h3>Customer</h3>' +
      '<div class="qp-row"><span><strong>' + q.customer.name + '</strong></span><span>' + q.customer.email + '</span></div>' +
      '<div class="qp-row"><span>' + q.customer.address + '</span><span>' + q.customer.phone + '</span></div>' +
    '</div>' +
    '<div class="qp-section"><h3>Items &amp; Specification</h3>' + itemsHTML + '</div>' +
    '<div class="qp-section"><h3>Payment Summary</h3>' +
      discLine +
      '<div class="qp-row" style="font-weight:bold;font-size:14px"><span>Grand Total (inc. VAT)</span><span style="color:#c0392b;font-size:16px">\u00a3' + q.pricing.total.toLocaleString() + '</span></div>' +
      '<div class="qp-row" style="background:#fdf2f0;padding:7px 4px"><span style="color:#c0392b;font-weight:bold">Deposit Paid</span><span style="color:#c0392b;font-weight:bold">\u00a3' + q.depositActual.toLocaleString() + '</span></div>' +
      '<div class="qp-row" style="background:#fdf2f0;padding:7px 4px"><span style="font-weight:bold">Balance Due on Installation</span><span style="font-weight:bold">\u00a3' + bal.toLocaleString() + '</span></div>' +
      '<div class="qp-row"><span>Lead Time</span><span>' + q.leadTime + '</span></div>' +
      installLine +
    '</div>' +
    '<div class="qp-section"><h3>Agreement &amp; Signatures</h3>' +
      '<p style="font-size:11px;color:#555;margin-bottom:12px">By signing below, both parties confirm agreement to the specification above and the Terms &amp; Conditions.</p>' +
      '<div class="qp-sig-row">' +
        '<div><div style="font-size:10px;color:#888;margin-bottom:6px">Customer Signature</div>' + sigCustImg +
          '<div class="qp-sig-box"><strong>' + (q.sigCustomerName||'_________________________') + '</strong><br><span style="color:#aaa">Print Name</span><br><br>Date: ' + (q.sigCustomerDate||'___ / ___ / ________') + '<br></div></div>' +
        '<div><div style="font-size:10px;color:#888;margin-bottom:6px">Agent / Company Signature</div>' + sigAgentImg +
          '<div class="qp-sig-box"><strong>' + (q.sigAgentName||'_________________________') + '</strong><br><span style="color:#aaa">Print Name</span><br><br>Date: ' + q.date + '<br></div></div>' +
      '</div>' +
    '</div>' +
    '<div class="qp-tc"><strong>T&amp;C Summary:</strong> All bespoke furniture is made to order — non-refundable once manufacture commences. Deposit non-refundable. Balance due in full on installation day. 2-year workmanship warranty. 5-year structural warranty. Lead time: ' + q.leadTime + '. Quote valid 30 days.<br>Full terms: www.luxuryhouseonline.com/terms</div>' +
    '</div>';
}

function buildTextSpec(q) {
  const bal = Math.max(0, q.pricing.total - q.depositActual);
  const lines = (q.items||[]).map((item,i)=>{
    const col=item.customColour||(item.colour?item.colour.code+' '+item.colour.name+' ('+item.colour.brand+')':'—');
    const tot=item.basePrice+Math.round(item.basePrice*0.2);
    const acc=[...item.addons,...(item.customAddon?[item.customAddon]:[])].join(', ')||'None';
    return '\n--- Item '+(i+1)+': '+item.type+' — '+item.room+' ---'
      +'\nDimensions: '+item.w+'mm W × '+item.h+'mm H × '+item.d+'mm D (×'+item.units+' unit'+(item.units>1?'s':'')+')'
      +'\nDoors: '+item.doors+' | Style: '+item.doorStyle+' | Finish: '+item.finish
      +'\nBoard: '+col
      +'\nHandles: '+item.handles
      +'\nInterior: '+item.rails+', '+item.shelves+' Shelves, '+item.drawers
      +'\nInterior Colour: '+item.interiorFinish
      +'\nAccessories: '+acc
      +(item.extraPrice?'\nAdditional Works: £'+parseFloat(item.extraPrice).toLocaleString():'')
      +(item.bespokeNotes?'\nNotes: '+item.bespokeNotes:'')
      +'\nItem Total: £'+tot.toLocaleString()+' inc. VAT';
  }).join('\n');
  return {lines, bal};
}

function sendEmail() {
  const q = collectData();
  const {lines, bal} = buildTextSpec(q);
  const subj = encodeURIComponent('Bespoke Quote '+q.id+' — Luxury House');
  const body = encodeURIComponent(
    'Dear '+q.customer.name+','
    +'\n\nThank you for choosing Luxury House / Luxury Fitted Wardrobes.'
    +'\n\n══════════════════════════════════'
    +'\nQUOTE REF: '+q.id+'  |  DATE: '+q.date
    +'\nInstallation Address: '+q.customer.address
    +'\nAgent: '+(q.surveyor||'The Team')
    +'\n══════════════════════════════════'
    +lines
    +'\n\n══════════════════════════════════'
    +'\nGRAND TOTAL:           £'+q.pricing.total.toLocaleString()+' inc. VAT'
    +(q.pricing.disc?'\nDiscount Applied:      −£'+q.pricing.disc.toLocaleString():'')
    +'\nDeposit Paid:          £'+q.depositActual.toLocaleString()
    +'\nBalance on Install:    £'+bal.toLocaleString()
    +'\nLead Time:             '+q.leadTime
    +(q.installDate?'\nExpected Install Date: '+q.installDate:'')
    +'\n══════════════════════════════════'
    +'\n\nThis quote is valid for 30 days. Full T&Cs apply.'
    +'\nwww.luxuryhouseonline.com | www.luxuryfittedwardrobes.com'
    +'\n\nWarm regards,\n'+(q.surveyor||'The Team')+'\nLuxury House | Luxury Fitted Wardrobes'
  );
  window.location.href = 'mailto:'+q.customer.email+'?subject='+subj+'&body='+body;
  toast('Opening email client...');
}

function sendWhatsapp() {
  const q = collectData();
  const {lines, bal} = buildTextSpec(q);
  const name = q.customer.name.split(' ')[0];
  const msg = encodeURIComponent(
    'Hi '+name+'! 👋'
    +'\n\n*Your Bespoke Quote from Luxury House*'
    +'\n━━━━━━━━━━━━━━━━━━━━━━'
    +'\n*Quote Ref:* '+q.id+'  |  *Date:* '+q.date
    +'\n*Address:* '+q.customer.address
    +lines.replace(/---/g,'─────────────────────')
    +'\n\n━━━━━━━━━━━━━━━━━━━━━━'
    +'\n*Grand Total:* £'+q.pricing.total.toLocaleString()+' inc. VAT'
    +(q.pricing.disc?'\n*Discount:* −£'+q.pricing.disc.toLocaleString():'')
    +'\n*Deposit Paid:* £'+q.depositActual.toLocaleString()
    +'\n*Balance on Install:* £'+bal.toLocaleString()
    +'\n*Lead Time:* '+q.leadTime
    +(q.installDate?'\n*Install Date:* '+q.installDate:'')
    +'\n━━━━━━━━━━━━━━━━━━━━━━'
    +'\n\nQuote valid 30 days. T&Cs apply.'
    +'\nwww.luxuryhouseonline.com'
    +'\n\n_Luxury House | Luxury Fitted Wardrobes_ 🏠'
  );
  window.open('https://wa.me/'+q.customer.phone.replace(/\D/g,'')+'?text='+msg, '_blank');
  toast('Opening WhatsApp...');
}
