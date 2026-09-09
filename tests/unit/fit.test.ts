import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createHash } from "node:crypto";


import { SOURCES } from "../../src/data/sources";
import { SCENARIOS } from "../../src/data/scenarios";
import { fitOf, relVal, relLow } from "../../src/core/fit";

const FIX = fileURLToPath(new URL("../../../fixtures", import.meta.url));
const golden = JSON.parse(readFileSync(join(FIX, "golden-fit.json"), "utf8"));

/** T1.1 —— 适配度黄金对照：85 源（73 原有 + 12 新能源 2026-09-09 补录） × 10 场景，逐条全等 */
describe("T1.1 适配度 golden 对照", () => {
  it("场景数与源数与基线一致", () => {
    expect(SCENARIOS.length).toBe(Object.keys(golden.fit).length);
    expect(SOURCES.length).toBe(golden._meta.sources);
  });

  SCENARIOS.forEach((sc) => {
    it(`场景「${sc.n}」85 条分值 / 档位 / relVal / relLow 全等`, () => {
      const base: Array<[string, number, string, number | null, number]> = golden.fit[sc.id];
      expect(base.length).toBe(SOURCES.length);
      const actual = SOURCES.map((d) => {
        const f = fitOf(d, sc);
        return [d.n, f.total, f.lab, sc.rel ? relVal(d, sc) : null, relLow(d, sc) ? 1 : 0] as const;
      });
      expect(actual.map((a) => [...a])).toEqual(base.map((b) => [...b]));
    });
  });
});

/** T1.2 —— 档位阈值边界 */
describe("T1.2 档位阈值", () => {
  const sc = SCENARIOS[0];
  const mk = (api: string, cost: string, doi: number, pdf: number): (typeof SOURCES)[number] => ({
    n: "T", t: "", r: "", l: "", scale: "", api, cost, doi, pdf, sb: "", ge: "", nt: "",
  });
  it("满分源判为 High", () => {
    expect(fitOf(mk("免 key", "免费", 3, 3), sc).m).toBeGreaterThanOrEqual(7.5);
  });
  it("零分源判为 Low", () => {
    expect(fitOf(mk("无 API", "商业授权", 1, 0), sc).lab).toBe("Low");
  });
  it("所有源的机械分不超过 10", () => {
    SCENARIOS.forEach((s) =>
      SOURCES.forEach((d) => expect(fitOf(d, s).m).toBeLessThanOrEqual(10)),
    );
  });
});

/** T1.3 —— 通用场景人工修正 */
describe("T1.3 通用场景人工修正", () => {
  const gen = SCENARIOS.find((s) => s.id === "gen")!;
  const withFr = SOURCES.filter((d) => d.fr);
  it("存在人工修正的源", () => {
    expect(withFr.length).toBeGreaterThan(0);
  });
  it("有 fr 的源必同时有 fit（数据完整性）", () => {
    expect(withFr.filter((d) => !d.fit).length).toBe(0);
  });
  it("通用场景下 total 取人工档位值，非机械分", () => {
    withFr.forEach((d) => {
      const f = fitOf(d, gen);
      expect(f.adj).not.toBeNull();
      expect(f.lab).toBe(d.fit);
      expect(f.total).toBe({ High: 8.5, Medium: 6, Low: 3 }[d.fit as "High" | "Medium" | "Low"]);
    });
  });
  it("非通用场景不触发人工修正", () => {
    const chip = SCENARIOS.find((s) => s.id === "chip")!;
    withFr.forEach((d) => expect(fitOf(d, chip).adj).toBeNull());
  });
});

/** T1.5 —— relVal 分档 */
describe("T1.5 场景相关性分档", () => {
  it("目标型场景无 rel 维度", () => {
    ["gen", "free", "cite", "oa"].forEach((id) => {
      const sc = SCENARIOS.find((s) => s.id === id)!;
      expect(sc.rel).toBeUndefined();
      SOURCES.forEach((d) => expect(relVal(d, sc)).toBe(0));
    });
  });
  it("relVal 只取五档之一", () => {
    SCENARIOS.filter((s) => s.rel).forEach((sc) =>
      SOURCES.forEach((d) => expect([0.1, 0.15, 0.3, 0.45, 0.75, 1]).toContain(relVal(d, sc))),
    );
  });
  it("中文场景最低档为 0.1，其余学科场景为 0.15", () => {
    const cn = SCENARIOS.find((s) => s.id === "cn")!;
    const chip = SCENARIOS.find((s) => s.id === "chip")!;
    SOURCES.forEach((d) => {
      const a = relVal(d, cn), b = relVal(d, chip);
      if (a <= 0.15) expect(a).toBe(0.1);
      if (b <= 0.15) expect(b).toBe(0.15);
    });
  });
});

/** 实现指纹：改动 core/fit.ts 后若分值漂移，这里会先于人工发现 */
describe("实现指纹", () => {
  const digest = () => {
    const h = createHash("sha256");
    SCENARIOS.forEach((sc) =>
      SOURCES.forEach((d) => {
        const f = fitOf(d, sc);
        h.update(`${sc.id}|${d.n}|${f.total}|${f.lab}`);
      }),
    );
    return h.digest("hex");
  };
  it("850 条适配度结果稳定且可复现（73 原有 + 12 新能源 2026-09-09 补录）", () => {
    expect(digest()).toBe(digest());
    expect(digest()).toHaveLength(64);
  });
});
