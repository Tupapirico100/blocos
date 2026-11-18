import { defineBlock } from "@blocos/core";

/**
 * office-team — equipe do consultorio e convites.
 *
 * Mostra papel, origem do acesso (membro ou dono da plataforma) e os botoes de
 * convidar, rebaixar e remover. Convites por link carregam token de uso unico:
 * a interface mostra apenas o hash parcial.
 */
export const officeTeamRecipe = defineBlock({
  id: "office-team",
  name: "Equipe do consultório",
  domain: "administracao",
  summary: "Membros do consultório com papel, origem do acesso e convites por link.",
  origins: ["CRM-Nutricionista: src/app/[locale]/consultorios/[officeId]/equipe/page.tsx"],
  ports: [
    {
      id: "teamRepository",
      label: "Repositorio de equipe",
      contract: "Membros do consultorio com papel, origem do acesso e data de entrada.",
      methods: [
        "listMembers(officeId): TeamMember[]",
        "addMember(officeId, email, role): TeamMember",
        "updateRole(officeId, memberId, role): TeamMember",
        "removeMember(officeId, memberId): void",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "inviteService",
      label: "Servico de convites",
      contract: "Convites por link com token de uso unico, expiracao e revogacao.",
      methods: [
        "create(officeId, email, role): { inviteId: string; tokenHash: string; expiresAt: string }",
        "list(officeId): Invite[]",
        "revoke(inviteId): void",
        "resolveLink(inviteId): { url: string }",
      ],
      connectors: ["database", "email"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "office.team.invite",
      title: "Convidar membro",
      description:
        "Use quando o usuario preencher o formulario de convite. Cria um convite por link com token de uso unico e envia um e-mail de convite ao novo membro.",
      http: { method: "POST", path: "/offices/:officeId/invites" },
      permissions: ["owner"],
      connectors: ["database", "email"],
      states: ["success", "error", "forbidden"],
    },
    {
      id: "office.team.demote",
      title: "Rebaixar papel do membro",
      description:
        "Use quando o usuario clicar em 'Rebaixar'. Troca o cargo do membro por um cargo imediatamente abaixo. Nunca rebaixa acesso de origem `platform`.",
      http: { method: "PATCH", path: "/offices/:officeId/team/:memberId/role" },
      permissions: ["owner"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    },
    {
      id: "office.team.remove",
      title: "Remover acesso da equipe",
      description:
        "Use quando o usuario clicar em 'Remover'. Revoga o acesso do membro ao consultorio. Membros com acesso de origem `platform` nao podem ser removidos por esta acao.",
      http: { method: "DELETE", path: "/offices/:officeId/team/:memberId" },
      permissions: ["owner"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    },
    {
      id: "office.team.copyInviteLink",
      title: "Copiar link de convite",
      description:
        "Use quando o usuario clicar em 'Copiar link'. Recupera o link com token no backend e o entrega para a area de transferencia — o token em claro nunca e devolvido a interface.",
      permissions: ["owner"],
      connectors: ["database"],
      states: ["success", "error"],
    },
    {
      id: "office.team.revokeInvite",
      title: "Revogar convite",
      description:
        "Use quando o usuario clicar em 'Revogar' num convite pendente. O token deixa de valer imediatamente.",
      http: { method: "DELETE", path: "/offices/:officeId/invites/:inviteId" },
      permissions: ["owner"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    },
  ],
  connectors: [
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Postgres do programa: membros, papeis e convites.",
      ownerOnly: true,
    },
    {
      id: "email",
      label: "E-mail transacional",
      kind: "api",
      description: "Envio do e-mail de convite para o novo membro.",
      env: ["EMAIL_PROVIDER", "EMAIL_FROM"],
      ownerOnly: true,
    },
  ],
  rules: [
    "O acesso de origem `platform` (dono da plataforma) nao pode ser removido nem rebaixado pelo dono do consultorio.",
    "O token do convite e de uso unico, expira e nunca e devolvido em claro — a interface ve apenas o hash parcial.",
    "Todo mundo que fala com o paciente e `employee`; `owner` e `responsible` sao cargos administrativos.",
    "Um consultorio tem um unico papel `employee` por pessoa.",
    "Regra 11: remover um membro da equipe encerra a resposta daquele contato.",
    "Nenhum dado de saude (consulta, medida, plano alimentar) aparece na lista de equipe.",
  ],
  emptyAction: { id: "office.team.invite", label: "Convidar membro" },
  defaultVariant: "cards",
  variants: [
    {
      id: "list",
      label: "Lista",
      intent: "Linha por membro, com papel, origem e acoes lado a lado",
      tradeoff: "Densidade alta deixa as etiquetas de origem apertadas em telas estreitas",
    },
    {
      id: "cards",
      label: "Cartões",
      intent: "Um cartao por membro, com espaco para explicar a origem do acesso",
      tradeoff: "Ocupa mais espaco vertical com equipe grande",
    },
    {
      id: "table",
      label: "Tabela",
      intent: "Tabela densa para consultorios com muita gente na equipe",
      tradeoff: "Esconde o telefone e a data de entrada",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});

export default officeTeamRecipe;
