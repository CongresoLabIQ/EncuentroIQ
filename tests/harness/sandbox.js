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

function createSandbox(sheetMap) {
  const notifications = [];
  const spreadsheet = new FakeSpreadsheet(sheetMap);
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
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
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
    DriveApp: forbiddenProxy('DriveApp', notifications),
    SlidesApp: forbiddenProxy('SlidesApp', notifications),
    _notifications: notifications
  };

  vm.createContext(sandbox);
  vm.runInContext(CODE_CACHE, sandbox, { filename: 'Code.gs' });

  return { sandbox, spreadsheet, notifications };
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
