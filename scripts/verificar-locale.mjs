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
