/** 重算 fit + filter 黄金基线（一次性脚本，作为测试存在以便用 vitest 转译）
 *
 *  警告：必须独立运行（不影响主测试套件）。
 *  用法：REGEN=1 npx vitest run tests/unit/_regen-fixtures.test.ts
 *
 *  ⚠️ 2026-09-09 教训：fit/filter 都是纯函数，无日期参数，但 xlsx 是。
 *     所以 fit/filter 黄金可以无脑重生成，xlsx 必须用固定日期（见 regen-golden.test.ts）。
 */
import { describe, it } from "vitest";
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { SOURCES } from "../../src/data/sources";
import { SCENARIOS } from "../../src/data/scenarios";
import { fitOf, relVal, relLow } from "../../src/core/fit";
import { mSrc } from "../../src/core/filter";

const FIX = fileURLToPath(new URL("../../../fixtures", import.meta.url));

describe.skipIf(!process.env.REGEN)("重算 fit + filter 黄金基线", () => {
  it("写回 golden-fit.json + golden-filter.json", () => {
    // === golden-fit.json ===
    const fit: Record<string, Array<[string, number, string, number | null, number]>> = {};
    SCENARIOS.forEach((sc) => {
      fit[sc.id] = SOURCES.map((d) => {
        const f = fitOf(d, sc);
        return [d.n, f.total, f.lab, sc.rel ? relVal(d, sc) : null, relLow(d, sc) ? 1 : 0];
      });
    });

    const goldenFit = {
      _meta: {
        generated: "2026-09-09",
        source: "ScholarDataAtlas v3.0（85 源：73 原有 + 12 新能源 2026-09-09 补录）",
        cols: ["名称", "适配度分值", "档位", "场景相关性relVal", "是否他领域垂类(1=是)"],
        sources: SOURCES.length,
        scenarios: SCENARIOS.length,
      },
      fit,
    };
    writeFileSync(join(FIX, "golden-fit.json"), JSON.stringify(goldenFit, null, 2) + "\n");
    console.log(`[regen] golden-fit.json: ${SOURCES.length} 源 × ${SCENARIOS.length} 场景`);

    // === golden-filter.json ===
    const base = (over: Record<string, unknown> = {}) => ({ scen: "gen", ...over });
    const filt: Record<string, { shown: number; hidden: number; hiddenNames: string[] }> = {};
    SCENARIOS.forEach((sc) => {
      const f = base({ scen: sc.id }) as Parameters<typeof mSrc>[1];
      const shown = SOURCES.filter((d) => mSrc(d, f, sc));
      const hidden = SOURCES.filter((d) => !mSrc(d, f, sc));
      filt[sc.id] = {
        shown: shown.length,
        hidden: hidden.length,
        hiddenNames: hidden.map((d) => d.n).sort(),
      };
    });

    const goldenFilter = {
      _meta: {
        generated: "2026-09-09",
        sources: SOURCES.length,
        scenarios: SCENARIOS.length,
      },
      filt,
    };
    writeFileSync(join(FIX, "golden-filter.json"), JSON.stringify(goldenFilter, null, 2) + "\n");
    console.log(`[regen] golden-filter.json:`);
    SCENARIOS.forEach((sc) => {
      const r = filt[sc.id];
      console.log(`  ${sc.id.padEnd(5)}: ${String(r.shown).padStart(3)} shown, ${String(r.hidden).padStart(2)} hidden`);
    });

    // 留个引用让测试不会因为 noExpect 而被警告
    void readFileSync;
  });
});
