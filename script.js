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
  if (st === 'funnel' || st === 'dash') setTimeout(drawWires, 900);
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

// ════════ Control panel: existing systems → one record per home → the questions it answers ════════
// Figures from site_data.js (build_site_data.py, from the anonymised demo portal).
const S = typeof SITE !== 'undefined' ? SITE : null;
const gbp = v => v >= 1e6 ? '£' + (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? '£' + Math.round(v / 1e3) + 'k' : '£' + Math.round(v);
const CP_IN = [
  ['Housing management system', 'stock list, tenancies, voids'], ['Repairs system', 'every work order, home and block'],
  ['Asset management system', 'stock condition surveys'], ['Damp & mould cases', 'surveyor assessments, HHSRS'],
  ['National EPC register', 'energy certificates (open data)'], ['Cost schedules', 'unit costs and lifecycles'],
];
const CP_OUT = [
  ['Where to invest more effectively', 'A costed plan by year and home: Decent Homes first, then the work that saves most', 'Asset management · Finance'],
  ['What trends the data is pointing at', 'Repairs forecast by type and estate; damp and hazards before they return', 'Repairs · Damp & mould · Board'],
  ['How services can be delivered more impactfully', 'Fix first time, replace instead of patching, survey where the gaps are', 'Operations · Surveyors · Compliance'],
];
function initControl() {
  if (!$('cpanel')) return;
  $('cp-in').innerHTML = CP_IN.map(([n, s]) => `<div class="cp-src"><b>${n}</b><span>${s}</span></div>`).join('');
  const h = S ? S.hub : null;
  $('cp-hub').innerHTML = `<div class="cp-hub-k">Home by Home</div><div class="cp-hub-n">${h ? fmt(h.homes) : ''}</div><div class="cp-hub-s">homes, one joined record each</div>
    ${h ? `<div class="cp-hub-l"><b>${fmt(h.work_orders)}</b> work orders · <b>${fmt(h.repairs)}</b> repairs</div>` : ''}
    <div class="cp-hub-l">checked · linked · kept up to date</div>`;
  $('cp-out').innerHTML = CP_OUT.map(([q, a, t]) => `<div class="cp-q"><b>${q}</b><span>${a}</span><small>${t}</small></div>`).join('');
}
function drawWires() {
  const p = $('cpanel'), svg = $('cp-wires'), hub = $('cp-hub');
  if (!p || !hub || p.offsetWidth === 0) return;
  const o = p.getBoundingClientRect(), hb = hub.getBoundingClientRect();
  const cur = (x1, y1, x2, y2) => { const m = (x1 + x2) / 2; return `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`; };
  let d = '';
  p.querySelectorAll('.cp-src').forEach((e, i, a) => { const r = e.getBoundingClientRect();
    d += `<path d="${cur(r.right - o.left, r.top + r.height / 2 - o.top, hb.left - o.left, hb.top + hb.height * (.2 + .6 * i / Math.max(a.length - 1, 1)) - o.top)}"/>`; });
  p.querySelectorAll('.cp-q').forEach((e, i, a) => { const r = e.getBoundingClientRect();
    d += `<path class="out" d="${cur(hb.right - o.left, hb.top + hb.height * (.25 + .5 * i / Math.max(a.length - 1, 1)) - o.top, r.left - o.left, r.top + r.height / 2 - o.top)}"/>`; });
  svg.setAttribute('viewBox', `0 0 ${o.width} ${o.height}`); svg.innerHTML = d;
}

// ════════ Level 1 (end): the investment plan ════════
function initPlan() {
  if (!S || !$('plan-bars')) return;
  const P = S.plan, cols = Object.fromEntries(P.groups), mx = Math.max(...P.years.map(y => Math.max(y.spent, y.due)));
  $('plan-budget').textContent = `${gbp(P.budget)} a year · ${P.years.length} years`;
  $('plan-bars').innerHTML = `<div class="pb">${P.years.map(y => `<div class="pb-col" title="${y.fy}: ${gbp(y.spent)} spent · ${gbp(y.due)} of work due">
      <div class="pb-due" style="bottom:${y.due / mx * 100}%"></div>
      <div class="pb-stack" style="height:${y.spent / mx * 100}%">${P.groups.map(([g]) => y.by[g] ? `<div style="flex:${y.by[g]};background:${cols[g]}"></div>` : '').join('')}</div>
      <div class="pb-lab">${y.fy}</div></div>`).join('')}</div>`;
  $('plan-legend').innerHTML = P.groups.map(([g, c]) => `<span><i style="background:${c}"></i>${g}</span>`).join('') + `<span><i class="dash-i"></i>work falling due (incl. backlog)</span>`;
  const y0 = P.years[0], y4 = P.years[Math.min(4, P.years.length - 1)];
  $('hint-plan-years').textContent = `At ${gbp(P.budget)} a year: ${gbp(P.years.reduce((s, y) => s + y.spent, 0))} over ${P.years.length} years, ${fmt(y0.homes)} homes treated in ${y0.fy}, ${y4.decent_pct}% of homes decent by ${y4.fy}.`;
  drawSankey(P.flow_y0, `${P.years[0].fy}: ${gbp(P.years[0].spent)}`);
  const top = Object.entries(P.flow_y0).map(([k, g]) => [k, Object.values(g).reduce((s, v) => s + v, 0)]).sort((a, b) => b[1] - a[1]);
  const tot = top.reduce((s, x) => s + x[1], 0);
  $('hint-plan-flow').textContent = `In ${P.years[0].fy}: ${top.slice(0, 3).map(([k, v]) => `${k.toLowerCase()} ${Math.round(v / tot * 100)}%`).join(', ')}. After ${P.years.length} years the work avoids ${gbp(P.saving_after)} of repairs a year.`;
}
function drawSankey(flow, label) {
  const P = S.plan, W = 640, H = 300, nodeW = 12, cols = Object.fromEntries(P.groups), rc = Object.fromEntries(P.reasons);
  const L = Object.entries(flow).map(([k, g]) => [k, Object.values(g).reduce((s, v) => s + v, 0)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const Rt = {}; Object.values(flow).forEach(g => Object.entries(g).forEach(([k, v]) => Rt[k] = (Rt[k] || 0) + v));
  const R = P.groups.map(([g]) => [g, Rt[g] || 0]).filter(x => x[1] > 0);
  const tot = L.reduce((s, x) => s + x[1], 0), gap = 9;
  const sc = (H - 30 - gap * (Math.max(L.length, R.length) - 1)) / tot;
  const place = arr => { let y = 22; return Object.fromEntries(arr.map(([k, v]) => { const n = {y, h: Math.max(2, v * sc), v}; y += n.h + gap; return [k, n]; })); };
  const LN = place(L), RN = place(R), xL = 178, xR = W - 214;
  const lo = Object.fromEntries(L.map(([k]) => [k, LN[k].y])), ro = Object.fromEntries(R.map(([k]) => [k, RN[k].y]));
  let links = '';
  L.forEach(([k]) => R.forEach(([g]) => { const v = (flow[k] || {})[g]; if (!v) return; const h = v * sc, y1 = lo[k] + h / 2, y2 = ro[g] + h / 2;
    links += `<path d="M${xL + nodeW},${y1} C${(xL + xR) / 2},${y1} ${(xL + xR) / 2},${y2} ${xR},${y2}" stroke="${rc[k] || '#999'}" stroke-opacity=".28" stroke-width="${h}" fill="none"><title>${esc(k)} → ${esc(g)}: ${gbp(v)}</title></path>`;
    lo[k] += h; ro[g] += h; }));
  const lab = (x, y, a, name, sub) => `<text x="${x}" y="${y}" text-anchor="${a}" font-family="DM Sans" font-size="11.5" font-weight="600" fill="#1F2A27">${esc(name)}</text>
    <text x="${x}" y="${y + 13}" text-anchor="${a}" font-family="DM Sans" font-size="10" fill="#6B716E">${esc(sub)}</text>`;
  $('plan-svg').innerHTML = `<text x="${xL + nodeW}" y="12" font-family="DM Sans" font-size="10" fill="#6B716E" text-anchor="end" letter-spacing=".06em">WHY IT IS FUNDED</text>
    <text x="${xR}" y="12" font-family="DM Sans" font-size="10" fill="#6B716E" letter-spacing=".06em">WHAT IT BUYS</text>${links}
    ${L.map(([k, v]) => `<rect x="${xL}" y="${LN[k].y}" width="${nodeW}" height="${LN[k].h}" fill="${rc[k] || '#999'}"/>${lab(xL - 8, LN[k].y + LN[k].h / 2 - 2, 'end', k, `${gbp(v)} · ${Math.round(v / tot * 100)}%`)}`).join('')}
    ${(() => { let next = 0; return R.map(([g, v]) => { const o = P.outcome[g] || {};
      const ly = Math.max(RN[g].y + RN[g].h / 2 - 2, next); next = ly + 28;        // labels of small nodes kept apart
      return `<rect x="${xR}" y="${RN[g].y}" width="${nodeW}" height="${RN[g].h}" fill="${cols[g]}"/>${lab(xR + nodeW + 8, ly, 'start', `${g} · ${gbp(v)}`, o.saving ? `repairs avoided ${gbp(o.saving)} a year` : '')}`; }).join(''); })()}`;
  $('plan-flow-title').textContent = `Where the money goes, and what it buys · ${label}`;
}

// ════════ Level 2 (end): repair rates by component, and the savings capital works bring ════════
let ratesGroup = 0;
function initPrevent() {
  if (!S || !$('rates')) return;
  const sv = S.savings;
  $('savings').innerHTML = `<div class="sv-kpis">
      <div><b>${gbp(sv.value_total)}</b><span>a year of savings identified across the stock</span></div>
      <div><b>${gbp(sv.return_visits.cost)}</b><span>a year spent on return visits (${fmt(sv.return_visits.repairs)} repairs needed more than one)</span></div></div>
    <table class="sv-tbl"><tr><th>Replace instead of patching</th><th>Homes</th><th>Cost once</th><th>Repairs avoided</th></tr>
      ${sv.components.slice(0, 6).map(c => `<tr><td>${esc(c.target)}</td><td>${fmt(c.homes)}</td><td>${gbp(c.cost)}</td><td><b>${gbp(c.annual)}</b> a year</td></tr>`).join('')}</table>
    <div class="sv-note">Homes with ${sv.repeat_min}+ repairs to the same component, where a new one costs less than continuing to repair it. Once its work is done, the investment plan avoids ${gbp(sv.plan_saving_after)} of repairs a year.</div>`;
  renderRates();
  const g = S.rates.groups[0];
  $('hint-rates').textContent = g ? `${g.name}: ${g.per_home.toFixed(1)} repairs expected per home next year, against ${S.rates.council_per_home.toFixed(1)} across the council.` : '';
  $('hint-savings').textContent = `${gbp(sv.components.reduce((s, c) => s + c.annual, 0))} a year from ${fmt(sv.components.reduce((s, c) => s + c.homes, 0))} component replacements alone.`;
}
function renderRates() {
  const G = S.rates.groups, g = G[ratesGroup];
  if (!g) return;
  const mx = Math.max(...g.types.map(t => t[1]));
  $('rates').innerHTML = `<div class="rt-tabs">${G.map((x, i) => `<span class="${i === ratesGroup ? 'on' : ''}" onclick="ratesGroup=${i};renderRates()">${esc(x.name.split(' · ')[0])}</span>`).join('')}</div>
    <div class="rt-name">${esc(g.name)} · ${g.homes} homes · ${fmt(g.expected)} repairs expected</div>
    ${g.types.map(([t, v, r]) => `<div class="rt-row"><span>${esc(t)}</span><div class="rt-bar"><div style="width:${v / mx * 100}%;background:${r >= 1.5 ? '#C95C3A' : r >= 1 ? '#F2B33D' : '#2E8B67'}"></div></div>
      <b>${v.toFixed(1)}</b><em class="${r >= 1.5 ? 'hi' : ''}">${r.toFixed(1)}× council rate</em></div>`).join('')}`;
}

// ════════ Scroll choreography ════════

const PANELS = {'map-base':'p-map','map-red':'p-map','map-amber':'p-map','map-green':'p-map', 'plan-years':'p-plan', 'plan-flow':'p-plan',
                estate:'p-estate', passport:'p-estate', rates:'p-prevent', savings:'p-prevent', eval:'p-eval', 'eval-drop':'p-eval'};
const TABS = {'p-map':'Programme builder', 'p-plan':'Investment plan', 'p-estate':'Repairs analysis', 'p-prevent':'Repair forecast & value', 'p-eval':'Retrofit evaluation'};

function setStateB(step) {
  const pid = PANELS[step];
  document.querySelectorAll('#frameB .panel').forEach(p => p.classList.toggle('on', p.id === pid));
  $('tabB').textContent = TABS[pid];
  setTimeout(() => amMap && amMap.invalidateSize(), 60);
  const lv = {'map-base': 0, 'map-red': 1, 'map-amber': 2, 'map-green': 3}[step];
  if (lv != null) setMapLevel(lv);
  if (pid === 'p-estate') growBars();
  if (pid === 'p-plan') $('p-plan').dataset.view = step;
  if (pid === 'p-prevent') $('p-prevent').dataset.view = step;
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

function initXlink() {
  const card = document.querySelector('.xlink');
  if (!card) return;
  if (!('IntersectionObserver' in window)) { card.classList.add('on'); return; }
  new IntersectionObserver((es, o) => es.forEach(e => {
    if (e.isIntersecting) { card.classList.add('on'); o.disconnect(); }
  }), {threshold: .3}).observe(card);
}

document.addEventListener('DOMContentLoaded', () => {
  initFragments();
  initDash();
  initMap();
  initEstate();
  initEval();
  initControl();
  initPlan();
  initPrevent();
  initBooking();
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); o.disconnect(); } }),
    {threshold: .25}).observe($('results'));
  initScroll();
  initXlink();
  window.addEventListener('resize', () => { amMap && amMap.invalidateSize(); drawWires(); });
});
