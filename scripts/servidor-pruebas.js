const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'js', 'config.js');
const configSource = fs.readFileSync(CONFIG_PATH, 'utf8');
const productionMatch = configSource.match(/const\s+GOOGLE_SCRIPT_URL\s*=\s*(['"])(.*?)\1\s*;/);
const productionApiUrl = productionMatch && productionMatch[2];
const testApiUrl = process.argv[2];
const port = Number(process.env.PORT || 4173);
const blockedDirectories = new Set(['.git', '.agents', 'docs', 'node_modules', 'scripts', 'tests']);
const allowedExtensions = new Set([
    '.css', '.html', '.ico', '.jpeg', '.jpg', '.js', '.json', '.png', '.svg', '.webp'
]);

function fail(message) {
    console.error(`\n${message}\n`);
    process.exit(1);
}

if (!productionApiUrl) fail('No se pudo identificar GOOGLE_SCRIPT_URL en js/config.js.');
if (!testApiUrl) {
    fail('Falta la URL del Web App de PRUEBA.\nUso: npm run servir-prueba -- https://script.google.com/macros/s/ID_DEL_CLON/exec');
}

let parsedApiUrl;
try {
    parsedApiUrl = new URL(testApiUrl);
} catch {
    fail('La URL del backend de prueba no es válida.');
}

if (parsedApiUrl.protocol !== 'https:' ||
    parsedApiUrl.hostname !== 'script.google.com' ||
    !/^\/macros\/s\/[^/]+\/exec\/?$/.test(parsedApiUrl.pathname)) {
    fail('Usa la URL HTTPS de una implementación Web App de Google Apps Script terminada en /exec.');
}
if (testApiUrl.replace(/\/$/, '') === productionApiUrl.replace(/\/$/, '')) {
    fail('La URL indicada es la de producción. El servidor de prueba se detuvo para proteger los datos reales.');
}
if (!Number.isInteger(port) || port < 1 || port > 65535) fail('PORT debe ser un puerto entre 1 y 65535.');

const testConfig = configSource.replace(
    /const\s+GOOGLE_SCRIPT_URL\s*=\s*(['"]).*?\1\s*;/,
    `const GOOGLE_SCRIPT_URL = ${JSON.stringify(testApiUrl)};`
);

function contentType(extension) {
    return ({
        '.css': 'text/css; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.ico': 'image/x-icon',
        '.jpeg': 'image/jpeg',
        '.jpg': 'image/jpeg',
        '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp'
    })[extension] || 'application/octet-stream';
}

function createDemoPdf() {
    const stream = [
        'BT',
        '/F1 18 Tf',
        '72 720 Td',
        '(EncuentroIQ - Trabajo ficticio de simulacro) Tj',
        '/F1 12 Tf',
        '0 -32 Td',
        '(Documento de prueba; no representa un trabajo real.) Tj',
        'ET'
    ].join('\n');
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
        `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((body, index) => {
        offsets.push(Buffer.byteLength(pdf, 'ascii'));
        pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(pdf, 'ascii');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, 'ascii');
}

function resolvePublicFile(requestPath) {
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(requestPath);
    } catch {
        return null;
    }

    const segments = decodedPath.replace(/\\/g, '/').split('/').filter(Boolean);
    if (segments.some(segment => segment === '.' || segment === '..' || segment.startsWith('.'))) return null;
    if (segments.some(segment => blockedDirectories.has(segment.toLowerCase()))) return null;

    const relativePath = segments.length ? path.join(...segments) : 'index.html';
    const filePath = path.resolve(ROOT, relativePath);
    if (!filePath.startsWith(`${ROOT}${path.sep}`) && filePath !== ROOT) return null;
    if (!allowedExtensions.has(path.extname(filePath).toLowerCase())) return null;
    return filePath;
}

const server = http.createServer((request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end('Método no permitido');
        return;
    }

    let requestUrl;
    try {
        requestUrl = new URL(request.url, 'http://localhost');
    } catch {
        response.writeHead(400);
        response.end('Solicitud inválida');
        return;
    }

    if (requestUrl.pathname === '/js/config.js') {
        response.writeHead(200, {
            'Content-Type': 'text/javascript; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff'
        });
        response.end(request.method === 'HEAD' ? undefined : testConfig);
        return;
    }

    if (requestUrl.pathname === '/demo-trabajo.pdf') {
        const pdf = createDemoPdf();
        response.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Length': pdf.length,
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        });
        response.end(request.method === 'HEAD' ? undefined : pdf);
        return;
    }

    const filePath = resolvePublicFile(requestUrl.pathname);
    if (!filePath) {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('No encontrado');
        return;
    }

    fs.stat(filePath, (statError, stat) => {
        if (statError || !stat.isFile()) {
            response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            response.end('No encontrado');
            return;
        }

        response.writeHead(200, {
            'Content-Type': contentType(path.extname(filePath).toLowerCase()),
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        });
        if (request.method === 'HEAD') {
            response.end();
            return;
        }
        fs.createReadStream(filePath).pipe(response);
    });
});

server.on('error', error => {
    if (error.code === 'EADDRINUSE') {
        fail(`El puerto ${port} ya está ocupado. Cierra el proceso que lo usa o inicia con PORT=4174.`);
    }
    fail(`No se pudo iniciar el servidor: ${error.message}`);
});

server.listen(port, '0.0.0.0', () => {
    console.log('\nEncuentroIQ — servidor para simulacro');
    console.log('Backend configurado: https://script.google.com/macros/s/[ID oculto]/exec (URL de prueba)');
    console.log('\nEn esta computadora:');
    console.log(`  http://localhost:${port}/`);
    console.log('\nDesde celulares conectados a la misma red Wi-Fi:');

    const interfaces = os.networkInterfaces();
    const addresses = Object.values(interfaces).flat().filter(item =>
        item && !item.internal && item.family === 'IPv4'
    );
    if (!addresses.length) console.log(`  http://IP-DE-ESTA-COMPUTADORA:${port}/`);
    addresses.forEach(item => console.log(`  http://${item.address}:${port}/`));

    console.log('\nNo cierres esta ventana durante la prueba. Solo accesible desde tu red local.');
    console.log('Confirma que la URL proporcionada pertenece al clon antes de probar escrituras.\n');
});
