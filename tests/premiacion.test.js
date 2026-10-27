// tests/premiacion.test.js
// Premiación: ganadores + 12 editables + 12 PDF individuales + 1 PDF global + correo a la terminal.
// Drive/Slides son falsos (en memoria): no se crea ningún archivo real y
// no se envía ningún correo ni push.

const { createSandbox, get, post } = require('./harness/sandbox');
const { seedSheets } = require('./fixtures/seed');

const PLACEHOLDERS = ['{{INTEGRANTES}}', '{{TITULO}}', '{{PROFESOR}}', '{{MODALIDAD}}', '{{LUGAR}}', '{{FECHA}}'];
const TEMPLATE_ID = '1DNdoBL30o2hG77INqP4shV9Dtv-77yWyaIhnnKPT6j0';
const CERT_FOLDER_ID = '1A6ZuVHobxHtu3S3incdUk_HAbTMrrHGc';
const GLOBAL_RECIPIENT = 'iq.cterminal@zaragoza.unam.mx';

function run(t) {
  const { sandbox, notifications, drive } = createSandbox(seedSheets(), null, { allowDrive: true });

  // ---------------------------------------------------------- Ganadores
  t.group('Ganadores');
  const res = get(sandbox, { action: 'getWinners' });
  t.equal(res.success, true, 'getWinners responde');
  t.equal(res.data.oral.length, 3, '3 ponencias ganadoras');
  t.equal(res.data.poster.length, 9, '9 carteles ganadores (3 por facultad)');
  t.ok(res.data.oral.every(w => Number(w.live_score) > 0), 'las ponencias tienen puntaje en vivo');
  t.deepEqual(
    res.data.poster.map(w => w.facultad_key),
    ['FQ', 'FQ', 'FQ', 'FC', 'FC', 'FC', 'FZ', 'FZ', 'FZ'],
    'carteles ordenados por facultad'
  );
  ['FQ', 'FC', 'FZ'].forEach(k => {
    const terna = res.data.poster.filter(w => w.facultad_key === k);
    t.deepEqual(terna.map(w => w.poster_rank), [0, 1, 2], k + ': puestos 1º, 2º y 3º');
  });

  // ---------------------------------------------------------- Reconocimientos
  t.group('Reconocimientos masivos');
  t.equal(drive.calls.length, 0, 'antes de premiar no se tocó Drive');
  sandbox.generarPremiacionMasiva();

  const editableCopies = drive.copies.filter(c => c.name.startsWith('EDITABLE:'));
  const globalCopies = drive.copies.filter(c => c.name.startsWith('GLOBAL:'));
  t.equal(editableCopies.length, 12, '12 reconocimientos editables (3 oral + 9 cartel)');
  t.equal(globalCopies.length, 1, '1 presentación global editable');

  const oralCopies = editableCopies.filter(c => /Lugar Ponencia Oral/.test(c.name));
  const posterCopies = editableCopies.filter(c => /Lugar Cartel/.test(c.name));
  t.equal(oralCopies.length, 3, '3 reconocimientos de ponencia oral');
  t.equal(posterCopies.length, 9, '9 reconocimientos de cartel');
  t.deepEqual(oralCopies.map(c => c.name.replace(/^EDITABLE: /, '').replace(/ - [A-Z0-9]+$/, '')),
    ['1er Lugar Ponencia Oral', '2do Lugar Ponencia Oral', '3er Lugar Ponencia Oral'],
    'ordinales correctos en ponencia');
  t.ok(posterCopies.every(c => /^EDITABLE: [123](er|do) Lugar Cartel — /.test(c.name)),
    'ordinales y facultad en los carteles');

  t.ok(editableCopies.every(c => c.folderId === CERT_FOLDER_ID), 'todos se guardan en la carpeta de constancias');
  t.ok(drive.calls.some(c => c.type === 'getFileById' && c.id === TEMPLATE_ID), 'se usa la plantilla oficial');
  t.ok(editableCopies.every(c => c.saved === true), 'todas las presentaciones se guardan');

  t.group('Placeholders reemplazados');
  editableCopies.forEach(copy => {
    const keys = Object.keys(copy.replacements).sort();
    t.deepEqual(keys, PLACEHOLDERS.slice().sort(), 'reemplaza los 6 campos en ' + copy.name);
    const values = Object.values(copy.replacements).join(' | ');
    t.ok(!values.includes('{{'), 'sin placeholders pendientes en ' + copy.name);
    t.ok(values.trim().length > 0, 'sin valores vacíos en ' + copy.name);
  });
  const modalidades = new Set(oralCopies.concat(posterCopies).map(c => c.replacements['{{MODALIDAD}}']));
  t.ok(modalidades.has('Ponencia Oral') && modalidades.has('Cartel'), 'modalidad correcta por tipo');
  t.ok(posterCopies.every(c => /Cartel — /.test(c.replacements['{{LUGAR}}'])), 'lugar del cartel con facultad');

  // ---------------------------------------------------------- PDFs individuales y global
  t.group('PDFs generados');
  const individualPdfs = drive.pdfs.filter(p => p.name.startsWith('PDF:'));
  const globalPdfs = drive.pdfs.filter(p => p.name.startsWith('GLOBAL:') && p.name.endsWith('.pdf'));
  t.equal(individualPdfs.length, 12, '12 PDF individuales');
  t.equal(globalPdfs.length, 1, '1 PDF global');
  t.ok(globalPdfs.every(p => p.folderId === CERT_FOLDER_ID), 'el PDF global va a la carpeta de constancias');
  t.equal(drive.slidesBatch.length, 1, 'una sola llamada a Slides (batchUpdate)');
  const reqs = drive.slidesBatch[0].requests;
  t.equal(reqs.filter(r => r.duplicateObject).length, 11, '11 diapositivas duplicadas en el global');
  t.equal(reqs.filter(r => r.replaceAllText).length, 72, '6 campos reemplazados en las 12 diapositivas');

  // ---------------------------------------------------------- Correo del PDF global
  t.group('Correo del PDF global');
  t.equal(notifications.length, 1, 'solo se envía el correo del PDF global');
  const email = notifications[0];
  t.equal(email.type, 'MailApp.sendEmail', 'se envía con MailApp');
  t.equal(email.args[0].to, GLOBAL_RECIPIENT, 'va dirigido a la terminal');
  t.ok(Array.isArray(email.args[0].attachments) && email.args[0].attachments.length === 1, 'adjunta el PDF global');
  t.ok(!drive.calls.some(c => /Mail|Gmail|UrlFetch/.test(c.type)), 'Drive/Slides no disparan notificaciones');

  // ---------------------------------------------------------- Constancia individual
  t.group('Constancia individual (endpoint)');
  const single = post(sandbox, { action: 'generateCertificates', work_id: 'FQ-POSTER-0' });
  t.equal(single.success, true, 'generateCertificates responde success');
  t.ok(/^https:\/\/docs\.google\.com\/presentation\//.test(single.fileUrl || ''), 'devuelve la URL del archivo');
  t.equal(drive.copies.filter(c => c.replacements['{{LUGAR}}'] === 'Participación').length, 1, 'se crea una constancia adicional (Participación)');

  // ---------------------------------------------------------- Endpoint de premiación (botón del admin)
  t.group('Endpoint generatePremiacionMasiva (admin)');
  const sinPermiso = post(sandbox, { action: 'generatePremiacionMasiva', admin_user_id: 'alguien' });
  t.equal(sinPermiso.success, false, 'sin rol admin no se permite');
  const ok = post(sandbox, { action: 'generatePremiacionMasiva', admin_user_id: 'admin-001' });
  t.equal(ok.success, true, 'admin puede generar la premiación');
  t.equal(ok.count, 12, 'genera 12 reconocimientos');
}

module.exports = { name: 'Premiación — ganadores y reconocimientos silenciosos', run };
