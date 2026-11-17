#!/usr/bin/env python3
"""Monta a tabela de pares de cor (tema | par | contraste medido | minimo | aprovado)."""
import json
import re
from pathlib import Path

D = Path("/workspace/blocos/docs/qa-cores")
files = ["contraste-todo.json"]
rows = []
for f in files:
    p = D / f
    if p.exists():
        rows += json.loads(p.read_text())

THEMES = ["Aurora", "Daylight", "Graphite"]


def rgba(css):
    if not css:
        return None
    m = re.match(r"rgba?\(([^)]+)\)", css.strip())
    if not m:
        return None
    p = [float(x.strip()) for x in m.group(1).split(",")]
    return (p[0], p[1], p[2], p[3] if len(p) > 3 else 1.0)


def close(a, b, tol=6):
    return a and b and all(abs(a[i] - b[i]) <= tol for i in range(3))


def closea(a, b, tol=0.01):
    return a and b and all(abs(a[i] - b[i]) <= tol for i in range(4))


TOK = {
    "Aurora": {
        "text": (255, 255, 255, 0.94), "secondary": (255, 255, 255, 0.72),
        "muted": (255, 255, 255, 0.50), "faint": (255, 255, 255, 0.32),
        "accent": (10, 132, 255, 1), "accent_fg": (255, 255, 255, 1),
        "success": (48, 209, 88, 1), "warn": (255, 159, 10, 1),
        "danger": (255, 69, 58, 1), "info": (64, 200, 224, 1),
    },
    "Daylight": {
        "text": (29, 29, 31, 1), "secondary": (29, 29, 31, 0.78),
        "muted": (29, 29, 31, 0.52), "faint": (29, 29, 31, 0.34),
        "accent": (0, 113, 227, 1), "accent_fg": (255, 255, 255, 1),
        "success": (36, 138, 61, 1), "warn": (178, 80, 0, 1),
        "danger": (215, 0, 21, 1), "info": (0, 113, 227, 1),
    },
    "Graphite": {
        "text": (237, 237, 240, 1), "secondary": (237, 237, 240, 0.74),
        "muted": (237, 237, 240, 0.48), "faint": (237, 237, 240, 0.30),
        "accent": (124, 124, 255, 1), "accent_fg": (11, 11, 13, 1),
        "success": (61, 220, 132, 1), "warn": (255, 179, 64, 1),
        "danger": (255, 107, 107, 1), "info": (90, 200, 250, 1),
    },
}


def label(x):
    return "gap-[inherit]" in x.get("cls", "")


def pair_table():
    out = []
    for t in THEMES:
        tk = TOK[t]
        P = []

        def add(nome, kind, pred, minimum=None):
            lst = [x for x in rows if x["theme"] == t and x["kind"] == kind]
            c = [x for x in lst if pred(x)]
            if not c:
                P.append((nome, None, None, None, None))
                return
            x = min(c, key=lambda z: z["ratio"])
            m = x["min"] if minimum is None else minimum
            P.append((nome, x["ratio"], m, x["ratio"] >= m, x))

        def col(x, key):
            return rgba(x.get("colorCss"))

        normal = lambda x: x.get("opacity", 1) >= 0.995 and not x.get("disabled")
        add("texto principal --text / --text-fg", "texto",
            lambda x: closea(col(x, 1), tk["text"]) and normal(x))
        add("texto secundario --text-secondary", "texto",
            lambda x: closea(col(x, 1), tk["secondary"]) and normal(x))
        add("texto muted --text-muted (caption/micro)", "texto",
            lambda x: closea(col(x, 1), tk["muted"]) and normal(x))
        add("texto faint --text-faint", "texto",
            lambda x: closea(col(x, 1), tk["faint"]) and normal(x))
        add("botao primario --accent-fg sobre --accent", "texto",
            lambda x: label(x) and normal(x)
            and close(x.get("bg"), tk["accent"][:3], 14))
        add("botao destrutivo branco sobre --danger", "texto",
            lambda x: label(x) and normal(x)
            and close(x.get("bg"), tk["danger"][:3], 14))
        for nome, tok in [("badge success --success / --success-soft", "success"),
                          ("badge warn --warn / --warn-soft", "warn"),
                          ("badge danger --danger / --danger-soft", "danger"),
                          ("badge info --info / --info-soft", "info"),
                          ("badge accent --accent / --accent-soft", "accent")]:
            add(nome, "texto",
                lambda x, tok=tok: closea(col(x, 1), tk[tok], 8) and normal(x)
                and not close(x.get("bg"), tk[tok][:3], 14))
        add("placeholder do campo (--text-faint)", "placeholder", lambda x: True)
        add("borda do input (--border) vs fundo adjacente", "borda-input", lambda x: True)
        add("acao desabilitada (opacity 45%)", "texto",
            lambda x: x.get("opacity", 1) < 0.995 and label(x))
        out.append((t, P))
    return out


for t, P in pair_table():
    print(f"\n=== {t} ===")
    print(f"{'par de cores':48s} {'medido':>7s} {'min':>5s}  ok")
    for nome, ratio, m, ok, x in P:
        if ratio is None:
            print(f"{nome:48s} {'--':>7s} {'--':>5s}  sem amostra")
        else:
            print(f"{nome:48s} {ratio:7.2f} {m:5.1f}  {'SIM' if ok else 'NAO':3s}  fundo={x['bg']} texto={x.get('textRendered')}")
