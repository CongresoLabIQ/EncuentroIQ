// tests/Code.pruebas.gs
// ---------------------------------------------------------------------------
// PRUEBAS DIRIGIDAS (Fase C) — pegar en el proyecto CLONADO de Apps Script,
// junto a Code.gs. NO modifica los endpoints de producción.
//
// Objetivo: validar notificaciones reales (MailApp/Push) y generación de
// constancias (Slides) SIN notificar a usuarios reales. Solo usa las cuentas:
//   Estudiante : TestE1
//   Evaluador  : MiguelF
//   Admin      : admin-001
//
// Antes de ejecutar:
//   1) Configura PRUEBA_CERT_FOLDER_ID con una CARPETA DE PRUEBA en Drive.
//   2) Asegúrate de tener desplegado el Word Wide Web App del clon.
//   3) Ejecuta PRUEBA_estado() para confirmar que las cuentas existen.
// Al terminar: ejecuta PRUEBA_limpiar() para borrar trabajo y constancias de prueba.
// ---------------------------------------------------------------------------

const PRUEBA_STUDENT_ID = 'TestE1';
const PRUEBA_EVALUATOR_ID = 'MiguelF';
const PRUEBA_ADMIN_ID = 'admin-001';
const PRUEBA_CERT_FOLDER_ID = 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_DE_PRUEBA';
const PRUEBA_MARK = 'PRUEBA';
const PRUEBA_DATA_PREFIX = 'PRUEBA-DATA-';
const PRUEBA_DATA_PASSWORD = 'Simulacro2026!';
const PRUEBA_DATA_FACULTIES = [
  { key: 'FQ', name: 'Facultad de Química' },
  { key: 'FC', name: 'FES Cuautitlán' },
  { key: 'FZ', name: 'FES Zaragoza' }
];
const PRUEBA_DATA_EXPECTED = {
  users: 19,
  works: 81,
  assignments: 207,
  evaluations: 192,
  live_assignments: 63,
  live_evaluations: 48
};

function PRUEBA_dataHeaders_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Falta la hoja requerida "' + sheetName + '" en el clon.');
  const rows = sheet.getDataRange().getValues();
  if (!rows.length || !rows[0].length) throw new Error('La hoja "' + sheetName + '" no tiene encabezados.');
  return rows[0].map(h => String(h));
}

function PRUEBA_dataAppend_(sheetName, records) {
  if (!records.length) return;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const headers = PRUEBA_dataHeaders_(sheetName);
  const rows = records.map(record => headers.map(key => record[key] === undefined ? '' : record[key]));
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
}

function PRUEBA_dataId_(kind, key, number) {
  return PRUEBA_DATA_PREFIX + kind + (key ? '-' + key : '') + (number ? '-' + String(number).padStart(3, '0') : '');
}

function PRUEBA_dataUser_(id, name, email, role, facultad) {
  return {
    id: id,
    name: name,
    email: email,
    password: "'" + hashPassword(PRUEBA_DATA_PASSWORD),
    user_type: role,
    facultad: facultad || '',
    created_at: new Date()
  };
}

function PRUEBA_dataEvalRubric_(score, modality) {
  const sections = modality === 'oral'
    ? [['pon_estructura', 10], ['pon_diseno', 20], ['pon_apoyo', 10], ['pon_expresion', 5], ['pon_lenguaje', 5], ['pon_equipo', 5], ['pon_dominio', 30], ['pon_defensa', 10], ['pon_innovacion', 5]]
    : [['cartel_estructura', 10], ['cartel_diseno', 20], ['cartel_escrita', 5], ['cartel_expresion', 10], ['cartel_lenguaje', 5], ['cartel_equipo', 10], ['cartel_dominio', 20], ['cartel_defensa', 15], ['cartel_innovacion', 5]];
  const target = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const values = sections.map(section => Math.floor(target * section[1] / 100));
  let remaining = target - values.reduce((sum, value) => sum + value, 0);
  for (let i = 0; remaining > 0; i = (i + 1) % sections.length) {
    if (values[i] < sections[i][1]) {
      values[i]++;
      remaining--;
    }
  }
  const rubric = {};
  sections.forEach((section, i) => { rubric[section[0]] = values[i]; });
  return JSON.stringify(rubric);
}

function PRUEBA_dataSummary_() {
  return {
    usuarios: PRUEBA_DATA_EXPECTED.users,
    trabajos: PRUEBA_DATA_EXPECTED.works,
    asignacionesFase1: PRUEBA_DATA_EXPECTED.assignments,
    evaluacionesFase1: PRUEBA_DATA_EXPECTED.evaluations,
    asignacionesFase2: PRUEBA_DATA_EXPECTED.live_assignments,
    evaluacionesFase2: PRUEBA_DATA_EXPECTED.live_evaluations
  };
}

function PRUEBA_dataEnsureColumns_(sheetName, columns) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Falta la hoja requerida "' + sheetName + '" en el clon.');
  let headers = PRUEBA_dataHeaders_(sheetName);
  columns.forEach(column => {
    if (headers.indexOf(column) === -1) {
      sheet.getRange(1, headers.length + 1).setValue(column);
      headers.push(column);
    }
  });
}

function PRUEBA_driveValues_() {
  return {
    driveFolder: typeof DRIVE_FOLDER_ID === 'undefined' ? '' : String(DRIVE_FOLDER_ID),
    template: typeof TEMPLATE_ID === 'undefined' ? '' : String(TEMPLATE_ID),
    certificateFolder: typeof CERTIFICATES_FOLDER_ID === 'undefined' ? '' : String(CERTIFICATES_FOLDER_ID),
    pruebaCertificateFolder: String(PRUEBA_CERT_FOLDER_ID || '')
  };
}

function PRUEBA_driveConfigSeguro_() {
  const ids = PRUEBA_driveValues_();
  return !!ids.driveFolder && !!ids.template && !!ids.certificateFolder &&
    ids.driveFolder !== '1L9IHjQpTBVgb5TC0cD-OB2pkrRRNKm_o' &&
    ids.template !== '1DNdoBL30o2hG77INqP4shV9Dtv-77yWyaIhnnKPT6j0' &&
    ids.certificateFolder !== '1A6ZuVHobxHtu3S3incdUk_HAbTMrrHGc' &&
    ids.pruebaCertificateFolder !== 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_DE_PRUEBA' &&
    ids.pruebaCertificateFolder !== '1A6ZuVHobxHtu3S3incdUk_HAbTMrrHGc';
}

// Se ejecuta solo cuando se van a probar subidas o constancias, no al sembrar la hoja.
function PRUEBA_validarDrive() {
  const ids = PRUEBA_driveValues_();
  const productionIds = [];
  if (ids.driveFolder === '1L9IHjQpTBVgb5TC0cD-OB2pkrRRNKm_o') productionIds.push('DRIVE_FOLDER_ID');
  if (ids.template === '1DNdoBL30o2hG77INqP4shV9Dtv-77yWyaIhnnKPT6j0') productionIds.push('TEMPLATE_ID');
  if (ids.certificateFolder === '1A6ZuVHobxHtu3S3incdUk_HAbTMrrHGc') productionIds.push('CERTIFICATES_FOLDER_ID');
  if (ids.pruebaCertificateFolder === '1A6ZuVHobxHtu3S3incdUk_HAbTMrrHGc') productionIds.push('PRUEBA_CERT_FOLDER_ID');
  if (productionIds.length) {
    throw new Error('Estas constantes todavía apuntan a Drive de producción: ' + productionIds.join(', ') + '. Configura IDs de prueba antes de subir archivos o generar constancias.');
  }

  const missing = [];
  if (!ids.driveFolder) missing.push('DRIVE_FOLDER_ID');
  if (!ids.template) missing.push('TEMPLATE_ID');
  if (!ids.certificateFolder) missing.push('CERTIFICATES_FOLDER_ID');
  if (ids.pruebaCertificateFolder === 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_DE_PRUEBA') missing.push('PRUEBA_CERT_FOLDER_ID');
  if (missing.length) {
    throw new Error('Falta configurar estas constantes para probar archivos/constancias: ' + missing.join(', ') + '.');
  }

  DriveApp.getFolderById(ids.driveFolder);
  DriveApp.getFolderById(ids.certificateFolder);
  DriveApp.getFolderById(ids.pruebaCertificateFolder);
  DriveApp.getFileById(ids.template);
  Logger.log('Drive de prueba configurado y accesible.');
}

function PRUEBA_poblarDatos() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  if (!PRUEBA_driveConfigSeguro_()) {
    Logger.log('Aviso: Drive de prueba aún no está configurado. El sembrado continúa; ejecuta PRUEBA_validarDrive() antes de probar subidas o constancias.');
  }
  // El endpoint real también agrega estos campos cuando hacen falta.
  PRUEBA_dataEnsureColumns_('live_evaluations', ['rubrica', 'comments']);
  const required = {
    users: ['id', 'name', 'email', 'password', 'user_type', 'facultad'],
    works: ['id', 'short_id', 'student_id', 'title', 'abstract', 'semester', 'facultad', 'profesor_cargo', 'team_members', 'modality', 'file_url', 'status', 'submitted_at', 'final_score', 'feedback', 'auditorio', 'horario', 'live_score'],
    assignments: ['id', 'work_id', 'evaluator_id', 'status', 'assigned_at', 'completed_at'],
    evaluations: ['id', 'work_id', 'evaluator_id', 'total_score', 'comentarios', 'timestamp'],
    live_assignments: ['id', 'work_id', 'evaluator_id', 'status', 'assigned_at', 'completed_at'],
    live_evaluations: ['id', 'work_id', 'evaluator_id', 'total_score', 'rubrica', 'comments', 'timestamp']
  };

  Object.keys(required).forEach(name => {
    const headers = PRUEBA_dataHeaders_(name);
    const missing = required[name].filter(h => headers.indexOf(h) === -1);
    if (missing.length) throw new Error('La hoja "' + name + '" no tiene estas columnas del backend: ' + missing.join(', '));
  });

  const current = {};
  Object.keys(required).forEach(name => { current[name] = getSheetData(db, name); });
  const partialSeed = Object.keys(current).some(name => current[name].some(row =>
    String(row.id || '').indexOf(PRUEBA_DATA_PREFIX) === 0 ||
    String(row.work_id || '').indexOf(PRUEBA_DATA_PREFIX) === 0
  )) || current.users.some(row => String(row.id || '').indexOf(PRUEBA_DATA_PREFIX) === 0);

  if (partialSeed) {
    const complete = Object.keys(PRUEBA_DATA_EXPECTED).every(name =>
      current[name].filter(row => String(row.id || '').indexOf(PRUEBA_DATA_PREFIX) === 0).length === PRUEBA_DATA_EXPECTED[name]
    );
    if (complete) {
      Logger.log('El conjunto ficticio ya existe; no se duplicó. %s', JSON.stringify(PRUEBA_dataSummary_()));
      return PRUEBA_dataSummary_();
    }
    throw new Error('Hay datos de prueba incompletos. Ejecuta PRUEBA_limpiar() y después vuelve a ejecutar PRUEBA_poblarDatos().');
  }

  const allowedExistingUsers = [PRUEBA_STUDENT_ID, PRUEBA_EVALUATOR_ID, PRUEBA_ADMIN_ID];
  const otherUsers = current.users.filter(u => allowedExistingUsers.indexOf(String(u.id)) === -1);
  if (otherUsers.length) {
    throw new Error('El clon aún contiene ' + otherUsers.length + ' usuario(s) ajeno(s) al simulacro. Vacía/anónimiza la hoja users del clon antes de poblarla.');
  }

  const dataSheets = ['works', 'assignments', 'evaluations', 'live_assignments', 'live_evaluations'];
  dataSheets.forEach(name => {
    if (current[name].length) throw new Error('La hoja "' + name + '" contiene datos. Usa un clon limpio o vacíala antes de generar el simulacro.');
  });

  ['live_evaluator_status', 'help_requests', 'reassign_log', 'reset_tokens'].forEach(name => {
    const sheet = db.getSheetByName(name);
    if (sheet && getSheetData(db, name).length) {
      throw new Error('La hoja "' + name + '" contiene registros previos. Vacía esos datos en el clon antes de poblarlo.');
    }
  });
  const pushSheet = db.getSheetByName('push_subscriptions');
  if (pushSheet && getSheetData(db, 'push_subscriptions').length) {
    throw new Error('La hoja "push_subscriptions" contiene suscripciones previas. Vacíala en el clon para no enviar avisos a dispositivos ajenos al simulacro.');
  }

  const users = [];
  const students = {};
  const evaluators = {};
  const emailDomain = 'prueba.encuentroiq.test';

  users.push(PRUEBA_dataUser_(PRUEBA_dataId_('ADMIN'), 'Administración Demo', 'admin@' + emailDomain, 'admin', ''));
  PRUEBA_DATA_FACULTIES.forEach(fac => {
    const studentId = PRUEBA_dataId_('ST', fac.key);
    students[fac.key] = { id: studentId, name: 'Estudiante Demo ' + fac.key };
    users.push(PRUEBA_dataUser_(studentId, students[fac.key].name, 'alumno.' + fac.key.toLowerCase() + '@' + emailDomain, 'student', fac.name));
    evaluators[fac.key] = [];
    for (let i = 1; i <= 5; i++) {
      const evaluatorId = PRUEBA_dataId_('EV', fac.key, i);
      const evaluator = { id: evaluatorId, name: 'Evaluador Demo ' + fac.key + ' ' + String(i).padStart(2, '0'), facultad: fac.name };
      evaluators[fac.key].push(evaluator);
      users.push(PRUEBA_dataUser_(evaluatorId, evaluator.name, 'evaluador.' + fac.key.toLowerCase() + '.' + i + '@' + emailDomain, 'evaluator', fac.name));
    }
  });

  const works = [];
  const assignments = [];
  const evaluations = [];
  const liveAssignments = [];
  const liveEvaluations = [];
  const workFacIndex = { FQ: 0, FC: 1, FZ: 2 };
  const topics = [
    'Optimización de un proceso de separación',
    'Tratamiento de aguas residuales con materiales adsorbentes',
    'Producción de biocombustible a partir de residuos',
    'Síntesis y caracterización de un catalizador',
    'Análisis de transferencia de calor en un reactor',
    'Valorización de residuos agroindustriales',
    'Control de emisiones en procesos químicos',
    'Diseño de una columna de absorción a escala piloto',
    'Evaluación de un proceso de cristalización',
    'Modelado cinético de una reacción química'
  ];
  const now = new Date();
  let f1AssignmentNo = 0;
  let f1EvaluationNo = 0;
  let liveAssignmentNo = 0;
  let liveEvaluationNo = 0;
  const pendingLiveByEvaluator = {};

  function addPhase1Assignments(work, facKey, workIndex, completedCount) {
    const otherFaculties = PRUEBA_DATA_FACULTIES.filter(f => f.key !== facKey);
    for (let j = 0; j < 3; j++) {
      const group = evaluators[otherFaculties[j % otherFaculties.length].key];
      const evaluator = group[(workIndex + j) % group.length];
      const completed = j < completedCount;
      f1AssignmentNo++;
      assignments.push({
        id: PRUEBA_dataId_('ASIG-F1', '', f1AssignmentNo),
        work_id: work.id,
        evaluator_id: evaluator.id,
        status: completed ? 'completed' : 'assigned',
        assigned_at: new Date(now.getTime() - (workIndex + j + 1) * 3600000),
        completed_at: completed ? new Date(now.getTime() - (workIndex + j) * 1800000) : ''
      });
      if (completed) {
        f1EvaluationNo++;
        evaluations.push({
          id: PRUEBA_dataId_('EVAL-F1', '', f1EvaluationNo),
          work_id: work.id,
          evaluator_id: evaluator.id,
          total_score: 66 + ((workIndex * 7 + j * 9 + workFacIndex[facKey] * 5) % 34),
          comentarios: 'Evaluación ficticia para simulacro. Comentario de prueba ' + f1EvaluationNo + '.',
          timestamp: new Date(now.getTime() - (workIndex + j) * 1800000)
        });
      }
    }
  }

  function addPhase2Assignment(work, evaluator, score) {
    liveAssignmentNo++;
    const isPending = !pendingLiveByEvaluator[evaluator.id];
    pendingLiveByEvaluator[evaluator.id] = true;
    const assignment = {
      id: PRUEBA_dataId_('ASIG-F2', '', liveAssignmentNo),
      work_id: work.id,
      evaluator_id: evaluator.id,
      status: isPending ? 'assigned' : 'completed',
      assigned_at: new Date(now.getTime() - liveAssignmentNo * 60000),
      completed_at: isPending ? '' : new Date(now.getTime() - liveAssignmentNo * 30000)
    };
    liveAssignments.push(assignment);
    if (isPending) work.live_score = '';
    if (!isPending) {
      liveEvaluationNo++;
      liveEvaluations.push({
        id: PRUEBA_dataId_('EVAL-F2', '', liveEvaluationNo),
        work_id: work.id,
        evaluator_id: evaluator.id,
        total_score: score,
        rubrica: PRUEBA_dataEvalRubric_(score, work.status === 'accepted_oral' ? 'oral' : 'cartel'),
        comments: 'Evaluación presencial ficticia para simulacro.',
        timestamp: assignment.completed_at
      });
    }
  }

  PRUEBA_DATA_FACULTIES.forEach(fac => {
    for (let index = 1; index <= 27; index++) {
      let status = 'pending';
      if (index >= 5 && index <= 9) status = 'under_review';
      else if (index === 10 || index === 11) status = 'accepted_oral';
      else if (index >= 12 && index <= 26) status = 'accepted_poster';
      else if (index === 27) status = 'rejected';

      const workId = PRUEBA_dataId_('WORK', fac.key, index);
      const topic = topics[(index + workFacIndex[fac.key] * 3) % topics.length];
      const work = {
        id: workId,
        short_id: fac.key + String(index).padStart(2, '0'),
        student_id: students[fac.key].id,
        title: topic + ' — Proyecto ' + fac.key + '-' + String(index).padStart(2, '0'),
        abstract: 'Trabajo completamente ficticio para el simulacro de EncuentroIQ. Se presentan objetivos, metodología y resultados de ejemplo para probar el flujo de revisión.',
        semester: String(3 + (index % 6)),
        facultad: fac.name,
        profesor_cargo: 'Dra. Asesora Demo ' + fac.key,
        team_members: students[fac.key].name + ', Integrante Demo ' + String(index).padStart(2, '0'),
        modality: status === 'accepted_oral' ? 'Oral' : status === 'accepted_poster' ? 'Cartel' : 'Pendiente',
        file_url: 'demo-trabajo.pdf',
        file_id: '',
        status: status,
        submitted_at: new Date(now.getTime() - (28 - index) * 86400000),
        final_score: '',
        feedback: '',
        auditorio: '',
        horario: '',
        live_score: ''
      };

      if (status === 'under_review') addPhase1Assignments(work, fac.key, index, 2);
      if (['accepted_oral', 'accepted_poster', 'rejected'].indexOf(status) > -1) {
        addPhase1Assignments(work, fac.key, index, 3);
        work.final_score = status === 'rejected' ? 58 : 72 + ((index * 3 + workFacIndex[fac.key] * 5) % 27);
        work.feedback = 'Retroalimentación ficticia: fortalezca la discusión de resultados y la justificación metodológica.';
      }

      if (status === 'accepted_oral') {
        const oralIndex = index - 10;
        work.auditorio = 'Auditorio Principal';
        work.horario = slotHora(oralIndex);
        work.live_score = 84 + ((workFacIndex[fac.key] * 3 + oralIndex * 2) % 13);
      } else if (status === 'accepted_poster') {
        const posterIndex = index - 12;
        work.auditorio = 'Área de Carteles';
        work.horario = '11:' + String((posterIndex * 3) % 60).padStart(2, '0');
        work.live_score = 68 + ((posterIndex * 7 + workFacIndex[fac.key] * 11) % 31);
      }

      works.push(work);
    }
  });

  works.filter(w => w.status === 'accepted_poster').forEach(work => {
    const targetFaculty = PRUEBA_DATA_FACULTIES.find(f => f.name === work.facultad).key;
    const evaluatorFaculty = targetFaculty === 'FQ' ? 'FZ' : targetFaculty === 'FC' ? 'FQ' : 'FC';
    const posterNumber = Number(work.short_id.slice(-2)) - 12;
    const evaluator = evaluators[evaluatorFaculty][posterNumber % 5];
    addPhase2Assignment(work, evaluator, Number(work.live_score));
  });

  works.filter(w => w.status === 'accepted_oral').forEach(work => {
    PRUEBA_DATA_FACULTIES.forEach((fac, i) => {
      const oralNumber = Number(work.short_id.slice(-2)) - 10;
      const evaluator = evaluators[fac.key][(oralNumber + i) % 5];
      addPhase2Assignment(work, evaluator, Number(work.live_score));
    });
  });

  const prepared = {
    users: users,
    works: works,
    assignments: assignments,
    evaluations: evaluations,
    live_assignments: liveAssignments,
    live_evaluations: liveEvaluations
  };
  Object.keys(PRUEBA_DATA_EXPECTED).forEach(name => {
    if (prepared[name].length !== PRUEBA_DATA_EXPECTED[name]) {
      throw new Error('Error interno al generar ' + name + ': esperado ' + PRUEBA_DATA_EXPECTED[name] + ', generado ' + prepared[name].length + '.');
    }
  });

  // Se escribe solo después de validar el clon y verificar todos los conteos.
  ['users', 'works', 'assignments', 'evaluations', 'live_assignments', 'live_evaluations'].forEach(name => {
    PRUEBA_dataAppend_(name, prepared[name]);
  });

  const summary = PRUEBA_dataSummary_();
  Logger.log('Datos ficticios creados en el clon: %s', JSON.stringify(summary));
  Logger.log('Acceso demo: admin@%s, alumno.<fq|fc|fz>@%s y evaluador.<fq|fc|fz>.<1-5>@%s.', emailDomain, emailDomain, emailDomain);
  return summary;
}

function PRUEBA_usuario_(id) {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const u = getSheetData(db, 'users').find(x => String(x.id) === String(id));
  if (!u) throw new Error('No se encontró la cuenta de prueba con id "' + id + '".');
  return u;
}

function PRUEBA_estado() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const works = getSheetData(db, 'works');
  const live = getSheetData(db, 'live_assignments');
  const student = PRUEBA_usuario_(PRUEBA_STUDENT_ID);
  const evaluator = PRUEBA_usuario_(PRUEBA_EVALUATOR_ID);
  const admin = PRUEBA_usuario_(PRUEBA_ADMIN_ID);
  const testWork = works.find(w => String(w.id).indexOf(PRUEBA_MARK) === 0);
  Logger.log('=== Entorno de prueba ===');
  Logger.log('Estudiante: %s <%s>', student.name, student.email);
  Logger.log('Evaluador : %s <%s> facultad=%s', evaluator.name, evaluator.email, evaluator.facultad);
  Logger.log('Admin     : %s <%s>', admin.name, admin.email);
  Logger.log('Trabajo de prueba existente: %s', testWork ? testWork.id : '(ninguno)');
  Logger.log('Asignaciones Fase 2 totales: %s', live.length);
  Logger.log('Carpeta de constancias de prueba configurada: %s',
    PRUEBA_CERT_FOLDER_ID.indexOf('PEGA_AQUI') === 0 ? 'NO' : 'SÍ');
}

// --- Notificaciones (replican el formato de los endpoints, dirigidas) ---

function PRUEBA_notifDictamen() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const student = PRUEBA_usuario_(PRUEBA_STUDENT_ID);
  const w = getSheetData(db, 'works').find(x => String(x.id).indexOf(PRUEBA_MARK) === 0);
  if (!w) throw new Error('Crea primero el trabajo de prueba con PRUEBA_crearTrabajo().');
  const statusLabel = {
    accepted_oral: 'Aceptado — Ponencia Oral',
    accepted_poster: 'Aceptado — Cartel',
    rejected: 'No seleccionado'
  };
  const hora = String(w.horario || '').replace(/^'/, '');
  const msg = 'Dictamen: ' + (statusLabel[w.status] || w.status) +
    '\nLugar: ' + (w.auditorio || 'N/A') +
    '\nHora: ' + (hora || 'N/A') +
    '\n\nRetroalimentación:\n' + (w.feedback || 'N/A');
  MailApp.sendEmail(student.email, '[' + PRUEBA_MARK + '] Resultado Encuentro IQ', msg);
  Logger.log('Correo de dictamen enviado a %s', student.email);
}

function PRUEBA_notifAgenda() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const ev = PRUEBA_usuario_(PRUEBA_EVALUATOR_ID);
  const liveAssigns = getSheetData(db, 'live_assignments');
  const works = getSheetData(db, 'works');
  const tasks = liveAssigns.filter(a => String(a.evaluator_id) === String(ev.id));
  const fechaEvento = obtenerFechaEvento();
  let html = '<h2>[' + PRUEBA_MARK + '] Agenda para Prof. ' + ev.name + '</h2>' +
    '<p><strong>Fecha del evento:</strong> ' + fechaEvento + '</p>' +
    '<table border="1" style="border-collapse:collapse; width:100%;">' +
    '<tr style="background:#0d6efd; color:white;"><th>Hora</th><th>Lugar</th><th>Trabajo</th></tr>';
  if (tasks.length === 0) {
    html += '<tr><td colspan="3">Sin asignaciones (prueba)</td></tr>';
  } else {
    tasks.forEach(t => {
      const w = works.find(work => work.id === t.work_id);
      if (w) html += '<tr><td>' + (w.horario || 'N/A') + '</td><td>' + (w.auditorio || 'Carteles') +
        '</td><td><b>' + w.short_id + '</b> - ' + w.title + '</td></tr>';
    });
  }
  html += '</table>';
  MailApp.sendEmail({ to: ev.email, subject: '[' + PRUEBA_MARK + '] Agenda de Evaluación - Encuentro IQ', htmlBody: html });
  Logger.log('Correo de agenda enviado a %s (%s tareas)', ev.email, tasks.length);
}

function PRUEBA_pushAdmin() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const admin = PRUEBA_usuario_(PRUEBA_ADMIN_ID);
  const privateKey = getConfigValue('vapid_private', '');
  const publicKey = getConfigValue('vapid_public', '');
  if (!privateKey || !publicKey) throw new Error('Llaves VAPID no configuradas en la hoja config.');
  const rows = getPushSubscriptionSheet(db).getDataRange().getValues();
  const headers = rows[0];
  const idIdx = headers.indexOf('admin_user_id');
  const epIdx = headers.indexOf('endpoint');
  const subs = [];
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIdx]) === String(admin.id) && String(rows[i][epIdx] || '')) subs.push(String(rows[i][epIdx]));
  }
  if (!subs.length) throw new Error('admin-001 no tiene suscripción push registrada.');
  const now = Math.floor(Date.now() / 1000);
  subs.forEach(ep => {
    const r = pushToEndpoint(ep, publicKey, privateKey, now, 3600);
    Logger.log('Push a %s -> %s', ep, JSON.stringify(r));
  });
}

// --- Trabajo y constancias de prueba ---

function PRUEBA_crearTrabajo() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = db.getSheetByName('works');
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const existing = getSheetData(db, 'works').find(w => String(w.id).indexOf(PRUEBA_MARK) === 0);
  if (existing) { Logger.log('Ya existe trabajo de prueba: %s', existing.id); return existing.id; }
  const id = PRUEBA_MARK + '-WORK-001';
  const row = new Array(headers.length).fill('');
  const put = (k, v) => { const i = headers.indexOf(k); if (i > -1) row[i] = v; };
  put('id', id);
  put('short_id', 'PRB01');
  put('student_id', PRUEBA_STUDENT_ID);
  put('title', '[PRUEBA] Cartel de prueba');
  put('abstract', 'Trabajo temporal para pruebas.');
  put('semester', '5');
  put('facultad', 'Facultad de Química');
  put('profesor_cargo', 'Asesor de Prueba');
  put('team_members', 'Equipo de Prueba');
  put('modality', 'Cartel');
  put('status', 'accepted_poster');
  put('submitted_at', new Date());
  put('feedback', 'Retroalimentación de prueba.');
  put('horario', 'Sesión Carteles');
  put('auditorio', 'Carteles');
  put('live_score', 99);
  sheet.appendRow(row);
  Logger.log('Trabajo de prueba creado: %s. Bórralo con PRUEBA_limpiar().', id);
  return id;
}

function PRUEBA_constancia() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  if (PRUEBA_CERT_FOLDER_ID.indexOf('PEGA_AQUI') === 0) {
    throw new Error('Configura PRUEBA_CERT_FOLDER_ID con una carpeta de prueba.');
  }
  let work = getSheetData(db, 'works').find(w => String(w.id).indexOf(PRUEBA_MARK) === 0);
  if (!work) {
    PRUEBA_crearTrabajo();
    work = getSheetData(db, 'works').find(w => String(w.id).indexOf(PRUEBA_MARK) === 0);
  }
  const url = crearSlideEditable(work, 'Asesor de Prueba', PRUEBA_MARK + ' — Cartel', PRUEBA_CERT_FOLDER_ID);
  Logger.log('Constancia de prueba creada: %s', url);
  return url;
}

// Llama al endpoint real assignLiveWorks del clon (asignación de carteles/orales).
function PRUEBA_asignarFase2() {
  const url = ScriptApp.getService().getUrl();
  if (!url) throw new Error('No hay Web App desplegada para este proyecto.');
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'text/plain;charset=utf-8',
    payload: JSON.stringify({ action: 'assignLiveWorks' }),
    muteHttpExceptions: true
  });
  Logger.log('assignLiveWorks -> %s', res.getContentText());
}

// Ejecuta todo el flujo de prueba (cada paso es tolerante a fallos).
function PRUEBA_todo() {
  const pasos = [
    ['Estado', PRUEBA_estado],
    ['Crear trabajo', PRUEBA_crearTrabajo],
    ['Correo dictamen', PRUEBA_notifDictamen],
    ['Correo agenda', PRUEBA_notifAgenda],
    ['Push admin', PRUEBA_pushAdmin],
    ['Constancia', PRUEBA_constancia]
  ];
  pasos.forEach(p => {
    try { p[1](); } catch (e) { Logger.log('⚠️ %s falló: %s', p[0], e.message); }
  });
  Logger.log('=== Pruebas dirigidas terminadas. Ejecuta PRUEBA_limpiar() al finalizar. ===');
}

// ============================================================
// SIMULACRO DE FASE 2 POR ETAPAS
// Solo Fase 2: 13 carteles + 2 ponencias por facultad (FQ, FC, FZ).
// Cada paso es idempotente, no usa Drive y puede ejecutarse por separado
// desde el editor de Apps Script o desde el menú "Simulacro Fase 2" de la hoja.
// ============================================================

const PRUEBA_F2_EMAIL_DOMAIN = 'prueba.encuentroiq.test';
const PRUEBA_F2_CARTELES_POR_FACULTAD = 13;
const PRUEBA_F2_PONENCIAS_POR_FACULTAD = 2;
const PRUEBA_F2_TRABAJOS_POR_FACULTAD = PRUEBA_F2_CARTELES_POR_FACULTAD + PRUEBA_F2_PONENCIAS_POR_FACULTAD;

function PRUEBA_f2_columnasRequeridas_() {
  return {
    users: ['id', 'name', 'email', 'password', 'user_type', 'facultad'],
    works: ['id', 'short_id', 'student_id', 'title', 'abstract', 'semester', 'facultad', 'profesor_cargo',
      'team_members', 'modality', 'file_url', 'status', 'submitted_at', 'final_score', 'feedback',
      'auditorio', 'horario', 'live_score'],
    live_assignments: ['id', 'work_id', 'evaluator_id', 'status', 'assigned_at', 'completed_at'],
    live_evaluations: ['id', 'work_id', 'evaluator_id', 'total_score', 'rubrica', 'comments', 'timestamp']
  };
}

function PRUEBA_f2_validarColumnas_() {
  PRUEBA_dataEnsureColumns_('live_evaluations', ['rubrica', 'comments']);
  const required = PRUEBA_f2_columnasRequeridas_();
  Object.keys(required).forEach(name => {
    const headers = PRUEBA_dataHeaders_(name);
    const missing = required[name].filter(h => headers.indexOf(h) === -1);
    if (missing.length) throw new Error('La hoja "' + name + '" no tiene estas columnas del backend: ' + missing.join(', '));
  });
}

function PRUEBA_f2_esTrabajoDemo_(row) {
  const id = String((row && row.id) || '');
  const studentId = String((row && row.student_id) || '');
  return id === 'PRUEBA-WORK-001' ||
    id.indexOf(PRUEBA_DATA_PREFIX) === 0 ||
    studentId.indexOf(PRUEBA_dataId_('ST')) === 0;
}

function PRUEBA_f2_trabajosDemo_(db) {
  return getSheetData(db, 'works').filter(PRUEBA_f2_esTrabajoDemo_);
}

function PRUEBA_f2_demoWorkIds_(db) {
  const ids = {};
  PRUEBA_f2_trabajosDemo_(db).forEach(w => { ids[String(w.id)] = true; });
  return ids;
}

// Asignaciones de Fase 2 sobre trabajos demo que todavía no tienen evaluación.
function PRUEBA_f2_pendientes_(db) {
  const demoIds = PRUEBA_f2_demoWorkIds_(db);
  const evaluado = {};
  getSheetData(db, 'live_evaluations').forEach(e => {
    evaluado[String(e.work_id) + '|' + String(e.evaluator_id)] = true;
  });
  return getSheetData(db, 'live_assignments').filter(a =>
    demoIds[String(a.work_id)] && !evaluado[String(a.work_id) + '|' + String(a.evaluator_id)]
  );
}

// Paso 1: cuentas demo (admin, alumnos y 5 evaluadores por facultad).
function PRUEBA_f2_paso1_usuarios() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  PRUEBA_f2_validarColumnas_();
  const existentes = {};
  getSheetData(db, 'users').forEach(u => { existentes[String(u.id)] = true; });
  const domain = PRUEBA_F2_EMAIL_DOMAIN;
  const nuevos = [];
  const agregar = (id, name, email, role, facultad) => {
    if (existentes[id]) return;
    nuevos.push(PRUEBA_dataUser_(id, name, email, role, facultad));
  };
  agregar(PRUEBA_dataId_('ADMIN'), 'Administración Demo', 'admin@' + domain, 'admin', '');
  PRUEBA_DATA_FACULTIES.forEach(fac => {
    agregar(PRUEBA_dataId_('ST', fac.key), 'Estudiante Demo ' + fac.key,
      'alumno.' + fac.key.toLowerCase() + '@' + domain, 'student', fac.name);
    for (let i = 1; i <= 5; i++) {
      agregar(PRUEBA_dataId_('EV', fac.key, i), 'Evaluador Demo ' + fac.key + ' ' + String(i).padStart(2, '0'),
        'evaluador.' + fac.key.toLowerCase() + '.' + i + '@' + domain, 'evaluator', fac.name);
    }
  });
  if (nuevos.length) PRUEBA_dataAppend_('users', nuevos);
  const total = getSheetData(db, 'users').filter(u => String(u.id).indexOf(PRUEBA_DATA_PREFIX) === 0).length;
  Logger.log('Paso 1 · usuarios demo: %s nuevos, %s en total.', nuevos.length, total);
  Logger.log('Acceso: admin@%s · alumno.<fq|fc|fz>@%s · evaluador.<fq|fc|fz>.<1-5>@%s (contraseña %s).',
    domain, domain, domain, PRUEBA_DATA_PASSWORD);
  return { nuevos: nuevos.length, total: total };
}

// Paso 2: trabajos ya seleccionados para Fase 2 (13 carteles + 2 ponencias por facultad).
function PRUEBA_f2_paso2_trabajos() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  PRUEBA_f2_validarColumnas_();
  PRUEBA_dataEnsureColumns_('live_evaluations', ['rubrica', 'comments']);
  const existentes = {};
  PRUEBA_f2_trabajosDemo_(db).forEach(w => { existentes[String(w.id)] = true; });
  const topics = [
    'Optimización de un proceso de separación',
    'Tratamiento de aguas residuales con materiales adsorbentes',
    'Producción de biocombustible a partir de residuos',
    'Síntesis y caracterización de un catalizador',
    'Análisis de transferencia de calor en un reactor',
    'Valorización de residuos agroindustriales',
    'Control de emisiones en procesos químicos',
    'Diseño de una columna de absorción a escala piloto',
    'Evaluación de un proceso de cristalización',
    'Modelado cinético de una reacción química'
  ];
  const now = new Date();
  const nuevos = [];
  PRUEBA_DATA_FACULTIES.forEach((fac, facIndex) => {
    for (let i = 1; i <= PRUEBA_F2_TRABAJOS_POR_FACULTAD; i++) {
      const id = PRUEBA_dataId_('F2', fac.key, i);
      if (existentes[id]) continue;
      const esPonencia = i > PRUEBA_F2_CARTELES_POR_FACULTAD;
      const n = esPonencia ? i - PRUEBA_F2_CARTELES_POR_FACULTAD : i;
      nuevos.push({
        id: id,
        short_id: fac.key + String(i).padStart(2, '0'),
        student_id: PRUEBA_dataId_('ST', fac.key),
        title: topics[(i + facIndex * 3) % topics.length] + ' — Proyecto ' + fac.key + '-' + String(i).padStart(2, '0'),
        abstract: 'Trabajo ficticio de Fase 2 para el simulacro de EncuentroIQ.',
        semester: String(3 + (i % 6)),
        facultad: fac.name,
        profesor_cargo: 'Dra. Asesora Demo ' + fac.key,
        team_members: 'Estudiante Demo ' + fac.key + ', Integrante Demo',
        modality: esPonencia ? 'Oral' : 'Cartel',
        file_url: 'demo-trabajo.pdf',
        file_id: '',
        status: esPonencia ? 'accepted_oral' : 'accepted_poster',
        submitted_at: new Date(now.getTime() - (PRUEBA_F2_TRABAJOS_POR_FACULTAD - i) * 86400000),
        final_score: 72 + ((i * 3 + facIndex * 5) % 27),
        feedback: 'Seleccionado para la Fase 2. Retroalimentación ficticia.',
        auditorio: esPonencia ? 'Auditorio Principal' : 'Área de Carteles',
        horario: esPonencia ? slotHora(n - 1) : 'Sesión Carteles',
        live_score: ''
      });
    }
  });
  if (nuevos.length) PRUEBA_dataAppend_('works', nuevos);
  const demo = PRUEBA_f2_trabajosDemo_(db);
  const resumen = {
    nuevos: nuevos.length,
    total: demo.length,
    carteles: demo.filter(w => w.status === 'accepted_poster').length,
    ponencias: demo.filter(w => w.status === 'accepted_oral').length
  };
  Logger.log('Paso 2 · trabajos de Fase 2: +%s nuevos, %s en total (%s carteles, %s ponencias).',
    resumen.nuevos, resumen.total, resumen.carteles, resumen.ponencias);
  return resumen;
}

// Paso 3: asigna carteles (rotación de facultad, 1 evaluador) y ponencias (1 por facultad).
// Reutiliza la misma lógica del endpoint assignLiveWorks.
function PRUEBA_f2_paso3_asignar() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  PRUEBA_f2_validarColumnas_();
  const works = PRUEBA_f2_trabajosDemo_(db)
    .filter(w => w.status === 'accepted_poster' || w.status === 'accepted_oral');
  const { evaluators, carga, grupos } = cargarGruposEvaluadores(db);
  if (!evaluators.length) throw new Error('No hay evaluadores demo. Ejecuta primero PRUEBA_f2_paso1_usuarios().');
  const sheet = db.getSheetByName('live_assignments');
  const conteo = {};
  evaluators.forEach(ev => { conteo[ev.id] = 0; });
  const yaAsignados = {};
  getSheetData(db, 'live_assignments').forEach(a => { yaAsignados[String(a.work_id)] = true; });

  const filas = [];
  let carteles = 0, orales = 0, sinEvaluador = 0;

  const gruposCartel = {};
  function grupoCartel(targetFac) {
    const key = targetFac || 'FX';
    if (!gruposCartel[key]) gruposCartel[key] = grupoParaObjetivo(grupos, evaluators, carga, targetFac);
    return gruposCartel[key];
  }

  works.filter(w => w.status === 'accepted_poster' && !yaAsignados[String(w.id)]).forEach(w => {
    const grupo = grupoCartel(facultadKey(w.facultad));
    if (!grupo.length) { sinEvaluador++; return; }
    const ev = elegirEvaluador(grupo, w, conteo);
    if (!ev) { sinEvaluador++; return; }
    conteo[ev.id]++;
    filas.push([Utilities.getUuid(), w.id, ev.id, 'assigned', new Date(), '']);
    carteles++;
  });

  works.filter(w => w.status === 'accepted_oral' && !yaAsignados[String(w.id)]).forEach(w => {
    const usados = {};
    FACULTADES_ROTACION.forEach(fac => {
      let grupo = grupos[fac];
      if (!grupo.length) grupo = evaluators.filter(ev => !usados[ev.id]);
      let ev = null, mejor = Infinity;
      grupo.forEach(cand => {
        if (usados[cand.id] || esAutoEvaluacion(w, cand)) return;
        const c = conteo[cand.id] || 0;
        if (c < mejor) { mejor = c; ev = cand; }
      });
      if (!ev) {
        grupo.forEach(cand => {
          if (usados[cand.id]) return;
          const c = conteo[cand.id] || 0;
          if (c < mejor) { mejor = c; ev = cand; }
        });
      }
      if (ev) {
        usados[ev.id] = true;
        conteo[ev.id]++;
        filas.push([Utilities.getUuid(), w.id, ev.id, 'assigned', new Date(), '']);
        orales++;
      } else {
        sinEvaluador++;
      }
    });
  });

  filas.forEach(f => sheet.appendRow(f));
  const resumen = { creadas: filas.length, carteles: carteles, orales: orales, sinEvaluador: sinEvaluador };
  Logger.log('Paso 3 · asignaciones de Fase 2: %s nuevas (%s carteles + %s evaluaciones orales). Sin evaluador: %s.',
    resumen.creadas, carteles, orales, sinEvaluador);
  return resumen;
}

// Paso 4: lista las asignaciones que faltan por evaluar (para hacerlo a mano desde la UI).
function PRUEBA_f2_paso4_pendientes() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const works = {};
  getSheetData(db, 'works').forEach(w => { works[String(w.id)] = w; });
  const users = {};
  getSheetData(db, 'users').forEach(u => { users[String(u.id)] = u; });
  const pendientes = PRUEBA_f2_pendientes_(db);
  Logger.log('Paso 4 · asignaciones de Fase 2 sin evaluar: %s', pendientes.length);
  pendientes.slice(0, 30).forEach(a => {
    const w = works[String(a.work_id)] || {};
    const u = users[String(a.evaluator_id)] || {};
    Logger.log('  · %s (%s) → %s [%s]', u.email || a.evaluator_id, u.facultad || '',
      w.short_id || a.work_id, w.status === 'accepted_oral' ? 'Ponencia' : 'Cartel');
  });
  if (pendientes.length > 30) Logger.log('  · … y %s más.', pendientes.length - 30);
  return { pendientes: pendientes.length };
}

function PRUEBA_f2_score_(work, evaluatorId) {
  const w = parseInt(String((work && work.short_id) || (work && work.id) || '').replace(/\D/g, ''), 10) || 0;
  const e = parseInt(String(evaluatorId).replace(/\D/g, ''), 10) || 0;
  return 60 + ((w * 7 + e * 3) % 41);
}

// Paso 5: evalúa automáticamente lo que quedó pendiente y recalcula el puntaje en vivo.
function PRUEBA_f2_paso5_autoevaluar() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  PRUEBA_f2_validarColumnas_();
  PRUEBA_dataEnsureColumns_('live_evaluations', ['rubrica', 'comments']);
  const works = {};
  getSheetData(db, 'works').forEach(w => { works[String(w.id)] = w; });
  const pendientes = PRUEBA_f2_pendientes_(db);
  if (!pendientes.length) {
    Logger.log('Paso 5 · no hay evaluaciones pendientes.');
    return { evaluadas: 0 };
  }
  const now = new Date();
  const nuevas = pendientes.map((a, i) => {
    const work = works[String(a.work_id)] || {};
    const score = PRUEBA_f2_score_(work, a.evaluator_id);
    return {
      id: PRUEBA_dataId_('EVAL-F2', 'AUTO', i + 1),
      work_id: a.work_id,
      evaluator_id: a.evaluator_id,
      total_score: score,
      rubrica: PRUEBA_dataEvalRubric_(score, work.status === 'accepted_oral' ? 'oral' : 'cartel'),
      comments: 'Evaluación ficticia automática para simulacro.',
      timestamp: new Date(now.getTime() - (pendientes.length - i) * 60000)
    };
  });
  PRUEBA_dataAppend_('live_evaluations', nuevas);

  // Marcar las asignaciones como completadas.
  const sheet = db.getSheetByName('live_assignments');
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const idIdx = headers.indexOf('id');
  const statusIdx = headers.indexOf('status');
  const compIdx = headers.indexOf('completed_at');
  const pendIds = {};
  pendientes.forEach(a => { pendIds[String(a.id)] = true; });
  for (let i = 1; i < data.length; i++) {
    if (pendIds[String(data[i][idIdx])]) {
      if (statusIdx > -1) sheet.getRange(i + 1, statusIdx + 1).setValue('completed');
      if (compIdx > -1) sheet.getRange(i + 1, compIdx + 1).setValue(new Date());
    }
  }

  // Recalcular live_score como lo hace submitLiveEvaluation (promedio de evaluaciones).
  const afectados = {};
  pendientes.forEach(a => { afectados[String(a.work_id)] = true; });
  Object.keys(afectados).forEach(workId => {
    const workEvals = getSheetData(db, 'live_evaluations').filter(e => String(e.work_id) === workId);
    if (!workEvals.length) return;
    const avg = (workEvals.reduce((s, c) => s + Number(c.total_score), 0) / workEvals.length).toFixed(2);
    updateRow(db, 'works', 'id', workId, { live_score: avg });
  });

  Logger.log('Paso 5 · evaluaciones automáticas: %s. Puntaje en vivo actualizado en %s trabajos.',
    nuevas.length, Object.keys(afectados).length);
  return { evaluadas: nuevas.length };
}

// Paso 6: muestra los ganadores (oral top 3 general, cartel top 3 por facultad).
function PRUEBA_f2_paso6_ganadores() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const { oral, poster } = obtenerGanadores(db);
  Logger.log('Paso 6 · ganadores');
  Logger.log('  Ponencia Oral (general):');
  oral.forEach((w, i) => Logger.log('    %s. %s — %s pts — %s', i + 1, w.short_id, w.live_score, w.title));
  const byFac = {};
  poster.forEach(w => { (byFac[w.facultad_key] = byFac[w.facultad_key] || []).push(w); });
  Object.keys(byFac).forEach(key => {
    Logger.log('  Cartel %s:', key);
    byFac[key].forEach((w, i) => Logger.log('    %s. %s — %s pts — %s', i + 1, w.short_id, w.live_score, w.title));
  });
  return { oral: oral.length, poster: poster.length };
}

function PRUEBA_f2_estado() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const demoIds = PRUEBA_f2_demoWorkIds_(db);
  const demo = PRUEBA_f2_trabajosDemo_(db);
  const posters = demo.filter(w => w.status === 'accepted_poster').length;
  const orals = demo.filter(w => w.status === 'accepted_oral').length;
  const evaluadores = getSheetData(db, 'users').filter(u =>
    u.user_type === 'evaluator' && String(u.id).indexOf(PRUEBA_DATA_PREFIX) === 0).length;
  const assigns = getSheetData(db, 'live_assignments').filter(a => demoIds[String(a.work_id)]);
  const evals = getSheetData(db, 'live_evaluations').filter(e => demoIds[String(e.work_id)]);
  const completadas = assigns.filter(a => String(a.status) === 'completed').length;
  const conPuntaje = demo.filter(w => w.live_score !== '' && Number(w.live_score) > 0).length;
  Logger.log('=== Estado Fase 2 ===');
  Logger.log('Evaluadores demo: %s', evaluadores);
  Logger.log('Trabajos demo: %s (%s carteles, %s ponencias)', demo.length, posters, orals);
  Logger.log('Asignaciones Fase 2: %s (%s completadas, %s pendientes)', assigns.length, completadas, assigns.length - completadas);
  Logger.log('Evaluaciones Fase 2: %s · trabajos con puntaje: %s', evals.length, conPuntaje);
  return {
    evaluadores: evaluadores,
    trabajos: demo.length,
    carteles: posters,
    ponencias: orals,
    asignaciones: assigns.length,
    completadas: completadas,
    evaluaciones: evals.length,
    conPuntaje: conPuntaje
  };
}

// Borra evaluaciones de Fase 2 de los trabajos demo y deja las asignaciones como pendientes.
function PRUEBA_f2_reiniciarEvaluaciones() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const demoIds = PRUEBA_f2_demoWorkIds_(db);
  const borradas = PRUEBA_quitarFilas_('live_evaluations', row => !!demoIds[String(row.work_id || '')]);

  const sheet = db.getSheetByName('live_assignments');
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const workIdx = headers.indexOf('work_id');
  const statusIdx = headers.indexOf('status');
  const compIdx = headers.indexOf('completed_at');
  let reset = 0;
  for (let i = 1; i < data.length; i++) {
    if (!demoIds[String(data[i][workIdx])]) continue;
    if (statusIdx > -1) sheet.getRange(i + 1, statusIdx + 1).setValue('assigned');
    if (compIdx > -1) sheet.getRange(i + 1, compIdx + 1).setValue('');
    reset++;
  }

  const wSheet = db.getSheetByName('works');
  const wData = wSheet.getDataRange().getValues();
  const wHeaders = wData[0].map(h => String(h).trim().toLowerCase());
  const widIdx = wHeaders.indexOf('id');
  const scoreIdx = wHeaders.indexOf('live_score');
  let limpiados = 0;
  if (scoreIdx > -1) {
    for (let i = 1; i < wData.length; i++) {
      if (!demoIds[String(wData[i][widIdx])]) continue;
      wSheet.getRange(i + 1, scoreIdx + 1).setValue('');
      limpiados++;
    }
  }
  Logger.log('Reinicio Fase 2 · evaluaciones borradas: %s · asignaciones reiniciadas: %s · puntajes limpiados: %s.',
    borradas, reset, limpiados);
  return { evaluacionesBorradas: borradas, asignacionesReiniciadas: reset, puntajesLimpiados: limpiados };
}

// Prepara todo lo necesario para que el equipo evalúe a mano (pasos 1 a 4).
function PRUEBA_f2_preparar() {
  PRUEBA_f2_paso1_usuarios();
  PRUEBA_f2_paso2_trabajos();
  PRUEBA_f2_paso3_asignar();
  PRUEBA_f2_paso4_pendientes();
  return PRUEBA_f2_estado();
}

// Completa lo que falte y muestra ganadores (pasos 5 y 6).
function PRUEBA_f2_finalizar() {
  PRUEBA_f2_paso5_autoevaluar();
  PRUEBA_f2_paso6_ganadores();
  return PRUEBA_f2_estado();
}

// Menú opcional en la hoja para ejecutar las etapas sin abrir el editor.
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('🔬 Simulacro Fase 2')
      .addItem('Estado', 'PRUEBA_f2_estado')
      .addSeparator()
      .addItem('Paso 1 · Crear usuarios', 'PRUEBA_f2_paso1_usuarios')
      .addItem('Paso 2 · Crear trabajos (13 carteles + 2 ponencias)', 'PRUEBA_f2_paso2_trabajos')
      .addItem('Paso 3 · Asignar a evaluadores', 'PRUEBA_f2_paso3_asignar')
      .addItem('Paso 4 · Ver pendientes', 'PRUEBA_f2_paso4_pendientes')
      .addItem('Paso 5 · Evaluar lo que falta', 'PRUEBA_f2_paso5_autoevaluar')
      .addItem('Paso 6 · Ver ganadores', 'PRUEBA_f2_paso6_ganadores')
      .addSeparator()
      .addItem('Preparar todo (1–4)', 'PRUEBA_f2_preparar')
      .addItem('Finalizar (5–6)', 'PRUEBA_f2_finalizar')
      .addItem('Reiniciar evaluaciones', 'PRUEBA_f2_reiniciarEvaluaciones')
      .addSeparator()
      .addItem('Limpiar simulacro', 'PRUEBA_limpiar')
      .addToUi();
  } catch (err) {
    Logger.log('No se pudo crear el menú de simulacro: %s', err.message);
  }
}

// --- Limpieza ---

function PRUEBA_quitarFilas_(sheetName, shouldDelete) {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = db.getSheetByName(sheetName);
  if (!sheet) return 0;
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return 0;
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  let removed = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    const row = {};
    headers.forEach((h, j) => { row[h] = data[i][j]; });
    if (shouldDelete(row)) {
      sheet.deleteRow(i + 1);
      removed++;
    }
  }
  return removed;
}

function PRUEBA_limpiarDatos() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const workRows = getSheetData(db, 'works');
  const testWorkIds = {};
  const testWorkShortIds = {};
  const testFileIds = {};
  const testEmails = {};
  getSheetData(db, 'users').forEach(user => {
    if (String(user.id || '').indexOf(PRUEBA_DATA_PREFIX) === 0 && user.email) testEmails[String(user.email)] = true;
  });
  workRows.forEach(w => {
    const id = String(w.id || '');
    if (PRUEBA_f2_esTrabajoDemo_(w)) {
      testWorkIds[id] = true;
      if (w.short_id) testWorkShortIds[String(w.short_id)] = true;
      if (w.file_id) testFileIds[String(w.file_id)] = true;
      if (w.presentation_file_id) testFileIds[String(w.presentation_file_id)] = true;
    }
  });
  const isTestWork = workId => !!testWorkIds[String(workId || '')];
  const isSeedId = id => String(id || '').indexOf(PRUEBA_DATA_PREFIX) === 0;
  let removed = 0;

  removed += PRUEBA_quitarFilas_('works', PRUEBA_f2_esTrabajoDemo_);

  ['assignments', 'evaluations', 'live_assignments', 'live_evaluations', 'reassign_log'].forEach(name => {
    removed += PRUEBA_quitarFilas_(name, row => isTestWork(row.work_id) || isSeedId(row.id));
  });
  removed += PRUEBA_quitarFilas_('users', row => isSeedId(row.id));
  removed += PRUEBA_quitarFilas_('live_evaluator_status', row => isSeedId(row.evaluator_id));
  removed += PRUEBA_quitarFilas_('help_requests', row => isSeedId(row.evaluator_id) || isSeedId(row.id));
  removed += PRUEBA_quitarFilas_('push_subscriptions', row => isSeedId(row.admin_user_id));
  removed += PRUEBA_quitarFilas_('certificates', row => isSeedId(row.user_id) || isSeedId(row.id));
  removed += PRUEBA_quitarFilas_('reset_tokens', row => !!testEmails[String(row.email || '')]);

  if (PRUEBA_driveConfigSeguro_()) {
    Object.keys(testFileIds).forEach(fileId => {
      try {
        const file = DriveApp.getFileById(fileId);
        const parents = file.getParents();
        let belongsToTestFolder = false;
        while (parents.hasNext()) {
          if (String(parents.next().getId()) === String(DRIVE_FOLDER_ID)) belongsToTestFolder = true;
        }
        if (belongsToTestFolder) { file.setTrashed(true); removed++; }
      } catch (err) {
        Logger.log('No se pudo mover el archivo demo %s a la papelera: %s', fileId, err.message);
      }
    });

    if (PRUEBA_CERT_FOLDER_ID !== 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_DE_PRUEBA') {
      const folder = DriveApp.getFolderById(PRUEBA_CERT_FOLDER_ID);
      const files = folder.getFiles();
      while (files.hasNext()) {
        const file = files.next();
        const name = String(file.getName() || '');
        const belongsToDemoWork = Object.keys(testWorkShortIds).some(shortId => name.indexOf(shortId) > -1);
        if (name.indexOf(PRUEBA_MARK) === 0 || belongsToDemoWork) {
          file.setTrashed(true);
          removed++;
        }
      }
    }
  }

  Logger.log('Filas/archivos ficticios eliminados del clon: %s', removed);
  return removed;
}

function PRUEBA_limpiar() {
  PRUEBA_limpiarDatos();
  Logger.log('Limpieza completa.');
}
