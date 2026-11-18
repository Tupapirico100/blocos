# Escolhas do dono — o que a plataforma usa

> Gerado por `node scripts/gerar-escolhas.mjs` a partir das receitas.
> Fonte da verdade: o campo `defaultVariant` de cada receita.

## Decisao transversal

| Eixo | Escolha | Onde fica |
|---|---|---|
| Tema | **aurora** (Aurora) | `ThemeProvider theme="aurora"` |
| Densidade padrao | **comfortable** | `ThemeProvider density="comfortable"` |
| Contraste | WCAG AA (4.5:1 texto, 3:1 texto grande/UI) | `qa-contraste*.py` |

As **outras** variacoes continuam na biblioteca como alternativas para outros
programas — so o padrao do produto foi fixado.

## Variacao escolhida por bloco

### identidade

| Bloco | Variacao escolhida | Alternativas na biblioteca | Intent da escolhida |
|---|---|---|---|
| `auth-login` | **Centralizada** | Dividida · Minima | Cartao unico flutuante, sem painel de marca ao lado |
| `auth-recovery` | **Formulário** | Passos · Dividida | Um formulario por vez, direto ao ponto |
| `auth-two-factor` | **Cartões** | Coluna · Passos | Fator e codigos de recuperacao lado a lado, com leitura de dois blocos |

### administracao

| Bloco | Variacao escolhida | Alternativas na biblioteca | Intent da escolhida |
|---|---|---|---|
| `office-settings` | **Seções** | Abas · Cartões | Tudo empilhado em secoes, do canal ao webhook |
| `office-team` | **Cartões** | Lista · Tabela | Um cartao por membro, com espaco para explicar a origem do acesso |
| `admin-platform` | **Cartões** | Tabela · Dividida | Um cartao por consultorio, com status e canal visiveis de relance |

### atendimento

| Bloco | Variacao escolhida | Alternativas na biblioteca | Intent da escolhida |
|---|---|---|---|
| `inbox-whatsapp` | **Dividido** | Empilhado · Foco | Lista de conversas e painel do chat lado a lado, para triagem em tela grande. |
| `channel-connections` | **Cartoes** | Tabela | Ver provedor, aceite de risco e status da WABA com detalhe por conexao. |
| `consent-panel` | **Tabela** | Cartoes · Timeline | Lista densa para conferir canal, versao e data de cada concessao. |
| `leads-board` | **Tabela** | Quadro · Timeline | Lista densa para volume alto de leads. |

### clinico

| Bloco | Variacao escolhida | Alternativas na biblioteca | Intent da escolhida |
|---|---|---|---|
| `patients-list` | **Tabela** | Cartoes · Grade | Lista densa para conferir muitos pacientes com busca por nome. |
| `patient-chart` | **Blocos** | Timeline · Abas | Consultas, medidas, plano e financeiro lado a lado na mesma tela. |
| `clinical-entry` | **Formulario** | Wizard · Linha | Registrar consulta ou medida com todos os campos de uma vez. |

### agenda

| Bloco | Variacao escolhida | Alternativas na biblioteca | Intent da escolhida |
|---|---|---|---|
| `agenda-board` | **Semana** | Dia · Lista | Comparar os 7 dias da semana por hora. |
| `availability` | **Semana** | Lista · Slots | Ver a grade semanal de todos os profissionais lado a lado. |
| `follow-up-tasks` | **Calendario** | Lista · Quadro | Ver a carga por dia e identificar dias apertados. |

### financeiro

| Bloco | Variacao escolhida | Alternativas na biblioteca | Intent da escolhida |
|---|---|---|---|
| `packages-pricing` | **Cards** | Tabela · Split | Comparar pacotes lado a lado com destaque para o preco. |
| `payments-checkout` | **Formulario** | Recibo · Split | Registrar um pagamento novo com o minimo de atrito. |
| `finance-overview` | **Grafico** | Cards · Tabela | Ver a receita por dia e comparar com a taxa de comparecimento. |

### relatorios

| Bloco | Variacao escolhida | Alternativas na biblioteca | Intent da escolhida |
|---|---|---|---|
| `meta-conversion` | **Tabela** | Timeline · Cards | Conferir evento, chave de dedup, estagio e origem com precisao. |
| `reports-funnel` | **Funil** | Cards · Tabela | Ler a queda entre as etapas e a taxa de conversao. |

### social

| Bloco | Variacao escolhida | Alternativas na biblioteca | Intent da escolhida |
|---|---|---|---|
| `social-automations` | **Fluxo** | Lista · Cartoes | Entender o encadeamento gatilho -> acao |
| `social-composer` | **Composer** | Dividido · So preview | Formulario e preview no mesmo eixo, para quem escreve |
| `social-accounts` | **Cartoes** | Grade | Ver conta, expiracao e ultima publicacao com folga |
| `social-logs` | **Tabela** | Linha do tempo | Varrer muitos registros e filtrar por nivel |

### operacao

| Bloco | Variacao escolhida | Alternativas na biblioteca | Intent da escolhida |
|---|---|---|---|
| `agent-console` | **Logs** | Conversa · Cartoes | Auditar as execucoes recentes do agente |
| `integration-manifest` | **Cartoes** | Tabela · Checklist | Ver o que cada conector destrava, com folga |
| `ops-health` | **Cartoes** | Tabela · Linha do tempo | Um panorama rapido do estado da operacao |
| `webhooks-panel` | **Lista** | Fluxo | Conferir todos os endpoints em tabela |

## Como trocar

1. Edite o `defaultVariant` na receita do bloco.
2. `npm run build && npm run build:app` — o catalogo ja abre na nova variacao.
3. `npm run mapa` e `npm run html` para regerar os artefatos.
4. `bash scripts/placar-final.sh` para revalidar os 100 pontos.

O `defaultVariant` tambem e lido por qualquer programa novo que importe a biblioteca:
```tsx
<LeadBoard data={leads} variant={recipe.defaultVariant} />
```