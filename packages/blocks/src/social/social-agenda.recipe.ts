import { defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * social-agenda — a fila de posts por dia ("folha de rota").
 *
 * Extraido de `Agendador-Instagram: src/app/(app)/posts/page.tsx`.
 */

export const postIdInput = z.object({ id: z.string().uuid() });

export const socialAgendaRecipe = defineBlock({
  id: "social-agenda",
  name: "Agenda de posts",
  domain: "social",
  summary:
    "Fila de posts do Instagram por dia, com hora, conta, formato, miniatura e estado, ações por estado (publicar agora, tentar de novo, cancelar, excluir) e o histórico recente.",
  origins: ["Agendador-Instagram: src/app/(app)/posts/page.tsx", "Agendador-Instagram: src/app/(app)/posts/actions.ts"],
  ports: [
    {
      id: "postsRepository",
      label: "Posts",
      contract:
        "Até 100 posts na fila (agendado, processando, publicando, erro) em ordem de horário e os 30 últimos publicados/cancelados, agrupados por dia em America/Sao_Paulo.",
      methods: ["listUpcoming(accountId?): Post[]", "listHistory(accountId?): Post[]"],
      connectors: ["database", "storage"],
      mockable: true,
    },
    {
      id: "scheduler",
      label: "Agendador",
      contract: "Publicar agora e tentar de novo rodam o tick dentro da ação; media_publish nunca é repetido sozinho.",
      methods: ["publishNow(id): void", "retry(id): void", "cancel(id): void", "remove(id): void"],
      connectors: ["instagram", "database"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "post.publishNow",
      title: "Publicar agora",
      description: "Use quando o usuario quiser publicar um post agendado sem esperar o horário.",
      input: postIdInput,
      http: { method: "POST", path: "/posts/:id/publish-now" },
      permissions: ["owner"],
      connectors: ["instagram"],
      states: ["success", "error"],
    },
    {
      id: "post.retry",
      title: "Tentar de novo",
      description:
        "Use quando um post estiver com erro. Reaproveita o container se ele ainda existir; se o erro foi depois do media_publish, confira o Instagram antes (pode já ter publicado).",
      input: postIdInput,
      http: { method: "POST", path: "/posts/:id/retry" },
      permissions: ["owner"],
      connectors: ["instagram"],
      states: ["success", "error"],
    },
    {
      id: "post.cancel",
      title: "Cancelar post",
      description: "Use quando o usuario confirmar que quer tirar um post agendado da fila.",
      input: postIdInput,
      http: { method: "POST", path: "/posts/:id/cancel" },
      permissions: ["owner"],
      connectors: ["database"],
      states: ["success", "error"],
    },
    {
      id: "post.delete",
      title: "Excluir post",
      description: "Use quando o usuario confirmar a exclusão de um post com erro ou cancelado (e dos arquivos dele).",
      input: postIdInput,
      http: { method: "DELETE", path: "/posts/:id" },
      permissions: ["owner"],
      connectors: ["database", "storage"],
      states: ["success", "error"],
    },
  ],
  connectors: [
    { id: "instagram", label: "Instagram Graph API", kind: "api", description: "Publicação em graph.facebook.com.", ownerOnly: true },
    { id: "database", label: "Banco de dados", kind: "database", description: "Postgres (Supabase), só a service role.", ownerOnly: true },
    { id: "storage", label: "Storage", kind: "storage", description: "Bucket público com as mídias (a Meta baixa pela URL).", ownerOnly: true },
  ],
  rules: [
    "Cancelar e excluir sempre pedem confirmação.",
    "Ações por estado: agendado (publicar agora, editar, cancelar); erro (tentar de novo, editar, excluir); cancelado (reagendar, excluir); publicado (detalhes).",
    "Horários sempre em America/Sao_Paulo.",
    "Link 'Ver no Instagram' só aparece para https://www.instagram.com/.",
    "Estado sempre em texto + bolinha, nunca só cor.",
  ],
  defaultVariant: "route",
  variants: [
    {
      id: "route",
      label: "Folha de rota",
      intent: "Cada dia é uma faixa com o número grande e os posts como linhas, com miniatura",
      tradeoff: "Ocupa mais altura por causa das miniaturas",
    },
    {
      id: "compact",
      label: "Compacta",
      intent: "Ver mais posts por tela, sem miniaturas",
      tradeoff: "Sem a prévia da arte",
    },
  ],
  states: ["loading", "success", "empty", "error"],
});
