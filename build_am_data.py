"""Extract the data for the asset management scrolly into am_data.js.

Sources: the Home by Home portal build (HbH_Portal.html) and the retrofit
evaluation portal (Retrofit_Eval_Portal.html). Nothing at address level leaves
this script: asset groups become "Greenwich Estate N", homes are referred to
by an anonymous reference, and map points sit on their block's location with a
small offset rather than at the exact address.

    python build_am_data.py
"""
import hashlib
import json
import math
import random
import re
from collections import Counter, defaultdict
from pathlib import Path

PORTAL_DIR = Path(r"G:\Shared drives\DG Cities\Projects\HomeByHomePlatform\HTML_Prototype\Portal")
OUT = Path(__file__).with_name("am_data.js")
POSTCODE = re.compile(r"\b[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}\b", re.I)


def grab(path, name):
    """Parse the JSON literal assigned to `const <name> =` (the longest such line)."""
    lines = [l for l in path.read_text(encoding="utf-8").splitlines() if re.match(rf"\s*const {name}\s*=", l)]
    body = max(lines, key=len).split("=", 1)[1].strip().rstrip(";")
    return json.loads(re.sub(r"^/\*.*?\*/", "", body))


def key(uprn):
    return str(uprn or "").lstrip("0")


def jitter(uprn, n):
    """Deterministic offset around the block point so homes in one block spread out a little."""
    h = int(hashlib.md5(str(uprn).encode()).hexdigest()[:8], 16)
    ang, rad = (h % 3600) / 3600 * 2 * math.pi, 0.00008 + 0.00003 * math.sqrt(n) * ((h >> 12) % 100) / 100
    return math.sin(ang) * rad, math.cos(ang) * rad * 1.6


def band(epc, repairs, avg):
    """Traffic light from EPC and repair frequency: red needs both to be poor."""
    e = 2 if epc in ("E", "F", "G") else 1 if epc == "D" else 0
    r = 2 if repairs >= 2 * avg else 1 if repairs >= avg else 0
    s = e + r
    return 2 if s >= 3 else 1 if s == 2 else 0          # 2 red · 1 amber · 0 green


def main():
    hbh = PORTAL_DIR / "HbH_Portal.html"
    data = grab(hbh, "DATA")
    rp = grab(hbh, "REPAIRS_DATA")
    retro = grab(hbh, "RETROFIT_DATA")["prop_lookup"]
    blocks = grab(hbh, "BLOCK_DATA")
    dh = grab(hbh, "DECENT_HOMES")["summary"]
    ev = grab(PORTAL_DIR / "Retrofit_Eval_Portal.html", "EVAL")

    # Anonymous asset group names, consistent with the health scrolly's approach
    real = sorted({r["Asset Group"] for r in data if r.get("Asset Group") not in (None, "0")} | {a["ag"] for a in rp["ags"]})
    random.Random(2026).shuffle(real)
    alias = {n: f"Greenwich Estate {i}" for i, n in enumerate(real, 1)}

    # Per-home facts keyed by UPRN
    epc = {key(p["uprn"]): p for ps in retro.values() for p in ps}
    reps = {}
    nc = len(rp["cats"])
    for a in rp["ags"]:
        for p in a["p"]:
            reps[key(p[0])] = {"n": p[2], "c": p[3:3 + nc], "cost": p[3 + nc], "s": p[5 + nc], "ag": a["ag"]}
    avg = rp["borough"]["per_home"]

    # ── Scene 1: the squeeze
    fy = [sum(a["fy"][i] for a in rp["ags"]) for i in range(len(rp["fys"]))]
    hook = {"fys": rp["fys"], "repairs_fy": fy, "cost": rp["borough"]["cost"], "homes": rp["borough"]["homes"],
            "repairs": rp["borough"]["repairs"], "non_decent": dh["non_decent"], "pct_nd": dh["pct_nd"],
            "damp_homes": sum(1 for p in epc.values() if (p.get("damp") or 0) > 0)}

    # ── Scene 3: traffic-light map — homes on their block point, offset slightly
    pts, counts = [], Counter()
    for b in blocks["blocks"]:
        if b.get("lat") is None:
            continue
        props = blocks["block_props"].get(b["block"], [])
        for p in props:
            k = key(p["uprn"])
            e = (epc.get(k) or {}).get("epc") or ""
            n = (reps.get(k) or {}).get("n", 0)
            bd = band(e, n, avg)
            counts[bd] += 1
            dy, dx = jitter(k, len(props))
            pts.append([round(b["lat"] + dy, 5), round(b["lon"] + dx, 5), bd])

    # ── Scene 4: one estate, its asset groups' repair mix, and a passport per group
    by_estate = defaultdict(list)
    for r in data:
        if r.get("Asset Group") in alias and r.get("estate"):
            by_estate[r["estate"]].append(r["Asset Group"])
    rp_by_ag = {a["ag"]: a for a in rp["ags"]}

    def estate_score(ags):
        rows = [rp_by_ag[a] for a in ags if a in rp_by_ag and rp_by_ag[a]["h"] >= 15]
        return (len(rows) >= 6, sum(r["n"] for r in rows) / max(sum(r["h"] for r in rows), 1)) if rows else (False, 0)
    est = max(by_estate, key=lambda e: estate_score(by_estate[e]))
    groups = sorted((rp_by_ag[a] for a in by_estate[est] if a in rp_by_ag and rp_by_ag[a]["h"] >= 15),
                    key=lambda a: -a["n"] / a["h"])[:8]

    def passport(ag):
        homes = [(k, v) for k, v in reps.items() if v["ag"] == ag["ag"]]
        k, v = max(homes, key=lambda kv: kv[1]["n"])
        e = epc.get(k) or {}
        leaks = re.search(r"(\d+) leaks?", v["s"] or "")
        s = " ".join(x for x in re.split(r"(?<=\.)\s+", v["s"] or "") if not POSTCODE.search(x))
        return {"ref": "Home " + hashlib.md5(k.encode()).hexdigest()[:5].upper(), "n": v["n"], "c": v["c"],
                "cost": round(v["cost"]), "epc": e.get("epc") or "", "sap": e.get("sap"),
                "damp": e.get("damp") or 0, "damp_rag": e.get("damp_rag") or "", "leaks": int(leaks.group(1)) if leaks else 0, "s": s}

    estate = {"cats": rp["cats"], "avg_cat": rp["borough"]["cat_per_home"], "avg": avg,
              "groups": [{"ag": alias[g["ag"]], "h": g["h"], "n": g["n"], "c": g["c"], "cost": g["cost"],
                          "passport": passport(g)} for g in groups]}

    # ── Scene 5: evaluation headlines, as on the retrofit evaluation portal's overview page
    props = ev["properties"]
    both = [p for p in props if p.get("has_before_data") and p.get("has_after_data")]
    grades = "ABCDEFG"
    with_epc = [p for p in props if p.get("epc_pre") in grades and p.get("epc_post") in grades]
    s = ev["summary"]
    evaluation = {"programme_homes": s["total"], "completed": s["completed"], "with_both": len(both),
                  "before": s["avg_before_repairs"], "after": s["avg_after_repairs"],
                  "damp_before": s["avg_damp_before"], "damp_after": s["avg_damp_after"], "sap_uplift": s["avg_sap_uplift"],
                  "repairs": [sum(p["repair_change"] < 0 for p in both), sum(p["repair_change"] == 0 for p in both),
                              sum(p["repair_change"] > 0 for p in both)],
                  "epc_pre": [sum(p["epc_pre"] == g for p in with_epc) for g in grades],
                  "epc_post": [sum(p["epc_post"] == g for p in with_epc) for g in grades],
                  "epc_moves": [sum(grades.index(p["epc_post"]) < grades.index(p["epc_pre"]) for p in with_epc),
                                sum(p["epc_post"] == p["epc_pre"] for p in with_epc),
                                sum(grades.index(p["epc_post"]) > grades.index(p["epc_pre"]) for p in with_epc)],
                  "measures": Counter(x for p in props if p.get("status") == "Completed" for x in (p.get("measures") or [])).most_common(6)}

    out = {"hook": hook, "map": {"pts": pts, "counts": [counts[0], counts[1], counts[2]], "avg": avg},
           "estate": estate, "eval": evaluation}
    text = json.dumps(out, separators=(",", ":"))
    assert not POSTCODE.search(text), "postcode left in output"
    OUT.write_text("// Generated by build_am_data.py — do not edit by hand\nconst AM = " + text + ";\n", encoding="utf-8")
    print(f"Wrote {OUT.name}: {OUT.stat().st_size/1e6:.2f} MB · {len(pts)} homes on map "
          f"(green {counts[0]}, amber {counts[1]}, red {counts[2]}) · estate groups {len(groups)}")
    print("hook", hook)
    print("eval", evaluation)
    print("estate", [(g["ag"], g["h"], g["n"], g["passport"]["ref"], g["passport"]["n"]) for g in estate["groups"]])


if __name__ == "__main__":
    main()
