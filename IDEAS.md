# OBRA-GIS · Ideas y mejoras para más adelante

Banco de ideas aparcadas para rescatarlas cuando toque. **Ahora la prioridad es depurar errores y afinar lo que ya hay** (decisión del 22/11/2026). Cada idea indica de dónde sale y una estimación de esfuerzo cuando la hay.

## Modos y formas de trabajar

| Idea | Qué es | Origen | Esfuerzo |
|---|---|---|---|
| **Paso a paso** (para encargados sin formación) | Asistente de pantallas grandes, una pregunta cada vez: «¿Qué ves?» → «¿Desde dónde?» → «¿Hasta dónde?» → foto → guardar. Sin jerga (PK, margen, traza). | Irene, N4 (rondas 3-4); Paco | 3-4 días |
| **Modo ancho de escritorio** (oficina) | Panel lateral fijo con capas/listados a la izquierda y la ficha a la derecha a la vez; tablas a todo el ancho; BC3 y mediciones en dos columnas. | Lucía (rondas 1-7); Irene, N5 | 5-7 días |
| **Modo guantes / pleno sol** | Ajuste que fuerza tema claro, quita transparencias, engorda trazos del mapa y agranda aún más los toques. | Irene (ronda 1, N3) | Medio. **Descartado por ahora** (22/11/2026) |
| Atajos que empiezan el tramo directamente | Que los chips «Tramo andando de:» del «+» empiecen ya, sin pasar por «Empezar». Hoy se mantiene el paso intermedio para evitar tramos sin querer. | Irene, N2 | Bajo |
| Revisión corta al terminar un tramo | En lugar del editor entero, una tarjeta con lo esencial (tipo, PK, medidas copiadas) y «Guardar» / «Guardar y seguir». | Irene, solución 3 | Medio |
| Seguir con un toque desde el mapa | Tocar el final de la última actuación en el mapa para seguir desde ahí. | Irene, N2 | Medio |

## Accesibilidad pendiente

- Orden de tabulación (hoy empieza por los botones redondos) y foco atrapado dentro de las fichas.
- `aria-modal` y anuncio de las fichas como diálogo; nombres accesibles del botón de la obra y del «+».
- Colores de los tipos de actuación por categoría y con letras en las etiquetas del mapa (daltonismo y pleno sol). (Irene D-4)
- Probar con TalkBack y con guantes en un Android real.

## Oficina, mediciones y BC3

- Revisión antes de enviar: avisar de partidas sin precio y poder volver a «Enviar» desde la revisión. (Lucía L6-4, L6-5)
- Decimales del BC3 iguales a la pantalla (hoy 3 decimales para que cada partida sume exacta). (Lucía LUC-6)
- Propuestas de la base para cunetas (aún fallan con bases reales). (Lucía L2-3)
- Croquis del informe: distinguir margen izquierdo y derecho y no tapar números. (Lucía LUC-10)
- CSV con fila de totales y PK numérico; KMZ de pendientes con cota Z real. (Lucía)

## Datos y robustez

- Escritura nativa de ficheros con `.part` y renombrado al terminar (evitar ficheros a medias). (Marta)
- MultiGeometry con huecos: los tramos no deben cruzar el hueco. (Marta MAR-15)
- Avisar de elementos omitidos al importar un KML con geometrías no válidas. (Marta MAR-13)

## Protección y distribución (versión 1.20.0; la 1.19.0 fue la copia automática)

- Repositorio privado y retirar o restringir la versión web pública.
- Activación con código personal por usuario, comprobada en un servidor gratuito (Cloudflare Workers), con baja individual y periodo sin conexión.
- Ofuscación del APK ya activa desde 1.18.3; protege poco (Marta recupera los textos en 5 min).
- Reparto controlado (pruebas cerradas de Google Play o Firebase App Distribution).
- Aviso de copyright y registro de autoría (Registro de la Propiedad Intelectual o Safe Creative). Aclarar antes la titularidad si la app se usa en el trabajo (art. 97.4 LPI).

## Pendiente de probar en un móvil real

- Dictado por voz con el reconocimiento de Android.
- APK firmado con clave estable (actualizar sin desinstalar).
- Vibración y pantalla encendida durante el tramo.
- Rendimiento con obras grandes y GPS real (Lucía notó una espera de 20 s tras estar quieto en la emulación).

## Copia de seguridad (después de 1.19.0)

- Copia también en la nube (Google Drive) con un toque, por si se pierde o se rompe el móvil.
- Recuperación automática sin elegir ficheros tras reinstalar (Android no deja leer los ficheros de la instalación anterior sin permisos especiales).
