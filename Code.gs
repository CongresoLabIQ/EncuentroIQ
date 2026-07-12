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

function generarShortId(db, semestre) {
  const prefijos = { "1er Semestre": "A", "2do Semestre": "B", "3er Semestre": "C", "4to Semestre": "D", "5to Semestre": "E", "6to Semestre": "F", "7mo Semestre": "G", "8vo Semestre": "H", "9no Semestre": "I" };
  const letra = prefijos[semestre] || "Z";
  const works = getSheetData(db, 'works');
  const total = works.filter(w => w.semester === semestre).length;
  return letra + (total + 1).toString().padStart(2, '0');
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
  return '15-17 de julio de 2026';
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
      const sId = generarShortId(db, data.semester);
      
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
      
      const esAutoEval = (String(ev.name).trim().toUpperCase() === String(work.profesor_cargo).trim().toUpperCase());

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
          const esMismoProf = (String(ev.name).trim().toUpperCase() === String(work.profesor_cargo).trim().toUpperCase());
          return !tieneConflictoDeFacultad(work, ev) && !esMismoProf;
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
      
      let workPool = [];

      works.forEach((w, idx) => {
        if (w.status === 'rejected' || w.status === 'accepted_oral' || w.status === 'accepted_poster') return;
        const wEvals = evals.filter(e => e.work_id === w.id);
        if (wEvals.length < 2) return;

        const algunaNoCumple = wEvals.some(e => String(e.cumple_extension || '').toLowerCase() === 'no');
        if (algunaNoCumple) {
          workPool.push({ rowIndex: idx + 2, ...w, avgScore: 0, avgPertinencia: 0, ApprovedPert: false, feedback: wEvals.map((e, i) => `Juez ${i + 1}: ${e.comentarios}`).join('\n\n') });
          return;
        }

        const avgTotal = parseFloat((wEvals.reduce((s, c) => s + Number(c.total_score), 0) / wEvals.length).toFixed(1));
        const avgPert = parseFloat((wEvals.reduce((s, c) => s + Number(c.score_pertinencia || 0), 0) / wEvals.length).toFixed(1));
        const fb = wEvals.map((e, i) => `Juez ${i + 1}: ${e.comentarios}`).join('\n\n');
        
        workPool.push({ rowIndex: idx + 2, ...w, avgScore: avgTotal, avgPertinencia: avgPert, ApprovedPert: (avgPert >= 6), feedback: fb });
      });

      let facultadPools = {};
      workPool.forEach(w => {
        const fac = w.facultad || 'Sin Facultad';
        if (!facultadPools[fac]) facultadPools[fac] = [];
        facultadPools[fac].push(w);
      });

      let salas = { "UMIEZ": [], "Auditorio Principal": [] };

      Object.keys(facultadPools).forEach(fac => {
        let group = facultadPools[fac].sort((a, b) => b.avgScore - a.avgScore);
        let oralCount = 0;
        group.forEach(w => {
          if (w.avgScore < 60 || !w.ApprovedPert) {
            w.fStat = 'rejected'; w.fAud = ''; w.fHor = '';
          } else if (oralCount < 3) {
            w.fStat = 'accepted_oral'; w.fAud = 'Auditorio Principal';
            salas["Auditorio Principal"].push(w); oralCount++;
          } else if (oralCount < 6) {
            w.fStat = 'accepted_oral'; w.fAud = 'UMIEZ';
            salas["UMIEZ"].push(w); oralCount++;
          } else {
            w.fStat = 'accepted_poster'; w.fAud = ''; w.fHor = 'Sesión Carteles';
          }
        });
      });

      const hInicio = 10, mTurno = 20;
      ["UMIEZ", "Auditorio Principal"].forEach(sala => {
        shuffleArray(salas[sala]).forEach((work, idx) => {
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
           const esMismoProf = (String(ev.name).trim().toUpperCase() === String(w.profesor_cargo).trim().toUpperCase());
           return !tieneConflictoDeFacultad(w, ev) && !esMismoProf;
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

    else if (data.action === 'submitLiveEvaluation') {
      db.getSheetByName('live_evaluations').appendRow([Utilities.getUuid(), data.work_id, data.evaluator_id, data.total_score, data.s1, data.s2, data.s3, data.s4, data.s5, data.s6, data.comments, new Date()]);
      updateRow(db, 'live_assignments', 'id', data.assignment_id, { status: 'completed', completed_at: new Date() });
      const evs = getSheetData(db, 'live_evaluations').filter(e => e.work_id === data.work_id);
      const avg = (evs.reduce((s, c) => s + Number(c.total_score), 0) / evs.length).toFixed(2);
      updateRow(db, 'works', 'id', data.work_id, { live_score: avg });
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