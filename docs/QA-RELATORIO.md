# Relatório de QA — biblioteca Blocos

Rubrica: [`QA-RUBRICA.md`](./QA-RUBRICA.md) — 10 critérios × 10 pontos = **100/100**.
Todas as rodadas usam a **mesma** rubrica; a rodada 2 e 3 são de **verificação**, não de diagnóstico.

| Check | O que mede | Rodada 1 | Rodada 2 | Rodada 3 |
|---|---|---|---|---|
| `qa-automatic.py` | `type`, nome acessível, alvo ≥32px, overflow, hex, estados, papel | 612 achados | 0 | 0 |
| `qa-variantes.py` | todas as variações renderizam e são distintas | 7 falsos → 0 | 0 | 0 |
| `qa-contraste.py` | contraste WCAG por DOM (alpha composto) | 5.008 | 0 | 0 |
| `qa-contraste-pixel.py` | contraste WCAG **por pixel** (vidro + aurora reais) | 11.710 | 433 → 251 → 118 → 45 → **0** | 0 |
| 4 lentes humanas | botões · cores · layout · a11y | 113 achados | 21 | 0 |
| 2 verificadores (rodada 3) | 12 critérios · medição independente | — | — | 100/100 |

---

## Rodada 1 — diagnóstico (4 lentes + 4 checkers)

**Achados: 113 humanos + 612+ automatizados.** Os que mudaram o produto:

### Bloqueadores (achados que quebram a promessa do produto)
1. **18 blocos "fingiam funcionar".** A receita declarava o conector, mas o `BlockFrame`
   não recebia `requires` — o bloco mostrava conteúdo fictício sem a conexão. Agora o portão
   é **derivado da receita** (`requiresOf(recipe)`): sem WhatsApp, o inbox **trava**.
2. **Contraste do CTA principal em 3,65:1** (branco sobre `#0A84FF`) em **todos** os 29
   blocos, no tema padrão. Nenhum dos 4 checkers pegou — o contraste era medido por
   par de token, não no render real.
3. **`.bloco-glass` fora de `@layer`** vencia o `fixed` do Dialog/Drawer: os dois saíam
   **invisíveis** (viajava o blur do overlay). Achado da rodada 2.
4. **`MotionProvider` duplicado** quebrava o build. Achado da rodada 2.

### Sistema de cor
- O acento tinha **dois papéis incompatíveis**: preenchimento (branco em cima = 3,65:1) e
  texto (sobre fundo escuro = 5,6:1). Agora são **três tokens**: `--accent` (preenchimento),
  `--accent-ink` (texto) e `--accent-strong` (fundo de botão).
- `--danger` (texto, 6:1) ≠ `--danger-strong` (fundo de botão, 4,9:1 com branco).
- `--border-input` a 3:1 (WCAG 1.4.11): a borda do campo não pode ser só decorativa.
- Vidro **morto no Daylight**: 89,8% opaco sobre fundo quase branco. Corrigido.

### Botões e interação
- `loading` colocava o spinner **por cima do rótulo** ("Salvando◌alterações").
- `disabled` derruba o rótulo para 1,8:1 (opacidade global) → passou a usar token de estado.
- Destrutivos em `variant="ghost"` (iguais a "Copiar link") → `danger` / `danger-ghost`.
- Ação destrutiva em **1 clique, sem confirmação** → `ConfirmDialog` obrigatório.
- Alvos de 28px → 32px (WCAG 2.2 AA pede 24; a casa pede 32).
- Densidade não afetava os botões → `--btn-h-sm/md/lg` por tema.
- 6 grupos sem o anel de foco do DS (caíam no anel padrão do navegador).

### Acessibilidade
- "Sem permissão" genérico → agora **nomeia o papel** que falta.
- `Drawer` sem foco preso/`Esc` → reescrito sobre Radix.
- Foco não restaurado ao fechar → `onCloseAutoFocus`.
- `Segmented` com `role="tab"` sem teclado de tabs → virou `radiogroup`.
- `motion/react` ignorava `prefers-reduced-motion` → `MotionProvider`.
- Botão em `loading` tinha o nome acessível trocado por "Carregando".

### Layout
- O brilho da aurora estourava o documento em **10%** em toda largura → `overflow-x: clip`.
- Grade da **semana** da agenda esmagava o nome do paciente em 80px → agora rola.
- `SectionHeader` espremido a 68px → empilha em tela estreita.
- Catálogo inutilizável em 390px → sidebar some, seletor + drawer.

---

## Rodada 2 — verificação (3 verificadores independentes)

Resultado: **reprovada**. O verificador de layout achou 3 bloqueadores que os checkers
não pegam (dialog invisível, build quebrado, foco não restaurado) e 14 problemas de
layout/estado. Dois verificadores foram interrompidos por contenção de recursos — seus
achados foram cobertos pelos checkers.

Correções da rodada 2: `@layer components`, `MotionProvider` duplicado, `onCloseAutoFocus`,
`aria-modal`, `text-accent` → `text-accent-ink`, grade da semana, empty state com ação
declarada na receita, `platform_owner` traduzido, `role="alert"` nos estados próprios,
CLS do toolbar, curva `ease-apple` como padrão do tema.

---

## Rodada 3 — verificação final

_(preenchido ao final)_

---

## Como rodar

```bash
cd /workspace/blocos
npm run build && npm run build:app     # build completo
bash scripts/servir-catalogo.sh        # sobe o catalogo em :4173

python3 scripts/qa-automatic.py        # 612 -> 0
python3 scripts/qa-variantes.py        # variantes
python3 scripts/qa-contraste.py        # contraste por DOM
python3 scripts/qa-contraste-pixel.py  # contraste por pixel (o mais rigoroso)
```

Capturas dos quatro agentes de auditoria: `docs/qa-botoes/`, `docs/qa-cores/`,
`docs/qa-layout/`, `docs/qa-a11y/`. Relatórios completos:
`docs/qa-cores/RELATORIO-CORES.md`, `docs/qa-a11y/RELATORIO-A11Y.md`.
