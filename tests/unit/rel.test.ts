/** 场景相关性判定回归 —— T1.16+
 *
 *  这一组用例专门锁死 2026-09-08 修掉的四个判定缺陷，防止以后改词表时悄悄退化：
 *    A. lo（他领域）抢在 hi 之前  → NASA ADS「天文 / 物理 / arXiv」被误杀到 0.15
 *    B.「全球」被当学科代理       → MathSciNet（纯数学）靠 ge="全球" 蹭到 0.45，与 Scopus 同分
 *    C. 综合源写法不统一          → PubScholar「科技全领域」掉到兜底 0.3，低于日本 CiNii
 *    D. 中文场景地域硬约束        → 他国区域源再综合也不能算中文源
 */

import { describe, it, expect } from "vitest";

import { BROAD, relCalc, relLow, relVal } from "../../src/core/fit";
import { SCENARIOS, SCENARIO_MAP } from "../../src/data/scenarios";
import { SOURCES } from "../../src/data/sources";
import type { Scenario, Source } from "../../src/types";

const SRC = Object.fromEntries(SOURCES.map((s) => [s.n, s])) as Record<string, Source>;
const chip = SCENARIO_MAP.chip;
const cn = SCENARIO_MAP.cn;
const bio = SCENARIO_MAP.bio;

describe("T1.16 判定顺序：hi 必须优先于 lo", () => {
  it("A1 NASA ADS「天文 / 物理 / arXiv」在芯片场景应为上游学科 0.75，不再被「天文」踩到 0.15", () => {
    const h = relCalc(SRC["NASA ADS"], chip)!;
    expect(h.v).toBe(0.75);
    expect(h.label).toBe("上游 / 邻近学科");
    expect(h.kw).toContain("物理");
  });

  it("A2 Taylor & Francis「人文社科与工程」含「工程」，芯片场景应为 0.75", () => {
    const h = relCalc(SRC["Taylor & Francis"], chip)!;
    expect(h.v).toBe(0.75);
    expect(h.kw).toContain("工程");
  });

  it("A3 纯他领域源仍应落到 0.15（PubMed 在芯片场景）", () => {
    expect(relVal(SRC["PubMed / PMC"], chip)).toBe(0.15);
    expect(relLow(SRC["PubMed / PMC"], chip)).toBe(true);
  });
});

describe("T1.17「全球」退出学科判定，综合档只认 sb", () => {
  it("B1 MathSciNet（纯数学，ge=全球）在芯片场景应降到 0.3，不再与 Scopus 同分", () => {
    const h = relCalc(SRC["MathSciNet"], chip)!;
    expect(h.v).toBe(0.3);
    expect(h.kw).toEqual([]);
  });

  it("B2 Scopus（sb 含全学科）仍为 0.45", () => {
    expect(relVal(SRC["Scopus"], chip)).toBe(0.45);
  });

  it("B3 数学库与综合库必须拉开档次", () => {
    expect(relVal(SRC["MathSciNet"], chip)).toBeLessThan(relVal(SRC["Scopus"], chip));
    expect(relVal(SRC["zbMATH Open"], chip)).toBeLessThan(relVal(SRC["Web of Science"], chip));
  });

  it("B4 化学类源归入芯片上游学科（光刻胶 / 电子特气 / CMP 均属化学）", () => {
    expect(relVal(SRC["CAS SciFinder"], chip)).toBe(0.75);
    expect(relVal(SRC["Reaxys"], chip)).toBe(0.75);
  });
});

describe("T1.18 综合源写法归一化", () => {
  it("C1 PubScholar「科技全领域」应升到 0.45", () => {
    expect(relVal(SRC["PubScholar"], chip)).toBe(0.45);
  });

  it("C2 NSTL「理 / 工 / 农 / 医」、SciEngine「理工农医」、百度学术「500+ 研究方向」同档", () => {
    for (const n of ["NSTL", "SciEngine（科学出版社）", "百度学术"]) {
      expect(relVal(SRC[n], chip), n).toBe(0.45);
    }
  });

  it("C3 ChinaXiv「自然科学 40+ 学科」、CSCD、CSTR 归为综合", () => {
    for (const n of ["ChinaXiv", "CSCD", "CSTR"]) {
      expect(relVal(SRC[n], chip), n).toBe(0.45);
    }
  });

  it("C4 裸的「全领域」不得被当成综合词，否则「医学全领域」会误升", () => {
    expect(BROAD).not.toContain("全领域");
    expect(relVal(SRC["中华医学期刊全文数据库"], chip)).toBe(0.15);
  });

  it("C5 综合源不再低于他国区域综合源之下（PubScholar ≥ CiNii）", () => {
    expect(relVal(SRC["PubScholar"], chip)).toBeGreaterThanOrEqual(relVal(SRC["CiNii（日本）"], chip));
  });
});

describe("T1.19 中文场景：地域是硬约束", () => {
  it("D1 日本 / 韩国 / 俄罗斯 / 拉美 / 非洲源在中文场景落到 0.1", () => {
    for (const n of ["CiNii（日本）", "KISTI / KoreaScience", "eLibrary.ru（俄）", "SciELO", "AJOL（非洲）"]) {
      expect(relVal(SRC[n], cn), n).toBe(0.1);
    }
  });

  it("D2 地域降权优先于综合档：CiNii「日本全学科」不能靠「全学科」升到 0.45", () => {
    const h = relCalc(SRC["CiNii（日本）"], cn)!;
    expect(h.v).toBe(0.1);
    expect(h.field).toBe("地域 / 语种");
  });

  it("D3 CNKI / 万方在中文场景为强相关 1.0", () => {
    expect(relVal(SRC["中国知网 CNKI"], cn)).toBe(1);
    expect(relVal(SRC["万方数据"], cn)).toBe(1);
  });
});

describe("T1.20 命中依据可用于界面解释", () => {
  it("E1 每个学科型场景的每个源都能给出档位与命中词", () => {
    for (const sc of SCENARIOS) {
      if (!sc.rel) continue;
      for (const d of SOURCES) {
        const h = relCalc(d, sc);
        expect(h, `${d.n} @ ${sc.id}`).toBeTruthy();
        expect(h!.label).toBeTruthy();
        expect(Array.isArray(h!.kw)).toBe(true);
        if (h!.v === 0.3) expect(h!.kw, `${d.n} @ ${sc.id} 兜底档不应有命中词`).toEqual([]);
        else expect(h!.kw.length, `${d.n} @ ${sc.id} 应有命中词`).toBeGreaterThan(0);
      }
    }
  });

  it("E2 目标型场景（无 rel）返回 null，界面不展示相关性说明", () => {
    for (const id of ["gen", "free", "cite", "oa"]) {
      expect(relCalc(SOURCES[0], SCENARIO_MAP[id] as Scenario)).toBeNull();
    }
  });

  it("E3 生物场景：数学源应归他领域", () => {
    expect(relVal(SRC["MathSciNet"], bio)).toBe(0.15);
  });
});

describe("T1.21 混合学科封顶", () => {
  it("F1 Europe PMC「生医+专利」在芯片场景封顶 0.75，不得因「专利」拿 1.0", () => {
    const h = relCalc(SRC["Europe PMC"], chip)!;
    expect(h.v).toBe(0.75);
    expect(h.note).toMatch(/封顶/);
  });

  it("F2 综合型专利源不受封顶影响：Lens.org / Dimensions / SmartLib 仍为 1.0", () => {
    for (const n of ["Lens.org", "Dimensions", "SmartLib 全球文献库"]) {
      expect(relVal(SRC[n], chip), n).toBe(1);
    }
  });

  it("F3 封顶后 IEEE Xplore 不低于 Europe PMC", () => {
    expect(relVal(SRC["IEEE Xplore"], chip)).toBeGreaterThanOrEqual(relVal(SRC["Europe PMC"], chip));
  });
});

describe("T1.22 中文场景：全球源不能被误降", () => {
  it("G1 ge 含「全球」的国际大源在中文场景仍为 0.45，不落兜底", () => {
    for (const n of ["IEEE Xplore", "PubMed / PMC", "arXiv", "bioRxiv / medRxiv"]) {
      expect(relVal(SRC[n], cn), n).toBe(0.45);
    }
  });

  it("G2 他国区域源仍优先降权（地域硬约束不被「全球」覆盖）", () => {
    expect(relVal(SRC["CiNii（日本）"], cn)).toBe(0.1);
    expect(relVal(SRC["eLibrary.ru（俄）"], cn)).toBe(0.1);
  });

  it("G3 学科型场景不受此规则影响：MathSciNet 在芯片场景仍为 0.3", () => {
    expect(relVal(SRC["MathSciNet"], chip)).toBe(0.3);
  });
});

describe("T1.23 光电场景：化学属上游学科", () => {
  it("H1 发光材料 / 光催化属化学，ChemRxiv、SciFinder、Reaxys 在光电场景为 0.75", () => {
    const opt = SCENARIO_MAP.opt;
    for (const n of ["ChemRxiv", "CAS SciFinder", "Reaxys"]) {
      expect(relVal(SRC[n], opt), n).toBe(0.75);
    }
  });
});
