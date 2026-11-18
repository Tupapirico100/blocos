import { defineBlock } from "@blocos/core";

/**
 * social-logs — registro das respostas automaticas (comentario -> direct).
 *
 * Extraido de `Agendador-Instagram: src/app/(app)/logs/page.tsx`.
 * Somente leitura: resposta que falhou nao e reenviada sozinha (a Meta aceita
 * 1 resposta privada por comentario).
 */
export const socialLogsRecipe = defineBlock({
  id: "social-logs",
  name: "Registros de respostas",
  domain: "social",
  summary:
    "Ultimas respostas automaticas: quando, conta, automacao, quem escreveu, o texto recebido e o resultado (enviada, ignorada, em andamento ou erro).",
  origins: ["Agendador-Instagram: src/app/(app)/logs/page.tsx"],
  ports: [
    {
      id: "automationLogs",
      label: "Registros das automacoes",
      contract:
        "As 100 ultimas linhas de automation_logs com o nome da automacao e o @ da conta. Erro ja vem tratado, sem token nem corpo cru da Meta.",
      methods: ["listRecent(limit): SocialLogEntry[]"],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [],
  connectors: [
    { id: "database", label: "Banco de dados", kind: "database", description: "Postgres (Supabase), so a service role.", ownerOnly: true },
  ],
  rules: [
    "Somente leitura: nao existe reenviar. A Meta aceita 1 resposta privada por comentario e repetir vira spam.",
    "`skipped` = a pessoa ja tinha recebido esta automacao (1 direct por pessoa por automacao).",
    "Guarda @ e texto de quem comentou (dado pessoal): a retencao e responsabilidade do servidor.",
    "Estado sempre em texto + bolinha, nunca so cor.",
  ],
  defaultVariant: "table",
  variants: [
    {
      id: "table",
      label: "Tabela",
      intent: "Comparar muitas respostas lado a lado",
      tradeoff: "Rola na horizontal no celular",
    },
    {
      id: "timeline",
      label: "Linha do tempo",
      intent: "Ler no celular, uma resposta por linha",
      tradeoff: "Mostra menos linhas por tela",
    },
  ],
  states: ["loading", "success", "empty", "error"],
  sensitive: true,
});
