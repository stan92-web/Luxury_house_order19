// ══════════════════════════════════════════════
// SKETCH TOOL
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// SKETCH DESIGNER — GLOBAL STATE
// ══════════════════════════════════════════════
let skState = {
  tool: 'select', colour: '#1a1a1a', size: 2,
  drawing: false, sx: 0, sy: 0, path: [],
  shapes: [],      // persistent shapes array
  activeItemId: null,
  selected: null,  // index of selected shape
  canvasW: 900, canvasH: 560,
  scale: 1, offsetX: 0, offsetY: 0
};
let skDirty = false;

function openSketchDesigner(itemId) {
  // Pick item: passed ID or first item
  const id = itemId || (items.length > 0 ? items[0].id : null);
  if (!id) { toast('Add an item first'); return; }
  skState.activeItemId = id;
  // Load existing sketch shapes for this item
  const item = getItem(id);
  skState.shapes = (item && item.sketchShapes) ? JSON.parse(JSON.stringify(item.sketchShapes)) : [];
  skState.isSliding = item && (item.type==='Sliding Door Fitted'||item.type==='Sliding Door Walk-In');
  skDirty = false;
  // Build item selector tabs
  const sel = document.getElementById('sk-item-selector');
  sel.innerHTML = items.map(it =>
    '<button class="sketch-item-btn'+(it.id===id?' active':'')+'" onclick="skSwitchItem('+it.id+')" id="sk-itab-'+it.id+'">'+
    'Item '+(items.indexOf(it)+1)+' — '+it.room+'</button>'
  ).join('');
  const ov = document.getElementById('sketch-overlay');
  ov.classList.add('open');
  // Force layout recalc to ensure overlay is full screen before sizing canvas
  ov.style.display = 'flex';
  ov.style.width = window.innerWidth + 'px';
  ov.style.height = window.innerHeight + 'px';
  document.addEventListener('keydown', skKeyDown);
  setTimeout(skInitCanvas, 150);
  // Re-init on window resize
  window.addEventListener('resize', function() {
    const ov = document.getElementById('sketch-overlay');
    if (ov && ov.classList.contains('open')) {
      ov.style.width = window.innerWidth + 'px';
      ov.style.height = window.innerHeight + 'px';
      setTimeout(skInitCanvas, 60);
    }
  });
}

function skSwitchItem(id) {
  // Save current before switching
  skSaveShapes(skState.activeItemId);
  skState.activeItemId = id;
  const item = getItem(id);
  skState.shapes = (item && item.sketchShapes) ? JSON.parse(JSON.stringify(item.sketchShapes)) : [];
  skState.isSliding = item && (item.type==='Sliding Door Fitted'||item.type==='Sliding Door Walk-In');
  document.querySelectorAll('.sketch-item-btn').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById('sk-itab-'+id);
  if (tab) tab.classList.add('active');
  skRedraw();
}

function closeSketchDesigner() {
  if (skDirty && !confirm('Save design before closing?')) { skSaveToItem(); }
  document.getElementById('sketch-overlay').classList.remove('open');
  document.removeEventListener('keydown', skKeyDown);
}


function skPrintFactory() {
  // Auto-save first
  skSaveToItem();
  const id = skState.activeItemId;
  const item = getItem(id);
  const png = item && item.sketchPNG ? item.sketchPNG : null;
  // Gather customer info from quote form
  const firstName = document.getElementById('c-first')?.value || '';
  const lastName  = document.getElementById('c-last')?.value  || '';
  const phone     = document.getElementById('c-phone')?.value || '';
  const address   = document.getElementById('c-address')?.value || '';
  const agent     = document.getElementById('c-surveyor')?.value || '';
  const custName  = (firstName+' '+lastName).trim() || '—';
  // Item spec
  const col = (item&&item.customColour) ? item.customColour
    : (item&&item.colour ? item.colour.code+' '+item.colour.name+' ('+item.colour.brand+')' : '—');
  const today = new Date().toLocaleDateString('en-GB');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Factory Sheet — ${custName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;background:#fff;color:#111;padding:18mm 15mm;font-size:11pt}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-bottom:10px;border-bottom:3px solid #c0392b}
    .logo{font-size:18pt;font-weight:bold;color:#c0392b;letter-spacing:2px}
    .logo-sub{font-size:8pt;color:#888;letter-spacing:2px;text-transform:uppercase}
    .ref{text-align:right;font-size:9pt;color:#888}
    .ref strong{font-size:14pt;color:#c0392b;display:block}
    h2{font-size:10pt;text-transform:uppercase;letter-spacing:2px;color:#c0392b;margin:12px 0 6px;padding-bottom:3px;border-bottom:1px solid #f5b7b1}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;margin-bottom:10px}
    .row{display:flex;gap:6px;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:10.5pt}
    .lbl{font-weight:bold;min-width:140px;color:#555}
    .val{color:#111}
    .sketch-box{border:2px solid #c0392b;border-radius:4px;overflow:hidden;margin:10px 0;text-align:center;background:#fafafa}
    .sketch-box img{width:100%;display:block}
    .sketch-box .no-sketch{padding:40px;color:#888;font-size:10pt}
    .footer{margin-top:14px;padding-top:8px;border-top:1px solid #eee;font-size:8.5pt;color:#888;display:flex;justify-content:space-between}
    .sig-area{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:14px}
    .sig-box{border-top:1.5px solid #111;padding-top:6px;font-size:9pt;color:#555}
    @page{size:A4;margin:0}
    @media print{body{padding:10mm 10mm}}
  </style></head><body>
  <div class="header">
    <div>
      <div class="logo">LUXURY HOUSE</div>
      <div class="logo-sub">Luxury Fitted Wardrobes · Factory Production Sheet</div>
    </div>
    <div class="ref">
      <strong>FACTORY SHEET</strong>
      Date: ${today}<br>Agent: ${agent||'—'}
    </div>
  </div>

  <h2>Customer Details</h2>
  <div class="grid">
    <div class="row"><span class="lbl">Customer Name</span><span class="val">${custName}</span></div>
    <div class="row"><span class="lbl">Phone</span><span class="val">${phone||'—'}</span></div>
    <div class="row" style="grid-column:1/-1"><span class="lbl">Installation Address</span><span class="val">${address||'—'}</span></div>
  </div>

  <h2>Item Specification — ${item?(item.type||'Wardrobe'):''} · ${item?item.room:''}</h2>
  <div class="grid">
    <div class="row"><span class="lbl">Type</span><span class="val">${item?item.type:'—'}</span></div>
    <div class="row"><span class="lbl">Room</span><span class="val">${item?item.room:'—'}</span></div>
    <div class="row"><span class="lbl">Door Config</span><span class="val">${item?item.doors:'—'}</span></div>
    <div class="row"><span class="lbl">Door Style</span><span class="val">${item?item.doorStyle:'—'}</span></div>
    <div class="row"><span class="lbl">Finish</span><span class="val">${item?item.finish:'—'}</span></div>
    <div class="row"><span class="lbl">Board Colour</span><span class="val">${col}</span></div>
    <div class="row"><span class="lbl">Handle</span><span class="val">${item?item.handles:'—'}</span></div>
    <div class="row"><span class="lbl">Interior Colour</span><span class="val">${item?item.interiorFinish:'—'}</span></div>
    <div class="row"><span class="lbl">Hanging Rails</span><span class="val">${item?item.rails:'—'}</span></div>
    <div class="row"><span class="lbl">Shelves</span><span class="val">${item?item.shelves:'—'}</span></div>
    <div class="row"><span class="lbl">Drawer Packs</span><span class="val">${item?(parseInt(item.drawers)||0):0}</span></div>
    <div class="row"><span class="lbl">Width (mm)</span><span class="val">${item&&item.w?item.w+'mm':'—'}</span></div>
    <div class="row"><span class="lbl">Height (mm)</span><span class="val">${item&&item.h?item.h+'mm':'—'}</span></div>
    <div class="row"><span class="lbl">Depth (mm)</span><span class="val">${item&&item.d?item.d+'mm':'—'}</span></div>
    ${item&&item.addons&&item.addons.length?'<div class="row" style="grid-column:1/-1"><span class="lbl">Accessories</span><span class="val">'+item.addons.join(', ')+'</span></div>':''}
    ${item&&item.bespokeNotes?'<div class="row" style="grid-column:1/-1"><span class="lbl">⚠️ Bespoke Notes</span><span class="val" style="color:#c0392b;font-weight:bold">'+item.bespokeNotes+'</span></div>':''}
  </div>

  <h2>Front View Design Sketch</h2>
  <div class="sketch-box">
    ${png ? '<img src="'+png+'" alt="Design Sketch">' : '<div class="no-sketch">No sketch saved — save design first</div>'}
  </div>

  <div class="sig-area">
    <div class="sig-box">Production Sign-Off: _______________________<br><br>Date: _______________</div>
    <div class="sig-box">Quality Check: _______________________<br><br>Date: _______________</div>
  </div>

  <div class="footer">
    <span>Luxury House | Luxury Fitted Wardrobes | www.luxuryhouseonline.com</span>
    <span>Printed: ${today}</span>
  </div>
  <script>window.onload=function(){window.print();}<\/script>
  </body></html>`;

  const w = window.open('','_blank','width=900,height=700');
  if (w) { w.document.write(html); w.document.close(); }
  else { toast('Please allow popups to print factory sheet'); }
}

function skSaveToItem() {
  const id = skState.activeItemId;
  if (!id) return;
  skSaveShapes(id);

  // ── Extract dimensions from sketch text labels ──────────
  // Scan all text shapes for W: / H: / D: patterns and sync to item
  const item = getItem(id);
  if (item) {
    skState.shapes.forEach(function(s) {
      if (s.type !== 'text') return;
      const t = s.text || '';
      // Match patterns like "W: 2400 mm", "Width: 2400mm", "Width: 2400"
      const wm = t.match(/^W(?:idth)?[:\s]+([\d.]+)/i);
      const hm = t.match(/^H(?:eight)?[:\s]+([\d.]+)/i);
      const dm = t.match(/^D(?:epth)?[:\s]+([\d.]+)/i);
      if (wm && wm[1] && parseFloat(wm[1]) > 0) { item.w = wm[1]; }
      if (hm && hm[1] && parseFloat(hm[1]) > 0) { item.h = hm[1]; }
      if (dm && dm[1] && parseFloat(dm[1]) > 0) { item.d = dm[1]; }
    });
    // Update the dimension input fields on the design tab
    const wEl = document.getElementById('dim-w-'+id);
    const hEl = document.getElementById('dim-h-'+id);
    const dEl = document.getElementById('dim-d-'+id);
    if (wEl) wEl.value = item.w || '';
    if (hEl) hEl.value = item.h || '';
    if (dEl) dEl.value = item.d || '';
  }

  // Render to PNG and save
  const c = document.getElementById('sk-main-canvas');
  if (c) {
    const png = c.toDataURL('image/png');
    if (item) {
      item.sketchPNG = png;
      item.sketchHistory = [{ type: 'png', data: png }];
    }
    // Update thumbnail
    const thumb = document.getElementById('sketch-thumb-img-'+id);
    const preview = document.getElementById('sketch-preview-thumb-'+id);
    const empty = document.getElementById('sketch-empty-'+id);
    if (thumb) { thumb.src = png; thumb.style.display = 'block'; }
    if (preview) preview.style.display = 'block';
    if (empty) empty.style.display = 'none';
    // Update item header subtitle
    if (item) {
      const card = document.getElementById('item-card-'+id);
      if (card) {
        const sub = card.querySelector('.item-card-subtitle');
        if (sub) sub.textContent = (item.type||'') + ' · ' + (item.doors||'') + ' · ' + (item.w?item.w+'mm wide':'');
      }
    }
  }
  skDirty = false;
  document.getElementById('sketch-overlay').classList.remove('open');
  document.getElementById('sketch-overlay').style.width = '';
  document.getElementById('sketch-overlay').style.height = '';
  const dimsFound = item && (item.w || item.h || item.d);
  toast('Design saved' + (dimsFound ? ' — dimensions synced to item' : '') + '!');
}

function skSaveShapes(id) {
  const item = getItem(id);
  if (item) item.sketchShapes = JSON.parse(JSON.stringify(skState.shapes));
}

// ── Canvas init & resize ────────────────────────
function skInitCanvas() {
  requestAnimationFrame(function() {
  const c = document.getElementById('sk-main-canvas');
  if (!c) return;
  const area = document.querySelector('.sketch-canvas-area');
  if (!area) return;
  const pad = 20;
  const maxW = area.clientWidth - pad;
  const maxH = area.clientHeight - pad;
  if (maxW < 100 || maxH < 100) { setTimeout(skInitCanvas, 100); return; }
  const ratio = 16/9;
  let w = maxW;
  let h = Math.round(w / ratio);
  if (h > maxH) { h = maxH; w = Math.round(h * ratio); }
  w = Math.max(w, 400); h = Math.max(h, 250);
  c.width = w; c.height = h;
  const wrap = c.parentElement;
  if (wrap) { wrap.style.width = w + 'px'; wrap.style.height = h + 'px'; }
  skState.canvasW = w; skState.canvasH = h;
  if (!c._skinit) {
    c.addEventListener('mousedown', skDown);
    c.addEventListener('mousemove', skMove);
    c.addEventListener('mouseup', skUp);
    c.addEventListener('mouseleave', skUp);
    c.addEventListener('dblclick', skDblClick);
    c.addEventListener('touchstart', function(e){ e.preventDefault(); skDown(e); }, {passive:false});
    c.addEventListener('touchmove', function(e){ e.preventDefault(); skMove(e); }, {passive:false});
    c.addEventListener('touchend', function(e){ e.preventDefault(); skUp(e); }, {passive:false});
    c._skinit = true;
  }
  skRedraw();
  });
}

function skPos(e) {
  const c = document.getElementById('sk-main-canvas');
  const r = c.getBoundingClientRect();
  const sc = c.width / r.width;
  const src = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
  return { x: (src.clientX - r.left) * sc, y: (src.clientY - r.top) * sc };
}

// ── Tool control ────────────────────────────────
function skSetTool(t) {
  skState.tool = t;
  document.querySelectorAll('.sk-tool').forEach(b => b.classList.remove('active'));
  const btnId = t === 'door-l' ? 'sktool-door' : 'sktool-'+t;
  const btn = document.getElementById(btnId);
  if (btn) btn.classList.add('active');
  const c = document.getElementById('sk-main-canvas');
  if (c) c.style.cursor = (t==='text'||t==='select') ? 'default' : 'crosshair';
}

function skSetColour(col, el) {
  skState.colour = col;
  document.querySelectorAll('.sk-colour').forEach(e => e.classList.remove('active'));
  if (el) el.classList.add('active');
}

function skSetSize(sz) {
  skState.size = sz;
  document.querySelectorAll('.sk-size').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('sksize-'+sz);
  if (btn) btn.classList.add('active');
}

// ── Mouse/touch events ──────────────────────────
// ── Pinch-to-resize state ─────────────────────────
let skPinch = { active:false, startDist:0, shapeIdx:null, origShape:null };

function skPinchDist(e) {
  const t = e.touches;
  return Math.hypot(t[0].clientX-t[1].clientX, t[0].clientY-t[1].clientY);
}

function skDown(e) {
  // Pinch-to-resize: two fingers on a selected shape
  if (e.touches && e.touches.length === 2 && skState.selected !== null) {
    skPinch.active = true;
    skPinch.startDist = skPinchDist(e);
    skPinch.shapeIdx = skState.selected;
    skPinch.origShape = JSON.parse(JSON.stringify(skState.shapes[skState.selected]));
    return;
  }
  const p = skPos(e);
  skState.sx = p.x; skState.sy = p.y;
  skState.drawing = true;
  skDirty = true;
  if (skState.tool === 'text') {
    const label = document.getElementById('sk-label-input').value.trim();
    if (!label) { toast('Type a label in the sidebar first'); skState.drawing=false; return; }
    skState.shapes.push({ type:'text', x:p.x, y:p.y, text:label, colour:skState.colour, size:skState.size });
    skState.drawing = false;
    skRedraw(); return;
  }
  if (skState.tool === 'lasso') {
    // Check if clicking inside an existing group to drag it
    if (skState.selectedGroup.length > 0) {
      const inGroup = skState.selectedGroup.some(i => skHitTest(skState.shapes[i], p.x, p.y));
      if (inGroup) {
        skState.groupDragStart = p;
        skState.groupOrigShapes = skState.selectedGroup.map(i => JSON.parse(JSON.stringify(skState.shapes[i])));
        skState.drawing = false;
        return;
      }
    }
    // Start new lasso
    skState.lasso = {x1:p.x, y1:p.y, x2:p.x, y2:p.y};
    skState.selectedGroup = [];
    skState.drawing = true;
    return;
  }
  if (skState.tool === 'select') {
    // Check if clicking near a resize corner of the selected shape
    if (skState.selected !== null) {
      const s = skState.shapes[skState.selected];
      const corner = skGetResizeCorner(s, p.x, p.y);
      if (corner) {
        skState.resizing = corner;
        skState.dragOrigShape = JSON.parse(JSON.stringify(s));
        skState.dragStart = p;
        skState.drawing = true;
        return;
      }
    }
    // Hit test for move
    let hit = null;
    for (let i = skState.shapes.length-1; i >= 0; i--) {
      if (skHitTest(skState.shapes[i], p.x, p.y)) { hit = i; break; }
    }
    skState.selected = hit;
    skState.resizing = null;
    updateSkDeleteBtn();
    if (hit !== null) {
      skState.dragStart = p;
      skState.dragOrigShape = JSON.parse(JSON.stringify(skState.shapes[hit]));
    }
    skRedraw(); return;
  }
  if (skState.tool === 'pen') { skState.path = [p]; }
}

function skMove(e) {
  // Handle two-finger pinch resize
  if (e.touches && e.touches.length === 2 && skPinch.active) {
    const dist = skPinchDist(e);
    const ratio = dist / skPinch.startDist;
    const orig = skPinch.origShape;
    const s = skState.shapes[skPinch.shapeIdx];
    if (!s || !orig) return;
    // Scale around centre of shape
    const ocx = (orig.x + (orig.x2||orig.x)) / 2;
    const ocy = (orig.y + (orig.y2||orig.y)) / 2;
    const ow = Math.abs((orig.x2||orig.x) - orig.x);
    const oh = Math.abs((orig.y2||orig.y) - orig.y);
    const nw = ow * ratio, nh = oh * ratio;
    s.x = ocx - nw/2; s.y = ocy - nh/2;
    s.x2 = ocx + nw/2; s.y2 = ocy + nh/2;
    skRedraw(); return;
  }

  if (!skState.drawing) return;
  const p = skPos(e);

  // Group drag (lasso move)
  if (skState.tool === 'lasso' && skState.groupDragStart && skState.selectedGroup.length > 0) {
    const dx = p.x - skState.groupDragStart.x;
    const dy = p.y - skState.groupDragStart.y;
    skState.selectedGroup.forEach((idx, gi) => {
      const orig = skState.groupOrigShapes[gi];
      const s = skState.shapes[idx];
      s.x = orig.x + dx; s.y = orig.y + dy;
      if (orig.x2 !== undefined) s.x2 = orig.x2 + dx;
      if (orig.y2 !== undefined) s.y2 = orig.y2 + dy;
      if (orig.path) s.path = orig.path.map(pt => ({x:pt.x+dx, y:pt.y+dy}));
    });
    skRedraw(); return;
  }
  // Lasso draw
  if (skState.tool === 'lasso' && skState.drawing && skState.lasso) {
    skState.lasso.x2 = p.x; skState.lasso.y2 = p.y;
    skRedraw(); return;
  }
  // Resize or drag selected shape
  if (skState.tool === 'select' && skState.selected !== null && skState.dragStart) {
    const dx = p.x - skState.dragStart.x;
    const dy = p.y - skState.dragStart.y;
    const orig = skState.dragOrigShape;
    const s = skState.shapes[skState.selected];
    if (skState.resizing) {
      const c = skState.resizing;
      if (c==='tl') { s.x=orig.x+dx; s.y=orig.y+dy; }
      else if (c==='tr') { s.x2=orig.x2+dx; s.y=orig.y+dy; }
      else if (c==='bl') { s.x=orig.x+dx; s.y2=orig.y2+dy; }
      else if (c==='br') { s.x2=orig.x2+dx; s.y2=orig.y2+dy; }
      else if (c==='t') { s.y=orig.y+dy; }
      else if (c==='b') { s.y2=orig.y2+dy; }
      else if (c==='l') { s.x=orig.x+dx; }
      else if (c==='r') { s.x2=orig.x2+dx; }
    } else {
      s.x = orig.x + dx; s.y = orig.y + dy;
      if (orig.x2 !== undefined) s.x2 = orig.x2 + dx;
      if (orig.y2 !== undefined) s.y2 = orig.y2 + dy;
      if (orig.path) s.path = orig.path.map(pt => ({x:pt.x+dx, y:pt.y+dy}));
    }
    skRedraw(); return;
  }

  if (skState.tool === 'pen') {
    skState.path.push(p);
    skRedraw();
    const c = document.getElementById('sk-main-canvas');
    const ctx = c.getContext('2d');
    skDrawPenPreview(ctx);
    return;
  }
  const drawTools = ['wall','corner','triangle','shelf','hanging','drawer','door-l','door-r'];
  if (drawTools.includes(skState.tool)) {
    skRedraw();
    const c = document.getElementById('sk-main-canvas');
    const ctx = c.getContext('2d');
    skDrawShapePreview(ctx, skState.tool, skState.sx, skState.sy, p.x, p.y);
  }
}

function skUp(e) {
  if (skPinch.active) { skPinch.active = false; skDirty = true; skRedraw(); return; }
  if (!skState.drawing) return;
  // Lasso: on release, select all shapes inside lasso rect
  if (skState.tool === 'lasso' && skState.drawing && skState.lasso) {
    const lx1 = Math.min(skState.lasso.x1, skState.lasso.x2);
    const ly1 = Math.min(skState.lasso.y1, skState.lasso.y2);
    const lx2 = Math.max(skState.lasso.x1, skState.lasso.x2);
    const ly2 = Math.max(skState.lasso.y1, skState.lasso.y2);
    skState.selectedGroup = [];
    skState.shapes.forEach((s, i) => {
      const sx = s.x2!==undefined ? Math.min(s.x,s.x2) : s.x - 60;
      const sy = s.y2!==undefined ? Math.min(s.y,s.y2) : s.y - 10;
      const sx2 = s.x2!==undefined ? Math.max(s.x,s.x2) : s.x + 60;
      const sy2 = s.y2!==undefined ? Math.max(s.y,s.y2) : s.y + 10;
      // Shape is inside lasso if centres overlap or fully contained
      if (sx2 > lx1 && sx < lx2 && sy2 > ly1 && sy < ly2) {
        skState.selectedGroup.push(i);
      }
    });
    skState.lasso = null;
    if (skState.selectedGroup.length > 0) {
      toast(skState.selectedGroup.length + ' shapes selected — drag to move group');
    }
    skRedraw();
  }
  skState.drawing = false;
  skState.dragStart = null;
  skState.dragOrigShape = null;
  skState.resizing = null;
  skState.groupDragStart = null;
  const src = e.changedTouches ? e.changedTouches[0] : e;
  const c = document.getElementById('sk-main-canvas');
  const r = c.getBoundingClientRect();
  const sc = c.width / r.width;
  const p = { x: (src.clientX - r.left) * sc, y: (src.clientY - r.top) * sc };
  const dx = Math.abs(p.x - skState.sx), dy = Math.abs(p.y - skState.sy);
  if (skState.tool === 'pen') {
    if (skState.path.length > 1)
      skState.shapes.push({ type:'pen', path:[...skState.path], colour:skState.colour, size:skState.size });
  } else if (['wall','corner','triangle','shelf','hanging','drawer','door-l','door-r'].includes(skState.tool)) {
    if (dx > 8 || dy > 8) {
      skState.shapes.push({ type:skState.tool, x:skState.sx, y:skState.sy, x2:p.x, y2:p.y, colour:skState.colour, size:skState.size });
    }
  }
  skRedraw();
}


function skGetResizeCorner(s, px, py) {
  if (!s || s.x2 === undefined) return null;
  const r = 10; // hit radius
  const x1=s.x, y1=s.y, x2=s.x2, y2=s.y2;
  const mx=(x1+x2)/2, my=(y1+y2)/2;
  if (Math.abs(px-x1)<r && Math.abs(py-y1)<r) return 'tl';
  if (Math.abs(px-x2)<r && Math.abs(py-y1)<r) return 'tr';
  if (Math.abs(px-x1)<r && Math.abs(py-y2)<r) return 'bl';
  if (Math.abs(px-x2)<r && Math.abs(py-y2)<r) return 'br';
  if (Math.abs(px-mx)<r && Math.abs(py-y1)<r) return 't';
  if (Math.abs(px-mx)<r && Math.abs(py-y2)<r) return 'b';
  if (Math.abs(px-x1)<r && Math.abs(py-my)<r) return 'l';
  if (Math.abs(px-x2)<r && Math.abs(py-my)<r) return 'r';
  return null;
}

function skHitTest(s, px, py) {
  const margin = 12;
  const checkRect = (x1,y1,x2,y2) => {
    const x=Math.min(x1,x2), y=Math.min(y1,y2), w=Math.abs(x2-x1), h=Math.abs(y2-y1);
    return px>=x-margin && px<=x+w+margin && py>=y-margin && py<=y+h+margin;
  };
  if (['wall','corner','door-l','door-r','drawer','triangle'].includes(s.type)) return checkRect(s.x,s.y,s.x2,s.y2);
  if (s.type==='shelf'||s.type==='hanging') {
    return Math.abs(py - (s.y+s.y2)/2) < margin+4 && px>=Math.min(s.x,s.x2)-margin && px<=Math.max(s.x,s.x2)+margin;
  }
  if (s.type==='text') { return Math.abs(px-s.x)<160 && Math.abs(py-s.y)<24; }
  return false;
}

// ── Presets ─────────────────────────────────────────────────────────────────
function skInsertPreset(type) {
  const W = skState.canvasW, H = skState.canvasH;
  const cx = W/2, col = skState.colour;
  const shapes = [];
  const ceil = H*0.06, floor = H*0.94;
  const fullH = floor - ceil;

  // Helper: single wardrobe unit with top box, main body, doors, hanging rail
  // bx=left edge, uw=width, mainH=main body height, topBoxH=top box height
  function addUnit(bx, uw, mainH, topBoxH, doorStyle, label) {
    const uy = ceil + topBoxH; // top of main body
    // Top box
    if (topBoxH > 2) {
      shapes.push({type:'wall', x:bx, y:ceil, x2:bx+uw, y2:ceil+topBoxH, colour:col, size:2});
      if (uw > 60) {
        shapes.push({type:'door-l', x:bx+3, y:ceil+3, x2:bx+uw/2-1, y2:ceil+topBoxH-3, colour:col, size:1});
        shapes.push({type:'door-r', x:bx+uw/2+1, y:ceil+3, x2:bx+uw-3, y2:ceil+topBoxH-3, colour:col, size:1});
      }
    }
    // Main body
    shapes.push({type:'wall', x:bx, y:uy, x2:bx+uw, y2:uy+mainH, colour:col, size:2});
    // Doors on main body
    if (doorStyle === 'single') {
      shapes.push({type:'door-l', x:bx+3, y:uy+3, x2:bx+uw-3, y2:uy+mainH-3, colour:col, size:1});
    } else {
      shapes.push({type:'door-l', x:bx+3, y:uy+3, x2:bx+uw/2-1, y2:uy+mainH-3, colour:col, size:1});
      shapes.push({type:'door-r', x:bx+uw/2+1, y:uy+3, x2:bx+uw-3, y2:uy+mainH-3, colour:col, size:1});
    }
    // Hanging rail inside at ~25% down
    shapes.push({type:'hanging', x:bx+8, y:uy+mainH*0.25, x2:bx+uw-8, y2:uy+mainH*0.25, colour:col, size:2});
    // ── Dimension labels ──────────────────────────────────
    // Width  → centred at the very bottom of the unit
    // Depth  → just below Width
    // Height → right side of unit, vertically centred
    const wLabelX = bx + uw * 0.5 - 44;       // bottom-centre of unit
    const wLabelY = uy + mainH + 16;            // just below the unit floor line
    const hLabelX = bx + uw + 8;               // right of unit
    const hLabelY = uy + mainH * 0.5;           // vertical centre of unit
    shapes.push({type:'text', x:wLabelX,     y:wLabelY,      text:'Width: _______ mm', colour:'#c0392b', size:0, isDim:true});
    shapes.push({type:'text', x:wLabelX,     y:wLabelY + 18, text:'Depth: _______ mm', colour:'#c0392b', size:0, isDim:true});
    shapes.push({type:'text', x:hLabelX,     y:hLabelY,      text:'Height: _______ mm', colour:'#c0392b', size:0, isDim:true});
    // Unit label below the depth label, clearly separated
    if (label) shapes.push({type:'text', x:bx + uw*0.25, y:wLabelY + 38, text:label, colour:col, size:1});
  }

  if (type === 'single-wardrobe') {
    const uw=W*0.32, topBoxH=fullH*0.18, mainH=fullH*0.82;
    addUnit(cx-uw/2, uw, mainH, topBoxH, 'double', 'Single Wardrobe');

  } else if (type === 'double-wardrobe') {
    const uw=W*0.28, topBoxH=fullH*0.18, mainH=fullH*0.82;
    addUnit(cx-uw-4, uw, mainH, topBoxH, 'double', '');
    addUnit(cx+4, uw, mainH, topBoxH, 'double', '');
    shapes.push({type:'text', x:cx-30, y:floor+16, text:'Double Wardrobe', colour:col, size:1});

  } else if (type === 'triple-wardrobe') {
    const uw=W*0.22, topBoxH=fullH*0.18, mainH=fullH*0.82;
    addUnit(cx-uw*1.5-4, uw, mainH, topBoxH, 'double', '');
    addUnit(cx-uw/2, uw, mainH, topBoxH, 'double', '');
    addUnit(cx+uw/2+4, uw, mainH, topBoxH, 'double', '');
    shapes.push({type:'text', x:cx-40, y:floor+16, text:'Triple Wardrobe', colour:col, size:1});

  } else if (type === 'top-box') {
    // Standalone top box with size labels
    const uw=W*0.28, tbH=fullH*0.2, bx=cx-uw/2;
    shapes.push({type:'wall', x:bx, y:ceil, x2:bx+uw, y2:ceil+tbH, colour:col, size:2});
    shapes.push({type:'door-l', x:bx+3, y:ceil+3, x2:bx+uw/2-1, y2:ceil+tbH-3, colour:col, size:1});
    shapes.push({type:'door-r', x:bx+uw/2+1, y:ceil+3, x2:bx+uw-3, y2:ceil+tbH-3, colour:col, size:1});
    // Dims inside top box
    shapes.push({type:'text', x:bx+6, y:ceil+tbH-36, text:'W: _______ mm', colour:'#c0392b', size:0, isDim:true});
    shapes.push({type:'text', x:bx+6, y:ceil+tbH-20, text:'H: _______ mm', colour:'#c0392b', size:0, isDim:true});
    shapes.push({type:'text', x:bx+6, y:ceil+tbH- 4, text:'D: _______ mm', colour:'#c0392b', size:0, isDim:true});
    shapes.push({type:'text', x:bx+4, y:ceil+tbH+18, text:'Top Box', colour:col, size:1});

  } else if (type === 'corner-unit') {
    // Front view: left hanging section + right shelf tower, meeting in the centre
    // Both floor-to-ceiling, top boxes included — proper front elevation
    const lw=W*0.36, rw=W*0.28, topH=fullH*0.18, mainH=fullH*0.82;
    const lx=cx-lw-2, rx=cx+2;
    // ── Left wardrobe (hanging, with top box) ───────────
    shapes.push({type:'wall', x:lx, y:ceil, x2:lx+lw, y2:ceil+topH, colour:col, size:2});
    shapes.push({type:'door-l', x:lx+3, y:ceil+3, x2:lx+lw/2-1, y2:ceil+topH-3, colour:col, size:1});
    shapes.push({type:'door-r', x:lx+lw/2+1, y:ceil+3, x2:lx+lw-3, y2:ceil+topH-3, colour:col, size:1});
    shapes.push({type:'wall', x:lx, y:ceil+topH, x2:lx+lw, y2:ceil+topH+mainH, colour:col, size:2});
    shapes.push({type:'door-l', x:lx+3, y:ceil+topH+3, x2:lx+lw/2-1, y2:ceil+topH+mainH-3, colour:col, size:1});
    shapes.push({type:'door-r', x:lx+lw/2+1, y:ceil+topH+3, x2:lx+lw-3, y2:ceil+topH+mainH-3, colour:col, size:1});
    shapes.push({type:'hanging', x:lx+8, y:ceil+topH+mainH*0.28, x2:lx+lw-8, y2:ceil+topH+mainH*0.28, colour:col, size:2});
    // ── Right shelf tower (with top box + shelves) ──────
    shapes.push({type:'wall', x:rx, y:ceil, x2:rx+rw, y2:ceil+topH, colour:col, size:2});
    shapes.push({type:'door-l', x:rx+3, y:ceil+3, x2:rx+rw-3, y2:ceil+topH-3, colour:col, size:1});
    shapes.push({type:'wall', x:rx, y:ceil+topH, x2:rx+rw, y2:ceil+topH+mainH, colour:col, size:2});
    shapes.push({type:'door-l', x:rx+3, y:ceil+topH+3, x2:rx+rw-3, y2:ceil+topH+mainH-3, colour:col, size:1});
    for (let i=1;i<=4;i++) shapes.push({type:'shelf', x:rx+6, y:ceil+topH+mainH*(i/5), x2:rx+rw-6, y2:ceil+topH+mainH*(i/5), colour:col, size:1.5});
    // ── Dimension labels ─────────────────────────────────
    const totalW = lw + rw + 4;
    shapes.push({type:'text', x:lx + totalW*0.3, y:ceil+topH+mainH+16, text:'Width: _______ mm', colour:'#c0392b', size:0, isDim:true});
    shapes.push({type:'text', x:lx + totalW*0.3, y:ceil+topH+mainH+34, text:'Depth: _______ mm', colour:'#c0392b', size:0, isDim:true});
    shapes.push({type:'text', x:rx+rw+6, y:ceil+topH+mainH*0.5, text:'Height: _______ mm', colour:'#c0392b', size:0, isDim:true});
    shapes.push({type:'text', x:cx-45, y:ceil+topH+mainH+52, text:'Corner Wardrobe (Front View)', colour:col, size:1});

  } else if (type === 'tall-shelf') {
    const uw=W*0.24, uh=fullH*0.92, bx=cx-uw/2;
    shapes.push({type:'wall', x:bx, y:ceil, x2:bx+uw, y2:ceil+uh, colour:col, size:2});
    for (let i=1;i<=5;i++) shapes.push({type:'shelf', x:bx+6, y:ceil+uh*(i/6), x2:bx+uw-6, y2:ceil+uh*(i/6), colour:col, size:1.5});
    shapes.push({type:'text', x:bx, y:ceil+uh+16, text:'Shelf Tower', colour:col, size:1});

  } else if (type === 'single-drawer') {
    // One single drawer face — drag to place more
    const uw=W*0.28, dh=H*0.09, bx=cx-uw/2, by=H*0.42;
    shapes.push({type:'drawer', x:bx, y:by, x2:bx+uw, y2:by+dh, colour:col, size:2});
    shapes.push({type:'text', x:bx+4, y:by+dh+13, text:'Drawer — add more below', colour:col, size:0});

  } else if (type === 'dressing-desk') {
    // Desk with 3 drawers on right side and large mirror above
    const dw=W*0.52, dh=fullH*0.45, top=H*0.45, bx=cx-dw/2;
    const drawerW=dw*0.28, legW=dw*0.06;
    // Desktop surface
    shapes.push({type:'wall', x:bx, y:top, x2:bx+dw, y2:top+dh*0.08, colour:col, size:2});
    // Left leg/panel
    shapes.push({type:'wall', x:bx, y:top+dh*0.08, x2:bx+legW, y2:top+dh, colour:col, size:1.5});
    // Right drawer stack (3 drawers)
    const dx = bx+dw-drawerW;
    shapes.push({type:'wall', x:dx, y:top+dh*0.08, x2:bx+dw, y2:top+dh, colour:col, size:1.5});
    const drawH = (dh*0.88)/3;
    for (let i=0;i<3;i++) {
      const dy = top+dh*0.1 + i*drawH;
      shapes.push({type:'drawer', x:dx+3, y:dy+2, x2:bx+dw-3, y2:dy+drawH-2, colour:col, size:1.5});
    }
    // Centre open knee space
    shapes.push({type:'text', x:bx+dw*0.25, y:top+dh*0.55, text:'Knee Space', colour:col, size:0});
    // Mirror above
    const mw=dw*0.55, mh=fullH*0.38;
    shapes.push({type:'wall', x:cx-mw/2, y:top-mh-8, x2:cx+mw/2, y2:top-8, colour:col, size:1.5});
    // Mirror cross lines to indicate glass
    shapes.push({type:'text', x:cx-18, y:top-mh/2, text:'Mirror', colour:col, size:1});
    shapes.push({type:'text', x:bx+4, y:top+dh+16, text:'Dressing Desk with Mirror', colour:col, size:1});
  }
  skState.shapes.push(...shapes);
  skRedraw();
  skDirty = true;
}

// ── Drawing functions ────────────────────────────────────────────────────────
function skDrawShapePreview(ctx, tool, x1, y1, x2, y2) {
  ctx.save();
  ctx.setLineDash([6,4]);
  skRenderShape(ctx, {type:tool, x:x1, y:y1, x2:x2, y2:y2, colour:skState.colour, size:skState.size}, true);
  ctx.restore();
}

function skDrawPenPreview(ctx) {
  if (skState.path.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(skState.path[0].x, skState.path[0].y);
  skState.path.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = skState.colour;
  ctx.lineWidth = skState.size;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.stroke();
}

function skRenderShape(ctx, s, preview) {
  const x1=s.x, y1=s.y, x2=s.x2!==undefined?s.x2:s.x, y2=s.y2!==undefined?s.y2:s.y;
  const minX=Math.min(x1,x2), minY=Math.min(y1,y2);
  const w=Math.abs(x2-x1), h=Math.abs(y2-y1);
  ctx.strokeStyle = s.colour || '#1a1a1a';
  ctx.fillStyle = s.colour || '#1a1a1a';
  ctx.lineWidth = s.size || 2;
  ctx.lineCap = 'square'; ctx.lineJoin = 'miter';

  if (s.type === 'wall') {
    ctx.fillStyle = 'rgba(240,235,228,0.65)';
    ctx.fillRect(minX, minY, w, h);
    ctx.strokeStyle = s.colour; ctx.lineWidth = s.size;
    ctx.strokeRect(minX, minY, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1;
    ctx.strokeRect(minX+3, minY+3, w-6, h-6);

  } else if (s.type === 'corner') {
    const cx2=minX+w*0.5, cy2=minY+h*0.5;
    ctx.fillStyle = 'rgba(240,235,228,0.65)';
    ctx.beginPath();
    ctx.moveTo(minX,minY); ctx.lineTo(minX+w,minY);
    ctx.lineTo(minX+w,cy2); ctx.lineTo(cx2,cy2);
    ctx.lineTo(cx2,minY+h); ctx.lineTo(minX,minY+h);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle=s.colour; ctx.lineWidth=s.size; ctx.stroke();
    ctx.fillStyle=s.colour; ctx.font='bold 11px Arial';
    ctx.fillText('Corner', minX+6, minY+18);

  } else if (s.type === 'triangle') {
    // Angled/dormer shape — right triangle for sloped ceiling
    ctx.fillStyle = 'rgba(240,235,228,0.65)';
    ctx.beginPath();
    ctx.moveTo(minX, minY+h);   // bottom-left
    ctx.lineTo(minX+w, minY+h); // bottom-right
    ctx.lineTo(minX+w, minY);   // top-right (tall side)
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle=s.colour; ctx.lineWidth=s.size; ctx.stroke();
    ctx.fillStyle=s.colour; ctx.font='10px Arial';
    ctx.fillText('Angled', minX+8, minY+h-12);

  } else if (s.type === 'door-l') {
    // Left-hand door: handle on right edge, hinge on left
    ctx.fillStyle = 'rgba(220,210,195,0.4)';
    ctx.fillRect(minX, minY, w, h);
    ctx.strokeStyle = s.colour; ctx.lineWidth = s.size*0.8;
    ctx.strokeRect(minX, minY, w, h);
    // Hinge marks left side
    ctx.fillStyle = s.colour;
    ctx.fillRect(minX+1, minY+h*0.2-3, 5, 6);
    ctx.fillRect(minX+1, minY+h*0.8-3, 5, 6);
    // Handle on right (suppressed for sliding doors)
    if (!skState.isSliding && !s.noHandle) {
      const hy = minY+h/2;
      ctx.beginPath(); ctx.moveTo(minX+w-10, hy-9); ctx.lineTo(minX+w-10, hy+9);
      ctx.lineWidth=s.size+1; ctx.strokeStyle=s.colour; ctx.lineCap='round'; ctx.stroke();
    }
    // Grain lines
    ctx.strokeStyle='rgba(0,0,0,0.05)'; ctx.lineWidth=0.8; ctx.lineCap='square';
    for (let yy=minY+14;yy<minY+h-8;yy+=16){ctx.beginPath();ctx.moveTo(minX+8,yy);ctx.lineTo(minX+w-8,yy);ctx.stroke();}
    ctx.fillStyle=s.colour; ctx.font='bold 10px Arial';
    if (skState.isSliding) {
      ctx.fillText('Sliding', minX+4, minY+14);
      // Sliding door track lines at top and bottom
      ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=2; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(minX,minY+3); ctx.lineTo(minX+w,minY+3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(minX,minY+h-3); ctx.lineTo(minX+w,minY+h-3); ctx.stroke();
    } else {
      ctx.fillText('L', minX+4, minY+12);
    }

  } else if (s.type === 'door-r') {
    // Right-hand door: handle on left edge, hinge on right
    ctx.fillStyle = 'rgba(220,210,195,0.4)';
    ctx.fillRect(minX, minY, w, h);
    ctx.strokeStyle = s.colour; ctx.lineWidth = s.size*0.8;
    ctx.strokeRect(minX, minY, w, h);
    // Hinge marks right side
    ctx.fillStyle = s.colour;
    ctx.fillRect(minX+w-6, minY+h*0.2-3, 5, 6);
    ctx.fillRect(minX+w-6, minY+h*0.8-3, 5, 6);
    // Handle on left (suppressed for sliding doors)
    if (!skState.isSliding && !s.noHandle) {
      const hy = minY+h/2;
      ctx.beginPath(); ctx.moveTo(minX+10, hy-9); ctx.lineTo(minX+10, hy+9);
      ctx.lineWidth=s.size+1; ctx.strokeStyle=s.colour; ctx.lineCap='round'; ctx.stroke();
    }
    // Grain lines
    ctx.strokeStyle='rgba(0,0,0,0.05)'; ctx.lineWidth=0.8; ctx.lineCap='square';
    for (let yy=minY+14;yy<minY+h-8;yy+=16){ctx.beginPath();ctx.moveTo(minX+8,yy);ctx.lineTo(minX+w-8,yy);ctx.stroke();}
    ctx.fillStyle=s.colour; ctx.font='bold 10px Arial';
    if (skState.isSliding) {
      ctx.fillText('Sliding', minX+4, minY+14);
      ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=2; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(minX,minY+3); ctx.lineTo(minX+w,minY+3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(minX,minY+h-3); ctx.lineTo(minX+w,minY+h-3); ctx.stroke();
    } else {
      ctx.fillText('R', minX+w-12, minY+12);
    }

  } else if (s.type === 'shelf') {
    const sy=(y1+y2)/2;
    ctx.strokeStyle=s.colour; ctx.lineWidth=s.size+1;
    ctx.beginPath(); ctx.moveTo(minX,sy); ctx.lineTo(minX+w,sy); ctx.stroke();
    ctx.strokeStyle='rgba(0,0,0,0.12)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(minX,sy+2); ctx.lineTo(minX+w,sy+2); ctx.stroke();

  } else if (s.type === 'hanging') {
    const ry=(y1+y2)/2;
    ctx.strokeStyle=s.colour; ctx.lineWidth=s.size;
    ctx.beginPath(); ctx.moveTo(minX,ry); ctx.lineTo(minX+w,ry); ctx.stroke();
    const spacing=Math.max(22,w/Math.max(1,Math.floor(w/26)));
    ctx.strokeStyle=s.colour; ctx.lineWidth=1.5;
    for (let hx=minX+spacing/2;hx<minX+w-8;hx+=spacing){
      ctx.beginPath(); ctx.arc(hx,ry,3,Math.PI,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx-9,ry+7); ctx.lineTo(hx,ry+3); ctx.lineTo(hx+9,ry+7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx-9,ry+7); ctx.lineTo(hx-9,ry+24); ctx.lineTo(hx+9,ry+24); ctx.lineTo(hx+9,ry+7); ctx.stroke();
    }
    ctx.fillStyle=s.colour; ctx.font='bold 11px Arial';
    ctx.fillText('Rail',minX+4,ry-5);

  } else if (s.type === 'drawer') {
    ctx.fillStyle='rgba(200,190,178,0.55)';
    ctx.fillRect(minX,minY,w,h);
    ctx.strokeStyle=s.colour; ctx.lineWidth=s.size*0.8;
    ctx.strokeRect(minX,minY,w,h);
    // Central handle bar
    const hW=Math.min(w*0.38,55);
    ctx.beginPath();
    ctx.moveTo(minX+w/2-hW/2, minY+h/2);
    ctx.lineTo(minX+w/2+hW/2, minY+h/2);
    ctx.lineWidth=s.size+1; ctx.strokeStyle=s.colour; ctx.lineCap='round'; ctx.stroke();

  } else if (s.type === 'pen') {
    if (!s.path||s.path.length<2) return;
    ctx.beginPath(); ctx.moveTo(s.path[0].x,s.path[0].y);
    s.path.forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.strokeStyle=s.colour; ctx.lineWidth=s.size;
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();

  } else if (s.type === 'text') {
    const isDim = s.isDim || (s.size||0) === 0;
    // Dimension labels: large, red, bold — regular labels: normal bold
    const sz = isDim ? 13 : (13 + (s.size||0)*4);
    ctx.font = 'bold ' + sz + 'px Arial';
    ctx.fillStyle = s.colour || '#1a1a1a';
    ctx.fillText(s.text, s.x, s.y);
    // Underline + pencil icon on dimension labels
    if (isDim) {
      const tw = ctx.measureText(s.text).width;
      ctx.strokeStyle = s.colour || '#c0392b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.beginPath(); ctx.moveTo(s.x, s.y + 3); ctx.lineTo(s.x + tw, s.y + 3); ctx.stroke();
      ctx.setLineDash([]);
      // ✏ pencil icon — signals double-click to edit
      ctx.font = 'bold 11px Arial';
      ctx.fillStyle = 'rgba(192,57,43,0.8)';
      ctx.fillText(' ✏', s.x + tw, s.y);
      ctx.font = 'bold ' + sz + 'px Arial';
    }
  }
}

function skRedraw() {
  const c = document.getElementById('sk-main-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#faf9f7';
  ctx.fillRect(0,0,W,H);
  // Grid
  ctx.strokeStyle='#e8e5e0'; ctx.lineWidth=0.5;
  for (let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for (let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  // Ceiling/floor guides
  ctx.strokeStyle='#c0392b'; ctx.lineWidth=1; ctx.setLineDash([6,4]);
  const floor=H*0.94, ceil=H*0.06;
  ctx.beginPath();ctx.moveTo(0,floor);ctx.lineTo(W,floor);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,ceil);ctx.lineTo(W,ceil);ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle='rgba(192,57,43,0.85)'; ctx.font='bold 13px Arial';
  ctx.fillText('CEILING',6,ceil-3);
  ctx.fillText('FLOOR',6,floor+14);
  // Shapes
  skState.shapes.forEach((s,i)=>{
    ctx.save();
    skRenderShape(ctx,s,false);
    if (skState.selected===i && s.x2!==undefined){
      const x1=s.x,y1=s.y,x2=s.x2,y2=s.y2;
      const bx=Math.min(x1,x2)-6, by=Math.min(y1,y2)-6;
      const bw=Math.abs(x2-x1)+12, bh=Math.abs(y2-y1)+12;
      ctx.setLineDash([4,4]); ctx.strokeStyle='#2980b9'; ctx.lineWidth=1.5;
      ctx.strokeRect(bx,by,bw,bh);
      ctx.setLineDash([]);
      // 8 resize handles: corners + edge midpoints
      const mx=(x1+x2)/2, my=(y1+y2)/2;
      [[x1,y1],[x2,y1],[x1,y2],[x2,y2],[mx,y1],[mx,y2],[x1,my],[x2,my]].forEach(([hx,hy])=>{
        ctx.fillStyle='#2980b9';
        ctx.fillRect(hx-5,hy-5,10,10);
        ctx.strokeStyle='#fff'; ctx.lineWidth=1.5;
        ctx.strokeRect(hx-5,hy-5,10,10);
      });
      ctx.fillStyle='rgba(41,128,185,0.9)'; ctx.font='bold 9px Arial';
      ctx.fillText('drag=move  drag handle=resize  pinch=scale',bx,by-6);
    }
    ctx.restore();
  });
  // Watermark
  ctx.fillStyle='rgba(192,57,43,0.06)';
  ctx.font='bold 12px Arial';
  ctx.fillText('LUXURY HOUSE  |  luxuryhouseonline.com',W/2-130,H-5);
  // Lasso rect
  if (skState.lasso) {
    const l = skState.lasso;
    ctx.setLineDash([4,3]); ctx.strokeStyle='#27ae60'; ctx.lineWidth=1.5;
    ctx.fillStyle='rgba(39,174,96,0.05)';
    const lx=Math.min(l.x1,l.x2), ly=Math.min(l.y1,l.y2);
    const lw=Math.abs(l.x2-l.x1), lh=Math.abs(l.y2-l.y1);
    ctx.fillRect(lx,ly,lw,lh);
    ctx.strokeRect(lx,ly,lw,lh);
    ctx.setLineDash([]);
  }
  // Group selection highlight
  if (skState.selectedGroup.length > 0) {
    let gx1=Infinity,gy1=Infinity,gx2=-Infinity,gy2=-Infinity;
    skState.selectedGroup.forEach(i => {
      const s = skState.shapes[i];
      const sx1=s.x2!==undefined?Math.min(s.x,s.x2):s.x-40, sy1=s.y2!==undefined?Math.min(s.y,s.y2):s.y-10;
      const sx2=s.x2!==undefined?Math.max(s.x,s.x2):s.x+40, sy2=s.y2!==undefined?Math.max(s.y,s.y2):s.y+10;
      gx1=Math.min(gx1,sx1); gy1=Math.min(gy1,sy1); gx2=Math.max(gx2,sx2); gy2=Math.max(gy2,sy2);
    });
    ctx.setLineDash([5,3]); ctx.strokeStyle='#27ae60'; ctx.lineWidth=2;
    ctx.fillStyle='rgba(39,174,96,0.04)';
    ctx.fillRect(gx1-4,gy1-4,gx2-gx1+8,gy2-gy1+8);
    ctx.strokeRect(gx1-4,gy1-4,gx2-gx1+8,gy2-gy1+8);
    ctx.setLineDash([]);
    ctx.fillStyle='rgba(39,174,96,0.9)'; ctx.font='bold 10px Arial';
    ctx.fillText('⬚ '+skState.selectedGroup.length+' shapes — drag to move',gx1,gy1-7);
  }
}


function skDblClick(e) {
  const p = skPos(e);
  // Search from top shape down — find nearest text shape
  for (let i = skState.shapes.length - 1; i >= 0; i--) {
    const s = skState.shapes[i];
    if (s.type === 'text') {
      // Generous hit zone: 240px wide, 28px tall
      if (Math.abs(p.x - s.x) < 240 && Math.abs(p.y - s.y) < 28) {
        const label = s.isDim || (s.size||0) === 0 ? 'Enter measurement (e.g. 2400mm or just 2400):' : 'Edit label:';
        const newText = prompt(label, s.text);
        if (newText !== null && newText.trim() !== '') {
          // If user typed just a number, format it nicely
          const raw = newText.trim();
          const isJustNum = /^[\d.]+$/.test(raw);
          const prefix = s.text.match(/^[WHD]:/);
          if (isJustNum && prefix) {
            s.text = prefix[0] + ' ' + raw + ' mm';
          } else {
            s.text = raw;
          }
          skRedraw(); skDirty = true;
        }
        return;
      }
    }
  }
}

function skSelectAll() {
  skSetTool('lasso');
  skState.selectedGroup = skState.shapes.map((_,i) => i);
  if (skState.selectedGroup.length > 0) {
    skState.groupOrigShapes = skState.shapes.map(s => JSON.parse(JSON.stringify(s)));
    toast('All '+skState.selectedGroup.length+' shapes selected — drag to move');
    skRedraw();
  } else { toast('No shapes to select'); }
}

function skUndo() {
  if (skState.shapes.length > 0) { skState.shapes.pop(); skState.selected = null; skRedraw(); updateSkDeleteBtn(); }
}
function skClear() {
  if (!confirm('Clear the entire design?')) return;
  skState.shapes = []; skState.selected = null; skRedraw(); updateSkDeleteBtn();
}
function skDeleteSelected() {
  if (skState.selected === null) return;
  skState.shapes.splice(skState.selected, 1);
  skState.selected = null;
  skRedraw(); updateSkDeleteBtn(); skDirty = true;
}
function skKeyDown(e) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (skState.selected !== null) { e.preventDefault(); skDeleteSelected(); }
  }
  if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); skUndo(); }
}
function updateSkDeleteBtn() {
  const btn = document.getElementById('sk-delete-btn');
  if (btn) btn.style.display = skState.selected !== null ? 'block' : 'none';
}

function getSketchPNG(id) {
  const item = getItem(id);
  if (!item) return null;
  // Try PNG snapshot first (from designer)
  if (item.sketchPNG) return item.sketchPNG;
  // Legacy
  if (item.sketchHistory && item.sketchHistory.length) {
    const h = item.sketchHistory[0];
    if (h && h.type === 'png') return h.data;
  }
  return null;
}
