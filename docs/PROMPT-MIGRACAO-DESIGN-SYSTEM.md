# PROMPT — migrar o design system dos meus apps para a biblioteca "Blocos" (Aurora)

> Este é um prompt pronto para colar num agente de engenharia (ou para mim).
> Ele é autossuficiente: quem receber não precisa do histórico desta conversa.

---

## 0. Seu papel

Você é um engenheiro frontend sênior. Sua tarefa é **migrar o design system e as telas de
3 aplicações Next.js existentes** para a biblioteca de blocos reutilizáveis **"Blocos"**
(que já existe, já foi auditada e já está em 100/100 de qualidade), **sem quebrar
nenhuma regra de negócio, nenhum contrato de API e nenhuma garantia de segurança**.

---

## 1. Contexto da biblioteca (já pronta, não reescreva)

**Onde está:** repositório GitHub `Tupapirico100/blocos` (privado), branch `main`.
**Estrutura:**

```
packages/core     contratos: BlockRecipe, BlockProps, ActionDefinition, ConnectorRequirement,
                  ConnectorRegistry (owner-only), ActionRuntime, money (centavos), time (tz)
packages/tokens   design system "Aurora": src/styles.css (tokens + 3 temas + 2 densidades)
packages/ui       primitivos: Button, IconButton, Field, Input, Select, Textarea, Switch,
                  Checkbox, Segmented, Panel, Badge, Stat, Avatar, DataTable, EmptyState,
                  KeyValue, ProgressBar, Dialog, Drawer, Tabs, Tooltip, Callout, ConnectorLock,
                  ConfirmDialog, ToastStack, ThemeProvider, MotionProvider, cn()
packages/blocks   29 blocos de negócio: <id>.tsx (a tela) + <id>.recipe.ts (a "receita") + mock.ts
apps/catalog      catálogo visual (é o que você vai usar de referência)
docs/             MAPA-BLOCOS.md · ESCOLHAS-DO-DONO.md · DESIGN-SYSTEM.md · DECISOES.md ·
                  RUNBOOK-OWNER.md · QA-RUBRICA.md · QA-RELATORIO.md
```

**Contrato de um bloco** (leia um exemplo real antes de começar):
`<id>.recipe.ts` declara `id`, `name`, `domain`, `summary`, `origins`, `ports`, `actions`,
`connectors`, `rules`, `variants`, `states` e **`defaultVariant`** (a variação escolhida pelo
dono — já fixada nos 29 blocos). A tela `<id>.tsx` é **presentacional**: recebe `data`
(já resolvido) e devolve intenção por `onAction(action, payload)`. Ela **nunca busca dados**.

**Tema escolhido pelo dono: Aurora.** Densidade padrão: `comfortable`.
As variações alternativas continuam existindo na biblioteca — **não remova nenhuma**.

---

## 2. Regras invioláveis (nenhuma exceção)

Estas regras são de **negócio, segurança e privacidade**. Elas valem mais que o design.

1. **Nunca** mover dado de saúde para log, erro, URL, telemetria ou evento de marketing.
   O CRM-HOF tem `assert-no-health-data`; o CRM-Nutricionista tem `audit_log` — mantenha.
2. **Nunca** quebrar a porta da Regra 11 (lista de permitidos do WhatsApp) nem a janela de
   24h. São bloqueio funcional: o bloco só envia se a regra permitir.
3. **Nunca** expor segredo no cliente. Segredo de conector é do **dono da plataforma**
   (`ConnectorRegistry.provision({ provisionedBy })`) e nunca entra em `className`, prop,
   query string ou `localStorage`.
4. **Nunca** remover `role="alert"`, `aria-modal`, foco preso de dialog/drawer, `th scope`,
   `html lang="pt-BR"` nem o `<main>`.
5. **Nunca** quebrar contrato de API existente. As `actions` do bloco descrevem o endpoint
   atual — se o endpoint mudar, atualize a receita **e** o teste do serviço juntos.
6. **Nada de functionality fora da spec do bloco.** Se uma tela não tem bloco, crie o bloco
   seguindo `docs/CONTRATO-BLOCOS.md` — não invente comportamento.
7. **Toda escrita/ler de dado de paciente passa por `src/core/services/`** (padrão do
   CRM-Nutricionista) e grava auditoria.

---

## 3. Fase 0 — preparação (por app, antes de tocar em tela nenhuma)

Nenhum dos 3 apps tem Tailwind hoje. Instale:

```bash
npm i tailwindcss@^4 @tailwindcss/postcss@^4 postcss
npm i lucide-react motion@^12 clsx tailwind-merge zod
npm i @blocos/core @blocos/ui @blocos/blocks   # do repo privado (git ou workspace)
```

Configuração Next.js 16 (App Router):

```ts
// postcss.config.mjs
export default { plugins: { "@tailwindcss/postcss": {} } };
```

```css
/* src/app/globals.css  —  a ordem importa */
@import "tailwindcss";
@import "@blocos/tokens/styles.css";

@source "../../node_modules/@blocos/ui/dist/**/*.js";
@source "../../node_modules/@blocos/blocks/dist/**/*.js";
```

> `@source` é obrigatório: o Tailwind ignora `node_modules` por padrão e as classes dos
> blocos não seriam geradas.

Envolva a raiz do app (no `layout.tsx`):

```tsx
<ThemeProvider theme="aurora" density="comfortable">
  <MotionProvider>{children}</MotionProvider>
</ThemeProvider>
```

> **O `ThemeProvider` precisa estar no `<html>`/`body`, não num `<div>` interno.**
> Dialog e Drawer são portaled para o `body`; se as variáveis ficarem só no wrapper,
> eles saem transparentes com texto preto. (O `ThemeProvider` do Blocos já aplica o tema
> no `document.documentElement` — só confirme que o app **usa** o provider, não uma cópia
> da biblioteca com token local.)

---

## 4. Fase 1 — converter o CSS atual em tokens Aurora

Hoje cada app tem seu próprio design system em CSS puro. Ele vira **tokens Aurora** — o
`globals.css` antigo sai, mas **nenhuma cor se perde**: cada valor atual mapeia para um
token semântico.

### 4.1 Agendador-Instagram (`src/app/globals.css`, 241 linhas, tema claro)

| Token atual | Token Aurora | Valor Aurora |
|---|---|---|
| `--ink` | `--text` | `#1d1d1f` |
| `--ink-2` | `--text-secondary` | `rgba(29,29,31,0.82)` |
| `--muted` | `--text-muted` | `rgba(29,29,31,0.78)` |
| `--paper` | `--bg` | `#f5f5f7` |
| `--surface` | `--surface-solid` | `#ffffff` |
| `--line` | `--border` | `rgba(0,0,0,0.09)` |
| `--band` | `--surface` | `rgba(255,255,255,0.72)` |
| `--signal` | `--accent` | `#0066d6` |
| `--signal-soft` | `--accent-soft` | `rgba(0,105,214,0.10)` |
| `--moss` | `--success` | `#1b6d2e` |
| `--amber` | `--warn` | `#a04600` |
| `--brick` | `--danger` | `#c3000f` |
| `--brick-soft` | `--danger-soft` | `rgba(195,0,15,0.09)` |
| `--radius` | `--r-sm` | `10px` |
| `--radius-lg` | `--r-lg` | `18px` |
| `--f-display` / `--f-ui` | `--font-sans` | `-apple-system, "SF Pro Display", Inter, system-ui` |

As classes `.btn`, `.btn-primary`, `.btn-danger`, `.btn-quiet`, `.btn-small` **saem**: viram
`<Button variant="...">`. Os nomes de botão do Blocos já cobrem os papéis
(primary / secondary / ghost / glass / danger / danger-ghost / outline).

### 4.2 CRM-Nutricionista (`src/app/[locale]/globals.css`, 1628 linhas)

A escala de espaço e raio é **compatível** (4/8/12/16/24/32/48 e 8/16/pill). As **cores**
estão espalhadas em classes utilitárias — mapeie cada uma para o token semântico
(`--surface`, `--surface-strong`, `--border`, `--text`, `--text-secondary`, `--accent`,
`--danger`…). As classes utilitárias (`.app-nav__link`, `.chart-card`, `.appt-list`…)
são **estrutura de layout**: reescreva o `className` com utilitários Tailwind +
tokens Aurora, e apague a classe antiga do CSS quando ela não tiver mais uso.

### 4.3 CRM-HOF (`src/app/[locale]/globals.css`, 349 linhas)

| Token atual | Token Aurora |
|---|---|
| `--space-1..9` | `--sp-1..24` (mesma base 4px) |
| `--radius-md` / `--radius-lg` / `--radius-pill` | `--r-md` / `--r-lg` / `--r-pill` |
| `--brand`, `--brand-2` (gradiente do CTA) | `--accent` + `--accent-strong` (o gradiente vira `bg-accent-strong`; gradiente em CTA é o unico lugar onde ele se justifica) |
| `--shadow-card` / `--shadow-cta` | `--shadow-2` / `--shadow-3` |
| `--font-display` / `--font-body` | `--font-sans` |

### 4.4 Regras de cor que quebram se ignoradas

- **`bg-accent` é preenchimento; `text-accent-ink` é acento como texto.** Usar
  `text-accent` (o azul de preenchimento) como cor de texto reprova WCAG AA.
- **Fundo preenchido de botão usa `--accent-strong`**, não `--accent` (o branco sobre o
  azul puro dá 3,65:1).
- **Badge nunca é só cor** — sempre tem texto.
- **Borda de campo (`--border-input`) tem 3:1** contra o fundo; a borda decorativa
  (`--border`) pode ser fio de 1px.
- **Não fixe hex em `className`.** Se precisa de um hex, é sinal de que falta um token.

---

## 5. Fase 2 — mapa de telas → blocos

### 5.1 CRM-Nutricionista (`src/app/[locale]/`)

| Tela atual | Bloco | Variação (já fixada) |
|---|---|---|
| `login/` | `auth-login` | Centralizada |
| `seguranca/2fa/` | `auth-two-factor` | Cartões |
| `esqueci-senha/`, `definir-senha/` | `auth-recovery` | Formulário |
| `admin/`, `admin/consultorios/` | `admin-platform` | Cartões |
| `consultorios/[officeId]/equipe/` | `office-team` | Cartões |
| `consultorios/`, `consultorios/[officeId]/webhook/` | `office-settings` | Seções |
| `leads/` | `leads-board` | Tabela |
| `canal/` | `inbox-whatsapp` + `channel-connections` | Dividido + Cartões |
| `pacientes/` | `patients-list` | Tabela |
| `pacientes/[id]/` | `patient-chart` | Blocos |
| `pacientes/[id]/consentimentos/` | `consent-panel` | Tabela |
| `agenda/` | `agenda-board` + `availability` | Semana + Semana |
| `agente/` | `agent-console` | Logs |
| `financeiro/` | `financeiro` → `finance-overview` + `packages-pricing` + `payments-checkout` | Gráfico + Cartões + Formulário |
| `relatorios/` | `reports-funnel` + `meta-conversion` | Funil + Tabela |

### 5.2 Agendador-Instagram (`src/app/(app)/`)

| Tela atual | Bloco | Variação |
|---|---|---|
| `login/` | `auth-login` | Centralizada |
| `accounts/` | `social-accounts` | Cartões |
| `posts/`, `posts/new/`, `posts/[id]/` | `social-composer` + `social-logs` | Composer + Tabela |
| `automations/` | `social-automations` | Fluxo |
| `logs/` | `social-logs` | Tabela |

### 5.3 CRM-HOF (`src/app/[locale]/`)

| Tela atual | Bloco | Variação |
|---|---|---|
| `leads/` | `leads-board` | Tabela |
| `canal/` | `inbox-whatsapp` | Dividido |
| `patients/`, `patients/[id]/` | `patients-list`, `patient-chart` | Tabela, Blocos |
| `patients/[id]/consents/` | `consent-panel` | Tabela |
| `agenda/` | `agenda-board` | Semana |
| `follow-up-tasks/` | `follow-up-tasks` | Calendário |
| `packages/`, `service-packages/` | `packages-pricing` | Cartões |
| `payments/new/`, `receipts/` | `payments-checkout` | Formulário |
| `reports/` | `reports-funnel` | Funil |
| `meta/` | `meta-conversion` | Tabela |
| `webhooks/` | `webhooks-panel` | Lista |
| `clinics/` | `admin-platform` | Cartões |
| `two-factor/` | `auth-two-factor` | Cartões |

### 5.4 Telas que **ainda não têm bloco** (criar do zero, seguindo `CONTRATO-BLOCOS.md`)

1. **`tags/`** (CRM-HOF) — CRUD de etiquetas + etiquetas aplicadas ao lead.
2. **`clinic-data/`** (CRM-HOF) — exportação de dados do titular (LGPD art. 18).
3. **`setup/`** (CRM-HOF) — assistente de configuração; **não cria nada** (só orienta).
4. **`receipts/`** (CRM-HOF) — recibo/impressão do pagamento (pode ser uma variante
   `receipt` do `payments-checkout`, que já existe).

---

## 6. Fase 3 — como escrever as telas com os blocos

```tsx
// a tela nova: o bloco cuida do visual, o app cuida dos dados
import { LeadBoard } from "@blocos/blocks";
import { getLeads } from "@/core/services/leads";

export default async function Page() {
  const leads = await getLeads();            // service existente, com auditoria
  return (
    <LeadBoard
      data={leads}
      variant={leadBoardRecipe.defaultVariant}
      onAction={async (action, payload) => { /* chama a action da receita */ }}
    />
  );
}
```

Regras de integração:

- **A tela vira fina**: o bloco tem o visual e os estados; a page busca o dado e despacha a
  ação. Se a page está com 300 linhas de JSX, sobrou bloco faltando.
- **Estados**: `loading | success | empty | error | forbidden` + o bloqueio de conector.
  Não desenhe estado vazio na mão — declare `emptyAction` na receita e deixe o bloco
  renderizar.
- **Ação destrutiva**: sempre `ConfirmDialog`.
- **Conector**: se a tela depende de serviço externo (WhatsApp, Claude, Instagram, Meta Ads),
  a receita declara o conector e **o bloco trava sem ele** — não desenhe o bloco "funcionando"
  com dado de mentira.

---

## 7. Fase 4 — padrões de UI (as regras que evitam bugs já encontrados)

1. **Grade por container, não por viewport.** `sm:grid-cols-2` dentro de um contêiner de
   220px (com painel lateral aberto) esmaga e faz um cartão invadir o vizinho. Use
   `@container` no pai + `@[420px]:grid-cols-2` no filho.
2. **`truncate` só funciona em bloco.** Em `display:inline` é inerte e o texto invade o
   vizinho. Use `inline-block` + `min-w-0` + `max-w-full`.
3. **Foco visível é obrigatório** — `focus-visible:outline-2 focus-visible:outline-solid
   focus-visible:outline-offset-2 focus-visible:outline-accent`. **Nunca** combine com
   `focus:outline-none` (no Tailwind v4 ele zera `--tw-outline-style` e o outline nunca é
   pintado).
4. **Ícone tem nome acessível.** Botão só-ícone sempre com `aria-label` descritivo e único
   ("Remover Ana da equipe", não "Remover").
5. **Alvo mínimo 32×32** (WCAG 2.2 pede 24; a casa pede 32). Ícone em lista densa: 32.
6. **Texto cortado precisa de `title`** para o valor completo ser acessível.
7. **Escala tipográfica nomeada** — `bloco-control-sm/md/lg`, `bloco-cell`, `bloco-label`,
   `bloco-label-sm`. **Nunca** `text-[14px]`.
8. **Ritmo de gap**: 2/3/4/6/8. Dentro de controle denso (chip, linha de tabela, botão)
   1/1,5 é aceitável.
9. **`prefers-reduced-motion`**: sempre dentro do `MotionProvider`; loops CSS (shimmer,
   spinner) são **desligados**, não acelerados.

---

## 8. Fase 5 — o gate de qualidade (obrigatório)

A biblioteca tem QA automatizado. **Copie os checkers para o app** (eles rodam contra o
catálogo; adapte a URL e a lista de blocos) e rode **antes** de dar qualquer tela por pronta:

```bash
python3 scripts/qa-automatic.py       # type, nome acessível, alvo, overflow, hex, estados, papel
python3 scripts/qa-variantes.py       # toda variação renderiza e é distinta
python3 scripts/qa-contraste.py       # contraste WCAG por DOM (alpha composto)
python3 scripts/qa-contraste-pixel.py # contraste WCAG por PIXEL (o rigoroso)
bash scripts/placar-final.sh           # o placar
```

Rubrica: `docs/QA-RUBRICA.md` (10 critérios × 10 pontos = 100). **O app só é aceito com
100/100** e com:
- 0 erro de console;
- 0 controle sem nome acessível (árvore de acessibilidade do Chromium);
- 0 overflow de documento em 390/768/1280/1440/1920;
- 0 texto cortado sem `title`;
- foco visível em 100% dos interativos;
- `role="alert"` em erro e "sem permissão", e o "sem permissão" **nomeando o papel**.

Se um check reprovar, corrija e rode de novo. Não entregue com pendência.

---

## 9. Ordem de execução (para o app nunca ficar quebrado)

1. **Não apague o CSS antigo.** Adicione os tokens Aurora e migre **uma tela por vez**.
2. Por tela: troque o JSX pelo bloco → ajuste o `data` no service → ligue o `onAction` →
   rode os checkers → só então apague o CSS que ficou sem uso.
3. Um PR por app e por tema de migração (ex.: "CRM-HOF: telas de atendimento").
4. Regra de ouro: **se uma tela antiga ainda funciona e a nova não passou no QA, a antiga
   fica.** O bloco novo só entra quando passa.

---

## 10. Bugs que já custaram tempo nesta biblioteca (não repita)

| Bug | Como acontece | Como evitar |
|---|---|---|
| Dialog invisível (fundo transparente, texto preto) | portal do Radix renderiza fora do container do tema | tema no `<html>` (`ThemeProvider` do Blocos já faz) |
| Dialog/drawer fora da tela | `.bloco-glass { position: relative }` **fora de `@layer`** vence o `fixed` do Tailwind | classes do DS em `@layer components` |
| CTA com 3,65:1 | azul de preenchimento usado como fundo de botão | `--accent-strong` para fundo, `--accent-ink` para texto |
| Campo sem indicador de foco | `focus:outline-none` zera `--tw-outline-style` | `focus-visible:outline-solid`, sem `focus:outline-none` |
| Cartão invadindo o vizinho | grade por viewport em container estreito | container query |
| Texto invadindo o rótulo | `truncate` em `inline` | `inline-block` + `min-w-0` |
| Estroboscópio em `reduced-motion` | loop acelerado para 1ms em vez de desligado | `animation: none` no loop |
| Texto cortado sem contexto | falta `title` | `title` em todo `truncate` |
| Sheet "vazando" 10% da largura | pseudo-elemento do brilho com `inset: -10%` | `overflow-x: clip` no container de tema |

---

## 11. Definition of Done (por app)

- [ ] Tokens Aurora instalados; `globals.css` antigo sem resíduo (ou com resíduo justificado).
- [ ] `ThemeProvider theme="aurora"` + `MotionProvider` na raiz.
- [ ] Todas as telas da tabela da Fase 2 usando o bloco correspondente.
- [ ] Blocos faltantes (`tags`, `clinic-data`, `setup`, `receipts`) criados seguindo o contrato.
- [ ] Nenhuma regra da seção 2 quebrada; testes do app passando (`npm test`).
- [ ] Checkers: **100/100**, 0 erro de console, 0 overflow, 0 sem nome acessível.
- [ ] Doc do app atualizado com a tabela tela → bloco.

---

## 12. O que preciso de você para começar

1. Qual app primeiro (recomendo **CRM-Nutricionista**, que é o mais próximo do desenho final).
2. Se pode dar acesso ao repositório `Tupapirico100/blocos` para o workspace (ou prefere
   que eu copie os pacotes para dentro do app).
3. Se a identidade visual do app (marca, cor de CTA do CRM-HOF, logo) **deve** ser
   preservada ou se o Aurora pode assumir — isso decide se o `--accent` vira tema fixo
   ou **variável por app**.
