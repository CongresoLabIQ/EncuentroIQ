const DRIVE_FOLDER_ID = '1L9IHjQpTBVgb5TC0cD-OB2pkrRRNKm_o';
const TEMPLATE_ID = '1DNdoBL30o2hG77INqP4shV9Dtv-77yWyaIhnnKPT6j0';
const CERTIFICATES_FOLDER_ID = '1A6ZuVHobxHtu3S3incdUk_HAbTMrrHGc';
const FRONTEND_URL = 'https://congresolabiq.github.io/EncuentroIQ';
const RESET_TOKEN_EXPIRY_HOURS = 1;

// --- FUNCIONES DE ENTRADA (GET) ---

function doGet(e) {
  const action = e.parameter.action;
  const db = SpreadsheetApp.getActiveSpreadsheet();
  let result = {};

  try {
    if (action === 'getWorks') {
      const works = getSheetData(db, 'works');
      const users = getSheetData(db, 'users');
      const data = works.map(w => ({
        ...w,
        student_name: (users.find(u => u.id === w.student_id) || {}).name || 'Desconocido'
      }));
      result = { success: true, data: data };
    }
    else if (action === 'getStudentWorks') {
      const studentId = e.parameter.studentId;
      const works = getSheetData(db, 'works');
      const data = works.filter(w => w.student_id === studentId);
      result = { success: true, data: data };
    }
    else if (action === 'getEvaluators') {
      const users = getSheetData(db, 'users');
      result = { success: true, data: users.filter(u => u.user_type === 'evaluator') };
    }
    else if (action === 'getAssignments') {
      const assignments = getSheetData(db, 'assignments');
      const works = getSheetData(db, 'works');
      const users = getSheetData(db, 'users');
      const evaluations = getSheetData(db, 'evaluations'); 

      const enriched = assignments.map(a => {
        const work = works.find(w => w.id === a.work_id);
        const evaluator = users.find(u => u.id === a.evaluator_id);
        const evalDoc = evaluations.find(e => e.work_id === a.work_id && e.evaluator_id === a.evaluator_id);
        return {
          ...a,
          works: { ...work },
          user_profiles: evaluator,
          total_score: evalDoc ? evalDoc.total_score : null,
          evaluation: evalDoc || null
        };
      });
      result = { success: true, data: enriched };
    }
    else if (action === 'getLiveAssignments') {
      const assignments = getSheetData(db, 'live_assignments');
      const works = getSheetData(db, 'works');
      const users = getSheetData(db, 'users');
      const liveEvals = getSheetData(db, 'live_evaluations');
      const enriched = assignments.map(a => {
        const work = works.find(w => w.id === a.work_id);
        const student = work ? users.find(u => u.id === work.student_id) : null;
        const myEval = liveEvals.find(e => e.work_id === a.work_id && e.evaluator_id === a.evaluator_id);
        return {
          ...a,
          works: { ...work, student_name: student ? student.name : '' },
          evaluation: myEval || null
        };
      });
      result = { success: true, data: enriched };
    }
    else if (action === 'getProfessorsBySemester') {
       const semester = e.parameter.semester;
       const professors = getSheetData(db, 'catalog_professors');
       const filtered = professors.filter(p => p.semester === semester);
       result = { success: true, data: filtered };
    }
    else if (action === 'getWinners') {
      const works = getSheetData(db, 'works');
      const users = getSheetData(db, 'users');
      const scoredWorks = works.filter(w => w.live_score !== "" && Number(w.live_score) > 0).map(w => ({
          ...w, student_name: (users.find(u => u.id === w.student_id) || {}).name || 'N/A'
      }));
      const oral = scoredWorks.filter(w => w.status === 'accepted_oral').sort((a, b) => b.live_score - a.live_score).slice(0, 3);
      const poster = scoredWorks.filter(w => w.status === 'accepted_poster').sort((a, b) => b.live_score - a.live_score).slice(0, 3);
      result = { success: true, data: { oral, poster } };
    }
    else if (action === 'getLiveAdminDashboard') {
      assertAdmin(db, e.parameter.admin_user_id);
      const works = getSheetData(db, 'works');
      const users = getSheetData(db, 'users');
      const assignments = getSheetData(db, 'assignments');
      const liveAssignments = getSheetData(db, 'live_assignments');
      const evaluations = getSheetData(db, 'evaluations');
      const liveEvals = getSheetData(db, 'live_evaluations');
      let statuses = [];
      try { statuses = getSheetData(db, 'live_evaluator_status'); } catch (err) { statuses = []; }
      let helpRequests = [];
      try { helpRequests = getSheetData(db, 'help_requests'); } catch (err) { helpRequests = []; }

      const now = Date.now();
      const INACTIVO_MS = 5 * 60 * 1000;

      const evaluators = users.filter(u => u.user_type === 'evaluator').map(u => {
        const row = statuses.find(s => String(s.evaluator_id) === String(u.id)) || {};
        const lastAct = row.last_activity ? new Date(row.last_activity).getTime() : 0;
        const phase1Done = evaluations.filter(e => String(e.evaluator_id) === String(u.id)).length;
        const phase2Done = liveEvals.filter(e => String(e.evaluator_id) === String(u.id)).length;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          facultad: u.facultad || '',
          status: row.status || EV_STATUS.AVAILABLE,
          last_activity: row.last_activity || null,
          lastActivityMs: lastAct || 0,
          updated_at: row.updated_at || null,
          activeRecently: !!lastAct && (now - lastAct < INACTIVO_MS),
          phase1Done,
          phase2Done,
          totalDone: phase1Done + phase2Done,
          assignedCount: assignments.filter(a => String(a.evaluator_id) === String(u.id)).length + liveAssignments.filter(a => String(a.evaluator_id) === String(u.id)).length
        };
      });

      const worksWithNames = works.map(w => ({
        ...w,
        student_name: (users.find(u => u.id === w.student_id) || {}).name || 'Desconocido'
      }));

      result = {
        success: true,
        data: {
          works: worksWithNames,
          evaluators,
          liveAssignments,
          helpRequests: helpRequests.filter(h => h.status === 'pending'),
          serverTime: now
        }
      };
    }
    else if (action === 'getPendingHelpSummary') {
      const requests = getSheetData(db, 'help_requests').filter(r => r.status === 'pending');
      const last = requests[requests.length - 1] || null;
      result = {
        success: true,
        data: {
          count: requests.length,
          lastMessage: last ? String(last.message || '') : '',
          evaluators: last ? String(last.evaluator_name || '') : ''
        }
      };
    }
  } catch (error) {
    result = { success: false, error: error.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// --- LOGICA DE APOYO ---

function tieneConflictoDeFacultad(work, evaluator) {
  if (!work || !evaluator) return false;
  const wFac = String(work.facultad || '').trim().toUpperCase();
  const eFac = String(evaluator.facultad || '').trim().toUpperCase();
  return wFac !== '' && eFac !== '' && wFac === eFac;
}

function esAutoEvaluacion(work, evaluator) {
  if (!work || !evaluator) return false;
  const nombreEv = String(evaluator.name).trim().toUpperCase();
  return String(work.profesor_cargo || '').split(',').some(n => String(n).trim().toUpperCase() === nombreEv);
}

function generarShortId(db, facultad) {
  const fac = String(facultad || '').trim().toLowerCase();
  let prefijo;
  if (fac.includes('zaragoza')) prefijo = 'FZ';
  else if (fac.includes('cuautitlan') || fac.includes('cuautitlán')) prefijo = 'FC';
  else if (fac.includes('quimica') || fac.includes('química')) prefijo = 'FQ';
  else prefijo = 'FX';
  const works = getSheetData(db, 'works');
  const total = works.filter(w => {
    const wf = String(w.facultad || '').trim().toLowerCase();
    return (prefijo === 'FZ' && wf.includes('zaragoza')) ||
           (prefijo === 'FC' && (wf.includes('cuautitlan') || wf.includes('cuautitlán'))) ||
           (prefijo === 'FQ' && (wf.includes('quimica') || wf.includes('química'))) ||
           (prefijo === 'FX' && !wf.includes('zaragoza') && !wf.includes('cuautitlan') && !wf.includes('cuautitlán') && !wf.includes('quimica') && !wf.includes('química'));
  }).length;
  return prefijo + (total + 1).toString().padStart(2, '0');
}

function hashPassword(password) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  return digest.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function obtenerFechaEvento() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = db.getSheetByName('config');
  if (configSheet) {
    const data = configSheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === 'event_date') {
        return String(data[i][1]).trim();
      }
    }
  }
  return '23 de octubre de 2026';
}

function obtenerCodigoEvaluador() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = db.getSheetByName('config');
  if (configSheet) {
    const data = configSheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === 'evaluator_code') {
        return String(data[i][1]).trim().toLowerCase();
      }
    }
  }
  return 'zaragoza';
}

function getConfigValue(key, defaultValue) {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = db.getSheetByName('config');
  if (configSheet) {
    const data = configSheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      const k = String(data[i][0] || '').trim().toLowerCase();
      const v = data[i][1];
      if (k === key && v !== '' && v !== null && v !== undefined) return String(v);
    }
  }
  return defaultValue;
}

function shuffleArray(array) {
  let shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// --- POST ---

function doPost(e) {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  let result = {};
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'login') {
      const users = getSheetData(db, 'users');
      const hashedInput = hashPassword(data.password);
      const user = users.find(u => {
        if (u.email !== data.email) return false;
        const stored = String(u.password).replace(/^'/, '');
        if (stored === hashedInput) return true;
        if (stored === data.password) {
          const h = db.getSheetByName('users').getDataRange().getValues()[0].map(h => String(h).trim().toLowerCase());
          const pwdIdx = h.indexOf('password');
          if (pwdIdx > -1) {
            const sheet = db.getSheetByName('users');
            const dataRows = sheet.getDataRange().getValues();
            for (let i = 1; i < dataRows.length; i++) {
              if (String(dataRows[i][h.indexOf('id')]) === String(u.id)) {
                sheet.getRange(i + 1, pwdIdx + 1).setValue("'" + hashedInput);
                break;
              }
            }
          }
          return true;
        }
        return false;
      });
      if (user) {
        result = { success: true, data: { user: { id: user.id }, profile: user } };
      } else {
        result = { success: false, error: 'Credenciales inválidas' };
      }
    }

    else if (data.action === 'register') {
      const uSheet = db.getSheetByName('users');
      const uData = getSheetData(db, 'users');
      if (uData.find(u => u.email === data.email)) throw new Error('Email ya registrado');

      // Validar código de evaluador en backend
      if (data.user_type === 'evaluator') {
        const validCode = obtenerCodigoEvaluador();
        if (!data.admin_code || String(data.admin_code).toLowerCase() !== validCode) {
          throw new Error('Código de acceso docente incorrecto.');
        }
      }

      const id = Utilities.getUuid();
      const h = uSheet.getDataRange().getValues()[0].map(h => String(h).trim().toLowerCase());
      const row = new Array(h.length).fill("");
      row[h.indexOf('id')] = id;
      row[h.indexOf('email')] = data.email;
      row[h.indexOf('password')] = "'" + hashPassword(data.password);
      row[h.indexOf('name')] = data.name;
      row[h.indexOf('user_type')] = data.user_type;
      row[h.indexOf('timestamp')] = new Date();
      if (h.indexOf('grupos_imparte') > -1) row[h.indexOf('grupos_imparte')] = "";
      if (h.indexOf('facultad') > -1) row[h.indexOf('facultad')] = data.facultad || "";
      uSheet.appendRow(row);
      result = { success: true };
    }

    else if (data.action === 'submitWork') {
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const blob = Utilities.newBlob(Utilities.base64Decode(data.fileBase64), 'application/pdf', data.fileName);
      const file = folder.createFile(blob);
      let fileUrl = "";
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fileUrl = file.getUrl();
      } catch(e) { fileUrl = "https://drive.google.com/open?id=" + file.getId(); }

      const wSheet = db.getSheetByName('works');
      const h = wSheet.getDataRange().getValues()[0].map(h => String(h).trim().toLowerCase());
      const row = new Array(h.length).fill("");
      const sId = generarShortId(db, data.facultad);
      
      row[h.indexOf('id')] = Utilities.getUuid();
      row[h.indexOf('short_id')] = sId;
      row[h.indexOf('student_id')] = data.student_id;
      row[h.indexOf('title')] = data.title;
      row[h.indexOf('abstract')] = data.abstract;
      row[h.indexOf('modality')] = "Pendiente";
      row[h.indexOf('file_url')] = fileUrl;
      row[h.indexOf('file_id')] = file.getId();
      row[h.indexOf('status')] = 'pending';
      row[h.indexOf('submitted_at')] = new Date();
      row[h.indexOf('semester')] = data.semester;
      row[h.indexOf('team_members')] = data.team_members;
      if (h.indexOf('facultad') > -1) row[h.indexOf('facultad')] = data.facultad || "";
      if (h.indexOf('profesor_cargo') > -1) row[h.indexOf('profesor_cargo')] = data.professor_cargo;
      
      wSheet.appendRow(row);
      SpreadsheetApp.flush();
      result = { success: true, shortId: sId };
    }

    else if (data.action === 'assignWork') {
      const work = getSheetData(db, 'works').find(w => w.id === data.work_id);
      const ev = getSheetData(db, 'users').find(u => u.id === data.evaluator_id);
      
      const esAutoEval = esAutoEvaluacion(work, ev);

      if (tieneConflictoDeFacultad(work, ev) || esAutoEval) {
        result = { success: false, error: `Conflicto: El evaluador pertenece a la misma facultad que el autor del trabajo.` };
      } else {
        db.getSheetByName('assignments').appendRow([Utilities.getUuid(), data.work_id, data.evaluator_id, 'assigned', new Date(), '']);
        updateRow(db, 'works', 'id', data.work_id, { status: 'under_review' });
        result = { success: true };
      }
    }

    else if (data.action === 'assignAllPending') {
      const works = getSheetData(db, 'works');
      const evaluators = getSheetData(db, 'users').filter(u => u.user_type === 'evaluator');
      const assigns = getSheetData(db, 'assignments');
      const sheet = db.getSheetByName('assignments');
      let workload = {};
      evaluators.forEach(ev => workload[ev.id] = assigns.filter(a => a.evaluator_id === ev.id).length);
      
      let count = 0;
      works.filter(w => w.status === 'pending').forEach(work => {
        let aptos = evaluators.filter(ev => {
          return !tieneConflictoDeFacultad(work, ev) && !esAutoEvaluacion(work, ev);
        });

        if (aptos.length < 2) return; 

        aptos.sort((a, b) => workload[a.id] - workload[b.id]).slice(0, 3).forEach(ev => {
          sheet.appendRow([Utilities.getUuid(), work.id, ev.id, 'assigned', new Date(), '']);
          workload[ev.id]++;
        });
        updateRow(db, 'works', 'id', work.id, { status: 'under_review' });
        count++;
      });
      result = { success: true, count: count };
    }

    else if (data.action === 'submitEvaluation') {
      const eSheet = db.getSheetByName('evaluations');
      const h = eSheet.getDataRange().getValues()[0].map(h => String(h).trim().toLowerCase());
      const row = new Array(h.length).fill("");
      row[h.indexOf('id')] = Utilities.getUuid();
      row[h.indexOf('work_id')] = data.work_id;
      row[h.indexOf('evaluator_id')] = data.evaluator_id;
      row[h.indexOf('total_score')] = data.total_score;
      row[h.indexOf('comentarios')] = data.comentarios;
      row[h.indexOf('timestamp')] = new Date();
      if (h.indexOf('score_pertinencia') > -1) row[h.indexOf('score_pertinencia')] = data.score_pertinencia;
      if (h.indexOf('cumple_extension') > -1) row[h.indexOf('cumple_extension')] = data.cumple_extension === false ? 'no' : 'si';
      
      eSheet.appendRow(row);

      if (data.assignment_id) {
        const aSheet = db.getSheetByName('assignments');
        const aData = aSheet.getDataRange().getValues();
        for (let i = 1; i < aData.length; i++) {
          if (aData[i][0] == data.assignment_id) {
            aSheet.getRange(i + 1, 4).setValue('completed');
            aSheet.getRange(i + 1, 6).setValue(new Date());
            break;
          }
        }
      }
      result = { success: true };
    }

    else if (data.action === 'batchFinalize') {
      const wSheet = db.getSheetByName('works');
      const works = getSheetData(db, 'works');
      const evals = getSheetData(db, 'evaluations');
      const users = getSheetData(db, 'users');
      const h = wSheet.getDataRange().getValues()[0].map(h => String(h).trim().toLowerCase());

      const MAX_POR_FACULTAD = 17;
      const ORALES_POR_FACULTAD = 2;

      let workPool = [];

      works.forEach((w, idx) => {
        if (w.status === 'rejected' || w.status === 'accepted_oral' || w.status === 'accepted_poster') return;
        const wEvals = evals.filter(e => e.work_id === w.id);
        if (wEvals.length < 2) return;

        const avgTotal = parseFloat((wEvals.reduce((s, c) => s + Number(c.total_score), 0) / wEvals.length).toFixed(1));
        const fb = wEvals.map((e, i) => `Juez ${i + 1}: ${e.comentarios}`).join('\n\n');

        workPool.push({ rowIndex: idx + 2, ...w, avgScore: avgTotal, feedback: fb });
      });

      let facultadPools = {};
      workPool.forEach(w => {
        const fac = w.facultad || 'Sin Facultad';
        if (!facultadPools[fac]) facultadPools[fac] = [];
        facultadPools[fac].push(w);
      });

      // 1) Selección por facultad: top 17 aceptados, top 2 a ponencia, resto a cartel
      let orales = [];
      Object.keys(facultadPools).forEach(fac => {
        let group = facultadPools[fac].sort((a, b) => b.avgScore - a.avgScore);
        group.forEach((w, i) => {
          if (i < MAX_POR_FACULTAD) {
            if (i < ORALES_POR_FACULTAD) {
              w.fStat = 'accepted_oral';
              orales.push(w);
            } else {
              w.fStat = 'accepted_poster'; w.fAud = ''; w.fHor = 'Sesión Carteles';
            }
          } else {
            w.fStat = 'rejected'; w.fAud = ''; w.fHor = '';
          }
        });
      });

      // 2) Distribuir las 6 ponencias en dos auditorios (3 y 3)
      const salas = ["Auditorio Principal", "UMIEZ"];
      orales.forEach((w, i) => { w.fAud = salas[i % salas.length]; });

      // 3) Horarios de ponencias
      const hInicio = 10, mTurno = 20;
      salas.forEach(sala => {
        shuffleArray(orales.filter(o => o.fAud === sala)).forEach((work, idx) => {
          let totalMins = idx * mTurno;
          work.fHor = (hInicio + Math.floor(totalMins/60)) + ":" + (totalMins % 60).toString().padStart(2,'0');
        });
      });

      workPool.forEach(w => {
        wSheet.getRange(w.rowIndex, h.indexOf('status')+1).setValue(w.fStat);
        wSheet.getRange(w.rowIndex, h.indexOf('final_score')+1).setValue(w.avgScore);
        wSheet.getRange(w.rowIndex, h.indexOf('feedback')+1).setValue(w.feedback);
        if (h.indexOf('auditorio')>-1) wSheet.getRange(w.rowIndex, h.indexOf('auditorio')+1).setValue(w.fAud || "");
        if (h.indexOf('horario')>-1) wSheet.getRange(w.rowIndex, h.indexOf('horario')+1).setValue("'" + (w.fHor || ""));
        
        const student = users.find(u => u.id === w.student_id);
        if (student) {
          let msg = `Dictamen: ${w.fStat}\nLugar: ${w.fAud || 'N/A'}\nHora: ${w.fHor || 'N/A'}\n\nRetroalimentación:\n${w.feedback}`;
          try { MailApp.sendEmail(student.email, "Resultado Encuentro IQ", msg); } catch(e) {}
        }
      });
      result = { success: true };
    }

    else if (data.action === 'notifyJudgesAgenda') {
      const liveAssigns = getSheetData(db, 'live_assignments');
      const works = getSheetData(db, 'works');
      const users = getSheetData(db, 'users');
      users.filter(u => u.user_type === 'evaluator').forEach(ev => {
        const tasks = liveAssigns.filter(a => a.evaluator_id === ev.id);
        if (tasks.length === 0) return;
        const fechaEvento = obtenerFechaEvento();
        let html = `<h2>Agenda para Prof. ${ev.name}</h2><p><strong>Fecha del evento:</strong> ${fechaEvento}</p><table border="1" style="border-collapse:collapse; width:100%;"><tr style="background:#0d6efd; color:white;"><th>Hora</th><th>Lugar</th><th>Trabajo</th></tr>`;
        tasks.forEach(t => {
          const w = works.find(work => work.id === t.work_id);
          if (w) html += `<tr><td>${w.horario || 'N/A'}</td><td>${w.auditorio || 'Carteles'}</td><td><b>${w.short_id}</b> - ${w.title}</td></tr>`;
        });
        html += `</table>`;
        try { MailApp.sendEmail({ to: ev.email, subject: "Agenda de Evaluación - Encuentro IQ", htmlBody: html }); } catch(e) {}
      });
      result = { success: true };
    }

    else if (data.action === 'assignLiveWorks') {
      const works = getSheetData(db, 'works');
      const evaluators = getSheetData(db, 'users').filter(u => u.user_type === 'evaluator');
      const existing = getSheetData(db, 'live_assignments');
      const lSheet = db.getSheetByName('live_assignments');
      let workload = {};
      evaluators.forEach(ev => workload[ev.id] = existing.filter(a => a.evaluator_id === ev.id).length);
      
      const p1 = evaluators.slice(0, Math.ceil(evaluators.length/2)), p2 = evaluators.slice(Math.ceil(evaluators.length/2));
      let count = 0;
      function asignar(lista, w) {
        let aptos = lista.filter(ev => {
           return !tieneConflictoDeFacultad(w, ev) && !esAutoEvaluacion(w, ev);
        });
        aptos.sort((a,b) => workload[a.id] - workload[b.id]).slice(0,3).forEach(ev => {
          lSheet.appendRow([Utilities.getUuid(), w.id, ev.id, 'assigned', new Date(), '']);
          workload[ev.id]++; count++;
        });
      }
      works.filter(w => w.status === 'accepted_oral').forEach(w => { if(!existing.some(a => a.work_id === w.id)) asignar(w.auditorio==='UMIEZ'?p1:p2, w); });
      works.filter(w => w.status === 'accepted_poster').forEach(w => { if(!existing.some(a => a.work_id === w.id)) asignar(evaluators, w); });
      result = { success: true, count: count };
    }

    else if (data.action === 'assignManualLive') {
      const lSheet = db.getSheetByName('live_assignments');
      const existing = getSheetData(db, 'live_assignments');
      if (existing.some(a => a.work_id === data.work_id && a.evaluator_id === data.evaluator_id)) {
        result = { success: false, error: 'Ese juez ya está asignado a ese trabajo.' };
      } else {
        const work = getSheetData(db, 'works').find(w => w.id === data.work_id);
        const ev = getSheetData(db, 'users').find(u => u.id === data.evaluator_id);
        if (!work || !ev) {
          result = { success: false, error: 'Trabajo o evaluador no encontrado.' };
        } else if (tieneConflictoDeFacultad(work, ev) || esAutoEvaluacion(work, ev)) {
          result = { success: false, error: 'Conflicto: El evaluador pertenece a la misma facultad que el autor del trabajo.' };
        } else {
          lSheet.appendRow([Utilities.getUuid(), data.work_id, data.evaluator_id, 'assigned', new Date(), '']);
          result = { success: true };
        }
      }
    }

    else if (data.action === 'submitLiveEvaluation') {
      const evSheet = db.getSheetByName('live_evaluations');
      const headers = evSheet.getDataRange().getValues()[0].map(h => String(h).trim().toLowerCase());
      const fields = {
        id: Utilities.getUuid(),
        work_id: data.work_id,
        evaluator_id: data.evaluator_id,
        total_score: data.total_score,
        s1: data.s1, s2: data.s2, s3: data.s3, s4: data.s4,
        s5: data.s5, s6: data.s6, s7: data.s7, s8: data.s8,
        c1: data.c1, c2: data.c2, c3: data.c3, c4: data.c4,
        c5: data.c5, c6: data.c6, c7: data.c7, c8: data.c8,
        c9: data.c9, c10: data.c10,
        comments: data.comments,
        timestamp: new Date()
      };
      const row = [];
      Object.keys(fields).forEach(k => {
        let idx = headers.indexOf(k);
        if (idx === -1) {
          evSheet.getRange(1, headers.length + 1).setValue(k);
          headers.push(k);
          idx = headers.length - 1;
        }
        row[idx] = fields[k];
      });
      for (let i = 0; i < headers.length; i++) if (row[i] === undefined) row[i] = "";
      evSheet.appendRow(row);

      updateRow(db, 'live_assignments', 'id', data.assignment_id, { status: 'completed', completed_at: new Date() });
      const evs = getSheetData(db, 'live_evaluations').filter(e => e.work_id === data.work_id);
      const avg = (evs.reduce((s, c) => s + Number(c.total_score), 0) / evs.length).toFixed(2);
      updateRow(db, 'works', 'id', data.work_id, { live_score: avg });
      result = { success: true };
    }

    else if (data.action === 'registerActivity') {
      const evaluator = assertUser(db, data.user_id);
      registerEvaluatorActivity(db, evaluator.id, data.status || EV_STATUS.AVAILABLE);
      result = { success: true };
    }

    else if (data.action === 'setEvaluatorStatus') {
      assertAdmin(db, data.admin_user_id);
      if (!data.evaluator_id) throw new Error('Falta evaluator_id');
      const valid = ['available', 'busy', 'absent', 'finished'];
      if (!valid.includes(data.status)) throw new Error('Estado inválido');
      setEvaluatorStatusInternal(db, data.evaluator_id, data.status);
      result = { success: true };
    }

    else if (data.action === 'markEvaluatorAbsent') {
      assertAdmin(db, data.admin_user_id);
      if (!data.evaluator_id) throw new Error('Falta evaluator_id');
      setEvaluatorStatusInternal(db, data.evaluator_id, EV_STATUS.ABSENT);
      result = { success: true };
    }

    else if (data.action === 'reactivateEvaluator') {
      assertAdmin(db, data.admin_user_id);
      if (!data.evaluator_id) throw new Error('Falta evaluator_id');
      setEvaluatorStatusInternal(db, data.evaluator_id, EV_STATUS.AVAILABLE);
      result = { success: true };
    }

    else if (data.action === 'requestHelp') {
      const evaluator = assertUser(db, data.user_id);
      addHelpRequest(db, evaluator, (data.message || '').toString().substring(0, 500));
      try { sendHelpPushToAdmins(db, (data.message || '').toString().substring(0, 500), evaluator.name); }
      catch (e) { Logger.log('sendHelpPushToAdmins error: ' + e.message); }
      result = { success: true };
    }

    else if (data.action === 'registerPushSubscription') {
      const admin = assertAdmin(db, data.admin_user_id);
      const sub = data.subscription;
      if (!sub || !sub.endpoint) throw new Error('Suscripción inválida');
      const sheet = getPushSubscriptionSheet(db);
      const rows = sheet.getDataRange().getValues();
      const headers = rows[0];
      const idIdx = headers.indexOf('admin_user_id');
      let updated = false;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][idIdx]) === String(admin.id)) {
          sheet.getRange(i + 1, headers.indexOf('endpoint') + 1).setValue(sub.endpoint);
          sheet.getRange(i + 1, headers.indexOf('keys_p256dh') + 1).setValue(sub.keys && sub.keys.p256dh || '');
          sheet.getRange(i + 1, headers.indexOf('keys_auth') + 1).setValue(sub.keys && sub.keys.auth || '');
          sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(new Date());
          updated = true;
          break;
        }
      }
      if (!updated) {
        sheet.appendRow([admin.id, sub.endpoint, sub.keys && sub.keys.p256dh || '', sub.keys && sub.keys.auth || '', new Date()]);
      }
      result = { success: true };
    }

    else if (data.action === 'testPushToAdmins') {
      assertAdmin(db, data.admin_user_id);
      const privateKey = getConfigValue('vapid_private', '');
      const publicKey = getConfigValue('vapid_public', '');
      if (!privateKey || !publicKey) throw new Error('Llaves VAPID no configuradas. Ejecuta ESCRIBIR_LLAVES_VAPID()');
      const subs = getPushSubscriptionSheet(db).getDataRange().getValues();
      const headers = subs[0];
      const endpointIdx = headers.indexOf('endpoint');
      const now = Math.floor(Date.now() / 1000);
      const ttl = 3600;
      const results = [];
      for (let i = 1; i < subs.length; i++) {
        const endpoint = String(subs[i][endpointIdx] || '');
        if (!endpoint) continue;
        results.push(pushToEndpoint(endpoint, publicKey, privateKey, now, ttl));
      }
      result = { success: true, date: new Date(), results };
    }

    else if (data.action === 'resolveHelpRequest') {
      assertAdmin(db, data.admin_user_id);
      const sheet = getHelpSheet(db);
      const dataRows = sheet.getDataRange().getValues();
      const headers = dataRows[0];
      const idIdx = headers.indexOf('id');
      const stIdx = headers.indexOf('status');
      const raIdx = headers.indexOf('resolved_at');
      const rbIdx = headers.indexOf('resolved_by');
      for (let i = 1; i < dataRows.length; i++) {
        if (String(dataRows[i][idIdx]) === String(data.request_id)) {
          const status = data.status === 'resolved' ? 'resolved' : 'acknowledged';
          sheet.getRange(i + 1, stIdx + 1).setValue(status);
          if (status === 'resolved' && raIdx > -1) sheet.getRange(i + 1, raIdx + 1).setValue(new Date());
          if (rbIdx > -1) sheet.getRange(i + 1, rbIdx + 1).setValue(data.admin_user_id);
          break;
        }
      }
      result = { success: true };
    }

    else if (data.action === 'reassignLiveEvaluator') {
      assertAdmin(db, data.admin_user_id);
      const work_id = data.work_id;
      const old_ev = data.old_evaluator_id;
      const new_ev = data.new_evaluator_id;
      if (!work_id || !old_ev || !new_ev) throw new Error('Faltan datos de reasignación');

      const work = getSheetData(db, 'works').find(w => w.id === work_id);
      const oldEvaluator = getSheetData(db, 'users').find(u => u.id === old_ev);
      const newEvaluator = getSheetData(db, 'users').find(u => u.id === new_ev);
      if (!work || !newEvaluator) throw new Error('Trabajo o evaluador nuevo no encontrado');

      if (tieneConflictoDeFacultad(work, newEvaluator)) {
        throw new Error('Conflicto: El nuevo evaluador pertenece a la misma facultad que el autor del trabajo.');
      }
      if (esAutoEvaluacion(work, newEvaluator)) {
        throw new Error('Conflicto: El nuevo evaluador es el profesor del autor del trabajo.');
      }

      const lSheet = db.getSheetByName('live_assignments');
      const lData = lSheet.getDataRange().getValues();
      const lHeaders = lData[0];
      const idIdx = lHeaders.indexOf('id');
      const wIdx = lHeaders.indexOf('work_id');
      const eIdx = lHeaders.indexOf('evaluator_id');

      // Marcar la asignación del evaluador antiguo como reasignada/reemplazada
      for (let i = 1; i < lData.length; i++) {
        if (String(lData[i][wIdx]) === String(work_id) && String(lData[i][eIdx]) === String(old_ev)) {
          lSheet.getRange(i + 1, eIdx + 1).setValue(new_ev);
          break;
        }
      }

      // Si el evaluador ausente era el único y no se encontró coincidencia, crear nueva asignación
      const finalData = lSheet.getDataRange().getValues();
      const exists = finalData.some(r => String(r[wIdx]) === String(work_id) && String(r[eIdx]) === String(new_ev));
      if (!exists) {
        lSheet.appendRow([Utilities.getUuid(), work_id, new_ev, 'assigned', new Date(), '']);
      }

      // Si el evaluador ausente está marcado absent, pasar a finished (tras ser sustituido)
      const statusRow = getEvaluatorStatusSheet(db).getDataRange().getValues();
      const sh = getEvaluatorStatusSheet(db).getDataRange();
      for (let i = 1; i < statusRow.length; i++) {
        if (String(statusRow[i][0]) === String(old_ev) && String(statusRow[i][1]) === EV_STATUS.ABSENT) {
          sh.getSheet().getRange(i + 1, 2).setValue(EV_STATUS.FINISHED);
          break;
        }
      }

      logReassign(db, work_id, old_ev, new_ev, data.admin_user_id, data.reason || '');
      result = { success: true };
    }

    else if (data.action === 'generateCertificates') {
      const work = getSheetData(db, 'works').find(w => w.id === data.work_id);
      const prof = work.profesor_cargo || "No asignado";
      const url = crearSlideEditable(work, prof, "Participación");
      result = { success: true, fileUrl: url };
    }

    else if (data.action === 'forgotPassword') {
      const users = getSheetData(db, 'users');
      const user = users.find(u => u.email === data.email);
      if (user) {
        const token = Utilities.getUuid();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
        const sheet = db.getSheetByName('reset_tokens');
        let headers;
        if (!sheet) {
          const newSheet = db.insertSheet('reset_tokens');
          headers = ['token', 'email', 'created_at', 'expires_at', 'used'];
          newSheet.appendRow(headers);
        } else {
          headers = sheet.getDataRange().getValues()[0];
        }
        const row = new Array(headers.length).fill("");
        row[headers.indexOf('token')] = token;
        row[headers.indexOf('email')] = data.email;
        row[headers.indexOf('created_at')] = now;
        row[headers.indexOf('expires_at')] = expiresAt;
        row[headers.indexOf('used')] = 'false';
        sheet.appendRow(row);
        const resetLink = FRONTEND_URL + '/set-new-password.html?token=' + token;
        const subject = 'Recuperación de contraseña - Encuentro IQ';
        const body = 'Hola,\n\nHas solicitado restablecer tu contraseña.\n\nHaz clic en el siguiente enlace para crear una nueva contraseña:\n' + resetLink + '\n\nEste enlace expirará en ' + RESET_TOKEN_EXPIRY_HOURS + ' hora(s).\n\nSi no solicitaste esto, ignora este mensaje.\n\nAtentamente,\nSistema Encuentro IQ';
        try { MailApp.sendEmail(data.email, subject, body); } catch (e) {}
      }
      result = { success: true };
    }

    else if (data.action === 'resetPassword') {
      const sheet = db.getSheetByName('reset_tokens');
      if (!sheet) throw new Error('Token inválido o expirado.');
      const rows = sheet.getDataRange().getValues();
      const headers = rows[0];
      const tIdx = headers.indexOf('token');
      const eIdx = headers.indexOf('email');
      const expIdx = headers.indexOf('expires_at');
      const usedIdx = headers.indexOf('used');
      let foundRow = -1, email = '';
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][tIdx] === data.token && String(rows[i][usedIdx]).toLowerCase() === 'false') {
          const expires = new Date(rows[i][expIdx]);
          if (expires > new Date()) {
            foundRow = i;
            email = rows[i][eIdx];
          }
          break;
        }
      }
      if (foundRow === -1) throw new Error('El enlace ha expirado o ya fue utilizado.');
      const usersSheet = db.getSheetByName('users');
      const userRows = usersSheet.getDataRange().getValues();
      const uHeaders = userRows[0];
      const emailIdx = uHeaders.indexOf('email');
      const pwdIdx = uHeaders.indexOf('password');
      let userFound = false;
      for (let i = 1; i < userRows.length; i++) {
        if (String(userRows[i][emailIdx]).toLowerCase() === String(email).toLowerCase()) {
          usersSheet.getRange(i + 1, pwdIdx + 1).setValue("'" + hashPassword(data.password));
          userFound = true;
          break;
        }
      }
      if (!userFound) throw new Error('Usuario no encontrado.');
      sheet.getRange(foundRow + 1, usedIdx + 1).setValue('true');
      result = { success: true };
    }

  } catch (error) {
    result = { success: false, error: error.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// FUNCIONES DE RECONOCIMIENTOS EDITABLES (12 GANADORES)
// ============================================================

function generarPremiacionMasiva() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const works = getSheetData(db, 'works');
  const scored = works.filter(w => w.live_score && Number(w.live_score) > 0);

  let listaGanadores = [];

  scored.filter(w => w.status === 'accepted_oral').sort((a,b) => b.live_score - a.live_score).slice(0, 3).forEach((w,i) => {
    listaGanadores.push({ w, l: `${i + 1}er Lugar Ponencia Oral` });
  });

  scored.filter(w => w.status === 'accepted_poster').sort((a,b) => b.live_score - a.live_score).slice(0, 3).forEach((w,i) => {
    listaGanadores.push({ w, l: `${i + 1}er Lugar Cartel` });
  });

  listaGanadores.forEach(g => crearSlideEditable(g.w, g.w.profesor_cargo || "No asignado", g.l));
  Logger.log(`✅ ${listaGanadores.length} reconocimientos editables generados.`);
}

function crearSlideEditable(work, profesor, lugarTexto) {
  const folder = DriveApp.getFolderById(CERTIFICATES_FOLDER_ID);
  const copy = DriveApp.getFileById(TEMPLATE_ID).makeCopy(`EDITABLE: ${lugarTexto} - ${work.short_id}`, folder);
  const pres = SlidesApp.openById(copy.getId());
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const hoy = new Date();

  pres.replaceAllText('{{INTEGRANTES}}', work.team_members);
  pres.replaceAllText('{{TITULO}}', work.title);
  pres.replaceAllText('{{PROFESOR}}', profesor);
  pres.replaceAllText('{{MODALIDAD}}', work.status === 'accepted_oral' ? 'Ponencia Oral' : 'Cartel');
  pres.replaceAllText('{{LUGAR}}', lugarTexto);
  pres.replaceAllText('{{FECHA}}', `${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`);
  pres.saveAndClose();
  return copy.getUrl();
}

// --- HELPERS GENERALES ---

function getSheetData(db, name) {
  const sheet = db.getSheetByName(name);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function updateRow(db, sheetName, idCol, idVal, updates) {
  const sheet = db.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIdx = headers.indexOf(idCol);
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIdx] == idVal) {
      Object.keys(updates).forEach(k => {
        const uIdx = headers.indexOf(k);
        if (uIdx > -1) sheet.getRange(i + 1, uIdx + 1).setValue(updates[k]);
      });
      break;
    }
  }
}

// ============================================================
// VALIDACIÓN DE PERMISOS (SERVER-SIDE)
// ============================================================

function getUserById(db, userId) {
  if (!userId) return null;
  return getSheetData(db, 'users').find(x => String(x.id) === String(userId)) || null;
}

function assertAdmin(db, userId) {
  const u = getUserById(db, userId);
  if (!u) throw new Error('No autenticado: usuario no encontrado.');
  if (u.user_type !== 'admin') throw new Error('Permiso denegado: se requiere rol de administrador.');
  return u;
}

function assertUser(db, userId) {
  const u = getUserById(db, userId);
  if (!u) throw new Error('No autenticado: usuario no encontrado.');
  return u;
}

// ============================================================
// ACTIVIDAD DE EVALUADORES (live_evaluator_status)
// ============================================================

const EV_STATUS = { AVAILABLE: 'available', BUSY: 'busy', ABSENT: 'absent', FINISHED: 'finished' };
// Estados "manuales" que NO deben sobreescribirse por automatismo
const EV_MANUAL_STATES = [EV_STATUS.ABSENT, EV_STATUS.FINISHED];

function getEvaluatorStatusSheet(db) {
  let sheet = db.getSheetByName('live_evaluator_status');
  if (!sheet) {
    sheet = db.insertSheet('live_evaluator_status');
    sheet.appendRow(['evaluator_id', 'status', 'last_activity', 'updated_at']);
  }
  return sheet;
}

// Upsert: si no existe el evaluador, lo crea; si existe, actualiza last_activity.
// Nunca sobreescribe un estado manual (absent/finished) sin permiso explícito.
function registerEvaluatorActivity(db, userId, forceStatus) {
  const sheet = getEvaluatorStatusSheet(db);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const eIdx = headers.indexOf('evaluator_id');
  const sIdx = headers.indexOf('status');
  const laIdx = headers.indexOf('last_activity');
  const uaIdx = headers.indexOf('updated_at');
  const now = new Date();

  if (eIdx === -1) throw new Error('live_evaluator_status no tiene la columna evaluator_id');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][eIdx]) === String(userId)) {
      const currentStatus = data[i][sIdx] || EV_STATUS.AVAILABLE;
      const manual = EV_MANUAL_STATES.includes(currentStatus);
      let newStatus = currentStatus;
      if (forceStatus && !manual) newStatus = forceStatus;
      sheet.getRange(i + 1, laIdx + 1).setValue(now);
      sheet.getRange(i + 1, uaIdx + 1).setValue(now);
      sheet.getRange(i + 1, sIdx + 1).setValue(newStatus);
      return;
    }
  }
  // No existe: crear
  sheet.appendRow([userId, forceStatus || EV_STATUS.AVAILABLE, now, now]);
}

function setEvaluatorStatusInternal(db, evaluatorId, status) {
  const sheet = getEvaluatorStatusSheet(db);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const eIdx = headers.indexOf('evaluator_id');
  const sIdx = headers.indexOf('status');
  const uaIdx = headers.indexOf('updated_at');
  const now = new Date();
  if (eIdx === -1) throw new Error('live_evaluator_status no tiene la columna evaluador');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][eIdx]) === String(evaluatorId)) {
      sheet.getRange(i + 1, sIdx + 1).setValue(status);
      sheet.getRange(i + 1, uaIdx + 1).setValue(now);
      return true;
    }
  }
  sheet.appendRow([evaluatorId, status, '', now]);
  return false;
}

// ============================================================
// SOLICITUDES DE AYUDA (help_requests)
// ============================================================

function getHelpSheet(db) {
  let sheet = db.getSheetByName('help_requests');
  if (!sheet) {
    sheet = db.insertSheet('help_requests');
    sheet.appendRow(['id', 'evaluator_id', 'evaluator_name', 'message', 'status', 'created_at', 'resolved_at', 'resolved_by']);
  }
  return sheet;
}

function addHelpRequest(db, evaluator, message) {
  const sheet = getHelpSheet(db);
  sheet.appendRow([Utilities.getUuid(), evaluator.id, evaluator.name, message, 'pending', new Date(), '', '']);
}

// ============================================================
// BITÁCORA DE REASIGNACIÓN (reassign_log)
// ============================================================

function logReassign(db, workId, oldEv, newEv, adminId, reason) {
  let sheet = db.getSheetByName('reassign_log');
  if (!sheet) {
    sheet = db.insertSheet('reassign_log');
    sheet.appendRow(['id', 'work_id', 'old_evaluator_id', 'new_evaluator_id', 'by_admin_id', 'reason', 'timestamp']);
  }
  sheet.appendRow([Utilities.getUuid(), workId, oldEv, newEv, adminId, reason, new Date()]);
}

// ============================================================
// WEB PUSH (VAPID, sin servicios externos)
// ============================================================

// Script una sola vez tras desplegar: guarda las llaves VAPID en la hoja 'config'
function SETUP_VAPID_KEYS(publicKey, privateKey) {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = db.getSheetByName('config');
  if (!sheet) sheet = db.insertSheet('config');
  const rows = sheet.getDataRange().getValues();
  const set = (k, v) => {
    const idx = rows.findIndex(r => String(r[0]).trim().toLowerCase() === k);
    if (idx > -1) sheet.getRange(idx + 1, 2).setValue(v);
    else sheet.appendRow([k, v]);
  };
  set('vapid_public', publicKey);
  set('vapid_private', privateKey);
}

function getPushSubscriptionSheet(db) {
  let sheet = db.getSheetByName('push_subscriptions');
  if (!sheet) {
    sheet = db.insertSheet('push_subscriptions');
    sheet.appendRow(['admin_user_id', 'endpoint', 'keys_p256dh', 'keys_auth', 'created_at', 'updated_at']);
  }
  return sheet;
}

function base64UrlSafe(input, charset) {
  if (Array.isArray(input)) return Utilities.base64EncodeWebSafe(input).replace(/=+$/, '');
  return Utilities.base64EncodeWebSafe(input, charset || Utilities.Charset.UTF_8).replace(/=+$/, '');
}

function urlBase64ToBytes(b64) {
  const s = b64.replace(/-/g, '+').replace(/_/g, '/');
  return Utilities.base64Decode(s).map(x => x & 0xff);
}

// ============================================================
// ECDSA P-256 (ES256) — aritmética decimal-string (sin BigInt)
// La llave privada VAPID se guarda como escalar de 32 bytes en base64url
// ============================================================
const EC_P = '115792089210356248762697446949407573530086143415290314195533631308867097853951';
const EC_N = '115792089210356248762697446949407573529996955224135760342422259061068512044369';
const EC_GX = '48439561293906451759052585252797914202762949526041747995844080717082404635286';
const EC_GY = '36134250956749795798585127919587881956611106672985015071877198253568414405109';

function bnTrim(s) { return s.replace(/^0+(?=\d)/, '') || '0'; }

function bnCmp(a, b) {
  a = bnTrim(a); b = bnTrim(b);
  if (a.length !== b.length) return a.length < b.length ? -1 : 1;
  return a < b ? -1 : (a > b ? 1 : 0);
}

function bnAdd(a, b) {
  let i = a.length - 1, j = b.length - 1, c = 0, r = '';
  while (i >= 0 || j >= 0 || c) {
    const s = (i >= 0 ? a.charCodeAt(i--) - 48 : 0) + (j >= 0 ? b.charCodeAt(j--) - 48 : 0) + c;
    r = (s % 10) + r;
    c = s > 9 ? 1 : 0;
  }
  return r;
}

function bnSub(a, b) {
  let i = a.length - 1, j = b.length - 1, br = 0, r = '';
  while (i >= 0) {
    let d = (a.charCodeAt(i--) - 48) - (j >= 0 ? b.charCodeAt(j--) - 48 : 0) - br;
    if (d < 0) { d += 10; br = 1; } else br = 0;
    r = d + r;
  }
  return bnTrim(r);
}

function bnMul(a, b) {
  if (a === '0' || b === '0') return '0';
  const out = new Array(a.length + b.length).fill(0);
  for (let i = a.length - 1; i >= 0; i--) {
    const da = a.charCodeAt(i) - 48;
    for (let j = b.length - 1; j >= 0; j--) out[i + j + 1] += da * (b.charCodeAt(j) - 48);
  }
  for (let i = out.length - 1; i > 0; i--) { out[i - 1] += Math.floor(out[i] / 10); out[i] %= 10; }
  return bnTrim(out.join(''));
}

function bnDivMod(a, b) {
  if (bnCmp(a, b) < 0) return ['0', a];
  let q = '', r = '';
  for (let i = 0; i < a.length; i++) {
    r = bnTrim(r + a[i]);
    let d = 0;
    while (bnCmp(r, b) >= 0) { r = bnSub(r, b); d++; }
    q += d;
  }
  return [bnTrim(q), bnTrim(r)];
}

function bnMod(a, b) { return bnDivMod(a, b)[1]; }

function bnModSub(a, b, m) {
  return bnCmp(a, b) >= 0 ? bnMod(bnSub(a, b), m) : bnMod(bnSub(m, bnSub(b, a)), m);
}

function bnModInverse(a, m) {
  let r0 = bnMod(a, m), r1 = m, s0 = '1', s1 = '0';
  while (bnCmp(r1, '0') !== 0) {
    const dm = bnDivMod(r0, r1);
    const q = dm[0];
    const oldR1 = r1, oldS1 = s1;
    r1 = dm[1];
    s1 = bnModSub(s0, bnMod(bnMul(q, oldS1), m), m);
    r0 = oldR1; s0 = oldS1;
  }
  return bnMod(s0, m);
}

function bnIsOdd(s) { return (s.charCodeAt(s.length - 1) - 48) % 2 === 1; }

function bnDiv2(s) {
  let c = 0, r = '';
  for (let i = 0; i < s.length; i++) {
    const d = s.charCodeAt(i) - 48 + c * 10;
    r += Math.floor(d / 2);
    c = d % 2;
  }
  return bnTrim(r);
}

function modP(a) { return bnMod(a, EC_P); }

function addP(a, b) { return modP(bnAdd(a, b)); }
function subP(a, b) { return bnModSub(a, b, EC_P); }
function mulP(a, b) { return modP(bnMul(a, b)); }

function ecDouble(x, y) {
  if (y === '0') return null;
  const lam = mulP(subP(mulP('3', mulP(x, x)), '3'), bnModInverse(mulP('2', y), EC_P));
  const x3 = subP(mulP(lam, lam), mulP('2', x));
  const y3 = subP(mulP(lam, subP(x, x3)), y);
  return [x3, y3];
}

function ecAddG(x1, y1) {
  const num = subP(EC_GY, y1);
  const den = subP(EC_GX, x1);
  if (bnCmp(den, '0') === 0) return bnCmp(num, '0') === 0 ? ecDouble(x1, y1) : null;
  const lam = mulP(num, bnModInverse(den, EC_P));
  const x3 = subP(subP(mulP(lam, lam), x1), EC_GX);
  const y3 = subP(mulP(lam, subP(x1, x3)), y1);
  return [x3, y3];
}

function ecMul(kStr) {
  const k = bnMod(kStr, EC_N);
  if (bnCmp(k, '0') === 0) return null;
  const bits = [];
  let t = k;
  while (bnCmp(t, '0') !== 0) { bits.push(bnIsOdd(t)); t = bnDiv2(t); }
  let Q = null;
  for (let i = bits.length - 1; i >= 0; i--) {
    Q = Q === null ? null : ecDouble(Q[0], Q[1]);
    if (bits[i]) Q = Q === null ? [EC_GX, EC_GY] : ecAddG(Q[0], Q[1]);
  }
  return Q;
}

function decToBytes32(v) {
  const bytes = new Array(32).fill(0);
  let s = v, idx = 31;
  while (bnCmp(s, '0') !== 0) {
    const dm = bnDivMod(s, '256');
    bytes[idx--] = parseInt(dm[1], 10);
    s = dm[0];
  }
  return bytes;
}

function bytesToDec(bytes) {
  let s = '0';
  for (let i = 0; i < bytes.length; i++) s = bnAdd(bnMul(s, '256'), String(bytes[i] & 0xff));
  return s;
}

function ecHmacSha256(keyBytes, dataBytes) {
  return Utilities.computeHmacSha256Signature(dataBytes, keyBytes).map(x => x & 0xff);
}

// Nonce determinista RFC 6979 §3.2 (HMAC-DRBG)
function ecNonce(d, digest, attempt) {
  const X = decToBytes32(bnMod(d, EC_N));
  const h1 = decToBytes32(bnMod(bytesToDec(digest), EC_N));
  let V = new Array(32).fill(1);
  let K = new Array(32).fill(0);
  K = ecHmacSha256(K, V.concat([0]).concat(X).concat(h1));
  V = ecHmacSha256(K, V);
  K = ecHmacSha256(K, V.concat([1]).concat(X).concat(h1));
  V = ecHmacSha256(K, V);
  for (let i = 0; i < attempt; i++) {
    K = ecHmacSha256(K, V.concat([0]));
    V = ecHmacSha256(K, V);
  }
  let k = bnMod(bytesToDec(V), EC_N);
  while (bnCmp(k, '0') === 0) {
    K = ecHmacSha256(K, V.concat([0]));
    V = ecHmacSha256(K, V);
    k = bnMod(bytesToDec(V), EC_N);
  }
  return k;
}

// Firma ES256 sobre "header.claims" con el escalar privado VAPID
function signVapidJwt(signingInput, privateKeyB64Url) {
  const d = bytesToDec(urlBase64ToBytes(privateKeyB64Url));
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, signingInput).map(x => x & 0xff);
  const z = bnMod(bytesToDec(digest), EC_N);
  let r = '0', s = '0';
  for (let attempt = 0; attempt < 5; attempt++) {
    const k = ecNonce(d, digest, attempt);
    const R = ecMul(k);
    if (R === null) continue;
    r = bnMod(R[0], EC_N);
    if (bnCmp(r, '0') === 0) continue;
    s = bnMod(bnMul(bnModInverse(k, EC_N), bnMod(bnAdd(z, bnMod(bnMul(r, d), EC_N)), EC_N)), EC_N);
    if (bnCmp(s, '0') === 0) continue;
    break;
  }
  if (bnCmp(s, '0') === 0) throw new Error('No se pudo generar la firma ES256');
  if (bnCmp(s, bnDiv2(EC_N)) > 0) s = bnSub(EC_N, s); // firma low-s (JOSE)
  return base64UrlSafe(decToBytes32(r).concat(decToBytes32(s)));
}

function getEndpointOrigin(endpoint) {
  const s = String(endpoint || '');
  const m = /^(https?):\/\/([^/]+)/.exec(s);
  if (!m) return '';
  return m[1] + '://' + m[2];
}

function pushToEndpoint(endpoint, publicKey, privateKey, now, ttl) {
  try {
    const aud = getEndpointOrigin(endpoint);
    if (!aud) return { endpoint, code: 0, ok: false, error: 'Endpoint inválido' };
    const jwtHeader = base64UrlSafe(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
    const jwtClaims = base64UrlSafe(JSON.stringify({ aud, exp: now + ttl, sub: 'mailto:contacto.encuentroestiq@gmail.com' }));
    const signingInput = jwtHeader + '.' + jwtClaims;
    const jwt = signingInput + '.' + signVapidJwt(signingInput, privateKey);

    const opts = {
      method: 'post',
      headers: { 'Authorization': 'vapid t=' + jwt + ', k=' + publicKey, 'TTL': String(ttl) },
      payload: '',
      contentType: 'text/plain;charset=UTF-8',
      muteHttpExceptions: true
    };
    const res = UrlFetchApp.fetch(endpoint, opts);
    const code = res.getResponseCode();
    return { endpoint, code, ok: code >= 200 && code < 300 };
  } catch (e) {
    return { endpoint, code: 0, ok: false, error: e.message };
  }
}

function sendHelpPushToAdmins(db, message, evaluatorName) {
  const privateKey = getConfigValue('vapid_private', '');
  const publicKey = getConfigValue('vapid_public', '');
  if (!privateKey || !publicKey) return;

  const subs = getPushSubscriptionSheet(db).getDataRange().getValues();
  const headers = subs[0];
  const endpointIdx = headers.indexOf('endpoint');
  const now = Math.floor(Date.now() / 1000);
  const ttl = 3600;

  for (let i = 1; i < subs.length; i++) {
    const endpoint = String(subs[i][endpointIdx] || '');
    if (!endpoint) continue;
    const r = pushToEndpoint(endpoint, publicKey, privateKey, now, ttl);
    if (!r.ok) Logger.log('push a ' + endpoint + ' no OK: ' + JSON.stringify(r));
  }
}
function ESCRIBIR_LLAVES_VAPID() {
  // Llaves EC P-256 (ES256): la pública es el punto sin comprimir y la privada el escalar de 32 bytes
  const publicKey = `BPW81JMHT9wczWCw3rDaABQU2OPN9ktex5xDcVzYC03SBl8kT1EiwImrz1zI05HhGl0tJIFnwsYV2-Fd22XnGC8`;
  const privateKey = `AyJoWUJc2ytznsUNFhO4UKRtY1IUSyVIQQBBXF8hcCo`;

  SETUP_VAPID_KEYS(publicKey, privateKey);
}