// tests/fixtures/seed.js
// Genera un mapa de hojas en memoria con datos sintéticos para las pruebas.
// NO contiene datos reales ni toca Google Sheets.

const FAC = {
  FQ: 'Facultad de Química',
  FC: 'FES Cuautitlán',
  FZ: 'FES Zaragoza'
};
const FACULTADES = ['FQ', 'FC', 'FZ'];

const HEADERS = {
  users: ['id', 'name', 'email', 'user_type', 'facultad', 'password'],
  works: ['id', 'short_id', 'student_id', 'title', 'abstract', 'semester', 'facultad', 'profesor_cargo',
    'team_members', 'modality', 'file_url', 'file_id', 'status', 'submitted_at', 'final_score', 'feedback',
    'auditorio', 'horario', 'live_score'],
  assignments: ['id', 'work_id', 'evaluator_id', 'status', 'assigned_at', 'completed_at'],
  evaluations: ['id', 'work_id', 'evaluator_id', 'total_score', 'comentarios', 'timestamp'],
  live_assignments: ['id', 'work_id', 'evaluator_id', 'status', 'assigned_at', 'completed_at'],
  live_evaluations: ['id', 'work_id', 'evaluator_id', 'total_score', 'comments', 'timestamp'],
  live_evaluator_status: ['evaluator_id', 'status', 'last_activity', 'updated_at'],
  push_subscriptions: ['admin_user_id', 'endpoint', 'keys_p256dh', 'keys_auth', 'created_at', 'updated_at'],
  config: ['key', 'value']
};

function row(headers, obj) {
  return headers.map(h => (obj[h] === undefined ? '' : obj[h]));
}

function buildUsers(opts) {
  const counts = opts.counts || { FQ: 6, FC: 5, FZ: 4 };
  const users = [];
  Object.keys(counts).forEach(k => {
    for (let i = 0; i < counts[k]; i++) {
      users.push({
        id: k + '-EV' + i,
        name: k + ' Prof ' + i,
        email: k.toLowerCase() + '.prof' + i + '@test.local',
        user_type: 'evaluator',
        facultad: FAC[k],
        password: ''
      });
    }
  });
  if (opts.includeTestAccounts !== false) {
    users.push({ id: 'MiguelF', name: 'Miguel F', email: 'miguel@test.local', user_type: 'evaluator', facultad: FAC.FZ, password: '' });
    users.push({ id: 'TestE1', name: 'Test Estudiante', email: 'teste1@test.local', user_type: 'student', facultad: FAC.FQ, password: '' });
    users.push({ id: 'admin-001', name: 'Admin Prueba', email: 'admin@test.local', user_type: 'admin', facultad: '', password: '' });
  }
  return users;
}

function buildWorks(opts) {
  const works = [];
  const withScores = opts.withScores !== false;
  FACULTADES.forEach((fac, fi) => {
    for (let i = 0; i < 15; i++) {
      const id = fac + '-POSTER-' + i;
      const asesor =
        (fac === 'FC' && i === 0) ? 'FQ Prof 0' :
        (fac === 'FQ' && i === 1) ? 'FZ Prof 0' : '';
      works.push({
        id,
        short_id: fac + String(i + 1).padStart(2, '0'),
        student_id: (fac === 'FQ' && i === 0) ? 'TestE1' : 'alumno-' + fac + '-' + i,
        title: fac + ' Cartel ' + i,
        abstract: 'Resumen ' + id,
        semester: '5',
        facultad: FAC[fac],
        profesor_cargo: asesor,
        team_members: 'Equipo ' + id,
        modality: 'Cartel',
        file_url: 'https://example.test/' + id + '.pdf',
        file_id: 'file-' + id,
        status: 'accepted_poster',
        submitted_at: '2026-09-01',
        final_score: withScores ? 80 + (i % 10) : '',
        feedback: 'Feedback de prueba ' + id,
        auditorio: 'Carteles',
        horario: 'Sesión Carteles',
        live_score: withScores ? 40 + ((fi * 15 + i) * 7 % 55) : ''
      });
    }
    for (let i = 0; i < 2; i++) {
      const id = fac + '-ORAL-' + i;
      works.push({
        id,
        short_id: fac + 'O' + (i + 1),
        student_id: 'alumno-' + fac + '-oral' + i,
        title: fac + ' Ponencia ' + i,
        abstract: 'Resumen ' + id,
        semester: '7',
        facultad: FAC[fac],
        profesor_cargo: (fac === 'FC' && i === 0) ? 'FZ Prof 0' : '',
        team_members: 'Equipo ' + id,
        modality: 'Oral',
        file_url: 'https://example.test/' + id + '.pdf',
        file_id: 'file-' + id,
        status: 'accepted_oral',
        submitted_at: '2026-09-01',
        final_score: withScores ? 85 + i : '',
        feedback: 'Feedback de prueba ' + id,
        auditorio: 'Auditorio Principal',
        horario: '10:00',
        live_score: withScores ? 90 - (fi * 2 + i) : ''
      });
    }
  });
  return works;
}

function seedSheets(opts) {
  const options = opts || {};
  const liveAssignments = options.liveAssignments || [];
  const sheetMap = {
    users: [HEADERS.users].concat(buildUsers(options).map(u => row(HEADERS.users, u))),
    works: [HEADERS.works].concat(buildWorks(options).map(w => row(HEADERS.works, w))),
    assignments: [HEADERS.assignments],
    evaluations: [HEADERS.evaluations],
    live_assignments: [HEADERS.live_assignments].concat(liveAssignments.map(a => row(HEADERS.live_assignments, a))),
    live_evaluations: [HEADERS.live_evaluations],
    live_evaluator_status: [HEADERS.live_evaluator_status],
    push_subscriptions: [HEADERS.push_subscriptions,
      row(HEADERS.push_subscriptions, { admin_user_id: 'admin-001', endpoint: 'https://push.test/admin-001', keys_p256dh: 'pk', keys_auth: 'auth', created_at: '', updated_at: '' })],
    config: [HEADERS.config,
      row(HEADERS.config, { key: 'event_date', value: '2026-10-23' }),
      row(HEADERS.config, { key: 'evaluator_code', value: 'zaragoza' })]
  };
  return sheetMap;
}

function toObjects(rows) {
  if (!rows || !rows.length) return [];
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  return rows.slice(1).map(r => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });
}

// Trajes "pending" para simular el ciclo completo desde Fase 1.
function buildPendingWorks(perFac) {
  const works = [];
  FACULTADES.forEach(fac => {
    for (let i = 0; i < perFac; i++) {
      const id = fac + '-W' + i;
      works.push({
        id,
        short_id: fac + String(i + 1).padStart(2, '0'),
        student_id: 'alumno-' + fac + '-' + i,
        title: fac + ' Trabajo ' + (i + 1),
        abstract: 'Resumen ' + id,
        semester: String(1 + (i % 9)),
        facultad: FAC[fac],
        profesor_cargo: '',
        team_members: 'Equipo ' + id,
        modality: 'Pendiente',
        file_url: 'https://example.test/' + id + '.pdf',
        file_id: 'file-' + id,
        status: 'pending',
        submitted_at: '2026-09-01',
        final_score: '',
        feedback: '',
        auditorio: '',
        horario: '',
        live_score: ''
      });
    }
  });
  return works;
}

function seedPendingSheets(opts) {
  const options = opts || {};
  const perFac = options.worksPerFaculty || 20;
  const counts = options.counts || { FQ: 5, FC: 5, FZ: 5 };
  const users = buildUsers({ counts, includeTestAccounts: options.includeTestAccounts });
  const works = buildPendingWorks(perFac);
  return {
    users: [HEADERS.users].concat(users.map(u => row(HEADERS.users, u))),
    works: [HEADERS.works].concat(works.map(w => row(HEADERS.works, w))),
    assignments: [HEADERS.assignments],
    evaluations: [HEADERS.evaluations],
    live_assignments: [HEADERS.live_assignments],
    live_evaluations: [HEADERS.live_evaluations],
    live_evaluator_status: [HEADERS.live_evaluator_status],
    push_subscriptions: [HEADERS.push_subscriptions],
    config: [HEADERS.config,
      row(HEADERS.config, { key: 'event_date', value: '2026-10-23' }),
      row(HEADERS.config, { key: 'evaluator_code', value: 'zaragoza' })]
  };
}

module.exports = { FAC, FACULTADES, HEADERS, seedSheets, seedPendingSheets, toObjects };
