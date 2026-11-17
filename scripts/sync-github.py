#!/usr/bin/env python3
"""Envia apenas os arquivos que diferem do remoto (ou que faltam)."""
import json, subprocess, sys, time, hashlib
from pathlib import Path

ROOT = Path("/workspace/blocos")
REPO, OWNER = "blocos", "Tupapirico100"
SKIP_DIRS = {"node_modules", "dist", ".git"}
SKIP_EXT = {".tsbuildinfo"}
SKIP_PREFIX = ("docs/capturas/", "docs/catalogo-blocos.html")  # PNG/binario/gerado grande

# estado remoto
with open("/tmp/rt.json", "w") as _f:
    subprocess.run(["mcode-tools", "connector", "call", "connector__github__get_repository_tree",
                    "--args", json.dumps({"owner": OWNER, "repo": REPO, "tree_sha": "main", "recursive": True})],
                   text=True, cwd="/workspace", stdout=_f, stderr=subprocess.DEVNULL)
raw = json.load(open("/tmp/rt.json"))
txt = raw[0]["text"] if isinstance(raw, list) else raw
items = json.loads(txt).get("tree", json.loads(txt))
remote = {i["path"]: i.get("sha") for i in items if i.get("type") == "blob"}

def blob_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()

pending = []
for p in sorted(ROOT.rglob("*")):
    if not p.is_file():
        continue
    rel = p.relative_to(ROOT).as_posix()
    if any(x in SKIP_DIRS for x in p.relative_to(ROOT).parts):
        continue
    if p.suffix in SKIP_EXT or rel.startswith(SKIP_PREFIX) or p.name == "package-lock.json":
        continue
    data = p.read_bytes()
    sha = blob_sha(data)
    if remote.get(rel) != sha:
        pending.append({"path": rel, "content": data.decode("utf-8"), "sha": sha})

print(f"pendentes: {len(pending)}")
for f in pending:
    print("  -", f["path"], f"({len(f['content'])} chars)")

BATCH = 8
for i in range(0, len(pending), BATCH):
    batch = pending[i : i + BATCH]
    args = {"owner": OWNER, "repo": REPO, "branch": "main",
            "message": f"chore: sincroniza biblioteca beta ({i//BATCH+1}/{(len(pending)+BATCH-1)//BATCH})",
            "files": [{"path": f["path"], "content": f["content"]} for f in batch]}
    Path("/tmp/pa.json").write_text(json.dumps(args, ensure_ascii=False))
    for attempt in range(4):
        proc = subprocess.run(["mcode-tools", "connector", "call", "connector__github__push_files",
                               "--args-file", "/tmp/pa.json"], capture_output=True, text=True, cwd="/workspace")
        out = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode == 0 and '"error"' not in out.lower()[:300]:
            print(f"  lote {i//BATCH+1}: ok ({len(batch)})")
            break
        print(f"  lote {i//BATCH+1} tentativa {attempt+1}: {out[:200]}")
        time.sleep(4 * (attempt + 1))
    else:
        sys.exit("falhou")
print("ok")
