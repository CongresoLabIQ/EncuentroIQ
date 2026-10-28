// tests/presentaciones.test.js
// Fase 2 · Presentaciones orales: subida, plazo, hoja dedicada `oral_presentations`
// y combinación con los trabajos del alumno. Sin red ni archivos reales.

const { createSandbox, post, get } = require('./harness/sandbox');
const { seedSheets, HEADERS, toObjects } = require('./fixtures/seed');

const FUTURO = '2099-12-31T23:00:00-06:00';
const PASADO = '2000-01-01T00:00:00-06:00';

function setDeadline(sandbox, value) {
  return post(sandbox, {
    action: 'setConfig',
    admin_user_id: 'admin-001',
    key: 'presentation_deadline',
    value
  });
}

function fileBase64(text) {
  return Buffer.from(text || 'contenido de prueba', 'utf8').toString('base64');
}

function run(t) {
  const sheets = seedSheets();
  const workIdx = {};
  HEADERS.works.forEach((h, i) => { workIdx[h] = i; });
  // La ponencia FQ-ORAL-0 se asigna al alumno de prueba que ya existe.
  sheets.works.find(r => String(r[workIdx.id]) === 'FQ-ORAL-0')[workIdx.student_id] = 'TestE1';

  const env = createSandbox(sheets, null, { allowDrive: true });
  const { sandbox, spreadsheet } = env;

  t.group('Plazo por defecto');
  const cfgInicial = get(sandbox, { action: 'getConfig' });
  t.equal(cfgInicial.success, true, 'getConfig responde');
  t.equal(cfgInicial.data.presentation_deadline, '2026-10-29T05:00:00.000Z',
    'el plazo por defecto es el 28 de octubre de 2026 a las 23:00 (CDMX)');
  const plazoInvalido = setDeadline(sandbox, 'no-es-una-fecha');
  t.equal(plazoInvalido.success, false, 'rechaza un plazo con formato inválido');
  t.ok(/inválida/i.test(plazoInvalido.error || ''), 'explica que la fecha es inválida');

  t.group('Subida de presentación oral');
  t.equal(setDeadline(sandbox, FUTURO).success, true, 'se configura un plazo futuro');
  const subida = post(sandbox, {
    action: 'submitPresentation',
    work_id: 'FQ-ORAL-0',
    student_id: 'TestE1',
    fileName: 'mi presentacion.pdf',
    fileBase64: fileBase64('PDF de prueba')
  });
  t.equal(subida.success, true, 'la presentación se sube');
  t.ok(/^https:\/\/(docs|drive)\.google\.com\//.test(subida.fileUrl || ''), 'devuelve la URL del archivo');

  t.group('Hoja dedicada oral_presentations');
  const pSheet = spreadsheet.getSheetByName('oral_presentations');
  t.ok(pSheet, 'se crea la hoja oral_presentations');
  const pRows = toObjects(pSheet.getDataRange().getValues());
  t.equal(pRows.length, 1, 'se guarda una sola fila');
  t.equal(pRows[0].work_id, 'FQ-ORAL-0', 'guarda el work_id');
  t.equal(pRows[0].student_id, 'TestE1', 'guarda el student_id');
  t.equal(pRows[0].file_name, 'mi presentacion.pdf', 'guarda el nombre original');
  t.ok(pRows[0].file_id, 'guarda el file_id de Drive');
  t.equal(pRows[0].file_url, subida.fileUrl, 'guarda la URL del archivo');
  t.ok(pRows[0].uploaded_at, 'guarda la fecha de subida');
  t.ok(pRows[0].updated_at, 'guarda la fecha de actualización');

  t.group('La hoja works no se modifica');
  const workHeaders = spreadsheet.getSheetByName('works').getDataRange().getValues()[0];
  t.ok(workHeaders.indexOf('presentation_url') === -1, 'no se agregan columnas de presentación a works');
  const worksRows = toObjects(spreadsheet.getSheetByName('works').getDataRange().getValues());
  const oral = worksRows.find(w => w.id === 'FQ-ORAL-0');
  t.ok(!oral.presentation_url, 'el trabajo no guarda la presentación en works');

  t.group('getStudentWorks combina la presentación');
  const studentWorks = get(sandbox, { action: 'getStudentWorks', studentId: 'TestE1' });
  t.equal(studentWorks.success, true, 'getStudentWorks responde');
  const merged = studentWorks.data.find(w => w.id === 'FQ-ORAL-0');
  t.ok(merged, 'incluye la ponencia del alumno');
  t.equal(merged.presentation_url, subida.fileUrl, 'expone presentation_url desde la hoja dedicada');
  t.equal(merged.presentation_file_id, pRows[0].file_id, 'expone presentation_file_id');
  const poster = studentWorks.data.find(w => w.id === 'FQ-POSTER-0');
  t.ok(poster && !poster.presentation_url, 'los carteles no tienen presentación');

  t.group('Reemplazo de presentación');
  const reemplazo = post(sandbox, {
    action: 'submitPresentation',
    work_id: 'FQ-ORAL-0',
    student_id: 'TestE1',
    fileName: 'presentacion v2.pptx',
    fileBase64: fileBase64('PPTX de prueba')
  });
  t.equal(reemplazo.success, true, 'se permite reemplazar mientras el plazo está abierto');
  const pRows2 = toObjects(pSheet.getDataRange().getValues());
  t.equal(pRows2.length, 1, 'no se duplica la fila de la presentación');
  t.equal(pRows2[0].file_name, 'presentacion v2.pptx', 'actualiza el nombre del archivo');
  t.equal(pRows2[0].file_url, reemplazo.fileUrl, 'actualiza la URL del archivo');

  t.group('Validaciones');
  t.equal(post(sandbox, {
    action: 'submitPresentation',
    work_id: 'FQ-POSTER-0',
    student_id: 'TestE1',
    fileName: 'cartel.pdf',
    fileBase64: fileBase64()
  }).success, false, 'un cartel no puede subir presentación oral');

  t.equal(post(sandbox, {
    action: 'submitPresentation',
    work_id: 'FQ-ORAL-0',
    student_id: 'otro-alumno',
    fileName: 'presentacion.pdf',
    fileBase64: fileBase64()
  }).success, false, 'solo el autor puede subir la presentación');

  const extension = post(sandbox, {
    action: 'submitPresentation',
    work_id: 'FQ-ORAL-0',
    student_id: 'TestE1',
    fileName: 'presentacion.docx',
    fileBase64: fileBase64()
  });
  t.equal(extension.success, false, 'rechaza extensiones no permitidas');
  t.ok(/PDF o PPTX/.test(extension.error || ''), 'explica los formatos permitidos');

  t.equal(post(sandbox, {
    action: 'submitPresentation',
    work_id: 'FQ-ORAL-0',
    student_id: 'TestE1',
    fileName: 'presentacion.pdf',
    fileBase64: ''
  }).success, false, 'rechaza archivos vacíos');

  t.group('Plazo vencido');
  t.equal(setDeadline(sandbox, PASADO).success, true, 'se configura un plazo pasado');
  const vencido = post(sandbox, {
    action: 'submitPresentation',
    work_id: 'FQ-ORAL-0',
    student_id: 'TestE1',
    fileName: 'tarde.pdf',
    fileBase64: fileBase64()
  });
  t.equal(vencido.success, false, 'no se puede subir después del plazo');
  t.ok(/fecha límite/i.test(vencido.error || ''), 'el error menciona la fecha límite');
  t.equal(toObjects(pSheet.getDataRange().getValues())[0].file_name, 'presentacion v2.pptx',
    'la presentación anterior no se altera');
}

module.exports = { name: 'Presentaciones orales — subida, plazo y hoja dedicada', run };
