import * as React from "react";
import { motion } from "motion/react";
import { Crown, Link2, Mail, ShieldCheck, Trash2, UserMinus, UserPlus, UsersRound } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  DataTable,
  EmptyState,
  Field,
  Input,
  Panel,
  SectionHeader,
  Select,
  cn,
} from "@blocos/ui";
import { BlockFrame, type BlockProps } from "../shared/index.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type OfficeTeamVariant = "list" | "cards" | "table";
export type OfficeTeamRole = "owner" | "nutritionist" | "receptionist";
/** `platform` = acesso concedido pelo dono da plataforma. */
export type OfficeTeamAccessSource = "member" | "platform";
export type OfficeTeamMemberStatus = "active" | "invited" | "suspended";
export type OfficeTeamInviteStatus = "pending" | "accepted" | "expired";

export interface OfficeTeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: OfficeTeamRole;
  accessSource: OfficeTeamAccessSource;
  status: OfficeTeamMemberStatus;
  joinedAt?: string;
}

export interface OfficeTeamInvite {
  id: string;
  email: string;
  role: OfficeTeamRole;
  /**
   * Trecho final do hash do token de convite.
   * O token em claro NUNCA e entregue ao cliente — a URL vai pelo backend.
   */
  tokenPreview: string;
  createdAt: string;
  expiresAt: string;
  status: OfficeTeamInviteStatus;
}

export interface OfficeTeamData {
  office: { id: string; name: string };
  members: OfficeTeamMember[];
  invites: OfficeTeamInvite[];
  /** Papel de quem esta olhando a equipe. */
  viewerRole: OfficeTeamRole;
}

const MOTION = { duration: 0.24, ease: [0.32, 0.72, 0, 1] } as const;

const ROLE_LABEL: Record<OfficeTeamRole, string> = {
  owner: "Dono do consultorio",
  nutritionist: "Nutricionista",
  receptionist: "Recepcionista",
};

const MEMBER_STATUS_TONE: Record<OfficeTeamMemberStatus, "success" | "warn" | "neutral"> = {
  active: "success",
  invited: "warn",
  suspended: "neutral",
};

const MEMBER_STATUS_LABEL: Record<OfficeTeamMemberStatus, string> = {
  active: "Ativo",
  invited: "Convidado",
  suspended: "Suspenso",
};

const INVITE_STATUS_TONE: Record<OfficeTeamInviteStatus, "warn" | "success" | "neutral"> = {
  pending: "warn",
  accepted: "success",
  expired: "neutral",
};

const INVITE_STATUS_LABEL: Record<OfficeTeamInviteStatus, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  expired: "Expirado",
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function OfficeTeam(props: BlockProps<OfficeTeamData, OfficeTeamVariant>) {
  const { data, onAction, variant = "list", state, connectors, onRequestConnector } = props;

  const [showInvite, setShowInvite] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<OfficeTeamRole>("nutritionist");

  const platformMembers = data.members.filter((member) => member.accessSource === "platform");
  const pendingInvites = data.invites.filter((invite) => invite.status === "pending");

  const handleInvite = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onAction?.("office.team.invite", { email: inviteEmail.trim(), role: inviteRole });
    setInviteEmail("");
    setShowInvite(false);
  };

  const handleDemote = (member: OfficeTeamMember) => {
    void onAction?.("office.team.demote", { memberId: member.id });
  };

  const handleRemove = (member: OfficeTeamMember) => {
    void onAction?.("office.team.remove", { memberId: member.id });
  };

  const handleCopyInvite = (invite: OfficeTeamInvite) => {
    void onAction?.("office.team.copyInviteLink", { inviteId: invite.id });
  };

  const handleRevokeInvite = (invite: OfficeTeamInvite) => {
    void onAction?.("office.team.revokeInvite", { inviteId: invite.id });
  };

  /* ---- Cabecalho ---- */

  const header = (
    <SectionHeader
      eyebrow={data.office.name}
      title="Equipe e acessos"
      description="Quem tem acesso ao consultorio, com qual papel e por onde o acesso entrou."
      actions={
        <Button icon={<UserPlus className="h-4 w-4" aria-hidden />} onClick={() => setShowInvite((v) => !v)}>
          Convidar
        </Button>
      }
    />
  );

  /* ---- Formulario de convite ---- */

  const inviteForm = showInvite ? (
    <Panel tone="outline" padding="md" className="flex flex-col gap-4">
      <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
        <Field label="E-mail do convidado" htmlFor="office-team-invite-email" className="flex-1">
          <Input
            id="office-team-invite-email"
            type="email"
            inputMode="email"
            placeholder="convidado@exemplo.com.br"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
          />
        </Field>
        <Field label="Papel" htmlFor="office-team-invite-role" className="sm:w-56">
          <Select
            id="office-team-invite-role"
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as OfficeTeamRole)}
          >
            <option value="nutritionist">Nutricionista</option>
            <option value="receptionist">Recepcionista</option>
            <option value="owner">Dono do consultorio</option>
          </Select>
        </Field>
        <Button type="submit">Enviar convite</Button>
      </form>
      <p className="bloco-micro text-fg-faint">
        O convite vira um link com token de uso unico. Voce ve apenas o final do hash — o token em
        claro nunca e devolvido ao navegador.
      </p>
    </Panel>
  ) : null;

  /* ---- Convites pendentes ---- */

  const invitesPanel = (
    <Panel tone="glass" padding="md" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-accent" aria-hidden />
        <p className="bloco-headline">Convites por link</p>
        <Badge tone="outline">{pendingInvites.length}</Badge>
      </div>

      {data.invites.length === 0 ? (
        <p className="bloco-caption text-fg-muted">Nenhum convite enviado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.invites.map((invite) => (
            <li
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-md)] border border-border bg-surface/60 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] text-fg">{invite.email}</p>
                <p className="bloco-caption text-fg-muted">
                  {ROLE_LABEL[invite.role]} · token{" "}
                  <span className="bloco-mono text-fg-secondary">{invite.tokenPreview}</span> · expira em{" "}
                  {formatDate(invite.expiresAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={INVITE_STATUS_TONE[invite.status]}>
                  {INVITE_STATUS_LABEL[invite.status]}
                </Badge>
                {invite.status === "pending" ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Link2 className="h-3.5 w-3.5" aria-hidden />}
                      onClick={() => handleCopyInvite(invite)}
                    >
                      Copiar link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
                      onClick={() => handleRevokeInvite(invite)}
                    >
                      Revogar
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );

  /* ---- Acoes de um membro ---- */

  const memberActions = (member: OfficeTeamMember) => {
    const isPlatformAccess = member.accessSource === "platform";
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          icon={<UserMinus className="h-3.5 w-3.5" aria-hidden />}
          disabled={isPlatformAccess || member.role === "receptionist"}
          title={
            isPlatformAccess
              ? "Acesso do dono da plataforma nao pode ser rebaixado"
              : "Rebaixar o papel deste membro"
          }
          onClick={() => handleDemote(member)}
        >
          Rebaixar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
          disabled={isPlatformAccess}
          title={
            isPlatformAccess
              ? "Acesso do dono da plataforma nao pode ser removido"
              : "Remover o acesso deste membro"
          }
          onClick={() => handleRemove(member)}
        >
          Remover
        </Button>
      </div>
    );
  };

  /* ---- Variacao lista ---- */

  const listVariant = (
    <ul className="flex flex-col gap-2">
      {data.members.map((member) => {
        const isPlatformAccess = member.accessSource === "platform";
        return (
          <li
            key={member.id}
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-lg)] border border-border bg-surface/60 px-4 py-3",
              isPlatformAccess && "border-accent/40 bg-accent-soft/20",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={member.name} />
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-[14px] font-medium text-fg">
                  {member.name}
                  {isPlatformAccess ? (
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                  ) : null}
                </p>
                <p className="bloco-caption truncate text-fg-muted">
                  {member.email}
                  {member.phone ? ` · ${member.phone}` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={member.role === "owner" ? "accent" : "neutral"}>
                {ROLE_LABEL[member.role]}
              </Badge>
              {isPlatformAccess ? (
                <Badge tone="accent" icon={<Crown className="h-3 w-3" aria-hidden />}>
                  Acesso do dono da plataforma
                </Badge>
              ) : (
                <Badge tone="outline">Membro do consultorio</Badge>
              )}
              <Badge tone={MEMBER_STATUS_TONE[member.status]}>
                {MEMBER_STATUS_LABEL[member.status]}
              </Badge>
            </div>

            {memberActions(member)}
          </li>
        );
      })}
    </ul>
  );

  /* ---- Variacao cartoes ---- */

  const cardsVariant = (
    <div className="grid gap-3 md:grid-cols-2">
      {data.members.map((member) => {
        const isPlatformAccess = member.accessSource === "platform";
        return (
          <Panel
            key={member.id}
            tone="glass"
            padding="md"
            className={cn("flex flex-col gap-3", isPlatformAccess && "border-accent/40")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={member.name} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-fg">{member.name}</p>
                  <p className="bloco-caption truncate text-fg-muted">{member.email}</p>
                </div>
              </div>
              <Badge tone={MEMBER_STATUS_TONE[member.status]}>
                {MEMBER_STATUS_LABEL[member.status]}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={member.role === "owner" ? "accent" : "neutral"}>
                {ROLE_LABEL[member.role]}
              </Badge>
              {isPlatformAccess ? (
                <Badge tone="accent" icon={<Crown className="h-3 w-3" aria-hidden />}>
                  Acesso do dono da plataforma
                </Badge>
              ) : (
                <Badge tone="outline">Membro do consultorio</Badge>
              )}
            </div>

            <p className="bloco-micro text-fg-faint">
              Entrou em {formatDate(member.joinedAt)}
              {member.phone ? ` · ${member.phone}` : ""}
            </p>

            {isPlatformAccess ? (
              <p className="bloco-micro text-accent">
                Este acesso vem do dono da plataforma e nao pode ser rebaixado nem removido aqui.
              </p>
            ) : null}

            <div className="border-t border-border pt-3">{memberActions(member)}</div>
          </Panel>
        );
      })}
    </div>
  );

  /* ---- Variacao tabela ---- */

  const tableVariant = (
    <DataTable
      rows={data.members}
      rowKey={(member) => member.id}
      columns={[
        {
          key: "name",
          header: "Membro",
          render: (member) => (
            <div className="flex items-center gap-2.5">
              <Avatar name={member.name} size={28} />
              <div className="min-w-0">
                <p className="truncate font-medium text-fg">{member.name}</p>
                <p className="bloco-caption truncate text-fg-muted">{member.email}</p>
              </div>
            </div>
          ),
        },
        {
          key: "role",
          header: "Papel",
          render: (member) => (
            <Badge tone={member.role === "owner" ? "accent" : "neutral"}>
              {ROLE_LABEL[member.role]}
            </Badge>
          ),
        },
        {
          key: "access",
          header: "Origem do acesso",
          render: (member) =>
            member.accessSource === "platform" ? (
              <Badge tone="accent" icon={<Crown className="h-3 w-3" aria-hidden />}>
                Acesso do dono da plataforma
              </Badge>
            ) : (
              <Badge tone="outline">Membro do consultorio</Badge>
            ),
        },
        {
          key: "status",
          header: "Status",
          render: (member) => (
            <Badge tone={MEMBER_STATUS_TONE[member.status]}>
              {MEMBER_STATUS_LABEL[member.status]}
            </Badge>
          ),
        },
        {
          key: "joinedAt",
          header: "Entrou em",
          render: (member) => formatDate(member.joinedAt),
        },
        {
          key: "actions",
          header: "Acoes",
          align: "right",
          render: (member) => memberActions(member),
        },
      ]}
    />
  );

  const content =
    variant === "cards" ? cardsVariant : variant === "table" ? tableVariant : listVariant;

  return (
    <BlockFrame
      requires={["database"]}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      state={state}
      empty={
        <EmptyState
          icon={<UsersRound className="h-5 w-5" aria-hidden />}
          title="Nenhum membro ainda"
          description="Convoque a equipe para o consultorio com um convite por link."
        />
      }
      className="flex flex-col gap-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION}
        className="flex flex-col gap-4"
      >
        {platformMembers.length > 0 ? (
          <Callout tone="accent" icon={<Crown className="h-4 w-4" aria-hidden />}>
            O dono da plataforma tem acesso total a este consultorio. O acesso marcado como
            &quot;Acesso do dono da plataforma&quot; nao pode ser rebaixado nem removido pelo dono do
            consultorio.
          </Callout>
        ) : null}

        {header}
        {inviteForm}
        {content}
        {invitesPanel}

        <p className="bloco-micro text-fg-faint">
          <Mail className="mr-1 inline h-3.5 w-3.5" aria-hidden />
          Convites pendentes expiram em 7 dias. O token do convite e exibido apenas como hash
          parcial.
        </p>
      </motion.div>
    </BlockFrame>
  );
}

export default OfficeTeam;
