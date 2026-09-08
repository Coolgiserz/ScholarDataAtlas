/** 零依赖 XLSX 生成：CRC32 + store-only ZIP + 最小 OOXML
 *  与单文件版字节级一致；时间戳改为可注入，保证测试可复现。 */

import type { Sheet } from "../../types";

const CRCT: Uint32Array = (() => {
  const a = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    a[n] = c >>> 0;
  }
  return a;
})();

export function crc32(u: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < u.length; i++) c = CRCT[(c ^ u[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const u8 = (s: string): Uint8Array => new TextEncoder().encode(s);

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

export function zipStore(ents: ZipEntry[], now: Date = new Date()): Uint8Array {
  const parts: Uint8Array[] = [];
  const cent: Array<{ nm: Uint8Array; cr: number; sz: number; off: number }> = [];
  let off = 0;
  const dt = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
  const dd = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

  ents.forEach((e) => {
    const nm = u8(e.name);
    const da = e.data;
    const cr = crc32(da);
    const lh = new Uint8Array(30 + nm.length);
    const v = new DataView(lh.buffer);
    v.setUint32(0, 0x04034b50, true);
    v.setUint16(4, 20, true);
    v.setUint16(6, 0x0800, true);
    v.setUint16(8, 0, true);
    v.setUint16(10, dt, true);
    v.setUint16(12, dd, true);
    v.setUint32(14, cr, true);
    v.setUint32(18, da.length, true);
    v.setUint32(22, da.length, true);
    v.setUint16(26, nm.length, true);
    v.setUint16(28, 0, true);
    lh.set(nm, 30);
    parts.push(lh, da);
    cent.push({ nm, cr, sz: da.length, off });
    off += lh.length + da.length;
  });

  const cs = off;
  let csz = 0;
  cent.forEach((e) => {
    const ch = new Uint8Array(46 + e.nm.length);
    const v = new DataView(ch.buffer);
    v.setUint32(0, 0x02014b50, true);
    v.setUint16(4, 20, true);
    v.setUint16(6, 20, true);
    v.setUint16(8, 0x0800, true);
    v.setUint16(10, 0, true);
    v.setUint16(12, dt, true);
    v.setUint16(14, dd, true);
    v.setUint32(16, e.cr, true);
    v.setUint32(20, e.sz, true);
    v.setUint32(24, e.sz, true);
    v.setUint16(28, e.nm.length, true);
    v.setUint16(30, 0, true);
    v.setUint16(32, 0, true);
    v.setUint16(34, 0, true);
    v.setUint16(36, 0, true);
    v.setUint32(38, 0, true);
    v.setUint32(42, e.off, true);
    ch.set(e.nm, 46);
    parts.push(ch);
    csz += ch.length;
  });

  const eo = new Uint8Array(22);
  const v = new DataView(eo.buffer);
  v.setUint32(0, 0x06054b50, true);
  v.setUint16(4, 0, true);
  v.setUint16(6, 0, true);
  v.setUint16(8, cent.length, true);
  v.setUint16(10, cent.length, true);
  v.setUint32(12, csz, true);
  v.setUint32(16, cs, true);
  v.setUint16(20, 0, true);
  parts.push(eo);

  const out = new Uint8Array(parts.reduce((a, x) => a + x.length, 0));
  let q = 0;
  parts.forEach((x) => {
    out.set(x, q);
    q += x.length;
  });
  return out;
}

const xe = (s: unknown): string =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

export function colN(i: number): string {
  let s = "";
  i++;
  while (i > 0) {
    const m = (i - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

const STYLES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="11"/><color rgb="FF1F3864"/><name val="Calibri"/></font></fonts>' +
  '<fills count="3"><fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFDCE6F1"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs>' +
  "</styleSheet>";

export function sheetXml(rows: Array<Array<string | number>>, titles: Array<{ w: number }>): string {
  let x =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    "<cols>" +
    titles.map((tt, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (tt.w || 16) + '" customWidth="1"/>').join("") +
    "</cols>" +
    "<sheetData>";
  rows.forEach((r, ri) => {
    x += '<row r="' + (ri + 1) + '">';
    r.forEach((val, ci) => {
      const ref = colN(ci) + (ri + 1);
      const st = ri === 0 ? 1 : 2;
      if (typeof val === "number" && isFinite(val)) x += '<c r="' + ref + '" s="' + st + '"><v>' + val + "</v></c>";
      else if (val === "" || val == null) x += '<c r="' + ref + '" s="' + st + '"/>';
      else x += '<c r="' + ref + '" s="' + st + '" t="inlineStr"><is><t xml:space="preserve">' + xe(val) + "</t></is></c>";
    });
    x += "</row>";
  });
  return x + "</sheetData></worksheet>";
}

export interface BuildXlsxOptions {
  /** 注入时间戳；不传则用当前时间。测试必须传固定值以保证字节可复现 */
  now?: Date;
}

export function buildXlsx(sheets: Sheet[], opts: BuildXlsxOptions = {}): Uint8Array {
  const now = opts.now ?? new Date();
  const files: ZipEntry[] = [];
  files.push({
    name: "[Content_Types].xml",
    data: u8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets
          .map((_s, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>')
          .join("") +
        "</Types>",
    ),
  });
  files.push({
    name: "_rels/.rels",
    data: u8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        "</Relationships>",
    ),
  });
  files.push({
    name: "xl/workbook.xml",
    data: u8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        "<sheets>" +
        sheets.map((s, i) => '<sheet name="' + xe(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join("") +
        "</sheets>" +
        "</workbook>",
    ),
  });
  files.push({
    name: "xl/_rels/workbook.xml.rels",
    data: u8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        sheets
          .map((_s, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>')
          .join("") +
        '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        "</Relationships>",
    ),
  });
  files.push({ name: "xl/styles.xml", data: u8(STYLES) });
  sheets.forEach((s, i) =>
    files.push({ name: "xl/worksheets/sheet" + (i + 1) + ".xml", data: u8(sheetXml(s.rows, s.titles)) }),
  );
  return zipStore(files, now);
}
