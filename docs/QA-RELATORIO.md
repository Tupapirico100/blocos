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

**Reprovada na primeira passagem (24/30)** — o verificador achou 3 desvios reais:

| # | Sev | Onde | Problema | Correcao |
|---|---|---|---|---|
| P1 | media | `tokens/styles.css` (reduced-motion) | os loops CSS (shimmer do skeleton, spinner) eram **acelerados para 1ms** em vez de desligados → estroboscopio de ~1 kHz | `animation: none !important` + `animation-iteration-count: 1` |
| P2 | media | 8 blocos | salto de heading (h1 → h3) e **segundo h1** nos blocos de identidade | titulo de topo padronizado em `h2` |
| P3 | alta | `clinico/clinical-entry.tsx` | o bloco interceptava `forbidden` e mostrava o ConsentGate **sem nomear o papel** | `forbidden` volta para o `BlockFrame` |

**Corrigidos e reconferidos por medicao:**
- P1: `animationName: none`, `animationDuration: 0s`, `iterationCount: 1` no contexto `reduced_motion="reduce"`.
- P2: 29/29 blocos sem salto de heading e com no maximo um `h1`.
- P3: `clinical-entry` no estado "Sem permissao" → "Esta area e visivel apenas para dono do consultorio, recepcionista ou funcionario".

**Quarta passagem (reconfirmacao):** o verificador de confirmacao refez os 3 itens + varredura
de regressao nos 4 checkers, na arvore de acessibilidade (CDP `Accessibility.getFullAXTree`),
no overflow em 5 larguras e no contraste por pixel. **Reprovou em 88/100** — achou mais 4 desvios:

| # | Sev | Onde | Problema | Correcao |
|---|---|---|---|---|
| C2a | alta | `ui/overlay.tsx` (TabPanel) | o painel de aba tinha `focus-visible:outline-none` → **nenhum indicador de foco** | anel do DS (2px accent, offset 2px) |
| C2b | alta | `ui/field.tsx` (Input/Select/Textarea) | `focus:outline-none` zerava `--tw-outline-style` → o `outline-2` **nunca era pintado** (so a borda de 1px) | `focus-visible:outline-solid` + remocao do `focus:outline-none` |
| C5a | alta | `administracao/office-settings.tsx` | grade por **viewport** (`sm:grid-cols-2`) dentro de um container de 223px → o cartao WhatsApp invadia o Instagram (ate 227px de invasao) | **container query** (`@container` + `@[420px]:grid-cols-2`) + `min-w-0` |
| C5b | media | `social/social-composer.tsx` | `truncate` em `display:inline` → **truncamento inerte**: o nome do arquivo invadia o rotulo "IMAGEM · N MB" | `inline-block max-w-full` no span truncado |
| C4 | media | 17 blocos | 29 `text-[Npx]` avulsos (1 fora da escala: `text-[9px]`) | migrados para `bloco-control*` / `bloco-label*` / `bloco-cell` |

**Quinta passagem (confirmacao final):** o verificador reconfirmou os 4 desvios por medicao
(outline do TabPanel e dos campos = solid 2px accent; cartoes do office-settings com Δ0 em
4 larguras e sem intersecao; nome do arquivo do social-composer cortado com folga de +8px;
`text-[Npx]` = 0) e a regressao completa verde — **100/100**, sem regressao.

**Observacoes finais aplicadas (nao baixavam a nota, mas melhoravam o produto):**
- 3 `<input>` crus ainda usavam so borda + ring como indicador de foco → agora pintam o
  outline do DS (solid 2px accent offset 2px).
- 39 textos truncados sem `title` (o valor completo era inacessivel) → todos com `title`.
  Verificado: **0 texto cortado sem `title`** nos 29 blocos.

### Placar da 5a passagem (final)

| Checker | Resultado |
|---|---|
| `qa-automatic.py` | 0 achados |
| `qa-variantes.py` | 0 achados (29 blocos) |
| `qa-contraste.py` | 0 violacoes |
| `qa-contraste-pixel.py` | **0 violacoes em 8.621 medicoes por pixel** |
| Erro de console | 0 |
| Arvore de acessibilidade (CDP) | 0 controles sem nome |
| Overflow do documento | 0 em 390/768/1280/1440/1920 |
| Texto cortado sem ellipsis / sem `title` | 0 / 0 |
| Headings | sem salto, 1 h1 por documento |
| Verificacao humana independente | **100/100** |

### Regressao apos as escolhas do dono (2026-11-18)

Com o tema Aurora e a `defaultVariant` fixada nos 29 blocos, o conteudo renderizado mudou
(29 blocos x 3 temas x 5 estados). O QA inteiro foi refeito:
`qa-automatic.py` 0 · `qa-variantes.py` 0 (o checker foi corrigido: ele assumia que a
primeira variante era a inicial — agora clica em todas) · `qa-contraste.py` 0 ·
`qa-contraste-pixel.py` 0 (**9.003** medicoes por pixel, 3 temas).

### Placar final

| Checker | Rodada 1 | Rodada 2 | Rodada 3 |
|---|---|---|---|
| `qa-automatic.py` | 612 | 0 | **0** |
| `qa-variantes.py` | 7 | 0 | **0** |
| `qa-contraste.py` (DOM) | 5.008 | 0 | **0** |
| `qa-contraste-pixel.py` (pixel) | 11.710 | 433 → 0 | **0** (8.636 medicoes) |
| Verificacao humana | 113 achados | 21 achados | 7 achados → **0** |

`bash scripts/placar-final.sh` roda os 4 e imprime o placar.

### O que a rodada 3 provou que nenhum checker sozinho prova

- O **portal do Radix perde o tema** (dialog transparente com texto preto) — so apareceu
  abrindo o dialog num tema escuro.
- O `.bloco-glass` **vence o `fixed`** por estar fora de `@layer` — os dois overlays
  estavam **invisiveis** (viajava so o blur).
- O **item da sidebar sumia sob o cabecalho sticky** ao rolar ate ele.
- O **reduced-motion** desligava a animacao mas mantinha o loop a 1ms.

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
