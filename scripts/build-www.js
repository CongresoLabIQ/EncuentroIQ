// scripts/build-www.js — Copia el sitio estático a la carpeta www/ para Capacitor
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const www = path.join(root, 'www');

const DIRS_TO_COPY = ['css', 'js', 'assets'];
const FILES_TO_COPY = [
  'index.html',
  'login.html',
  'register.html',
  'student-dashboard.html',
  'evaluator-dashboard.html',
  'admin-dashboard.html',
  'submit-work.html',
  'encuesta-satisfaccion.html',
  'download.html',
  'reset-password.html',
  'set-new-password.html',
  'tutorial-estudiante.html',
  'tutorial-evaluador.html',
  '404.html',
  'manifest.json',
  'service-worker.js',
  'favicon.ico',
  'favicon.jpg',
  'favicon.png'
];

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

console.log('Limpiando www/ ...');
rmrf(www);
fs.mkdirSync(www, { recursive: true });

for (const dir of DIRS_TO_COPY) {
  const src = path.join(root, dir);
  if (fs.existsSync(src)) {
    copyDir(src, path.join(www, dir));
    console.log('Copiado:', dir + '/');
  }
}

for (const file of FILES_TO_COPY) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(www, file));
    console.log('Copiado:', file);
  }
}

console.log('\nBuild www/ completado.');