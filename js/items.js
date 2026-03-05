// ══════════════════════════════════════════════
// ITEM MANAGEMENT
// ══════════════════════════════════════════════
function newItem(id) {
  return {
    id, type:'Sliding Door Fitted', room:'Master Bedroom', doors:'2 Door',
    w:'', h:'', d:'', units:1,
    doorStyle:'Handleless', finish:'Matt', colour:boardColours[0], customColour:'',
    handles:'None / Handleless', rails:'Long Hang (Full Height)', shelves:4,
    drawers:0, addons:[], interiorFinish:'White', customAddon:'', layoutPreset:'',
    bespokeNotes:'', extraPrice:0, extras:[], sketchHistory:[], activeTab:'design'
  };
}

function addItem() {
  itemCounter++;
  items.push(newItem(itemCounter));
  renderItems();
}

function removeItem(id) {
  if (items.length <= 1) { toast('Need at least one item'); return; }
  if (!confirm('Remove this item?')) return;
  items = items.filter(i => i.id !== id);
  renderItems();
}

function getItem(id) { return items.find(i => i.id === id); }

function renderItems() {
  const c = document.getElementById('items-container');
  c.innerHTML = '';
  items.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.id = 'item-card-' + item.id;
    div.innerHTML = buildItemHTML(item, idx);
    c.appendChild(div);
  });
}


function buildDoorGallery(item) {
  var groups = [], seenG = {};
  DOOR_STYLE_GALLERY.forEach(function(d){ if(!seenG[d.group]){seenG[d.group]=true; groups.push(d.group);} });

  var html = '<div style="font-size:10px;color:#888;margin-bottom:8px;">Hinged door styles from Browns 2000 — tap any to select. Photos load when online.</div>';

  groups.forEach(function(grp) {
    html += '<div style="grid-column:1/-1;display:flex;align-items:center;gap:8px;margin:10px 0 5px;">'
          + '<span style="font-size:9px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#c0392b;">' + grp + '</span>'
          + '<div style="flex:1;height:1px;background:#333;"></div></div>';

    DOOR_STYLE_GALLERY.forEach(function(ds) {
      if (ds.group !== grp) return;
      var sel = item.doorStyle === ds.name;
      var safeName = ds.name.replace(/'/g, "\\'");
      var cardBorder = sel ? '2px solid #c0392b' : '2px solid #333';
      var cardGlow   = sel ? 'box-shadow:0 0 0 3px rgba(192,57,43,0.35);' : '';

      var photoArea;
      if (ds.img) {
        photoArea = '<div style="position:relative;height:100px;background:' + ds.bg + ';overflow:hidden;">'
          + '<img src="' + ds.img + '" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display=\'none\'" loading="lazy">'
          + (ds.popular ? '<div style="position:absolute;top:4px;left:4px;background:#c0392b;color:#fff;font-size:8px;font-weight:bold;letter-spacing:1px;padding:2px 6px;border-radius:3px;">&#9733; POPULAR</div>' : '')
          + (sel ? '<div style="position:absolute;bottom:4px;right:4px;background:#c0392b;color:#fff;font-size:9px;font-weight:bold;padding:2px 7px;border-radius:3px;">&#10003; Selected</div>' : '')
          + '</div>';
      } else {
        photoArea = '<div style="height:100px;background:' + ds.bg + ';display:flex;align-items:center;justify-content:center;font-size:32px;position:relative;">'
          + (ds.icon || '&#9635;')
          + (sel ? '<div style="position:absolute;bottom:4px;right:4px;background:#c0392b;color:#fff;font-size:9px;font-weight:bold;padding:2px 7px;border-radius:3px;">&#10003; Selected</div>' : '')
          + '</div>';
      }

      html += '<div onclick="setField(' + item.id + ',\'doorStyle\',\'' + safeName + '\')"'
            + ' style="' + cardBorder + ';border-radius:9px;overflow:hidden;cursor:pointer;background:#1e1e1e;transition:all 0.18s;' + cardGlow + '">'
            + photoArea
            + '<div style="padding:7px 8px;">'
            + '<div style="font-size:11px;font-weight:bold;color:' + (sel ? '#e74c3c' : '#f0f0f0') + ';line-height:1.3;">' + ds.name.split(' \u2014 ')[0] + '</div>'
            + '<div style="font-size:10px;color:#999;margin-top:2px;line-height:1.3;">' + ds.sub + '</div>'
            + '</div></div>';
    });
  });

  return html;
}

function buildItemHTML(item, idx) {
  var num = idx + 1;
  var id = item.id;
  var isSliding = SLIDING_TYPES.includes(item.type);
  var activeTab = item.activeTab || 'design';

  // ── swatches ──────────────────────────────────────────
  var swatches = boardColours.map(function(c) {
    var sel = item.colour && item.colour.code === c.code ? ' selected' : '';
    return '<div class="swatch' + sel + '" onclick="setColour(' + id + ',\'' + c.code + '\')">' +
      '<div class="swatch-colour" style="background:' + c.hex + '"></div>' +
      '<div class="swatch-name">' + c.code + '<br>' + c.name + '</div></div>';
  }).join('');

  // ── addons ────────────────────────────────────────────
  var addons = Object.keys(EXTRA_PRICES).map(function(o) {
    var sel = item.addons.includes(o) ? ' selected' : '';
    return '<div class="toggle-opt' + sel + '" onclick="toggleAddon(' + id + ',\'' + o + '\')">' + o + '</div>';
  }).join('');

  // ── door config toggles ───────────────────────────────
  var doorPresets = ['2 Door','3 Door','Open / No Doors'];
  var doorIsOther = item.doors && !doorPresets.includes(item.doors);
  var doorToggles = doorPresets.map(function(o) {
    return '<div class="toggle-opt' + (item.doors===o?' selected':'') + '" onclick="setField(' + id + ',\'doors\',\'' + o + '\')">' + o + '</div>';
  }).join('') + '<div class="toggle-opt' + (doorIsOther?' selected':'') + '" onclick="setFieldOther(' + id + ',\'doors\',\'__other__\',\'oth-doors-' + id + '\')">✏️ Other</div>';

  // ── type toggles ──────────────────────────────────────
  var typeIsOther = item.type && !SLIDING_TYPES.includes(item.type) && !HINGED_TYPES.includes(item.type) && item.type !== 'Hinged Door Fitted';
  var typeToggles =
    '<div class="toggle-opt' + (SLIDING_TYPES.includes(item.type)?' selected':'') + '" onclick="setFieldAndRender(' + id + ',\'type\',\'Sliding Door Fitted\')">Sliding</div>' +
    '<div class="toggle-opt' + (item.type==='Hinged Door Fitted'?' selected':'') + '" onclick="setFieldAndRender(' + id + ',\'type\',\'Hinged Door Fitted\')">Hinged</div>' +
    '<div class="toggle-opt' + (typeIsOther?' selected':'') + '" onclick="setFieldOther(' + id + ',\'type\',\'__other__\',\'oth-type-' + id + '\')">✏️ Other</div>';

  // ── room options ──────────────────────────────────────
  var rooms = ['Master Bedroom','Bedroom 2','Bedroom 3','Dressing Room','Landing / Hallway','Study / Office'];
  var roomIsOther = item.room && !rooms.includes(item.room);
  var roomOpts = rooms.map(function(r) {
    return '<option' + (item.room===r?' selected':'') + '>' + r + '</option>';
  }).join('') + '<option' + (roomIsOther?' selected':'') + '>Other</option>';

  // ── sketch status ─────────────────────────────────────
  var hasPNG = !!item.sketchPNG;
  var designerBtnLabel = hasPNG ? '✏️ Edit Design' : '✏️ Open Designer';
  var sketchStatus = hasPNG
    ? '<span style="color:var(--success);font-size:11px;font-weight:bold">✓ Design saved</span>'
    : '<span style="font-size:11px;color:var(--text-muted)">No design yet</span>';

  // ── handle finish label ───────────────────────────────
  var handleLabel = 'Handle Finish' + (isSliding ? ' <span style="font-size:9px;color:var(--text-muted)">(none for sliding)</span>' : '');
  var handleOpts = ['None / Handleless','Brushed Gold','Matt Black','Chrome','Brushed Nickel','Antique Brass'].map(function(o) {
    return '<div class="toggle-opt' + (item.handles===o?' selected':'') + '" onclick="setField(' + id + ',\'handles\',\'' + o + '\')">' + o + '</div>';
  }).join('');

  // ── interior opts ─────────────────────────────────────
  var interiorOpts = ['Matching','White','Grey','Any'].map(function(o) {
    return '<div class="toggle-opt' + (item.interiorFinish===o?' selected':'') + '" onclick="setField(' + id + ',\'interiorFinish\',\'' + o + '\')">' + o + '</div>';
  }).join('');

  var railOpts = ['Long Hang (Full Height)','Double Hang','Half & Half','No Rails'].map(function(o) {
    return '<div class="toggle-opt' + (item.rails===o?' selected':'') + '" onclick="setField(' + id + ',\'rails\',\'' + o + '\')">' + o + '</div>';
  }).join('');

  // ── door gallery (hinged only) ────────────────────────
  var doorGalleryBlock = isSliding
    ? '<div style="background:rgba(192,57,43,0.08);border:1px solid rgba(192,57,43,0.3);border-radius:8px;padding:12px;color:var(--text-muted);font-size:12px">Sliding wardrobes are handleless — board colour determines the panel finish. Choose a board colour below.</div>'
    : '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;max-height:420px;overflow-y:auto;padding:2px 4px">' +
        buildDoorGallery(item) +
      '</div>' +
      '<input type="text" id="oth-style-' + id + '" placeholder="Describe custom door style..." ' +
        'style="margin-top:8px;display:' + (!DOOR_STYLE_GALLERY.map(function(d){return d.name;}).includes(item.doorStyle)&&item.doorStyle?'block':'none') + '" ' +
        'value="' + (!DOOR_STYLE_GALLERY.map(function(d){return d.name;}).includes(item.doorStyle)?item.doorStyle:'') + '" ' +
        'oninput="setField(' + id + ',\'doorStyle\',this.value)">' +
      (item.doorStyle ? '<div style="margin-top:8px;padding:8px 12px;background:rgba(192,57,43,0.1);border:1px solid rgba(192,57,43,0.3);border-radius:8px;font-size:12px;color:var(--red-light);font-weight:bold">✓ Selected: ' + item.doorStyle + '</div>' : '');

  // ── finish toggles ────────────────────────────────────
  var finishOpts = ['Matt','Gloss'].map(function(o) {
    return '<div class="toggle-opt' + (item.finish===o?' selected':'') + '" onclick="setField(' + id + ',\'finish\',\'' + o + '\')">' + o + '</div>';
  }).join('') + '<div class="toggle-opt' + (item.finish&&item.finish!=='Matt'&&item.finish!=='Gloss'?' selected':'') + '" onclick="document.getElementById(\'oth-finish-' + id + '\').style.display=\'block\'">✏️ Other</div>';

  // ── colour status ─────────────────────────────────────
  var colourStatus = item.colour ? '<div style="margin-top:6px;font-size:11px;color:var(--red-light)">✓ ' + item.colour.code + ' ' + item.colour.name + ' (' + item.colour.brand + ')</div>' : '';

  // ── remove button ─────────────────────────────────────
  var removeBtn = items.length > 1 ? '<button class="btn btn-danger btn-sm" onclick="removeItem(' + id + ')">✕</button>' : '';

  // ══════════════════════════════════════════════════════
  // BUILD HTML — plain string concat, no nested backticks
  // ══════════════════════════════════════════════════════
  var h = '';

  // Header
  h += '<div class="item-card-header">';
  h += '<div>';
  h += '<div class="item-card-title"><span style="opacity:0.5;font-size:11px;margin-right:6px">#' + num + '</span>' + (item.room||'New Item') + '</div>';
  h += '<div class="item-card-subtitle">' + (item.type||'Type not set') + ' · ' + (item.doors||'Doors not set') + ' · ' + (item.w ? item.w + 'mm wide' : 'Width not set') + '</div>';
  h += '</div>';
  h += '<div style="display:flex;gap:8px;align-items:center">';
  h += '<span id="badge-' + id + '" style="color:var(--red-light);font-weight:bold;font-size:13px"></span>';
  h += removeBtn;
  h += '</div></div>';

  // Tabs
  var tabs = [['design','✏️ Design'],['finish','🎨 Finish'],['interior','🪵 Interior'],['price','💰 Price']];
  h += '<div class="item-tabs">';
  tabs.forEach(function(t) {
    h += '<button class="item-tab' + (activeTab===t[0]?' active':'') + '" onclick="switchTab(' + id + ',\'' + t[0] + '\')">' + t[1] + '</button>';
  });
  h += '</div>';

  // ── DESIGN TAB ────────────────────────────────────────
  h += '<div id="tab-design-' + id + '" class="item-tab-body" style="display:' + (activeTab==='design'?'block':'none') + '">';

  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">';
  // Type
  h += '<div class="form-group"><label>Wardrobe Type</label>';
  h += '<div class="toggle-group" style="margin-top:4px">' + typeToggles + '</div>';
  h += '<input type="text" id="oth-type-' + id + '" placeholder="e.g. Walk-in, Alcove..." style="margin-top:6px;display:' + (typeIsOther?'block':'none') + '" value="' + (typeIsOther?item.type:'') + '" oninput="setFieldAndRender(' + id + ',\'type\',this.value)"></div>';
  // Room
  h += '<div class="form-group"><label>Room</label>';
  h += '<select style="margin-top:4px" onchange="setFieldAndRender(' + id + ',\'room\',this.value)">' + roomOpts + '</select>';
  h += '<input type="text" id="oth-room-' + id + '" placeholder="Enter room name..." style="margin-top:6px;display:' + (roomIsOther?'block':'none') + '" value="' + (roomIsOther?item.room:'') + '" oninput="setFieldAndRender(' + id + ',\'room\',this.value)"></div>';
  h += '</div>';

  // Door config
  h += '<div class="form-group" style="margin-bottom:18px"><label>Door Configuration</label>';
  h += '<div class="toggle-group" style="margin-top:4px">' + doorToggles + '</div>';
  h += '<input type="text" id="oth-doors-' + id + '" placeholder="e.g. 4 Door, Bifold..." style="margin-top:6px;display:' + (doorIsOther?'block':'none') + '" value="' + (doorIsOther?item.doors:'') + '" oninput="setField(' + id + ',\'doors\',this.value)">';
  h += '</div>';

  // Designer CTA
  h += '<div class="designer-cta">';
  h += '<div class="designer-cta-icon">📐</div>';
  h += '<div class="designer-cta-text"><h3>Front View Designer</h3><p>Draw the layout. W/H/D values entered in the designer auto-fill the dimensions below.</p>' + sketchStatus + '</div>';
  h += '<button class="btn btn-red designer-cta-btn" onclick="openSketchDesigner(' + id + ')">' + designerBtnLabel + '</button>';
  h += '</div>';

  // Sketch thumbnail
  h += '<div class="sketch-thumb-box" id="sketch-preview-thumb-' + id + '" style="margin-bottom:18px;' + (hasPNG?'':'display:none') + '">';
  h += '<img id="sketch-thumb-img-' + id + '" src="' + (item.sketchPNG||'') + '" style="width:100%;display:' + (hasPNG?'block':'none') + '" alt="Design">';
  h += '</div>';
  h += '<div id="sketch-empty-' + id + '" style="' + (hasPNG?'display:none':'') + '"></div>';

  // Dimensions
  h += '<div class="tab-section">';
  h += '<div class="tab-section-title">Dimensions <span style="color:var(--text-muted);font-weight:normal;letter-spacing:0;text-transform:none;font-size:9px">— auto-filled from designer, or enter manually</span></div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">';
  h += '<div class="form-group"><label>Width mm <span style="color:var(--red-light)">*</span></label><input type="number" id="dim-w-' + id + '" value="' + (item.w||'') + '" placeholder="2400" oninput="setFieldAndPrice(' + id + ',\'w\',this.value)" style="font-size:16px;font-weight:bold"></div>';
  h += '<div class="form-group"><label>Height mm</label><input type="number" id="dim-h-' + id + '" value="' + (item.h||'') + '" placeholder="2260" oninput="setField(' + id + ',\'h\',this.value)" style="font-size:16px;font-weight:bold"></div>';
  h += '<div class="form-group"><label>Depth mm</label><input type="number" id="dim-d-' + id + '" value="' + (item.d||'') + '" placeholder="600" oninput="setField(' + id + ',\'d\',this.value)" style="font-size:16px;font-weight:bold"></div>';
  h += '</div>';
  h += '<div style="display:flex;align-items:center;gap:12px"><span style="font-size:11px;color:var(--text-muted)">Units:</span>';
  h += '<div class="counter" style="margin:0"><button onclick="changeUnits(' + id + ',-1)">−</button><span id="units-' + id + '">' + item.units + '</span><button onclick="changeUnits(' + id + ',1)">+</button></div></div>';
  h += '</div>';

  // Bespoke notes
  h += '<div class="form-group" style="margin-top:14px"><label>Bespoke / Site Notes</label>';
  h += '<textarea placeholder="Ceiling slope, chimney breast, special requirements..." rows="2" oninput="setField(' + id + ',\'bespokeNotes\',this.value)">' + (item.bespokeNotes||'') + '</textarea></div>';
  h += '</div>'; // end design tab

  // ── FINISH TAB ────────────────────────────────────────
  h += '<div id="tab-finish-' + id + '" class="item-tab-body" style="display:' + (activeTab==='finish'?'block':'none') + '">';

  h += '<div class="tab-section">';
  h += '<div class="tab-section-title">Door Style' + (isSliding?' — Sliding (handleless)':' — Hinged') + '</div>';
  h += doorGalleryBlock;
  h += '</div>';

  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">';
  h += '<div class="form-group"><label>Surface Finish</label><div class="toggle-group" style="margin-top:4px">' + finishOpts + '</div>';
  h += '<input type="text" id="oth-finish-' + id + '" placeholder="e.g. Silk, Woodgrain..." style="margin-top:6px;display:' + (item.finish&&item.finish!=='Matt'&&item.finish!=='Gloss'?'block':'none') + '" value="' + (item.finish&&item.finish!=='Matt'&&item.finish!=='Gloss'?item.finish:'') + '" oninput="setField(' + id + ',\'finish\',this.value)"></div>';
  h += '<div class="form-group"><label>' + handleLabel + '</label><div class="toggle-group" style="margin-top:4px">' + handleOpts + '</div></div>';
  h += '</div>';

  h += '<div class="tab-section">';
  h += '<div class="tab-section-title">Board Colour — Egger / Kronospan</div>';
  h += '<div class="swatch-grid" id="swatches-' + id + '">' + swatches + '</div>';
  h += '<input type="text" style="margin-top:8px" value="' + (item.customColour||'') + '" placeholder="Custom board ref — e.g. Egger U201" oninput="setField(' + id + ',\'customColour\',this.value)">';
  h += colourStatus;
  h += '</div>';
  h += '</div>'; // end finish tab

  // ── INTERIOR TAB ──────────────────────────────────────
  h += '<div id="tab-interior-' + id + '" class="item-tab-body" style="display:' + (activeTab==='interior'?'block':'none') + '">';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">';
  h += '<div class="form-group"><label>Interior Colour</label><div class="toggle-group" style="margin-top:4px">' + interiorOpts + '</div></div>';
  h += '<div class="form-group"><label>Hanging Rails</label><div class="toggle-group" style="margin-top:4px">' + railOpts + '</div></div>';
  h += '</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">';
  h += '<div class="form-group"><label>Shelves</label><div class="counter" style="margin-top:6px"><button onclick="changeShelves(' + id + ',-1)">−</button><span id="shelves-' + id + '">' + item.shelves + '</span><button onclick="changeShelves(' + id + ',1)">+</button></div></div>';
  h += '<div class="form-group"><label>Drawer Packs <span style="color:var(--text-muted);font-size:9px">(£140 each)</span></label><input type="number" min="0" max="20" value="' + (parseInt(item.drawers)||0) + '" placeholder="0" oninput="setFieldAndPrice(' + id + ',\'drawers\',this.value)" style="font-size:20px;text-align:center;font-weight:bold;padding:8px;margin-top:4px"></div>';
  h += '</div>';
  h += '<div class="form-group"><label>Accessories</label><div class="toggle-group" style="margin-top:4px" id="addons-' + id + '">' + addons + '</div>';
  h += '<input type="text" id="oth-addons-' + id + '" placeholder="Other accessories..." style="margin-top:8px" value="' + (item.customAddon||'') + '" oninput="setField(' + id + ',\'customAddon\',this.value)"></div>';
  h += '</div>'; // end interior tab

  // ── PRICE TAB ─────────────────────────────────────────
  h += '<div id="tab-price-' + id + '" class="item-tab-body" style="display:' + (activeTab==='price'?'block':'none') + '">';
  h += '<div id="price-breakdown-' + id + '"></div>';
  h += '</div>'; // end price tab

  return h;
}

function switchTab(id, tab) {
  const item = getItem(id);
  if (!item) return;
  item.activeTab = tab;
  const TABS = ['design','finish','interior','price'];
  TABS.forEach(t => {
    const el = document.getElementById('tab-'+t+'-'+id);
    if (el) el.style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('#item-card-'+id+' .item-tab').forEach((b, i) => {
    b.classList.toggle('active', TABS[i] === tab);
  });
  if (tab === 'price') buildPriceBreakdown(id);
}

function getLayoutSVG(key) {
  const s = {stroke:'#c0392b', fill:'rgba(192,57,43,0.08)', dark:'rgba(192,57,43,0.25)', text:'#c0392b'};
  const svgs = {
    hanging_only: `<svg viewBox="0 0 100 80" style="width:100%;height:100%">
      <rect x="2" y="2" width="96" height="76" rx="3" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2"/>
      <line x1="50" y1="2" x2="50" y2="78" stroke="${s.stroke}" stroke-width="1" stroke-dasharray="3"/>
      <line x1="2" y1="14" x2="98" y2="14" stroke="${s.stroke}" stroke-width="1.5"/>
      <text x="50" y="11" text-anchor="middle" font-size="8" fill="${s.text}">rail</text>
      <line x1="15" y1="14" x2="15" y2="72" stroke="${s.stroke}" stroke-width="1" stroke-dasharray="2"/>
      <line x1="85" y1="14" x2="85" y2="72" stroke="${s.stroke}" stroke-width="1" stroke-dasharray="2"/>
    </svg>`,
    double_hang: `<svg viewBox="0 0 100 80" style="width:100%;height:100%">
      <rect x="2" y="2" width="96" height="76" rx="3" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2"/>
      <line x1="2" y1="14" x2="98" y2="14" stroke="${s.stroke}" stroke-width="1.5"/>
      <text x="50" y="11" text-anchor="middle" font-size="7" fill="${s.text}">rail</text>
      <line x1="2" y1="44" x2="98" y2="44" stroke="${s.stroke}" stroke-width="1.5"/>
      <text x="50" y="41" text-anchor="middle" font-size="7" fill="${s.text}">rail</text>
      <line x1="14" y1="14" x2="14" y2="72" stroke="${s.stroke}" stroke-width="1" stroke-dasharray="2"/>
      <line x1="86" y1="14" x2="86" y2="72" stroke="${s.stroke}" stroke-width="1" stroke-dasharray="2"/>
    </svg>`,
    half_half: `<svg viewBox="0 0 100 80" style="width:100%;height:100%">
      <rect x="2" y="2" width="96" height="76" rx="3" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2"/>
      <line x1="50" y1="2" x2="50" y2="78" stroke="${s.stroke}" stroke-width="1.5"/>
      <line x1="2" y1="14" x2="48" y2="14" stroke="${s.stroke}" stroke-width="1.5"/>
      <text x="25" y="11" text-anchor="middle" font-size="7" fill="${s.text}">long hang</text>
      <line x1="52" y1="14" x2="98" y2="14" stroke="${s.stroke}" stroke-width="1.5"/>
      <line x1="52" y1="44" x2="98" y2="44" stroke="${s.stroke}" stroke-width="1.5"/>
      <text x="75" y="11" text-anchor="middle" font-size="7" fill="${s.text}">dbl hang</text>
    </svg>`,
    shelves_drawers: `<svg viewBox="0 0 100 80" style="width:100%;height:100%">
      <rect x="2" y="2" width="96" height="76" rx="3" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2"/>
      <line x1="2" y1="22" x2="98" y2="22" stroke="${s.stroke}" stroke-width="1"/>
      <line x1="2" y1="34" x2="98" y2="34" stroke="${s.stroke}" stroke-width="1"/>
      <line x1="2" y1="46" x2="98" y2="46" stroke="${s.stroke}" stroke-width="1.5"/>
      <rect x="8" y="50" width="84" height="9" rx="1" fill="${s.dark}" stroke="${s.stroke}" stroke-width="1"/>
      <rect x="8" y="62" width="84" height="9" rx="1" fill="${s.dark}" stroke="${s.stroke}" stroke-width="1"/>
      <text x="50" y="20" text-anchor="middle" font-size="7" fill="${s.text}">shelves</text>
      <text x="50" y="58" text-anchor="middle" font-size="7" fill="${s.text}">drawers</text>
    </svg>`,
    top_drawers_hang: `<svg viewBox="0 0 100 80" style="width:100%;height:100%">
      <rect x="2" y="2" width="96" height="76" rx="3" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2"/>
      <rect x="8" y="6" width="84" height="9" rx="1" fill="${s.dark}" stroke="${s.stroke}" stroke-width="1"/>
      <rect x="8" y="18" width="84" height="9" rx="1" fill="${s.dark}" stroke="${s.stroke}" stroke-width="1"/>
      <line x1="2" y1="32" x2="98" y2="32" stroke="${s.stroke}" stroke-width="1.5"/>
      <text x="50" y="44" text-anchor="middle" font-size="7" fill="${s.text}">hanging rail</text>
      <line x1="2" y1="40" x2="98" y2="40" stroke="${s.stroke}" stroke-width="1"/>
      <line x1="14" y1="40" x2="14" y2="76" stroke="${s.stroke}" stroke-width="1" stroke-dasharray="2"/>
      <line x1="86" y1="40" x2="86" y2="76" stroke="${s.stroke}" stroke-width="1" stroke-dasharray="2"/>
      <text x="50" y="12" text-anchor="middle" font-size="7" fill="${s.text}">top drawers</text>
    </svg>`,
    full_shelves: `<svg viewBox="0 0 100 80" style="width:100%;height:100%">
      <rect x="2" y="2" width="96" height="76" rx="3" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2"/>
      <line x1="2" y1="18" x2="98" y2="18" stroke="${s.stroke}" stroke-width="1"/>
      <line x1="2" y1="32" x2="98" y2="32" stroke="${s.stroke}" stroke-width="1"/>
      <line x1="2" y1="46" x2="98" y2="46" stroke="${s.stroke}" stroke-width="1"/>
      <line x1="2" y1="60" x2="98" y2="60" stroke="${s.stroke}" stroke-width="1"/>
      <text x="50" y="40" text-anchor="middle" font-size="8" fill="${s.text}">full shelves</text>
    </svg>`,
    island_drawers: `<svg viewBox="0 0 100 80" style="width:100%;height:100%">
      <rect x="2" y="2" width="96" height="76" rx="3" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2"/>
      <line x1="2" y1="14" x2="35" y2="14" stroke="${s.stroke}" stroke-width="1.5"/>
      <line x1="65" y1="14" x2="98" y2="14" stroke="${s.stroke}" stroke-width="1.5"/>
      <line x1="14" y1="14" x2="14" y2="76" stroke="${s.stroke}" stroke-width="1" stroke-dasharray="2"/>
      <line x1="86" y1="14" x2="86" y2="76" stroke="${s.stroke}" stroke-width="1" stroke-dasharray="2"/>
      <rect x="30" y="28" width="40" height="42" rx="2" fill="${s.dark}" stroke="${s.stroke}" stroke-width="1.5"/>
      <line x1="30" y1="38" x2="70" y2="38" stroke="${s.stroke}" stroke-width="1"/>
      <line x1="30" y1="48" x2="70" y2="48" stroke="${s.stroke}" stroke-width="1"/>
      <line x1="30" y1="58" x2="70" y2="58" stroke="${s.stroke}" stroke-width="1"/>
      <text x="50" y="26" text-anchor="middle" font-size="7" fill="${s.text}">island</text>
    </svg>`,
    his_hers: `<svg viewBox="0 0 100 80" style="width:100%;height:100%">
      <rect x="2" y="2" width="96" height="76" rx="3" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2"/>
      <line x1="50" y1="2" x2="50" y2="78" stroke="${s.stroke}" stroke-width="2"/>
      <line x1="2" y1="14" x2="48" y2="14" stroke="${s.stroke}" stroke-width="1.5"/>
      <rect x="8" y="40" width="36" height="8" rx="1" fill="${s.dark}" stroke="${s.stroke}" stroke-width="1"/>
      <rect x="8" y="51" width="36" height="8" rx="1" fill="${s.dark}" stroke="${s.stroke}" stroke-width="1"/>
      <line x1="52" y1="14" x2="98" y2="14" stroke="${s.stroke}" stroke-width="1.5"/>
      <line x1="52" y1="44" x2="98" y2="44" stroke="${s.stroke}" stroke-width="1.5"/>
      <text x="25" y="36" text-anchor="middle" font-size="7" fill="${s.text}">His</text>
      <text x="75" y="36" text-anchor="middle" font-size="7" fill="${s.text}">Hers</text>
    </svg>`,
  };
  return svgs[key] || '';
}

function applyLayout(id, key) {
  const item = getItem(id);
  if (!item) return;
  item.layoutPreset = key;
  // Apply sensible defaults based on layout
  const presets = {
    hanging_only:     { rails:'Long Hang (Full Height)', shelves:2, drawers:'No Drawers' },
    double_hang:      { rails:'Double Hang', shelves:2, drawers:'No Drawers' },
    half_half:        { rails:'Half & Half', shelves:4, drawers:'No Drawers' },
    shelves_drawers:  { rails:'No Rails', shelves:6, drawers:'4 Drawers' },
    top_drawers_hang: { rails:'Long Hang (Full Height)', shelves:2, drawers:'2 Drawers' },
    full_shelves:     { rails:'No Rails', shelves:10, drawers:'No Drawers' },
    island_drawers:   { rails:'Long Hang (Full Height)', shelves:2, drawers:'Full Drawer Bank' },
    his_hers:         { rails:'Half & Half', shelves:4, drawers:'2 Drawers' },
  };
  const p = presets[key];
  if (p) { item.rails=p.rails; item.shelves=p.shelves; item.drawers=p.drawers; }
  // Re-render the layout grid to show selection
  const grid = document.getElementById('layout-grid-'+id);
  if (grid) grid.querySelectorAll('.layout-card').forEach(card => {
    const isSelected = card.getAttribute('onclick').includes("'"+key+"'");
    card.style.borderColor = isSelected ? 'var(--red)' : 'var(--border)';
    const label = card.querySelector('div:nth-child(2)');
    if (label) label.style.color = isSelected ? 'var(--red-light)' : 'var(--text)';
  });
  updateGrandTotal();
  toast('Layout applied: ' + key.replace(/_/g,' '));
}

function setFieldAndRender(id, field, val) {
  setField(id, field, val);
  // Re-render this item card so sliding/hinged label reflects change
  const item = getItem(id);
  if (!item) return;
  const idx = items.findIndex(i => i.id === id);
  const card = document.getElementById('item-card-'+id);
  if (card && idx >= 0) {
    const tab = item.activeTab;
    card.innerHTML = buildItemHTML(item, idx);
    // Restore sketch thumbnail
    const png = item.sketchPNG || (item.sketchHistory&&item.sketchHistory[0]&&item.sketchHistory[0].data);
    if (png) {
      const thumb = document.getElementById('sketch-thumb-img-'+id);
      const preview = document.getElementById('sketch-preview-thumb-'+id);
      const empty = document.getElementById('sketch-empty-'+id);
      if (thumb) { thumb.src = png; thumb.style.display = 'block'; }
      if (preview) preview.style.display = 'block';
      if (empty) empty.style.display = 'none';
    }
    // Re-open correct tab
    switchTab(id, tab);
    // Reattach swatches colour
    if (item.colour) setColour(id, item.colour.code);
  }
  // Update sketch sliding flag
  if (field === 'type') {
    skState.isSliding = SLIDING_TYPES.includes(val);
    skRedraw();
  }
}

function setFieldAndPrice(id, field, val) {
  setField(id, field, val);
  if (document.getElementById('tab-price-'+id) && getItem(id)?.activeTab==='price') {
    buildPriceBreakdown(id);
  }
  updateGrandTotal();
}

function setField(id, field, val) {
  const item = getItem(id);
  if (!item) return;
  item[field] = val;
  // update toggle visuals
  const card = document.getElementById(`item-card-${id}`);
  if (card) {
    card.querySelectorAll('.toggle-opt').forEach(el => {
      const oc = el.getAttribute('onclick') || '';
      if (oc.includes(`'${field}'`)) {
        el.classList.toggle('selected', el.textContent.trim() === val);
      }
    });
  }
  refreshBadge(id);
  updateGrandTotal();
}

function setFieldOther(id, field, val, otherId) {
  const otherInput = document.getElementById(otherId);
  if (val === '__other__') {
    if (otherInput) { otherInput.style.display = 'block'; otherInput.focus(); }
    // clear the field so nothing is selected until they type
    const item = getItem(id);
    if (item) item[field] = '';
    // deselect all toggles in that group
    const card = document.getElementById(`item-card-${id}`);
    if (card) card.querySelectorAll('.toggle-opt').forEach(el => {
      const oc = el.getAttribute('onclick') || '';
      if (oc.includes(`'${field}'`)) el.classList.remove('selected');
    });
    // mark the Other button selected
    const tg = document.getElementById(`tg-${otherId}`);
    if (tg) { const last = tg.querySelector('.toggle-opt:last-child'); if (last) last.classList.add('selected'); }
    return;
  }
  if (otherInput) otherInput.style.display = 'none';
  setField(id, field, val);
}

function setColour(id, code) {
  document.querySelectorAll(`#swatches-${id} .swatch`).forEach(s => {
    const oc = s.getAttribute('onclick') || '';
    s.classList.toggle('selected', oc.includes(`'${code}'`));
  });
}

function toggleAddon(id, val) {
  const item = getItem(id);
  if (!item) return;
  if (item.addons.includes(val)) item.addons = item.addons.filter(v => v !== val);
  else item.addons.push(val);
  document.querySelectorAll(`#addons-${id} .toggle-opt`).forEach(el => {
    el.classList.toggle('selected', item.addons.includes(el.textContent.trim()));
  });
  refreshBadge(id);
  updateGrandTotal();
}

function changeUnits(id, d) {
  const item = getItem(id);
  if (!item) return;
  item.units = Math.max(1, Math.min(10, item.units + d));
  const el = document.getElementById(`units-${id}`);
  if (el) el.textContent = item.units;
  refreshBadge(id); updateGrandTotal();
}

function changeShelves(id, d) {
  const item = getItem(id);
  if (!item) return;
  item.shelves = Math.max(0, Math.min(20, item.shelves + d));
  const el = document.getElementById(`shelves-${id}`);
  if (el) el.textContent = item.shelves;
  updateGrandTotal();
}

function refreshBadge(id) {
  const item = getItem(id);
  const el = document.getElementById(`badge-${id}`);
  if (!item || !el) return;
  const base = calcItemPrice(item);
  const total = base + Math.round(base * 0.2);
  el.textContent = total > 0 ? `£${total.toLocaleString()} inc. VAT` : '';
  // update header title
  const card = document.getElementById(`item-card-${id}`);
  if (card) {
    const title = card.querySelector('.item-card-title');
    if (title) title.textContent = `Item ${items.findIndex(i=>i.id===id)+1} — ${item.room}`;
  }
}
