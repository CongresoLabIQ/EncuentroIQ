// tests/fase2.test.js
// Pruebas de la nueva asignación Fase 2 (carteles por rotación y orales 1 por facultad)
// y de las reglas de conflicto por modalidad. Corre 100% en el sandbox en memoria.

const { createSandbox, post } = require('./harness/sandbox');
const { seedSheets, toObjects } = require('./fixtures/seed');

function readSheet(spreadsheet, name) {
  const sheet = spreadsheet.getSheetByName(name);
  return toObjects(sheet.getDataRange().getValues());
}

function facultadKey(fac) {
  const s = String(fac || '').trim().toLowerCase();
  if (s.includes('zaragoza')) return 'FZ';
  if (s.includes('cuautitlan') || s.includes('cuautitlán')) return 'FC';
  if (s.includes('quimica') || s.includes('química')) return 'FQ';
  return null;
}

function esAsesor(work, ev) {
  const nombre = String(ev.name || '').trim().toUpperCase();
  return String(work.profesor_cargo || '').split(',').some(n => n.trim().toUpperCase() === nombre);
}

// Facultad del trabajo -> facultad que debe evaluar (rotación inversa).
const WORK_FAC_TO_EVAL = { FC: 'FQ', FZ: 'FC', FQ: 'FZ' };

const notifications = [];

function run(t) {
  // ===================== Asignación mixta (carteles + orales) =====================
  const base = createSandbox(seedSheets());
  notifications.push(...base.notifications);
  const res = post(base.sandbox, { action: 'assignLiveWorks' });

  t.group('Respuesta assignLiveWorks');
  t.equal(res.success, true, 'success');
  t.equal(res.resumen.carteles, 45, 'carteles asignados');
  t.equal(res.resumen.orales, 18, 'oral asignaciones');
  t.equal(res.resumen.sinEvaluador, 0, 'sin evaluador');

  const assigns = readSheet(base.spreadsheet, 'live_assignments');
  const works = readSheet(base.spreadsheet, 'works');
  const users = readSheet(base.spreadsheet, 'users');
  const workById = {};
  works.forEach(w => { workById[w.id] = w; });
  const userById = {};
  users.forEach(u => { userById[u.id] = u; });

  const posters = assigns.filter(a => workById[a.work_id] && workById[a.work_id].status === 'accepted_poster');
  const orals = assigns.filter(a => workById[a.work_id] && workById[a.work_id].status === 'accepted_oral');

  // -------- Carteles --------
  t.group('Carteles — cobertura');
  const perPoster = {};
  posters.forEach(a => { perPoster[a.work_id] = (perPoster[a.work_id] || 0) + 1; });
  t.equal(Object.keys(perPoster).length, 45, 'carteles distintos cubiertos');
  t.ok(Object.values(perPoster).every(c => c === 1), 'exactamente 1 evaluador por cartel');

  t.group('Carteles — rotación y conflicto');
  posters.forEach(a => {
    const w = workById[a.work_id];
    const ev = userById[a.evaluator_id];
    const wf = facultadKey(w.facultad);
    const ef = facultadKey(ev.facultad);
    t.ok(ef !== wf, 'cartel ' + w.id + ': evaluador no es de la facultad del cartel');
    t.equal(ef, WORK_FAC_TO_EVAL[wf], 'cartel ' + w.id + ': evalúa la facultad que corresponde');
    t.ok(!esAsesor(w, ev), 'cartel ' + w.id + ': no se asigna a su asesor');
  });

  t.group('Carteles — balance y límite de 5');
  const cartCount = {};
  posters.forEach(a => { cartCount[a.evaluator_id] = (cartCount[a.evaluator_id] || 0) + 1; });
  ['FQ-EV0', 'FQ-EV1', 'FQ-EV2', 'FQ-EV3', 'FQ-EV4'].forEach(id =>
    t.equal(cartCount[id] || 0, 3, id + ' evalúa 3 carteles'));
  ['FC-EV0', 'FC-EV1', 'FC-EV2', 'FC-EV3', 'FC-EV4'].forEach(id =>
    t.equal(cartCount[id] || 0, 3, id + ' evalúa 3 carteles'));
  ['FZ-EV0', 'FZ-EV1', 'FZ-EV2', 'FZ-EV3', 'MiguelF'].forEach(id =>
    t.equal(cartCount[id] || 0, 3, id + ' evalúa 3 carteles'));
  const totalFQEV5 = assigns.filter(a => a.evaluator_id === 'FQ-EV5').length;
  t.equal(totalFQEV5, 0, 'FQ-EV5 (6º evaluador de FQ) queda fuera');

  // -------- Orales --------
  t.group('Orales — cobertura');
  const perOral = {};
  orals.forEach(a => { perOral[a.work_id] = (perOral[a.work_id] || 0) + 1; });
  t.equal(Object.keys(perOral).length, 6, '6 ponencias cubiertas');
  t.ok(Object.values(perOral).every(c => c === 3), 'exactamente 3 evaluadores por ponencia');

  t.group('Orales — una por facultad y anti-asesor');
  const byOral = {};
  orals.forEach(a => {
    const w = workById[a.work_id];
    const ev = userById[a.evaluator_id];
    (byOral[a.work_id] = byOral[a.work_id] || []).push(facultadKey(ev.facultad));
    t.ok(!esAsesor(w, ev), 'ponencia ' + w.id + ': no se asigna a su asesor');
  });
  Object.keys(byOral).forEach(id => t.equal(new Set(byOral[id]).size, 3, id + ': una por facultad (distintas)'));
  ['FQ', 'FC', 'FZ'].forEach(fac => {
    const n = orals.filter(a => facultadKey(userById[a.evaluator_id].facultad) === fac).length;
    t.equal(n, 6, 'la facultad ' + fac + ' aporta 6 evaluaciones orales');
  });

  // -------- Idempotencia --------
  t.group('Idempotencia');
  const rowsBefore = readSheet(base.spreadsheet, 'live_assignments').length;
  const res2 = post(base.sandbox, { action: 'assignLiveWorks' });
  t.equal(res2.count, 0, 'segunda corrida no genera asignaciones');
  const rowsAfter = readSheet(base.spreadsheet, 'live_assignments').length;
  t.equal(rowsAfter, rowsBefore, 'no se duplican filas');

  // ===================== Fallback (facultad con <5) =====================
  t.group('Fallback: FZ con solo 3 evaluadores');
  const fb = createSandbox(seedSheets({ counts: { FQ: 6, FC: 5, FZ: 3 }, includeTestAccounts: false }));
  notifications.push(...fb.notifications);
  const fbRes = post(fb.sandbox, { action: 'assignLiveWorks' });
  t.equal(fbRes.resumen.sinEvaluador, 0, 'sin evaluador = 0');
  t.equal(fbRes.resumen.carteles, 45, '45 carteles asignados');
  const fbAssigns = readSheet(fb.spreadsheet, 'live_assignments');
  const fbWorks = readSheet(fb.spreadsheet, 'works');
  const fbUsers = readSheet(fb.spreadsheet, 'users');
  const fbWorkById = {};
  fbWorks.forEach(w => { fbWorkById[w.id] = w; });
  const fbUserById = {};
  fbUsers.forEach(u => { fbUserById[u.id] = u; });
  const fqPosters = fbAssigns.filter(a => fbWorkById[a.work_id] && fbWorkById[a.work_id].status === 'accepted_poster' && facultadKey(fbWorkById[a.work_id].facultad) === 'FQ');
  t.equal(fqPosters.length, 15, 'los 15 carteles de FQ reciben evaluador pese al faltante');
  fqPosters.forEach(a => {
    t.ok(facultadKey(fbUserById[a.evaluator_id].facultad) !== 'FQ', 'fallback nunca usa facultad del cartel (FQ)');
  });

  // ===================== assignManualLive por modalidad =====================
  t.group('assignManualLive');
  const man = createSandbox(seedSheets());
  notifications.push(...man.notifications);
  t.equal(post(man.sandbox, { action: 'assignManualLive', work_id: 'FC-POSTER-1', evaluator_id: 'FC-EV0' }).success, false, 'cartel + misma facultad = error');
  t.equal(post(man.sandbox, { action: 'assignManualLive', work_id: 'FC-POSTER-1', evaluator_id: 'FQ-EV0' }).success, true, 'cartel + otra facultad = OK');
  t.equal(post(man.sandbox, { action: 'assignManualLive', work_id: 'FC-ORAL-1', evaluator_id: 'FC-EV1' }).success, true, 'ponencia + misma facultad = OK');
  t.equal(post(man.sandbox, { action: 'assignManualLive', work_id: 'FC-POSTER-0', evaluator_id: 'FQ-EV0' }).success, false, 'cartel + asesor = error');

  // ===================== reassignLiveEvaluator por modalidad =====================
  t.group('reassignLiveEvaluator');
  const re = createSandbox(seedSheets({
    liveAssignments: [
      { id: 'la-poster', work_id: 'FC-POSTER-2', evaluator_id: 'FQ-EV1', status: 'assigned', assigned_at: '', completed_at: '' },
      { id: 'la-oral', work_id: 'FC-ORAL-0', evaluator_id: 'FQ-EV2', status: 'assigned', assigned_at: '', completed_at: '' }
    ]
  }));
  notifications.push(...re.notifications);
  const admin = 'admin-001';
  t.equal(post(re.sandbox, { action: 'reassignLiveEvaluator', admin_user_id: admin, work_id: 'FC-POSTER-2', old_evaluator_id: 'FQ-EV1', new_evaluator_id: 'FC-EV0' }).success, false, 'cartel: sustituto de misma facultad = error');
  t.equal(post(re.sandbox, { action: 'reassignLiveEvaluator', admin_user_id: admin, work_id: 'FC-POSTER-2', old_evaluator_id: 'FQ-EV1', new_evaluator_id: 'FZ-EV0' }).success, true, 'cartel: sustituto de otra facultad = OK');
  t.equal(post(re.sandbox, { action: 'reassignLiveEvaluator', admin_user_id: admin, work_id: 'FC-ORAL-0', old_evaluator_id: 'FQ-EV2', new_evaluator_id: 'FC-EV1' }).success, true, 'ponencia: sustituto de misma facultad = OK');
  t.equal(post(re.sandbox, { action: 'reassignLiveEvaluator', admin_user_id: admin, work_id: 'FC-ORAL-0', old_evaluator_id: 'FC-EV1', new_evaluator_id: 'FZ-EV1' }).success, true, 'ponencia: sustituto de otra facultad = OK');
  t.equal(post(re.sandbox, { action: 'reassignLiveEvaluator', admin_user_id: admin, work_id: 'FC-ORAL-0', old_evaluator_id: 'FZ-EV1', new_evaluator_id: 'FZ-EV0' }).success, false, 'ponencia: sustituto que es asesor = error');
  t.equal(post(re.sandbox, { action: 'reassignLiveEvaluator', admin_user_id: 'no-admin', work_id: 'FC-ORAL-0', old_evaluator_id: 'FZ-EV1', new_evaluator_id: 'FC-EV2' }).success, false, 'sin admin = error');

  // ===================== Asesores =====================
  t.group('getAsesores / esAutoEvaluacion');
  const util = createSandbox(seedSheets()).sandbox;
  t.equal(util.getAsesores({ asesores: 'Ana', profesor_cargo: 'Luis' }), 'Ana', 'prefiere campo asesores');
  t.equal(util.getAsesores({ profesor_cargo: 'Luis' }), 'Luis', 'respaldo a profesor_cargo');
  t.equal(util.getAsesores(null), '', 'null seguro');
  t.equal(util.esAutoEvaluacion({ asesores: 'Ana, LUIS' }, { name: 'luis' }), true, 'coincide por asesor (case-insensible)');
  t.equal(util.esAutoEvaluacion({ asesores: 'Ana, Luis' }, { name: 'Pedro' }), false, 'no coincide');

  t.group('formatearAsesores (constancias)');
  t.equal(util.formatearAsesores('Ana, Luis, Pedro'), 'Ana\nLuis\nPedro', 'varios asesores: uno por línea');
  t.equal(util.formatearAsesores('  Ana  '), 'Ana', 'recorta espacios');
  t.equal(util.formatearAsesores(''), 'No asignado', 'vacío: No asignado');
  t.equal(util.formatearAsesores(null), 'No asignado', 'null seguro');
  t.equal(util.formatearAsesores('Asesor de Prueba'), 'Asesor de Prueba', 'un solo asesor sin cambios');

  // ===================== Silencio =====================
  t.group('Silencio');
  t.equal(notifications.length, 0, 'ningún correo/push/fetch durante las pruebas');
}

module.exports = { name: 'Fase 2 — asignación y conflictos', run };
