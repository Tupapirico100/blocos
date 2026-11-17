#!/usr/bin/env python3
"""Empurra a biblioteca para o GitHub via conector, em lotes."""
import json, os, subprocess, sys, time
from pathlib import Path

ROOT = Path("/workspace/blocos")
REPO = "blocos"
OWNER = "Tupapirico100"

SKIP_DIRS = {"node_modules", "dist", ".git"}
SKIP_EXT = {".tsbuildinfo"}
SKIP_PREFIX = ("docs/capturas/bloco-",)

files = []
for p in sorted(ROOT.rglob("*")):
    if not p.is_file():
        continue
    rel = p.relative_to(ROOT).as_posix()
    if any(part in SKIP_DIRS for part in p.relative_to(ROOT).parts):
        continue
    if p.suffix in SKIP_EXT or rel.startswith(SKIP_PREFIX):
        continue
    if p.name == "package-lock.json":
        continue  # lockfile gigante e dependente de plataforma
    try:
        content = p.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    files.append({"path": rel, "content": content})

print(f"arquivos a enviar: {len(files)}")
BATCH = 12
for i in range(0, len(files), BATCH):
    batch = files[i : i + BATCH]
    args = {
        "owner": OWNER,
        "repo": REPO,
        "branch": "main",
        "message": f"feat: biblioteca de blocos beta ({i//BATCH + 1}/{(len(files)+BATCH-1)//BATCH})",
        "files": batch,
    }
    argfile = Path("/tmp/push-args.json")
    argfile.write_text(json.dumps(args, ensure_ascii=False))
    for attempt in range(4):
        proc = subprocess.run(
            ["mcode-tools", "connector", "call", "connector__github__push_files", "--args-file", str(argfile)],
            capture_output=True, text=True, cwd="/workspace",
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode == 0 and "error" not in out.lower()[:200]:
            print(f"  lote {i//BATCH + 1}: ok ({len(batch)} arquivos)")
            break
        print(f"  lote {i//BATCH + 1}: tentativa {attempt+1} falhou -> {out[:200]}")
        time.sleep(4 * (attempt + 1))
    else:
        print("FALHOU o lote", i)
        sys.exit(1)
print("concluido")
