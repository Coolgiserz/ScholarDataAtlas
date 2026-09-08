/** 导出数据集组装 —— 纯函数，与表格可见行严格对齐 */

import type { Scenario, Service, Sheet, Source, Websearch } from "../types";
import { fitOf, relLow } from "./fit";
import { SCENARIOS } from "../data/scenarios";

export const DS: Record<number, string> = { 3: "●", 2: "◐", 1: "○", 0: "—" };
export const DL: Record<number, string> = { 3: "专用端点", 2: "支持检索", 1: "无可靠 API", 0: "不支持" };
export const PL: Record<number, string> = { 3: "全量免费", 2: "仅 OA", 1: "仅订阅", 0: "不支持" };

/** 数据核查日期（导出说明表使用） */
export const CHECK_DATE = "2026-09-08";

export function srcRows(rows: Source[], sc: Scenario): Sheet {
  const H = [
    "数据源", "官网", "类型", "区域", "层级", "规模", "收费", "API", "API 覆盖范围",
    "DOI", "PDF", "学科覆盖", "地域 / 语种", "适配度（" + sc.n + "）", "适配度分值",
    "打分明细", "一句话要点",
  ];
  const T = H.map((h) => ({ w: h.length > 6 ? 26 : 14 }));
  T[0].w = 24; T[1].w = 34; T[5].w = 30; T[8].w = 60; T[11].w = 24; T[12].w = 20; T[15].w = 40; T[16].w = 60;
  const out: Array<Array<string | number>> = [H];
  rows.forEach((d) => {
    const f = fitOf(d, sc);
    out.push([
      d.n, d.u || "", d.t, d.r, d.l, d.scale, d.cost, d.api, d.as || "",
      DS[d.doi], d.pdf === 0 ? "—" : DS[d.pdf], d.sb, d.ge, f.lab, f.total,
      f.adj
        ? "机械分 " + f.m + " → 人工判断：" + f.adj.why
        : f.P.map((x) => x.label + " " + x.v + "/" + x.max).join(" + "),
      d.nt,
    ]);
  });
  return { name: "数据源(" + rows.length + ")", titles: T, rows: out };
}

export function svcRows(rows: Service[]): Sheet {
  const H = ["服务 / SDK", "官网", "类型", "语言", "覆盖数据源", "收费", "需机构订阅", "维护状态", "Star", "最适合场景", "备注 / 坑点"];
  const T = H.map(() => ({ w: 18 }));
  T[0].w = 24; T[1].w = 34; T[4].w = 34; T[8].w = 10; T[9].w = 34; T[10].w = 60;
  const out: Array<Array<string | number>> = [H];
  rows.forEach((d) =>
    out.push([d.n, d.u || "", d.ty, d.lang, d.src, d.cost, d.sub === "1" ? "是" : "否", d.m, d.st ? Number(d.st) : "", d.sc, d.nt]),
  );
  return { name: "检索服务(" + rows.length + ")", titles: T, rows: out };
}

export function wbRows(rows: Websearch[]): Sheet {
  const H = ["API", "官网", "类型", "数据覆盖", "定价", "速率", "维护状态", "最适合场景", "备注 / 坑点"];
  const T = H.map(() => ({ w: 18 }));
  T[0].w = 24; T[1].w = 34; T[3].w = 26; T[4].w = 50; T[7].w = 30; T[8].w = 60;
  const out: Array<Array<string | number>> = [H];
  rows.forEach((d) =>
    out.push([d.n, d.u || "", d.ty, d.src, d.pricing, d.quota, d.m, d.sc, d.nt]),
  );
  return { name: "开放网络检索(" + rows.length + ")", titles: T, rows: out };
}

export interface MetaInput {
  sc: Scenario;
  srcCount: number;
  srcTotal: number;
  svcCount: number;
  svcTotal: number;
  wbCount?: number;
  wbTotal?: number;
  allSources: Source[];
  /** 「只看场景相关」开关状态 */
  relOnly: boolean;
  /** 注入时间戳；不传则用当前时间。测试必须传固定值以保证导出可复现 */
  now?: Date;
  /** 当前生效的筛选条件（人类可读），写进导出说明便于复现这批次数据 */
  filterDesc?: string[];
}

const strip = (s: string): string => s.replace(/<\/?b>/g, "");

export function metaRows(input: MetaInput): Sheet {
  const { sc, srcCount, srcTotal, svcCount, svcTotal, allSources } = input;
  const rows: Array<Array<string | number>> = [["项目", "内容"]];
  rows.push(["导出时间", (input.now ?? new Date()).toLocaleString("zh-CN")]);
  rows.push(["导出范围", "当前筛选 + 当前排序的结果"]);
  if (input.filterDesc && input.filterDesc.length) {
    rows.push(["筛选条件", input.filterDesc.join(" ｜ ")]);
  } else {
    rows.push(["筛选条件", "无（全量）"]);
  }
  rows.push(["数据源条数", srcCount + " / " + srcTotal]);
  rows.push(["检索服务条数", svcCount + " / " + svcTotal]);
  if (input.wbTotal !== undefined) {
    rows.push(["开放网络检索条数", (input.wbCount ?? 0) + " / " + input.wbTotal]);
  }
  rows.push(["当前适配度场景", sc.n]);
  if (sc.rel) {
    const hidden = allSources.filter((d) => relLow(d, sc)).length;
    rows.push([
      "场景过滤",
      input.relOnly
        ? "已开启「只看场景相关」，隐藏 " + hidden + " 个他领域垂类源（共 " + srcTotal + " 个）"
        : "已关闭「只看场景相关」，包含全部 " + srcTotal + " 个源",
    ]);
  }
  rows.push(["场景权重", Object.keys(sc.w).map((k) => k + " " + sc.w[k]).join(" · ") + " （满分 10）"]);
  rows.push(["档位阈值", "High ≥7.5 ｜ Medium 5–7.4 ｜ Low <5"]);
  rows.push(["场景说明", strip(sc.d)]);
  rows.push(["打分规则", strip(sc.rd || "纯机械分")]);
  rows.push([]);
  rows.push(["全部 " + SCENARIOS.length + " 个场景", ""]);
  SCENARIOS.forEach((s) =>
    rows.push([s.n, Object.keys(s.w).map((k) => k + " " + s.w[k]).join(" · ") + "　—　" + strip(s.d)]),
  );
  rows.push([]);
  rows.push(["字段口径", ""]);
  rows.push(["API", "免 key / 需 key / 机构 IP / 申请制 / 无 API"]);
  rows.push(["DOI", "● 专用端点 ／ ◐ 支持检索 ／ ○ 无可靠 API"]);
  rows.push(["PDF", "● 全量免费 ／ ◐ 仅 OA ／ ○ 仅订阅 ／ — 否"]);
  rows.push(["适配度", "该源在【当前场景】下的综合工程价值；不是数据质量，也不是学术权威性"]);
  rows.push(["数据源页", "https://openalex.org 等，见「官网」列"]);
  rows.push(["核查日期", CHECK_DATE]);
  return { name: "导出说明", titles: [{ w: 24 }, { w: 100 }], rows };
}
