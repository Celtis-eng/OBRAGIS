# Pruebas automáticas de OBRA-GIS

Cada vez que se sube una versión a GitHub, la pestaña **Actions → Pruebas OBRA-GIS** abre la app en un navegador y comprueba unas 50 cosas: PK, números, mediciones, borradores (también si la app se cierra de golpe), tramificación de pendientes, tramo andando, «Repetir la última», paquete de obra, BC3 (comprobado con un lector independiente, `bc3check.js`), «Enviar a la oficina», toques repetidos, botones tapados, dictado y modo sencillo. Si algo falla, las capturas quedan en el resultado de Actions («capturas-de-fallos»).

- Verde ✔: todo correcto.
- Rojo ✖: algo se ha roto; dentro del registro, las líneas `FALLO` dicen qué.

En un ordenador: `python3 -m http.server 8765 &` y luego `node pruebas/pruebas.js` (requiere `npm install playwright`).
