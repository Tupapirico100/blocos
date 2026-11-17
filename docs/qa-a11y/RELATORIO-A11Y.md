# Auditoria de Acessibilidade e Movimento — biblioteca "Blocos"

**Snapshot auditado:** build `apps/catalog/dist` de 2026-11-17 18:59:32 (UTC), fonte de `packages/` e `apps/` no mesmo instante.
**Método:** Playwright + Chromium 1243 (`/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome`), árvore de acessibilidade real via CDP (`Accessibility.getFullAXTree`), varredura de teclado real, contexto `reduced_motion="reduce"`, `scripts/qa-automatic.py`.
**Scripts e evidência:** `docs/qa-a11y/` (`ax.json`, `semantica.json`, `foco.json`, `tab.json`, `movimento.json`, `movimento-reduced.json`, `estados.json`, `foco-input.png`, `foco-sidebar.png`).
**Nenhum arquivo de biblioteca foi editado.**

> Observação: durante a auditoria o repositório recebeu alterações de outro agente (o `Switch`/`Checkbox` deixaram de depender do `<label>` implícito, `ConfirmDialog` foi criado, `Button` passou a ter `type="button"` por padrão). Os dados abaixo refletem o build das 18:59:32.

---

## 1. Notas por critério

| Critério | Nota | Veredito |
|---|---|---|
| **2 — Foco e ordem de tabulação** | **7/10** | Ordem de tabulação segue a ordem visual/DOM, sem saltos e sem focus-trap indevido. Anel do DS (`outline 2px accent` + `offset 2px`) presente em **todos** os botões/links dos 29 blocos. Falha: campos de formulárioindicator de 1px; botões da sidebar do catálogo usam o anel do navegador; `Drawer` (API pública) sem semântica de diálogo; foco não retorna ao gatilho ao fechar o `ConfirmDialog`. |
| **7 — Estados completos** | **4/10** | Os 5 estados existem em 29/29 blocos (via `BlockFrame`) e as receitas os declaram. Falha grave: **28/29** sem próxima ação no estado vazio, **28/29** com estado "sem permissão" genérico (não diz o papel), **21/29** com skeleton genérico (não descreve a forma), **18** blocos que exigem conector **fingem funcionar** quando o conector falta, **0/29** com `role="alert"`/`role="status"`. |
| **9 — Movimento** | **6/10** | Nenhuma transição passa de 420 ms (máx. 420 ms em `reports-funnel`); `ease-apple` é a curva majoritária; `ease-spring` só no botão do switch (permitido pelo DS). Falha: **112** transições usam a curva padrão do Tailwind em vez de `ease-apple`; **`prefers-reduced-motion` não desliga as animações JS do `motion/react`** (WAAPI 240 ms continua rodando); altura do palco muda 3–4× entre estados/variantes (pulo de layout). |
| **10 — Acessibilidade e semântica** | **6/10** | **0 controles interativos sem nome acessível** (árvore AX real), `aria-checked`/`aria-selected`/`aria-expanded` corretos, `th scope="col"` em 100% das tabelas, erros de formulário com `role="alert"`, `html lang="pt-BR"`, 100% da interface em português. Falha: falta landmark `main`; cabeçalhos com nível inconsistente (h1/h2/h3); "Ação mais recente" não é anunciado; `Segmented` usa `role="tab"` sem o padrão de teclado de tabs; nome do botão vira "Carregando" durante o loading; 11 grupos de botões com nome acessível duplicado. |

**Média dos quatro critérios: 5,75/10.**

---

## 2. Tabela por bloco — estados e conector

Legenda dos estados: **L** = loading, **V** = vazio, **E** = erro, **P** = sem permissão, **C** = bloqueio de conector (`ConnectorLock`).
"skel" = nº de retângulos do skeleton; "forma" = o skeleton descreve a forma do conteúdo (linhas/cartões) ou é o genérico do `BlockFrame`.
"Ação no vazio" = o estado vazio oferece a próxima ação.

| # | Bloco | L | V | E | P | C | Conector exigido (receita) | `requires` no `BlockFrame` | Skeleton | Ação no vazio | Papel no "sem perm." |
|---|---|:-:|:-:|:-:|:-:|:-:|---|---|---|---|---|
| 1 | auth-login | ✅ | ✅ | ✅ | ✅ | ✅ | database, email | ✅ | genérico (3) | ❌ | ❌ genérico |
| 2 | auth-two-factor | ✅ | ✅ | ✅ | ✅ | ✅ | database, email | ✅ | genérico (3) | ❌ | ❌ genérico |
| 3 | auth-recovery | ✅ | ✅ | ✅ | ✅ | ✅ | database, email | ✅ | genérico (3) | ❌ | ❌ genérico |
| 4 | admin-platform | ✅ | ✅ | ✅ | ✅ | ✅ | database | ✅ | genérico (3) | ✅ | ❌ genérico |
| 5 | office-team | ✅ | ✅ | ✅ | ✅ | ✅ | database, email | ✅ | genérico (3) | ❌ | ❌ genérico |
| 6 | office-settings | ✅ | ✅ | ✅ | ✅ | ✅ | database, whatsapp, webhooks | ✅ | genérico (3) | ❌ | ❌ genérico |
| 7 | leads-board | ✅ | ✅ | ✅ | ✅ | ❌ | database | ❌ **falta** | ✅ forma (9) | ❌ | ❌ genérico |
| 8 | inbox-whatsapp | ✅ | ✅ | ✅ | ✅ | ✅ | whatsapp, database | ✅ | ✅ forma (7) | ❌ | ❌ genérico |
| 9 | consent-panel | ✅ | ✅ | ✅ | ✅ | ❌ | database | ❌ **falta** | ✅ forma (6) | ❌ | ❌ genérico |
| 10 | channel-connections | ✅ | ✅ | ✅ | ✅ | ✅ | whatsapp, database | ✅ | ✅ forma (6) | ❌ | ❌ genérico |
| 11 | patients-list | ✅ | ✅ | ✅ | ✅ | ❌ | database | ❌ **falta** | ✅ forma (5) | ❌ | ❌ genérico |
| 12 | patient-chart | ✅ | ✅ | ✅ | ✅ | ❌ | database | ❌ **falta** | genérico (3) | ❌ | ❌ genérico |
| 13 | clinical-entry | ✅ | ✅ | ✅ | ✅ | ❌ | database | ❌ **falta** | ✅ forma (2) | ❌ | ✅ específico (consentimento) |
| 14 | agenda-board | ✅ | ✅ | ✅ | ✅ | ❌ | database | ❌ **falta** | genérico (3) | ❌ | ❌ genérico |
| 15 | availability | ✅ | ✅ | ✅ | ✅ | ❌ | database | ❌ **falta** | genérico (3) | ❌ | ❌ genérico |
| 16 | follow-up-tasks | ✅ | ✅ | ✅ | ✅ | ❌ | database, whatsapp | ❌ **falta** | genérico (3) | ❌ | ❌ genérico |
| 17 | packages-pricing | ✅ | ✅ | ✅ | ✅ | ❌ | database | ❌ **falta** | genérico (3) | ❌ | ❌ genérico |
| 18 | payments-checkout | ✅ | ✅ | ✅ | ✅ | ❌ | database, pdf | ❌ **falta** | genérico (3) | ❌ | ❌ genérico |
| 19 | finance-overview | ✅ | ✅ | ✅ | ✅ | ❌ | database | ❌ **falta** | genérico (3) | ❌ | ❌ genérico |
| 20 | reports-funnel | ✅ | ✅ | ✅ | ✅ | ❌ | database, storage | ❌ **falta** | genérico (3) | ❌ | ❌ genérico |
| 21 | meta-conversion | ✅ | ✅ | ✅ | ✅ | ✅ | meta_ads, database | ✅ | genérico (3) | ❌ | ❌ genérico |
| 22 | social-accounts | ✅ | ✅ | ✅ | ✅ | ✅ | instagram | ✅ | ✅ forma (2) | ❌ | ❌ genérico |
| 23 | social-composer | ✅ | ✅ | ✅ | ✅ | ❌ | instagram, storage | ❌ **falta** | genérico (3) | ❌ | ❌ genérico |
| 24 | social-automations | ✅ | ✅ | ✅ | ✅ | ❌ | instagram, database | ❌ **falta** | genérico (3) | ❌ | ❌ genérico |
| 25 | social-logs | ✅ | ✅ | ✅ | ✅ | ❌ | instagram, database | ❌ **falta** | genérico (3) | ❌ | ❌ genérico |
| 26 | webhooks-panel | ✅ | ✅ | ✅ | ✅ | ❌ | webhooks, database | ❌ **falta** | genérico (3) | ❌ | ❌ genérico |
| 27 | agent-console | ✅ | ✅ | ✅ | ✅ | ✅ | anthropic, database | ✅ | genérico (3) | ❌ | ❌ genérico |
| 28 | ops-health | ✅ | ✅ | ✅ | ✅ | ❌ | database, storage, webhooks | ❌ **falta** | genérico (3) | ❌ | ❌ genérico |
| 29 | integration-manifest | ✅ | ✅ | ✅ | ✅ | ❌ | 9 conectores | ❌ **falta** | genérico (3) | ❌ | ❌ genérico |

**Totais**
- loading / empty / error / forbidden presentes: **29/29** ✅
- `ConnectorLock` funcional: **11/29**; **18/29** renderizam conteúdo normal com o conector "desconectado" (fingindo funcionar)
- estado vazio **sem** próxima ação: **28/29**
- estado "sem permissão" **genérico** (não diz o papel): **28/29**
- estado de erro **sem** `role="alert"`: **29/29**
- skeleton genérico (não descreve a forma): **21/29**

---

## 3. Violações WCAG 2.2

| # | SC | Nível | Onde | Problema |
|---|---|---|---|---|
| V1 | 1.4.11 Foco com aparência | **AA** | `packages/ui/src/field.tsx:46-50` | Input/Textarea/Select: `focus:outline-none` + `focus-visible:border-accent` (borda de **1px**) + `focus-visible:ring-4 focus-visible:ring-accent/15` (anel a 15% de opacidade, visualmente nulo). O indicador efetivo tem 1px; o SC exige área ≥ perímetro de 2px. Evidência: `docs/qa-a11y/foco-input.png`. |
| V2 | 2.4.7 Foco visível | **A** | `apps/catalog/src/Sidebar.tsx:81-90` | 29 botões da sidebar sem `focus-visible` do DS → só o anel padrão do navegador (`outline: auto 1px`). 903 registros em `docs/qa-resultado.json` (critério 2). Evidência: `docs/qa-a11y/foco-sidebar.png`. |
| V3 | 2.4.3 Ordem do foco | **A** | `packages/ui/src/overlay.tsx:40-72` | Ao fechar o `ConfirmDialog` com `Esc`, o foco vai para `<body>` em vez de voltar ao botão gatilho. Medido: `activeElement = BODY` após `Escape`. |
| V4 | 4.1.2 Nome, valor | **A** | `packages/ui/src/button.tsx:68-71` + `81-92` | Durante `loading`, o conteúdo do botão vira `aria-hidden="true"` e o `Spinner` (`role="status" aria-label="Carregando"`) é o único nome restante → o botão passa a se chamar **"Carregando"** e perde o rótulo da ação. |
| V5 | 4.1.2 Nome, valor | **A** | `packages/ui/src/field.tsx:249-262` | `Segmented` usa `role="tablist"`/`role="tab"` com `aria-selected`, mas não implementa o padrão de teclado de tabs (setas não navegam) e não tem `tabpanel`/`aria-controls`. O leitor de tela anuncia "aba" sem alvo. |
| V6 | 4.1.3 Mensagens de status | **AA** | `packages/blocks/src/shared/index.tsx:115-124` | Estado de erro sem `role="alert"` → falha de carga não é anunciada. |
| V7 | 4.1.3 Mensagens de status | **AA** | `packages/blocks/src/shared/index.tsx:91-103` | Estado de loading silencioso: o skeleton é `aria-hidden` e não há texto "Carregando…" nem `role="status"`. |
| V8 | 4.1.3 Mensagens de status | **AA** | `packages/blocks/src/shared/index.tsx:126-135` | Estado "sem permissão" e de erro não são regions announcement; troca de estado no bloco não é perceptível por leitor de tela. |
| V9 | 4.1.3 Mensagens de status | **AA** | `apps/catalog/src/App.tsx:129-133` | Painel "Ação mais recente" (`<footer>`) atualiza por React sem `aria-live`/`role="status"` → a ação disparada nunca é anunciada. |
| V10 | 1.3.1 Info e relações | **A** | `apps/catalog/src/App.tsx:63-133`, `apps/catalog/src/BlockStage.tsx:50` | Não existe landmark `<main>`; o conteúdo é um `<section>` **sem nome acessível** (não é exposto como region). Landmarks presentes: banner, 2× complementary, navigation, contentinfo. |
| V11 | 1.3.1 Info e relações | **A** | `packages/ui/src/data.tsx:174-221` | 7 tabelas sem `<caption>` (`patients-list`, `follow-up-tasks`, `finance-overview`, `reports-funnel`, `social-automations`, `social-logs`, `webhooks-panel`) — a relação entre tabela e assunto não é programática. `th scope="col"` ✅. |
| V12 | 2.4.6 Cabeçalhos e rótulos | **AA** | `packages/blocks/src/identidade/auth-login.tsx:220`, `auth-recovery.tsx:336`, `packages/ui/src/surface.tsx:63` | Nível de cabeçalho inconsistente: `auth-login`/`auth-recovery` usam `<h1>`, `SectionHeader` usa `<h2>`, cards usam `<h3>`. No catálogo a ordem DOM é **h2 → h1** (`H2:Login`, `H1:Entrar na sua conta`) e não existe h1 de página. |
| V13 | 4.1.2 Nome, valor | **A** | `packages/blocks/src/administracao/office-team.tsx`, `follow-up-tasks.tsx`, `availability.tsx`, `packages-pricing.tsx`, `channel-connections.tsx`, `consent-panel.tsx`, `integration-manifest.tsx`, `social-logs.tsx` | Nomes acessíveis duplicados sem contexto: "Rebaixar"×5, "Remover"×5, "Concluir"×6, "Reagendar"×6, "FOLGA"×12, "Salvar"×5, "Desativar"×4, "Registrar consentimento"×2, "Reconectar"×3, "Reexecutar"×2, "Provisionar"×3. O usuário de leitor de tela não sabe qual linha. |
| V14 | 2.1.1 Teclado | **A** | `packages/ui/src/data.tsx:82-99` (`Stat`) | `Stat` com `onClick` renderiza `<div onClick>` sem `role`/`tabIndex` — alvo só de mouse (API pública; hoje não usado nos blocos). |
| V15 | 2.1.2 Sem armadilha de teclado / 4.1.2 | **A** | `packages/ui/src/overlay.tsx:186-242` (`Drawer`) | `Drawer` público: sem `role="dialog"`, sem `aria-modal`, **sem foco preso**, **sem `Esc` para fechar**. Se usado, viola 2.1.2 e 2.4.3. (Nenhum bloco usa `Drawer` hoje — o catálogo não exercita o caminho.) |
| V16 | 4.1.2 Nome, valor | **A** | `packages/ui/src/overlay.tsx:40-72` | `Dialog` não expõe `aria-modal="true"` (o Radix não define). O `aria-modal` explícito é a prática recomendada para modais. |
| V17 | 2.3.3 Animação de interações | **AAA** (DS) | `packages/ui/src/theme.tsx` (`ThemeProvider`) + 12 blocos com `motion/react` | Sob `prefers-reduced-motion: reduce` as transições CSS caem para 1 ms ✅, mas a animação WAAPI de `motion/react` (240 ms, `opacity/scale/y`) **continua rodando** — não existe `<MotionConfig reducedMotion="user">`. |
| V18 | 3.3.2 Rótulos ou instruções | **A** | `apps/catalog/src/Sidebar.tsx:60` | Campo de busca só com `placeholder` — sem `<label>`/ `aria-label` persistente (o placeholder some ao digitar). |
| V19 | 1.4.12 Espaçamento do texto | **AA** | `packages/blocks/src/atendimento/inbox-whatsapp.tsx` | `Textarea` de resposta sem `<label>` — nome vem só do `placeholder` "Escreva a resposta". |
| V20 | 2.5.3 Rótulo no nome | **A** | `packages/blocks/src/atendimento/consent-panel.tsx:235` | `<Field label="Canal da concessao">` sem `htmlFor` gera `<label>` órfão; o `Select` se nomeia por `aria-label` diferente do rótulo visível. |

---

## 4. Achados com correção concreta

| Severidade | Arquivo:linha | Problema | Correção (código) |
|---|---|---|---|
| **[crítico]** | `packages/blocks/src/shared/index.tsx:105-113` | Estado vazio sem próxima ação em 28/29 blocos | Dar `action` ao `EmptyState` padrão e **`empty` próprio a cada bloco**. Ex.:<br>`<EmptyState title="Nenhum lead por aqui" description="Quando um lead entrar no funil, ele aparece aqui com a origem do primeiro toque." action={<Button onClick={criarLead}>Cadastrar lead</Button>} />` |
| **[crítico]** | `packages/blocks/src/shared/index.tsx:126-135` | "Sem permissão" não diz o papel que falta | Aceitar `requiredRole`/`forbidden` e declarar por bloco:<br>`<BlockFrame … forbidden={{ role: "Nutricionista", label: "Seu perfil não tem o papel Nutricionista." }} />` → texto: *"Você precisa do papel **Nutricionista** para ver esta informação."* |
| **[crítico]** | `packages/blocks/src/operacao/webhooks-panel.tsx:110` (+ 17 blocos) | Bloco que exige conector **finge funcionar** quando o conector falta | `requires={["webhooks"]}` no `BlockFrame` de cada bloco que a receita declara. Lista completa dos 18: `agenda-board.tsx:208`, `availability.tsx:185`, `follow-up-tasks.tsx:144`, `consent-panel.tsx:89`, `leads-board.tsx:86`, `clinical-entry.tsx:111`, `patient-chart.tsx:93`, `patients-list.tsx:72`, `finance-overview.tsx:121`, `packages-pricing.tsx:112`, `payments-checkout.tsx:193`, `integration-manifest.tsx:120`, `ops-health.tsx:150`, `webhooks-panel.tsx:110`, `reports-funnel.tsx:88`, `social-automations.tsx:110`, `social-composer.tsx:282`, `social-logs.tsx:90` |
| **[alto]** | `packages/blocks/src/shared/index.tsx:91-103` | Skeleton genérico em 21/29 blocos; nenhum anúncio de "carregando" | (a) skeleton por bloco descrevendo a forma (linhas de tabela, cartões, bolhas de chat); (b) anunciar:<br>`<div role="status" aria-live="polite" className="sr-only">Carregando…</div>` |
| **[alto]** | `packages/blocks/src/shared/index.tsx:115-124` | Estado de erro sem `role="alert"` | `<div role="alert" aria-live="assertive" className="rounded-[var(--r-lg)] border border-danger/30 bg-danger-soft p-4">` |
| **[alto]** | `packages/ui/src/field.tsx:46-50` | Indicador de foco de 1px em campos (falha 2.4.11 AA) | Trocar a borda por outline real:<br>`"focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:ring-0"`<br>(o `ring-accent/15` não tem contraste suficiente: ~1,15:1 sobre o fundo do painel) |
| **[alto]** | `packages/ui/src/overlay.tsx:186-242` | `Drawer` público sem semântica de diálogo, foco preso ou `Esc` | Migrar para Radix (como o `Dialog`):<br>`import { Dialog as DialogPrimitive } from "radix-ui";`<br>e renderizar `DialogPrimitive.Root/Portal/Overlay/Content` com `DialogPrimitive.Title` — o foco preso e o `Esc` vêm de graça. |
| **[alto]** | `packages/ui/src/overlay.tsx:40-72` | Foco não volta ao gatilho ao fechar o diálogo | `onCloseAutoFocus={(e) => { e.preventDefault(); (triggerRef.current ?? document.activeElement)?.focus(); }}` — guardar `triggerRef` no `Dialog`, ou trocar por `DialogPrimitive.Trigger`. |
| **[alto]** | `packages/ui/src/field.tsx:249-262` | `Segmented` com `role="tab"` sem padrão de teclado de tabs | Trocar por `role="radiogroup"` + `role="radio"`/`aria-checked` (é um seletor de uma opção):<br>`<div role="radiogroup" aria-label={label}>` … `<button role="radio" aria-checked={active} tabIndex={active ? 0 : -1}>` — ou usar `TabsPrimitive` do Radix, que já tem setas + `tabpanel`. |
| **[alto]** | `packages/ui/src/button.tsx:68-71` | Nome do botão vira "Carregando" durante o loading | Manter o rótulo no conteúdo e esconder só o spinner:<br>`{loading ? <Spinner /> : null}` com `<Spinner>` em `aria-hidden`, e marcar o botão com `aria-busy`:<br>`<Spinner aria-hidden className="…" />` + `aria-busy={loading || undefined}` (o `aria-busy` já existe na linha 53). |
| **[alto]** | `apps/catalog/src/App.tsx:129-133` | "Ação mais recente" não é anunciado | `<footer …><span className="bloco-caption">Ação mais recente:</span><code role="status" aria-live="polite" aria-atomic="true">{lastAction ?? "—"}</code></footer>` |
| **[alto]** | `apps/catalog/src/App.tsx:63-133` + `apps/catalog/src/BlockStage.tsx:50` | Sem landmark `main` | Trocar `<section className="flex min-w-0 flex-1 flex-col">` por `<main aria-label="Bloco em exibição">` e a coluna de fora por `<div>`/`<aside>` já rotulados. |
| **[alto]** | `packages/ui/src/theme.tsx` | `prefers-reduced-motion` não desliga o `motion/react` | No `ThemeProvider` (ou no app root):<br>`import { MotionConfig } from "motion/react";`<br>`<MotionConfig reducedMotion="user">{children}</MotionConfig>` |
| **[médio]** | `apps/catalog/src/Sidebar.tsx:81-90` | 29 botões sem o anel do DS | adicionar `"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"` às classes do botão da sidebar. |
| **[médio]** | `apps/catalog/src/Sidebar.tsx:60` e `:81` | Busca sem rótulo; item ativo sem `aria-current` | `<input aria-label="Buscar bloco por nome ou id" …>` (ou `<label className="sr-only" htmlFor="qa-busca">`); no botão: `aria-current={active ? "page" : undefined}` |
| **[médio]** | `packages/blocks/src/administracao/office-team.tsx:285-301` | "Rebaixar"/"Remover" ×5 sem contexto | `aria-label={`Rebaixar ${member.name}`}` / `aria-label={`Remover ${member.name} da equipe`}` (idem `follow-up-tasks`: "Reagendar ${task.title}"; `availability`: "FOLGA" → `${slot.label} — folga`; `packages-pricing`: "Salvar ${pkg.name}") |
| **[médio]** | `packages/ui/src/data.tsx:82-99` | `Stat` clicável só por mouse | `<div onClick>` → `<button type="button" onClick className="w-full text-left …">` (ou `role="button" tabIndex={0} onKeyDown` para Enter/Space). |
| **[médio]** | `packages/ui/src/data.tsx:196-204` | `<tr onClick>` só por mouse | manter o `onRowClick` como conveniência, mas garantir que a primeira coluna tenha um `<button>`/`<a>` com o mesmo destino (já existe em `patients-list` e `admin-platform` — padronizar nos demais) ou usar `tabIndex={0} onKeyDown` no `<tr>`. |
| **[médio]** | `packages/ui/src/data.tsx:174-221` | Tabelas sem `<caption>` | `DataTable` ganha prop `caption` e renderiza `<caption className="sr-only">{caption}</caption>`; passar em cada bloco. |
| **[médio]** | `packages/ui/src/surface.tsx:63` + `packages/blocks/src/identidade/auth-login.tsx:220` | Nível de cabeçalho inconsistente (h1/h2/h3) | Padronizar o título do bloco em `<h2>` e expor a página com `<PageHeader>` (que já usa `<h1>`, `packages/ui/src/surface.tsx:89`); rebaixar os `<h1>` de `auth-login`/`auth-recovery` para `<h2>`. |
| **[médio]** | `packages/blocks/src/atendimento/consent-panel.tsx:235` | `<label>` órfão | `<Field label="Canal da concessão" htmlFor="consent-canal">` + `id="consent-canal"` no `Select`. |
| **[médio]** | `packages/blocks/src/atendimento/inbox-whatsapp.tsx` | `Textarea` só com placeholder | `<Field label="Mensagem para o contato" htmlFor="inbox-msg">` + `id="inbox-msg"` no `Textarea` (ou `aria-label` + `title`). |
| **[médio]** | `packages/ui/src/field.tsx:46-50` (112 elementos em 22 blocos) | 112 transições com a curva padrão do Tailwind em vez de `ease-apple` | acrescentar `ease-[var(--ease-apple)]` às classes `transition-colors`/`transition-all` que hoje só usam o `transition-[…]` default (`controlBase`, `DataTable` `<tr>`, `Switch`, botões de dia, etc.). |
| **[baixo]** | `packages/ui/src/overlay.tsx:40-72` | `Dialog` sem `aria-modal` | passar `aria-modal="true"` (o `DialogPrimitive.Content` aceita props):`<DialogPrimitive.Content asChild aria-modal="true">` — ou adicionar `aria-modal` no `motion.div`. |
| **[baixo]** | `packages/ui/src/feedback.tsx:6-40` (`Callout`) | Callout não é anunciado quando muda | `Callout` com `tone="danger"` → `role="alert"`; `tone="success"` → `role="status"`. |
| **[baixo]** | `packages/blocks/src/shared/index.tsx:93-102` | Skeleton com altura fixa (314 px) que não bate com o conteúdo real | o skeleton por bloco deve ter a altura aproximada do conteúdo final, senão o bloco "pula" ao receber os dados (ver `movimento-reduced.json` → `layout`: Normal 614 px vs Carregando 314 px). |
| **[baixo]** | `packages/blocks/src/operacao/agent-console.tsx` | 2 regiões roláveis focáveis (DIV/P) só com o anel do navegador | adicionar `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent` às classes `bloco-scroll`/`overflow-y-auto` focáveis. |

---

## 5. O que já está bom

- **Nomes acessíveis**: 0 controles interativos sem nome em 29/29 blocos, medido na árvore de acessibilidade real do Chromium (`docs/qa-a11y/ax.json`). Os `Switch` e `Checkbox` do `@blocos/ui` agora usam `aria-labelledby` + fallback `aria-label` (`packages/ui/src/field.tsx:138-235`) — não dependem mais do `<label>` implícito, que é frágil entre navegadores.
- **Estados ARIA**: `aria-checked` correto em todos os `role="switch"`/`role="checkbox"`, `aria-selected` correto nos tabs (inclusive os do Radix em `clinical-entry`), `aria-expanded` no disclosure de templates do `inbox-whatsapp`. Nenhum `aria-hidden` em elemento focável.
- **Tabelas**: `scope="col"` em 100% dos `<th>` do `DataTable` (`packages/ui/src/data.tsx:180-192`); wrapper com scroll horizontal (`bloco-scroll overflow-x-auto`) em vez de esmagar coluna.
- **Foco nos blocos**: anel do DS (`outline: solid 2px` + `offset 2px`, cor accent) medido em **todos** os botões e links dos 29 blocos; a ordem de tabulação acompanha a ordem visual/DOM, sem saltos e sem focus-trap em container não-modal (requisito explícito do critério 2).
- **Diálogo modal**: `ConfirmDialog` (Radix) **prende o foco** (Tab cicla Cancelar → Confirmar → Fechar) e **fecha com `Esc`** — medido.
- **`Button`**: `type="button"` por padrão (evita submit acidental), `aria-busy` no loading, `disabled:pointer-events-none` e estado desabilitado com token (não opacidade global).
- **Erro de formulário**: `Field` renderiza a mensagem com `role="alert"` (`packages/ui/src/field.tsx:36`).
- **Toast**: `ToastStack` com `role="status"` (`packages/ui/src/feedback.tsx:102`) — anunciado corretamente.
- **`ConnectorLock`**: quando presente, nomeia o conector que falta ("WhatsApp (Cloud API) não está conectado"), diz que **apenas o dono da plataforma** pode provisionar e oferece "Solicitar acesso" — atende ao requisito de `not-provisioned` do DS.
- **Movimento**: nenhuma transição passa de 420 ms; `ease-apple` é a curva majoritária; `ease-spring` só no botão do switch (uso permitido pelo DS); `prefers-reduced-motion` derruba todas as transições/animações CSS para 1 ms.
- **Idioma**: `html lang="pt-BR"`; varredura de strings de interface **sem nenhum texto em inglês**; `<title>` e `meta description` em português.
- **Métricas do `qa-automatic.py`** (snapshot 18:59): 0 erro de console, 0 `<button>` sem `type`, 0 `img` sem `alt`, 0 controle sem nome acessível nos blocos (os 261 achados restantes são alvos de toque < 32 px no shell do catálogo e a classificação de foco do próprio checker).

---

## 6. Roteiro de reprodução

```bash
# catálogo
cd /workspace/blocos && npm run build && npm run build:app
(cd apps/catalog/dist && python3 -m http.server 4173 &)

# checker automático
python3 scripts/qa-automatic.py          # -> docs/qa-resultado.json

# auditorias desta rodada (somente leitura)
python3 docs/qa-a11y/audit-completo.py    # -> ax.json, semantica.json, tab.json, movimento.json
python3 docs/qa-a11y/audit-foco.py        # -> foco.json   (tab order + foco visível, teclado real)
python3 docs/qa-a11y/audit-estados.py     # -> estados.json (loading/empty/error/forbidden/conector)
python3 docs/qa-a11y/audit-movimento.py   # -> movimento-reduced.json (reduced-motion + layout shift)
```
