// Entorno de pruebas de OBRA-GIS: abre la app en Chromium (Playwright) con los servicios externos simulados.
const { chromium } = require('playwright');
const path = require('path');
const DATOS = path.join(__dirname, 'datos') + path.sep;
const APP = process.env.OBRAGIS_URL || 'http://localhost:8765/';
async function abrir(op = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: op.ancho || 400, height: op.alto || 820 }, hasTouch: !!op.tactil,
    geolocation: op.geo, permissions: op.geo ? ['geolocation'] : [], acceptDownloads: true });
  const H = { 'access-control-allow-origin': '*' };
  await ctx.route(/ign\.es\/wmts|tile\.openstreetmap|GetMap|GetLegendGraphic|ideandalucia|miteco|catastro|juntadeandalucia|mapa\.gob|nominatim|routed-car|project-osrm|api-coverages|GetFeatureInfo/i, r => r.abort());
  await ctx.route(/licencia\.json/, r => r.fulfill({ status: 200, headers: H, contentType: 'application/json', body: '{"activa":true}' }));
  await ctx.route(/version\.json/, r => r.fulfill({ status: 200, headers: H, contentType: 'application/json', body: '{"version":"0.0.1"}' }));
  const page = await ctx.newPage(); const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  page.on('dialog', d => (op.dialogo ? op.dialogo(d) : d.accept()));
  await page.goto(APP); await page.waitForTimeout(1200);
  await page.evaluate(() => { settings.eulaAccepted = '1'; settings.welcomed = true; saveSettings(); closeSheet(); });
  paginaActual = page;
  const cerrar = browser.close.bind(browser); browser.close = async () => { await Promise.allSettled(capturas.splice(0)); return cerrar(); }; // las capturas de los fallos terminan antes de cerrar
  return { browser, ctx, page, errores };
}
let paginaActual = null; const capturas = [];
let fallos = 0, total = 0;
function ok(nombre, cond, detalle = '') { total++; if (!cond) { fallos++; if (paginaActual && process.env.CI) capturas.push(paginaActual.screenshot({ path: path.join(__dirname, 'capturas', `fallo_${fallos}.png`) }).catch(() => {})); } console.log(`${cond ? 'OK   ' : 'FALLO'} ${nombre}${detalle ? ' · ' + detalle : ''}`); }
function resumen() { console.log(`\n${total - fallos} de ${total} comprobaciones correctas.`); return fallos; }
module.exports = { abrir, ok, resumen, DATOS };
