# Decisoes tecnicas da biblioteca "Blocos" (beta)

Data: 2026-11-17 · Escopo: biblioteca de blocos reutilizaveis + design system, extraidos de
`CRM-Nutricionista`, `Agendador-Instagram` e `CRM-HOF`.

---

## D-001 · Base de UI: Radix + Tailwind v4, no estilo shadcn/ui

**Decisao:** primitivos composaveis (Radix UI) estilizados com Tailwind v4 e tokens proprios.
Sem dependencia de "design system fechado".

**Alternativas avaliadas:**

| Biblioteca | Veredito | Motivo |
|---|---|---|
| MUI | descartada | opinionated demais; o visual "Apple/glass" exigiria customizacao por dentro e briga constante. Bundle grande. |
| Ant Design | descartada | mesma razao, mais o "look de admin" que e exatamente o que queremos matar. |
| Chakra UI | descartada | runtime de estilos/CSS-in-JS adds peso; Props de estilo que nao sobrevivem a um design system de vidro. |
| React Aria (Adobe) | **parcial** | adotada como **referencia de interacao e acessibilidade** (teclado, focus, cole). Nao adotada como camada de componentes visuais: e headless, e nao entrega o vidro/elevacao. |
| shadcn/ui | **adotada como modelo** | "copy-in": o codigo do design system mora no NOSSO repo e vira IP do dono do programa. |

**Por que isso importa para o dono do programa:** nada de terceiros decide a aparencia do
produto. O `packages/tokens` e o `packages/ui` sao do dono; o Radix so cuida de comportamento
(foco, teclado, aria) — que e o que commoditizar.

## D-002 · Tres temas, nao um tema

`aurora` (escuro + vidro, padrao), `daylight` (claro, editorial), `graphite` (escuro neutro,
denso para operacao) + duas densidades (`comfortable`, `compact`).

**Por que:** o pedido foi explicitamente "o novo design system precisa ter variacoes e eu vou
escolher uma". Tres eixos independentes (tema x densidade x variacao-do-bloco) dao 6 combinacoes
de sistema sem reescrever nada.

**Regra:** nenhuma cor fora dos tokens. Excecao: series de grafico.

## D-003 · Vidro com profundidade real, nao "blur bonito"

O vidro usa 3 camadas: fundo translucido + `backdrop-filter: blur() saturate()` + reflexo
especular no topo (mascote com `mask-composite`). Sem o reflexo, vidro em fundo escuro vira
"cinza sujo". O `-webkit-mask-composite: xor` desenha a borda de 1px com gradiente — e o que
da a sensacao de lente.

## D-004 · Movimento com a curva da Apple

`cubic-bezier(0.32, 0.72, 0, 1)` (a curva "spring-like" usada pelo iOS/macOS), duracoes
120/180/260/420/700ms. `prefers-reduced-motion` reduz tudo a 1ms.

**Por que:** movimento aqui **explica**, nao decora. Troca de painel faz fade+scale curto;
abrir conversa faz slide; lista nova faz fade-up escalonado. Nada de bouncing.

## D-005 · "Uma acao, todas as superficies" (inspirado no Agent-Native)

Cada bloco declara **acoes** com schema (`zod`), permissoes e conectores. A mesma acao e:

- chamada pela UI (botao),
- exposta como rota HTTP (`http: { method, path }`),
- exposta como **tool de agente** (o agente usa a mesma definicao; a descricao e lida como
  "quando usar"),
- reusada por qualquer programa novo que importe o pacote.

**Por que importa:** o "agente nativo para React" (agent-native.com) resolve exatamente o
problema do reuso — a UI e o agente nao podem divergir. Aqui a divergencia e impedida por
construcao: nao ha schema dentro do componente.

## D-006 · Conectores owner-only: a regra do "acesso so do dono"

**Decisao:** chaves de API, credenciais de WhatsApp/Meta, webhooks, tokens de LLM e storage
sao provisionados **exclusivamente pelo dono da plataforma**. O resto do sistema enxerga
apenas o *slot*.

Mecanica:
- `ConnectorRequirement` declara o slot (id, tipo, env vars **por nome**, como provisionar).
- `ConnectorRegistry.provision()` exige `provisionedBy` quando `ownerOnly === true`.
- `ConnectorRegistry.resolve()` lanca `ConnectorNotProvisionedError` se nao provisionado.
- A UI usa `BlockFrame` -> `ConnectorLock`: o bloco mostra o que falta e **nao** finge funcionar.
- `ActionRuntime.execute()` recusa a acao e devolve `CONNECTOR_NOT_PROVISIONED`.

**Por que:** o bloco e uma receita distribuivel. Se a chave estivesse dentro do bloco, ela
viajaria junto para qualquer programa novo — exatamente o que nao deve acontecer. O slot
viaja; o segredo nao.

## D-007 · Logica por portas, nunca por vendor

Todo bloco declara `ports` (repositorios, servicos, providers). A tela nao busca nada:
recebe `data` e devolve intencao via `onAction`. Isso torna o bloco testavel com mock
(`mockable: true`) e portavel entre Postgres/Supabase/Drizzle.

## D-008 · Dinheiro em centavos, sempre

Herdado dos dois CRMs. `formatBRL` e `parseBRLToCents` no `@blocos/core`. Ponto flutuante
proibido (o `money()` lanca se o valor nao for inteiro).

## D-009 · Sem dado de saude em log, URL ou telemetria

Regra herdada do CRM-Nutricionista (`assertNoHealthData`) e reforcada no CRM-HOF
(`assert-no-health-data.ts`). A fila de conversao da Meta usa chave deterministica e payload
sem dado clinico. Blocos de clinico nunca logam conteudo de prontuario.

## D-010 · PT-BR na interface, ingles no codigo

Identificadores, nomes de arquivo e de porta em ingles (kebab-case / camelCase).
Texto de interface e documentacao em pt-BR. Glossario do CRM mantido: **"consultorio"**,
nunca "clinica".

---

## O que NAO foi decidido agora (beta)

1. **Publicacao do pacote** — hoje e workspace local. Proximo passo: `npm publish` com
   `@blocos/*` ou git submodule para os repos existentes.
2. **Storybook** — o catalogo em `apps/catalog` cobre o requisito de "ver as variacoes";
   Storybook fica como melhoria se a biblioteca crescer.
3. **Testes** — os blocos sao presentacionais por contrato (recebem `data`), o que os torna
   trivialmente testaveis com Testing Library. Nao Priorizado no beta.
4. **React Server Components** — os blocos sao `use client` friendly (tem `onAction` e
   `useState`). Para Next.js App Router, o consumidor decide onde montar.

## Idioma, moeda e fuso configuraveis (18/11/2026, para o CRM-HOF do Peru)

O CRM-HOF e do Peru: interface em espanhol (es-PE) e ingles, soles (PEN),
fuso America/Lima. Os blocos tinham pt-BR, BRL e America/Sao_Paulo fixos —
uma cita das 10:00 em Lima apareceria as 12:00.

- `LocaleProvider` / `useBlocosLocale` em `@blocos/ui`: `locale`, `currency`,
  `timeZone` e `messages` (texto por chave, interpolacao `{nome}`). Padrao
  pt-BR / BRL / America/Sao_Paulo e o texto de sempre: **sem o provedor nada
  muda** para o CRM-Nutricionista (provado por `npm run verificar:locale`).
- `formatCurrency` em `@blocos/core` (qualquer moeda e idioma); `formatBRL`
  continua igual e passa a usa-lo.
- Chaves ja existentes: `ui.*` (Confirmar, Cancelar, Fechar, Dispensar,
  Alternar, Selecionar, bloqueio de conector), `frame.*` (vazio, erro, sem
  permissao), `role.<papel>` (o nome do papel no "sem permissao" — o
  `ROLE_LABEL` continua o padrao), `connector.<id>` e `webhooks.*`.
- `webhooks-panel` e o primeiro bloco inteiro no provedor. Ganhou, opcionais
  e desligados por padrao: `eventLabels` (nome legivel do evento),
  `canPreview` (acao `webhook.preview`, so leitura, nao envia nada) e
  `showHeader`.
- Os outros blocos seguem com texto e formato fixos ate migrarem, um por PR,
  junto com a tela correspondente no app.

## packages-pricing no provedor (18/11/2026, CRM-HOF)

Para a tela `service-packages/` do CRM-HOF (Peru): textos e moeda pelo
`LocaleProvider` (chaves `packages.*`), `currency` por pacote, e quatro
opcionais desligados so quando o app pede — `canSave` (no CRM-HOF o banco
proibe UPDATE e o pacote so e descontinuado), `canToggle` (a recepcao so ve),
`showValidity` (pacotes sem validade) e `showHeader`. O render padrao e
identico ao da `main` nas 3 variacoes x 3 estados (`scripts/comparar-padrao.mjs`).

## patients-list no provedor (19/11/2026, CRM-HOF)

Para a tela `patients/` do CRM-HOF (Peru): textos pelo `LocaleProvider`
(chaves `patients.*`), coluna de documento (DNI) e opcionais `showSearch`,
`showConsent`, `showLastVisit` e `showDocument`. Correcao: o `formatPhone`
do dominio clinico tratava todo numero como brasileiro (`+51 933 333 333`
virava `+55 (51) 93333-3333`); numero internacional de outro pais agora sai
correto, e o brasileiro continua igual. Render padrao identico ao da main
(`comparar-padrao`, 20/20).
