# Contrato de implementacao — @blocos/blocks

Este arquivo e LEI para qualquer agente que implemente blocos. Leia inteiro antes de codar.

## 1. Onde o codigo vive

```
packages/blocks/src/<dominio>/<nome-do-bloco>.tsx        -> a tela/bloco
packages/blocks/src/<dominio>/<nome-do-bloco>.recipe.ts  -> a "receita" (contrato de logica)
packages/blocks/src/<dominio>/mock.ts                     -> dados ficticios para o catalogo
packages/blocks/src/<dominio>/index.ts                    -> re-exports do dominio
```

Dominios ja reservados (NÃO invente novos diretorios):
`identidade`, `administracao`, `atendimento`, `clinico`, `agenda`, `financeiro`, `relatorios`, `social`, `operacao`.

Nao edite nada fora do seu diretorio. Nao edite `packages/blocks/src/index.ts` (raiz) —
ele e montado pelo orquestrador depois. Nao edite `packages/core`, `packages/ui`, `packages/tokens`.

## 2. Dependencias permitidas (ja instaladas — nao instale nada)

- `react`, `react-dom` (React 19)
- `@blocos/core` — contratos, tipos, helpers
- `@blocos/ui` — primitivos visuais
- `lucide-react` — icones
- `motion/react` — animacoes (import de `"motion/react"`, NAO de `"framer-motion"`)
- `zod` — schemas de entrada das acoes

Proibido: `fetch` para dados externos, `axios`, `date-fns`, `recharts`, qualquer lib nova,
qualquer import direto de `radix-ui` (os primitivos ja vem prontos no `@blocos/ui`).

## 3. Como a tela recebe dados

A tela NUNCA busca. Ela recebe `data` ja resolvido e devolve intencao por `onAction`.

```tsx
import type { BlockProps } from "../shared/index.js";

export interface LeadBoardData {
  leads: Array<{ id: string; name: string; phone: string; stage: string; source?: string }>;
  stages: Array<{ id: string; label: string; color?: string }>;
}

export function LeadBoard(props: BlockProps<LeadBoardData, "board" | "table">) {
  const { data, onAction, variant = "board" } = props;
  // ...
}
```

Regras:
- `onAction("lead.move", { id, stage })` — nome da acao em `dominio.verbo`, payload em camelCase.
- Nenhum acesso a rede, `window`, `localStorage`, `document` (exceto `typeof window` guard).
- Nada de estado global. `useState` local e permitido.
- Componente deve ser funcional e sem props obrigatorias alem de `data`.

## 4. Como a "receita" e escrita

Cada bloco tem UM arquivo `.recipe.ts` com `defineBlock({...})` de `@blocos/core`:

```ts
import { defineBlock } from "@blocos/core";
import type { BlockRecipe } from "@blocos/core";

export const leadBoardRecipe = defineBlock({
  id: "leads-board",
  name: "Quadro de leads",
  domain: "atendimento",
  summary: "Leads por etapa, com atribuicao de primeiro toque e filtro de origem.",
  origins: ["CRM-Nutricionista: src/app/[locale]/leads/page.tsx", "CRM-HOF: src/app/[locale]/leads/page.tsx"],
  ports: [
    { id: "leadsRepository", label: "Repositorio de leads", contract: "Leads por consultorio, paginado por cursor.", methods: ["listByStage(stage, cursor): Lead[]", "moveStage(id, stage): Lead"], connectors: ["database"], mockable: true },
  ],
  actions: [
    { id: "lead.move", title: "Mover lead", description: "Move um lead entre etapas. Use quando o usuario arrastar ou clicar em 'mover'.", http: { method: "POST", path: "/leads/:id/stage" }, permissions: ["owner", "receptionist"], connectors: ["database"], states: ["success", "error"] },
  ],
  connectors: [
    { id: "database", label: "Banco de dados", kind: "database", description: "Postgres do programa.", ownerOnly: true },
  ],
  rules: [
    "Regra 11: so respondemos quem esta na lista de permitidos.",
    "A atribuicao e do PRIMEIRO toque (lead), nao do clique.",
  ],
  variants: [
    { id: "board", label: "Quadro", intent: "Trabalho visual por etapa", tradeoff: "Ve poucos leads por vez" },
    { id: "table", label: "Tabela", intent: "Lista densa para volume alto" },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
```

Regras da receita:
- `id` kebab-case estavel. `domain` de `BlockDomain`.
- `origins`: caminhos REAIS de onde o bloco foi extraido (ver secao 6).
- `ports`: as portas de logica que a implementacao real precisa (repo, servico, provider).
- `actions`: acoes com `id`, `title`, `description` (a description e lida pelo AGENTE — escreva
  QUANDO usar), `http` (quando faz sentido), `permissions`, `connectors`, `readOnly`.
- `connectors`: conectores externos. `ownerOnly: true` para API/WhatsApp/webhook/LLM.
  Conectores de banco/storage tambem sao ownerOnly (o dono do programa provisiona).
  Conectores CONHECIDOS e que voce pode usar: `database`, `whatsapp`, `anthropic`,
  `instagram`, `meta_ads`, `webhooks`, `storage`, `email`, `pdf`.
- `rules`: invariantes reais do negocio herdados dos repos (ver secao 6).
- `variants`: 2 a 3 variacoes por bloco, com `id`, `label`, `intent` e `tradeoff` honesto.
- `states`: estados de UI cobertos.

## 5. Regras visuais (design system "Aurora")

- Use os tokens pelo nome de classe Tailwind: `bg-surface`, `bg-surface-strong`, `text-fg`,
  `text-fg-secondary`, `text-fg-muted`, `text-fg-faint`, `border-border`, `border-border-strong`,
  `bg-accent`, `text-accent`, `bg-accent-soft`, `text-success`, `bg-success-soft`,
  `text-warn`, `bg-warn-soft`, `text-danger`, `bg-danger-soft`, `text-info`, `bg-info-soft`.
- Tipografia: `bloco-display`, `bloco-title1`, `bloco-title2`, `bloco-title3`, `bloco-headline`,
  `bloco-body`, `bloco-callout`, `bloco-caption`, `bloco-micro`, `bloco-mono`.
- Superficies: `Panel` de `@blocos/ui` (tom `glass`, `solid`, `outline`), `bloco-glass` para vidro cru.
- Nunca fixe cores hex no JSX (excecao: series de grafico).
- Raios e espacamento: `rounded-[var(--r-md)]`, `p-[var(--sp-4)]` etc. Prefira `gap-2/3/4`.
- Movimento: `motion/react` com `transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}`.
  Respeite `prefers-reduced-motion` (a classe `bloco-anim-*` ja cuida).
- Acessibilidade: `aria-label` em botoes so icone, `focus-visible` visivel, `role` correto,
  `<table>` para dados tabulares (use `DataTable`).
- Escreva tudo em **pt-BR** na interface. Identificadores de codigo em ingles.
- Glossario: use **"consultório"**, nunca "clínica". Use "paciente", "lead", "atendimento".
- NUNCA renderizar dado de saude (consulta, medida, plano alimentar) em log, URL ou telemetria.

## 6. Contexto de negocio (herdado dos repos)

Reglas reais que valem para todos os blocos:

- **Regra 11 (lista de permitidos)**: so se responde a quem esta na lista de permitidos.
  Quem inicia o contato entra na lista automaticamente.
- **Janela de 24h**: mensagem livre so dentro de 24h apos o cliente escrever. Fora disso,
  so template aprovado.
- **Lead = pessoa; clique = toque.** Relatorio por origem conta PESSOAS; por anuncio conta CLIQUES.
- **Atribuicao do primeiro toque**: a origem de um lead e a do primeiro contato, nao a ultima.
- **Estagio fixo de lead**: `new` -> `qualified` -> `customer`.
- **Dinheiro em centavos**, sempre. Formatado em BRL. Estorno devolve o lead.
- **Consentimento**: tratamento (art. 11) e marketing (art. 7) sao separados; o de
  tratamento nao substitui o de marketing. Registro guarda snapshot do texto aceito.
- **Prontuario exige consentimento de tratamento vigente** — nao da para gravar sem.
- **Fila de eventos da Meta** usa chave deterministica (dedup) e NUNCA leva dado de saude.
- **Dono da plataforma** tem acesso total ao consultorio; o dono do consultorio (owner)
  so opera o operacional. O acesso `platform` nao pode ser removido nem rebaixado pelo dono.
- **Entry point do agente**: `employee` e `user` sao o MESMO papel (unico por consultorio).
  Todo mundo que fala com o paciente eemployee. `responsible`/`owner` sao cargos administrativos.
- **Webhooks de saida**: HTTPS + IP publico (guard de SSRF), segredo por referencia
  (`secretRef` = nome da env var), retry 1m -> 5m -> 15m -> 1h -> 6h -> 24h.
- **Agendamento**: bloqueia em cima de folga do profissional; slots ja descontam marcado e bloqueado.
- **Timezone**: America/Sao_Paulo. Conversao local<->UTC faz DUAS passadas (DST).

Origens reais (use estes caminhos em `origins`):

- `CRM-Nutricionista` (pt-BR, Next.js App Router, Supabase + RLS, 11 fatias F0-F11):
  `src/app/[locale]/{login,seguranca/2fa,esqueci-senha,definir-senha,admin,admin/consultorios,
  consultorios,consultorios/[officeId]/equipe,consultorios/[officeId]/webhook,leads,canal,pacientes,
  pacientes/[id],pacientes/[id]/consentimentos,agenda,agente,financeiro,relatorios}`,
  `src/core/services/*`, `src/core/channels/*`, `src/core/agent/*`, `src/components/AppNav.tsx`
- `Agendador-Instagram` (pt-BR, Next.js, Instagram Graph API):
  `src/app/(app)/{accounts,posts,posts/new,posts/[id],automations,logs}`,
  `src/app/api/instagram/*`, `src/lib/{instagram,automations,scheduler}/*`, `src/components/*`
- `CRM-HOF` (es-PE, Next.js, Drizzle + Supabase, mais maduro):
  `src/app/[locale]/{leads,canal,patients,patients/[id],patients/[id]/consents,agenda,follow-up-tasks,
  tags,packages,payments,receipts,reports,meta,webhooks,clinic-data,clinics,setup,two-factor}`,
  `src/core/{messaging,agenda,events,permissions,services}/*`

## 7. Dados ficticios (mock)

Cada dominio tem `mock.ts` exportando um objeto com dados plausiveis em pt-BR
(nomes brasileiros, telefones E.164, valores em centavos, datas ISO).
Sem dados reais de paciente. Sem nome de empresa real.

## 8. Definition of Done (obrigatorio)

Antes de terminar:

```bash
cd /workspace/blocos && npm run build -w @blocos/blocks
```

Tem que passar SEM erro de TypeScript. Se nao passar, o trabalho NAO esta pronto.
Rode de novo ate zerar. Nao deixe TODO em codigo de bloco.

## 9. O que NAO fazer

- Nao mexer em `packages/core`, `packages/ui`, `packages/tokens`.
- Nao mexer em `apps/catalog`.
- Nao criar `packages/blocks/src/index.ts`.
- Nao escrever mais de ~1 bloco por arquivo (um bloco = uma tela coerente).
- Nao adicionar dependencias.
- Nao fazer commit nem push.
