// tests/import-schedule.test.js
// Pruebas de: auditorio único (batchFinalize + assignSchedules) e importación de
// FES Zaragoza desde Google Sheets (CSV). Corre 100% en el sandbox en memoria.

const { createSandbox, post } = require('./harness/sandbox');
const { seedSheets, seedPendingSheets, toObjects } = require('./fixtures/seed');

function readSheet(spreadsheet, name) {
  return toObjects(spreadsheet.getSheetByName(name).getDataRange().getValues());
}

function clearSchedules(spreadsheet) {
  const sheet = spreadsheet.getSheetByName('works');
  const data = sheet.getDataRange().getValues();
  const h = data[0].map(x => String(x).trim().toLowerCase());
  const aIdx = h.indexOf('auditorio');
  const hIdx = h.indexOf('horario');
  for (let i = 1; i < data.length; i++) {
    if (aIdx > -1) sheet.getRange(i + 1, aIdx + 1).setValue('');
    if (hIdx > -1) sheet.getRange(i + 1, hIdx + 1).setValue('');
  }
}

function horaValida(v) {
  return /^\d{2}:\d{2}$/.test(String(v).replace(/^'/, ''));
}

function run(t) {
  const admin = 'admin-001';

  // ===================== assignSchedules: auditorio único =====================
  const base = createSandbox(seedSheets());
  clearSchedules(base.spreadsheet);

  t.group('assignSchedules — auditorio único');
  const res = post(base.sandbox, { action: 'assignSchedules', admin_user_id: admin });
  t.equal(res.success, true, 'success');
  t.equal(res.auditorio, 'Auditorio Principal', 'auditorio reportado');
  t.equal(res.orales, 6, '6 ponencias programadas');
  t.equal(res.carteles, 45, '45 carteles marcados');

  const works = readSheet(base.spreadsheet, 'works');
  const orales = works.filter(w => w.status === 'accepted_oral');
  const carteles = works.filter(w => w.status === 'accepted_poster');

  t.ok(orales.every(w => String(w.auditorio).trim() === 'Auditorio Principal'), 'todas las ponencias en Auditorio Principal');
  t.ok(orales.every(w => horaValida(w.horario)), 'todas las ponencias con hora HH:MM');
  const horas = orales.map(w => String(w.horario).replace(/^'/, '')).sort();
  t.equal(new Set(horas).size, 6, '6 horarios únicos (sin empalmes)');
  t.equal(horas[0], '10:00', 'primera ponencia a las 10:00');
  t.equal(horas[5], '11:40', 'sexta ponencia a las 11:40 (bloques de 20 min)');
  t.ok(carteles.every(w => String(w.horario) === 'Sesión Carteles'), 'carteles en Sesión Carteles');
  t.ok(works.every(w => String(w.auditorio).indexOf('UMIEZ') === -1), 'ningún UMIEZ');

  t.group('assignSchedules — respeta horarios ya asignados');
  const keep = createSandbox(seedSheets());
  clearSchedules(keep.spreadsheet);
  const wSheet = keep.spreadsheet.getSheetByName('works');
  const wData = wSheet.getDataRange().getValues();
  const wh = wData[0].map(x => String(x).trim().toLowerCase());
  const wA = wh.indexOf('auditorio'), wH = wh.indexOf('horario');
  let firstOralRow = -1;
  for (let i = 1; i < wData.length; i++) {
    if (String(wData[i][wh.indexOf('status')]) === 'accepted_oral') { firstOralRow = i + 1; break; }
  }
  wSheet.getRange(firstOralRow, wA + 1).setValue('Auditorio Principal');
  wSheet.getRange(firstOralRow, wH + 1).setValue("'10:00");
  const keepRes = post(keep.sandbox, { action: 'assignSchedules', admin_user_id: admin });
  const keepOrals = readSheet(keep.spreadsheet, 'works').filter(w => w.status === 'accepted_oral');
  const keepHoras = keepOrals.map(w => String(w.horario).replace(/^'/, ''));
  t.equal(keepRes.success, true, 'success con horario previo');
  t.equal(keepHoras.filter(h => h === '10:00').length, 1, 'conserva el 10:00 existente');
  t.equal(new Set(keepHoras).size, 6, 'sigue sin empalmes');

  t.group('assignSchedules — requiere admin');
  const noAdmin = post(base.sandbox, { action: 'assignSchedules', admin_user_id: 'no-admin' });
  t.equal(noAdmin.success, false, 'rechaza sin admin');

  // ===================== batchFinalize: auditorio único =====================
  t.group('batchFinalize — auditorio único');
  const sim = createSandbox(seedPendingSheets({ worksPerFaculty: 20, counts: { FQ: 5, FC: 5, FZ: 5 }, includeTestAccounts: false }));
  post(sim.sandbox, { action: 'assignAllPending' });
  readSheet(sim.spreadsheet, 'assignments').forEach((a, i) => {
    post(sim.sandbox, {
      action: 'submitEvaluation',
      work_id: a.work_id,
      evaluator_id: a.evaluator_id,
      assignment_id: a.id,
      total_score: 50 + ((i * 17) % 50),
      comentarios: 'eval ' + i
    });
  });
  const dict = post(sim.sandbox, { action: 'batchFinalize' });
  t.equal(dict.success, true, 'dictamen ok');
  const simWorks = readSheet(sim.spreadsheet, 'works');
  const simOrals = simWorks.filter(w => w.status === 'accepted_oral');
  t.equal(simOrals.length, 6, '6 ponencias');
  t.ok(simOrals.every(w => String(w.auditorio).trim() === 'Auditorio Principal'), 'todas al Auditorio Principal');
  const simHoras = simOrals.map(w => String(w.horario).replace(/^'/, '')).sort();
  t.equal(new Set(simHoras).size, 6, 'horarios únicos');
  t.equal(simHoras[0], '10:00', 'inicia 10:00');
  t.ok(simWorks.every(w => String(w.auditorio).indexOf('UMIEZ') === -1), 'ningún UMIEZ tras dictamen');

  // ===================== importFesZaragoza =====================
  t.group('importFesZaragoza — importa trabajos y alumnos');
  const imp = createSandbox(seedSheets());
  const usersCsv = [
    'id,email,password,name,user_type',
    'SRC-U1,ana@fz.test,hashana,Ana FZ,student',
    'SRC-U2,luis@fz.test,hashluis,Luis FZ,student'
  ].join('\n');
  const worksCsv = [
    'id,short_id,student_id,title,abstract,semester,facultad,profesor_cargo,team_members,modality,file_url,status',
    'W1,A01,SRC-U1,"Proyecto, con coma",Resumen 1,5,FES Zaragoza,Dra X,Ana,Oral,https://x/1.pdf,accepted_oral',
    'W2,A02,SRC-U2,Proyecto Luis,Resumen 2,7,FES Zaragoza,Dra Y,Luis,Cartel,https://x/2.pdf,accepted_poster'
  ].join('\n');
  imp.sandbox.UrlFetchApp = {
    fetch: (url) => ({
      getResponseCode: () => 200,
      getContentText: () => (String(url).indexOf('users') > -1 ? usersCsv : worksCsv)
    })
  };
  const impRes = post(imp.sandbox, {
    action: 'importFesZaragoza',
    admin_user_id: admin,
    works_csv_url: 'https://docs.google.com/spreadsheets/d/works-sheet/edit#gid=0',
    users_csv_url: 'https://docs.google.com/spreadsheets/d/users-sheet/edit#gid=1'
  });
  t.equal(impRes.success, true, 'success');
  t.equal(impRes.imported, 2, '2 trabajos importados');
  t.equal(impRes.alumnosCreados, 2, '2 alumnos creados');

  const impUsers = readSheet(imp.spreadsheet, 'users');
  const ana = impUsers.find(u => u.email === 'ana@fz.test');
  t.ok(!!ana, 'alumna Ana creada');
  t.equal(ana.user_type, 'student', 'rol student');
  t.equal(ana.facultad, 'FES Zaragoza', 'facultad FES Zaragoza');
  t.equal(String(ana.password).replace(/^'/, ''), 'hashana', 'password de origen conservado');

  const impWorks = readSheet(imp.spreadsheet, 'works');
  const w1 = impWorks.find(w => w.title === 'Proyecto, con coma');
  const w2 = impWorks.find(w => w.title === 'Proyecto Luis');
  t.ok(!!w1 && !!w2, 'ambos trabajos creados (CSV con comas entre comillas)');
  t.equal(w1.status, 'accepted_oral', 'respeta accepted_oral');
  t.equal(w2.status, 'accepted_poster', 'respeta accepted_poster');
  t.equal(w1.facultad, 'FES Zaragoza', 'facultad del trabajo');
  t.ok(/^FZ\d+$/.test(String(w1.short_id)), 'short_id con prefijo FZ');
  t.equal(w1.student_id, ana.id, 'trabajo enlazado al alumno creado');

  t.group('importFesZaragoza — idempotente');
  const impRes2 = post(imp.sandbox, {
    action: 'importFesZaragoza',
    admin_user_id: admin,
    works_csv_url: 'https://docs.google.com/spreadsheets/d/works-sheet/edit#gid=0',
    users_csv_url: 'https://docs.google.com/spreadsheets/d/users-sheet/edit#gid=1'
  });
  t.equal(impRes2.success, true, 'segunda corrida ok');
  t.equal(impRes2.imported, 0, 'no reimporta');
  t.equal(impRes2.omitidos, 2, 'omite los 2 ya existentes');

  t.group('importFesZaragoza — requiere admin');
  const impNoAdmin = post(imp.sandbox, { action: 'importFesZaragoza', admin_user_id: 'no-admin', works_csv_url: 'x' });
  t.equal(impNoAdmin.success, false, 'rechaza sin admin');
}

module.exports = { name: 'Horarios (auditorio único) e importación FES Zaragoza', run };
