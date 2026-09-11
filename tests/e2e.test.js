// tests/e2e.test.js
// Flujo completo en el sandbox: asignar Fase 2 -> evaluar en vivo -> calcular ganadores.
// Sin red, sin Google y sin notificaciones.

const { createSandbox, post, get } = require('./harness/sandbox');
const { seedSheets, toObjects } = require('./fixtures/seed');

function readSheet(spreadsheet, name) {
  return toObjects(spreadsheet.getSheetByName(name).getDataRange().getValues());
}

function run(t) {
  const { sandbox, spreadsheet, notifications } = createSandbox(seedSheets({ withScores: false }));

  // 1) Asignación de Fase 2 (carteles por rotación + orales una por facultad)
  const assign = post(sandbox, { action: 'assignLiveWorks' });
  t.group('E2E — asignación');
  t.equal(assign.success, true, 'assignLiveWorks responde success');
  t.equal(assign.resumen.carteles, 45, '45 carteles');
  t.equal(assign.resumen.orales, 18, '18 evaluaciones orales');
  t.equal(assign.resumen.sinEvaluador, 0, 'sin evaluador = 0');

  // 2) Todos los evaluadores entregan su evaluación en vivo
  const assigns = readSheet(spreadsheet, 'live_assignments');
  t.group('E2E — evaluación en vivo');
  let submitted = 0;
  assigns.forEach((a, i) => {
    const r = post(sandbox, {
      action: 'submitLiveEvaluation',
      work_id: a.work_id,
      evaluator_id: a.evaluator_id,
      assignment_id: a.id,
      total_score: 70 + (i % 30),
      comments: 'Comentario de prueba'
    });
    if (r.success) submitted++;
  });
  t.equal(submitted, assigns.length, 'todas las asignaciones se evalúan (' + assigns.length + ')');

  // 3) live_score y estado de las asignaciones
  const works = readSheet(spreadsheet, 'works');
  const accepted = works.filter(w => w.status === 'accepted_oral' || w.status === 'accepted_poster');
  t.group('E2E — puntajes en vivo');
  t.equal(accepted.length, 51, '51 trabajos aceptados');
  t.ok(accepted.every(w => Number(w.live_score) > 0), 'todos los aceptados tienen live_score');
  const liveAfter = readSheet(spreadsheet, 'live_assignments');
  t.ok(liveAfter.every(a => a.status === 'completed'), 'todas las asignaciones quedan completed');

  // 4) Ganadores derivados de los puntajes en vivo
  const win = get(sandbox, { action: 'getWinners' });
  t.group('E2E — ganadores');
  t.equal(win.data.oral.length, 3, 'top 3 ponencias');
  t.equal(win.data.poster.length, 9, 'top 3 carteles por facultad (9)');
  const keys = {};
  win.data.poster.forEach(w => { keys[w.facultad_key] = (keys[w.facultad_key] || 0) + 1; });
  t.deepEqual(keys, { FQ: 3, FC: 3, FZ: 3 }, '3 ganadores por facultad');
  for (let i = 1; i < win.data.oral.length; i++) {
    t.ok(Number(win.data.oral[i - 1].live_score) >= Number(win.data.oral[i].live_score), 'ponencias ordenadas desc');
  }

  // 5) Re-ejecutar la asignación no duplica ni rompe
  t.group('E2E — idempotencia');
  const again = post(sandbox, { action: 'assignLiveWorks' });
  t.equal(again.count, 0, 're-ejecutar no asigna de nuevo');

  // 6) Silencio total
  t.group('E2E — silencio');
  t.equal(notifications.length, 0, 'ningún correo/push/fetch en el flujo');
}

module.exports = { name: 'Flujo completo E2E (sandbox)', run };
