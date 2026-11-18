#!/usr/bin/env bash
# Placar final da biblioteca Blocos: roda os 4 checkers e imprime as 100 pontos.
set -u
cd "$(dirname "$0")/.."

echo "=============================================================="
echo " PLACAR FINAL — Biblioteca Blocos (rubrica de 100 pontos)"
echo "=============================================================="
echo
bash scripts/servir-catalogo.sh >/dev/null

falhas=0

echo "[1/4] qa-automatic.py (type, nome acessivel, alvo, overflow, hex, estados, papel)"
out=$(python3 scripts/qa-automatic.py 2>&1)
n=$(echo "$out" | grep -oP 'TOTAL DE ACHADOS: \K\d+')
echo "      achados: ${n:-ERRO}"
[ "${n:-1}" != "0" ] && falhas=$((falhas+1))

echo "[2/4] qa-variantes.py (variacoes renderizam e sao distintas)"
out=$(python3 scripts/qa-variantes.py 2>&1)
n=$(echo "$out" | grep -oP '^achados: \K\d+')
b=$(echo "$out" | grep -oP '^blocos verificados: \K\d+')
echo "      blocos: ${b:-?} | achados: ${n:-ERRO}"
[ "${n:-1}" != "0" ] && falhas=$((falhas+1))

echo "[3/4] qa-contraste.py (contraste WCAG por DOM, alpha composto)"
out=$(python3 scripts/qa-contraste.py 2>&1)
n=$(echo "$out" | grep -oP 'violacoes de contraste: \K\d+')
m=$(python3 -c "import json;print(json.load(open('docs/qa-contraste.json')).get('medicoes','?'))" 2>/dev/null)
echo "      violacoes: ${n:-ERRO} (medicoes: ${m:-?})"
[ "${n:-1}" != "0" ] && falhas=$((falhas+1))

echo "[4/4] qa-contraste-pixel.py (contraste WCAG por PIXEL — o mais rigoroso)"
out=$(python3 scripts/qa-contraste-pixel.py 2>&1)
n=$(echo "$out" | grep -oP 'violacoes: \K\d+')
m=$(echo "$out" | grep -oP 'medicoes por pixel: \K\d+')
echo "      violacoes: ${n:-ERRO} (medicoes: ${m:-?})"
[ "${n:-1}" != "0" ] && falhas=$((falhas+1))

echo
echo "=============================================================="
if [ "$falhas" -eq 0 ]; then
  echo " RESULTADO: 100/100 — os 4 checkers sem nenhum achado"
else
  echo " RESULTADO: $falhas checkers com achados — ainda NAO passa"
fi
echo "=============================================================="
exit $falhas
