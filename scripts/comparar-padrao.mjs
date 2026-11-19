// Compara o render padrao (sem LocaleProvider) de dois checkouts do blocos ja compilados.
// Uso: node scripts/comparar-padrao.mjs <checkout-antigo> [<checkout-novo>=este]
import { createRequire } from 'node:module';
import path from 'node:path';
async function render(root) {
  const req = createRequire(path.join(root, 'package.json'));
  const React = req('react'); const { renderToStaticMarkup } = req('react-dom/server');
  const b = await import(path.join(root, 'packages/blocks/dist/index.js'));
  const out = {};
  for (const v of ['cards', 'table', 'split']) for (const st of ['success', 'empty', 'forbidden'])
    out[`packages/${v}/${st}`] = renderToStaticMarkup(React.createElement(b.PackagesPricing, { data: st === 'empty' ? { packages: [] } : b.packagesPricingMock, variant: v, state: st }));
  for (const v of ['table', 'cards', 'grid']) for (const st of ['success', 'empty', 'forbidden'])
    out[`patients/${v}/${st}`] = renderToStaticMarkup(React.createElement(b.PatientsList, { data: st === 'empty' ? { patients: [] } : b.clinicoMock.patientsList, variant: v, state: st }));
  for (const v of ['timeline', 'table', 'cards']) for (const st of ['success', 'empty', 'forbidden'])
    out[`meta/${v}/${st}`] = renderToStaticMarkup(React.createElement(b.MetaConversion, { data: st === 'empty' ? { events: [] } : b.metaConversionMock, variant: v, state: st, connectors: [{ id: 'meta_ads', status: 'provisioned' }] }));
  for (const v of ['list', 'calendar', 'board']) for (const st of ['success', 'empty', 'forbidden'])
    out[`tasks/${v}/${st}`] = renderToStaticMarkup(React.createElement(b.FollowUpTasks, { data: st === 'empty' ? { tasks: [] } : b.followUpMock, variant: v, state: st, connectors: [{ id: 'whatsapp', status: 'provisioned' }] }));
  for (const v of ['list', 'flow']) out[`webhooks/${v}`] = renderToStaticMarkup(React.createElement(b.WebhooksPanel, { data: b.webhooksMock ?? b.webhooksPanelMock, variant: v, connectors: [{ id: 'webhooks', status: 'provisioned' }] }));
  return out;
}
const [a, bb] = [await render(process.argv[2]), await render(process.argv[3] ?? path.resolve(import.meta.dirname, ".."))];
let diff = 0;
// Mudanca de proposito (PR #6): a area rolavel do DataTable recebe foco (tabIndex=0).
// Uma diferenca que some ao tirar so esse atributo e marcada assim, nao como regressao.
const semFoco = (html) => html.replace(/(<div class="bloco-scroll relative overflow-x-auto")(?: tabindex="0")/g, '$1');
for (const k of Object.keys(a)) {
  const same = a[k] === bb[k];
  const soFoco = !same && semFoco(a[k]) === semFoco(bb[k]);
  if (!same && !soFoco) diff++;
  console.log((same ? 'IGUAL ' : soFoco ? 'IGUAL (so o foco da tabela) ' : 'DIFERENTE ') + k + (same || soFoco ? '' : `  (${a[k].length} vs ${bb[k].length})`));
}
process.exitCode = diff ? 1 : 0;
