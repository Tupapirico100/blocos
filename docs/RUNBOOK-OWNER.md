# Runbook do dono — provisionamento de conexoes

> **Regra da plataforma:** API, WhatsApp, webhook, Instagram, Meta Ads e LLM sao conectados
> **somente pelo dono do programa**. Nao ha como um consultorio, um funcionario ou um
> terceiro plugar credencial alheia. O bloco de UI mostra o slot e o estado — nunca o segredo.

Este runbook cobre: o que cada conector destrava, quais variaveis de ambiente criar,
em que ordem, e o que fazer quando algo falha.

---

## 1. O modelo em uma frase

```
Bloco  -->  Slot (id)  -->  ConnectorRegistry  -->  resolve()  -->  segredo
                            ^
                     provision() exige provisionedBy
```

- O **bloco** conhece o `id` do slot (`"whatsapp"`, `"anthropic"`...).
- O **registro** sabe se o slot esta provisionado e por quem.
- O **segredo** so existe no ambiente do dono, injetado por ele.

Se o slot nao esta provisionado, a acao e recusada com
`CONNECTOR_NOT_PROVISIONED` e a UI mostra `ConnectorLock`.

---

## 2. Conectores e o que cada um destrava

| Slot | Tipo | Destrava | Variaveis (NOME, nunca valor) |
|---|---|---|---|
| `database` | database | Todos os blocos com dados (leads, pacientes, agenda, financeiro) | `DATABASE_URL` |
| `whatsapp` | whatsapp | `inbox-whatsapp`, `channel-connections`, agente atendendo paciente | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` |
| `anthropic` | llm | `agent-console` (agente Claude: sugerir slot, registrar atendimento, consultar lead) | `ANTHROPIC_API_KEY` |
| `instagram` | oauth | `social-accounts`, `social-composer`, `social-logs` | `META_APP_ID`, `META_APP_SECRET`, `INSTAGRAM_REDIRECT_URI` |
| `meta_ads` | api | `meta-conversion` (fila de conversao / CAPI) | `META_ACCESS_TOKEN`, `META_BUSINESS_ID` |
| `webhooks` | webhook | `webhooks-panel` (saida), eventos para outros sistemas | `WEBHOOK_SECRET_REF` (nome da env, nao o valor) |
| `storage` | storage | Upload de midia (post do Instagram, anexos do paciente) | `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` |
| `email` | email | Convite de equipe, recuperacao de senha | `SMTP_URL`, `MAIL_FROM` |
| `pdf` | pdf | Recibo, comprovante de consentimento, export | — (usa o motor do programa) |

### Regra do provedor nao-oficial

`whatsapp` tem **6 provedores** (1 oficial + 5 nao oficiais). Os nao oficiais exigem **aceite
versionado** do dono: versao do texto de risco, quem aceitou, quando. Sem aceite vigente, o
bloco `channel-connections` mostra o provedor como bloqueado. O texto de risco vive com
versao — nunca como texto mutavel.

---

## 3. Ordem de provisionamento

1. `database` — sem ele nada tem dado.
2. `email` — convite de equipe e recuperacao de senha.
3. `whatsapp` — atendimento (o coracao do produto).
4. `anthropic` — agente. So depois que o atendimento humano esta estavel.
5. `instagram` — social.
6. `meta_ads` — conversao. Depende do `whatsapp` (Click-to-WhatsApp).
7. `webhooks` — integracao com outros sistemas.
8. `storage` / `pdf` — sob demanda.

---

## 4. Como provisionar de verdade

```ts
import { connectors } from "@blocos/core";

connectors.require({
  id: "whatsapp",
  label: "WhatsApp (Cloud API)",
  kind: "whatsapp",
  description: "Conta business da Meta conectada ao canal do consultorio.",
  env: ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"],
  howTo: "Meta for Developers -> WhatsApp -> API Setup -> token permanente.",
  ownerOnly: true,
});

connectors.provision({
  id: "whatsapp",
  status: "provisioned",
  provisionedBy: "dono@programa.com",   // OBRIGATORIO quando ownerOnly
  provisionedAt: new Date().toISOString(),
  resolve: () => process.env.WHATSAPP_TOKEN,   // o segredo nunca sai daqui
});
```

Regras de codigo:

- `resolve()` devolve o segredo **na hora do uso**, nunca serializado.
- `ConnectorRegistry.snapshot()` (usado na tela de conexoes e em auditoria) devolve
  **estado**, nao segredo.
- Se `ownerOnly: true` e `provisionedBy` ausente → `ConnectorNotProvisionedError`.
- `tryResolve()` devolve `undefined` em vez de lancar (use em caminho opcional).

---

## 5. Bloqueio em runtime

```ts
const result = await runtime.execute("message.send", { leadId: "..." }, ctx);
// -> { code: "CONNECTOR_NOT_PROVISIONED", connectors: ["whatsapp"] }
```

E na UI:

```tsx
<BlockFrame requires={["whatsapp"]} connectors={connectorStates}>
  <InboxWhatsApp ... />
</BlockFrame>
```

Quando o conector falta, o `BlockFrame` troca o conteudo pelo `ConnectorLock` — o bloco
**nao finge funcionar** com dados de demonstracao. Essa e a diferenca entre um produto e
um WIREFRAME.

---

## 6. Seguranca — o que o dono NAO deve fazer

1. **Nunca** colocar chave de API no codigo do bloco. O bloco viaja para outros programas.
2. **Nunca** expor a chave na URL de webhook de saida. Usar `secretRef` (nome da env var).
3. **Nunca** registrar dado de saude (consulta, medida, plano) em log, erro ou evento de
   marketing. A fila de conversao da Meta e auditada por isso.
4. Segredo de webhook de saida: **referencia por nome** + comparacao em tempo constante.
5. Webhook de saida: HTTPS + IP publico (guard de SSRF), retry 1m -> 5m -> 15m -> 1h -> 6h -> 24h.
6. Troca de identidade (`user_id`, `office_id` em tabela de equipe) tem que ser **imutavel**
   no nivel do banco — policy de UPDATE nao restringe coluna; use trigger.
7. Dono da plataforma: acesso `platform` nao pode ser removido nem rebaixado pelo dono do
   consultorio (trigger `guard_membership`).

---

## 7. Checklist de smoke test

Ao provisionar, valide nesta ordem:

- [ ] `connectors.snapshot()` mostra o slot como `provisioned`.
- [ ] O bloco aparece desbloqueado (sem `ConnectorLock`).
- [ ] Uma acao do bloco roda de ponta a ponta e o log nao contem o segredo.
- [ ] Desprovisionar (remover a env var) devolve o bloco ao estado bloqueado, sem quebrar a tela.
- [ ] O retrato de conexoes mostra **quem** provisionou e **quando**.
