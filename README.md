# Blocos — biblioteca de blocos reutilizaveis + design system (beta)

Extraido de tres repositorios reais do dono:

| Repo | O que contribuiu |
|---|---|
| `CRM-Nutricionista` | CRM de consultorio (pt-BR): identidade, 2FA, admin da plataforma, leads, canal, pacientes, consentimento, agenda, agente, financeiro, relatorios, webhooks |
| `Agendador-Instagram` | App de social media: contas OAuth, composer de post, automacoes, logs, agendamento |
| `CRM-HOF` | CRM de clinicas (es-PE), o mais maduro: kanban de leads, inbox, 6 provedores de WhatsApp, agenda com disponibilidade, pacotes/pagamentos/recibo, tags, follow-up, meta events, webhooks de saida |

Cada bloco vira uma **receita**: um mesmo conjunto de acoes serve para a tela, para a rota
HTTP e para o agente, com a logica entrando por portas e as credenciais ficando com o
**dono do programa**.

---

## Sumario

```
packages/
  core/     contratos: acoes, receitas, portas, conectores owner-only, runtime, dinheiro, timezone
  tokens/   design system "Aurora": tokens CSS, temas, densidades, movimento
  ui/       primitivos: Button, Panel, Field, DataTable, Dialog, Tabs, Drawer, Callout, ThemeProvider
  blocks/   os blocos de negocio (29), cada um em .tsx (a tela) + .recipe.ts (a receita)
apps/
  catalog/  catalogo visual em beta: voce escolhe tema, densidade, variacao e estado de cada bloco
docs/
  MAPA-BLOCOS.md   mapa: origem -> bloco -> onde reusar
  ESCOLHAS-DO-DONO.md  tema + variacao escolhida por bloco (padrao do produto)
  DESIGN-SYSTEM.md guia do design system
  DECISOES.md      decisoes tecnicas e o que foi descartado
  RUNBOOK-OWNER.md como o dono provisiona as conexoes
  CONTRATO-BLOCOS.md  contrato de implementacao (lei para quem for criar bloco novo)
```

---

## Rodando

```bash
npm install
npm run build          # core -> tokens -> ui -> blocks
npm run dev            # catalogo em http://localhost:5173
npm run build:app      # build estatico do catalogo
npm run html           # gera docs/catalogo-blocos.html (um arquivo so, offline)
npm run mapa           # regenera docs/MAPA-BLOCOS.md a partir do codigo
npm run verificar      # build + app + mapa + html
```

### Catalogo offline (sem servidor, sem login)

`npm run html` gera **`docs/catalogo-blocos.html`** — o catalogo inteiro em UM arquivo
(CSS + JS inline, ~0,9 MB). Voce abre com dois cliques, funciona offline e nao depende de
nenhuma URL publica. Util para levar a um celular, revisar num airplane ou mandar para
alguem da equipe.

> O arquivo gerado nao esta no repo (0,9 MB estouraria o limite do conector do GitHub).
> O gerador esta: `scripts/gerar-html-autocontido.mjs`.

---

## Como usar um bloco

```tsx
import { LeadBoard } from "@blocos/blocks";
import type { LeadBoardData } from "@blocos/blocks";

<LeadBoard
  variant="board"                                   // board | table | timeline
  data={leads}                                      // dado ja resolvido
  onAction={(action, payload) => {
    // action = "lead.move" | "lead.assign" | ...
  }}
/>
```

O bloco **nao busca nada**. Quem monta a tela decide como resolver `data` e o que fazer
com a intencao. Trocar de banco, de framework ou de dono nao muda o bloco.

## Como usar uma acao (UI, HTTP e agente)

```ts
import { runtime, connectors } from "@blocos/core";

const result = await runtime.execute("lead.move", { id, stage }, ctx);
// { data, state: "success" | "empty" | "forbidden" }
```

A mesma definicao de acao (com schema zod, permissao e conector) e o que o agente ve como
tool. A UI e o agente nao podem divergir porque nao ha implementacao duplicada.

## Conexoes owner-only

```ts
connectors.provision({
  id: "whatsapp",
  status: "provisioned",
  provisionedBy: "dono@programa.com",   // obrigatorio
  resolve: () => process.env.WHATSAPP_TOKEN,
});
```

A UI mostra o slot e o estado. Nao mostra o segredo. Sem provisionamento, o bloco exibe
`ConnectorLock` e a acao e recusada com `CONNECTOR_NOT_PROVISIONED`.

---

## O catalogo (beta)

`apps/catalog` e a vitrine onde voce ve **tudo**: cada bloco, nas suas variacoes, nos tres
temas, nas duas densidades e nos cinco estados — com a receita (acoes, portas, conectores,
regras, origem) do lado direito.

E onde voce vai escolher: a **variacao** que fica em cada bloco e o **tema** do sistema.
Depois de escolher, a escolha vira o default da biblioteca.

---

## Estado

Beta. 29 blocos mapeados e implementados (62 acoes, 83 variacoes de UI), 3 temas, 2 densidades.
Sem publicacao em npm ainda (workspace local). Testes, Storybook e RSC sao melhorias
pendentes — listadas em `docs/DECISOES.md`.
