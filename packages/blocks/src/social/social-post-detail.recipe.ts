import { defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * social-post-detail — um post: arquivos, fatos, acoes e edicao (legenda + horario).
 *
 * Extraido de `Agendador-Instagram: src/app/(app)/posts/[id]/page.tsx` e `src/components/EditPostForm.tsx`.
 */

export const postUpdateInput = z.object({
  id: z.string().uuid(),
  caption: z.string().max(2200, "A legenda vai até 2200 caracteres."),
  /** ISO (convertido no navegador a partir do horario local). */
  scheduledAt: z.string().min(1, "Escolha a data e a hora."),
});

export const socialPostDetailRecipe = defineBlock({
  id: "social-post-detail",
  name: "Detalhe do post",
  domain: "social",
  summary:
    "Um post do Instagram: arquivos, formato, horário, link publicado, status na Meta, tentativas, automação ligada, ações por estado e edição de legenda e horário.",
  origins: ["Agendador-Instagram: src/app/(app)/posts/[id]/page.tsx", "Agendador-Instagram: src/components/EditPostForm.tsx"],
  ports: [
    {
      id: "postsRepository",
      label: "Posts",
      contract: "Um post com arquivos (URL pública) e automações ligadas a ele.",
      methods: ["get(id): Post | null", "update(id, caption, scheduledAt): void"],
      connectors: ["database", "storage"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "post.update",
      title: "Salvar e reagendar",
      description:
        "Use quando o usuario mudar a legenda ou o horário de um post agendado, com erro ou cancelado. O post volta para a fila com o novo horário; os arquivos não mudam.",
      input: postUpdateInput,
      http: { method: "POST", path: "/posts/:id" },
      permissions: ["owner"],
      connectors: ["database"],
      states: ["success", "error"],
    },
    {
      id: "post.publishNow",
      title: "Publicar agora",
      description: "Use quando o usuario quiser publicar este post agendado sem esperar o horário.",
      http: { method: "POST", path: "/posts/:id/publish-now" },
      permissions: ["owner"],
      connectors: ["instagram"],
      states: ["success", "error"],
    },
    {
      id: "post.retry",
      title: "Tentar de novo",
      description: "Use quando o post estiver com erro.",
      http: { method: "POST", path: "/posts/:id/retry" },
      permissions: ["owner"],
      connectors: ["instagram"],
      states: ["success", "error"],
    },
    {
      id: "post.cancel",
      title: "Cancelar post",
      description: "Use quando o usuario confirmar que quer tirar o post da fila.",
      http: { method: "POST", path: "/posts/:id/cancel" },
      permissions: ["owner"],
      connectors: ["database"],
      states: ["success", "error"],
    },
    {
      id: "post.delete",
      title: "Excluir post",
      description: "Use quando o usuario confirmar a exclusão do post e dos arquivos dele (não apaga do Instagram).",
      http: { method: "DELETE", path: "/posts/:id" },
      permissions: ["owner"],
      connectors: ["database", "storage"],
      states: ["success", "error"],
    },
  ],
  connectors: [
    { id: "instagram", label: "Instagram Graph API", kind: "api", description: "Publicação em graph.facebook.com.", ownerOnly: true },
    { id: "database", label: "Banco de dados", kind: "database", description: "Postgres (Supabase), só a service role.", ownerOnly: true },
    { id: "storage", label: "Storage", kind: "storage", description: "Bucket público com as mídias.", ownerOnly: true },
  ],
  rules: [
    "Só agendado, com erro ou cancelado pode ser editado; processando e publicando não podem ser excluídos.",
    "Legenda até 2200 caracteres e 30 hashtags (o servidor revalida). Story não tem legenda.",
    "Post com horário já passado sugere daqui a 1 h ao reagendar.",
    "Cancelar e excluir sempre pedem confirmação.",
  ],
  defaultVariant: "page",
  variants: [{ id: "page", label: "Página", intent: "Ver e editar um post", tradeoff: "Uma única variação" }],
  states: ["loading", "success", "error"],
});
