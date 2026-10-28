// tests/agendas.test.js
// Envío de agendas personalizadas a evaluadores, ahora filtrable por facultad.
// Sin red ni correos reales: todo ocurre en el sandbox en memoria.

const { createSandbox, post } = require('./harness/sandbox');
const { seedSheets } = require('./fixtures/seed');

function liveAssignments() {
  return [
    { id: 'la-fq', work_id: 'FQ-ORAL-0', evaluator_id: 'FQ-EV0', status: 'assigned', assigned_at: '', completed_at: '' },
    { id: 'la-fc', work_id: 'FC-ORAL-0', evaluator_id: 'FC-EV0', status: 'assigned', assigned_at: '', completed_at: '' },
    { id: 'la-fz', work_id: 'FZ-ORAL-0', evaluator_id: 'FZ-EV0', status: 'assigned', assigned_at: '', completed_at: '' }
  ];
}

function run(t) {
  const env = createSandbox(seedSheets({ liveAssignments: liveAssignments() }));

  t.group('Permisos');
  const sinAdmin = post(env.sandbox, { action: 'notifyJudgesAgenda' });
  t.equal(sinAdmin.success, false, 'sin rol admin no se envían agendas');
  t.equal(env.notifications.length, 0, 'sin admin no se registra ningún correo');

  t.group('Agenda por facultad');
  const casos = [
    { fac: 'FQ', email: 'fq.prof0@test.local', title: 'FQ Ponencia 0', ajeno: 'FC Ponencia 0' },
    { fac: 'FC', email: 'fc.prof0@test.local', title: 'FC Ponencia 0', ajeno: 'FZ Ponencia 0' },
    { fac: 'FZ', email: 'fz.prof0@test.local', title: 'FZ Ponencia 0', ajeno: 'FQ Ponencia 0' }
  ];

  casos.forEach(({ fac, email, title, ajeno }) => {
    const antes = env.notifications.length;
    const res = post(env.sandbox, {
      action: 'notifyJudgesAgenda',
      admin_user_id: 'admin-001',
      facultad: fac
    });
    t.equal(res.success, true, fac + ': responde success');
    t.equal(res.facultad, fac, fac + ': reporta la facultad enviada');
    t.equal(res.count, 1, fac + ': envía una sola agenda');
    t.ok(res.skipped >= 1, fac + ': cuenta evaluadores sin asignaciones');
    t.equal(env.notifications.length, antes + 1, fac + ': registra un solo correo');

    const correo = env.notifications[env.notifications.length - 1].args[0];
    t.equal(correo.to, email, fac + ': va al evaluador de esa facultad');
    t.ok(correo.htmlBody.includes(title), fac + ': incluye su trabajo asignado');
    t.ok(!correo.htmlBody.includes(ajeno), fac + ': no incluye trabajos de otra facultad');
    t.ok(correo.htmlBody.includes('10:00'), fac + ': incluye el horario');
    t.ok(correo.htmlBody.includes('Auditorio Principal'), fac + ': incluye el lugar');
    t.ok(/Fecha del evento/.test(correo.htmlBody), fac + ': incluye la fecha del evento');
  });

  t.group('Agenda para todas las facultades');
  const todos = post(env.sandbox, {
    action: 'notifyJudgesAgenda',
    admin_user_id: 'admin-001'
  });
  t.equal(todos.success, true, 'responde success');
  t.equal(todos.facultad, 'TODAS', 'reporta todas las facultades');
  t.equal(todos.count, 3, 'envía una agenda por evaluador con asignaciones');
  t.equal(env.notifications.length, 6, 'en total se registran 6 correos');

  t.group('Validaciones');
  const invalida = post(env.sandbox, {
    action: 'notifyJudgesAgenda',
    admin_user_id: 'admin-001',
    facultad: 'XX'
  });
  t.equal(invalida.success, false, 'rechaza una facultad inválida');
  t.ok(/Facultad no válida/.test(invalida.error || ''), 'explica el error de facultad');
  t.equal(env.notifications.length, 6, 'la facultad inválida no envía correos');
}

module.exports = { name: 'Agendas de evaluadores — envío por facultad', run };
