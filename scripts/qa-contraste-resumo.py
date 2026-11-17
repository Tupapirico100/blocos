#!/usr/bin/env python3
"""Agrega as medicoes de contraste em tabelas para o relatorio."""
import json
import collections
from pathlib import Path

D = Path("/workspace/blocos/docs/qa-cores")
files = ["contraste-todo.json"]
rows = []
for f in files:
    p = D / f
    if p.exists():
        rows += json.loads(p.read_text())
    else:
        print("faltando:", f)

print(f"total medicoes: {len(rows)}")

# ---------- 1. falhas por tema ----------
print("\n=== FALHAS por tema ===")
for t in ["Aurora", "Daylight", "Graphite"]:
    r = [x for x in rows if x["theme"] == t]
    f = [x for x in r if not x["pass"]]
    print(f"  {t:9s} medicoes={len(r):5d}  falhas={len(f):5d} ({100*len(f)/max(1,len(r)):.1f}%)")

# ---------- 2. pares semanticos ----------
def key_of(x):
    c = x.get("colorCss") or x.get("placeholderColorCss") or x.get("borderColorCss") or ""
    cls = x.get("cls", "")
    return (x["kind"], c, cls)

groups = collections.defaultdict(list)
for x in rows:
    groups[(x["theme"], key_of(x))].append(x)

# ---------- 3. resumo por cor de texto ----------
print("\n=== pior contraste por (tema, cor de texto) ===")
agg = collections.defaultdict(list)
for x in rows:
    c = x.get("colorCss") or ""
    if x["kind"] == "texto":
        agg[(x["theme"], c)].append(x)
for (t, c), lst in sorted(agg.items()):
    worst = min(lst, key=lambda z: z["ratio"])
    nfail = sum(1 for z in lst if not z["pass"])
    print(f"  {t:9s} {c:34s} n={len(lst):4d} falhas={nfail:4d} pior={worst['ratio']:6.2f} (min {worst['min']}) "
          f"ex: {worst['text'][:30]!r} bg={worst['bg']}")

# ---------- 4. kinds ----------
print("\n=== por tipo ===")
for k in sorted({x["kind"] for x in rows}):
    lst = [x for x in rows if x["kind"] == k]
    f = [x for x in lst if not x["pass"]]
    print(f"  {k:15s} n={len(lst):5d} falhas={len(f):4d} pior={min(x['ratio'] for x in lst):6.2f}")

# ---------- 5. amostra de falhas unicas ----------
print("\n=== amostra de falhas (texto) ===")
seen = set()
for x in sorted([r for r in rows if not r["pass"] and r["kind"] == "texto"], key=lambda z: z["ratio"]):
    sig = (x["theme"], x["colorCss"], x["text"][:30], x["bg"][0])
    if sig in seen:
        continue
    seen.add(sig)
    if len(seen) > 120:
        break
    print(f"  {x['theme']:9s} {x['ratio']:6.2f}/{x['min']} {x['block']:22s} {x['variant'][:12]:12s} {x['state'][:12]:12s} "
          f"{x['text'][:38]!r} cls={x['cls'][:60]}")
