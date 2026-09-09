import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createHash } from "node:crypto";


import { SOURCES } from "../../src/data/sources";
import { SERVICES } from "../../src/data/services";
import { WEBSEARCHES } from "../../src/data/websearch";
import { SCENARIO_MAP } from "../../src/data/scenarios";
import { srcRows, svcRows, wbRows, metaRows } from "../../src/core/rows";
import { buildXlsx, crc32, colN } from "../../src/core/export/xlsx";
import { toCsv } from "../../src/core/export/csv";
import { relLow } from "../../src/core/fit";

const FIX = fileURLToPath(new URL("../../../fixtures", import.meta.url));
const g = JSON.parse(readFileSync(join(FIX, "golden-export.json"), "utf8"));

/** 必须与 golden 生成脚本一致：new Date(2026, 8, 8, 12, 0, 0) */
const FIXED_NOW = new Date(2026, 8, 8, 12, 0, 0);
const sha = (u: Uint8Array) => createHash("sha256").update(Buffer.from(u)).digest("hex");

const sheets = () => {
  const sc = SCENARIO_MAP.gen;
  return [
    srcRows(SOURCES, sc),
    svcRows(SERVICES),
    wbRows(WEBSEARCHES),
    metaRows({
      sc, srcCount: SOURCES.length, srcTotal: SOURCES.length,
      svcCount: SERVICES.length, svcTotal: SERVICES.length,
      wbCount: WEBSEARCHES.length, wbTotal: WEBSEARCHES.length,
      allSources: SOURCES, now: FIXED_NOW,
    }),
  ];
};

/** T1.11 —— xlsx 字节级一致 */
describe("T1.11 xlsx 与基线字节一致", () => {
  const xlsx = buildXlsx(sheets(), { now: FIXED_NOW });
  it("字节数一致", () => expect(xlsx.length).toBe(g.xlsx.bytes));
  it("sha256 一致", () => expect(sha(xlsx)).toBe(g.xlsx.sha256));
  it("PK 魔数正确", () => expect(Buffer.from(xlsx.slice(0, 2)).toString("ascii")).toBe("PK"));
});

/** T1.12 —— CRC32 标准向量 */
describe("T1.12 CRC32", () => {
  const enc = (s: string) => new TextEncoder().encode(s);
  it("空串 → 0", () => expect(crc32(enc(""))).toBe(0));
  it('"123456789" → 0xCBF43926', () => expect(crc32(enc("123456789"))).toBe(0xcbf43926));
  it("中文 UTF-8 可计算", () => expect(crc32(enc("半导体"))).toBeGreaterThan(0));
});

/** T1.13 —— ZIP 结构完整 */
describe("T1.13 ZIP 结构", () => {
  const xlsx = buildXlsx(sheets(), { now: FIXED_NOW });
  const s = Buffer.from(xlsx).toString("latin1");
  it("含本地文件头 PK\\x03\\x04", () => expect(s).toContain("PK\u0003\u0004"));
  it("含中央目录 PK\\x01\\x02", () => expect(s).toContain("PK\u0001\u0002"));
  it("含 EOCD PK\\x05\\x06", () => expect(s).toContain("PK\u0005\u0006"));
  it("含四个工作表", () => {
    for (let i = 1; i <= 4; i++) expect(s).toContain("xl/worksheets/sheet" + i + ".xml");
  });
});

/** T1.14 —— CSV 转义与 BOM */
describe("T1.14 CSV", () => {
  it("首字节为 UTF-8 BOM", () => {
    expect(toCsv([["a"]]).charCodeAt(0)).toBe(0xfeff);
  });
  it("含逗号/引号/换行的字段正确转义", () => {
    const csv = toCsv([["a,b"], ['q"q'], ["l1\nl2"]]);
    expect(csv).toContain('"a,b"');
    expect(csv).toContain('"q""q"');
    expect(csv).toContain('"l1\nl2"');
  });
  it("行分隔为 CRLF", () => expect(toCsv([["a"], ["b"]])).toContain("\r\n"));
});

/** T1.15 —— 导出与视图一致 */
describe("T1.15 导出行数与可见行一致", () => {
  it("数据源表 = 85 数据行 + 1 表头（73 原有 + 12 领域垂直学术源 2026-09-09 补录）", () => {
    const sh = srcRows(SOURCES, SCENARIO_MAP.gen);
    expect(sh.rows.length).toBe(86);
    expect(sh.rows[0].length).toBe(17);
  });
  it("服务表 = 72 数据行 + 1 表头（已从 SERVICES 移除 Perplexity API）", () => {
    const sh = svcRows(SERVICES);
    expect(sh.rows.length).toBe(73);
    expect(sh.rows[0].length).toBe(11); // 含 Star 列
  });
  it("开放网络表 = 7 数据行 + 1 表头", () => {
    const sh = wbRows(WEBSEARCHES);
    expect(sh.rows.length).toBe(8);
    expect(sh.rows[0].length).toBe(9);
  });
  it("过滤后导出行数随之减少", () => {
    const sc = SCENARIO_MAP.chip;
    const visible = SOURCES.filter((d) => !relLow(d, sc));
    expect(srcRows(visible, sc).rows.length).toBe(visible.length + 1);
  });
});

/** 列名工具 */
describe("colN 列名", () => {
  it("0→A, 25→Z, 26→AA", () => {
    expect(colN(0)).toBe("A");
    expect(colN(25)).toBe("Z");
    expect(colN(26)).toBe("AA");
  });
});