// Prepara el proyecto Android de OBRA-GIS. La versión se toma de APP_VERSION en js/01-version.js.
//   node prepare.js www      → copia la web (carpeta raíz del repositorio) a www/
//   node prepare.js android  → personaliza el proyecto generado por "npx cap add android"
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const HERE = __dirname;
const step = process.argv[2];

function copy(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) copy(path.join(src, f), path.join(dst, f));
  } else fs.copyFileSync(src, dst);
}

if (step === 'www') {
  const www = path.join(HERE, 'www');
  fs.rmSync(www, { recursive: true, force: true });
  fs.mkdirSync(www, { recursive: true });
  for (const f of ['index.html', 'app.css', 'js', 'ficha.js', 'manifest.webmanifest', 'icons', 'vendor']) copy(path.join(ROOT, f), path.join(www, f));
  console.log('Web copiada a www/');
  // código ofuscado en el APK (protección frente a copias); si el paquete no está instalado se avisa y se sigue
  try { require.resolve('javascript-obfuscator'); require('child_process').execFileSync(process.execPath, [path.join(HERE, 'ofuscar.js'), www], { stdio: 'inherit' }); }
  catch (e) { console.warn('AVISO: no se ha ofuscado el código (' + (e.code || e.message) + ')'); }
}

if (step === 'android') {
  const app = path.join(HERE, 'android', 'app');
  const main = path.join(app, 'src', 'main');

  // 1. Código nativo (actividad principal y receptor de ficheros)
  const javaDir = path.join(main, 'java', 'es', 'obragis', 'campokml');
  for (const f of ['MainActivity.java', 'InboxPlugin.java']) fs.copyFileSync(path.join(HERE, 'native', f), path.join(javaDir, f));

  // 2. Permisos y filtros "Abrir con" / "Compartir"
  const mf = path.join(main, 'AndroidManifest.xml');
  let x = fs.readFileSync(mf, 'utf8');
  const perms = ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'CAMERA', 'RECORD_AUDIO', 'MODIFY_AUDIO_SETTINGS', 'ACCESS_MEDIA_LOCATION']
    .map(p => `    <uses-permission android:name="android.permission.${p}" />`).join('\n');
  const feats = ['android.hardware.camera', 'android.hardware.location.gps', 'android.hardware.microphone']
    .map(f => `    <uses-feature android:name="${f}" android:required="false" />`).join('\n');
  // Guardar copias en Documentos/OBRA-GIS: en Android 10 o anterior hace falta el permiso de almacenamiento
  const storage = ['    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />',
    '    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />'].join('\n');
  x = x.replace('<uses-permission android:name="android.permission.INTERNET" />',
    `<uses-permission android:name="android.permission.INTERNET" />\n${perms}\n${storage}\n${feats}`);
  if (!/requestLegacyExternalStorage/.test(x)) x = x.replace('<application', '<application android:requestLegacyExternalStorage="true"');
  const kmlTypes = ['application/vnd.google-earth.kml+xml', 'application/vnd.google-earth.kmz'];
  const genericTypes = ['application/octet-stream', 'application/xml', 'text/xml', 'application/zip'];
  const data = types => types.map(t => `                <data android:mimeType="${t}" />`).join('\n');
  const filters = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="content" />
                <data android:scheme="file" />
${data(kmlTypes)}
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:scheme="content" />
                <data android:scheme="file" />
${data(genericTypes)}
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
${data([...kmlTypes, ...genericTypes, 'image/*'])}
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.SEND_MULTIPLE" />
                <category android:name="android.intent.category.DEFAULT" />
${data(['image/*', ...kmlTypes, 'application/octet-stream'])}
            </intent-filter>
`;
  x = x.replace(/(<category android:name="android.intent.category.LAUNCHER" \/>\s*<\/intent-filter>)/, `$1\n${filters}`);
  if (!x.includes('SEND_MULTIPLE')) throw new Error('No se pudieron insertar los filtros de intención');
  fs.writeFileSync(mf, x);

  // 3. Icono de la app
  fs.rmSync(path.join(main, 'res', 'mipmap-anydpi-v26'), { recursive: true, force: true });
  copy(path.join(HERE, 'res'), path.join(main, 'res'));

  // 4. Número de versión creciente para poder actualizar sin desinstalar
  const run = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10);
  const bg = path.join(app, 'build.gradle');
  let g = fs.readFileSync(bg, 'utf8');
  const m = /const APP_VERSION = '([^']+)'/.exec(fs.readFileSync(path.join(ROOT, 'js', '01-version.js'), 'utf8'));
  const ver = m ? m[1] : '1.0.0';
  g = g.replace(/versionCode \d+/, `versionCode ${run}`).replace(/versionName "[^"]*"/, `versionName "${ver}"`);
  // 5. Firma SIEMPRE con android-build/debug.keystore. Sin esto, Gradle firmaba cada compilación con una clave nueva
  //    y Android obligaba a desinstalar (perdiendo los datos) para instalar la versión siguiente.
  if (!/signingConfigs\s*\{/.test(g)) {
    g = g.replace(/android\s*\{/, `android {
    signingConfigs {
        debug {
            storeFile file('../../debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`);
  }
  g = g.replace(/buildTypes\s*\{/, `buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }`);
  fs.writeFileSync(bg, g);
  console.log(`Proyecto Android preparado: versión ${ver} (compilación ${run})`);
}
