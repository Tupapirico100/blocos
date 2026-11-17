# Auditoria de cor — biblioteca Blocos (design system "Aurora")

**Escopo:** critério 3 da `docs/QA-RUBRICA.md` ("Cores — tokens e contraste") e a hierarquia
de cor do critério 4, com a lente das seções 3 e 4 de `docs/DESIGN-SYSTEM.md`.
**Natureza:** somente leitura. Nenhum arquivo da biblioteca foi alterado.
**Data da medição:** build `apps/catalog/dist` de 18:04 (tokens `packages/tokens/src/styles.css`
md5 `8640d16cd97386dfb82e2930d53256ee`).

---

## 0. Método (por que os números são confiáveis)

| Etapa | O que foi feito |
|---|---|
| Cobertura | 29 blocos × 3 temas × **170 telas** (bloco × variante × estado) = 32.585 medições **únicas** |
| Fundos | medidos por **pixel**, não por token: screenshot com o texto e screenshot com `color: transparent !important` |
| Composição | o fundo sai da cor **modal** da região sem texto (glass, gradiente aurora, `bg-surface/NN`, sombra e alfa do painel entram no valor final) |
| Texto | sai do **núcleo do glifo** (mediana dos pixels a ≥96% da distância máxima do fundo) e é cruzado com a cor computada do CSS |
| Opacidade | quando há grupo de opacidade (`disabled:opacity-45`), vale o pixel renderizado, não o valor do CSS |
| Mínimo | 4.5:1 texto normal · 3.0:1 texto grande (≥24px ou ≥18.66px+bold) e componente de UI |

Scripts novos (não alteram a biblioteca):
`scripts/qa-contraste.py` (coleta), `scripts/qa-contraste-pares.py` (tabela de pares),
`scripts/qa-contraste-resumo.py` (agregados), `scripts/qa-cores-capturas.py` (capturas).
Dados crus: `docs/qa-cores/contraste-todo.json`. Capturas: `docs/qa-cores/*.png`.

**Resultado global:** 32.585 medições · **11.710 falhas (35,9%)**.

| Tema | Medições | Falhas | % |
|---|---:|---:|---:|
| Aurora | 10.905 | 214 | **2,0 %** |
| Daylight | 10.800 | 6.057 | **56,1 %** |
| Graphite | 10.880 | 5.439 | **50,0 %** |

---

## 1. Tabela de contraste medido (pior caso por par, em cada tema)

### Aurora
| par de cores | medido | mínimo | aprovado? |
|---|---:|---:|---|
| texto principal `--text` / `--text-fg` | 10,10 | 4,5 | ✅ |
| texto secundário `--text-secondary` | 6,68 | 4,5 | ✅ |
| texto muted `--text-muted` (caption/micro) | 4,55 | 4,5 | ⚠️ passa com 0,05 de margem |
| texto faint `--text-faint` | 2,86 | 4,5 | ❌ |
| botão primário `--accent-fg` sobre `--accent` | 3,65 | 4,5 | ❌ |
| botão destrutivo branco sobre `--danger` | 3,41 | 4,5 | ❌ |
| badge success `--success` / `--success-soft` | 5,81 | 4,5 | ✅ |
| badge warn `--warn` / `--warn-soft` | 5,95 | 4,5 | ✅ |
| badge danger `--danger` / `--danger-soft` | 4,01 | 4,5 | ❌ |
| badge info `--info` / `--info-soft` | 5,80 | 4,5 | ✅ |
| badge accent `--accent` / `--accent-soft` | 3,51 | 4,5 | ❌ |
| placeholder do campo (`--text-faint`) | 2,73 | 4,5 | ❌ |
| borda do input `--border` vs fundo adjacente | 1,20 | 3,0 | ❌ |
| ação desabilitada (`disabled:opacity-45`) | 2,34 | 4,5 | ❌ |

### Daylight
| par de cores | medido | mínimo | aprovado? |
|---|---:|---:|---|
| texto principal `--text` / `--text-fg` | 13,41 | 4,5 | ✅ |
| texto secundário `--text-secondary` | 7,15 | 4,5 | ✅ |
| texto muted `--text-muted` (caption/micro) | **3,29** | 4,5 | ❌ |
| texto faint `--text-faint` | **2,10** | 4,5 | ❌ |
| botão primário `--accent-fg` sobre `--accent` | 4,70 | 4,5 | ✅ (margem 0,20) |
| botão destrutivo branco sobre `--danger` | 5,38 | 4,5 | ✅ |
| badge success `--success` / `--success-soft` | **3,18** | 4,5 | ❌ |
| badge warn `--warn` / `--warn-soft` | **4,23** | 4,5 | ❌ |
| badge danger `--danger` / `--danger-soft` | **4,29** | 4,5 | ❌ |
| badge info `--info` / `--info-soft` | **3,37** | 4,5 | ❌ |
| badge accent `--accent` / `--accent-soft` | **3,37** | 4,5 | ❌ |
| placeholder do campo (`--text-faint`) | **2,09** | 4,5 | ❌ |
| borda do input `--border` vs fundo adjacente | **1,22** | 3,0 | ❌ |
| ação desabilitada (`disabled:opacity-45`) | **1,94** | 4,5 | ❌ |

### Graphite
| par de cores | medido | mínimo | aprovado? |
|---|---:|---:|---|
| texto principal `--text` / `--text-fg` | 11,38 | 4,5 | ✅ |
| texto secundário `--text-secondary` | 6,82 | 4,5 | ✅ |
| texto muted `--text-muted` (caption/micro) | **4,07** | 4,5 | ❌ |
| texto faint `--text-faint` | **2,47** | 4,5 | ❌ |
| botão primário `--accent-fg` sobre `--accent` | 5,79 | 4,5 | ✅ |
| botão destrutivo branco sobre `--danger` | **2,78** | 4,5 | ❌ |
| badge success `--success` / `--success-soft` | 7,19 | 4,5 | ✅ |
| badge warn `--warn` / `--warn-soft` | 7,24 | 4,5 | ✅ |
| badge danger `--danger` / `--danger-soft` | 5,38 | 4,5 | ✅ |
| badge info `--info` / `--info-soft` | 6,94 | 4,5 | ✅ |
| badge accent `--accent` / `--accent-soft` | **4,02** | 4,5 | ❌ |
| placeholder do campo (`--text-faint`) | **2,40** | 4,5 | ❌ |
| borda do input `--border` vs fundo adjacente | **1,12** | 3,0 | ❌ |
| ação desabilitada (`disabled:opacity-45`) | **2,11** | 4,5 | ❌ |

---

## 2. Nota do critério 3 — **4 / 10**

O critério tem três exigências. Duas passam, uma reprova:

| Sub-exigência | Resultado |
|---|---|
| Zero cor hex em `className` | ✅ **cumpre** (ver §3, F1) — nenhum hex em `className` em `packages/*/src` |
| Estado nunca sinalizado só por cor | ✅ **cumpre** — todo badge tem texto; os pontos coloridos são `aria-hidden` e sempre acompanhados de rótulo |
| Contraste WCAG AA nos **3 temas** | ❌ **reprova** — Aurora passa (2 % de falha), mas Daylight falha em **56 %** das medições e Graphite em **50 %**. Falha **comum**, não rara: atinge os 4 níveis da hierarquia de texto, os 5 badges de estado, o botão primário, o botão destrutivo, o placeholder e a borda de campo em **todos** os blocos |

**Justificativa da nota:** a *estrutura* do sistema de cor é boa (tokens semânticos completos, 3 temas
coerentes, zero hex espalhado, estados sempre com texto). O que reprova é o **contrato de contraste**:
a escala de texto foi calibrada para um único tema e não sobreviveu ao Daylight e ao Graphite — em
Daylight o `--text-muted` (usado por 169 `.bloco-caption` + 111 `.bloco-micro`) fica em 3,29:1 e o
`--text-faint` em 2,10:1, ou seja, **todo metadado da biblioteca** está abaixo do mínimo AA.
Como a falha é sistêmica e atinge leitura de dados em 2 de 3 temas, a nota é 4 (não 5): não é
"falha comum" apenas em casos isolados, é falha comum **e** de leitura — mas a base de tokens
existe e a correção é localizada em um arquivo.

---

## 3. Achados

Severidade: **[alto]** = reprova o critério 3 textualmente e afeta uso real · **[médio]** = falha de
UI (3:1), inconsistência semântica ou de hierarquia · **[baixo]** = limpeza/consistência.
Todas as correções são **em token** (`packages/tokens/src/styles.css`), com a mudança de código
mínima e pontual indicada.

### 3.1 Contraste

| # | Sev. | Onde | Problema (medido) | Correção concreta |
|---|---|---|---|---|
| A1 | **alto** | `packages/tokens/src/styles.css:196` | Daylight `--text-muted: rgba(29,29,31,0.52)` → **3,29:1**. Falha em **100%** das 6.620 medições com essa cor (todas as instâncias de `.bloco-caption` e `.bloco-micro`, 280 usos na lib). | `--text-muted: rgba(29, 29, 31, 0.72)` → **6,37:1** no fundo, 6,65 no branco |
| A2 | **alto** | `packages/tokens/src/styles.css:197` | Daylight `--text-faint: rgba(29,29,31,0.34)` → **2,10:1**. É a cor do placeholder e das legendas leves. | `--text-faint: rgba(29, 29, 31, 0.64)` → **4,90:1** (5,07 no branco) |
| A3 | **alto** | `packages/tokens/src/styles.css:250` | Graphite `--text-muted: rgba(237,237,240,0.48)` → **4,07:1**. Falha em **100%** das 6.662 medições com essa cor. | `--text-muted: rgba(237, 237, 240, 0.58)` → **6,02:1** |
| A4 | **alto** | `packages/tokens/src/styles.css:251` | Graphite `--text-faint: rgba(237,237,240,0.30)` → **2,47:1** (placeholder e rótulos). | `--text-faint: rgba(237, 237, 240, 0.52)` → **5,03:1** |
| A5 | **alto** | `packages/tokens/src/styles.css:143` | Aurora `--text-faint: rgba(255,255,255,0.32)` → **2,73:1** (placeholder) / 2,86 no pior caso. | `--text-faint: rgba(255, 255, 255, 0.50)` → **5,30:1** no fundo, 5,25 sobre superfície de vidro |
| A6 | **alto** | `packages/tokens/src/styles.css:146` + `packages/ui/src/button.tsx:22` | Aurora `--accent: #0a84ff` com `--accent-text: #ffffff` → **3,65:1** no rótulo do botão primário (14–16 px = texto normal). 71 medições com branco reprovam por causa disso. | `--accent: #0069d6` (branco → **5,26:1**; como UI sobre o fundo → 3,87, ainda ≥3) |
| A7 | **alto** | `packages/tokens/src/styles.css:147` | Aurora `--accent-hover: #3d9bff` com rótulo branco → **2,86:1**. O hover do botão primário é pior que o estado normal. | `--accent-hover: #0071e3` (branco → **4,70:1**) |
| A8 | **alto** | `packages/ui/src/button.tsx:29` | `danger: "bg-danger text-white"` — `text-white` é literal de cor e o branco sobre o preenchimento destrutivo dá **3,41:1** no Aurora e **2,78:1** no Graphite. | Novo token **`--danger-fg`**: Aurora `#0b0b0d` (5,77 sobre `#ff453a`), Daylight `#ffffff` (5,38 sobre `#d70015`), Graphite `#0b0b0d` (7,09 sobre `#ff6b6b`). Trocar `text-white` → `text-danger-fg`. *Alternativa se a casa exigir rótulo branco*: novo token `--danger-strong` só de preenchimento — Aurora `#d70015` (branco 5,38), Daylight `#d70015` (5,38), Graphite `#d92d20` (4,83) |
| A9 | **alto** | `packages/tokens/src/styles.css:200` e `:213` | No Daylight `--info: #0071e3` é **idêntico** a `--accent: #0071e3`, e `--info-soft` idêntico a `--accent-soft`: mesma cor, significados diferentes. 668 falhas (3,37–4,39:1) em badges info/accent. | `--accent: #0069d6` (texto 4,83 / branco 5,26) e **`--info: #0a6f8f`** (5,24 no fundo, 4,95 no soft) + `--info-soft: rgba(10, 111, 143, 0.10)` |
| A10 | **alto** | `packages/tokens/src/styles.css:207` | Daylight `--success: #248a3d` → **3,18:1** no badge "Ativo". Falha em **241/241** medições. | `--success: #1e7a34` → **4,96:1** no fundo, 4,71 no soft |
| A11 | **alto** | `packages/tokens/src/styles.css:209` | Daylight `--warn: #b25000` → **4,23:1** (47 falhas). | `--warn: #a34800` → **5,54:1** (5,20 no soft) |
| A12 | **médio** | `packages/tokens/src/styles.css:211` | Daylight `--danger: #d70015` → **4,29:1** no badge "Faltou" (54 falhas). | `--danger: #c3000f` → **5,80:1** no fundo, 5,34 no soft, branco no preenchimento 6,31 |
| A13 | **médio** | `packages/tokens/src/styles.css:142` | Aurora `--text-muted: rgba(255,255,255,0.5)` passa, mas com **4,55:1** de margem mínima — qualquer superfície mais clara (glass claro) quebra. Também deixa de ser distinguível de `--text-faint` se A5 for corrigido. | `--text-muted: rgba(255, 255, 255, 0.60)` → **7,33:1** (7,01 no vidro), mantendo a escada 17,9 / 10,4 / 7,3 / 5,3 |
| A14 | **alto** | `packages/tokens/src/styles.css:136`, `:190`, `:244` + `packages/ui/src/field.tsx:67,90,113` | Borda de input: **132 de 132** medições reprovam o mínimo de UI (3:1). Medido 1,12–1,22:1. `--border-strong` também reprova (1,45–1,59:1). A borda é o **único** sinal de fronteira do campo (o preenchimento `bg-surface-strong/60` é indistinguível do painel). | Novo token **`--border-input`**: Aurora `rgba(255,255,255,0.36)` (3,15:1), Daylight `rgba(0,0,0,0.46)` (3,42:1), Graphite `rgba(255,255,255,0.36)` (3,15:1). Usar em `field.tsx` no lugar de `border-border`. `--border`/`--border-strong` podem seguir como hairline decorativo |
| A15 | **médio** | `packages/ui/src/button.tsx:54` (`disabled:opacity-45`), `packages/ui/src/field.tsx:50` (`disabled:opacity-50`) | Ação desabilitada: Daylight **1,22:1** ("Rebaixar") e botão primário desabilitado **1,94:1**; Graphite 2,11; Aurora 2,34. Em tema claro, opacidade empurra o texto escuro na direção do fundo. | Token **`--disabled-opacity`** por tema: Aurora `0.45` (medido 4,0 — ok), Graphite `0.50`, Daylight `0.85` + token `--text-disabled` Daylight `#6e6e73` (4,54:1) aplicado via `disabled:text-fg-disabled` **em vez de** opacidade no claro |
| A16 | **médio** | `packages/tokens/src/styles.css:148` | Aurora `--accent-soft: rgba(10,132,255,0.16)` + `--accent` como texto do badge/avatar → **3,51:1** (139 falhas). O gradiente do fundo aurora clareia a área e derruba o contraste. | Split do acento (ver §6): `--accent` vira preenchimento `#0069d6` e nasce **`--accent-ink`** `#5eb3ff` (5,71 sobre o pior fundo medido, 9,09 no fundo) — trocar `text-accent` → `text-accent-ink` (26 pontos em `packages/*/src`) |
| A17 | **médio** | `packages/tokens/src/styles.css:184`, `:186`, `:187` | **Vidro morto no Daylight**: `--glass-bg: rgba(255,255,255,0.68)` sobre um fundo quase branco → 89,8% de opacidade (plano, sem camada); a única pista de separação é `--glass-border: rgba(0,0,0,0.08)` a **1,1:1** (invisível) e o reflexo `--glass-highlight` branco 0,9 não aparece. Vidro sobre vidro (`packages/blocks/src/administracao/admin-platform.tsx:322`→`:364`, `packages/blocks/src/administracao/office-settings.tsx:456`–`:465`) multiplica para 89,8% — o DS §4 já alerta "no máximo 2 camadas". | No Daylight, o vidro deve virar superfície sólida: `--glass-bg: rgba(255,255,255,0.45)` (deixa a cor do fundo aparecer, profundidade real) e `--glass-border: rgba(0,0,0,0.16)`; ou, melhor, `Panel tone="solid"` (`--surface-solid: #ffffff`) como padrão no tema claro e reservar o vidro a popover/drawer (já é o que o DS §4 determina) |
| A18 | **médio** | `packages/tokens/src/styles.css:124`, `:178`, `:232` | `--surface` é **translúcido** em Aurora/Daylight e **opaco** em Graphite. As classes `bg-surface/30…90` aplicam `color-mix` sobre um alfa que já existe → o alfa final é o **produto**: em Aurora `bg-surface/90` = branco a 4,05% (praticamente invisível); em Daylight `bg-surface/30` = branco a 21,6% (mais **cinza** que o fundo da página). O mesmo utilitário significa coisas diferentes em cada tema. | Tornar `--surface` **opaco** por tema (Aurora `#131316`, Daylight `#ffffff`, Graphite `#131316`) e criar `--surface-tint` (com alfa) para o efeito translúcido; ou remover os modificadores de opacidade de `--surface` no código (55 usos em `bg-surface/NN`) |
| A19 | **médio** | `scripts/qa-automatic.py:104`–`:108` e `:149`–`:150` | **O checker automático de contraste é cego.** (a) `theme.setdefault(...)` popula o dicionário com o bloco *aurora* **antes** do bloco do tema em questão → Daylight e Graphite são medidos com os valores do Aurora. (b) `resolve()` não resolve `var(--n-1000)` (as chaves do dicionário não têm o prefixo `--`) → `resolve(theme,"bg")` devolve `None` → **todo par com fundo "bg" é descartado** (`if f is None or b is None: continue`). Efeito: `docs/qa-resultado.json` reporta **0 achados de critério 3** enquanto 11.710 medições reais reprovam. | Trocar `setdefault` por atribuição direta (`theme[m.group(1)] = ...`) e normalizar o nome na resolução (`name.lstrip("-")`). Até lá, **o critério 3 não pode ser considerado verificado pelo `qa-automatic.py`** |

### 3.2 Hierarquia de cor

| # | Sev. | Onde | Problema | Correção concreta |
|---|---|---|---|---|
| H1 | **médio** | `packages/tokens/src/styles.css:200`/`:213` | No Daylight o badge **info** ("Dentro da janela de 24h") e o badge **accent** ("2 nova(s)") são o mesmo azul `#0071e3` — e é o mesmo azul do botão primário. Três Elementos, uma cor, três significados. | Ver A9: `--accent: #0069d6` + `--info: #0a6f8f` |
| H2 | **médio** | 20+ blocos (ex.: `packages/blocks/src/operacao/integration-manifest.tsx`, `packages/blocks/src/social/social-logs.tsx`, `packages/blocks/src/atendimento/inbox-whatsapp.tsx`, `packages/blocks/src/agenda/agenda-board.tsx`) | Até **5 matizes saturados simultâneos** na mesma tela (azul do acento + verde + âmbar + vermelho + magenta do "danger"). O DS §3 diz "um elemento focal por tela"; na prática as telas de status/listagem têm 4的状态 competindo com o botão primário. | Manter **um** acento por tela: o badge "informativo" e o botão primário não podem ser o mesmo matiz (H1 resolve em Daylight). Para telas de status, reduzir o badge `accent` a `neutral` e deixar **uma** cor de estado saturada por linha. |
| H3 | **baixo** | `packages/tokens/src/styles.css:150`–`:151` | `--accent-2` (roxo) existe mas **nunca é usado** — não há acento secundário real; ao mesmo tempo o gradiente de fundo (`--aurora-2`, `packages/tokens/src/styles.css:168`) pinta roxo no topo direito, competindo visualmente com o azul do acento (`--aurora-1`, `:167`). | Ou remover `--accent-2`/`--accent-2-soft`, ou usá-lo como acento secundário documentado (ex.: destaque de seção) e reduzir `--aurora-2` em Aurora/Graphite |

### 3.3 Estados por cor

| # | Sev. | Onde | Problema | Correção |
|---|---|---|---|---|
| E1 | ✅ | todo o lib | **Nenhum estado é sinalizado só por cor.** Todos os `Badge` têm texto; os pontos coloridos são `aria-hidden` e sempre acompanhados de rótulo: `packages/blocks/src/social/social-accounts.tsx:269`+`:276`, `packages/blocks/src/social/social-logs.tsx:110`+`:115`, `packages/blocks/src/operacao/ops-health.tsx:256`+`:263`, `packages/blocks/src/relatorios/meta-conversion.tsx:199`+`:216`, `packages/blocks/src/financeiro/finance-overview.tsx:277`+`:281`. | — |
| E2 | **baixo** | `packages/blocks/src/financeiro/finance-overview.tsx:253`–`:258` | As barras do gráfico distinguem "Compareceu/Faltou" **só por cor** (`bg-accent` vs `bg-accent-soft`); a legenda existe, mas o texto da legenda é `.bloco-micro` → `--text-muted`, que em Daylight está a 3,29:1 — o único decodificador da cor está ilegível. | Corrigir A1/A3 (a legenda passa a 6,37/6,02) e/ou marcar a barra com `title` + padrão (borda inferior) além da cor |

### 3.4 Consistência entre blocos (mesmo status → mesma cor?)

| # | Sev. | Onde | Problema | Correção |
|---|---|---|---|---|
| D1 | **alto** | `packages/blocks/src/agenda/follow-up-tasks.tsx:70` (`pendente → info`), `packages/blocks/src/relatorios/meta-conversion.tsx:55` (`pendente → warn`), `packages/blocks/src/social/social-logs.tsx:64` (`pendente → neutral`) | **O mesmo estado "pendente" tem 3 cores diferentes** na biblioteca (azul / âmbar / cinza). O usuário não consegue transferir o significado entre telas. | Padronizar `pendente → warn` (é o estado que pede ação, e já é o mais usado: 2 de 3) em um **mapa de status compartilhado** (hoje cada bloco declara o seu próprio `STATUS_TONE`) |
| D2 | **médio** | `packages/blocks/src/atendimento/channel-connections.tsx:78` (`pendente → warn`), `packages/blocks/src/administracao/office-team.tsx:74` (`invited → warn`), `packages/blocks/src/administracao/office-team.tsx:75` (`suspended → neutral`), `packages/blocks/src/administracao/office-team.tsx:87` (`expired → neutral`), `packages/blocks/src/social/social-logs.tsx:64` (`pendente → neutral`) | `neutral` virou "sem estado" genérico (suspenso, expirado, pendente) enquanto `pendente` também é warn — cinza e âmbar passam a significar a mesma coisa. | Definir `neutral` = **neutro/sem informação** apenas (cancelado, expirado) e reservar warn para "pendente de ação" |
| D3 | **médio** | `packages/blocks/src/agenda/agenda-board.tsx:71`–`:77` vs `packages/blocks/src/agenda/follow-up-tasks.tsx:69`–`:74` | A esc Agenda e a esc Follow-up usam ladders paralelos mas **não idênticos**: agenda `confirmado → accent`, follow-up `em_andamento → accent`; agenda `cancelado → neutral`, follow-up não tem equivalente. O bloco `reports-funnel.tsx:47` e `meta-conversion.tsx:66` repetem o funil `new→info / qualified→accent / customer→success` de forma consistente (✅ ponto positivo). | Extrair um `statusTone()` único em `packages/blocks/src/shared/index.tsx` (que hoje só tem `humanize()` e `recipe()`) e reutilizá-lo nos 7 blocos |
| D4 | ✅ | `packages/blocks/src/administracao/admin-platform.tsx:55`–`:59`, `office-team.tsx:72`–`:88`, `channel-connections.tsx:76`–`:80` | `ativo → success`, `erro → danger`, `trial → info` são consistentes entre esses blocos. | — |

### 3.5 Vidro, tokens e hex

| # | Sev. | Onde | Problema | Correção |
|---|---|---|---|---|
| F1 | **baixo** | `packages/ui/src/field.tsx:118` | Único hex da biblioteca: `#8e8e96` hardcoded no data-URI do chevron do `<select>`. Não está em `className` (critério 3 ok), mas está **fora dos tokens** e é o mesmo cinza nos 3 temas (no Aurora fica claro demais, no Graphite escuro demais). | Trocar por SVG inline com `fill="currentColor"` + `text-fg-muted`, ou por `mask-image` com `background-color: var(--text-muted)` |
| F2 | ✅ | `packages/*/src` | **Zero hex em `className`**. As 3 ocorrências restantes de `rgba()` literal (`packages/ui/src/button.tsx:22`, `packages/ui/src/field.tsx:234`) são sombras especulares internas — aceitáveis como gradiente decorativo, mas o ideal é token (`--shadow-inset`). | (opcional) `--shadow-inset: 0 1px 0 rgba(255,255,255,0.16)` |
| V1 | **baixo** | `packages/tokens/src/styles.css:130`–`:133` | No Aurora e no Graphite o vidro funciona bem (fundo escuro, reflexo visível, borda 0,11/0,08). O problema é só o Daylight (A17). | — |

---

## 4. Tokens

### 4.1 Tokens definidos e **não usados** (dead code de token)

| Token | Onde | Observação |
|---|---|---|
| `--accent-2`, `--accent-2-soft` | `styles.css:150`–`:151` (aurora), `:204`–`:205` (daylight), `:258`–`:259` (graphite) + aliases `:547`–`:548` | Nenhum uso em `packages/*/src`. Ou remover, ou documentar como acento secundário |
| `--bg-elevated` | `:123`, `:177`, `:231` + alias `:522` | Nunca usado (nenhum `bg-elevated`) |
| `--text-inverse` | `:144`, `:198`, `:252` + alias `:541` | Nunca usado (nenhum `text-fg-inverse`) |
| `--accent-pink`, `--accent-yellow`, `--accent-mint`, `--accent-indigo` | `:38`, `:40`, `:43`, `:44` | Primitivos nunca usados |
| `--n-0` … `--n-900` (13 tokens) | `:17`–`:31` | Só `--n-950` e `--n-1000` são usados (pelos temas). A escala de neutros está praticamente morta |
| `--sp-1` … `--sp-24` (16 tokens) | `:72`–`:83` | Escala de espaçamento morta — o código usa a escala do Tailwind (`gap-2`, `p-3`…). Risco de os dois se divergirem |
| `--dur-1`, `--dur-5`, `--ease-in-out`, `--blur-sm`, `--blur-xl` | `:99`, `:103`, `:97`, `:106`, `:107` | Não usados |
| `--density-row-y`, `--density-gap` | `:112`, `:114` | `--density-card-p` é o único token de densidade em uso |
| `--radius-xs`…`--radius-pill`, `--shadow-bloco-1`…`--shadow-bloco-glow`, `--ease-out-bloco` | `:562`–`:577` | Aliases Tailwind sem nenhuma classe correspondente no código (`rounded-md`, `shadow-bloco-2` não existem) |

### 4.2 Tokens **faltando** (necessários para fechar o critério 3)

| Token novo | Valor proposto | Por quê |
|---|---|---|
| `--accent-ink` (acento usado como **texto**) | Aurora `#5eb3ff` · Daylight `#0069d6` · Graphite `#a5a5ff` | Hoje o mesmo `--accent` é preenchimento **e** texto. Matematicamente não dá para os dois papéis no Aurora: para o rótulo branco exigir 4,5 o accent precisa de luminância ≤ 0,1833, e para o mesmo accent como texto sobre `#050506` exigir 4,5 precisa ≥ 0,1818 — janela de 0,0015, inviável e frágil. Separar em 2 tokens: `--accent` (fill) + `--accent-ink` (texto). Custo: 26 pontos `text-accent` → `text-accent-ink` |
| `--danger-fg` (rótulo sobre preenchimento destrutivo) | Aurora `#0b0b0d` · Daylight `#ffffff` · Graphite `#0b0b0d` | Elimina o `text-white` literal de `button.tsx:29` e resolve 3,41 / 2,78:1 |
| `--border-input` (borda de campo) | Aurora `rgba(255,255,255,0.36)` · Daylight `rgba(0,0,0,0.46)` · Graphite `rgba(255,255,255,0.36)` | 132/132 bordas reprovam 3:1; a borda é o único sinal de fronteira do campo |
| `--text-placeholder` | igual ao `--text-faint` corrigido (Aurora `rgba(255,255,255,0.50)` · Daylight `rgba(29,29,31,0.64)` · Graphite `rgba(237,237,240,0.52)`) | O placeholder herda `--text-faint` (2,09–2,73:1). Placeholder é texto: precisa de token próprio, auditável |
| `--text-disabled` + `--disabled-opacity` | Daylight `#6e6e73` + `0.85`; Aurora `rgba(255,255,255,0.45)` + `0.45`; Graphite `rgba(237,237,240,0.45)` + `0.50` | `disabled:opacity-45` é global e quebra em tema claro (1,22:1) |
| `--surface-tint` | com alfa, por tema | Separa "superfície" (opaca) de "tinta sobre superfície" (com alfa) e resolve A18 |

---

## 5. O que já está bom

1. **Zero hex em `className`** em `packages/*/src` — o critério 3 passa nessa parte. As únicas
   cores literais são 2 sombras especulares e 1 data-URI de ícone (F1/F2).
2. **Nenhum estado sinalizado só por cor.** Todo `Badge` tem texto; todo ponto colorido é
   `aria-hidden` e vem com rótulo ao lado (E1). A rubrica exige isso e está cumprido.
3. **Arquitetura de token exemplarar**: 3 temas (`aurora`/`daylight`/`graphite`) com o **mesmo
   conjunto** de nomes semânticos, `--text`/`--text-secondary`/`--text-muted`/`--text-faint`
   como escada de 4 níveis, `*-soft` pareado com cada cor de estado, e `@theme inline` expondo
   tudo ao Tailwind. A **fonte única** que a tarefa exige já existe — os problemas são de
   *calibração*, não de estrutura. Por isso todas as correções proposals cabem em
   `packages/tokens/src/styles.css`.
4. **O tema Aurora é sólido**: apenas 2,0% de falha (214 de 10.905) e ela está concentrada em
   6 grupos — acento como texto (75), borda de input (45), branco sobre acento/danger (44),
   `--text-faint` (43), desabilitado (5) e badge danger (2). A escada de texto
   (17,9 / 10,4 / 5,3 / 4,55) está certa e serve de referência.
5. **O tema Graphite é o mais bem calibrado** para estados: success 7,19 · warn 7,24 ·
   danger 5,38 · info 6,94 — todos bem acima de 4,5. O botão primário com rótulo escuro
   (`--accent-text: #0b0b0d` sobre `#7c7cff`) dá 5,79:1 — o padrão correto de rótulo
   sobre preenchimento saturado, que Aurora e Daylight não seguem.
6. **A receita de vidro está implementada como o DS §4 descreve**: fundo translúcido +
   `backdrop-filter: blur(24px) saturate(180%)` + reflexo especular de 1px com
   `mask-composite: exclude` (`styles.css:290`–`:324`), e `--glass-bg`/`--glass-bg-strong`
   separados. Em Aurora e Graphite o vidro entrega profundidade de verdade.
7. **A hierarquia de texto é consistente**: `.bloco-display`→`.bloco-micro` com escala
   própria e `letter-spacing` negativo nos títulos — nenhum `font-size` arbitrário fora da
   escala (a rubrica do critério 4 não foi violada pela cor).
8. **O gradiente decorativo de aurora** (`styles.css:327`–`:345`) usa **tokens**
   (`--aurora-1/2/3`), não hex — é a exceção documentada da rubrica e está correta.
9. **`scripts/qa-visual.py` / `qa-automatic.py` existem e rodam** — o problema é a lógica do
   contraste (A19), não a ausência de ferramenta. Com a correção de A19, o gate automático
   passa a ser útil para o critério 3.

---

## 6. Proposta de paleta consolidada (fonte única: `packages/tokens/src/styles.css`)

Cada valor abaixo foi verificado por cálculo WCAG contra os **fundos compostos medidos**
(vidro, gradiente aurora, `bg-surface/NN`, soft de estado).

| Token | Aurora | Daylight | Graphite |
|---|---|---|---|
| `--accent` (preenchimento) | `#0069d6` *(branco 5,26)* | `#0069d6` *(branco 5,26)* | `#7c7cff` *(mantém)* |
| `--accent-hover` | `#0071e3` *(branco 4,70)* | `#005bb8` *(branco 6,59)* | `#9494ff` *(mantém)* |
| `--accent-text` (rótulo no fill) | `#ffffff` *(mantém)* | `#ffffff` *(mantém)* | `#0b0b0d` *(mantém)* |
| **`--accent-ink`** (acento como texto) | `#5eb3ff` *(5,71 pior caso medido)* | `#0069d6` *(4,83)* | `#a5a5ff` *(7,59)* |
| `--accent-soft` | `rgba(0, 105, 214, 0.16)` | `rgba(0, 105, 214, 0.10)` | `rgba(124, 124, 255, 0.14)` *(mantém)* |
| `--text-secondary` | `rgba(255,255,255,0.82)` | `rgba(29,29,31,0.82)` | `rgba(237,237,240,0.74)` *(mantém)* |
| `--text-muted` | `rgba(255,255,255,0.60)` | `rgba(29,29,31,0.72)` | `rgba(237,237,240,0.58)` |
| `--text-faint` | `rgba(255,255,255,0.50)` | `rgba(29,29,31,0.64)` | `rgba(237,237,240,0.52)` |
| `--success` | `#30d158` *(mantém)* | `#1e7a34` | `#3ddc84` *(mantém)* |
| `--warn` | `#ff9f0a` *(mantém)* | `#a34800` | `#ffb340` *(mantém)* |
| `--danger` | `#ff453a` *(mantém)* | `#c3000f` | `#ff6b6b` *(mantém)* |
| **`--danger-fg`** (rótulo destrutivo) | `#0b0b0d` *(5,77)* | `#ffffff` *(5,38)* | `#0b0b0d` *(7,09)* |
| `--info` | `#40c8e0` *(mantém)* | `#0a6f8f` | `#5ac8fa` *(mantém)* |
| **`--border-input`** | `rgba(255,255,255,0.36)` *(3,15)* | `rgba(0,0,0,0.46)` *(3,42)* | `rgba(255,255,255,0.36)` *(3,15)* |
| **`--text-placeholder`** | `rgba(255,255,255,0.50)` | `rgba(29,29,31,0.64)` | `rgba(237,237,240,0.52)` |

**Mudanças de código (mínimas e pontuais, nenhuma com hex):**
`packages/ui/src/button.tsx:29` → `bg-danger text-danger-fg`;
`packages/ui/src/field.tsx:48` → `placeholder:text-fg-placeholder`;
`packages/ui/src/field.tsx:67,90,113` → `border-border-input`;
26 pontos `text-accent` → `text-accent-ink` em `packages/*/src`;
`packages/blocks/src/shared/index.tsx` → mapa `statusTone()` compartilhado (D1/D2/D3).

**Ordem sugerida:** (1) A19 (consertar o checker) → (2) A1–A5 (escala de texto — 80 % das falhas)
→ (3) A6–A12 (acentos e estados) → (4) A14/A15 (campos e disabled) → (5) A17/A18 (vidro e superfície)
→ (6) D1–D3 (consistência de status). Reexecutar `scripts/qa-contraste.py` para revalidar.

---

## 7. Artefatos gerados

| Arquivo | Conteúdo |
|---|---|
| `scripts/qa-contraste.py` | Coleta de contraste real por pixel (Playwright), 3 temas, 170 telas |
| `scripts/qa-contraste-pares.py` | Gera a tabela de pares da seção 1 |
| `scripts/qa-contraste-resumo.py` | Agregados por tema / cor / tipo |
| `scripts/qa-cores-capturas.py` | Capturas do mesmo bloco nos 3 temas |
| `docs/qa-cores/contraste-todo.json` | 32.585 medições únicas com fundo, texto renderizado, razão e mínimo |
| `docs/qa-cores/contraste-{aurora,aurora2,daylight,graphite}.json` | Lotes brutos da coleta |
| `docs/qa-cores/*.png` | 15 capturas (5 blocos × 3 temas) |
| `docs/qa-resultado.json` | Saída do `qa-automatic.py` (regerada; 0 achados de cor — ver A19) |
