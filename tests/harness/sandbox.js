// tests/harness/sandbox.js
// Carga el Code.gs REAL dentro de un entorno falso de Apps Script (Node vm).
// Garantías:
//  - Sin red: UrlFetchApp solo registra la llamada.
//  - Sin correo: MailApp/GmailApp solo registran la llamada.
//  - Sin Drive/Slides: lanzan error si se invocan.
//  - Sin hoja real: la SpreadsheetApp es en memoria.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { FakeSpreadsheet } = require('./sheets');

const CODE_PATH = path.resolve(__dirname, '..', '..', 'Code.gs');
const CODE_CACHE = fs.readFileSync(CODE_PATH, 'utf8');

function forbiddenProxy(name, notifications) {
  return new Proxy({}, {
    get() {
      return () => {
        notifications.push({ type: name });
        throw new Error(name + ' no está permitido en el sandbox de pruebas');
      };
    }
  });
}

// Drive/Slides en memoria: solo cuando la prueba necesita generar reconocimientos.
// No crea archivos reales, no toca la nube y no registra notificaciones.
function createFakeDrive() {
  const calls = [];
  const copies = [];       // presentaciones editables creadas con makeCopy (individuales + global)
  const pdfs = [];         // archivos PDF creados con folder.createFile
  const slidesBatch = [];  // llamadas a Slides.Presentations.batchUpdate
  let seq = 0;

  function makeBlob(name) {
    return {
      name: String(name),
      getName: function () { return this.name; },
      setName: function (n) { this.name = String(n); return this; }
    };
  }

  function fakeFile(id, name) {
    return {
      getId: () => id,
      getName: () => name,
      getUrl: () => 'https://docs.google.com/presentation/d/' + id + '/edit',
      makeCopy: (copyName, destination) => {
        const copyId = 'slide-' + (++seq);
        copies.push({
          id: copyId,
          name: String(copyName),
          folderId: destination && destination.getId ? destination.getId() : null,
          replacements: {},
          saved: false
        });
        calls.push({ type: 'makeCopy', id: copyId, name: String(copyName) });
        return fakeFile(copyId, copyName);
      },
      getAs: (mime) => {
        calls.push({ type: 'getAs', id, mime });
        return makeBlob(name);
      }
    };
  }

  const DriveApp = {
    getFolderById: (id) => {
      calls.push({ type: 'getFolderById', id });
      return {
        getId: () => id,
        getName: () => 'Carpeta de prueba',
        createFile: (blob) => {
          const pdfId = 'pdf-' + (++seq);
          const pdfName = blob && blob.getName ? blob.getName() : 'archivo.pdf';
          pdfs.push({ id: pdfId, name: pdfName, folderId: id });
          calls.push({ type: 'createFile', id: pdfId, name: pdfName, folderId: id });
          return { getId: () => pdfId, getName: () => pdfName };
        }
      };
    },
    getFileById: (id) => {
      calls.push({ type: 'getFileById', id });
      return fakeFile(id, 'plantilla');
    }
  };

  const SlidesApp = {
    openById: (id) => {
      let entry = copies.find(c => c.id === id);
      if (!entry) {
        entry = { id, name: '(sin copia)', replacements: {}, saved: false };
        copies.push(entry);
      }
      return {
        replaceAllText: (find, replace) => {
          entry.replacements[find] = replace;
          calls.push({ type: 'replaceAllText', id, find });
        },
        saveAndClose: () => {
          entry.saved = true;
          calls.push({ type: 'saveAndClose', id });
        },
        getSlides: () => [{ getObjectId: () => id + '-page-0' }]
      };
    }
  };

  const Slides = {
    Presentations: {
      batchUpdate: (resource, presentationId) => {
        const requests = (resource && resource.requests) || [];
        slidesBatch.push({ presentationId, requests });
        calls.push({ type: 'Slides.batchUpdate', presentationId, requestCount: requests.length });
        return { replies: [] };
      }
    }
  };

  return { DriveApp, SlidesApp, Slides, calls, copies, pdfs, slidesBatch };
}

function createSandbox(sheetMap, codeSource, options) {
  const notifications = [];
  const spreadsheet = new FakeSpreadsheet(sheetMap);
  const fakeDrive = options && options.allowDrive ? createFakeDrive() : null;
  let uuid = 0;

  const sandbox = {
    console,
    Date,
    JSON,
    Math,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Error,
    RegExp,
    isNaN,
    parseFloat,
    parseInt,
    Promise,
    Logger: { log() {} },
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, flush: () => {} },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput(text) {
        return {
          _text: text,
          setMimeType() { return this; },
          getContent() { return this._text; }
        };
      }
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      getUuid: () => 'uuid-' + (++uuid),
      computeDigest: () => [],
      base64Decode: () => [],
      base64Encode: () => '',
      base64EncodeWebSafe: () => '',
      newBlob: () => ({}),
      formatDate: () => '',
      sleep: () => {}
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {}, deleteProperty: () => {} }),
      getDocumentProperties: () => ({ getProperty: () => null, setProperty: () => {} })
    },
    Session: { getActiveUser: () => ({ getEmail: () => 'test@example.com' }) },
    MailApp: { sendEmail: (...args) => { notifications.push({ type: 'MailApp.sendEmail', args }); } },
    GmailApp: { sendEmail: (...args) => { notifications.push({ type: 'GmailApp.sendEmail', args }); } },
    UrlFetchApp: {
      fetch: (...args) => {
        notifications.push({ type: 'UrlFetchApp.fetch', args });
        return { getResponseCode: () => 200, getContentText: () => '' };
      }
    },
    DriveApp: fakeDrive ? fakeDrive.DriveApp : forbiddenProxy('DriveApp', notifications),
    SlidesApp: fakeDrive ? fakeDrive.SlidesApp : forbiddenProxy('SlidesApp', notifications),
    Slides: fakeDrive ? fakeDrive.Slides : forbiddenProxy('Slides', notifications),
    MimeType: { PDF: 'application/pdf' },
    _notifications: notifications
  };

  vm.createContext(sandbox);
  vm.runInContext(codeSource || CODE_CACHE, sandbox, { filename: 'Code.gs' });

  return { sandbox, spreadsheet, notifications, drive: fakeDrive };
}

function post(sandbox, payload) {
  const output = sandbox.doPost({ postData: { contents: JSON.stringify(payload) } });
  return JSON.parse(output.getContent());
}

function get(sandbox, params) {
  const output = sandbox.doGet({ parameter: params });
  return JSON.parse(output.getContent());
}

module.exports = { createSandbox, post, get };
