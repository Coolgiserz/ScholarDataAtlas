/** 重算 xlsx 黄金基线 —— 平时跳过，只在 REGEN=1 时执行并写盘。
 *
 *  ⚠️ 血泪教训（2026-09-08）：日期必须是固定值 new Date(2026,8,8,12,0,0)。
 *     曾经误用真实 new Date()，把「导出时间」写进 xlsx，导致 sha256 每次都变，
 *     表现为「导出测试莫名其妙失败」。这里的 FIXED_NOW 与 export.test.ts 必须一致。
 *
 *  用法：REGEN=1 node vitest.mjs run tests/unit/regen-golden.test.ts
 */
import { describe, it } from "vitest";
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createHash } from "node:crypto";

import { SOURCES } from "../../src/data/sources";
import { SERVICES } from "../../src/data/services";
import { WEBSEARCHES } from "../../src/data/websearch";
import { SCENARIO_MAP } from "../../src/data/scenarios";
import { srcRows, svcRows, wbRows, metaRows } from "../../src/core/rows";
import { buildXlsx } from "../../src/core/export/xlsx";

const FIX = fileURLToPath(new URL("../../../fixtures", import.meta.url));
const FIXED_NOW = new Date(2026, 8, 8, 12, 0, 0);
const sha = (u: Uint8Array) => createHash("sha256").update(Buffer.from(u)).digest("hex");

const sheets = () => {
  const sc = SCENARIO_MAP.gen;
  return [
    srcRows(SOURCES, sc),
    svcRows(SERVICES),
    wbRows(WEBSEARCHES),
    metaRows({
      sc,
      srcCount: SOURCES.length,
      srcTotal: SOURCES.length,
      svcCount: SERVICES.length,
      svcTotal: SERVICES.length,
      wbCount: WEBSEARCHES.length,
      wbTotal: WEBSEARCHES.length,
      allSources: SOURCES,
      now: FIXED_NOW,
    }),
  ];
};

describe.skipIf(!process.env.REGEN)("重算 xlsx 黄金基线", () => {
  it("写回 golden-export.json", () => {
    const xlsx = buildXlsx(sheets(), { now: FIXED_NOW });
    const p = join(FIX, "golden-export.json");
    const g = JSON.parse(readFileSync(p, "utf8"));
    const before = { ...g.xlsx };
    g.xlsx.bytes = xlsx.length;
    g.xlsx.sha256 = sha(xlsx);
    writeFileSync(p, JSON.stringify(g, null, 2) + "\n");
    console.log("[regen] xlsx 基线：", before, "→", g.xlsx);
  });
});
