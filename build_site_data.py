"""Extract the figures for the new website scenes into site_data.js.

Source: the anonymised demo portal (Pipeline/Output/HbH_Portal_demo.html, made by `python run.py demo`). The page is
opened in headless Chrome and the portal's own code runs: the Investment Plan scheduler at its default budget, the
Repair Forecast tables and the Value for Money figures. Only totals leave this script — by year, type of work, reason,
repair type and anonymised asset group — so the site shows the same numbers as the portal and nothing at home level.

    python build_site_data.py [path to the demo portal]
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

DEMO = Path(r"G:\Shared drives\DG Cities\Projects\HomeByHomePlatform\HTML_Prototype\Pipeline\Output\HbH_Portal_demo.html")
OUT = Path(__file__).with_name("site_data.js")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

PROBE = r"""<script>
window.addEventListener('load', () => setTimeout(() => {
  let out;
  try {
    // ── Investment plan at the default budget (the scheduler the Investment Plan page uses) ──
    initInvest();
    const D = INV.D, Y = invRes.years;
    const groups = INV_GROUPS.map(g => [g, INV_COL[g]]);
    const years = Y.map(y => ({fy: `${y.cal}/${String(y.cal + 1).slice(2)}`, budget: Math.round(y.budget), spent: Math.round(y.spent),
                               due: Math.round(y.dueCost), by: Object.fromEntries(INV_GROUPS.map(g => [g, Math.round(y.byGroup[g] || 0)])),
                               homes: y.homes, decent_pct: +y.decentPct.toFixed(1), saving: Math.round(y.saving), co2: +y.co2.toFixed(1)}));
    const flowOf = ys => { const f = {};
      ys.forEach(y => Object.entries(y.flow).forEach(([w, g]) => Object.entries(g).forEach(([k, v]) => { (f[w] = f[w] || {})[k] = ((f[w] || {})[k] || 0) + v; })));
      Object.values(f).forEach(g => Object.keys(g).forEach(k => g[k] = Math.round(g[k]))); return f; };
    const last = Y[Y.length - 1];
    const plan = {first_year: D.first_year, budget: Math.round(invBudgets[0]), n_homes: invRes.nHomes, nd_total: invRes.ndTotal,
                  groups, reasons: INV_WHY, years, flow_y0: flowOf([Y[0]]), flow_all: flowOf(Y),
                  outcome: Object.fromEntries(INV_GROUPS.map(g => [g, {saving: Math.round(last.gOut[g].saving), co2: +last.gOut[g].co2.toFixed(1)}])),
                  saving_after: Math.round(last.saving), decent_y5: +Y[Math.min(4, Y.length - 1)].decentPct.toFixed(1)};

    // ── Repair rates by type: the asset groups with most repairs expected per home, against the council rate ──
    const F = FORECAST_DATA, T = F.targets, nh = F.n_homes || F.homes.length;
    const types = Object.keys(T).filter(t => t !== 'Any repair');
    const rate = t => T[t].expected / nh;
    const anyAg = T['Any repair'].ag.filter(r => r[1] >= 30).sort((a, b) => b[2] / b[1] - a[2] / a[1]).slice(0, 3);
    const rates = {council_per_home: +(T['Any repair'].expected / nh).toFixed(2), period: F.meta.period_label,
      groups: anyAg.map(r => ({name: F.ags[r[0]], homes: r[1], per_home: +(r[2] / r[1]).toFixed(2), expected: Math.round(r[2]),
        types: types.map(t => { const x = T[t].ag.find(a => a[0] === r[0]); return x ? [t, +x[2].toFixed(1), +((x[2] / x[1]) / rate(t)).toFixed(2)] : null; })
                    .filter(Boolean).sort((a, b) => b[1] - a[1]).slice(0, 6)}))};

    // ── Savings: replace instead of patch, return visits, and what the plan avoids ──
    const V = VALUE_DATA, R = V.replace || {components: []};
    const savings = {components: R.components.map(c => ({target: c.target, homes: c.replace, cost: Math.round(c.replace_cost),
                       annual: Math.round(c.replace_annual), avoided: Math.round(c.replace_avoided), repeat_homes: c.repeat_homes}))
                       .filter(c => c.homes).sort((a, b) => b.annual - a.annual),
                     repeat_min: R.repeat_min, return_visits: {cost: Math.round(V.return_visits.extra_cost), repairs: V.return_visits.multi_visit_repairs,
                       all: V.return_visits.repairs, period: V.return_visits.period},
                     value_total: Math.round(ceoValueTotal()), plan_saving_after: plan.saving_after};

    // ── Control panel figures ──
    const sc = SC_DATA.kpis;
    const hub = {homes: DATA.reduce((s, r) => s + (r.total || 0), 0), work_orders: V.work_orders_total, repairs: V.repairs_total,
                 survey_current_pct: Math.round(sc.Current / sc.in_scope * 100), period: META.period_label, asset_groups: DATA.length};
    out = {plan, rates, savings, hub, built: META.built};
  } catch (e) { out = {error: String(e && e.stack || e)}; }
  const pre = document.createElement('pre'); pre.id = '__site'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 3000));
</script>"""


def main(demo=DEMO):
    demo = Path(demo)
    tmp = Path(tempfile.gettempdir()) / "hbh_site_probe.html"
    tmp.write_text(demo.read_text(encoding="utf-8").replace("</body>", PROBE + "</body>"), encoding="utf-8")
    dom = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--virtual-time-budget=120000", "--dump-dom", tmp.as_uri()],
                         capture_output=True, text=True, encoding="utf-8", timeout=900).stdout
    m = re.search(r'<pre id="__site">(.*?)</pre>', dom, re.S)
    if not m:
        sys.exit("No output from the demo portal")
    data = json.loads(m.group(1).replace("&quot;", '"').replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&"))
    if "error" in data:
        sys.exit("The demo portal failed: " + data["error"])
    # anonymised group labels read better as estates on the website
    for g in data["rates"]["groups"]:
        g["name"] = re.sub(r"^Group 0*(\d+)", r"Estate \1", g["name"])
    OUT.write_text("// Generated by build_site_data.py from the anonymised demo portal - do not edit by hand\nconst SITE = "
                   + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")
    p = data["plan"]
    print(f"site_data.js: plan {len(p['years'])} years at £{p['budget'] / 1e6:.0f}M a year · rates for {len(data['rates']['groups'])} groups · "
          f"{len(data['savings']['components'])} replace-vs-patch components → {OUT}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else DEMO)
