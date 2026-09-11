// tests/harness/t.js
// Colector minimalista de aserciones (sin dependencias).

class T {
  constructor(name) {
    this.name = name;
    this.passed = 0;
    this.failed = 0;
    this.failures = [];
    this.current = '';
  }

  group(name) {
    this.current = name;
  }

  ok(cond, msg) {
    if (cond) {
      this.passed++;
    } else {
      this.failed++;
      this.failures.push((this.current ? '[' + this.current + '] ' : '') + msg);
    }
  }

  equal(actual, expected, msg) {
    this.ok(actual === expected, msg + ' — esperado ' + JSON.stringify(expected) + ', obtenido ' + JSON.stringify(actual));
  }

  deepEqual(actual, expected, msg) {
    this.ok(JSON.stringify(actual) === JSON.stringify(expected),
      msg + ' — esperado ' + JSON.stringify(expected) + ', obtenido ' + JSON.stringify(actual));
  }

  fail(msg) {
    this.failed++;
    this.failures.push((this.current ? '[' + this.current + '] ' : '') + msg);
  }
}

module.exports = T;
