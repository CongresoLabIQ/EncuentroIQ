// tests/recordatorio.test.js
// Recordatorio del evento: un correo por trabajo aceptado (oral/cartel), con
// fecha, sede, horario, modalidad y enlace a la página. Sin red ni correos reales.

const { createSandbox, post } = require('./harness/sandbox');
const { seedSheets, HEADERS, toObjects } = require('./fixtures/seed');

function alumnoRow(id, email) {
  return HEADERS.users.map(h => {
    if (h === 'id') return id;
    if (h === 'name') return 'Alumno ' + id;
    if (h === 'email') return email;
    if (h === 'user_type') return 'student';
    if (h === 'facultad') return 'Facultad de Química';
    return '';
  });
}

function run(t) {
  const sheets = seedSheets();
  const users = sheets.users;
  const works = sheets.works;
  const userIdx = {};
  HEADERS.users.forEach((h, i) => { userIdx[h] = i; });
  const workIdx = {};
  HEADERS.works.forEach((h, i) => { workIdx[h] = i; });

  // Crea una cuenta de alumno por cada trabajo del fixture (los ids son únicos).
  const conocidos = new Set(users.slice(1).map(r => String(r[userIdx.id])));
  works.slice(1).forEach(r => {
    const sid = String(r[workIdx.student_id] || '');
    if (!sid || conocidos.has(sid)) return;
    conocidos.add(sid);
    users.push(alumnoRow(sid, sid + '@test.local'));
  });

  // Un trabajo aceptado sin correo registrado: se omite.
  users.find(r => String(r[userIdx.id]) === 'alumno-FC-3')[userIdx.email] = '';

  // Un trabajo no seleccionado: no debe recibir correo.
  works.find(r => String(r[workIdx.id]) === 'FZ-POSTER-14')[workIdx.status] = 'rejected';

  // Título con HTML para comprobar el escapado.
  works.find(r => String(r[workIdx.id]) === 'FC-POSTER-4')[workIdx.title] =
    'Cartel <b>especial</b> & "comillas"';

  const env = createSandbox(sheets);

  t.group('Permisos');
  const sinPermiso = post(env.sandbox, { action: 'notifyEventReminder' });
  t.equal(sinPermiso.success, false, 'sin rol admin no se envía');
  t.equal(env.notifications.length, 0, 'sin admin no se registra ningún correo');

  t.group('Envío del recordatorio');
  const res = post(env.sandbox, { action: 'notifyEventReminder', admin_user_id: 'admin-001' });
  t.equal(res.success, true, 'responde success');
  t.equal(res.count, 49, 'envía 49 correos (50 aceptados menos 1 sin correo)');
  t.equal(res.skipped, 1, 'omite 1 trabajo sin correo');
  t.deepEqual(res.errores, [], 'sin errores de envío');
  t.equal(env.notifications.length, 49, 'solo se envían correos');

  const sent = env.notifications.map(n => n.args[0]);
  t.ok(sent.every(e => e.to && e.to.length > 0), 'todos tienen destinatario');
  t.ok(sent.every(e => /Recordatorio/.test(e.subject) && /Encuentro/.test(e.subject)),
    'asunto de recordatorio del encuentro');
  t.ok(sent.every(e => e.htmlBody.includes('jueves 29 de octubre de 2026')), 'incluye la fecha del evento');
  t.ok(sent.every(e => e.htmlBody.includes('8:30 h')), 'incluye el horario de registro');
  t.ok(sent.every(e => e.htmlBody.includes('Facultad de Estudios Superiores Zaragoza, Campus II, de la UNAM')),
    'incluye la sede');
  t.ok(sent.every(e => e.htmlBody.includes('https://congresolabiq.github.io/EncuentroIQ')),
    'incluye el enlace a la página del evento');

  t.group('Destinatarios y modalidad');
  const worksById = {};
  toObjects(works).forEach(w => { worksById[String(w.id)] = w; });
  const emailToSid = {};
  users.slice(1).forEach(r => {
    if (String(r[userIdx.user_type]) === 'student') {
      emailToSid[String(r[userIdx.email])] = String(r[userIdx.id]);
    }
  });
  let orales = 0, carteles = 0;
  sent.forEach(e => {
    const sid = emailToSid[String(e.to)];
    const trabajo = sid ? Object.values(worksById).find(w => String(w.student_id) === sid) : null;
    if (!trabajo) { t.fail('correo sin trabajo asociado: ' + e.to); return; }
    const esperado = trabajo.status === 'accepted_oral' ? 'PONENCIA ORAL' : 'PRESENTACIÓN EN CARTEL';
    t.ok(e.htmlBody.includes('<strong>' + esperado + '</strong>'),
      sid + ': modalidad ' + esperado);
    if (trabajo.status === 'accepted_oral') {
      orales++;
      t.ok(/Presentación oral \(Fase 2\)/.test(e.htmlBody), sid + ': incluye aviso de subida');
      t.ok(e.htmlBody.includes('28 de octubre de 2026 a las 23:00 hrs'), sid + ': incluye el plazo');
    } else {
      carteles++;
      t.ok(!e.htmlBody.includes('Presentación oral (Fase 2)'), sid + ': cartel sin aviso de oral');
    }
  });
  t.equal(orales, 6, '6 correos de ponencia oral');
  t.equal(carteles, 43, '43 correos de cartel (45 menos 1 rechazado y 1 sin correo)');
  t.ok(sent.some(e => e.to === 'teste1@test.local'), 'usa el correo del alumno registrado');
  t.ok(!sent.some(e => e.to === 'alumno-FZ-14@test.local'), 'no envía al trabajo no seleccionado');
  t.ok(!sent.some(e => e.to === ''), 'no envía a correos vacíos');

  t.group('Escapado de HTML');
  const especial = sent.find(e => e.to === 'alumno-FC-4@test.local');
  t.ok(especial, 'se envía el correo del trabajo con título especial');
  t.ok(especial.htmlBody.includes('Cartel &lt;b&gt;especial&lt;/b&gt; &amp; &quot;comillas&quot;'),
    'escapa el título del trabajo');
  t.ok(!especial.htmlBody.includes('<b>especial</b>'), 'no inserta HTML crudo del título');
}

module.exports = { name: 'Recordatorio del evento a participantes', run };
