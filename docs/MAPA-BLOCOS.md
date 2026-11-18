# Mapa de blocos

> Gerado por `node scripts/gerar-mapa.mjs` a partir do registro real de receitas.
> Cada bloco e uma receita: acoes (UI + HTTP + agente), portas de logica,
> conectores owner-only, regras e variacoes de UI.

**31 blocos · 74 acoes · 86 variacoes de UI**

## 1. Blocos por repositorio de origem

Onde cada bloco nasceu. Este e o rastreio do que ja existe pronto.

### CRM-Nutricionista (21 blocos)

| Bloco | Dominio | O que faz | Acao principal |
|---|---|---|---|
| `agenda-board` | Agenda | Grade de consultas por profissional e por hora, com status do atendimento e acoes de reagendamento e cancelamento. | `appointment.reschedule` |
| `inbox-whatsapp` | Atendimento | Conversas do WhatsApp com janela de 24h, lista de permitidos, resposta rapida e envio de template. | `message.send` |
| `channel-connections` | Atendimento | Provedores de canal do consultorio (oficial, nao-oficial auto-hospedado e hospedado), com aceite de risco versionado e status da WABA. | `channel.reconnect` |
| `office-settings` | Administracao | Canais conectados, provedor de WhatsApp com aceite de risco, horário de atendimento e webhook de saída. | `office.settings.channel.connect` |
| `agent-console` | Operacao | Conversa, prompt e allowlist de ferramentas do agente, com o controle do dono para ligar ou desligar o atendimento automatico. | `agent.toggle` |
| `office-team` | Administracao | Membros do consultório com papel, origem do acesso e convites por link. | `office.team.invite` |
| `reports-funnel` | Relatorios | Funil new -> qualified -> customer contando PESSOAS, com origem atribuida pelo primeiro toque. | `report.export` |
| `availability` | Agenda | Grade semanal de atendimento, folgas e slots livres — bloqueios sempre vencem o horario livre. | `availability.setHours` |
| `patients-list` | Clinico | Pacientes do consultorio com busca por nome, contato, situacao do consentimento de tratamento e ultima consulta. | `patient.open` |
| `auth-login` | Identidade | Entrada por e-mail e senha (ou so senha, em painel de um operador), com desafio de segundo fator em 6 digitos. | `auth.login` |
| `integration-manifest` | Operacao | Todos os conectores do programa, com status, quem pode provisionar, as variaveis de ambiente esperadas (nome) e o que cada um destrava. | `connector.provision` |
| `admin-platform` | Administracao | Visao do dono da plataforma sobre consultorios, membros, leads e conversas. | `admin.office.create` |
| `consent-panel` | Atendimento | Consentimentos de tratamento e marketing do paciente, com versao do texto aceito, canal e data da concessao. | `consent.grant` |
| `patient-chart` | Clinico | Evolucao do paciente em linha do tempo, com serie de medidas, versao vigente do plano alimentar e aviso de gravacao bloqueada sem consentimento. | `patient.chart.open` |
| `leads-board` | Atendimento | Leads por etapa, com atribuicao do primeiro toque, etiqueta de origem e movimento de etapa. | `lead.move` |
| `auth-recovery` | Identidade | Pedido de link de recuperacao e definicao de nova senha com medidor de forca. | `auth.recovery.request` |
| `clinical-entry` | Clinico | Registro de consulta ou medida no prontuario, com portao de consentimento: sem consentimento de tratamento vigente a gravacao fica bloqueada. | `clinical.entry.create` |
| `ops-health` | Operacao | Estado da operacao: allowlist de instrumentacao, ultimo backup, filas em andamento e webhooks com falha. | `ops.backup.run` |
| `auth-two-factor` | Identidade | Painel do segundo fator TOTP, codigos de recuperacao e remocao do fator. | `auth.twoFactor.verify` |
| `finance-overview` | Financeiro | Receita do mes, ticket medio e taxa de comparecimento em centavos, no formato BRL. | `finance.export` |
| `webhooks-panel` | Operacao | Endpoints de saida do programa, com eventos assinados, segredo por referencia, tentativas, backoff e status da ultima entrega. | `webhook.toggle` |

### Agendador-Instagram (7 blocos)

| Bloco | Dominio | O que faz | Acao principal |
|---|---|---|---|
| `social-agenda` | Social | Fila de posts do Instagram por dia, com hora, conta, formato, miniatura e estado, ações por estado (publicar agora, tentar de novo, cancelar, excluir) e o histórico recente. | `post.publishNow` |
| `social-automations` | Social | Automações que respondem no direct quem comenta uma palavra-chave (ou escreve no direct), com palavras de exclusão, respostas públicas em rodízio, números por automação e pausar/excluir. | `automation.toggle` |
| `social-composer` | Social | Escreve a legenda, escolhe hashtags e midia, ve o preview do post e agenda a publicacao no Instagram. | `post.schedule` |
| `social-accounts` | Social | Contas profissionais do Instagram conectadas pelo login da Meta, com validade do login, webhooks e o passo a passo do painel da Meta. | `social.connect` |
| `social-post-detail` | Social | Um post do Instagram: arquivos, formato, horário, link publicado, status na Meta, tentativas, automação ligada, ações por estado e edição de legenda e horário. | `post.update` |
| `auth-login` | Identidade | Entrada por e-mail e senha (ou so senha, em painel de um operador), com desafio de segundo fator em 6 digitos. | `auth.login` |
| `social-logs` | Social | Ultimas respostas automaticas: quando, conta, automacao, quem escreveu, o texto recebido e o resultado (enviada, ignorada, em andamento ou erro). | — |

### CRM-HOF (15 blocos)

| Bloco | Dominio | O que faz | Acao principal |
|---|---|---|---|
| `agenda-board` | Agenda | Grade de consultas por profissional e por hora, com status do atendimento e acoes de reagendamento e cancelamento. | `appointment.reschedule` |
| `inbox-whatsapp` | Atendimento | Conversas do WhatsApp com janela de 24h, lista de permitidos, resposta rapida e envio de template. | `message.send` |
| `channel-connections` | Atendimento | Provedores de canal do consultorio (oficial, nao-oficial auto-hospedado e hospedado), com aceite de risco versionado e status da WABA. | `channel.reconnect` |
| `meta-conversion` | Relatorios | Fila de eventos de conversao para a Meta, com chave deterministica de dedup e payload sem dado de saude. | `meta.event.export` |
| `availability` | Agenda | Grade semanal de atendimento, folgas e slots livres — bloqueios sempre vencem o horario livre. | `availability.setHours` |
| `patients-list` | Clinico | Pacientes do consultorio com busca por nome, contato, situacao do consentimento de tratamento e ultima consulta. | `patient.open` |
| `integration-manifest` | Operacao | Todos os conectores do programa, com status, quem pode provisionar, as variaveis de ambiente esperadas (nome) e o que cada um destrava. | `connector.provision` |
| `packages-pricing` | Financeiro | Pacotes de atendimento com preco em centavos, numero de sessoes, validade e situacao. | `package.save` |
| `payments-checkout` | Financeiro | Registra pagamento, emite o recibo do paciente e controla o estorno que devolve o lead. | `payment.create` |
| `consent-panel` | Atendimento | Consentimentos de tratamento e marketing do paciente, com versao do texto aceito, canal e data da concessao. | `consent.grant` |
| `patient-chart` | Clinico | Evolucao do paciente em linha do tempo, com serie de medidas, versao vigente do plano alimentar e aviso de gravacao bloqueada sem consentimento. | `patient.chart.open` |
| `leads-board` | Atendimento | Leads por etapa, com atribuicao do primeiro toque, etiqueta de origem e movimento de etapa. | `lead.move` |
| `clinical-entry` | Clinico | Registro de consulta ou medida no prontuario, com portao de consentimento: sem consentimento de tratamento vigente a gravacao fica bloqueada. | `clinical.entry.create` |
| `follow-up-tasks` | Agenda | Fila de acompanhamento com prazo e responsavel por tarefa, em lista, calendario ou quadro por status. | `task.complete` |
| `webhooks-panel` | Operacao | Endpoints de saida do programa, com eventos assinados, segredo por referencia, tentativas, backoff e status da ultima entrega. | `webhook.toggle` |

## 2. Blocos por dominio

### Identidade

#### `auth-login` — Login

Entrada por e-mail e senha (ou so senha, em painel de um operador), com desafio de segundo fator em 6 digitos.

**Variacoes de UI:** `split` (Dividida) · `centered` (Centralizada) · `minimal` (Minima)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `auth.login` — Entrar — `POST /auth/login` — papeis: owner, employee — conectores: database
  - Use quando o usuario enviar e-mail e senha (ou so a senha, com data.passwordOnly) no formulario de login. Valida as credenciais, cria a sessao e responde com o consultorio ativo. Se o segundo fator estiver ativo, devolva o desafio em vez de criar a sessao.
- `auth.twoFactor.verify` — Verificar codigo de 2FA — `POST /auth/two-factor/verify` — papeis: owner, employee — conectores: database
  - Use quando o usuario informar o codigo de 6 digitos do segundo fator. Consome o desafio pendente e conclui o login; codigo invalido devolve erro sem revelar se o fator existe.
- `auth.twoFactor.resend` — Reenviar codigo de 2FA — `POST /auth/two-factor/resend` — papeis: owner, employee — conectores: database, email
  - Use quando o usuario pedir um novo codigo do segundo fator. Gera um desafio novo e invalida o anterior.
- `auth.twoFactor.cancel` — Cancelar desafio de 2FA — `POST /auth/two-factor/cancel` — papeis: owner, employee — conectores: database
  - Use quando o usuario voltar para a etapa de credenciais a partir do desafio de 2FA. Descarta o desafio pendente.
- `auth.recovery.request` — Pedir link de recuperacao — `POST /auth/recovery` — papeis: owner, employee — conectores: database, email
  - Use quando o usuario clicar em 'Esqueci minha senha'. Envia um link de uso unico por e-mail, sempre com a mesma resposta para e-mails existentes e inexistentes.

**Portas de logica:**

- `identityRepository` — Repositorio de identidade: Usuarios do programa, status do segundo fator e desafios pendentes.
  - `findByEmail(email): User | null`
  - `getFactorStatus(userId): { enabled: boolean; method: 'totp' | 'sms' | 'email' }`
  - `createChallenge(userId, method): { challengeId: string; destinationMasked: string; expiresAt: string }`
- `sessionService` — Servico de sessao: Valida credenciais, emite cookie de sessao e devolve o consultorio ativo.
  - `signIn(email, password): { userId: string; officeId: string; roles: string[] }`
  - `verifySecondFactor(challengeId, code): { sessionId: string }`
  - `signOut(sessionId): void`

**Conectores:** `database` (somente dono) · `email` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Regra 11: so respondemos quem esta na lista de permitidos — quem nao autenticou nao recebe nada do consultorio.
- A resposta de recuperacao de senha e a mesma para e-mail existente e inexistente: nao revela quem tem cadastro.
- Senha, codigo de 2FA e token de sessao nunca aparecem em log, URL ou telemetria.
- Desafio de 2FA tem validade curta e uso unico; um codigo verificado nao pode ser reaproveitado.
- Nenhum dado de saude (consulta, medida, plano alimentar) trafega pela tela de login.
- Com data.passwordOnly o payload de auth.login leva so { password }; o servidor aplica limite de tentativas por IP.

**Origem:** `CRM-Nutricionista: src/app/[locale]/login/page.tsx` · `Agendador-Instagram: src/app/login/page.tsx`

#### `auth-recovery` — Recuperação de senha

Pedido de link de recuperacao e definicao de nova senha com medidor de forca.

**Variacoes de UI:** `form` (Formulário) · `steps` (Passos) · `split` (Dividida)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `auth.recovery.request` — Pedir link de recuperacao — `POST /auth/recovery` — papeis: owner, employee — conectores: database, email
  - Use quando o usuario pedir para redefinir a senha. Gera um token de uso unico, envia o link por e-mail e responde de forma identica para e-mails existentes e inexistentes.
- `auth.password.set` — Definir nova senha — `POST /auth/password` — papeis: owner, employee — conectores: database
  - Use quando o usuario confirmar a nova senha no formulario de recuperacao. Valida a politica de senha e consome o token — o token vem da sessao do servidor, nunca do cliente.
- `auth.recovery.resend` — Reenviar link de recuperacao — `POST /auth/recovery/resend` — papeis: owner, employee — conectores: database, email
  - Use quando o usuario pedir um novo link sem esperar o primeiro. Invalida o token anterior e emite um novo.

**Portas de logica:**

- `recoveryRepository` — Repositorio de recuperacao: Links de uso unico, expiracao e estado da redefinicao de senha.
  - `createToken(userId): { tokenHash: string; expiresAt: string }`
  - `consumeToken(tokenHash): { userId: string } | null`
  - `updatePassword(userId, passwordHash): void`
- `passwordPolicy` — Politica de senha: Regras minimas de senha e calculo de forca exibido no formulario.
  - `getPolicy(): { minLength: number; requireUpper: boolean; requireNumber: boolean; requireSymbol: boolean }`
  - `score(password): { score: number; checks: { id: string; met: boolean }[] }`
- `mailer` — Envio de e-mail: Envia o link de recuperacao com expiracao e uso unico.
  - `sendRecoveryLink(email, link, expiresAt): void`

**Conectores:** `database` (somente dono) · `email` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- A resposta de recuperacao e a mesma para e-mail existente e inexistente: nao revela quem tem cadastro.
- O link de recuperacao tem expiracao curta, vale uma unica vez e invalida o token anterior.
- Senha e token de recuperacao nunca aparecem em log, URL ou telemetria.
- A nova senha precisa respeitar a politica do programa (tamanho minimo, maiuscula, numero).
- Redefinir a senha nao remove o segundo fator ja ativo nem amplia permissoes.
- Regra 11: a lista de permitidos e reavaliada no proximo login.
- Nenhum dado de saude (consulta, medida, plano alimentar) trafega por este fluxo.

**Origem:** `CRM-Nutricionista: src/app/[locale]/esqueci-senha/page.tsx`

#### `auth-two-factor` — Verificação em duas etapas

Painel do segundo fator TOTP, codigos de recuperacao e remocao do fator.

**Variacoes de UI:** `cards` (Cartões) · `inline` (Coluna) · `steps` (Passos)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `auth.twoFactor.verify` — Verificar codigo do segundo fator — `POST /auth/two-factor/verify` — papeis: owner, employee — conectores: database
  - Use quando o usuario confirmar o codigo de 6 digitos do autenticador. Valida o codigo TOTP, consome o desafio pendente e, em caso de sucesso, ativa o segundo fator.
- `auth.twoFactor.remove` — Remover fator de segundo fator — `DELETE /auth/two-factor` — papeis: owner, employee — conectores: database
  - Use quando o usuario clicar em 'Remover fator'. Exclui o fator e os codigos de recuperacao; o login passa a exigir apenas e-mail e senha.
- `auth.twoFactor.copySecret` — Copiar chave de configuracao — papeis: owner, employee
  - Use quando o usuario pedir para copiar a chave TOTP exibida no painel. A chave vai para a area de transferencia do proprio navegador — nunca para log ou telemetria.
- `auth.twoFactor.copyRecoveryCodes` — Copiar codigos de recuperacao — papeis: owner, employee
  - Use quando o usuario pedir para copiar os codigos de recuperacao ainda nao usados. Cada codigo funciona uma unica vez.
- `auth.twoFactor.regenerateRecoveryCodes` — Gerar novos codigos de recuperacao — `POST /auth/two-factor/recovery-codes` — papeis: owner, employee — conectores: database
  - Use quando o usuario pedir novos codigos de recuperacao. Invalida todos os codigos anteriores antes de emitir a nova lista.

**Portas de logica:**

- `twoFactorRepository` — Repositorio de fatores: Fatores de segundo fator e codigos de recuperacao do usuario.
  - `listFactors(userId): TwoFactorFactor[]`
  - `getFactor(userId): TwoFactorFactor | null`
  - `removeFactor(userId, factorId): void`
  - `regenerateRecoveryCodes(userId): RecoveryCode[]`
- `challengeService` — Servico de desafio: Valida o codigo TOTP informado e marca o desafio como consumido.
  - `verify(userId, code): { ok: boolean; challengeId: string }`
  - `pending(userId): { challengeId: string; expiresAt: string } | null`

**Conectores:** `database` (somente dono) · `email` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- O segredo TOTP e os codigos de recuperacao nunca aparecem em log, URL ou telemetria.
- Cada codigo de recuperacao vale uma unica vez; gerar uma nova lista invalida a anterior.
- Remover o segundo fator e uma operacao sensivel: o usuario e avisado por e-mail.
- O segundo fator do dono da plataforma nao pode ser removido por terceiros.
- Regra 11: a lista de permitidos e reavaliada a cada login — remover o fator nao amplia permissao.
- Nenhum dado de saude (consulta, medida, plano alimentar) e exibido neste painel.

**Origem:** `CRM-Nutricionista: src/app/[locale]/seguranca/2fa/MfaPanel.tsx`

### Administracao

#### `office-settings` — Configurações do consultório

Canais conectados, provedor de WhatsApp com aceite de risco, horário de atendimento e webhook de saída.

**Variacoes de UI:** `sections` (Seções) · `tabs` (Abas) · `cards` (Cartões)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `office.settings.channel.connect` — Conectar canal — `POST /offices/:officeId/channels/:channel/connect` — papeis: owner, platform_admin — conectores: database, whatsapp
  - Use quando o usuario clicar em 'Conectar' num canal. Abre o fluxo de conexao do provedor — no WhatsApp oficial o cadastro do numero e feito pela Meta.
- `office.settings.channel.disconnect` — Desconectar canal — `POST /offices/:officeId/channels/:channel/disconnect` — papeis: owner, platform_admin — conectores: database, whatsapp
  - Use quando o usuario clicar em 'Desconectar' num canal conectado. Interrompe o atendimento naquele canal e mantem o historico.
- `office.settings.risk.accept` — Aceitar risco do provedor não oficial — `POST /offices/:officeId/risk-acceptance` — papeis: owner, platform_admin — conectores: database
  - Use quando o usuario clicar em 'Aceitar o risco'. Registra o aceite com a versao vigente do texto de risco, quem aceitou e quando — o registro guarda o snapshot do texto aceito.
- `office.settings.schedule.save` — Salvar horário de atendimento — `PUT /offices/:officeId/schedule` — papeis: owner, receptionist — conectores: database
  - Use quando o usuario clicar em 'Salvar horario'. Grava a janela diaria de atendimento no fuso America/Sao_Paulo — a conversao local/UTC faz duas passadas por causa do horario de verao.
- `office.settings.webhook.save` — Salvar webhook de saída — `PUT /offices/:officeId/webhook` — papeis: owner — conectores: database, webhooks
  - Use quando o usuario clicar em 'Salvar webhook'. Valida a URL (HTTPS com IP publico, guarda de SSRF) e guarda o segredo apenas por referencia (`secretRef` = nome da variavel de ambiente).
- `office.settings.webhook.test` — Enviar teste de webhook — `POST /offices/:officeId/webhook/test` — papeis: owner — conectores: database, webhooks
  - Use quando o usuario clicar em 'Enviar teste'. Dispara um evento de teste na URL configurada e devolve o status da entrega.

**Portas de logica:**

- `channelService` — Servico de canais: Canais do consultorio e o provedor de WhatsApp em uso.
  - `list(officeId): Channel[]`
  - `connect(officeId, channel): Channel`
  - `disconnect(officeId, channel): void`
  - `whatsappProvider(officeId): { provider: string; official: boolean }`
- `riskRegistry` — Registro de aceite de risco: Versao vigente do texto de risco e aceite registrado do dono.
  - `currentVersion(provider): string`
  - `getAcceptance(officeId): { version: string; acceptedBy: string; acceptedAt: string } | null`
  - `accept(officeId, version, acceptedBy): { version: string; acceptedBy: string; acceptedAt: string }`
- `scheduleService` — Servico de horario: Janela de atendimento por dia da semana, no fuso America/Sao_Paulo.
  - `get(officeId): { timezone: string; hours: ScheduleDay[] }`
  - `save(officeId, hours): { timezone: string; hours: ScheduleDay[] }`
- `webhookDispatcher` — Despachante de webhooks: Entrega eventos de saida para a URL configurada, com segredo por referencia.
  - `get(officeId): { url: string; active: boolean; secretRef: string } | null`
  - `save(officeId, input): { url: string; active: boolean; secretRef: string }`
  - `test(officeId, url): { ok: boolean; status: number }`

**Conectores:** `database` (somente dono) · `whatsapp` (somente dono) · `webhooks` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- O provedor de WhatsApp nao-oficial so entra em operacao depois que o dono aceita o texto de risco vigente.
- O aceite de risco guarda a versao do texto, quem aceitou e quando — nada de edicao silenciosa do texto.
- O segredo do webhook e guardado por referencia (`secretRef` = nome da variavel de ambiente) e nunca e devolvido a interface.
- Webhook de saida exige HTTPS e IP publico (guard de SSRF); enderecos internos e privados sao bloqueados.
- Retry do webhook: 1m -> 5m -> 15m -> 1h -> 6h -> 24h.
- O horario de atendimento e sempre America/Sao_Paulo; a conversao local/UTC faz DUAS passadas por causa do DST.
- A janela de 24h vale para mensagem livre; fora dela, so template aprovado.
- Nenhum dado de saude (consulta, medida, plano alimentar) trafega no payload do webhook.

**Origem:** `CRM-Nutricionista: src/app/[locale]/consultorios/[officeId]/webhook/WebhookPanel.tsx` · `CRM-Nutricionista: src/app/[locale]/admin/consultorios/[officeId]/AdminOfficePanel.tsx`

#### `office-team` — Equipe do consultório

Membros do consultório com papel, origem do acesso e convites por link.

**Variacoes de UI:** `list` (Lista) · `cards` (Cartões) · `table` (Tabela)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `office.team.invite` — Convidar membro — `POST /offices/:officeId/invites` — papeis: owner — conectores: database, email
  - Use quando o usuario preencher o formulario de convite. Cria um convite por link com token de uso unico e envia um e-mail de convite ao novo membro.
- `office.team.demote` — Rebaixar papel do membro — `PATCH /offices/:officeId/team/:memberId/role` — papeis: owner — conectores: database
  - Use quando o usuario clicar em 'Rebaixar'. Troca o cargo do membro por um cargo imediatamente abaixo. Nunca rebaixa acesso de origem `platform`.
- `office.team.remove` — Remover acesso da equipe — `DELETE /offices/:officeId/team/:memberId` — papeis: owner — conectores: database
  - Use quando o usuario clicar em 'Remover'. Revoga o acesso do membro ao consultorio. Membros com acesso de origem `platform` nao podem ser removidos por esta acao.
- `office.team.copyInviteLink` — Copiar link de convite — papeis: owner — conectores: database
  - Use quando o usuario clicar em 'Copiar link'. Recupera o link com token no backend e o entrega para a area de transferencia — o token em claro nunca e devolvido a interface.
- `office.team.revokeInvite` — Revogar convite — `DELETE /offices/:officeId/invites/:inviteId` — papeis: owner — conectores: database
  - Use quando o usuario clicar em 'Revogar' num convite pendente. O token deixa de valer imediatamente.

**Portas de logica:**

- `teamRepository` — Repositorio de equipe: Membros do consultorio com papel, origem do acesso e data de entrada.
  - `listMembers(officeId): TeamMember[]`
  - `addMember(officeId, email, role): TeamMember`
  - `updateRole(officeId, memberId, role): TeamMember`
  - `removeMember(officeId, memberId): void`
- `inviteService` — Servico de convites: Convites por link com token de uso unico, expiracao e revogacao.
  - `create(officeId, email, role): { inviteId: string; tokenHash: string; expiresAt: string }`
  - `list(officeId): Invite[]`
  - `revoke(inviteId): void`
  - `resolveLink(inviteId): { url: string }`

**Conectores:** `database` (somente dono) · `email` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- O acesso de origem `platform` (dono da plataforma) nao pode ser removido nem rebaixado pelo dono do consultorio.
- O token do convite e de uso unico, expira e nunca e devolvido em claro — a interface ve apenas o hash parcial.
- Todo mundo que fala com o paciente e `employee`; `owner` e `responsible` sao cargos administrativos.
- Um consultorio tem um unico papel `employee` por pessoa.
- Regra 11: remover um membro da equipe encerra a resposta daquele contato.
- Nenhum dado de saude (consulta, medida, plano alimentar) aparece na lista de equipe.

**Origem:** `CRM-Nutricionista: src/app/[locale]/consultorios/[officeId]/equipe/page.tsx`

#### `admin-platform` — Painel da plataforma

Visao do dono da plataforma sobre consultorios, membros, leads e conversas.

**Variacoes de UI:** `cards` (Cartões) · `table` (Tabela) · `split` (Dividida)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `admin.office.create` — Criar consultorio — `POST /admin/offices` — papeis: platform_admin — conectores: database
  - Use quando o dono da plataforma clicar em 'Novo consultorio'. Cria o consultorio no programa, define o dono inicial e devolve o painel do novo consultorio.
- `admin.office.open` — Abrir consultorio — `GET /admin/offices/:officeId` — papeis: platform_admin — conectores: database
  - Use quando o dono da plataforma selecionar um consultorio na lista. Leva ao painel administrativo daquele consultorio.

**Portas de logica:**

- `officeRepository` — Repositorio de consultorios: Consultorios do programa com status, membros e canal conectado.
  - `listAll(): OfficeSummary[]`
  - `get(officeId): OfficeSummary | null`
  - `create(input): OfficeSummary`
- `platformMetrics` — Metricas da plataforma: Numeros agregados dos consultorios para o painel do dono.
  - `activeOffices(): number`
  - `memberCount(): number`
  - `leadsToday(): number`
  - `openConversations(): number`

**Conectores:** `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- O dono da plataforma tem acesso total ao consultorio; o dono do consultorio (owner) so opera o operacional.
- O acesso de origem `platform` nao pode ser removido nem rebaixado pelo dono do consultorio.
- As metricas de lead contam PESSOAS; por anuncio contam CLIQUES.
- Todo mundo que fala com o paciente e `employee`; `owner` e `responsible` sao cargos administrativos.
- Nenhum dado de saude (consulta, medida, plano alimentar) aparece neste painel.
- Criacao de consultorio e uma acao do dono da plataforma: a interface trava o botao enquanto a chamada nao resolve.

**Origem:** `CRM-Nutricionista: src/app/[locale]/admin/page.tsx` · `CRM-Nutricionista: src/app/[locale]/admin/consultorios/[officeId]/AdminOfficePanel.tsx`

### Atendimento

#### `inbox-whatsapp` — Caixa de entrada do WhatsApp

Conversas do WhatsApp com janela de 24h, lista de permitidos, resposta rapida e envio de template.

**Variacoes de UI:** `split` (Dividido) · `stacked` (Empilhado) · `focus` (Foco)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `message.send` — Enviar mensagem — `POST /canal/mensagens` — papeis: owner, receptionist, employee — conectores: whatsapp, database
  - Use para responder dentro da janela de 24h, a um contato que esteja na lista de permitidos. Fora da janela, use message.template.
- `message.template` — Enviar template aprovado — `POST /canal/templates` — papeis: owner, receptionist, employee — conectores: whatsapp
  - Use para falar com o contato fora da janela de 24h ou quando a mensagem exigir um template aprovado pela Meta.
- `lead.allow` — Liberar contato — `POST /canal/permitidos` — papeis: owner, receptionist, employee — conectores: database
  - Use quando o usuario liberar um contato para a lista de permitidos. Regra 11: so respondemos quem esta na lista.

**Portas de logica:**

- `messagingGateway` — Gateway de mensagens: Leitura das conversas do numero do consultorio e envio de mensagem livre ou template aprovado pela Cloud API.
  - `listConversations(cursor): Conversation[]`
  - `listMessages(conversationId, cursor): ChatMessage[]`
  - `sendText(conversationId, body): ChatMessage`
  - `sendTemplate(conversationId, templateId): ChatMessage`
- `allowedContactsRepository` — Lista de permitidos: Numeros liberados para receber atendimento. Quem inicia o contato entra na lista automaticamente.
  - `isAllowed(phone): boolean`
  - `allow(phone): AllowedContact`
  - `list(): AllowedContact[]`

**Conectores:** `whatsapp` (somente dono) · `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Regra 11: so respondemos quem esta na lista de permitidos; quem inicia o contato entra na lista automaticamente.
- Janela de 24h: mensagem livre so dentro de 24h apos o cliente escrever. Fora disso, so template aprovado.
- A Fila de eventos da Meta usa chave deterministica (dedup) e nunca leva dado de saude.
- Todo mundo que fala com o paciente e employee: nao existe papel de 'atendente' separado.

**Origem:** `CRM-Nutricionista: src/app/[locale]/canal/page.tsx` · `CRM-HOF: src/app/[locale]/canal/page.tsx`

#### `channel-connections` — Conexoes de canal

Provedores de canal do consultorio (oficial, nao-oficial auto-hospedado e hospedado), com aceite de risco versionado e status da WABA.

**Variacoes de UI:** `cards` (Cartoes) · `table` (Tabela)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `channel.reconnect` — Reconectar canal — `POST /canal/conexoes/:id/reconectar` — papeis: owner — conectores: whatsapp
  - Use quando o dono do consultorio pedir para reconectar ou reautorizar um canal ja cadastrado. Nao expoe segredos no bloco.

**Portas de logica:**

- `channelRegistry` — Registro de provedores de canal: Provedores conectados ao consultorio, com o tipo (oficial, auto-hospedado, hospedado), o numero, o status da WABA e o aceite de risco versionado.
  - `list(): ChannelConnection[]`
  - `get(id): ChannelConnection | null`
  - `reconnect(id): ChannelConnection`

**Conectores:** `whatsapp` (somente dono) · `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Bloco owner-only: a conexao de canal e do dono do consultorio.
- Provedor nao-oficial (auto-hospedado) exige aceite de risco versionado: versao, quem aceitou e quando.
- Provedor hospedado por terceiro e um caso de risco maior: o aceite tambem precisa estar versionado.
- Acesso platform (dono da plataforma) nao pode ser removido nem rebaixado pelo dono do consultorio.
- Credencial e segredo: nunca vai para log, URL ou telemetria.

**Origem:** `CRM-Nutricionista: src/core/channels/providers.ts` · `CRM-HOF: src/core/messaging/providers.ts`

#### `consent-panel` — Painel de consentimentos

Consentimentos de tratamento e marketing do paciente, com versao do texto aceito, canal e data da concessao.

**Variacoes de UI:** `cards` (Cartoes) · `timeline` (Timeline) · `table` (Tabela)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `consent.grant` — Registrar consentimento — `POST /pacientes/:id/consentimentos` — papeis: owner, receptionist, employee — conectores: database
  - Use para registrar a concessao de tratamento ou marketing. Registre apenas o texto vigente do consultorio: o registro guarda um snapshot do texto aceito.

**Portas de logica:**

- `consentsRepository` — Repositorio de consentimentos: Concessoes e revogacoes por paciente, com snapshot do texto aceito, versao do texto e canal.
  - `listByPatient(patientId): ConsentRecord[]`
  - `latest(patientId, kind): ConsentRecord | null`
  - `grant(patientId, kind, textVersion, channel): ConsentRecord`

**Conectores:** `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Consentimento de tratamento (art. 11) e de marketing (art. 7) sao separados: um nao substitui o outro.
- O registro guarda um snapshot do texto aceito, com a versao vigente do consultorio.
- Prontuario exige consentimento de tratamento vigente — nao da para gravar sem.
- Consentimento e dado sensivel: nunca vai para log, URL ou telemetria.

**Origem:** `CRM-Nutricionista: src/app/[locale]/pacientes/[id]/consentimentos/ConsentPanel.tsx` · `CRM-HOF: src/app/[locale]/patients/[id]/consents/page.tsx`

#### `leads-board` — Quadro de leads

Leads por etapa, com atribuicao do primeiro toque, etiqueta de origem e movimento de etapa.

**Variacoes de UI:** `board` (Quadro) · `table` (Tabela) · `timeline` (Timeline)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `lead.move` — Mover lead — `POST /leads/:id/stage` — papeis: owner, receptionist, employee — conectores: database
  - Use quando o usuario mover um lead de etapa (botao mover no quadro ou na tabela). Move apenas entre new, qualified e customer.

**Portas de logica:**

- `leadsRepository` — Repositorio de leads: Leads do consultorio com origem do PRIMEIRO toque, paginacao por cursor e valor em centavos.
  - `listByStage(stage, cursor): Lead[]`
  - `listByFirstTouch(cursor): Lead[]`
  - `moveStage(id, stage): Lead`

**Conectores:** `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Estagio fixo de lead: new -> qualified -> customer.
- A origem do lead e a do PRIMEIRO toque, nao a do ultimo clique.
- Relatorio por origem conta PESSOAS; por anuncio conta CLIQUES.
- Dinheiro sempre em centavos; estorno devolve o lead para a etapa anterior.
- Todo mundo que fala com o paciente e employee: o entry point do agente e unico por consultorio.

**Origem:** `CRM-Nutricionista: src/app/[locale]/leads/page.tsx` · `CRM-Nutricionista: src/app/[locale]/leads/KanbanBoard.tsx` · `CRM-HOF: src/app/[locale]/leads/page.tsx`

### Clinico

#### `patients-list` — Lista de pacientes

Pacientes do consultorio com busca por nome, contato, situacao do consentimento de tratamento e ultima consulta.

**Variacoes de UI:** `table` (Tabela) · `cards` (Cartoes) · `grid` (Grade)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `patient.open` — Abrir paciente — `GET /pacientes/:id` — papeis: owner, receptionist, employee — conectores: database
  - Use quando o usuario abrir um paciente a partir da lista para ver o prontuario. Nao carrega dado de saude na URL.

**Portas de logica:**

- `patientsRepository` — Repositorio de pacientes: Pacientes do consultorio com contato, situacao do consentimento de tratamento e data da ultima consulta. Paginado por cursor.
  - `list(cursor, query): PatientSummary[]`
  - `findByName(query): PatientSummary[]`
  - `get(id): PatientSummary | null`

**Conectores:** `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Prontuario exige consentimento de tratamento vigente — a lista sinaliza quem nao pode ter gravacao.
- Consentimento de tratamento e de marketing sao separados.
- Dado de saude (consulta, medida, plano) nunca vai para log, URL ou telemetria.
- Todo mundo que fala com o paciente e employee; o dono do consultorio opera o operacional.

**Origem:** `CRM-Nutricionista: src/app/[locale]/pacientes/page.tsx` · `CRM-HOF: src/app/[locale]/patients/page.tsx`

#### `patient-chart` — Prontuario do paciente

Evolucao do paciente em linha do tempo, com serie de medidas, versao vigente do plano alimentar e aviso de gravacao bloqueada sem consentimento.

**Variacoes de UI:** `timeline` (Timeline) · `sections` (Blocos) · `tabs` (Abas)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `patient.chart.open` — Abrir prontuario — `GET /pacientes/:id/prontuario` — papeis: owner, receptionist, employee — conectores: database
  - Use quando o usuario abrir o prontuario completo do paciente a partir deste bloco. Nao expoe dado de saude em URL ou log.

**Portas de logica:**

- `chartRepository` — Repositorio de prontuario: Consultas, medidas e plano alimentar do paciente. Planos e consentimentos sao versionados; a leitura devolve a versao vigente.
  - `listConsultations(patientId): ChartConsultation[]`
  - `listMeasures(patientId): ChartMeasure[]`
  - `getActivePlan(patientId): MealPlanVersion | null`
  - `getTreatmentConsent(patientId): ConsentSnapshot | null`

**Conectores:** `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Prontuario exige consentimento de tratamento vigente — sem ele, a gravacao fica bloqueada.
- Planos alimentares sao versionados: a versao ativa e a que vale; as anteriores sao apenas historico.
- Consentimento de tratamento (art. 11) e de marketing (art. 7) sao separados.
- NUNCA renderizar dado de saude (consulta, medida, plano) em log, URL ou telemetria.
- Dinheiro sempre em centavos.

**Origem:** `CRM-Nutricionista: src/app/[locale]/pacientes/[id]/ClinicalHistory.tsx` · `CRM-HOF: src/app/[locale]/patients/[id]/page.tsx`

#### `clinical-entry` — Registro de atendimento clinico

Registro de consulta ou medida no prontuario, com portao de consentimento: sem consentimento de tratamento vigente a gravacao fica bloqueada.

**Variacoes de UI:** `form` (Formulario) · `wizard` (Wizard) · `inline` (Linha)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `clinical.entry.create` — Gravar atendimento — `POST /pacientes/:id/registros` — papeis: owner, receptionist, employee — conectores: database
  - Use quando o usuario registrar uma consulta ou uma medida no prontuario. Nao execute sem consentimento de tratamento vigente — nesse caso a gravacao esta bloqueada.

**Portas de logica:**

- `clinicalEntriesRepository` — Repositorio de registros clinicos: Grava consultas e medidas do paciente. A gravacao exige consentimento de tratamento vigente e guarda a versao do plano em uso.
  - `createConsultation(patientId, entry): ClinicalEntry`
  - `createMeasure(patientId, entry): ClinicalEntry`
  - `hasTreatmentConsent(patientId): boolean`

**Conectores:** `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Prontuario exige consentimento de tratamento vigente — sem ele a gravacao fica bloqueada.
- Planos alimentares sao versionados: o registro guarda a versao do plano vigente no momento.
- Consentimento de tratamento (art. 11) e de marketing (art. 7) sao separados.
- Dado de saude (consulta, medida, plano) nunca vai para log, URL ou telemetria.
- Fuso America/Sao_Paulo: a conversao local<->UTC faz duas passadas por causa do DST.

**Origem:** `CRM-Nutricionista: src/app/[locale]/pacientes/[id]/ClinicalHistory.tsx` · `CRM-HOF: src/app/[locale]/patients/[id]/page.tsx`

### Agenda

#### `agenda-board` — Agenda de consultas

Grade de consultas por profissional e por hora, com status do atendimento e acoes de reagendamento e cancelamento.

**Variacoes de UI:** `day` (Dia) · `week` (Semana) · `list` (Lista)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `appointment.reschedule` — Reagendar consulta — `POST /appointments/:id/reschedule` — papeis: owner, receptionist, employee — conectores: database
  - Move uma consulta para outro horario/profissional. Use quando o paciente pedir para remarcar ou quando o profissional precisar trocar o dia.
- `appointment.cancel` — Cancelar consulta — `POST /appointments/:id/cancel` — papeis: owner, receptionist, employee — conectores: database
  - Cancela uma consulta e libera o horario. Use quando o paciente desistir; o motivo fica registrado.
- `appointment.setStatus` — Atualizar status do atendimento — `PATCH /appointments/:id/status` — papeis: owner, receptionist, employee — conectores: database
  - Marca a consulta como confirmada, compareceu, faltou ou cancelada. Use depois do atendimento ou quando o paciente confirmar presenca.

**Portas de logica:**

- `appointmentsRepository` — Repositorio de atendimentos: Atendimentos do consultorio por dia, profissional e janela de tempo.
  - `listByDay(date, officeId): Appointment[]`
  - `listByRange(from, to, officeId): Appointment[]`
  - `reschedule(id, startsAt, endsAt): Appointment`
  - `setStatus(id, status): Appointment`
- `scheduleService` — Servico de agenda: Valida conflito de horario, fuso local e permissao antes de gravar.
  - `checkConflicts(appointment): Conflict[]`
  - `cancel(id, reason): Appointment`

**Conectores:** `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Timezone America/Sao_Paulo: a conversao local<->UTC faz DUAS passadas por causa do DST.
- Agendamento bloqueia em cima de folga do profissional: um horario bloqueado nunca vira slot.
- Slots ja descontam atendimento marcado e horario bloqueado.
- Regra 11: so respondemos a quem esta na lista de permitidos.
- A agenda nao carrega dado de saude em log, URL ou telemetria.
- O status 'compareceu' e a base da taxa de comparecimento usada no financeiro.

**Origem:** `CRM-Nutricionista: src/app/[locale]/agenda/page.tsx` · `CRM-HOF: src/app/[locale]/agenda/AgendaClient.tsx`

#### `availability` — Horarios de atendimento

Grade semanal de atendimento, folgas e slots livres — bloqueios sempre vencem o horario livre.

**Variacoes de UI:** `week` (Semana) · `list` (Lista) · `slots` (Slots)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `availability.setHours` — Definir horario de atendimento — `PUT /availability/:professionalId` — papeis: owner, employee — conectores: database
  - Grava a janela de atendimento do profissional em um dia da semana. Use quando o responsavel alterar a grade.
- `availability.block` — Bloquear horario — `POST /availability/blocks` — papeis: owner, employee — conectores: database
  - Bloqueia um intervalo de agenda (ferias, reuniao, indisponibilidade). O bloqueio vale mesmo sobre folga e sobre horario de atendimento.
- `availability.unblock` — Liberar bloqueio — `DELETE /availability/blocks/:blockId` — papeis: owner, employee — conectores: database
  - Remove um bloqueio de agenda e devolve os slots para a agenda. Use quando o profissional confirmar que pode atender.

**Portas de logica:**

- `availabilityRepository` — Repositorio de disponibilidade: Horarios semanais e bloqueios por profissional, em minutos desde a meia-noite local.
  - `listHours(professionalId): AvailabilityHours[]`
  - `listBlocks(from, to, professionalId): AvailabilityBlock[]`
  - `saveHours(hours): AvailabilityHours[]`
  - `removeBlock(blockId): void`
- `slotService` — Servico de slots: Calcula slots livres descontando atendimento marcado e horario bloqueado.
  - `freeSlots(professionalId, date, slotMinutes): Slot[]`
  - `isBookable(professionalId, startsAt): boolean`

**Conectores:** `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Agendamento bloqueia em cima de folga do profissional: bloqueado nunca vira slot.
- Slots ja descontam atendimento marcado e horario bloqueado.
- Timezone America/Sao_Paulo: a conversao local<->UTC faz DUAS passadas por causa do DST.
- A grade semanal nao carrega dado de saude em log, URL ou telemetria.
- Folga e horario de atendimento sao do profissional, nao do consultorio inteiro.

**Origem:** `CRM-Nutricionista: src/core/services/schedule.ts` · `CRM-HOF: src/core/agenda/availability.ts`

#### `follow-up-tasks` — Tarefas de acompanhamento

Fila de acompanhamento com prazo e responsavel por tarefa, em lista, calendario ou quadro por status.

**Variacoes de UI:** `list` (Lista) · `calendar` (Calendario) · `board` (Quadro)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `task.complete` — Concluir tarefa de acompanhamento — `POST /follow-up-tasks/:id/complete` — papeis: owner, employee — conectores: database
  - Marca a tarefa como concluida. Use quando o retorno, o resultado ou a recuperacao ja tiverem sido tratados.
- `task.reschedule` — Reagendar tarefa de acompanhamento — `PATCH /follow-up-tasks/:id/due` — papeis: owner, employee — conectores: database
  - Muda o prazo da tarefa de acompanhamento. Use quando o paciente nao compareceu na data original.

**Portas de logica:**

- `followUpRepository` — Repositorio de tarefas: Tarefas de acompanhamento do consultorio com prazo, responsavel e status.
  - `list(officeId, from, to): FollowUpTask[]`
  - `complete(id): FollowUpTask`
  - `reschedule(id, dueAt): FollowUpTask`
- `messagingService` — Servico de messaging: Envia a mensagem de follow-up respeitando a janela de 24h e o consentimento de marketing.
  - `canSend(task): boolean`
  - `send(task): MessageResult`

**Conectores:** `database` (somente dono) · `whatsapp` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Janela de 24h: mensagem livre so dentro de 24h apos o cliente escrever; fora disso, so template aprovado.
- Consentimento de marketing (art. 7) e separado do consentimento de tratamento (art. 11).
- A tarefa carrega o nome do paciente e o tipo da tarefa — nunca conteudo de consulta, medida ou plano alimentar.
- Timezone America/Sao_Paulo: a conversao local<->UTC faz DUAS passadas por causa do DST.
- Quem fala com o paciente e employee: `employee` e `user` sao o mesmo papel.

**Origem:** `CRM-HOF: src/app/[locale]/follow-up-tasks/page.tsx`

### Financeiro

#### `packages-pricing` — Pacotes e precos

Pacotes de atendimento com preco em centavos, numero de sessoes, validade e situacao.

**Variacoes de UI:** `cards` (Cards) · `table` (Tabela) · `split` (Split)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `package.save` — Salvar pacote — `PUT /packages/:id` — papeis: owner — conectores: database
  - Cria ou atualiza um pacote de atendimento. Use quando o responsavel definir preco (em centavos), numero de sessoes e validade.
- `package.toggleActive` — Ativar ou desativar pacote — `PATCH /packages/:id/status` — papeis: owner — conectores: database
  - Liga ou desliga a oferta de um pacote. Use quando o pacote deixa de ser vendido, sem apagar o historico.

**Portas de logica:**

- `packagesRepository` — Repositorio de pacotes: Pacotes do consultorio com preco em centavos, sessoes e validade.
  - `list(officeId): ServicePackage[]`
  - `save(pkg): ServicePackage`
  - `setActive(id, active): ServicePackage`
- `billingService` — Servico de cobranca: Calcula parcelas e vincula a compra a um lead.
  - `quote(packageId, installments): Quote`
  - `charge(quote): Payment`

**Conectores:** `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Dinheiro em centavos, sempre: nunca ponto flutuante. A formatacao em BRL acontece so na borda (UI).
- Pacote inativo continua no historico de vendas — desativar nao apaga.
- Estorno devolve o lead: o pacote comprado entra na mesma regra de estorno do pagamento.
- O preco do pacote nao carrega dado de saude em log, URL ou telemetria.

**Origem:** `CRM-HOF: src/app/[locale]/packages/page.tsx` · `CRM-HOF: src/app/[locale]/service-packages/page.tsx`

#### `payments-checkout` — Pagamento e recibo

Registra pagamento, emite o recibo do paciente e controla o estorno que devolve o lead.

**Variacoes de UI:** `form` (Formulario) · `receipt` (Recibo) · `split` (Split)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `payment.create` — Registrar pagamento — `POST /payments` — papeis: owner, receptionist, employee — conectores: database
  - Grava o pagamento aceito e emite o recibo. Use quando a forma de pagamento for confirmada; o valor entra em centavos.
- `payment.receipt` — Emitir recibo — `POST /payments/:id/receipt` — papeis: owner, receptionist, employee — conectores: pdf, database
  - Gera o recibo do pagamento para imprimir ou baixar em PDF. Use quando o paciente pedir o comprovante.
- `payment.refund` — Estornar pagamento — `POST /payments/:id/refund` — papeis: owner — conectores: database
  - Estorna o valor e DEVOLVE O LEAD para a etapa new do funil. Use quando houver cancelamento, chargeback ou promessa nao cumprida — o estorno nunca acontece sozinho.

**Portas de logica:**

- `paymentsRepository` — Repositorio de pagamentos: Pagamentos do consultorio com valor em centavos, forma de pagamento e situacao.
  - `create(input): Payment`
  - `findById(id): Payment`
  - `refund(id, reason): Payment`
  - `listReceipts(officeId, from, to): Payment[]`
- `receiptService` — Servico de recibo: Gera o recibo em PDF/HTML a partir do pagamento aceito.
  - `render(receiptId): Buffer`
  - `printUrl(receiptId): string`
- `leadService` — Servico de leads: Devolve o lead para a etapa new quando o pagamento e estornado.
  - `moveStage(leadId, stage): Lead`
  - `findById(leadId): Lead`

**Conectores:** `database` (somente dono) · `pdf` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Dinheiro em centavos, sempre: nunca ponto flutuante. A formatacao em BRL acontece so na borda (UI).
- Estorno devolve o lead: o lead volta para a etapa new do funil.
- Estagio fixo de lead: new -> qualified -> customer.
- Regra 11: so respondemos a quem esta na lista de permitidos.
- O recibo carrega nome e valor, nunca dado de saude.

**Origem:** `CRM-HOF: src/app/[locale]/payments/new/page.tsx` · `CRM-HOF: src/app/[locale]/receipts/[acceptanceId]/page.tsx`

#### `finance-overview` — Visao financeira

Receita do mes, ticket medio e taxa de comparecimento em centavos, no formato BRL.

**Variacoes de UI:** `cards` (Cards) · `chart` (Grafico) · `table` (Tabela)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `finance.export` — Exportar visao financeira — `GET /financeiro/export` — papeis: owner — conectores: database
  - Exporta o resumo financeiro do mes em CSV. Use quando o responsavel pedir a planilha do periodo.

**Portas de logica:**

- `financeRepository` — Repositorio financeiro: Receita por dia e por pacote, com valores em centavos.
  - `revenueByDay(month): FinanceDayEntry[]`
  - `revenueByPackage(month): FinancePackageRow[]`
  - `summary(month): FinanceSummary`
- `attendanceRepository` — Repositorio de comparecimento: Conta sessoes agendadas e comparecidas no mes, pelo status da agenda.
  - `attendanceRate(month): number`
  - `scheduledSessions(month): number`

**Conectores:** `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Dinheiro em centavos, sempre: nunca ponto flutuante. A formatacao em BRL acontece so na borda (UI).
- A taxa de comparecimento vem do status da agenda (compareceu x sessoes agendadas).
- Estorno devolve o lead e nao soma receita.
- O resumo nao carrega dado de saude: apenas valor, quantidade e status.
- O dono da plataforma tem acesso total ao consultorio; o dono do consultorio opera o operacional.

**Origem:** `CRM-Nutricionista: src/app/[locale]/financeiro/page.tsx` · `CRM-Nutricionista: src/core/services/finance.ts`

### Relatorios

#### `meta-conversion` — Fila de eventos da Meta

Fila de eventos de conversao para a Meta, com chave deterministica de dedup e payload sem dado de saude.

**Variacoes de UI:** `timeline` (Timeline) · `table` (Tabela) · `cards` (Cards)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `meta.event.export` — Exportar fila da Meta — `GET /meta/events/export` — papeis: owner — conectores: database
  - Exporta os eventos que ainda nao foram enviados. Use para conference antes do envio em lote.
- `meta.event.retry` — Reenviar evento com erro — `POST /meta/events/retry` — papeis: owner — conectores: meta_ads, database
  - Reenvia os eventos que falharam na Conversions API. Use quando a credencial for corrigida ou a Meta pedir nova tentativa.

**Portas de logica:**

- `metaEventsRepository` — Repositorio de eventos da Meta: Eventos na fila com chave de dedup, etapa, origem e status de envio.
  - `listQueued(status): MetaEvent[]`
  - `markSent(id): MetaEvent`
  - `markFailed(id, reason): MetaEvent`
- `metaAdsProvider` — Provedor Meta Ads: Envia o evento para a Conversions API e devolve o resultado do envio.
  - `send(event): MetaSendResult`
  - `retry(id): MetaSendResult`

**Conectores:** `meta_ads` (somente dono) · `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- A fila de eventos da Meta usa chave deterministica (dedup): o mesmo evento nao e enviado duas vezes.
- O payload NUNCA leva dado de saude (LGPD): sem consulta, medida ou plano alimentar.
- O estagio do evento segue o funil fixo: new -> qualified -> customer.
- A origem do evento e a do primeiro toque do lead.
- Somente o dono da plataforma provisiona o conector meta_ads; nenhum segredo trafega pelo bloco.

**Origem:** `CRM-HOF: src/app/[locale]/meta/page.tsx` · `CRM-HOF: src/core/services/meta-events.ts`

#### `reports-funnel` — Funil de conversao

Funil new -> qualified -> customer contando PESSOAS, com origem atribuida pelo primeiro toque.

**Variacoes de UI:** `funnel` (Funil) · `cards` (Cards) · `table` (Tabela)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `report.export` — Exportar relatorio — `GET /relatorios/export` — papeis: owner — conectores: storage
  - Exporta o funil de conversao do periodo. Use quando o responsavel pedir os numeros por etapa ou por origem; a exportacao conta PESSOAS, nao cliques.

**Portas de logica:**

- `reportsRepository` — Repositorio de relatorios: Contagem de pessoas por etapa e por origem no periodo.
  - `funnel(from, to): FunnelStage[]`
  - `peopleBySource(from, to): FunnelSourceRow[]`
  - `clicksBySource(from, to): { source: string; clicks: number }[]`
- `exportService` — Servico de exportacao: Gera o relatorio em CSV/XLSX sem dados de saude.
  - `export(report, params): Buffer`

**Conectores:** `database` (somente dono) · `storage` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Lead = pessoa; clique = toque. Relatorio por origem conta PESSOAS; por anuncio conta CLIQUES.
- Atribuicao do primeiro toque: a origem de um lead e a do primeiro contato, nao a ultima.
- Estagio fixo de lead: new -> qualified -> customer.
- Estorno devolve o lead: o paciente volta para a etapa new e o funil reflete isso.
- O relatorio nao expoe dado de saude: contagens e origens, nunca conteudo de atendimento.

**Origem:** `CRM-Nutricionista: src/app/[locale]/relatorios/page.tsx` · `CRM-Nutricionista: src/core/services/reports.ts`

### Social

#### `social-agenda` — Agenda de posts

Fila de posts do Instagram por dia, com hora, conta, formato, miniatura e estado, ações por estado (publicar agora, tentar de novo, cancelar, excluir) e o histórico recente.

**Variacoes de UI:** `route` (Folha de rota) · `compact` (Compacta)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `post.publishNow` — Publicar agora — `POST /posts/:id/publish-now` — papeis: owner — conectores: instagram
  - Use quando o usuario quiser publicar um post agendado sem esperar o horário.
- `post.retry` — Tentar de novo — `POST /posts/:id/retry` — papeis: owner — conectores: instagram
  - Use quando um post estiver com erro. Reaproveita o container se ele ainda existir; se o erro foi depois do media_publish, confira o Instagram antes (pode já ter publicado).
- `post.cancel` — Cancelar post — `POST /posts/:id/cancel` — papeis: owner — conectores: database
  - Use quando o usuario confirmar que quer tirar um post agendado da fila.
- `post.delete` — Excluir post — `DELETE /posts/:id` — papeis: owner — conectores: database, storage
  - Use quando o usuario confirmar a exclusão de um post com erro ou cancelado (e dos arquivos dele).

**Portas de logica:**

- `postsRepository` — Posts: Até 100 posts na fila (agendado, processando, publicando, erro) em ordem de horário e os 30 últimos publicados/cancelados, agrupados por dia em America/Sao_Paulo.
  - `listUpcoming(accountId?): Post[]`
  - `listHistory(accountId?): Post[]`
- `scheduler` — Agendador: Publicar agora e tentar de novo rodam o tick dentro da ação; media_publish nunca é repetido sozinho.
  - `publishNow(id): void`
  - `retry(id): void`
  - `cancel(id): void`
  - `remove(id): void`

**Conectores:** `instagram` (somente dono) · `database` (somente dono) · `storage` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Cancelar e excluir sempre pedem confirmação.
- Ações por estado: agendado (publicar agora, editar, cancelar); erro (tentar de novo, editar, excluir); cancelado (reagendar, excluir); publicado (detalhes).
- Horários sempre em America/Sao_Paulo.
- Link 'Ver no Instagram' só aparece para https://www.instagram.com/.
- Estado sempre em texto + bolinha, nunca só cor.

**Origem:** `Agendador-Instagram: src/app/(app)/posts/page.tsx` · `Agendador-Instagram: src/app/(app)/posts/actions.ts`

#### `social-automations` — Automações de resposta

Automações que respondem no direct quem comenta uma palavra-chave (ou escreve no direct), com palavras de exclusão, respostas públicas em rodízio, números por automação e pausar/excluir.

**Variacoes de UI:** `list` (Lista) · `cards` (Cartões) · `flow` (Fluxo)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `automation.toggle` — Pausar ou ativar automação — `POST /automations/:id/active` — papeis: owner — conectores: database
  - Use quando o usuario pedir para pausar ou religar uma automação. Pausada, ela nao responde ninguem; os registros ficam.
- `automation.delete` — Excluir automação — `DELETE /automations/:id` — papeis: owner — conectores: database
  - Use quando o usuario confirmar a exclusao de uma automação. Sempre passa por confirmacao.
- `automation.create` — Nova automação — papeis: owner — conectores: database
  - Use quando o usuario quiser criar uma automação: leva ao formulario de criacao do app.

**Portas de logica:**

- `automationsRepository` — Automações: Automações por conta, com contadores agregados de automation_logs (casaram, enviadas, ignoradas, erro).
  - `list(): SocialAutomation[]`
  - `setActive(id, active): void`
  - `remove(id): void`

**Conectores:** `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Cada pessoa recebe a mesma automação uma vez so (as repetições contam como 'já tinham recebido').
- Só 1 resposta privada por comentário (regra da Meta): com várias automações valendo, ganha a do post específico, depois a mais antiga.
- Palavras de exclusão deixam o comentário para resposta pessoal.
- Várias respostas públicas são sorteadas a cada comentário (respostas sempre iguais a Meta marca como spam).
- Excluir sempre pede confirmação; pausar é reversível.

**Origem:** `Agendador-Instagram: src/app/(app)/automations/page.tsx` · `Agendador-Instagram: src/lib/automations/handle.ts` · `Agendador-Instagram: src/lib/automations/stats.ts`

#### `social-composer` — Composer de publicacao

Escreve a legenda, escolhe hashtags e midia, ve o preview do post e agenda a publicacao no Instagram.

**Variacoes de UI:** `composer` (Composer) · `split` (Dividido) · `preview` (So preview)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `post.schedule` — Agendar publicacao — `POST /social/posts` — papeis: owner, nutritionist, receptionist — conectores: instagram
  - Use quando o usuario terminar de escrever a legenda, escolher as midias e quiser publicar no Instagram. Agenda a publicacao com o horario informado (ou o mais proximo possivel se nao houver horario).

**Portas de logica:**

- `postsService` — Servico de publicacao: Recebe o conteudo final e enfileira a publicacao no agendador. Nao publica direto: grava e o agendador assume.
  - `schedule(input): Post`
  - `saveDraft(input): Post`
  - `getDraft(id): Post | null`
- `mediaLibrary` — Biblioteca de midias: Lista as midias disponiveis no storage do programa, com tipo e rotulo legivel.
  - `list(officeId): SocialMediaItem[]`
- `socialAccounts` — Contas do Instagram: Contas conectadas que podem receber a publicacao.
  - `listConnected(officeId): SocialAccount[]`

**Conectores:** `instagram` (somente dono) · `storage` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Post unico: 1 imagem 4:5 a 1,91:1; carrossel: 2 a 10 imagens; Reels: 1 video de 3 s a 15 min; Story: 1 imagem ou video de 3 a 60 s, sem legenda; a legenda vai ate 2200 caracteres.
- A interface valida os limites antes de agendar — o agendador revalida no servidor.
- A publicacao nunca sai direto do composer: passa pelo agendador e vira uma tarefa com hora marcada.
- O horario e sempre local do programa (America/Sao_Paulo); a conversao para UTC e feita em DUAS passagens por causa do DST.
- A legenda nao substitui consentimento de marketing e nunca carrega dado de paciente.

**Origem:** `Agendador-Instagram: src/components/PostForm.tsx` · `Agendador-Instagram: src/components/MediaPicker.tsx`

#### `social-accounts` — Contas do Instagram

Contas profissionais do Instagram conectadas pelo login da Meta, com validade do login, webhooks e o passo a passo do painel da Meta.

**Variacoes de UI:** `cards` (Cartoes) · `grid` (Grade)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `social.connect` — Conectar conta do Instagram — `GET /api/instagram/connect` — papeis: owner — conectores: instagram
  - Use quando o usuario pedir para conectar ou reconectar uma conta. Leva ao login unificado da Meta (GET /api/instagram/connect); a volta cria ou atualiza a conta.
- `social.subscribe` — Ativar webhooks — `POST /accounts/:accountId/subscribe` — papeis: owner — conectores: instagram
  - Use quando os webhooks de uma conta estiverem desligados. Assina comments e messages (POST /{ig}/subscribed_apps) para as automacoes receberem os eventos.
- `social.remove` — Remover conta — `DELETE /accounts/:accountId` — papeis: owner — conectores: database, storage
  - Use quando o usuario confirmar a remocao de uma conta. Apaga os arquivos da conta no storage; posts, automacoes e registros saem em cascata.

**Portas de logica:**

- `instagramAccounts` — Contas do Instagram: Lista as contas conectadas com status, validade do login e webhooks. Nunca devolve o token: ele fica cifrado no banco.
  - `list(): SocialAccount[]`
  - `subscribeWebhooks(accountId): void`
  - `remove(accountId): void`

**Conectores:** `instagram` (somente dono) · `database` (somente dono) · `storage` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Remover conta sempre passa por confirmacao: posts, automacoes e arquivos da conta saem junto.
- Token de usuario do sistema nao vence (tokenDaysLeft null); conta recusada pela Meta vira `reauth` e pede Reconectar.
- Webhooks desligados = automacoes sem comentarios: a tela diz isso em texto, nao so em cor.
- Nenhum token ou segredo aparece na tela, no log ou na URL.

**Origem:** `Agendador-Instagram: src/app/(app)/accounts/page.tsx` · `Agendador-Instagram: src/app/(app)/accounts/actions.ts`

#### `social-post-detail` — Detalhe do post

Um post do Instagram: arquivos, formato, horário, link publicado, status na Meta, tentativas, automação ligada, ações por estado e edição de legenda e horário.

**Variacoes de UI:** `page` (Página)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `post.update` — Salvar e reagendar — `POST /posts/:id` — papeis: owner — conectores: database
  - Use quando o usuario mudar a legenda ou o horário de um post agendado, com erro ou cancelado. O post volta para a fila com o novo horário; os arquivos não mudam.
- `post.publishNow` — Publicar agora — `POST /posts/:id/publish-now` — papeis: owner — conectores: instagram
  - Use quando o usuario quiser publicar este post agendado sem esperar o horário.
- `post.retry` — Tentar de novo — `POST /posts/:id/retry` — papeis: owner — conectores: instagram
  - Use quando o post estiver com erro.
- `post.cancel` — Cancelar post — `POST /posts/:id/cancel` — papeis: owner — conectores: database
  - Use quando o usuario confirmar que quer tirar o post da fila.
- `post.delete` — Excluir post — `DELETE /posts/:id` — papeis: owner — conectores: database, storage
  - Use quando o usuario confirmar a exclusão do post e dos arquivos dele (não apaga do Instagram).

**Portas de logica:**

- `postsRepository` — Posts: Um post com arquivos (URL pública) e automações ligadas a ele.
  - `get(id): Post | null`
  - `update(id, caption, scheduledAt): void`

**Conectores:** `instagram` (somente dono) · `database` (somente dono) · `storage` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Só agendado, com erro ou cancelado pode ser editado; processando e publicando não podem ser excluídos.
- Legenda até 2200 caracteres e 30 hashtags (o servidor revalida). Story não tem legenda.
- Post com horário já passado sugere daqui a 1 h ao reagendar.
- Cancelar e excluir sempre pedem confirmação.

**Origem:** `Agendador-Instagram: src/app/(app)/posts/[id]/page.tsx` · `Agendador-Instagram: src/components/EditPostForm.tsx`

#### `social-logs` — Registros de respostas

Ultimas respostas automaticas: quando, conta, automacao, quem escreveu, o texto recebido e o resultado (enviada, ignorada, em andamento ou erro).

**Variacoes de UI:** `table` (Tabela) · `timeline` (Linha do tempo)

**Portas de logica:**

- `automationLogs` — Registros das automacoes: As 100 ultimas linhas de automation_logs com o nome da automacao e o @ da conta. Erro ja vem tratado, sem token nem corpo cru da Meta.
  - `listRecent(limit): SocialLogEntry[]`

**Conectores:** `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Somente leitura: nao existe reenviar. A Meta aceita 1 resposta privada por comentario e repetir vira spam.
- `skipped` = a pessoa ja tinha recebido esta automacao (1 direct por pessoa por automacao).
- Guarda @ e texto de quem comentou (dado pessoal): a retencao e responsabilidade do servidor.
- Estado sempre em texto + bolinha, nunca so cor.

**Origem:** `Agendador-Instagram: src/app/(app)/logs/page.tsx`

### Operacao

#### `agent-console` — Console do agente

Conversa, prompt e allowlist de ferramentas do agente, com o controle do dono para ligar ou desligar o atendimento automatico.

**Variacoes de UI:** `chat` (Conversa) · `cards` (Cartoes) · `logs` (Logs)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `agent.toggle` — Ligar ou desligar o agente — `PATCH /agente/status` — papeis: platform_owner — conectores: anthropic
  - Use quando o dono da plataforma quiser ativar ou pausar o atendimento automatico. Desligar mantem prompt, historico e allowlist.
- `agent.message` — Enviar mensagem ao agente — papeis: platform_owner, owner — conectores: anthropic
  - Use para simular uma conversa e conferir o comportamento do agente antes de ligar o atendimento automatico.
- `agent.prompt.update` — Atualizar o prompt do agente — `PUT /agente/prompt` — papeis: platform_owner — conectores: database
  - Use quando o dono da plataforma quiser mudar a instrucao do agente. A mudanca cria uma nova versao do prompt e vale para as conversas seguintes.

**Portas de logica:**

- `agentService` — Servico do agente: Executa o agente com a allowlist de ferramentas e devolve a resposta. A tool allowlist e fixa no servidor — a interface nao amplia.
  - `run(input): AgentAnswer`
  - `status(): AgentStatus`
- `agentTools` — Allowlist de ferramentas: As quatro ferramentas autorizadas: buscar agenda, oferecer slots, registrar atendimento e consultar lead. Qualquer outra chamada e recusada.
  - `list(): AgentTool[]`
  - `isAllowed(toolId): boolean`
- `agentConversations` — Conversas do agente: Historico de mensagens por canal. Guarda a conversa, nunca dado de saude.
  - `list(conversationId): AgentMessage[]`
  - `append(conversationId, message): AgentMessage`
- `agentPromptRepository` — Prompt versionado: Prompt atual e versao. Alterar exige o dono da plataforma e grava a nova versao.
  - `get(): { prompt: string; version: number }`
  - `update(prompt): { prompt: string; version: number }`

**Conectores:** `anthropic` (somente dono) · `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Allowlist fixa de 4 ferramentas: buscar agenda, oferecer slots, registrar atendimento e consultar lead.
- O agente so responde a quem esta na lista de permitidos (Regra 11) e dentro da janela de 24h.
- O agente comeca desligado; quem liga e desliga e o dono da plataforma.
- Prompt e versionado: mudanca grava nova versao e vale para as conversas seguintes.
- O agente nao registra dado de saude — apenas agendamento, atendimento e lead.
- A chave da Anthropic nunca e exibida: a interface so mostra o nome da variavel de ambiente.

**Origem:** `CRM-Nutricionista: src/app/[locale]/agente/AgentPanel.tsx` · `CRM-Nutricionista: src/core/agent/tools.ts`

#### `integration-manifest` — Manifesto de conexoes

Todos os conectores do programa, com status, quem pode provisionar, as variaveis de ambiente esperadas (nome) e o que cada um destrava.

**Variacoes de UI:** `cards` (Cartoes) · `table` (Tabela) · `checklist` (Checklist)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `connector.provision` — Provisionar conector — `POST /admin/connectors/:connectorId/provision` — papeis: platform_owner
  - Use quando o dono da plataforma quiser ativar uma conexao do programa (WhatsApp, Anthropic, Instagram, Meta Ads, webhooks, storage, email, pdf ou banco). E a unica forma de provisionar conector em todo o sistema — nenhum outro bloco cria ou altera credencial.

**Portas de logica:**

- `connectorRegistry` — Registro de conectores: Lista os conectores do programa com status, quem pode provisionar e as variaveis esperadas. Devolve apenas NOMES de variavel — nenhum valor.
  - `list(): ManifestConnector[]`
  - `provision(connectorId): ConnectorState`
- `envCatalog` — Catalogo de variaveis de ambiente: Para cada conector, os nomes das variaveis que o runtime le do cofre. Nunca devolve o valor de nenhuma delas.
  - `expected(connectorId): string[]`
- `connectorProvisioner` — Provisionador de conectores: Executa o provisionamento no cofre do dono da plataforma. Recusa qualquer ator que nao seja o dono da plataforma.
  - `provision(connectorId, actor): ConnectorState`

**Conectores:** `whatsapp` (somente dono) · `anthropic` (somente dono) · `instagram` (somente dono) · `meta_ads` (somente dono) · `webhooks` (somente dono) · `storage` (somente dono) · `email` (somente dono) · `pdf` (somente dono) · `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Acesso de implementacao e SO do dono da plataforma — o manifesto e o unico lugar onde `connector.provision` acontece.
- O dono da plataforma tem acesso total ao consultorio; o dono do consultorio (owner) so opera o operacional.
- O acesso `platform` nao pode ser removido nem rebaixado pelo dono do consultorio.
- Somente NOMES de variaveis de ambiente aparecem no manifesto; valores vivem no cofre e nunca saem dele.
- Todos os conectores sao owner-only: API, WhatsApp, LLM, webhooks, storage, email, pdf e banco de dados.
- Um conector sem provisionar bloqueia os blocos que dependem dele — o bloqueio aparece no proprio bloco, com pedido de acesso.
- Nenhum conector grava ou envia dado de saude do paciente.

**Origem:** `CRM-Nutricionista: src/app/[locale]/admin/page.tsx` · `CRM-HOF: src/lib/env.ts`

#### `ops-health` — Saude da operacao

Estado da operacao: allowlist de instrumentacao, ultimo backup, filas em andamento e webhooks com falha.

**Variacoes de UI:** `cards` (Cartoes) · `table` (Tabela) · `timeline` (Linha do tempo)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `ops.backup.run` — Rodar backup — `POST /ops/backup` — papeis: platform_owner — conectores: storage, database
  - Use quando o dono da plataforma pedir um backup imediato do programa. O backup e disparado em segundo plano e o resultado aparece na tela de saude da operacao.

**Portas de logica:**

- `instrumentation` — Instrumentacao: Allowlist de campos que podem sair para telemetria e a lista de campos removidos pelo scrub antes de gravar.
  - `allowlist(): { allowed: string[]; scrubbed: string[]; sampleRate: number }`
- `backupService` — Servico de backup: Dispara e consulta backups. Devolve horario, duracao, tamanho e destino — nunca conteudo.
  - `run(scope): BackupResult`
  - `last(): BackupResult`
- `queueInspector` — Inspetor de filas: Contadores por fila: esperando, em andamento e com falha.
  - `queues(): OpsQueue[]`
- `deliveryInspector` — Inspetor de entregas: Webhooks que esgotaram o backoff e seguem para inspecao manual.
  - `failed(): OpsFailedWebhook[]`

**Conectores:** `database` (somente dono) · `storage` (somente dono) · `webhooks` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Instrumentacao e allowlist: somente os campos explicitamente permitidos saem para a telemetria.
- O scrub remove segredo e dado de saude antes de qualquer gravacao — inclusive no backup e na telemetria.
- O backup e acao do dono da plataforma; o dono do consultorio apenas visualiza o ultimo resultado.
- Fila parada acima do limite e incidente operacional: a tela destaca o item mais antigo esperando.
- Webhook que esgotou o backoff (1m -> 5m -> 15m -> 1h -> 6h -> 24h) vai para inspecao manual.
- Nenhuma tela de operacao mostra conteudo de prontuario, token ou chave de API.

**Origem:** `CRM-Nutricionista: src/instrumentation.ts` · `CRM-Nutricionista: src/core/observability/scrub.ts`

#### `webhooks-panel` — Webhooks de saida

Endpoints de saida do programa, com eventos assinados, segredo por referencia, tentativas, backoff e status da ultima entrega.

**Variacoes de UI:** `list` (Lista) · `flow` (Fluxo)

**Acoes (uma acao = tela + HTTP + tool de agente):**

- `webhook.toggle` — Ativar ou desativar webhook — `PATCH /webhooks/:id` — papeis: platform_owner, owner — conectores: webhooks
  - Use quando o usuario quiser pausar ou retomar o envio de eventos para um endpoint. Desativar mantem a configuracao e o historico de entregas.

**Portas de logica:**

- `webhooksRepository` — Repositorio de webhooks: CRUD dos endpoints de saida. Devolve `secretRef` (nome da env var), nunca o segredo. A validacao de destino vive fora do repositorio.
  - `listByOffice(officeId): WebhookEndpoint[]`
  - `toggle(id, active): WebhookEndpoint`
  - `register(input): WebhookEndpoint`
- `webhookGuard` — Guard de destino (SSRF): Valida o endpoint antes de qualquer envio: exige HTTPS e resolucao para IP publico. Recusa loopback, rede privada e endereco interno.
  - `check(url): { https: boolean; publicIp: boolean }`
- `webhookDispatcher` — Despachante de webhooks: Entrega o evento e aplica o backoff 1m -> 5m -> 15m -> 1h -> 6h -> 24h. Depois da ultima tentativa marca o evento como falho.
  - `deliver(webhookId, event): DeliveryResult`
  - `retry(webhookId, eventId): DeliveryResult`

**Conectores:** `webhooks` (somente dono) · `database` (somente dono)

**Regras que a implementacao DEVE respeitar:**

- Guard de SSRF: somente HTTPS e IP publico — loopback, rede privada e endereco interno sao recusados antes do envio.
- O segredo e sempre por referencia (`secretRef` = nome da env var); o valor nunca e renderizado, logado ou enviado pela UI.
- Backoff de reexecucao: 1m -> 5m -> 15m -> 1h -> 6h -> 24h; depois disso o evento e marcado como falho.
- Payload de saida nunca leva dado de saude do paciente, nem texto de prontuario.
- A URL do endpoint e validada de novo a cada entrega — DNS pode mudar depois do cadastro.

**Origem:** `CRM-Nutricionista: src/app/[locale]/consultorios/[officeId]/webhook/WebhookPanel.tsx` · `CRM-HOF: src/app/[locale]/webhooks/page.tsx`

## 3. Conectores — o que so o dono do programa pode ligar

| Slot | Tipo | Quem provisiona | Destrava | Variaveis (nome) |
|---|---|---|---|---|
| `database` | database | **somente o dono** | Postgres do programa, com RLS por consultorio. | `DATABASE_URL`, `DATABASE_BACKUP_BUCKET` |
| `email` | api | **somente o dono** | Envio de e-mail transacional e templates. | `EMAIL_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` |
| `whatsapp` | whatsapp | **somente o dono** | Canal de atendimento do consultorio. | `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN` |
| `webhooks` | webhook | **somente o dono** | Entrega de eventos para sistemas externos. | `WEBHOOK_SIGNING_SECRET`, `WEBHOOK_TIMEOUT_MS` |
| `pdf` | api | **somente o dono** | Geracao de documentos e relatorios. | `PDF_API_KEY`, `PDF_TEMPLATE_DIR` |
| `storage` | storage | **somente o dono** | Midias, anexos e backups. | `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY` |
| `meta_ads` | api | **somente o dono** | Anuncios e leitura de cliques para atribuicao. | `META_ADS_ACCESS_TOKEN`, `META_ADS_ACCOUNT_ID` |
| `instagram` | api | **somente o dono** | Publicacao e automacoes de resposta. | `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_REDIRECT_URI` |
| `anthropic` | llm | **somente o dono** | Agente automatico do consultorio. | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` |

Detalhe e procedimento em [`RUNBOOK-OWNER.md`](./RUNBOOK-OWNER.md).
