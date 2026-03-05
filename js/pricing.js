function getItemRate(item) {
  if (SLIDING_TYPES.includes(item.type)) return RATE_SLIDING;
  if (HINGED_TYPES.includes(item.type)) return RATE_HINGED;
  return RATE_HINGED;
}

function calcItemPrice(item) {
  // Width-per-metre pricing (no height in formula)
  const w = parseInt(item.w) || 0;
  if (!w) return 0;
  const wm = (w / 1000) * (item.units || 1);
  const rate = getItemRate(item);
  let base = wm * rate;
  // Drawer packs
  const drawerCount = parseInt(item.drawers) || 0;
  base += drawerCount * 140;
  // Shelves
  base += (item.shelves || 0) * 45;
  // Named addons
  (item.addons || []).forEach(a => { if (EXTRA_PRICES[a]) base += EXTRA_PRICES[a]; });
  // Custom extras (item.extras array: [{name,price}])
  (item.extras || []).forEach(e => { base += parseFloat(e.price) || 0; });
  // Legacy extraPrice field
  base += parseFloat(item.extraPrice) || 0;
  return Math.round(base);
}

function buildPriceBreakdown(id) {
  const item = getItem(id);
  const el = document.getElementById('price-breakdown-'+id);
  if (!item || !el) return;
  const w = parseInt(item.w) || 0;
  const wm = (w / 1000) * (item.units || 1);
  const rate = getItemRate(item);
  const baseWidth = Math.round(wm * rate);
  const drawerCount = parseInt(item.drawers) || 0;
  const drawerCost = drawerCount * 140;
  const shelfCost = (item.shelves||0) * 45;
  const addonRows = (item.addons||[]).map(a => EXTRA_PRICES[a] ?
    `<div class="price-row"><span class="price-label">+ ${a}</span><span>£${EXTRA_PRICES[a].toLocaleString()}</span></div>` : ''
  ).join('');
  const extrasRows = (item.extras||[]).map((e,i) =>
    `<div class="price-row" style="background:rgba(201,168,76,0.05)">
      <span class="price-label" style="display:flex;align-items:center;gap:6px">
        <input style="width:130px;font-size:11px;padding:3px 6px" value="${e.name}" placeholder="Extra item name"
          oninput="updateExtra(${item.id},${i},'name',this.value)">
      </span>
      <span style="display:flex;align-items:center;gap:4px">
        £<input style="width:70px;font-size:11px;padding:3px 6px;text-align:right" type="number" value="${e.price}" placeholder="0"
          oninput="updateExtra(${item.id},${i},'price',this.value)">
        <button onclick="removeExtra(${item.id},${i})" style="background:var(--red-dark);color:#fff;border:none;border-radius:4px;padding:2px 7px;cursor:pointer;font-size:11px">✕</button>
      </span>
    </div>`
  ).join('');
  const legacyExtra = parseFloat(item.extraPrice)||0;
  const base = calcItemPrice(item);
  const vat = Math.round(base * 0.2);
  const total = base + vat;
  const col = item.customColour || (item.colour ? item.colour.code+' '+item.colour.name+' ('+item.colour.brand+')' : '—');
  el.innerHTML =
    '<div class="price-row"><span class="price-label">Type</span><span>'+item.type+' — '+item.room+'</span></div>'+
    '<div class="price-row"><span class="price-label">Width</span><span>'+w+'mm ('+wm.toFixed(2)+'m)</span></div>'+
    '<div class="price-row" style="background:rgba(192,57,43,0.05)"><span class="price-label">Rate</span><span>£'+rate+'/m width ('+item.type+')</span></div>'+
    '<div class="price-row" style="font-weight:bold"><span class="price-label">Width Charge</span><span>£'+baseWidth.toLocaleString()+'</span></div>'+
    (drawerCost?'<div class="price-row"><span class="price-label">Drawers ('+drawerCount+'×)</span><span>£'+drawerCost.toLocaleString()+'</span></div>':'')+
    (shelfCost?'<div class="price-row"><span class="price-label">Shelves ('+item.shelves+'×)</span><span>£'+shelfCost.toLocaleString()+'</span></div>':'')+
    addonRows+extrasRows+
    (legacyExtra?'<div class="price-row"><span class="price-label">Additional Charge</span><span>£'+legacyExtra.toLocaleString()+'</span></div>':'')+
    '<div class="price-row" style="padding-top:6px"><span></span><button onclick="addExtra('+item.id+')" class="btn btn-outline btn-sm" style="font-size:10px">+ Add Custom Extra</button></div>'+
    '<div class="divider"></div>'+
    '<div class="price-row"><span class="price-label">Sub-total (ex. VAT)</span><span>£'+base.toLocaleString()+'</span></div>'+
    '<div class="price-row"><span class="price-label">VAT (20%)</span><span>£'+vat.toLocaleString()+'</span></div>'+
    '<div class="price-row"><span class="price-label price-total">Item Total (inc. VAT)</span><span class="price-total">£'+total.toLocaleString()+'</span></div>';
}

function addExtra(id) {
  const item = getItem(id);
  if (!item) return;
  if (!item.extras) item.extras = [];
  item.extras.push({name:'', price:0});
  buildPriceBreakdown(id);
  updateGrandTotal();
}

function updateExtra(id, idx, field, val) {
  const item = getItem(id);
  if (!item||!item.extras) return;
  item.extras[idx][field] = field==='price' ? parseFloat(val)||0 : val;
  updateGrandTotal();
}

function removeExtra(id, idx) {
  const item = getItem(id);
  if (!item||!item.extras) return;
  item.extras.splice(idx,1);
  buildPriceBreakdown(id);
  updateGrandTotal();
}

function calcGrand() {
  const disc = parseFloat(document.getElementById('discount-amt')?.value) || 0;
  const sub = items.reduce((s, i) => s + calcItemPrice(i), 0);
  const after = Math.max(0, sub - disc);
  const vat = Math.round(after * 0.2);
  const total = after + vat;
  const rec = Math.round(total * 0.5);
  return { sub, disc, after, vat, total, rec };
}

function updateGrandTotal() {
  const g = calcGrand();
  // dep-recommended removed from UI — no-op
  const gtEl = document.getElementById('grand-total-display');
  if (gtEl) {
  var grandItemLines = items.map(function(item,i){
    var b = calcItemPrice(item);
    return b>0 ? '<div style="font-size:12px;color:rgba(255,255,255,0.7)">Item '+(i+1)+' ('+item.room+'): £'+(b+Math.round(b*0.2)).toLocaleString()+' inc.VAT</div>' : '';
  }).join('');
  var discLine = g.disc ? '<div style="font-size:12px;color:#f5b041">Discount: −£'+g.disc.toLocaleString()+'</div>' : '';
  gtEl.innerHTML = '<div class="grand-bar"><div>' +
    '<div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Grand Total</div>' +
    grandItemLines + discLine +
    '</div><div style="text-align:right">' +
    '<div style="font-size:32px;font-weight:bold;color:#fff">£' + g.total.toLocaleString() + '</div>' +
    '<div style="font-size:12px;color:rgba(255,255,255,0.5)">inc. VAT</div>' +
    '</div></div>';
  }
  const actual = parseInt(document.getElementById('deposit-actual')?.value) || 0;
  const balEl = document.getElementById('balance-breakdown');
  if (balEl) {
    balEl.innerHTML = actual > 0 ? `
      <div class="price-row"><span class="price-label">Deposit Taken Today</span><span style="color:#58d68d;font-weight:bold">£${actual.toLocaleString()}</span></div>
      <div class="price-row"><span class="price-label">Balance Due on Installation</span><span style="color:var(--gold);font-size:20px;font-weight:bold">£${Math.max(0,g.total-actual).toLocaleString()}</span></div>` : '';
  }
}
