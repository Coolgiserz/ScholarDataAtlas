/** 数据源 ↔ 检索服务 双向关联 —— T1.24
 *
 *  服务的 `src` 字段是人工填写的自由文本，与数据源名称并不一致，
 *  这组用例锁死归一化规则，防止以后加服务时悄悄退化成「一堆关联不上」。
 */

import { describe, it, expect } from "vitest";

import { buildLinks, linkedServices, linkedSources, resolveSrc, UNLINKABLE } from "../../src/core/link";
import { SOURCES } from "../../src/data/sources";
import { SERVICES } from "../../src/data/services";

const NAMES = SOURCES.map((d) => d.n);
const IDX = buildLinks(SOURCES, SERVICES);

describe("T1.24 关联解析", () => {
  it("A1 原名能直接命中", () => {
    expect(resolveSrc("OpenAlex", NAMES)).toBe("OpenAlex");
    expect(resolveSrc("Crossref", NAMES)).toBe("Crossref");
    expect(resolveSrc("arXiv", NAMES)).toBe("arXiv");
  });

  it("A2 别名归一化：PubMed / WoS / 万方 / CNKI", () => {
    expect(resolveSrc("PubMed", NAMES)).toBe("PubMed / PMC");
    expect(resolveSrc("WoS", NAMES)).toBe("Web of Science");
    expect(resolveSrc("万方", NAMES)).toBe("万方数据");
    expect(resolveSrc("CNKI", NAMES)).toBe("中国知网 CNKI");
  });

  it("A3 多源与工具类明确不关联，且不被当成解析失败", () => {
    for (const v of ["多源", "PDF → TEI", "GROBID 服务", "Zotero", "Mendeley", "未公开"]) {
      expect(resolveSrc(v, NAMES), v).toBeNull();
      expect(UNLINKABLE.has(v), v).toBe(true);
    }
  });

  it("A4 空值不关联", () => {
    expect(resolveSrc("", NAMES)).toBeNull();
    expect(resolveSrc(undefined, NAMES)).toBeNull();
  });
});

describe("T1.25 关联索引", () => {
  it("B1 覆盖率：73 个服务里至少 49 个能关联到数据源", () => {
    const linked = SERVICES.filter((s) => linkedSources(IDX, s.n).length).length;
    expect(linked).toBeGreaterThanOrEqual(49);
  });

  it("B2 每个服务都有关联数组（可为空），不会取到 undefined", () => {
    for (const s of SERVICES) expect(Array.isArray(linkedSources(IDX, s.n)), s.n).toBe(true);
  });

  it("B3 双向一致：服务 A 指向源 B ⟺ 源 B 的服务列表含 A", () => {
    for (const s of SERVICES) {
      for (const src of linkedSources(IDX, s.n)) {
        expect(linkedServices(IDX, src), `${s.n} → ${src}`).toContain(s.n);
      }
    }
    for (const d of SOURCES) {
      for (const svc of linkedServices(IDX, d.n)) {
        expect(linkedSources(IDX, svc), `${d.n} ← ${svc}`).toContain(d.n);
      }
    }
  });

  it("B4 关联到的源必须真实存在（别名写错会在这里暴露）", () => {
    const set = new Set(NAMES);
    for (const s of SERVICES) {
      for (const src of linkedSources(IDX, s.n)) expect(set.has(src), `${s.n} → ${src}`).toBe(true);
    }
  });

  it("B5 未被别名表覆盖的 src 全部为已知不可关联项（新增服务时的护栏）", () => {
    expect(IDX.unresolved).toEqual([]);
  });

  it("B6 抽样：arXiv / Crossref / OpenAlex 都有多个可用封装", () => {
    for (const n of ["arXiv", "Crossref", "OpenAlex"]) {
      expect(linkedServices(IDX, n).length, n).toBeGreaterThan(0);
    }
  });
});
