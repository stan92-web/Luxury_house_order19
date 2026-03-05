// ==============================================================
// DATA — Rates, Types, Board Colours, Door Gallery, Extra Prices
// ==============================================================

const RATE_SLIDING = 1100;  // £ per metre WIDTH
const RATE_HINGED = 950;    // £ per metre WIDTH
const RATE_NON = 950;       // alias
const SLIDING_TYPES = ['Sliding Door Fitted','Sliding Door Walk-In'];
const HINGED_TYPES  = ['Hinged Door Fitted','Walk-In Wardrobe','Alcove Wardrobe','Corner Wardrobe'];

const boardColours = [
  {code:'W1000',name:'Alpine White',brand:'Egger',hex:'#f8f8f8'},
  {code:'W1100',name:'Cream',brand:'Egger',hex:'#f5f0e0'},
  {code:'W980',name:'Pure White',brand:'Kronospan',hex:'#fefefe'},
  {code:'U374',name:'Magnolia',brand:'Egger',hex:'#f0ead6'},
  {code:'U708',name:'Light Grey',brand:'Egger',hex:'#c8c8c8'},
  {code:'U732',name:'Dust Grey',brand:'Egger',hex:'#a8a8a0'},
  {code:'U741',name:'Pebble Grey',brand:'Egger',hex:'#909090'},
  {code:'U960',name:'Anthracite',brand:'Egger',hex:'#3c3c3c'},
  {code:'U999',name:'Black',brand:'Egger',hex:'#111111'},
  {code:'U560',name:'Steel Blue',brand:'Egger',hex:'#4a6fa5'},
  {code:'U104',name:'Navy Blue',brand:'Egger',hex:'#1a2a4a'},
  {code:'U612',name:'Sage Green',brand:'Egger',hex:'#7a9e7e'},
  {code:'U130',name:'Forest Green',brand:'Egger',hex:'#2d5016'},
  {code:'U444',name:'Sand Beige',brand:'Egger',hex:'#d4b896'},
  {code:'U702',name:'Stone',brand:'Egger',hex:'#c0b09a'},
  {code:'H1180',name:'Natural Oak',brand:'Egger',hex:'#c8a87a'},
  {code:'H3431',name:'Light Walnut',brand:'Egger',hex:'#9c7a5a'},
  {code:'H3734',name:'Dark Walnut',brand:'Egger',hex:'#5c3d1e'},
  {code:'H1486',name:'Smoked Oak',brand:'Egger',hex:'#7a6248'},
  {code:'K017',name:'Davos Oak',brand:'Kronospan',hex:'#b8966a'},
  {code:'K002',name:'White Loft Oak',brand:'Kronospan',hex:'#ddd0b8'},
  {code:'U636',name:'Dusty Rose',brand:'Egger',hex:'#d4a0a0'},
  {code:'U140',name:'Mint',brand:'Egger',hex:'#a8d8b0'},
  {code:'K522',name:'Graphite',brand:'Kronospan',hex:'#555555'},
];

// ══════════════════════════════════════════════
// PRICING
// ══════════════════════════════════════════════
// Extra price table — keyed by addon name
// Hinged door styles — grouped by style type
// Images load from browns2000.co.uk when online; fallback bg colour shown offline
const DOOR_STYLE_GALLERY = [
  // ─── SHAKER ────────────────────────────────────────────
  {group:'Shaker', popular:true,  name:'Hampton — Ultra Matt Graphite',   bg:'#4a4a4a', img:'https://www.browns2000.co.uk/_assets/media/showroom/1158.jpg?v26012025', sub:'Ultra Matt · Dark Graphite'},
  {group:'Shaker', popular:true,  name:'Hampton — Ultra Matt Mussel',     bg:'#c0a882', img:'https://www.browns2000.co.uk/_assets/media/showroom/96.jpg?v26012025',   sub:'Ultra Matt · Warm Mussel'},
  {group:'Shaker', popular:false, name:'Bamburgh — Ultra Matt White',     bg:'#f5f5f5', img:'https://www.browns2000.co.uk/_assets/media/showroom/1146.jpg?v26012025', sub:'Ultra Matt · Bright White'},
  {group:'Shaker', popular:false, name:'Glendale — Ultra Matt Pale Cream',bg:'#f0ece0', img:'https://www.browns2000.co.uk/_assets/media/showroom/97.jpg?v26012025',  sub:'Ultra Matt · Pale Cream'},
  {group:'Shaker', popular:false, name:'Turnberry — Ultra Matt Cashmere', bg:'#d4b896', img:'https://www.browns2000.co.uk/_assets/media/showroom/1157.jpg?v26012025', sub:'Ultra Matt · Cashmere'},
  {group:'Shaker', popular:false, name:'Chester — White Oak',             bg:'#ddd0b8', img:'https://www.browns2000.co.uk/_assets/media/showroom/101.jpg?v26012025',  sub:'Traditional · White Oak'},
  // ─── SLAB / HANDLELESS ─────────────────────────────────
  {group:'Slab / Handleless', popular:false, name:'Glacier — High Gloss White',      bg:'#f8f8f8', img:'https://www.browns2000.co.uk/_assets/media/showroom/88.jpg?v26012025',   sub:'High Gloss · White'},
  {group:'Slab / Handleless', popular:false, name:'Glacier — High Gloss Cashmere',   bg:'#e8dcc8', img:'https://www.browns2000.co.uk/_assets/media/showroom/87.jpg?v26012025',   sub:'High Gloss · Cashmere'},
  {group:'Slab / Handleless', popular:false, name:'Glacier — Super Matt Light Grey', bg:'#c0c0c0', img:'https://www.browns2000.co.uk/_assets/media/showroom/92.jpg?v26012025',   sub:'Super Matt · Light Grey'},
  {group:'Slab / Handleless', popular:false, name:'Glacier — Super Matt Black',      bg:'#1a1a1a', img:'https://www.browns2000.co.uk/_assets/media/showroom/1145.jpg?v26012025', sub:'Super Matt · Black'},
  {group:'Slab / Handleless', popular:false, name:'Glacier — Super Matt Graphite',   bg:'#3c3c3c', img:'https://www.browns2000.co.uk/_assets/media/showroom/94.jpg?v26012025',   sub:'Super Matt · Graphite'},
  {group:'Slab / Handleless', popular:false, name:'Monaco — Light Concrete',         bg:'#c0bcb4', img:'https://www.browns2000.co.uk/_assets/media/showroom/1130.jpg?v26012025', sub:'Concrete Texture'},
  // ─── WOODGRAIN / OAK ───────────────────────────────────
  {group:'Woodgrain / Oak', popular:false, name:'Matfen — Light Grey Oak',       bg:'#b8b4a8', img:'https://www.browns2000.co.uk/_assets/media/showroom/95.jpg?v26012025',   sub:'Light Grey Oak & Graphite Oak'},
  {group:'Woodgrain / Oak', popular:false, name:'Matfen — Parisian Blue Oak',    bg:'#6080a0', img:'https://www.browns2000.co.uk/_assets/media/showroom/1148.jpg?v26012025', sub:'Parisian Blue Oak'},
  {group:'Woodgrain / Oak', popular:false, name:'Matfen — Dust Grey Oak',        bg:'#909090', img:'https://www.browns2000.co.uk/_assets/media/showroom/126.jpg?v26012025',  sub:'Dust Grey & Light Grey Oak'},
  {group:'Woodgrain / Oak', popular:false, name:'Portree — White Oak',           bg:'#e0d0b8', img:'https://www.browns2000.co.uk/_assets/media/showroom/1143.jpg?v26012025', sub:'Panelled · White Oak'},
  // ─── ROUTED / SCULPTED ─────────────────────────────────
  {group:'Routed / Sculpted', popular:false, name:'Scoop — Ultra Matt Light Grey', bg:'#c0c0c0', img:'https://www.browns2000.co.uk/_assets/media/showroom/105.jpg?v26012025',  sub:'Curved Routed Profile'},
  {group:'Routed / Sculpted', popular:false, name:'Eclipse — Ultra Matt White',    bg:'#f0f0f0', img:'https://www.browns2000.co.uk/_assets/media/showroom/103.jpg?v26012025',  sub:'Sculpted Profile · White'},
  {group:'Routed / Sculpted', popular:false, name:'Alnwick — Ultra Matt White Grey',bg:'#dcdcd0',img:'https://www.browns2000.co.uk/_assets/media/showroom/1132.jpg?v26012025', sub:'Grooved Panel'},
  // ─── FRAMED / MIRROR / GLASS ───────────────────────────
  {group:'Framed / Mirror / Glass', popular:false, name:'Mirror Panel — Full',         bg:'linear-gradient(135deg,#e8e8e8 0%,#aaa 40%,#e8e8e8 60%,#bbb 100%)', img:'', sub:'Full mirror door — framed or frameless', icon:'🪞'},
  {group:'Framed / Mirror / Glass', popular:false, name:'Mirror Panel — Part',         bg:'linear-gradient(135deg,#d8d8d8 0%,#999 40%,#d8d8d8 100%)',           img:'', sub:'Part mirror insert in frame',             icon:'🪞'},
  {group:'Framed / Mirror / Glass', popular:false, name:'Glass Panel — Clear Framed',  bg:'linear-gradient(135deg,#d4eaf8 0%,#88c0e0 50%,#d4eaf8 100%)',        img:'', sub:'Clear glass in aluminium frame',           icon:'🔲'},
  {group:'Framed / Mirror / Glass', popular:false, name:'Glass Panel — Frosted Framed',bg:'linear-gradient(135deg,#e8e8e8 0%,#d0d0d0 50%,#e8e8e8 100%)',        img:'', sub:'Frosted glass in frame',                   icon:'🔲'},
];

const EXTRA_PRICES = {
  'LED Lighting': 320,
  'Shoe Racks': 180,
  'Trouser Rack': 140,
  'Tie/Belt Rack': 95,
  'Pull-Out Mirror': 220,
  'Soft-Close Runners': 85,
  'Laundry Basket': 160,
  'Safe': 380,
  'Pull-Down Rail': 195,
  'Valet Rod': 65,
  'Jewellery Insert': 145,
  'Glass Shelves (set of 4)': 240,
  'Mirror Back Panel': 310,
};
