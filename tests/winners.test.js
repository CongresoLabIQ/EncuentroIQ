// tests/winners.test.js
// Verifica la determinación de ganadores: oral top 3 general; cartel top 3 por facultad.

const { createSandbox, get } = require('./harness/sandbox');
const { seedSheets, toObjects } = require('./fixtures/seed');

function run(t) {
  const { sandbox, spreadsheet, notifications } = createSandbox(seedSheets());
  const res = get(sandbox, { action: 'getWinners' });

  t.group('Respuesta getWinners');
  t.equal(res.success, true, 'success');
  const oral = res.data.oral;
  const poster = res.data.poster;

  t.group('Ponencia oral — general');
  t.equal(oral.length, 3, '3 ponencias');
  const allOral = toObjects(spreadsheet.getSheetByName('works').getDataRange().getValues())
    .filter(w => w.status === 'accepted_oral' && Number(w.live_score) > 0)
    .sort((a, b) => Number(b.live_score) - Number(a.live_score));
  t.deepEqual(oral.map(w => w.id), allOral.slice(0, 3).map(w => w.id), 'top 3 general (todo el pool)');
  for (let i = 1; i < oral.length; i++) {
    t.ok(Number(oral[i - 1].live_score) >= Number(oral[i].live_score), 'orden descendente');
  }
  t.ok(oral.every(w => w.student_name), 'incluye student_name');

  t.group('Cartel — top 3 por facultad');
  t.equal(poster.length, 9, '9 carteles (3 por facultad)');
  const byKey = {};
  poster.forEach(w => { (byKey[w.facultad_key] = byKey[w.facultad_key] || []).push(w); });
  t.equal(Object.keys(byKey).length, 3, '3 facultades');
  ['FQ', 'FC', 'FZ'].forEach(k => t.equal((byKey[k] || []).length, 3, k + ' tiene 3 ganadores'));
  t.deepEqual(poster.map(w => w.facultad_key), ['FQ', 'FQ', 'FQ', 'FC', 'FC', 'FC', 'FZ', 'FZ', 'FZ'], 'orden FQ, FC, FZ');
  ['FQ', 'FC', 'FZ'].forEach(k => {
    const ranks = poster.filter(w => w.facultad_key === k).map(w => w.poster_rank);
    t.deepEqual(ranks, [0, 1, 2], k + ': ranks 0,1,2');
  });
  Object.keys(byKey).forEach(k => {
    const arr = byKey[k];
    for (let i = 1; i < arr.length; i++) {
      t.ok(Number(arr[i - 1].live_score) >= Number(arr[i].live_score), k + ': orden descendente dentro de la facultad');
    }
    t.ok(arr.every(w => w.facultad && w.facultad_key), k + ': facultad etiquetada');
  });

  t.group('Exclusión de trabajos sin puntaje');
  const scoredIds = poster.map(w => w.id).concat(oral.map(w => w.id));
  t.ok(scoredIds.every(id => !/no-score/.test(id)), 'no hay trabajos sin puntaje');
  const empty = createSandbox(seedSheets({ withScores: false }));
  const emptyRes = get(empty.sandbox, { action: 'getWinners' });
  t.equal(emptyRes.data.oral.length, 0, 'sin puntajes: oral vacío');
  t.equal(emptyRes.data.poster.length, 0, 'sin puntajes: cartel vacío');

  t.group('Silencio');
  t.equal(notifications.length + empty.notifications.length, 0, 'sin notificaciones');
}

module.exports = { name: 'Ganadores — oral general y cartel por facultad', run };
