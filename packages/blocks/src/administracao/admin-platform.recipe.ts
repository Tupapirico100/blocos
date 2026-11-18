import { defineBlock } from "@blocos/core";

/**
 * admin-platform — painel do dono da PLATAFORMA.
 *
 * Lista os consultorios administrados pelo dono da plataforma e as metricas
 * agregadas. O bloco e owner-only na pratica: exige o conector `database`,
 * provisionado pelo dono do programa.
 */
export const adminPlatformRecipe = defineBlock({
  id: "admin-platform",
  name: "Painel da plataforma",
  domain: "administracao",
  summary: "Visao do dono da plataforma sobre consultorios, membros, leads e conversas.",
  origins: [
    "CRM-Nutricionista: src/app/[locale]/admin/page.tsx",
    "CRM-Nutricionista: src/app/[locale]/admin/consultorios/[officeId]/AdminOfficePanel.tsx",
  ],
  ports: [
    {
      id: "officeRepository",
      label: "Repositorio de consultorios",
      contract: "Consultorios do programa com status, membros e canal conectado.",
      methods: [
        "listAll(): OfficeSummary[]",
        "get(officeId): OfficeSummary | null",
        "create(input): OfficeSummary",
      ],
      connectors: ["database"],
      mockable: true,
    },
    {
      id: "platformMetrics",
      label: "Metricas da plataforma",
      contract: "Numeros agregados dos consultorios para o painel do dono.",
      methods: [
        "activeOffices(): number",
        "memberCount(): number",
        "leadsToday(): number",
        "openConversations(): number",
      ],
      connectors: ["database"],
      mockable: true,
    },
  ],
  actions: [
    {
      id: "admin.office.create",
      title: "Criar consultorio",
      description:
        "Use quando o dono da plataforma clicar em 'Novo consultorio'. Cria o consultorio no programa, define o dono inicial e devolve o painel do novo consultorio.",
      http: { method: "POST", path: "/admin/offices" },
      permissions: ["platform_admin"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    },
    {
      id: "admin.office.open",
      title: "Abrir consultorio",
      description:
        "Use quando o dono da plataforma selecionar um consultorio na lista. Leva ao painel administrativo daquele consultorio.",
      http: { method: "GET", path: "/admin/offices/:officeId" },
      readOnly: true,
      permissions: ["platform_admin"],
      connectors: ["database"],
      states: ["success", "error", "forbidden"],
    },
  ],
  connectors: [
    {
      id: "database",
      label: "Banco de dados",
      kind: "database",
      description: "Postgres do programa: consultorios, membros e metricas agregadas.",
      ownerOnly: true,
    },
  ],
  rules: [
    "O dono da plataforma tem acesso total ao consultorio; o dono do consultorio (owner) so opera o operacional.",
    "O acesso de origem `platform` nao pode ser removido nem rebaixado pelo dono do consultorio.",
    "As metricas de lead contam PESSOAS; por anuncio contam CLIQUES.",
    "Todo mundo que fala com o paciente e `employee`; `owner` e `responsible` sao cargos administrativos.",
    "Nenhum dado de saude (consulta, medida, plano alimentar) aparece neste painel.",
    "Criacao de consultorio e uma acao do dono da plataforma: a interface trava o botao enquanto a chamada nao resolve.",
  ],
  emptyAction: { id: "admin.office.create", label: "Novo consultório" },
  defaultVariant: "cards",
  variants: [
    {
      id: "cards",
      label: "Cartões",
      intent: "Um cartao por consultorio, com status e canal visiveis de relance",
      tradeoff: "Consome mais espaco vertical com muitos consultorios",
    },
    {
      id: "table",
      label: "Tabela",
      intent: "Lista densa de consultorios para volume alto",
      tradeoff: "Cada linha carrega menos detalhe; o cartao some",
    },
    {
      id: "split",
      label: "Dividida",
      intent: "Metricas a esquerda e consultorios a direita",
      tradeoff: "A coluna de metricas estreita o espaço dos cartoes",
    },
  ],
  states: ["loading", "success", "empty", "error", "forbidden"],
});

export default adminPlatformRecipe;
