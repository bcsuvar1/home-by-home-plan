// Home by Home plan scrolly for asset managers. Data comes from am_data.js (built by build_am_data.py).
const A = AM;
const MOBILE = matchMedia('(max-width:900px)').matches;
const TILE = 'https://api.maptiler.com/maps/positron/{z}/{x}/{y}.png?key=tDhHlbfxdvJqCNl4l8ZN';
const TILE_ATTR = '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const BAND_COL = ['#2E8B67', '#F2B33D', '#C95C3A'];          // green · amber · red
const BASE_COL = '#9AA5A0';
const CAT_COLS = ['#C95C3A','#7B4CA0','#2563EB','#B45309','#0891B2','#2E8B67','#B8B2AA','#D9D4CC'];
const EPC_COL = {A:'#00A651',B:'#4CB748',C:'#8DBB2E',D:'#E8B800',E:'#F7941D',F:'#ED1C24',G:'#9B1C1C'};
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => Math.round(n).toLocaleString();

function kpi(label, val, sub, col) {
  return `<div class="kpi" style="border-left-color:${col}"><div class="kpi-label">${label}</div>
    <div class="kpi-val" style="color:${col}">${val}</div><div class="kpi-sub">${sub}</div></div>`;
}

// ════════ Scenes 1–2: fragments, counter, engine, dashboard ════════

const FRAGS = [
  ['Repairs_2023-24.xlsx','#1D6F42'],['Repairs_export_FINAL.csv','#2B7CD3'],['EPC_certificates.pdf','#D93025'],
  ['Stock_condition_v7.xls','#1D6F42'],['Keystone_REP_dump.csv','#2B7CD3'],['TSM_survey_2025.xlsx','#1D6F42'],
  ['Damp_cases_log.xlsx','#1D6F42'],['Complaints_Q3.docx','#2B579A'],['Asset_register.mdb','#A4373A'],
  ['Survey_photos.zip','#7A7570'],['Gas_safety_2025.pdf','#D93025'],['FRA_actions.xlsx','#1D6F42'],
  ['Void_works.csv','#2B7CD3'],['Leaseholder_list.xlsx','#1D6F42'],['Capital_plan_draft.xlsx','#1D6F42'],
  ['Disrepair_claims.pdf','#D93025'],['HHSRS_inspections.docx','#2B579A'],['Contractor_invoices.csv','#2B7CD3'],
];

function seeded(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

function initFragments() {
  const rnd = seeded(7), host = $('fragments');
  const x0 = MOBILE ? 6 : 38, x1 = MOBILE ? 94 : 97;
  let html = FRAGS.map(([name, col], i) => {
    const x = x0 + rnd() * (x1 - x0), y = 7 + rnd() * 86;
    return `<div class="frag" style="--x:${x}%;--y:${y}%;--r:${(rnd() * 16 - 8).toFixed(1)}deg;--o:${(.45 + rnd() * .5).toFixed(2)};--d:${(i * .04).toFixed(2)}s;--t:${(4 + rnd() * 5).toFixed(1)}s;--c:${col}"><i></i>${name}</div>`;
  }).join('');
  for (let i = 0; i < (MOBILE ? 30 : 60); i++) {
    html += `<div class="frag dot" style="--x:${(rnd() * 100).toFixed(1)}%;--y:${(rnd() * 100).toFixed(1)}%;--r:0deg;--o:${(.2 + rnd() * .5).toFixed(2)};--d:${(rnd() * .6).toFixed(2)}s;--t:${(3 + rnd() * 6).toFixed(1)}s"></div>`;
  }
  host.innerHTML = html;
}

let counterTween;
function countTo(target, ms = 1400) {
  const el = $('counter-val'), from = +el.dataset.v || 0, t0 = performance.now();
  cancelAnimationFrame(counterTween);
  const step = t => {
    const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3), v = from + (target - from) * e;
    el.textContent = fmt(v); el.dataset.v = v;
    if (k < 1) counterTween = requestAnimationFrame(step);
  };
  counterTween = requestAnimationFrame(step);
}

function initDash() {
  const h = A.hook, m = A.map.counts;
  $('rise-pct').textContent = Math.round((h.repairs_fy[2] / h.repairs_fy[0] - 1) * 100) + '%';
  $('dash-kpis').innerHTML = kpi('Homes analysed', fmt(h.homes), 'one record per home', 'var(--green)') +
    kpi('Repairs categorised', fmt(h.repairs), '3 years, by AI + rules', 'var(--amber-dark)') +
    kpi('Below Decent Homes', h.pct_nd + '%', fmt(h.non_decent) + ' homes', '#C95C3A');
  const gs = A.estate.groups.slice(0, 6), mx = Math.max(...gs.map(g => g.n / g.h));
  $('dash-bars').innerHTML = gs.map(g => `<div style="display:flex;height:11px;border-radius:3px;overflow:hidden;margin-bottom:6px;width:${g.n / g.h / mx * 100}%">
    ${g.c.map((v, i) => `<div style="flex:${v};background:${CAT_COLS[i]}"></div>`).join('')}</div>`).join('');
  const tot = m[0] + m[1] + m[2];
  $('dash-prog').innerHTML = [['Short term', m[2], BAND_COL[2]], ['Medium term', m[1], BAND_COL[1]], ['Long term', m[0], BAND_COL[0]]]
    .map(([l, v, c]) => `<div style="display:grid;grid-template-columns:74px 1fr;align-items:center;gap:6px;font-size:10px;margin-bottom:7px">
      <span style="color:var(--text-muted)">${l}</span><div style="height:11px;border-radius:3px;background:${c};width:${Math.max(6, v / tot * 100)}%"></div></div>`).join('');
}

function setStageA(step) {
  const st = step === 'count' ? 'chaos' : step;
  $('stageA').dataset.state = st;
  const h = A.hook;
  if (step === 'chaos') { countTo(h.repairs_fy[0]); $('counter-sub').textContent = h.fys[0]; }
  if (step === 'count') {
    countTo(h.repairs_fy[2], 1800);
    $('counter-sub').innerHTML = `${h.fys[2]} · £${(h.cost / 1e6).toFixed(1)}m reactive spend over three years`;
  }
}

// ════════ Level 1: traffic-light map ════════

let amMap; const bandLayers = [[], [], []];
function initMap() {
  amMap = L.map('am-map', {preferCanvas: true, zoomControl: false, scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: false});
  L.tileLayer(TILE, {maxZoom: 20, tileSize: 512, zoomOffset: -1, attribution: TILE_ATTR}).addTo(amMap);
  amMap.setView(MOBILE ? [51.4835, 0.1] : [51.4835, 0.093], MOBILE ? 13 : 14);
  // Draw green first so amber and red sit on top
  [0, 1, 2].forEach(b => A.map.pts.filter(p => p[2] === b).forEach(p => {
    bandLayers[b].push(L.circleMarker([p[0], p[1]], {radius: 2.6, weight: 0, fillColor: BASE_COL, fillOpacity: .45, interactive: false}).addTo(amMap));
  }));
  const c = A.map.counts, tot = c[0] + c[1] + c[2];
  const row = (b, l, s) => `<div class="pl-row" data-b="${b}"><i style="background:${BAND_COL[b]}"></i><span>${l}<small>${s}</small></span><b>${fmt(c[b])}</b></div>`;
  $('prog-legend').innerHTML = `<div class="pl-title">Works programme</div>` +
    row(2, 'Short term', 'urgent works, years 1–2') + row(1, 'Medium term', 'years 3–5') + row(0, 'Long term', 'planned cycle, 5+ years') +
    `<div class="pl-bar">${[2, 1, 0].map(b => `<div data-b="${b}" style="flex-grow:0;background:${BAND_COL[b]}" data-g="${c[b] / tot}"></div>`).join('')}</div>`;
}
let mapLevel = -1;
function setMapLevel(level) {           // 0 = all grey · 1 = red · 2 = +amber · 3 = +green
  if (level === mapLevel) return;
  mapLevel = level;
  const shown = [level >= 3, level >= 2, level >= 1];
  [0, 1, 2].forEach(b => {
    const on = shown[b];
    bandLayers[b].forEach(m => { m.setStyle({fillColor: on ? BAND_COL[b] : BASE_COL, fillOpacity: on ? .85 : .35}); m.setRadius(on && b ? 3.2 : 2.6); });
    document.querySelectorAll(`.pl-row[data-b="${b}"]`).forEach(r => r.classList.toggle('on', on));
    document.querySelectorAll(`.pl-bar [data-b="${b}"]`).forEach(d => d.style.flexGrow = on ? d.dataset.g : 0);
  });
}

// ════════ Level 2: repair mix + Property Passport ════════

function initEstate() {
  const E = A.estate, groups = [...E.groups].sort((a, b) => b.n / b.h - a.n / a.h);
  const mx = Math.max(...groups.map(g => g.n / g.h));
  $('est-bars').innerHTML = groups.map((g, i) => `<div class="eb-row" data-i="${E.groups.indexOf(g)}">
      <div class="eb-name">${esc(g.ag)}</div>
      <div class="eb-bar" style="width:${g.n / g.h / mx * 100}%">${g.c.map((v, ci) => `<div data-w="${v / g.n * 100}" style="background:${CAT_COLS[ci]}" title="${E.cats[ci]}: ${(v / g.h).toFixed(1)} per home"></div>`).join('')}</div>
      <div class="eb-val">${(g.n / g.h).toFixed(1)}</div></div>`).join('');
  $('est-legend').innerHTML = E.cats.map((c, i) => `<span><i style="background:${CAT_COLS[i]}"></i>${c}</span>`).join('');
  document.querySelectorAll('.eb-row').forEach(r => {
    const pick = () => showPassport(+r.dataset.i);
    r.addEventListener('mouseenter', pick); r.addEventListener('click', pick);
  });
  showPassport(E.groups.indexOf(groups[0]), true);
}
function growBars() { document.querySelectorAll('#est-bars .eb-bar div').forEach(d => d.style.width = d.dataset.w + '%'); }

function risks(p) {
  const E = A.estate, avg = E.avg, poor = 'EFG'.includes(p.epc) && p.epc, dGrade = 'DEFG'.includes(p.epc) && p.epc;
  const damp = p.c[5] + p.leaks;
  // Component with the most repairs among roof, doors, windows, kitchen, bathroom; rated against the typical home
  const comp = [0, 1, 2, 3, 4].map(i => ({i, n: p.c[i], r: p.c[i] / Math.max(E.avg_cat[i], .01)})).sort((a, b) => b.n - a.n)[0];
  if (comp.n < 3) comp.r = Math.min(comp.r, 1.9);
  const ratio = p.n / avg;
  return [
    {name: 'Damp & mould', lvl: damp >= 8 || (damp >= 4 && dGrade) ? 'High' : damp >= 3 ? 'Medium' : 'Low',
     why: `${p.c[5]} damp & mould repairs + ${p.leaks} leak repairs${p.epc ? ` · EPC ${p.epc}` : ''}`, act: 'Damp & mould survey, ventilation and fabric review'},
    {name: 'Heat loss', lvl: poor ? 'High' : p.epc === 'D' ? 'Medium' : 'Low',
     why: p.epc ? `EPC ${p.epc}${p.sap ? ` (SAP ${Math.round(p.sap)})` : ''}` : 'No EPC on record', act: 'Fabric-first retrofit package'},
    {name: `${E.cats[comp.i]} failure`, lvl: comp.r >= 4 ? 'High' : comp.r >= 2 ? 'Medium' : 'Low',
     why: `${p.c[comp.i]} ${E.cats[comp.i].toLowerCase()} repairs · ${comp.r.toFixed(1)}× the typical home`, act: `${E.cats[comp.i]} replacement in the next programme`},
    {name: 'Repair intensity', lvl: ratio >= 3 ? 'High' : ratio >= 1.5 ? 'Medium' : 'Low',
     why: `${p.n} repairs in 3 years · ${ratio.toFixed(1)}× the borough average`, act: 'Root-cause inspection before the next callout'},
  ];
}

let ppIndex = -1;
function showPassport(i, quiet) {
  if (i === ppIndex) return;
  ppIndex = i;
  const g = A.estate.groups[i], p = g.passport, rs = risks(p);
  document.querySelectorAll('.eb-row').forEach(r => r.classList.toggle('sel', +r.dataset.i === i));
  const top = rs.find(r => r.lvl === 'High') || rs.find(r => r.lvl === 'Medium');
  $('passport').innerHTML = `<div class="${quiet ? '' : 'pp-anim'}" style="display:flex;flex-direction:column;gap:10px">
    <div class="pp-head"><div><div class="pp-kicker">Property Passport</div><div class="pp-ref">${esc(p.ref)}</div><div class="pp-ag">${esc(g.ag)}</div></div>
      ${p.epc ? `<span class="epc" style="background:${EPC_COL[p.epc] || '#888'}">EPC ${p.epc}</span>` : ''}</div>
    <div class="pp-stats">
      <div class="pp-stat"><b>${p.n}</b><span>Repairs, 3 yrs</span></div>
      <div class="pp-stat"><b>£${fmt(p.cost)}</b><span>Repair spend</span></div>
      <div class="pp-stat"><b>${p.leaks}</b><span>Leak repairs</span></div>
    </div>
    <div>${rs.map(r => `<div class="risk"><span class="risk-name">${r.name}</span><span class="lvl-pill lvl-${r.lvl}">${r.lvl}</span><span class="risk-why">${esc(r.why)}</span></div>`).join('')}</div>
    ${top ? `<div class="pp-act" style="background:var(--green-pale);border-radius:8px;padding:8px 10px;font-size:11.5px;color:var(--green)"><b>Recommended:</b> ${esc(top.act)}</div>` : ''}
  </div>`;
}

// ════════ Level 3: evaluation ════════

function initEval() {
  const e = A.eval;
  $('eval-kpis').innerHTML =
    kpi('Works completed', fmt(e.completed), `of ${fmt(e.programme_homes)} in programme`, 'var(--green)') +
    kpi('Avg SAP uplift', '+' + e.sap_uplift, 'energy points per home', '#2563EB') +
    kpi('Repairs per home', `${e.before.toFixed(1)} → ${e.after.toFixed(1)}`, '12 months before → after', 'var(--amber-dark)') +
    kpi('Damp repairs', `${e.damp_before.toFixed(2)} → ${e.damp_after.toFixed(2)}`, 'per home, before → after', '#C95C3A');
  const improved = e.epc_moves[0], withEpc = e.epc_moves.reduce((s, v) => s + v, 0);
  const checks = [
    ['Reactive repairs halved', `${e.before.toFixed(1)} → ${e.after.toFixed(1)} per home per year · ${e.with_both} homes with data`],
    ['Damp & mould repairs halved', `${e.damp_before.toFixed(2)} → ${e.damp_after.toFixed(2)} per home`],
    ['Every home now EPC C or better', `${improved} of ${withEpc} moved up at least one band`],
    ["Awaab's Law & Decent Homes evidence", 'Damp hazards and failing components tracked to resolution'],
  ];
  $('checks').innerHTML = checks.map(([t, s]) => `<div class="check"><i>✓</i><div>${t}<small>${s}</small></div></div>`).join('');
  drawEvalChart();
}

// Illustrative profile: investment spikes at the works, reactive repair cost steps down and stays down
const EV = {W: 600, H: 260, L: 34, R: 12, T: 18, B: 30};
function evalPaths() {
  const n = 49, xs = i => EV.L + i / (n - 1) * (EV.W - EV.L - EV.R), y = v => EV.H - EV.B - v * (EV.H - EV.T - EV.B);
  const rnd = seeded(11), noise = Array.from({length: n}, () => rnd() - .5);
  const inv = [], rep = [];
  for (let i = 0; i < n; i++) {
    const t = i - 24;
    inv.push([xs(i), y(.04 + .86 * Math.exp(-((t - 1) ** 2) / 5))]);
    const base = t < 0 ? .62 + t * -.0025 : .62 * (.5 + .5 * Math.exp(-t / 3.5)) - .02;
    rep.push([xs(i), y(Math.max(.08, base + noise[i] * .09))]);
  }
  const d = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return {inv: d(inv), rep: d(rep), x0: xs(24), y};
}
function drawEvalChart() {
  const P = evalPaths(), svg = $('eval-svg');
  const grid = [0, .25, .5, .75, 1].map(v => `<line x1="${EV.L}" x2="${EV.W - EV.R}" y1="${P.y(v)}" y2="${P.y(v)}" stroke="#ECE8E1"/>`).join('');
  svg.innerHTML = `${grid}
    <rect x="${P.x0}" y="${EV.T}" width="${EV.W - EV.R - P.x0}" height="${EV.H - EV.T - EV.B}" fill="#E8F4EE" opacity="0" id="ev-after"/>
    <line x1="${P.x0}" x2="${P.x0}" y1="${EV.T}" y2="${EV.H - EV.B}" stroke="#035341" stroke-dasharray="4 4"/>
    <text x="${P.x0 + 6}" y="${EV.T + 12}" font-size="11" fill="#035341" font-family="DM Sans" font-weight="600">Works completed</text>
    <text x="${EV.L}" y="${EV.H - 8}" font-size="10" fill="#7A7570" font-family="DM Sans">2 years before</text>
    <text x="${EV.W - EV.R}" y="${EV.H - 8}" font-size="10" fill="#7A7570" font-family="DM Sans" text-anchor="end">2 years after</text>
    <path id="ev-rep" d="${P.rep}" fill="none" stroke="#C95C3A" stroke-width="2.5" stroke-linejoin="round"/>
    <path id="ev-inv" d="${P.inv}" fill="none" stroke="#035341" stroke-width="3" stroke-linejoin="round"/>`;
  ['ev-rep', 'ev-inv'].forEach(id => { const p = $(id), L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.dataset.l = L; });
}
function revealEval(f) {                  // f: 0…1 across the two evaluation steps
  ['ev-rep', 'ev-inv'].forEach(id => { const p = $(id); p.style.strokeDashoffset = p.dataset.l * (1 - Math.min(1, f * 1.15)); });
  $('ev-after').setAttribute('opacity', f > .55 ? .6 : 0);
  document.querySelectorAll('.check').forEach((c, i) => c.classList.toggle('on', f > .52 + i * .1));
}

// ════════ Scroll choreography ════════

const PANELS = {'map-base':'p-map','map-red':'p-map','map-amber':'p-map','map-green':'p-map', estate:'p-estate', passport:'p-estate', eval:'p-eval', 'eval-drop':'p-eval'};
const TABS = {'p-map':'Programme builder', 'p-estate':'Repairs analysis', 'p-eval':'Retrofit evaluation'};

function setStateB(step) {
  const pid = PANELS[step];
  document.querySelectorAll('#frameB .panel').forEach(p => p.classList.toggle('on', p.id === pid));
  $('tabB').textContent = TABS[pid];
  setTimeout(() => amMap && amMap.invalidateSize(), 60);
  const lv = {'map-base': 0, 'map-red': 1, 'map-amber': 2, 'map-green': 3}[step];
  if (lv != null) setMapLevel(lv);
  if (pid === 'p-estate') growBars();
  if (step === 'passport') { const rows = document.querySelectorAll('.eb-row'); showPassport(+rows[Math.min(1, rows.length - 1)].dataset.i); }
}

function initScroll() {
  const offset = MOBILE ? .85 : .6;
  const stepsA = document.querySelectorAll('#actA .step');
  scrollama().setup({step: stepsA, offset}).onStepEnter(({element}) => {
    stepsA.forEach(s => s.classList.toggle('is-active', s === element));
    setStageA(element.dataset.step);
  }).onStepExit(({index, direction}) => { if (index === 0 && direction === 'up') $('stageA').dataset.state = 'intro'; });
  const stepsB = document.querySelectorAll('#actB .step');
  scrollama().setup({step: stepsB, offset, progress: true})
    .onStepEnter(({element}) => {
      stepsB.forEach(s => s.classList.toggle('is-active', s === element));
      setStateB(element.dataset.step);
    })
    .onStepProgress(({element, progress}) => {
      if (element.dataset.step === 'eval') revealEval(progress * .55);
      if (element.dataset.step === 'eval-drop') revealEval(.55 + progress * .45);
    });
  setStateB('map-base');
}

// Google Calendar appointment schedule (Calendar → Create → Appointment schedule → Share → booking page link).
// It opens in its own tab: embedded, browsers' tracking protection blocks the cookies Google's booking step needs.
const BOOKING_URL = 'https://calendar.app.google/XcGjXbairqFgTYJh7';

function initBooking() {
  const subject = encodeURIComponent('Home by Home plan: demo request');
  const body = encodeURIComponent('Hello,\n\nI would like to book a demo of the Home by Home plan.\n\nOrganisation:\nSuggested times:\n\nThanks');
  const mail = `mailto:balazs.csuvar@dgcities.com?subject=${subject}&body=${body}`;
  $('booking-body').innerHTML = `<div class="booking-fallback">
    ${BOOKING_URL ? `<a class="book-btn" href="${esc(BOOKING_URL)}" target="_blank" rel="noopener">Choose a time →</a>
    <ul class="book-facts"><li>30 minutes</li></ul>
    <p>Prefer email? <a href="${mail}">Request a demo</a></p>`
    : `<a class="book-btn" href="${mail}">Request a demo</a><p>Send us a few times that suit you and we'll confirm a slot.</p>`}
  </div>`;
}

function initHealthPopup() {
  const pop = $('hpop'), quote = document.querySelector('.quote');
  let closed = false;
  try { closed = sessionStorage.getItem('hpop-closed') === '1'; } catch (e) {}
  if (!pop || !quote || closed) return;
  pop.hidden = false;
  new IntersectionObserver((es, o) => es.forEach(e => {
    if (e.isIntersecting) { pop.classList.add('show'); o.disconnect(); }
  }), {threshold: .6}).observe(quote);
  $('hpop-x').addEventListener('click', () => {
    pop.classList.remove('show');
    try { sessionStorage.setItem('hpop-closed', '1'); } catch (e) {}
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initFragments();
  initDash();
  initMap();
  initEstate();
  initEval();
  initBooking();
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); o.disconnect(); } }),
    {threshold: .25}).observe($('results'));
  initScroll();
  initHealthPopup();
  window.addEventListener('resize', () => amMap && amMap.invalidateSize());
});
