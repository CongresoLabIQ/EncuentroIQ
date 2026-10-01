// tests/fase2-simulacro.test.js
// Valida el simulacro de Fase 2 por etapas (pasos 1 a 6) en el sandbox:
// usuarios demo -> trabajos seleccionados (13 carteles + 2 ponencias por facultad)
// -> asignación (rotación de carteles, 1 por facultad en ponencias) -> evaluación
// manual + automática -> ganadores -> reinicio y limpieza. Sin red ni notificaciones.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createSandbox, post } = require('./harness/sandbox');
const { HEADERS } = require('./fixtures/seed');

const PRUEBAS_GS = path.resolve(__dirname, 'Code.pruebas.gs');
const seedSource = fs.readFileSync(PRUEBAS_GS, 'utf8');

const ROTACION = { FQ: 'FZ', FC: 'FQ', FZ: 'FC' };
const FAC_NAME = { FQ: 'Facultad de Química', FC: 'FES Cuautitlán', FZ: 'FES Zaragoza' };

function cleanSheets() {
  return {
    users: [HEADERS.users],
    works: [HEADERS.works],
    assignments: [HEADERS.assignments],
    evaluations: [HEADERS.evaluations],
    live_assignments: [HEADERS.live_assignments],
    live_evaluations: [HEADERS.live_evaluations],
    live_evaluator_status: [HEADERS.live_evaluator_status],
    help_requests: [['id', 'evaluator_id', 'status']],
    reassign_log: [['id', 'work_id']],
    push_subscriptions: [HEADERS.push_subscriptions],
    certificates: [['id', 'user_id']],
    reset_tokens: [['email', 'token']],
    config: [HEADERS.config]
  };
}

function facKey(name) {
  const s = String(name || '').toLowerCase();
  if (s.includes('zaragoza')) return 'FZ';
  if (s.includes('cuautitlan') || s.includes('cuautitlán')) return 'FC';
  if (s.includes('quimica') || s.includes('química')) return 'FQ';
  return null;
}

function toObjects(sheet) {
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  return rows.slice(1).map(r => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });
}

function run(t) {
  const env = createSandbox(cleanSheets());
  const { sandbox, spreadsheet, notifications } = env;
  vm.runInContext(seedSource, sandbox, { filename: 'Code.pruebas.gs' });

  t.group('Paso 1 · usuarios demo');
  const paso1 = sandbox.PRUEBA_f2_paso1_usuarios();
  t.equal(paso1.nuevos, 19, 'crea 19 cuentas demo');
  t.equal(paso1.total, 19, 'reporta 19 cuentas demo en total');
  const users = toObjects(spreadsheet.getSheetByName('users'));
  t.equal(users.filter(u => u.user_type === 'evaluator').length, 15, 'crea 5 evaluadores por facultad');
  t.equal(users.filter(u => u.user_type === 'student').length, 3, 'crea un alumno por facultad');
  t.equal(sandbox.PRUEBA_f2_paso1_usuarios().nuevos, 0, 'no duplica usuarios si se vuelve a ejecutar');

  t.group('Paso 2 · trabajos seleccionados');
  const paso2 = sandbox.PRUEBA_f2_paso2_trabajos();
  t.equal(paso2.total, 45, 'crea 45 trabajos (15 por facultad)');
  t.equal(paso2.carteles, 39, 'crea 13 carteles por facultad');
  t.equal(paso2.ponencias, 6, 'crea 2 ponencias por facultad');
  const works = toObjects(spreadsheet.getSheetByName('works'));
  ['FQ', 'FC', 'FZ'].forEach(key => {
    const deFac = works.filter(w => w.facultad === FAC_NAME[key]);
    t.equal(deFac.filter(w => w.status === 'accepted_poster').length, 13, key + ' tiene 13 carteles');
    t.equal(deFac.filter(w => w.status === 'accepted_oral').length, 2, key + ' tiene 2 ponencias');
  });
  t.equal(sandbox.PRUEBA_f2_paso2_trabajos().nuevos, 0, 'no duplica trabajos si se vuelve a ejecutar');

  t.group('Paso 3 · asignación Fase 2');
  const paso3 = sandbox.PRUEBA_f2_paso3_asignar();
  t.equal(paso3.carteles, 39, 'asigna 1 evaluador por cartel');
  t.equal(paso3.orales, 18, 'asigna 3 evaluadores por ponencia');
  t.equal(paso3.sinEvaluador, 0, 'ningún trabajo queda sin evaluador');
  const assigns = toObjects(spreadsheet.getSheetByName('live_assignments'));
  t.equal(assigns.length, 57, 'se crean 57 asignaciones de Fase 2');
  const usersById = {};
  users.forEach(u => { usersById[String(u.id)] = u; });
  const worksById = {};
  works.forEach(w => { worksById[String(w.id)] = w; });

  let conflictoCartel = 0;
  let rotacionMal = 0;
  assigns
    .filter(a => worksById[String(a.work_id)].status === 'accepted_poster')
    .forEach(a => {
      const wf = facKey(worksById[String(a.work_id)].facultad);
      const ef = facKey(usersById[String(a.evaluator_id)].facultad);
      if (ef === wf) conflictoCartel++;
      if (ef !== ROTACION[wf]) rotacionMal++;
    });
  t.equal(conflictoCartel, 0, 'ningún cartel es evaluado por su propia facultad');
  t.equal(rotacionMal, 0, 'la rotación de carteles (FQ→FC→FZ→FQ) se respeta');

  const oralesPorTrabajo = {};
  assigns
    .filter(a => worksById[String(a.work_id)].status === 'accepted_oral')
    .forEach(a => { (oralesPorTrabajo[String(a.work_id)] = oralesPorTrabajo[String(a.work_id)] || []).push(a); });
  t.equal(Object.keys(oralesPorTrabajo).length, 6, 'las 6 ponencias reciben evaluación');
  const ternasOk = Object.values(oralesPorTrabajo).every(lista => {
    const facs = lista.map(a => facKey(usersById[String(a.evaluator_id)].facultad)).sort().join(',');
    return lista.length === 3 && facs === 'FC,FQ,FZ';
  });
  t.ok(ternasOk, 'cada ponencia tiene un evaluador de cada facultad');
  t.equal(sandbox.PRUEBA_f2_paso3_asignar().creadas, 0, 'volver a asignar no duplica asignaciones');

  t.group('Pasos 4 y 5 · evaluación manual y automática');
  t.equal(sandbox.PRUEBA_f2_paso4_pendientes().pendientes, 57, 'las 57 asignaciones están pendientes al inicio');
  t.equal(notifications.length, 0, 'preparar el simulacro no envía correos ni llamadas de red');

  const dos = assigns.slice(0, 2);
  dos.forEach((a, i) => {
    const r = post(sandbox, {
      action: 'submitLiveEvaluation',
      work_id: a.work_id,
      evaluator_id: a.evaluator_id,
      assignment_id: a.id,
      total_score: 90 - i,
      rubrica: JSON.stringify({ demo: 90 - i }),
      comments: 'Evaluación manual de prueba'
    });
    t.ok(r.success, 'la evaluación manual ' + (i + 1) + ' se registra');
  });
  t.equal(sandbox.PRUEBA_f2_paso4_pendientes().pendientes, 55, 'tras evaluar a mano quedan 55 pendientes');

  const paso5 = sandbox.PRUEBA_f2_paso5_autoevaluar();
  t.equal(paso5.evaluadas, 55, 'la función evalúa las 55 asignaciones restantes');
  t.equal(sandbox.PRUEBA_f2_paso4_pendientes().pendientes, 0, 'ya no quedan asignaciones pendientes');
  t.equal(toObjects(spreadsheet.getSheetByName('live_evaluations')).length, 57, 'hay una evaluación por asignación');
  t.ok(toObjects(spreadsheet.getSheetByName('live_assignments')).every(a => a.status === 'completed'),
    'todas las asignaciones quedan completadas');
  t.ok(toObjects(spreadsheet.getSheetByName('works')).every(w => Number(w.live_score) > 0),
    'todos los trabajos de Fase 2 tienen puntaje en vivo');

  t.group('Paso 6 · ganadores');
  const paso6 = sandbox.PRUEBA_f2_paso6_ganadores();
  t.equal(paso6.oral, 3, 'hay 3 ganadores de ponencia (general)');
  t.equal(paso6.poster, 9, 'hay 9 ganadores de cartel (3 por facultad)');

  t.group('Reinicio y limpieza');
  const reset = sandbox.PRUEBA_f2_reiniciarEvaluaciones();
  t.equal(reset.evaluacionesBorradas, 57, 'el reinicio borra las evaluaciones demo');
  t.equal(sandbox.PRUEBA_f2_paso4_pendientes().pendientes, 57, 'tras reiniciar vuelven a estar pendientes');
  sandbox.PRUEBA_limpiarDatos();
  ['users', 'works', 'live_assignments', 'live_evaluations'].forEach(name => {
    t.equal(spreadsheet.getSheetByName(name).getLastRow() - 1, 0, 'la limpieza elimina filas demo de ' + name);
  });
  t.equal(notifications.length, 0, 'todo el simulacro corre sin correos ni llamadas de red');
}

module.exports = { name: 'Simulacro de Fase 2 por etapas', run };
