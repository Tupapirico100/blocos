import * as React from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  CalendarClock,
  Globe,
  KeyRound,
  Link2,
  MessageCircle,
  Plug,
  Send,
  ShieldAlert,
  Instagram,
} from "lucide-react";
import {
  Badge,
  Button,
  Callout,
  Field,
  Input,
  Panel,
  SectionHeader,
  Switch,
  TabPanel,
  Tabs,
  cn,
} from "@blocos/ui";
import { BlockFrame, type BlockProps } from "../shared/index.js";

/* ------------------------------------------------------------------ */
/* Contrato de dados                                                    */
/* ------------------------------------------------------------------ */

export type OfficeSettingsVariant = "sections" | "tabs" | "cards";
export type OfficeChannelId = "whatsapp" | "instagram";
export type OfficeWhatsAppProvider = "cloud_api" | "baileys" | "evolution" | "non_official";

export interface OfficeChannel {
  id: OfficeChannelId;
  label: string;
  connected: boolean;
  /** Provedor usado no canal. */
  provider?: string;
  /** Numero E.164 (WhatsApp) ou identificador da conta (Instagram). */
  identifier?: string;
  connectedAt?: string;
}

export interface OfficeRiskAcceptance {
  /** Versao do texto de risco que foi aceita. */
  version: string;
  /** Quem aceitou o risco. */
  acceptedBy: string;
  /** Quando o risco foi aceito. */
  acceptedAt: string;
}

export interface OfficeScheduleDay {
  /** Dia da semana em pt-BR. */
  day: string;
  enabled: boolean;
  /** Horario no formato "HH:MM" (America/Sao_Paulo). */
  start: string;
  end: string;
}

export interface OfficeWebhook {
  /** URL publica HTTPS de destino. */
  url: string;
  active: boolean;
  /** Nome da variavel de ambiente que guarda o segredo (o segredo nunca e exposto). */
  secretRef: string;
  lastDeliveryAt?: string;
}

export interface OfficeSettingsData {
  office: { id: string; name: string };
  channels: OfficeChannel[];
  /** Provedor de WhatsApp em uso pelo consultorio. */
  whatsapp: {
    provider: OfficeWhatsAppProvider;
    providerLabel: string;
    /** Provedor oficial da Meta? */
    official: boolean;
  };
  /** Versao vigente do texto de risco do provedor nao-oficial. */
  riskVersion: string;
  /** Aceite de risco registrado (ausente enquanto nao for aceito). */
  riskAcceptance?: OfficeRiskAcceptance;
  /** Horario de atendimento. */
  schedule: {
    timezone: string;
    hours: OfficeScheduleDay[];
  };
  /** Webhook de saida configurado. */
  webhook?: OfficeWebhook;
  notice?: string;
}

const MOTION = { duration: 0.24, ease: [0.32, 0.72, 0, 1] } as const;

const CHANNEL_ICON: Record<OfficeChannelId, React.ReactNode> = {
  whatsapp: <MessageCircle className="h-4 w-4" aria-hidden />,
  instagram: <Instagram className="h-4 w-4" aria-hidden />,
};

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/* Bloco                                                                */
/* ------------------------------------------------------------------ */

export function OfficeSettings(props: BlockProps<OfficeSettingsData, OfficeSettingsVariant>) {
  const { data, onAction, variant = "sections", state, connectors, onRequestConnector } = props;

  const [tab, setTab] = React.useState("canais");
  const [hours, setHours] = React.useState<OfficeScheduleDay[]>(data.schedule.hours);
  const [webhookUrl, setWebhookUrl] = React.useState(data.webhook?.url ?? "");
  const [webhookActive, setWebhookActive] = React.useState(data.webhook?.active ?? false);

  const needsRiskAcceptance = !data.whatsapp.official && !data.riskAcceptance;
  const riskIsOutdated = data.riskAcceptance
    ? data.riskAcceptance.version !== data.riskVersion
    : false;

  const handleConnect = (channel: OfficeChannel) => {
    void onAction?.("office.settings.channel.connect", { channel: channel.id });
  };

  const handleDisconnect = (channel: OfficeChannel) => {
    void onAction?.("office.settings.channel.disconnect", { channel: channel.id });
  };

  const handleAcceptRisk = () => {
    void onAction?.("office.settings.risk.accept", { version: data.riskVersion });
  };

  const handleSaveSchedule = () => {
    void onAction?.("office.settings.schedule.save", {
      timezone: data.schedule.timezone,
      hours,
    });
  };

  const handleSaveWebhook = () => {
    void onAction?.("office.settings.webhook.save", {
      url: webhookUrl.trim(),
      active: webhookActive,
    });
  };

  const handleTestWebhook = () => {
    void onAction?.("office.settings.webhook.test", { url: webhookUrl.trim() });
  };

  /* ---- Secao: canais conectados ---- */

  const channelsSection = (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Canais conectados"
        description="Por onde o consultorio conversa com os pacientes."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {data.channels.map((channel) => (
          <Panel key={channel.id} tone="glass" padding="md" className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--r-md)] bg-accent-soft text-accent">
                  {CHANNEL_ICON[channel.id]}
                </span>
                <div className="min-w-0">
                  <p className="bloco-headline">{channel.label}</p>
                  <p className="bloco-caption truncate text-fg-muted">
                    {channel.identifier ?? "sem numero configurado"}
                  </p>
                </div>
              </div>
              <Badge tone={channel.connected ? "success" : "neutral"}>
                {channel.connected ? "Conectado" : "Nao conectado"}
              </Badge>
            </div>

            {channel.connected ? (
              <>
                <p className="bloco-caption text-fg-muted">
                  Provedor: {channel.provider ?? "—"}
                  {channel.connectedAt ? ` · desde ${formatDateTime(channel.connectedAt)}` : ""}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Plug className="h-3.5 w-3.5" aria-hidden />}
                  onClick={() => handleDisconnect(channel)}
                >
                  Desconectar
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                icon={<Plug className="h-3.5 w-3.5" aria-hidden />}
                onClick={() => handleConnect(channel)}
              >
                Conectar
              </Button>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );

  /* ---- Secao: provedor de WhatsApp ---- */

  const whatsappSection = (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Provedor de WhatsApp"
        description="Qual provedor responde pelas mensagens do consultorio."
      />
      <Panel tone="glass" padding="md" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="bloco-headline">{data.whatsapp.providerLabel}</p>
            <p className="bloco-caption text-fg-muted">
              Provedor {data.whatsapp.official ? "oficial (Cloud API)" : "nao oficial"}
            </p>
          </div>
          <Badge tone={data.whatsapp.official ? "success" : "warn"}>
            {data.whatsapp.official ? "Provedor oficial" : "Provedor nao oficial"}
          </Badge>
        </div>

        {data.whatsapp.official ? null : (
          <Callout tone="warn" icon={<ShieldAlert className="h-4 w-4" aria-hidden />}>
            Provedores nao oficiais podem quebrar sem aviso e dependem de um intermediario com o
            numero do consultorio. O texto de risco vigente e a versao{" "}
            <span className="bloco-mono">{data.riskVersion}</span>.
          </Callout>
        )}

        {data.riskAcceptance ? (
          <div className="rounded-[var(--r-md)] border border-border bg-surface-strong/40 p-3">
            <p className="bloco-micro text-fg-muted">Risco aceito</p>
            <dl className="mt-2 grid gap-2 sm:grid-cols-3">
              <div>
                <dt className="bloco-micro text-fg-muted">Versao do texto</dt>
                <dd className="bloco-callout text-fg">{data.riskAcceptance.version}</dd>
              </div>
              <div>
                <dt className="bloco-micro text-fg-muted">Aceito por</dt>
                <dd className="bloco-callout text-fg">{data.riskAcceptance.acceptedBy}</dd>
              </div>
              <div>
                <dt className="bloco-micro text-fg-muted">Em</dt>
                <dd className="bloco-callout text-fg">{formatDateTime(data.riskAcceptance.acceptedAt)}</dd>
              </div>
            </dl>
            {riskIsOutdated ? (
              <Callout tone="warn" className="mt-3" title="Texto de risco atualizado">
                A versao vigente e {data.riskVersion}. Confirme novamente para registrar a nova
                versao.
              </Callout>
            ) : null}
          </div>
        ) : null}

        {needsRiskAcceptance || riskIsOutdated ? (
          <Button
            variant={riskIsOutdated ? "primary" : "secondary"}
            icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
            onClick={handleAcceptRisk}
          >
            {riskIsOutdated ? `Aceitar a versao ${data.riskVersion}` : "Aceitar o risco"}
          </Button>
        ) : null}
      </Panel>
    </div>
  );

  /* ---- Secao: horario de atendimento ---- */

  const scheduleSection = (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Horario de atendimento"
        description="Janela em que o agente aceita novas conversas."
        actions={
          <Badge tone="outline" icon={<Globe className="h-3 w-3" aria-hidden />}>
            {data.schedule.timezone}
          </Badge>
        }
      />
      <Panel tone="glass" padding="md" className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2">
          {hours.map((day, index) => (
            <li
              key={day.day}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-md)] border border-border bg-surface/60 px-3 py-2.5"
            >
              <Switch
                checked={day.enabled}
                onCheckedChange={(checked) =>
                  setHours((current) =>
                    current.map((item, i) => (i === index ? { ...item, enabled: checked } : item)),
                  )
                }
                label={day.day}
              />
              <div className="flex items-center gap-2">
                <Input
                  aria-label={`Inicio de ${day.day}`}
                  type="time"
                  value={day.start}
                  disabled={!day.enabled}
                  onChange={(event) =>
                    setHours((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, start: event.target.value } : item,
                      ),
                    )
                  }
                  className="w-28"
                />
                <span className="bloco-caption text-fg-faint">ate</span>
                <Input
                  aria-label={`Fim de ${day.day}`}
                  type="time"
                  value={day.end}
                  disabled={!day.enabled}
                  onChange={(event) =>
                    setHours((current) =>
                      current.map((item, i) => (i === index ? { ...item, end: event.target.value } : item)),
                    )
                  }
                  className="w-28"
                />
              </div>
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          icon={<CalendarClock className="h-4 w-4" aria-hidden />}
          onClick={handleSaveSchedule}
        >
          Salvar horario
        </Button>
      </Panel>
    </div>
  );

  /* ---- Secao: webhook de saida ---- */

  const webhookSection = (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Webhook de saida"
        description="Eventos enviados para um sistema externo apos a conversa."
      />
      <Panel tone="glass" padding="md" className="flex flex-col gap-3">
        <Field label="URL de destino" htmlFor="office-webhook-url" hint="Somente HTTPS com IP publico.">
          <Input
            id="office-webhook-url"
            type="url"
            inputMode="url"
            placeholder="https://app.exemplo.com.br/hooks/aurora"
            value={webhookUrl}
            onChange={(event) => setWebhookUrl(event.target.value)}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-4">
          <Switch
            checked={webhookActive}
            onCheckedChange={setWebhookActive}
            label="Webhook ativo"
            description="Desligado, os eventos sao descartados."
          />
        </div>

        {data.webhook ? (
          <div className="rounded-[var(--r-md)] border border-border bg-surface-strong/40 p-3">
            <p className="bloco-micro text-fg-muted">Segredo</p>
            <p className="bloco-callout mt-1 flex items-center gap-2 text-fg">
              <KeyRound className="h-3.5 w-3.5 text-fg-muted" aria-hidden />
              <span className="bloco-mono">{data.webhook.secretRef}</span>
            </p>
            <p className="bloco-micro mt-1 text-fg-faint">
              Referencia a variavel de ambiente. O segredo em si nunca e devolvido a interface.
            </p>
            <p className="bloco-micro mt-2 text-fg-faint">
              Ultimo envio: {formatDateTime(data.webhook.lastDeliveryAt)}
            </p>
          </div>
        ) : null}

        <Callout tone="info" icon={<Link2 className="h-4 w-4" aria-hidden />}>
          Tentativas repetidas em 1m, 5m, 15m, 1h, 6h e 24h. Enderecos internos e privados sao
          bloqueados.
        </Callout>

        <div className="flex flex-wrap gap-2">
          <Button icon={<Send className="h-4 w-4" aria-hidden />} onClick={handleSaveWebhook}>
            Salvar webhook
          </Button>
          <Button variant="ghost" onClick={handleTestWebhook} disabled={!webhookUrl.trim()}>
            Enviar teste
          </Button>
        </div>
      </Panel>
    </div>
  );

  /* ---- Montagem por variacao ---- */

  const sections = [
    { id: "canais", label: "Canais", node: channelsSection },
    { id: "whatsapp", label: "WhatsApp", node: whatsappSection },
    { id: "horario", label: "Horario", node: scheduleSection },
    { id: "webhook", label: "Webhook", node: webhookSection },
  ];

  const body = (() => {
    if (variant === "tabs") {
      return (
        <Tabs
          value={tab}
          onChange={setTab}
          items={sections.map((section) => ({ value: section.id, label: section.label }))}
        >
          {sections.map((section) => (
            <TabPanel key={section.id} value={section.id}>
              {section.node}
            </TabPanel>
          ))}
        </Tabs>
      );
    }

    if (variant === "cards") {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel tone="glass" padding="lg">
            {channelsSection}
          </Panel>
          <Panel tone="glass" padding="lg">
            {whatsappSection}
          </Panel>
          <Panel tone="glass" padding="lg">
            {scheduleSection}
          </Panel>
          <Panel tone="glass" padding="lg">
            {webhookSection}
          </Panel>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        {channelsSection}
        {whatsappSection}
        {scheduleSection}
        {webhookSection}
      </div>
    );
  })();

  return (
    <BlockFrame
      requires={["database"]}
      connectors={connectors}
      onRequestConnector={onRequestConnector}
      state={state}
      className="flex flex-col gap-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION}
        className="flex flex-col gap-4"
      >
        <SectionHeader
          eyebrow={data.office.name}
          title="Configuracoes do consultorio"
          description="Canais, provedor de WhatsApp, horario de atendimento e webhooks de saida."
        />

        {data.notice ? <Callout tone="info">{data.notice}</Callout> : null}
        {needsRiskAcceptance ? (
          <Callout tone="warn" icon={<ShieldAlert className="h-4 w-4" aria-hidden />}>
            O provedor de WhatsApp em uso nao e oficial. O risco precisa ser aceito pelo dono da
            plataforma antes de o canal entrar em operacao.
          </Callout>
        ) : null}

        <div className={cn("flex flex-col gap-4")}>{body}</div>
      </motion.div>
    </BlockFrame>
  );
}

export default OfficeSettings;
