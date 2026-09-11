// tests/simulacion.js
// Simulación del ciclo COMPLETO del evento con datos ficticios, en el sandbox:
//   Fase 1 (asignar 60 trabajos) -> evaluaciones -> dictamen (top 17 por facultad)
//   -> Fase 2 (carteles por rotación + orales por facultad) -> evaluaciones en vivo
//   -> ganadores.
// No toca Google ni envía notificaciones. Uso: node tests/simulacion.js

const { createSandbox, post, get } = require('./harness/sandbox');
const { seedPendingSheets, toObjects } = require('./fixtures/seed');

const FAC_TOTAL = 20;              // trabajos por facultad
const MAX_POR_FACULTAD = 17;       // 2 oral + 15 cartel
const ORALES_POR_FACULTAD = 2;

function readSheet(spreadsheet, name) {
  return toObjects(spreadsheet.getSheetByName(name).getDataRange().getValues());
}

function facultadKey(fac) {
  const s = String(fac || '').trim().toLowerCase();
  if (s.includes('zaragoza')) return 'FZ';
  if (s.includes('cuautitlan') || s.includes('cuautitlán')) return 'FC';
  if (s.includes('quimica') || s.includes('química')) return 'FQ';
  return null;
}

let failures = 0;
function check(cond, msg) {
  console.log((cond ? '  [OK]    ' : '  [FALLO] ') + msg);
  if (!cond) failures++;
}

function banner(title) {
  console.log('\n' + '='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}

banner('SIMULACIÓN DEL WORKFLOW — 60 trabajos (20 por facultad), 15 evaluadores');
const { sandbox, spreadsheet, notifications } = createSandbox(
  seedPendingSheets({ worksPerFaculty: FAC_TOTAL, counts: { FQ: 5, FC: 5, FZ: 5 }, includeTestAccounts: false })
);

// ---------------------------------------------------------------- Fase 1
banner('FASE 1 — Asignación automática (3 evaluadores por trabajo, sin conflicto de facultad)');
const a1 = post(sandbox, { action: 'assignAllPending' });
const assignments = readSheet(spreadsheet, 'assignments');
console.log('  Trabajos asignados:', a1.count);
console.log('  Asignaciones creadas:', assignments.length);
check(a1.success === true && a1.count === 60, 'se asignan los 60 trabajos');
check(assignments.length === 180, 'cada trabajo recibe 3 evaluadores (180 asignaciones)');

// Evaluaciones de Fase 1
banner('FASE 1 — Evaluaciones (rúbrica 0–100)');
let evalSent = 0;
const worksP1 = readSheet(spreadsheet, 'works');
const worksByIdP1 = {};
worksP1.forEach(w => { worksByIdP1[w.id] = w; });
assignments.forEach((a, i) => {
  const score = 50 + ((i * 17) % 50);
  const r = post(sandbox, {
    action: 'submitEvaluation',
    work_id: a.work_id,
    evaluator_id: a.evaluator_id,
    assignment_id: a.id,
    total_score: score,
    comentarios: 'Evaluación simulada ' + (i + 1)
  });
  if (r.success) evalSent++;
});
console.log('  Evaluaciones enviadas:', evalSent);
check(evalSent === 180, 'las 180 asignaciones se evalúan');

// ---------------------------------------------------------------- Dictamen
banner('DICTAMEN — top 17 por facultad (2 oral + 15 cartel, resto rechazado)');
const dict = post(sandbox, { action: 'batchFinalize' });
console.log('  Trabajos dictaminados:', dict.count);
const worksP2 = readSheet(spreadsheet, 'works');
const statusByFac = {};
worksP2.forEach(w => {
  const k = facultadKey(w.facultad);
  if (!statusByFac[k]) statusByFac[k] = { accepted_oral: 0, accepted_poster: 0, rejected: 0 };
  if (statusByFac[k][w.status] !== undefined) statusByFac[k][w.status]++;
});
Object.keys(statusByFac).forEach(k => {
  const s = statusByFac[k];
  console.log('  ' + k + ': ' + s.accepted_oral + ' oral, ' + s.accepted_poster + ' cartel, ' + s.rejected + ' rechazado');
});
check(Object.keys(statusByFac).every(k =>
  statusByFac[k].accepted_oral === ORALES_POR_FACULTAD &&
  statusByFac[k].accepted_poster === MAX_POR_FACULTAD - ORALES_POR_FACULTAD), 'cada facultad queda con 2 oral + 15 cartel');

// ---------------------------------------------------------------- Fase 2
banner('FASE 2 — Carteles por rotación (FQ→FC→FZ→FQ) y orales 1 por facultad');
const a2 = post(sandbox, { action: 'assignLiveWorks' });
console.log('  Resumen:', JSON.stringify(a2.resumen));
check(a2.resumen.carteles === 45, '45 carteles asignados (1 evaluador cada uno)');
check(a2.resumen.orales === 18, '18 evaluaciones orales (3 por ponencia)');
check(a2.resumen.sinEvaluador === 0, 'sin trabajos sin evaluador');

const liveAssigns = readSheet(spreadsheet, 'live_assignments');
const worksP3 = readSheet(spreadsheet, 'works');
const users = readSheet(spreadsheet, 'users');
const worksById = {};
worksP3.forEach(w => { worksById[w.id] = w; });
const userById = {};
users.forEach(u => { userById[u.id] = u; });

let conflictos = 0;
let rotationOk = true;
const evFac = { FC: 'FQ', FZ: 'FC', FQ: 'FZ' };
liveAssigns
  .filter(a => worksById[a.work_id] && worksById[a.work_id].status === 'accepted_poster')
  .forEach(a => {
    const wf = facultadKey(worksById[a.work_id].facultad);
    const ef = facultadKey(userById[a.evaluator_id].facultad);
    if (ef === wf) conflictos++;
    if (ef !== evFac[wf]) rotationOk = false;
  });
check(conflictos === 0, 'ningún cartel evaluado por su propia facultad');
check(rotationOk, 'rotación correcta: FQ evalúa FC, FC evalúa FZ, FZ evalúa FQ');

const oralEvals = {};
liveAssigns
  .filter(a => worksById[a.work_id] && worksById[a.work_id].status === 'accepted_oral')
  .forEach(a => { oralEvals[a.work_id] = (oralEvals[a.work_id] || 0) + 1; });
check(Object.keys(oralEvals).length === 6 && Object.values(oralEvals).every(n => n === 3),
  'las 6 ponencias tienen 3 evaluadores');

// Evaluaciones en vivo
banner('FASE 2 — Evaluaciones en vivo');
let liveSent = 0;
liveAssigns.forEach((a, i) => {
  const r = post(sandbox, {
    action: 'submitLiveEvaluation',
    work_id: a.work_id,
    evaluator_id: a.evaluator_id,
    assignment_id: a.id,
    total_score: 60 + ((i * 11) % 40),
    comments: 'Presentación simulada'
  });
  if (r.success) liveSent++;
});
console.log('  Evaluaciones en vivo enviadas:', liveSent);
check(liveSent === 63, 'las 63 asignaciones de Fase 2 se evalúan');

// ---------------------------------------------------------------- Ganadores
banner('GANADORES — oral top 3 general, cartel top 3 por facultad');
const win = get(sandbox, { action: 'getWinners' });
console.log('  Ponencia Oral (general):');
win.data.oral.forEach((w, i) => console.log('    ' + (i + 1) + 'º  ' + w.short_id + '  ' + w.live_score + ' pts  — ' + w.title));
const byFac = {};
win.data.poster.forEach(w => { (byFac[w.facultad_key] = byFac[w.facultad_key] || []).push(w); });
Object.keys(byFac).forEach(k => {
  console.log('  Cartel ' + k + ':');
  byFac[k].forEach((w, i) => console.log('    ' + (i + 1) + 'º  ' + w.short_id + '  ' + w.live_score + ' pts  — ' + w.title));
});
check(win.data.oral.length === 3, '3 ganadores de ponencia (general)');
check(win.data.poster.length === 9, '9 ganadores de cartel (3 por facultad)');
check(['FQ', 'FC', 'FZ'].every(k => (byFac[k] || []).length === 3), 'una terna de carteles por facultad');

// ---------------------------------------------------------------- Silencio
banner('VERIFICACIÓN FINAL');
check(notifications.length === 0, 'cero notificaciones (correo/push/fetch) en toda la simulación');
check(readSheet(spreadsheet, 'live_assignments').every(a => a.status === 'completed'), 'todas las asignaciones en vivo quedan completadas');

console.log('\n' + (failures === 0 ? '✅ SIMULACIÓN CORRECTA' : '❌ ' + failures + ' VERIFICACIONES FALLIDAS'));
process.exit(failures === 0 ? 0 : 1);
