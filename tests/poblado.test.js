const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createSandbox, post, get } = require('./harness/sandbox');
const { HEADERS } = require('./fixtures/seed');

const PRUEBAS_GS = path.resolve(__dirname, 'Code.pruebas.gs');
const CODE_GS = path.resolve(__dirname, '..', 'Code.gs');
const seedSource = fs.readFileSync(PRUEBAS_GS, 'utf8').replace(
  "const PRUEBA_CERT_FOLDER_ID = 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_DE_PRUEBA';",
  "const PRUEBA_CERT_FOLDER_ID = 'TEST_CERT_FOLDER_ID';"
);
const testBackendSource = fs.readFileSync(CODE_GS, 'utf8')
  .replace('1L9IHjQpTBVgb5TC0cD-OB2pkrRRNKm_o', 'TEST_DRIVE_FOLDER_ID')
  .replace('1DNdoBL30o2hG77INqP4shV9Dtv-77yWyaIhnnKPT6j0', 'TEST_SLIDES_TEMPLATE_ID')
  .replace('1A6ZuVHobxHtu3S3incdUk_HAbTMrrHGc', 'TEST_CERT_FOLDER_ID');

function cleanSheets(extraUsers) {
  const userRows = (extraUsers || []).map(user => HEADERS.users.map(header => user[header] || ''));
  return {
    users: [HEADERS.users].concat(userRows),
    works: [HEADERS.works],
    assignments: [HEADERS.assignments],
    evaluations: [HEADERS.evaluations],
    live_assignments: [HEADERS.live_assignments],
    live_evaluations: [HEADERS.live_evaluations],
    live_evaluator_status: [HEADERS.live_evaluator_status],
    help_requests: [['id', 'evaluator_id', 'status']],
    reassign_log: [['id', 'work_id']],
    push_subscriptions: [HEADERS.push_subscriptions],
    certificates: [['id', 'user_id']]
  };
}

function addPruebasScript(sandbox) {
  vm.runInContext(seedSource, sandbox, { filename: 'Code.pruebas.gs' });
}

function createTestSandbox(sheetMap, backendSource) {
  const env = createSandbox(sheetMap, backendSource || testBackendSource);
  const trashedFiles = [];
  env.sandbox.DriveApp = {
    getFolderById: () => ({ getFiles: () => ({ hasNext: () => false }) }),
    getFileById: id => ({
      getParents: () => {
        let consumed = false;
        return {
          hasNext: () => !consumed,
          next: () => { consumed = true; return { getId: () => 'TEST_DRIVE_FOLDER_ID' }; }
        };
      },
      setTrashed: () => trashedFiles.push(id)
    })
  };
  env.trashedFiles = trashedFiles;
  return env;
}

function run(t) {
  t.group('Generación en el clon');
  const env = createTestSandbox(cleanSheets());
  const { sandbox, spreadsheet, notifications } = env;
  addPruebasScript(sandbox);

  const summary = sandbox.PRUEBA_poblarDatos();
  t.equal(summary.trabajos, 81, 'se siembran 81 trabajos ficticios');
  t.equal(summary.asignacionesFase1, 207, 'se siembran las asignaciones de Fase 1');
  t.equal(summary.evaluacionesFase1, 192, 'se siembran evaluaciones ficticias de Fase 1');
  t.equal(summary.asignacionesFase2, 63, 'se siembran las asignaciones de Fase 2');
  t.equal(summary.evaluacionesFase2, 48, 'se siembran evaluaciones ficticias completadas de Fase 2');
  t.equal(spreadsheet.getSheetByName('users').getLastRow() - 1, 19, 'se crean cuentas demo para alumno, evaluador y administrador');

  const works = get(sandbox, { action: 'getWorks' }).data;
  t.equal(works.length, 81, 'getWorks devuelve el conjunto ficticio completo');
  t.equal(works.filter(work => work.status === 'pending').length, 12, 'hay trabajos pendientes para el flujo administrativo');
  t.equal(works.filter(work => work.status === 'under_review').length, 15, 'hay trabajos parcialmente evaluados');
  t.equal(works.filter(work => work.status === 'accepted_oral').length, 6, 'hay ponencias aceptadas');
  t.equal(works.filter(work => work.status === 'accepted_poster').length, 45, 'hay carteles aceptados');
  t.equal(works.filter(work => work.status === 'rejected').length, 3, 'hay trabajos no seleccionados');
  t.equal(works.filter(work => work.status === 'accepted_poster' && Number(work.live_score) > 0).length, 30, 'los carteles pendientes de Fase 2 aún no muestran puntaje');

  const phase1Assignments = get(sandbox, { action: 'getAssignments' }).data;
  t.ok(phase1Assignments.every(assignment => assignment.user_profiles.facultad !== assignment.works.facultad), 'las evaluaciones ficticias de Fase 1 respetan el conflicto de facultad');
  const phase2Assignments = get(sandbox, { action: 'getLiveAssignments' }).data;
  t.equal(phase2Assignments.filter(assignment => assignment.status !== 'completed').length, 15, 'hay una asignación pendiente para cada evaluador demo de Fase 2');

  const winners = get(sandbox, { action: 'getWinners' }).data;
  t.equal(winners.oral.length, 3, 'el dashboard recibe top 3 oral de prueba');
  t.equal(winners.poster.length, 9, 'el dashboard recibe top 3 carteles por facultad');

  const login = post(sandbox, {
    action: 'login',
    email: 'admin@prueba.encuentroiq.test',
    password: 'Simulacro2026!'
  });
  t.ok(login.success && login.data.profile.user_type === 'admin', 'la cuenta demo admin puede iniciar sesión');
  t.equal(notifications.length, 0, 'sembrar datos no envía correos ni llamadas de red');

  sandbox.PRUEBA_poblarDatos();
  t.equal(spreadsheet.getSheetByName('works').getLastRow() - 1, 81, 'volver a sembrar no duplica los trabajos');
  t.equal(spreadsheet.getSheetByName('evaluations').getLastRow() - 1, 192, 'volver a sembrar no duplica las evaluaciones');

  const worksSheet = spreadsheet.getSheetByName('works');
  const fakeSubmission = {
    id: 'uuid-from-demo-submit', short_id: 'FQ99', student_id: 'PRUEBA-DATA-ST-FQ',
    title: 'Envío demo posterior', abstract: 'Prueba de limpieza', semester: '5',
    facultad: 'Facultad de Química', profesor_cargo: 'Asesora demo', team_members: 'Equipo demo',
    modality: 'Pendiente', file_url: 'https://drive.google.com/demo', file_id: 'demo-upload-file',
    status: 'pending', submitted_at: new Date()
  };
  worksSheet.appendRow(HEADERS.works.map(header => fakeSubmission[header] || ''));
  spreadsheet.getSheetByName('assignments').appendRow(HEADERS.assignments.map(header => ({
    id: 'uuid-from-demo-assignment', work_id: fakeSubmission.id, evaluator_id: 'PRUEBA-DATA-EV-FQ-01', status: 'assigned'
  })[header] || ''));
  sandbox.PRUEBA_limpiarDatos();
  ['users', 'works', 'assignments', 'evaluations', 'live_assignments', 'live_evaluations'].forEach(name => {
    const sheet = spreadsheet.getSheetByName(name);
    t.equal(sheet.getLastRow() - 1, 0, 'la limpieza elimina filas demo de ' + name);
  });
  t.ok(env.trashedFiles.includes('demo-upload-file'), 'la limpieza manda a papelera los PDFs subidos al Drive de prueba');

  t.group('Protección ante datos existentes');
  const unsafe = createTestSandbox(cleanSheets([
    { id: 'alumno-real', name: 'Registro ajeno', email: 'real@example.org', user_type: 'student', facultad: 'Facultad de Química' }
  ]));
  addPruebasScript(unsafe.sandbox);
  let refused = false;
  try { unsafe.sandbox.PRUEBA_poblarDatos(); } catch (error) { refused = /usuario\(s\) ajeno\(s\)/.test(error.message); }
  t.ok(refused, 'se rehúsa a poblar una hoja que conserva cuentas fuera del simulacro');
  t.equal(unsafe.spreadsheet.getSheetByName('works').getLastRow() - 1, 0, 'el rechazo no deja trabajos parciales');

  const production = createSandbox(cleanSheets());
  production.sandbox.DriveApp = { getFolderById: () => ({}), getFileById: () => ({}) };
  addPruebasScript(production.sandbox);
  t.equal(production.sandbox.PRUEBA_poblarDatos().trabajos, 81, 'poblar la hoja no se bloquea por los IDs de Drive de producción');
  let productionRefused = false;
  try { production.sandbox.PRUEBA_validarDrive(); } catch (error) { productionRefused = /apuntan a Drive de producción/.test(error.message); }
  t.ok(productionRefused, 'PRUEBA_validarDrive() rechaza los IDs de Drive de producción antes de subir archivos');

  const backendWithoutDriveIds = testBackendSource
    .replace('const DRIVE_FOLDER_ID', 'const BACKUP_DRIVE_FOLDER_ID')
    .replace('const TEMPLATE_ID', 'const BACKUP_TEMPLATE_ID')
    .replace('const CERTIFICATES_FOLDER_ID', 'const BACKUP_CERTIFICATES_FOLDER_ID');
  const missingIds = createTestSandbox(cleanSheets(), backendWithoutDriveIds);
  addPruebasScript(missingIds.sandbox);
  let seededWithoutDriveIds = false;
  try { seededWithoutDriveIds = missingIds.sandbox.PRUEBA_poblarDatos().trabajos === 81; } catch (error) {}
  t.ok(seededWithoutDriveIds, 'el sembrado en Sheets funciona aunque el clon todavía no configure Drive');
  t.equal(missingIds.spreadsheet.getSheetByName('works').getLastRow() - 1, 81, 'la falta de constantes de Drive ya no impide generar los trabajos demo');
  let missingDriveError = false;
  try { missingIds.sandbox.PRUEBA_validarDrive(); } catch (error) { missingDriveError = /Falta configurar estas constantes/.test(error.message); }
  t.ok(missingDriveError, 'PRUEBA_validarDrive() explica qué constantes faltan cuando se van a probar archivos');
}

module.exports = { name: 'Datos ficticios para simulacro en clon', run };
