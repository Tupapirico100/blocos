// Verifica o LocaleProvider: sem ele, os blocos ficam iguais (pt-BR, BRL, Sao Paulo);
// com ele, textos, hora e papeis mudam. Uso: npm run build && npm run verificar:locale
import { createRequire } from 'node:module';
import path from 'node:path';
const root = process.argv[2] ?? path.resolve(import.meta.dirname, "..");
const req = createRequire(path.join(root, 'package.json'));
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const blocks = await import(path.join(root, 'packages/blocks/dist/index.js'));
const ui = await import(path.join(root, 'packages/ui/dist/index.js'));
const data = {
  backoffSchedule: [],
  webhooks: [{ id: 'w1', url: 'https://example.com/hook', events: ['appointment.created'], secretRef: 'CRM_WEBHOOK_SECRET', active: true,
    guard: { https: true, publicIp: true, checkedAt: '2026-11-18T15:00:00Z' },
    delivery: { attempts: 1, lastStatus: 'ok', lastAttemptAt: '2026-11-18T15:00:00Z' }, backoffStep: 0 }],
};
const plain = renderToStaticMarkup(React.createElement(blocks.WebhooksPanel, { data, connectors: [{ id: 'webhooks', status: 'provisioned' }] }));
const es = renderToStaticMarkup(React.createElement(ui.LocaleProvider, { locale: 'es-PE', currency: 'PEN', timeZone: 'America/Lima',
  messages: { 'webhooks.title': 'Webhooks de salida', 'webhooks.status.ok': 'Entregado', 'webhooks.col.active': 'Activo' } },
  React.createElement(blocks.WebhooksPanel, { data: { ...data, eventLabels: { 'appointment.created': 'Cita creada' }, canPreview: true }, connectors: [{ id: 'webhooks', status: 'provisioned' }] })));
const forb = renderToStaticMarkup(React.createElement(ui.LocaleProvider, { messages: { 'role.owner': 'responsable de la clínica', 'role.platform_owner': 'administrador de la plataforma', 'frame.rolesJoin': ' o ', 'frame.forbiddenTitle': 'Acceso restringido', 'frame.forbiddenRoles': 'Solo {roles} puede ver esta sección.' } },
  React.createElement(blocks.WebhooksPanel, { data, state: 'forbidden', connectors: [{ id: 'webhooks', status: 'provisioned' }] })));
const check = (name, ok) => { console.log((ok ? 'OK  ' : 'FAIL') + ' ' + name); if (!ok) process.exitCode = 1; };
check('padrao: titulo pt-BR', plain.includes('Webhooks de saida'));
check('padrao: Entregue', plain.includes('Entregue'));
check('padrao: data em Sao Paulo (15:00Z -> 12:00)', plain.includes('12:00'));
check('padrao: sem botao de previa', !plain.includes('Ver previa'));
check('padrao: evento como codigo', plain.includes('appointment.created'));
check('es-PE: titulo', es.includes('Webhooks de salida') && !es.includes('Webhooks de saida'));
check('es-PE: Entregado', es.includes('Entregado'));
check('es-PE: hora em Lima (15:00Z -> 10:00)', es.includes('10:00') && !es.includes('12:00'));
check('es-PE: nome do evento', es.includes('Cita creada'));
check('es-PE: botao de previa', es.includes('Ver previa'));
check('sem permissao: papel nomeado em espanhol', forb.includes('responsable de la clínica') && forb.includes('role="alert"') && forb.includes('Acceso restringido'));
check('sem permissao padrao intacto', renderToStaticMarkup(React.createElement(blocks.WebhooksPanel, { data, state: 'forbidden', connectors: [{ id: 'webhooks', status: 'provisioned' }] })).includes('dono do consultório'));

// packages-pricing (CRM-HOF: sem edicao, recepcao so ve, sem validade, moeda por pacote)
const pk = { packages: [{ id: 'p1', name: 'Protocolo bioestimulador', priceCents: 50000, currency: 'PEN', sessions: 3, active: true }] };
const esMsgs = { 'packages.deactivate': 'Descontinuar', 'packages.deactivateNamed': 'Descontinuar {name}', 'packages.sessions': 'Sesiones', 'packages.active': 'Activo' };
const pkOwner = renderToStaticMarkup(React.createElement(ui.LocaleProvider, { locale: 'es-PE', currency: 'PEN', timeZone: 'America/Lima', messages: esMsgs },
  React.createElement(blocks.PackagesPricing, { data: { ...pk, canSave: false, showValidity: false, showHeader: false } })));
const pkReception = renderToStaticMarkup(React.createElement(ui.LocaleProvider, { locale: 'es-PE', currency: 'PEN', messages: esMsgs },
  React.createElement(blocks.PackagesPricing, { data: { ...pk, canSave: false, canToggle: false, showValidity: false } })));
const pkDefault = renderToStaticMarkup(React.createElement(blocks.PackagesPricing, { data: { packages: [{ ...pk.packages[0], currency: undefined }] } }));
check('pacotes es-PE: preco em soles', pkOwner.includes('S/') && pkOwner.includes('500.00'));
check('pacotes es-PE: Descontinuar e Sesiones', pkOwner.includes('Descontinuar') && pkOwner.includes('Sesiones'));
check('pacotes canSave=false: sem Salvar', !pkOwner.includes('Salvar'));
check('pacotes showValidity=false: sem validade', !pkOwner.includes('Validade') && !pkOwner.includes('validade'));
check('pacotes canToggle=false: sem botao de desativar', !pkReception.includes('Descontinuar'));
check('pacotes padrao: BRL, Salvar, Desativar, validade', pkDefault.includes('R$') && pkDefault.includes('Salvar') && pkDefault.includes('Desativar') && pkDefault.includes('Sem validade definida'));

// patients-list (CRM-HOF: DNI, telefone do Peru, sem consentimento nem ultima consulta, busca no servidor)
const pts = { patients: [{ id: 'a1', name: 'Ana Huamán', phone: '+51933333333', document: '43456789' }], showSearch: false, showConsent: false, showLastVisit: false, showDocument: true };
const ptEs = renderToStaticMarkup(React.createElement(ui.LocaleProvider, { locale: 'es-PE', messages: { 'patients.col.name': 'Nombre', 'patients.col.document': 'Documento', 'patients.col.contact': 'Teléfono', 'patients.open': 'Abrir la ficha de {name}' } },
  React.createElement(blocks.PatientsList, { data: pts })));
check('pacientes: telefone do Peru nao vira +55', ptEs.includes('+51 933 333 333') && !ptEs.includes('+55'));
check('pacientes: coluna de DNI', ptEs.includes('43456789') && ptEs.includes('Documento'));
check('pacientes: sem consentimento e sem ultima consulta', !ptEs.includes('Consentimento') && !ptEs.includes('Ultima consulta'));
check('pacientes: sem busca interna', !ptEs.includes('type="search"'));
check('pacientes es-PE: botao nomeado', ptEs.includes('Abrir la ficha de Ana Huamán'));
const ptDefault = renderToStaticMarkup(React.createElement(blocks.PatientsList, { data: { patients: [{ id: 'b', name: 'Joana', phone: '+5511987654321', treatmentConsent: 'vigente' }] } }));
check('pacientes padrao: telefone BR, consentimento e busca', ptDefault.includes('+55 (11) 98765-4321') && ptDefault.includes('Consentido') && ptDefault.includes('type="search"'));

// meta-conversion (CRM-HOF: fila com expirado/recusado, motivo e resposta; sem exportar/reenviar; hora de Lima)
const mev = { events: [
  { id: 'e1', event: 'LeadSubmitted', dedupKey: 'lead1:new', stage: 'new', occurredAt: '2026-11-18T15:00:00Z', status: 'recusado', reason: 'Sin consentimiento de marketing' },
  { id: 'e2', event: 'Purchase', dedupKey: 'lead2:customer', stage: 'customer', occurredAt: '2026-11-18T15:00:00Z', status: 'enviado', responseCode: 200 },
  { id: 'e3', event: 'QualifiedLead', dedupKey: 'lead3:qualified', stage: 'qualified', occurredAt: '2026-11-01T15:00:00Z', status: 'expirado' },
], showSource: false, showOutcome: true, canExport: false, canRetry: false };
const metaEs = renderToStaticMarkup(React.createElement(ui.LocaleProvider, { locale: 'es-PE', timeZone: 'America/Lima', messages: { 'meta.status.recusado': 'Rechazado', 'meta.status.expirado': 'Vencido', 'meta.status.enviado': 'Enviado', 'meta.stage.new': 'Nuevo', 'meta.col.reason': 'Motivo' } },
  React.createElement(blocks.MetaConversion, { data: mev, variant: 'table', connectors: [{ id: 'meta_ads', status: 'provisioned' }] })));
check('meta es-PE: status novos traduzidos', metaEs.includes('Rechazado') && metaEs.includes('Vencido'));
check('meta es-PE: motivo e resposta', metaEs.includes('Sin consentimiento de marketing') && metaEs.includes('200'));
check('meta es-PE: hora de Lima (15:00Z -> 10:00)', metaEs.includes('10:00') && !metaEs.includes('12:00'));
check('meta: sem exportar e sem reenviar', !metaEs.includes('Exportar') && !metaEs.includes('Reenviar'));
check('meta: sem coluna de origem', !metaEs.includes('Origem'));
const metaDefault = renderToStaticMarkup(React.createElement(blocks.MetaConversion, { data: { events: [{ ...mev.events[1], source: 'anuncio', status: 'erro' }] }, variant: 'table', connectors: [{ id: 'meta_ads', status: 'provisioned' }] }));
check('meta padrao: origem, exportar, reenviar, Sao Paulo', metaDefault.includes('Origem') && metaDefault.includes('Exportar fila') && metaDefault.includes('Reenviar com erro') && metaDefault.includes('12:00'));

// follow-up-tasks (CRM-HOF: titulo livre, paciente opcional, sem responsavel nem tipo, hora de Lima)
const tk = { tasks: [
  { id: 't1', label: 'Llamar para control de 15 días', patientName: 'Ana Huamán', detail: 'Toxina botulínica', dueAt: '2026-11-20T15:00:00Z', status: 'pendente' },
  { id: 't2', label: 'Confirmar stock', dueAt: '2026-11-18T15:00:00Z', status: 'atrasada' },
], showOwner: false, showType: false, showHeader: false };
const tkEs = renderToStaticMarkup(React.createElement(ui.LocaleProvider, { locale: 'es-PE', timeZone: 'America/Lima', messages: { 'tasks.col.patient': 'Tarea', 'tasks.complete': 'Completar', 'tasks.completeNamed': 'Completar {title}', 'tasks.status.atrasada': 'Vencida', 'tasks.col.due': 'Vence' } },
  React.createElement(blocks.FollowUpTasks, { data: tk, variant: 'list', connectors: [{ id: 'whatsapp', status: 'provisioned' }] })));
check('tarefas: titulo livre e linha de apoio', tkEs.includes('Llamar para control de 15 días') && tkEs.includes('Ana Huamán · Toxina botulínica'));
check('tarefas: tarefa sem paciente', tkEs.includes('Confirmar stock'));
check('tarefas: sem responsavel e sem tipo', !tkEs.includes('Responsavel') && !tkEs.includes('Tipo'));
check('tarefas es-PE: textos e botao nomeado', tkEs.includes('Vencida') && tkEs.includes('Completar Llamar para control de 15 días'));
check('tarefas: hora de Lima (15:00Z -> 10:00)', tkEs.includes('20/11 10:00') && !tkEs.includes('12:00'));
const tkDefault = renderToStaticMarkup(React.createElement(blocks.FollowUpTasks, { data: blocks.followUpMock, variant: 'list', connectors: [{ id: 'whatsapp', status: 'provisioned' }] }));
check('tarefas padrao: fuso de Sao Paulo, Responsavel e Tipo', tkDefault.includes('Fuso America/Sao_Paulo') && tkDefault.includes('Responsavel') && tkDefault.includes('Tipo'));

// agenda-board (CRM-HOF: hora de Lima, estado proprio, acoes decididas pelo CRM, legenda propria)
const ag = {
  professionals: [{ id: 'pr1', name: 'Dra. Rosa Quispe', specialty: 'Medicina estética' }],
  appointments: [
    { id: 'a1', patientId: 'p1', patientName: 'Ana Huamán', professionalId: 'pr1', type: 'Toxina botulínica', status: 'agendado',
      statusLabel: 'Solicitada', statusTone: 'info', startsAt: '2026-11-20T15:00:00Z', endsAt: '2026-11-20T15:30:00Z',
      patientHref: '/es-PE/patients/p1', notice: 'Falta consentimiento', detail: ['Sala: Sala 1'], history: ['01/12/2026 10:00 — Solicitada'],
      actions: [{ id: 'appointment.confirm', label: 'Confirmar' }, { id: 'payment.new', label: 'Registrar pago', href: '/es-PE/payments/new?appointmentId=a1' }, { id: 'appointment.cancel', label: 'Cancelar cita', tone: 'danger', reason: { title: 'Cancelar', label: 'Motivo' } }] },
    { id: 'a2', patientId: 'p2', patientName: 'Luis Rojas', professionalId: 'pr1', type: 'Relleno', status: 'compareceu',
      statusLabel: 'Atendida', startsAt: '2026-11-20T16:00:00Z', endsAt: '2026-11-20T16:30:00Z', actions: [] },
  ],
  legend: [{ label: 'Solicitada', tone: 'info' }, { label: 'Atendida', tone: 'success' }],
};
const agEs = renderToStaticMarkup(React.createElement(ui.LocaleProvider, { locale: 'es-PE', timeZone: 'America/Lima', messages: { 'agenda.title': 'Programación del día', 'agenda.col.professional': 'Profesional', 'agenda.col.actions': 'Acciones', 'agenda.col.status': 'Estado', 'agenda.col.type': 'Servicio' } },
  React.createElement(blocks.AgendaBoard, { data: ag, variant: 'list', connectors: [{ id: 'database', status: 'provisioned' }] })));
check('agenda es-PE: titulo, cartoes e profissional', agEs.includes('Programación del día') && agEs.includes('Toxina botulínica · Dra. Rosa Quispe') && !agEs.includes('<table'));
check('agenda: hora de Lima (15:00Z -> 10:00)', agEs.includes('10:00') && !agEs.includes('12:00'));
check('agenda: fuso de Lima no selo', agEs.includes('America/Lima') && !agEs.includes('Sao_Paulo'));
check('agenda: estado proprio', agEs.includes('Solicitada') && agEs.includes('Atendida') && !agEs.includes('Agendado'));
check('agenda: acoes do CRM com nome unico', agEs.includes('aria-label="Confirmar — Ana Huamán"') && agEs.includes('aria-label="Cancelar cita — Ana Huamán"'));
check('agenda: sem seletor de status nem botoes fixos com acoes', !agEs.includes('Alterar status') && !agEs.includes('Reagendar consulta'));
check('agenda: consulta sem acoes nao ganha botao', !agEs.includes('— Luis Rojas"'));
check('agenda: legenda propria', !agEs.includes('Faltou'));
check('agenda: nome do paciente e link da ficha', agEs.includes('href="/es-PE/patients/p1"'));
check('agenda: acao com href vira link nomeado', /<a href="\/es-PE\/payments\/new\?appointmentId=a1" aria-label="Registrar pago — Ana Huamán"/.test(agEs));
check('agenda: aviso, detalhe e historico a mostra', agEs.includes('role="status"') && agEs.includes('Falta consentimiento') && agEs.includes('Sala: Sala 1') && agEs.includes('01/12/2026 10:00 — Solicitada'));
const agDefault = renderToStaticMarkup(React.createElement(blocks.AgendaBoard, { data: blocks.agendaBoardMock, variant: 'list', connectors: [{ id: 'database', status: 'provisioned' }] }));
check('agenda padrao: Sao Paulo, seletor de status e botoes fixos', agDefault.includes('Fuso America/Sao_Paulo') && agDefault.includes('Alterar status') && agDefault.includes('Reagendar consulta'));
