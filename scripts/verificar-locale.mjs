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
