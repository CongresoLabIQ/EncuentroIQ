// tests/rubricas.test.js
// Valida la estructura de las rúbricas de Fase 2 embebidas en evaluator-dashboard.html:
//   - cada modalidad (cartel/ponencia) suma 100
//   - cada sección cuadra con la suma de sus sub-criterios (ya en escala ×10)
//   - 9 secciones por modalidad y ajustes esperados
// No ejecuta navegador: extrae el objeto LIVE_RUBRICAS del HTML.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function extraerRubricas() {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'evaluator-dashboard.html'), 'utf8');
  const marker = 'const LIVE_RUBRICAS = ';
  const start = html.indexOf(marker);
  if (start === -1) throw new Error('No se encontró LIVE_RUBRICAS en evaluator-dashboard.html');
  const objStart = html.indexOf('{', start);
  let depth = 0, i = objStart;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  const objText = html.slice(objStart, i);
  return vm.runInNewContext('(' + objText + ')');
}

function run(t) {
  const rub = extraerRubricas();

  ['cartel', 'ponencia'].forEach(mod => {
    const r = rub[mod];
    t.group('Rúbrica ' + mod);
    t.ok(!!r, 'existe la modalidad ' + mod);
    t.equal(r.secciones.length, 9, mod + ': 9 secciones');

    const total = r.secciones.reduce((s, sec) => s + sec.max, 0);
    t.equal(total, 100, mod + ': el total de secciones suma 100');

    r.secciones.forEach(sec => {
      const sumaItems = sec.items.reduce((s, it) => s + it[1], 0);
      t.equal(sumaItems, sec.max, mod + ' → "' + sec.nombre + '": sub-criterios suman el máximo de la sección');
    });

    // ids únicos
    const ids = r.secciones.map(s => s.id);
    t.equal(new Set(ids).size, ids.length, mod + ': ids de sección únicos');
  });

  t.group('Ponencia — ajuste solicitado');
  const eqPon = rub.ponencia.secciones.find(s => s.id === 'pon_equipo');
  t.equal(eqPon.max, 5, 'Trabajo en equipo vale 5 (0.5 ×10)');
  const transicion = eqPon.items.find(i => /transici/i.test(i[0]));
  t.equal(transicion[1], 2, 'La transición entre integrantes vale 2 (0.2 ×10)');

  t.group('Cartel — controles clave');
  t.equal(rub.cartel.secciones.find(s => s.id === 'cartel_defensa').max, 15, 'Defensa de preguntas vale 15');
  t.equal(rub.cartel.secciones.find(s => s.id === 'cartel_diseno').max, 20, 'Diseño de cartel vale 20');
  t.equal(rub.ponencia.secciones.find(s => s.id === 'pon_dominio').max, 30, 'Dominio (ponencia) vale 30');
}

module.exports = { name: 'Rúbricas Fase 2 (×10, total 100)', run };
