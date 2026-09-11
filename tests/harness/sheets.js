// tests/harness/sheets.js
// Motor mínimo de hojas en memoria que imita la API de Google Sheets usada en Code.gs.
// No tiene relación alguna con Google: todo vive en RAM.

class FakeRange {
  constructor(sheet, row, col, numRows, numCols) {
    this.sheet = sheet;
    this.row = row;
    this.col = col;
    this.numRows = numRows;
    this.numCols = numCols;
  }

  getValues() {
    const out = [];
    for (let r = 0; r < this.numRows; r++) {
      const src = this.sheet.rows[this.row - 1 + r] || [];
      const line = [];
      for (let c = 0; c < this.numCols; c++) {
        const v = src[this.col - 1 + c];
        line.push(v === undefined ? '' : v);
      }
      out.push(line);
    }
    return out;
  }

  getValue() {
    return this.getValues()[0][0];
  }

  setValue(v) {
    const r = this.row - 1;
    const c = this.col - 1;
    while (this.sheet.rows.length <= r) this.sheet.rows.push([]);
    const line = this.sheet.rows[r];
    while (line.length <= c) line.push('');
    line[c] = v;
    return this;
  }

  setValues(values) {
    values.forEach((line, dr) => {
      const r = this.row - 1 + dr;
      while (this.sheet.rows.length <= r) this.sheet.rows.push([]);
      line.forEach((v, dc) => {
        const c = this.col - 1 + dc;
        while (this.sheet.rows[r].length <= c) this.sheet.rows[r].push('');
        this.sheet.rows[r][c] = v;
      });
    });
    return this;
  }
}

class FakeSheet {
  constructor(name, rows) {
    this.name = name;
    this.rows = (rows || []).map(r => r.slice());
  }

  getName() {
    return this.name;
  }

  getDataRange() {
    const numRows = Math.max(1, this.rows.length);
    const numCols = Math.max(1, ...this.rows.map(r => r.length), 1);
    return new FakeRange(this, 1, 1, numRows, numCols);
  }

  getRange(row, col, numRows, numCols) {
    return new FakeRange(this, row, col, numRows === undefined ? 1 : numRows, numCols === undefined ? 1 : numCols);
  }

  appendRow(row) {
    this.rows.push(row.slice());
    return this;
  }

  getLastRow() {
    return this.rows.length;
  }

  clear() {
    this.rows = [];
    return this;
  }
}

class FakeSpreadsheet {
  constructor(sheetMap) {
    this.sheets = {};
    Object.keys(sheetMap || {}).forEach(name => {
      this.sheets[name] = new FakeSheet(name, sheetMap[name]);
    });
  }

  getSheetByName(name) {
    return this.sheets[name] || null;
  }

  insertSheet(name) {
    const sheet = new FakeSheet(name, []);
    this.sheets[name] = sheet;
    return sheet;
  }

  getSheets() {
    return Object.keys(this.sheets).map(k => this.sheets[k]);
  }
}

module.exports = { FakeSheet, FakeSpreadsheet, FakeRange };
