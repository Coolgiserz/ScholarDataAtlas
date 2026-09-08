import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";


import { SOURCES } from "../../src/data/sources";
import { SERVICES } from "../../src/data/services";
import { WEBSEARCHES } from "../../src/data/websearch";
import { SCENARIOS, SCENARIO_MAP } from "../../src/data/scenarios";
import { mSrc, mSrcBase, mSvc, mWb } from "../../src/core/filter";
import { relLow } from "../../src/core/fit";
import { hit, hitCore, hitSb } from "../../src/core/match";
import type { SourceFilters } from "../../src/types";

const FIX = fileURLToPath(new URL("../../../fixtures", import.meta.url));
const goldenFilter = JSON.parse(readFileSync(join(FIX, "golden-filter.json"), "utf8"));

const base = (over: Partial<SourceFilters> = {}): SourceFilters => ({
  scen: "gen", relOnly: true, ...over,
});

/** T1.6 —— 场景过滤名单与基线集合相等 */
describe("T1.6 场景过滤名单", () => {
  SCENARIOS.forEach((sc) => {
    it(`场景「${sc.n}」展示/隐藏数与基线一致`, () => {
      const g = goldenFilter.filt[sc.id];
      const f = base({ scen: sc.id });
      const shown = SOURCES.filter((d) => mSrc(d, f, sc));
      const hidden = SOURCES.filter((d) => !mSrc(d, f, sc));
      expect(shown.length).toBe(g.shown);
      expect(hidden.length).toBe(g.hidden);
      expect(hidden.map((d) => d.n).sort()).toEqual([...g.hiddenNames].sort());
    });
  });
});

/** T1.7 —— 目标型场景不过滤 */
describe("T1.7 目标型场景不过滤", () => {
  ["gen", "free", "cite", "oa"].forEach((id) => {
    it(`「${id}」全部 73 个可见`, () => {
      const sc = SCENARIO_MAP[id];
      expect(sc.rel).toBeUndefined();
      expect(SOURCES.filter((d) => mSrc(d, base({ scen: id }), sc)).length).toBe(SOURCES.length);
    });
  });
  it("学科场景下 relOnly=false 时恢复全部 73 个", () => {
    const sc = SCENARIO_MAP.chip;
    expect(SOURCES.filter((d) => mSrc(d, base({ scen: "chip", relOnly: false }), sc)).length).toBe(73);
  });
});

/** T1.8 —— 常规筛选维度（多选：数组入参，同维度内 OR，跨维度 AND） */
describe("T1.8 筛选维度", () => {
  const sc = SCENARIO_MAP.gen;
  it("按区域筛选：全球", () => {
    const rows = SOURCES.filter((d) => mSrc(d, base({ fR: ["全球"] }), sc));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((d) => d.r === "全球")).toBe(true);
  });
  it("按收费筛选：免费", () => {
    const rows = SOURCES.filter((d) => mSrc(d, base({ fC: ["免费"] }), sc));
    expect(rows.every((d) => d.cost === "免费")).toBe(true);
  });
  it("按适配度档位筛选：High", () => {
    const rows = SOURCES.filter((d) => mSrc(d, base({ fF: ["High"] }), sc));
    expect(rows.length).toBe(15); // 与 golden 基线通用场景 High 数一致
  });
  it("按 DOI 检索筛选：专用端点（doi=3）", () => {
    const rows = SOURCES.filter((d) => mSrc(d, base({ fD: ["3"] }), sc));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((d) => d.doi === 3)).toBe(true);
  });
  it("按 PDF 全文筛选：全量免费（pdf=3）", () => {
    const rows = SOURCES.filter((d) => mSrc(d, base({ fP: ["3"] }), sc));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((d) => d.pdf === 3)).toBe(true);
  });
  it("DOI 多选：专用端点 + 支持检索 取并集", () => {
    const d3 = SOURCES.filter((d) => mSrc(d, base({ fD: ["3"] }), sc)).length;
    const d2 = SOURCES.filter((d) => mSrc(d, base({ fD: ["2"] }), sc)).length;
    const both = SOURCES.filter((d) => mSrc(d, base({ fD: ["3", "2"] }), sc)).length;
    expect(both).toBe(d3 + d2);
  });
  it("PDF 多选：全量免费 + 仅 OA 取并集", () => {
    const p3 = SOURCES.filter((d) => mSrc(d, base({ fP: ["3"] }), sc)).length;
    const p2 = SOURCES.filter((d) => mSrc(d, base({ fP: ["2"] }), sc)).length;
    const both = SOURCES.filter((d) => mSrc(d, base({ fP: ["3", "2"] }), sc)).length;
    expect(both).toBe(p3 + p2);
  });
  it("DOI + PDF 跨维度仍为交集", () => {
    const a = SOURCES.filter((d) => mSrc(d, base({ fD: ["3"] }), sc)).length;
    const b = SOURCES.filter((d) => mSrc(d, base({ fD: ["3"], fP: ["3"] }), sc)).length;
    expect(b).toBeLessThanOrEqual(a);
  });
  it("空数组 / undefined 都代表「不限」", () => {
    const all = SOURCES.filter((d) => mSrc(d, base(), sc)).length;
    expect(SOURCES.filter((d) => mSrc(d, base({ fR: [] }), sc)).length).toBe(all);
    expect(SOURCES.filter((d) => mSrc(d, base({ fR: undefined }), sc)).length).toBe(all);
  });
  it("多选：同一维度取并集（全球 + 国内 = 两者之和）", () => {
    const g = SOURCES.filter((d) => mSrc(d, base({ fR: ["全球"] }), sc)).length;
    const c = SOURCES.filter((d) => mSrc(d, base({ fR: ["国内"] }), sc)).length;
    const both = SOURCES.filter((d) => mSrc(d, base({ fR: ["全球", "国内"] }), sc)).length;
    expect(both).toBe(g + c);
    expect(both).toBeGreaterThanOrEqual(g);
  });
  it("多选：跨维度仍为交集", () => {
    const a = SOURCES.filter((d) => mSrc(d, base({ fR: ["全球"] }), sc)).length;
    const b = SOURCES.filter((d) => mSrc(d, base({ fR: ["全球"], fC: ["免费"] }), sc)).length;
    expect(b).toBeLessThanOrEqual(a);
  });
  it("多选：适配度 High + Medium = 两档之和", () => {
    const h = SOURCES.filter((d) => mSrc(d, base({ fF: ["High"] }), sc)).length;
    const m = SOURCES.filter((d) => mSrc(d, base({ fF: ["Medium"] }), sc)).length;
    expect(SOURCES.filter((d) => mSrc(d, base({ fF: ["High", "Medium"] }), sc)).length).toBe(h + m);
  });
  it("搜索命中名称", () => {
    const rows = SOURCES.filter((d) => mSrc(d, base({ q: "crossref" }), sc));
    expect(rows.map((d) => d.n)).toContain("Crossref");
  });
  it("无匹配时返回空", () => {
    expect(SOURCES.filter((d) => mSrc(d, base({ q: "zzz-不存在的源-zzz" }), sc)).length).toBe(0);
  });
});

/** T1.9 —— 匹配语义：搜索框 q 走子串；场景匹配 hit() 走 ASCII 词边界 */
describe("T1.9 匹配语义", () => {
  const sc = SCENARIO_MAP.gen;
  const probe = {
    n: "X", t: "", r: "", l: "", scale: "", cost: "", api: "",
    doi: 0, pdf: 0, sb: "css 样式", ge: "", nt: "",
  } as (typeof SOURCES)[number];

  it("搜索框 q 走子串（cs 能命中 css）", () => {
    expect(mSrcBase(probe, base({ q: "cs" }), sc)).toBe(true);
  });
  it("场景匹配 hit() 走 ASCII 词边界（cs 不命中 css 内部）", () => {
    expect(hitCore(probe, ["cs"])).toBe(false);
    expect(hitSb(probe, ["cs"])).toBe(false);
  });
  it("词边界：独立词 cs 可命中", () => {
    const p2 = { ...probe, sb: "a cs b" } as (typeof SOURCES)[number];
    expect(hitSb(p2, ["cs"])).toBe(true);
  });
  it("中文走子串（不走词边界）", () => {
    const p3 = { ...probe, sb: "半导体材料" } as (typeof SOURCES)[number];
    const p4 = { ...probe, nt: "半导体材料" } as (typeof SOURCES)[number];
    expect(hitCore(p3, ["导体"])).toBe(true);
    expect(hit(p4, ["导体"])).toBe(true); // hit 覆盖 nt 字段
    expect(mSrcBase(p4, base({ q: "导体" }), sc)).toBe(true);
  });
  it("正则元字符不会炸（ReDoS / 语法错误）", () => {
    expect(() => hitSb(probe, ["c++", "((", "[a-z"])).not.toThrow();
  });
});

/** 服务表筛选 */
describe("服务表筛选", () => {
  it("默认全部 72 个（已从 SERVICES 移除 Perplexity API，移到开放网络表）", () => {
    expect(SERVICES.filter((d) => mSvc(d, {})).length).toBe(72);
  });
  it("按语言筛选：Python", () => {
    const rows = SERVICES.filter((d) => mSvc(d, { sLang: ["Python"] }));
    expect(rows.every((d) => d.lang === "Python")).toBe(true);
  });
  it("按覆盖数据源筛选走子串匹配", () => {
    const rows = SERVICES.filter((d) => mSvc(d, { sSrc: ["OpenAlex"] }));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((d) => d.src.includes("OpenAlex"))).toBe(true);
  });
  it("多选语言：Python + Java 取并集", () => {
    const py = SERVICES.filter((d) => mSvc(d, { sLang: ["Python"] })).length;
    const ja = SERVICES.filter((d) => mSvc(d, { sLang: ["Java"] })).length;
    const both = SERVICES.filter((d) => mSvc(d, { sLang: ["Python", "Java"] })).length;
    expect(both).toBe(py + ja);
    expect(ja).toBeGreaterThan(0); // 原版下拉只有 4 项时能选到，别退化
  });
  it("多选需机构订阅：是 + 否 = 全部 72", () => {
    expect(SERVICES.filter((d) => mSvc(d, { sSub: ["1", "0"] })).length).toBe(72);
  });
});

/** 数据完整性（防字段拼写错误） */
describe("数据完整性", () => {
  it("数据源必填字段无缺失", () => {
    SOURCES.forEach((d) => {
      ["n", "t", "r", "l", "scale", "cost", "api", "sb", "ge", "nt"].forEach((k) => {
        expect((d as unknown as Record<string, unknown>)[k], `${d.n}.${k}`).toBeTruthy();
      });
      expect([0, 1, 2, 3]).toContain(d.doi);
      expect([0, 1, 2, 3]).toContain(d.pdf);
    });
  });
  it("数据源名称唯一", () => {
    expect(new Set(SOURCES.map((d) => d.n)).size).toBe(SOURCES.length);
  });
  it("relLow 仅对有 rel 的场景为真", () => {
    SCENARIOS.filter((s) => !s.rel).forEach((sc) =>
      SOURCES.forEach((d) => expect(relLow(d, sc)).toBe(false)),
    );
  });
});

/** 开放网络表筛选 —— 闭环 Perplexity API 移栏 */
describe("开放网络表筛选", () => {
  it("websearch 数据条数 = 7（不含 SERVICES 主项 Perplexity API，已移至本表）", () => {
    expect(WEBSEARCHES.length).toBe(7);
    expect(WEBSEARCHES.map((d) => d.n)).toContain("Perplexity Sonar API");
    expect(WEBSEARCHES.map((d) => d.n)).toContain("Tavily");
    expect(WEBSEARCHES.map((d) => d.n)).toContain("Brave Search API");
    expect(WEBSEARCHES.map((d) => d.n)).toContain("Exa");
    expect(WEBSEARCHES.map((d) => d.n)).toContain("Serper");
    expect(WEBSEARCHES.map((d) => d.n)).toContain("SerpAPI");
    expect(WEBSEARCHES.map((d) => d.n)).toContain("Linkup");
    // SERVICES 已不含 Perplexity API（已移走）
    expect(SERVICES.map((d) => d.n)).not.toContain("Perplexity API");
  });
  it("默认全部 7 个", () => {
    expect(WEBSEARCHES.filter((d) => mWb(d, {})).length).toBe(7);
  });
  it("按类型筛选：AI产品", () => {
    const rows = WEBSEARCHES.filter((d) => mWb(d, { wT: ["AI产品"] }));
    expect(rows.every((d) => d.ty === "AI产品")).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
  });
  it("按数据覆盖筛选走子串匹配", () => {
    const rows = WEBSEARCHES.filter((d) => mWb(d, { wSrc: ["Google SERP"] }));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((d) => d.src.includes("Google SERP"))).toBe(true);
  });
  it("按搜索框 q 子串匹配", () => {
    const rows = WEBSEARCHES.filter((d) => mWb(d, { q: "tavily" }));
    expect(rows.map((d) => d.n)).toContain("Tavily");
  });
  it("多选类型：AI产品 + 官方API 取并集", () => {
    const ai = WEBSEARCHES.filter((d) => mWb(d, { wT: ["AI产品"] })).length;
    const off = WEBSEARCHES.filter((d) => mWb(d, { wT: ["官方API"] })).length;
    const both = WEBSEARCHES.filter((d) => mWb(d, { wT: ["AI产品", "官方API"] })).length;
    expect(both).toBe(ai + off);
  });
});