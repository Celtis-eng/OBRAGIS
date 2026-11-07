# OBRA-GIS · Historial de versiones

La versión se define en `app.js` (`APP_VERSION`) y en `sw.js` (`VERSION`); ambas deben coincidir.
Formato **MAYOR.MENOR.CORRECCIÓN**: MENOR sube con cada función nueva y CORRECCIÓN con cada arreglo.
La app Android toma la misma versión; el número de compilación lo pone GitHub Actions.

| Versión | Fecha | Cambios |
|---|---|---|
| **1.14.0** | 07/11/2026 | Informe de afecciones: se eligen las trazas (selección múltiple, opciones de la capa o Herramientas) y las capas de servicios a consultar; la app recorre cada traza cada 10–100 m con una banda de ±3 a ±100 m, agrupa las afecciones por elemento y tramo de PK, propone el organismo o titular a consultar y avisa de los servicios que no responden. Exportación a HTML imprimible (PDF) con croquis, CSV y KMZ de tramos afectados. El último informe se guarda con la obra y viaja en el paquete. |
| 1.13.0 | 07/11/2026 | Calibración de los KML configurable: distancia entre marcas de PK en Ajustes para todas las trazas (5, 10, 20, 25, 50, 100, 200, 250, 500 m, 1 km u otra distancia) y calibración propia por capa en sus opciones. Las marcas y rótulos se adaptan al zoom. La calibración viaja en el paquete de obra y se ve en Propiedades. |
| 1.12.0 | 04/11/2026 | Árbol de carpetas (crear, renombrar, anidar) y selección múltiple de capas con pulsación larga: mostrar, ocultar, subir, bajar, mover a carpeta, unir, exportar KMZ y borrar. Invertir el sentido de una traza (PK, anchos y actuaciones se recalculan). Crear KML de puntos. Unión de varios KML en uno conservando estilos, carpetas y atributos. Tabla de atributos con exportación e importación CSV para Excel/Calc. Ficha de propiedades de la capa. Capa de recursos común a todas las obras (plantas de RCD, hormigón, canteras de zahorra y escollera, aglomerado, vertederos…), editable e importable por CSV. Calculadora: distancia, área y perímetro, pendiente entre dos puntos, conversor %/‰/grados/talud y coordenadas geográficas/UTM. Distancia por carretera (OpenStreetMap). Pendientes por tramos ≤ X % y ≥ Y %. Fecha del vuelo PNOA en el pie del mapa. Descarga sin conexión por municipio o tocando el mapa (ortofoto, rótulos y servicios visibles). Licencia de uso con desactivación remota (licencia.json). Se retira Google híbrido (reservado para una versión premium). Base de datos v4. |
| 1.11.0 | 27/10/2026 | Fotos con marca de agua: lectura del texto (OCR) para recuperar coordenadas (decimales, grados-minutos-segundos o UTM), fecha y altitud de fotos que han perdido los metadatos (p. ej. por WhatsApp); la app las sitúa y les vuelve a escribir el GPS en el EXIF. Las fotos hechas con la app llevan GPS en el EXIF. Compartir fotos con GPS. |
| 1.10.0 | 27/10/2026 | Anchos del camino: toma de datos cada X metros o en cada cambio, ancho medio ponderado, mínimo, máximo y superficie (también por tramos), plataforma dibujada en el mapa y exportación a CSV y GeoJSON. Trazas nuevas dibujando en el mapa o grabando con GPS. |
| 1.9.0 | 25/10/2026 | Control de versiones: número de versión visible en la app, pantalla de novedades, aviso al actualizar, versión en los paquetes de obra y en la app Android. |
| 1.8.0 | 25/10/2026 | Obras: cada obra guarda sus capas y datos. Árbol de capas por carpetas. Paquete de obra (.zip) para exportar, compartir e importar en otro móvil. |
| 1.7.0 | 25/10/2026 | Actuaciones en trazas (escolleras, badenes, cunetas…) por PK, margen y fotos. Listado y exportación a CSV y KMZ. |
| 1.6.0 | 25/10/2026 | Pendiente media y perfil longitudinal de una traza o tramo. Cotas del KML o del MDT05 del IGN. |
| 1.5.0 | 25/10/2026 | Marcas de PK cada 100 m según el zoom. PK del punto tocado. |
| 1.4.0 | 23/10/2026 | Cambio de nombre a OBRA-GIS. |
| 1.3.0 | 23/10/2026 | Catálogo de servicios públicos, kit de afecciones y consulta de afecciones en un punto. |
| 1.2.0 | 22/10/2026 | Fotos con GPS, gestor de capas con WMS y app nativa Android compilada en GitHub. |
| 1.1.0 | 22/10/2026 | Abrir KML/KMZ compartidos desde otras apps. |
| 1.0.0 | 22/10/2026 | Primera versión: visor KML/KMZ sobre ortofoto, navegación con Google Maps y anotaciones con fotos, vídeo y voz. |
