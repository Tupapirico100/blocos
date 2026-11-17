import { defineBlock } from "@blocos/core";
import { z } from "zod";

/**
 * social-composer — composer de post (carrossel / Reels).
 *
 * Extraido de `Agendador-Instagram: src/components/PostForm.tsx`
 * e `Agendador-Instagram: src/components/MediaPicker.tsx`.
 */

export const socialPostFormat = z.enum(["post", "carrossel", "reels"]);

export const postScheduleInput = z.object({
  accountId: z.string().min(1, "Escolha a conta que publica."),
  format: socialPostFormat,
  caption: z.string().max(2200, "A legenda vai ate 2200 caracteres."),
  hashtags: z.array(z.string()).max(30, "Limite de 30 hashtags por publicacao."),
  mediaIds: z.array(z.string()).min(1, "Selecione ao menos uma midia."),
  /** ISO local do programa (America/Sao_Paulo). Null = publicar assim que possivel. */
  scheduledAt: z.string().nullable().optional(),
  timezone: z.literal("America/Sao_Paulo").default("America/Sao_Paulo"),
});

export const socialComposerRecipe = defineBlock({
  id: "social-composer",
  name: "Composer de publicacao",
  domain: "social",
  summary:
    "Escreve a legenda, escolhe hashtags e midia, ve o preview do post e agenda a publicacao no Instagram.",
  origins: [
    "Agendador-Instagram: src/components/PostForm.tsx",
    "Agendador-Instagram: src/components/MediaPicker.tsx",
  ],
  ports: [
    {
      id: "postsService",
      label: "Servico de publicacao",
      contract:
        "Recebe o conteudo final e enfileira a publicacao no agendador. Nao publica direto: grava e o agendador assume.",
      methods: [
        "schedule(input): Post",
        "saveDraft(input): Post",
        "getDraft(id): Post | null",
      ],
      connectors: ["instagram"],
      mockable: true,
    },
    {
      id: "mediaLibrary",
      label: "Biblioteca de midias",
      contract: "Lista as midias disponiveis no storage do programa, com tipo e rotulo legivel.",
      methods: ["list(officeId): SocialMediaItem[]"],
      connectors: ["storage"],
      mockable: true,
    },
    {
      id: "socialAccounts",
      label: "Contas do Instagram",
      contract: "Contas conectadas que podem receber a publicacao.",
      methods: ["listConnected(officeId): SocialAccount[]"],
      connectors: ["instagram"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "post.schedule",
      title: "Agendar publicacao",
      description:
        "Use quando o usuario terminar de escrever a legenda, escolher as midias e quiser publicar no Instagram. Agenda a publicacao com o horario informado (ou o mais proximo possivel se nao houver horario).",
      input: postScheduleInput,
      http: { method: "POST", path: "/social/posts" },
      permissions: ["owner", "nutritionist", "receptionist"],
      connectors: ["instagram"],
      states: ["success", "error", "forbidden"],
    },
  ],
  connectors: [
    {
      id: "instagram",
      label: "Instagram Graph API",
      kind: "api",
      description: "Conta que publica e destino do agendamento.",
      env: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET"],
      ownerOnly: true,
    },
    {
      id: "storage",
      label: "Storage",
      kind: "storage",
      description: "Onde ficam as midias selecionadas para a publicacao.",
      env: ["STORAGE_BUCKET", "STORAGE_REGION"],
      ownerOnly: true,
    },
  ],
  rules: [
    "Carrossel aceita ate 10 midias; Reels aceita um video de ate 60s; a legenda vai ate 2200 caracteres.",
    "A interface valida os limites antes de agendar — o agendador revalida no servidor.",
    "A publicacao nunca sai direto do composer: passa pelo agendador e vira uma tarefa com hora marcada.",
    "O horario e sempre local do programa (America/Sao_Paulo); a conversao para UTC e feita em DUAS passagens por causa do DST.",
    "A legenda nao substitui consentimento de marketing e nunca carrega dado de paciente.",
  ],
  emptyAction: { id: "post.schedule", label: "Publicar" },
  variants: [
    {
      id: "composer",
      label: "Composer",
      intent: "Formulario e preview no mesmo eixo, para quem escreve",
      tradeoff: "O preview fica estreito em telas pequenas",
    },
    {
      id: "split",
      label: "Dividido",
      intent: "Formulario e preview lado a lado, para revisar antes de agendar",
      tradeoff: "Precisa de tela larga",
    },
    {
      id: "preview",
      label: "So preview",
      intent: "Revisar o conteudo ja escrito, sem mexer no formulario",
      tradeoff: "Nao permite corrigir nada na propria tela",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});
