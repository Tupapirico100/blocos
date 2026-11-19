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
  for (const v of ['list', 'flow']) out[`webhooks/${v}`] = renderToStaticMarkup(React.createElement(b.WebhooksPanel, { data: b.webhooksMock ?? b.webhooksPanelMock, variant: v, connectors: [{ id: 'webhooks', status: 'provisioned' }] }));
  return out;
}
const [a, bb] = [await render(process.argv[2]), await render(process.argv[3] ?? path.resolve(import.meta.dirname, ".."))];
let diff = 0;
for (const k of Object.keys(a)) { const same = a[k] === bb[k]; if (!same) diff++; console.log((same ? 'IGUAL ' : 'DIFERENTE ') + k + (same ? '' : `  (${a[k].length} vs ${bb[k].length})`)); }
process.exitCode = diff ? 1 : 0;
