// tests/run.js
// Ejecuta todas las suites del sandbox. Uso: node tests/run.js
// No requiere dependencias ni conexión a internet.

const T = require('./harness/t');

const suites = [
  require('./fase2.test'),
  require('./winners.test'),
  require('./rubricas.test'),
  require('./e2e.test')
];

let passed = 0;
let failed = 0;

suites.forEach(({ name, run }) => {
  const t = new T(name);
  try {
    run(t);
  } catch (e) {
    t.fail('Excepción no controlada: ' + e.message + '\n' + (e.stack || ''));
  }
  passed += t.passed;
  failed += t.failed;
  console.log('\n▶ ' + name + ': ' + t.passed + ' OK, ' + t.failed + ' fallidas');
  t.failures.forEach(f => console.log('   ✗ ' + f));
});

console.log('\n' + (failed === 0 ? '✅ TODO OK' : '❌ HAY FALLOS') + ' — ' + passed + ' aserciones OK, ' + failed + ' fallidas');
process.exit(failed === 0 ? 0 : 1);
