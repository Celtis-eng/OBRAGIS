# OBRA-GIS

**Versión actual: 1.11.0** · historial completo en [CHANGELOG.md](CHANGELOG.md)

App de campo para Android (también funciona en iPhone y en el ordenador) que:

- Abre ficheros **KML y KMZ** (con sus colores, carpetas, descripciones y atributos) sobre **ortofoto híbrida**.
- Al **tocar una traza**: *Ir al inicio*, *Ir al final* o *Ir al punto tocado* con Google Maps, con longitud y coordenadas.
- Con una **pulsación larga** en cualquier punto del mapa: *Llévame aquí*, *Añadir anotación*, *Foto en este punto*, *Copiar coordenadas*, *Medir desde aquí* y *Ver en Google Maps*.
- **Anotaciones georreferenciadas** con título, descripción, **fotos, vídeos y notas de voz**. Cada anotación tiene también su botón *Llévame aquí*.
- **Foto rápida** (botón de cámara): abre la cámara y la sitúa con el GPS. Las fotos pueden llevar sellada la fecha, las coordenadas y la UTM.
- Coordenadas en geográficas y en **UTM ETRS89** (huso automático, H30 en Granada).
- **Medición** de distancias sobre el mapa.
- **Exportar** todas las anotaciones a un **KMZ** con las fotos, vídeos y audios dentro (se abre en Google Earth o QGIS).
- **Guardar zona sin conexión**: descarga la ortofoto PNOA de la zona visible para trabajar sin cobertura.
- **Fotos con GPS**: importa fotos JPEG y las coloca solas en el mapa con su fecha, altitud y orientación (si la cámara guardó la ubicación).
- **Gestor de capas**: mostrar/ocultar, orden, opacidad, color, renombrar, encuadrar y borrar. Servicios WMS/WMTS: Catastro, SIGPAC, MTN y límites del IGN, o cualquier WMS escribiendo su dirección.
- Recibir KML/KMZ **compartidos desde WhatsApp, Gmail o Drive** (botón Compartir → OBRA-GIS), una vez instalada.

Todo se guarda en el propio móvil. No hay servidor ni cuentas.

## Mapas de fondo

| Fondo | Clave | Notas |
|---|---|---|
| Ortofoto PNOA híbrida (IGN) | No | Por defecto. Ortofoto del PNOA con carreteras y topónimos del IGN. Gratuita (CC-BY 4.0). Se puede guardar sin conexión. |
| Google híbrido | Sí | Usa la API oficial *Map Tiles* de Google. No se puede usar sin conexión (lo prohíben las condiciones de Google). |
| Ortofoto PNOA sin rótulos | No | |
| OpenStreetMap | No | Callejero. |

### Activar Google híbrido (opcional)

1. Entra en Google Cloud Console con tu cuenta de Google y crea un proyecto. Hay que asociar una cuenta de facturación, aunque la API tiene una cuota gratuita mensual. Revisa la tarifa vigente.
2. En *APIs y servicios → Biblioteca*, activa **Map Tiles API**.
3. En *Credenciales*, crea una **clave de API**. Restríngela a *Map Tiles API* y a la dirección web donde publiques la app (restricción por sitios web/HTTP referrer).
4. En la app: menú ☰ → Ajustes → *Clave de Google* → Guardar clave. Después elige *Google híbrido* como mapa base.

No uses las URL "directas" de las teselas de Google (mt1.google.com…). Van contra sus condiciones y Google las puede bloquear.

## Cómo ponerla en el móvil

La cámara, el GPS y el micrófono solo funcionan si la app se abre desde una dirección **https**. Hay que publicar la carpeta en un alojamiento web gratuito. Cualquiera de estas opciones sirve:

**Opción A: Netlify Drop (la más rápida)**
1. Descomprime el ZIP.
2. Entra en https://app.netlify.com/drop y arrastra la carpeta `campo-kml`.
3. Te dará una dirección del tipo `https://nombre-aleatorio.netlify.app`. Crea una cuenta gratuita para que no caduque.

**Opción B: GitHub Pages**
1. Crea un repositorio en GitHub y sube el contenido de la carpeta.
2. En *Settings → Pages*, elige la rama `main` y la carpeta raíz.
3. La app quedará en `https://tu-usuario.github.io/nombre-repo/`.

**Instalar en Android**
1. Abre la dirección en Chrome.
2. Menú ⋮ → *Instalar aplicación* (o *Añadir a pantalla de inicio*).
3. Ya tienes el icono de OBRA-GIS, y la app se abre a pantalla completa como cualquier otra.
4. La primera vez acepta los permisos de ubicación, cámara y micrófono.

Para actualizar la app, sube los ficheros nuevos al mismo sitio. Los móviles cogen la nueva versión al abrirla dos veces. Si cambias `app.js`, sube también el número de `SHELL = 'shell-v1'` en `sw.js`.

## Copias de seguridad

Los datos viven en el navegador del móvil. Si desinstalas la app o borras los datos de Chrome, se pierden. Usa **Exportar KMZ** con regularidad. Ese fichero contiene todas las anotaciones con sus fotos, vídeos y audios.

## Archivos

- `index.html`, `app.css`, `app.js`: la aplicación.
- `sw.js`: funcionamiento sin conexión y recepción de ficheros compartidos.
- `manifest.webmanifest`, `icons/`: instalación como app.
- `vendor/`: Leaflet 1.9.4 (mapa) y JSZip 3.10.1 (KMZ).
- `ejemplo-red-riego.kml`: KML de prueba.

## App nativa Android (APK)

El repositorio compila la app Android solo, con GitHub Actions, cada vez que subes cambios a `main`.

- La carpeta `android-build/` contiene el empaquetado nativo (Capacitor): permisos de GPS, cámara y micrófono, el receptor de ficheros (`native/InboxPlugin.java`) para **"Abrir con"** y **"Compartir"**, y el icono.
- `.github/workflows/android.yml` es la receta de compilación. Tarda unos 5 minutos. Puedes seguirla en la pestaña **Actions**.
- El APK se publica en **Releases** con el nombre `CampoKML.apk`. Enlace directo:
  `https://github.com/<usuario>/<repositorio>/releases/download/apk/CampoKML.apk`
- `android-build/debug.keystore` es la firma de la app. Es una firma de pruebas, pero siempre la misma, así que las nuevas versiones se instalan encima sin desinstalar. Si algún día la publicas en Google Play, habrá que crear una firma propia y guardarla como secreto del repositorio.

**Instalar en el móvil:** abre el enlace del APK en Chrome, descárgalo y ábrelo. Android pedirá permiso para "instalar aplicaciones desconocidas" desde Chrome. Concédelo. Play Protect puede avisar de que la app no está en Google Play. Pulsa "Instalar de todas formas".

**Fotos con GPS en la app nativa:** la forma más fiable es seleccionarlas en la Galería y usar Compartir → OBRA-GIS. Así la app puede pedir a Android la foto original con las coordenadas.

**Google híbrido en la app nativa:** si restringes la clave de Google por sitio web, añade `https://localhost/*` a la lista.

## Versiones

Cada entrega lleva su número de versión (`APP_VERSION` en `app.js` y `VERSION` en `sw.js`). Dentro de la app se ve en **Capas → final del panel → Novedades**. El historial está en `CHANGELOG.md`.
