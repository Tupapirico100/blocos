# QA — rodada 3 (verificador final): critérios 7, 9 e 10

**Alvo:** confirmar 100/100 nos critérios 7 (estados), 9 (movimento) e 10 (acessibilidade)
da rubrica [`QA-RUBRICA.md`](./QA-RUBRICA.md).
**Ambiente:** catálogo estático já no ar em `http://localhost:4173` (build de 17/11 21:49 — nenhum
arquivo-fonte é mais novo que o `dist`, ou seja, medi o código atual). Chromium 1243 via Playwright
1.63 (Python). Scripts de medição em `/tmp/qa/` (fora do repo). Capturas em `docs/qa-r3/`.

> **Nota de método:** `page.accessibility.snapshot()` foi removido no Playwright 1.63. Usei o
> **mesmo motor**: a árvore de acessibilidade do Chromium via CDP `Accessibility.getFullAXTree`,
> filtrada pelo `backendNodeId` de cada bloco (papel, nome, `checked/selected/expanded/pressed`
> vieram da AX tree, nunca de `innerText`).

## 1. Nota por critério

| Critério | Nota | Evidência (medida, não inspecionada) |
|---|---|---|
| **7 — Estados completos** | **8/10** | 29 blocos × 5 estados = **145 renderizações medidas**, **zero** falha de implementação: loading 100% com skeleton que descreve a forma (2–9 blocos de forma, **0 spinners soltos** em 29/29); success 29/29 com conteúdo real (189–4007 chars, 0 skeleton, 0 alert); empty 29/29 — **14/14** blocos com `recipe.emptyAction` mostram o botão com o rótulo da receita e **15/15** sem `emptyAction` **não têm botão nenhum** (nenhum bloco inventa ação); error **29/29** com `role="alert"`; forbidden **29/29** com `role="alert"` e **28/29** nomeando o papel; ConnectorLock **12/12** nos blocos com conector externo (`"… nao esta conectado"` + `"Apenas o dono da plataforma pode provisionar"`), `integration-manifest` = exceção consciente do manifesto. **Ressalva (1 bloco):** `clinical-entry` não nomeia o papel no estado "Sem permissão" → P3. |
| **9 — Movimento** | **8/10** | Inventário em runtime dos 29 blocos: **transição CSS máxima 420 ms** (`--dur-4`), motion/react **180/240/320 ms** — nada acima de 420 ms; **curva única `cubic-bezier(0.32,0.72,0,1)` (ease-apple)** em todos os elementos, **zero** elemento com a curva default do Tailwind `cubic-bezier(0.4,0,0.2,1)` (a única exceção é `--ease-spring`, token do DS, no knob do switch); `prefers-reduced-motion` desliga **transform** do motion/react (congelado em `matrix(1,0,0,1,0,8)`; só a opacidade faz fade — semântica de `MotionConfig reducedMotion="user"`) e **transições CSS** (0.18 s → 0.001 s); **CLS 0,028** na troca dos 29 blocos, **0,037** na troca de variantes, **0,025** na troca de estado, **0,002** na troca de tema/densidade — todos abaixo do limiar 0,1, maior shift individual 0,0135 e com origem apenas no chrome do catálogo (segmented de variante + painel de receita), nunca no conteúdo do bloco. **Ressalva:** o `prefers-reduced-motion` **não desliga** as duas animações de loop CSS (skeleton shimmer e spinner) → P1. |
| **10 — Acessibilidade e semântica** | **8/10** | Árvore de acessibilidade do Chromium nos 29 blocos × 5 estados: **0 controles interativos sem nome acessível** (button/link/radio/checkbox/textbox/combobox/switch/option — nomes conferidos no código: `aria-label`, `aria-labelledby`, `<label for>` ou `<label>` implícito com `span.sr-only`); `aria-checked` correto (1 marcado por radiogroup, 4 groups × 3 blocos; switches true/false conferidos), `aria-selected` correto nas `<select>`, `aria-pressed` correto na grade da agenda (1 `true` / 9 `false`), `aria-expanded` correto no disclosure do inbox (`false`→`true` com o painel aparecendo); **34 `th` em 7 estados de bloco, 100% com `scope="col"`**; `html lang="pt-BR"`, **1 `<main>`**; `role="alert"` em 29/29 erro, 29/29 forbidden e no `ConsentGate`; `role="status"` no `Spinner` (`packages/ui/src/button.tsx:85`) e no `ToastStack` (`packages/ui/src/feedback.tsx:103`); dialog com `aria-modal="true"`, foco preso (**20 Tab/Shift+Tab, 100% dentro**), `Esc` fecha e **foco restaurado** no gatilho (`"Cancelar atendimento"`); Drawer idem (14 Tabs presos, foco restaurado em `"Receita"`); **0 erros de console** em todas as passagens. **Ressalva:** hierarquia de headings inconsistente (5 blocos com salto h1→h3 e 3 com um 2º h1) → P2. |

**Soma dos três critérios: 24/30.** As outras 7 dimensões da rubrica não estão no escopo desta rodada.

## 2. Os 29 blocos × os 6 estados

`loading` = skeleton que descreve a forma · `success` = conteúdo real · `empty` = ação conforme a receita ·
`error`/`forbidden` = `role="alert"` · `bloqueio` = ConnectorLock (n/a = bloco só usa infra do programa).

| Bloco | loading | success | empty | error | forbidden | bloqueio conector |
|---|---|---|---|---|---|---|
| `auth-login` | OK · 7 blocos / 0 spinner | OK · 462 chars | OK · sem acao (dado so) | OK · role=alert | OK · dono do consultorio, funcionario | n/a · so infra |
| `auth-two-factor` | OK · 7 blocos / 0 spinner | OK · 601 chars | OK · sem acao (dado so) | OK · role=alert | OK · dono do consultorio, funcionario | n/a · so infra |
| `auth-recovery` | OK · 7 blocos / 0 spinner | OK · 189 chars | OK · sem acao (dado so) | OK · role=alert | OK · dono do consultorio, funcionario | n/a · so infra |
| `admin-platform` | OK · 7 blocos / 0 spinner | OK · 1073 chars | OK · botao 'Novo consultorio' | OK · role=alert | OK · administrador da plataforma, dono do consultorio | n/a · so infra |
| `office-team` | OK · 7 blocos / 0 spinner | OK · 1263 chars | OK · botao 'Convidar membro' | OK · role=alert | OK · dono do consultorio | n/a · so infra |
| `office-settings` | OK · 7 blocos / 0 spinner | OK · 1658 chars | OK · botao 'Conectar canal' | OK · role=alert | OK · administrador da plataforma, dono do consultorio, recepcionista | OK · ConnectorLock |
| `leads-board` | OK · 9 blocos / 0 spinner | OK · 1351 chars | OK · sem acao (dado so) | OK · role=alert | OK · dono do consultorio, funcionario, recepcionista | n/a · so infra |
| `inbox-whatsapp` | OK · 7 blocos / 0 spinner | OK · 753 chars | OK · sem acao (dado so) | OK · role=alert | OK · dono do consultorio, funcionario, recepcionista | OK · ConnectorLock |
| `consent-panel` | OK · 6 blocos / 0 spinner | OK · 1052 chars | OK · botao 'Registrar consentimento' | OK · role=alert | OK · dono do consultorio, funcionario, recepcionista | n/a · so infra |
| `channel-connections` | OK · 6 blocos / 0 spinner | OK · 1077 chars | OK · botao 'Reconectar canal' | OK · role=alert | OK · dono do consultorio | OK · ConnectorLock |
| `patients-list` | OK · 5 blocos / 0 spinner | OK · 894 chars | OK · sem acao (dado so) | OK · role=alert | OK · dono do consultorio, funcionario, recepcionista | n/a · so infra |
| `patient-chart` | OK · 3 blocos / 0 spinner | OK · 1236 chars | OK · sem acao (dado so) | OK · role=alert | OK · dono do consultorio, funcionario, recepcionista | n/a · so infra |
| `clinical-entry` | OK · 2 blocos / 0 spinner | OK · 390 chars | OK · botao 'Registrar atendimento' | OK · role=alert | FALTA · nao nomeia papel | n/a · so infra |
| `agenda-board` | OK · 7 blocos / 0 spinner | OK · 815 chars | OK · sem acao (dado so) | OK · role=alert | OK · dono do consultorio, funcionario, recepcionista | n/a · so infra |
| `availability` | OK · 7 blocos / 0 spinner | OK · 507 chars | OK · botao 'Definir horário' | OK · role=alert | OK · dono do consultorio, funcionario | n/a · so infra |
| `follow-up-tasks` | OK · 7 blocos / 0 spinner | OK · 746 chars | OK · sem acao (dado so) | OK · role=alert | OK · dono do consultorio, funcionario | OK · ConnectorLock |
| `packages-pricing` | OK · 7 blocos / 0 spinner | OK · 790 chars | OK · botao 'Novo pacote' | OK · role=alert | OK · dono do consultorio | n/a · so infra |
| `payments-checkout` | OK · 7 blocos / 0 spinner | OK · 509 chars | OK · botao 'Novo pagamento' | OK · role=alert | OK · dono do consultorio, funcionario, recepcionista | n/a · so infra |
| `finance-overview` | OK · 7 blocos / 0 spinner | OK · 496 chars | OK · sem acao (dado so) | OK · role=alert | OK · dono do consultorio | n/a · so infra |
| `reports-funnel` | OK · 7 blocos / 0 spinner | OK · 638 chars | OK · sem acao (dado so) | OK · role=alert | OK · dono do consultorio | n/a · so infra |
| `meta-conversion` | OK · 7 blocos / 0 spinner | OK · 921 chars | OK · sem acao (dado so) | OK · role=alert | OK · dono do consultorio | OK · ConnectorLock |
| `social-accounts` | OK · 2 blocos / 0 spinner | OK · 1402 chars | OK · botao 'Conectar conta' | OK · role=alert | OK · administrador da plataforma, dono do consultorio | OK · ConnectorLock |
| `social-composer` | OK · 7 blocos / 0 spinner | OK · 1408 chars | OK · botao 'Publicar' | OK · role=alert | OK · dono do consultorio, nutricionista, recepcionista | OK · ConnectorLock |
| `social-automations` | OK · 7 blocos / 0 spinner | OK · 966 chars | OK · sem acao (dado so) | OK · role=alert | OK · dono do consultorio, nutricionista, recepcionista | OK · ConnectorLock |
| `social-logs` | OK · 7 blocos / 0 spinner | OK · 1310 chars | OK · sem acao (dado so) | OK · role=alert | OK · dono do consultorio, nutricionista, recepcionista | OK · ConnectorLock |
| `webhooks-panel` | OK · 7 blocos / 0 spinner | OK · 1351 chars | OK · sem acao (dado so) | OK · role=alert | OK · administrador da plataforma, dono do consultorio | OK · ConnectorLock |
| `agent-console` | OK · 7 blocos / 0 spinner | OK · 1567 chars | OK · botao 'Ativar agente' | OK · role=alert | OK · administrador da plataforma, dono do consultorio | OK · ConnectorLock |
| `ops-health` | OK · 7 blocos / 0 spinner | OK · 1239 chars | OK · botao 'Executar backup' | OK · role=alert | OK · administrador da plataforma, dono do consultorio | OK · ConnectorLock |
| `integration-manifest` | OK · 7 blocos / 0 spinner | OK · 4007 chars | OK · botao 'Provisionar conector' | OK · role=alert | OK · administrador da plataforma, dono do consultorio | excecao · painel do manifesto |

### 2.1 Resumo do quadro por bloco

| Métrica | Resultado |
|---|---|
| Blocos com os 5 estados implementados | **29/29** |
| Loading com skeleton (≥2 blocos de forma) | **29/29** — 0 spinner solto |
| Success com conteúdo real | **29/29** |
| Empty com o botão da receita (quando `emptyAction` existe) | **14/14** |
| Empty **sem** botão quando o dado chega sozinho | **15/15** — 0 ação inventada |
| Error com `role="alert"` | **29/29** |
| Forbidden com `role="alert"` | **29/29** |
| Forbidden **nomeando o papel** que falta | **28/29** — falta `clinical-entry` (P3) |
| Bloqueio por conector externo (ConnectorLock) | **12/12** — `integration-manifest` = exceção do manifesto |
| Erros de console | **0** |

## 3. Problemas restantes

### P1 — Critério 9 — `prefers-reduced-motion` NÃO desliga as animações de loop CSS (vira estroboscópio)

* **Arquivos:** `packages/tokens/src/styles.css:555-564` (bloco `@media (prefers-reduced-motion: reduce)`)
  e `packages/tokens/src/styles.css:593` (`.bloco-skeleton { animation: bloco-shimmer 1.6s ease-in-out infinite; }`);
  `packages/ui/src/button.tsx:87` (`animate-spin` do `Spinner`).
* **Medida** (contexto `reduced_motion="reduce"`, Chromium 1243):
  * `getComputedStyle(.bloco-skeleton).animationDuration` = **0.001s**, `animationName` = `bloco-shimmer`,
    `animationIterationCount` = **infinite** → a animação continua, só que acelerada;
  * `background-position` do skeleton salta de `-112%` para `195%` entre frames consecutivos;
  * spinner (`animate-spin`): `animationDuration` = **0.001s**, rotação salta **108°/frame (mediana)** e
    **144°/frame (máximo)**, contra **6°/frame** no modo normal — ou seja, ~1000 ciclos/s (flash);
  * no modo normal o mesmo código dá `1.6s ease-in-out infinite` e `1s linear infinite`, com 6°/frame.
* **Causa raiz:** a regra global `* { animation-duration: 1ms !important; }` encurta a animação sem
  desligá-la; `animation: none` só é aplicado às classes `.bloco-anim-fade-up/-fade/-scale`.
* **Correção concreta** (em `packages/tokens/src/styles.css`, dentro do bloco de reduced-motion):
  ```css
  @media (prefers-reduced-motion: reduce) {
    .bloco-anim-fade-up, .bloco-anim-fade, .bloco-anim-scale { animation: none !important; }
    .bloco-skeleton, .animate-spin { animation: none !important; }   /* <- desliga os loops */
    * { transition-duration: 1ms !important; }
  }
  ```
  (mantendo `transition-duration: 1ms`, que já desliga as transições corretamente).

### P2 — Critério 10 — hierarquia de headings inconsistente (salto h1→h3 e 2º h1 na mesma página)

* **Arquivos:**
  * `packages/blocks/src/atendimento/leads-board.tsx:159`,
    `packages/blocks/src/atendimento/consent-panel.tsx:184`,
    `packages/blocks/src/atendimento/channel-connections.tsx:162`,
    `packages/blocks/src/clinico/patient-chart.tsx:127`,
    `packages/blocks/src/clinico/clinical-entry.tsx:144` → `<h3 class="bloco-title3">` como título de topo,
    **sem nenhum `<h2>`** no documento renderizado;
  * `packages/blocks/src/identidade/auth-login.tsx:221`, `packages/blocks/src/identidade/auth-recovery.tsx:337`,
    `packages/blocks/src/identidade/auth-two-factor.tsx:531` → `<h1>` dentro do bloco, deixando a página
    com **dois `h1`** (`Blocos` + o título do bloco);
  * referência do nível usado pelos outros 22 blocos: `packages/ui/src/surface.tsx:68` (`SectionHeader` → `<h2>`).
* **Medida** (sequência de headings renderizados na página, em **todas** as variantes):
  * `leads-board`, `consent-panel`, `channel-connections`, `patient-chart`, `clinical-entry` → `[1, 3, …]`
    → **salto de h1 para h3** (o nível h2 é omitido);
  * `auth-login`, `auth-recovery` → `[1, 1]` → **dois h1**; `auth-two-factor` → `[1]` na variante padrão e
    `[1]` extra na variante de código de recuperação.
* **Correção concreta:** padronizar o título de topo do bloco em **h2** nos 5 blocos com h3 e trocar os
  `<h1>` de `auth-login`/`auth-recovery`/`auth-two-factor` por `<h2>`; ou, se a hierarquia for responsabilidade
  do host, o catálogo renderizar o título do bloco como `<h2>`
  (`apps/catalog/src/BlockStage.tsx:104-106`, hoje `<p class="bloco-micro">`).

### P3 — Critério 7 — `clinical-entry`: estado "Sem permissão" não nomeia o papel que falta

* **Arquivos:** `packages/blocks/src/clinico/clinical-entry.tsx:80` (`const blocked = state === "forbidden" || !hasConsent;`)
  e `packages/blocks/src/clinico/clinical-entry.tsx:101-109` (retorna `ConsentGate` antes do `BlockFrame`).
* **Medida:** com o estado "Sem permissao" selecionado, o bloco renderiza
  `"Gravacao bloqueada — Gravacao bloqueada: sem consentimento de tratamento. O prontuario de Ana Beatriz Souza
  so aceita gravar consultas e medidas com consentimento de tratamento vigente (art. 11)…"`
  → tem `role="alert"` (1), mas **nenhum papel nomeado**; os outros **28/29** blocos exibem
  `"Esta area e visivel apenas para dono do consultório ou recepcionista ou funcionário…"`.
  Captura: `docs/qa-r3/estados/clinical-entry-5-forbidden.png`.
* **Correção concreta:** deixar o `BlockFrame` tratar `state === "forbidden"` (remover `state === "forbidden"`
  da linha 80) e manter o `ConsentGate` apenas para o caso `!hasConsent` (falta de consentimento no dado).
  Assim o estado forbidden passa a dizer o papel, e o portão de consentimento continua existindo.

### Observações (não derrubam a nota)

* **O1** — `admin-platform` mostra o botão com o rótulo `"Novo consultorio"`
  (`packages/blocks/src/administracao/admin-platform.tsx:292` e `:311`) enquanto a receita declara
  `"Novo consultório"` (`packages/blocks/src/administracao/admin-platform.recipe.ts:86`). Mesma ação
  (`admin.office.create`), só falta a cedilha no rótulo do componente.
* **O2** — `data-[state=active]:bloco-anim-fade-up` (`packages/ui/src/overlay.tsx:159`) **não gera regra
  no CSS compilado** (a classe está em `@layer components` e não é `@utility`), então o fade-up das abas
  da receita nunca roda. Não viola a rubrica (nada "pula"), mas é movimento morto.
* **O3** — `transition={{ duration: 0.18 }}` em `packages/ui/src/overlay.tsx:42` e `:228` usa a curva
  default do motion (easeOut) em vez da `ease-apple` do DS; afeta só o fade de opacidade do overlay.
* **O4** — `--dur-5: 700ms` (`packages/tokens/src/styles.css:107`) está definido e **não é usado** em lugar
  nenhum — nenhuma transição passa de 420 ms.
* **O5** — a regra global de reduced-motion (`animation-duration: 1ms !important`) tem o mesmo efeito de
  estroboscópio no `Spinner` de qualquer `Button loading` (mesma causa de P1).

## 4. O que impede a nota 10 em cada critério

| Critério | O que impede 10 |
|---|---|
| 7 (Estados) | **P3** — 1 de 29 blocos (`clinical-entry`) entrega `role="alert"` no estado "Sem permissão" sem **nomear o papel** que falta. Basta o `BlockFrame` tratar esse estado. |
| 9 (Movimento) | **P1** — com `prefers-reduced-motion: reduce`, as duas animações de loop CSS (skeleton shimmer e spinner) continuam rodando a **0,001 s/ciclo** (≈1000 Hz, rotação de 108°/frame no spinner). Nada "pula" (CLS ≤ 0,037) e nenhuma transição passa de 420 ms com curva fora da ease-apple; o defeito é o loop que não é desligado. |
| 10 (Acessibilidade) | **P2** — 5 blocos começam em `h3` sem `h2` no documento (salto h1→h3) e 3 blocos renderizam um segundo `h1`. Todo o resto (nomes acessíveis via AX tree, ARIA, `th scope`, `lang`, `<main>`, `role="alert"/"status"`, `aria-modal`, foco preso e restaurado, 0 erro de console) está medido e 100% dentro. |

## 5. Onde estão as evidências

* Capturas por bloco e por estado: `docs/qa-r3/estados/` — 145 estados (29 × 5) + 13 bloqueios de conector.
* Movimento: `docs/qa-r3/movimento/skeleton-normal.png` e `docs/qa-r3/movimento/skeleton-reduce.png`.
* Diálogo: `docs/qa-r3/a11y/dialog-foco-preso.png`.
* Scripts de medição (fora do repo): `/tmp/qa/c7.py`, `/tmp/qa/c9.py`, `/tmp/qa/c9b.py`, `/tmp/qa/c9d.py`,
  `/tmp/qa/c10.py` (DOM), `/tmp/qa/c10b.py` (AX tree via CDP), `/tmp/qa/c10c.py`/`c10d.py` (foco, Esc, headings),
  `/tmp/qa/capturas.py`. Resultados crus em `/tmp/qa/c7.json`, `c9.json`, `c9b.json`, `c10.json`, `c10b.json`.
