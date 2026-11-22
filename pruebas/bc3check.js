// Lector de BC3 independiente de la app (para comprobar que lo que exporta OBRA-GIS lo leería Presto o Arquímedes).
// Comprueba: CRLF, unidades admitidas, ~V/~C/~D/~M, códigos únicos y sin «#» en partidas, y que la suma de las líneas
// de medición (unidades × longitud × anchura × altura) da el total de cada partida.
function leerBC3(buf) {
  const txt = new TextDecoder('windows-1252').decode(buf);
  const errores = [], C = {}, M = {};
  if (!/\r\n/.test(txt) || /[^\r]\n/.test(txt)) errores.push('los saltos de línea no son CRLF');
  if (!txt.startsWith('~V|')) errores.push('no empieza por ~V');
  for (const reg of txt.split('\r\n').filter(Boolean)) {
    const f = reg.split('|'), t = f[0];
    if (t === '~C') { const code = f[1]; if (C[code]) errores.push('código repetido ' + code); C[code] = { unit: f[2], precio: Number(f[4]), resumen: f[3] };
      if (!/#$/.test(code) && /#/.test(code)) errores.push('código de partida con #: ' + code);
      if (f[4] !== '' && !/^-?\d+(\.\d+)?$/.test(f[4])) errores.push(`precio mal escrito en ${code}: ${f[4]}`); }
    if (t === '~M') {
      const [padre, hijo] = f[1].split('\\'), total = Number(f[3]), p = f[4].split('\\');
      if (!/#$/.test(padre)) errores.push('~M con padre sin #: ' + f[1]);
      let suma = 0, n = 0;
      for (let i = 0; i + 5 < p.length; i += 6) {
        const dims = [p[i + 2], p[i + 3], p[i + 4], p[i + 5]];
        if (dims.some(x => x !== '' && !/^-?\d+(\.\d+)?$/.test(x))) errores.push(`dimensión mal escrita en ${hijo}: ${dims}`);
        const v = dims.filter(x => x !== '').map(Number); if (!v.length) { errores.push(`línea sin dimensiones en ${hijo}`); continue; }
        suma += v.reduce((s, x) => s * x, 1); n++;
      }
      M[hijo] = { total, suma, n, pos: f[2] };
      if (Math.abs(suma - total) > Math.max(0.011, total * 1e-4)) errores.push(`${hijo}: las líneas suman ${suma.toFixed(3)} y el total es ${total}`);
    }
  }
  const pos = Object.values(M).map(m => m.pos); if (new Set(pos).size !== pos.length) errores.push('posiciones ~M repetidas');
  for (const [code, c] of Object.entries(C)) if (!/#$/.test(code) && !['m', 'm2', 'm3', 't', 'ud', 'kg'].includes(c.unit)) errores.push(`unidad no admitida en ${code}: «${c.unit}»`);
  return { C, M, errores };
}
module.exports = { leerBC3 };
