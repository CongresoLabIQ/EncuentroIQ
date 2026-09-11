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

// --- Limpieza ---

function PRUEBA_limpiar() {
  const db = SpreadsheetApp.getActiveSpreadsheet();

  const sheet = db.getSheetByName('works');
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const idIdx = headers.indexOf('id');
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idIdx]).indexOf(PRUEBA_MARK) === 0) {
      sheet.deleteRow(i + 1);
      Logger.log('Trabajo de prueba eliminado: %s', data[i][idIdx]);
    }
  }

  const la = db.getSheetByName('live_assignments');
  if (la) {
    const ldata = la.getDataRange().getValues();
    const lh = ldata[0].map(h => String(h).trim().toLowerCase());
    const wIdx = lh.indexOf('work_id');
    for (let i = ldata.length - 1; i >= 1; i--) {
      if (String(ldata[i][wIdx]).indexOf(PRUEBA_MARK) === 0) {
        la.deleteRow(i + 1);
        Logger.log('Asignación de prueba eliminada para work_id=%s', ldata[i][wIdx]);
      }
    }
  }

  if (PRUEBA_CERT_FOLDER_ID.indexOf('PEGA_AQUI') !== 0) {
    const folder = DriveApp.getFolderById(PRUEBA_CERT_FOLDER_ID);
    const files = folder.getFiles();
    let n = 0;
    while (files.hasNext()) { files.next().setTrashed(true); n++; }
    Logger.log('Constancias de prueba movidas a la papelera: %s', n);
  }
  Logger.log('Limpieza completa.');
}
