// Ofusca el código de la app en www/ antes de compilar el APK (no cambia lo que hace, solo lo hace ilegible).
// Uso: node ofuscar.js <carpeta>   (por defecto www). Requiere el paquete javascript-obfuscator.
const fs = require('fs'), path = require('path');
const JO = require('javascript-obfuscator');
const dir = path.resolve(__dirname, process.argv[2] || 'www');
const OPC = {
  compact: true, renameGlobals: false, // las funciones globales se llaman entre app.js y ficha.js: se conservan sus nombres
  identifierNamesGenerator: 'hexadecimal', stringArray: true, stringArrayThreshold: 0.5, stringArrayEncoding: ['base64'],
  splitStrings: false, controlFlowFlattening: false, deadCodeInjection: false, selfDefending: false, // sin penalizar la velocidad en móviles modestos
  transformObjectKeys: false, unicodeEscapeSequence: false, sourceMap: false, target: 'browser'
};
for (const f of ['app.js', 'ficha.js']) {
  const p = path.join(dir, f); if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8'), out = JO.obfuscate(src, OPC).getObfuscatedCode();
  fs.writeFileSync(p, '/* OBRA-GIS © Celtis-eng · Todos los derechos reservados. Prohibida su copia, modificación o distribución sin permiso. */\n' + out);
  console.log(`Ofuscado ${f}: ${(src.length / 1024).toFixed(0)} KB → ${(out.length / 1024).toFixed(0)} KB`);
}
