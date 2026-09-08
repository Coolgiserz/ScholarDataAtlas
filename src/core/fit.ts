/** 适配度计算 —— 纯函数，零 React / 零 DOM 依赖 */

import type { FitResult, Scenario, Source } from "../types";
import { matchedIn } from "./match";
import { SCORERS } from "./scorers";

export const R_API: Record<string, number> = {
  "免 key": 1, "需 key": 0.75, "申请制": 0.5, "机构 IP": 0.25, "无 API": 0,
};
export const R_COST: Record<string, number> = {
  "免费": 1, "Freemium": 0.667, "机构订阅": 0.333, "商业授权": 0,
};
export const R_DOI: Record<number, number> = { 3: 1, 2: 0.667, 1: 0 };
export const R_PDF: Record<number, number> = { 3: 1, 2: 0.667, 1: 0.333, 0: 0 };

/** 通用场景人工修正的档位分值 */
export const BAND = { High: 8.5, Medium: 6, Low: 3 } as const;

export const HIGH_MIN = 7.5;
export const MEDIUM_MIN = 5;

/**
 * 综合性大源识别词表。命中即落 0.45 档。
 *
 * 为什么需要它：`sb` 是自由文本，同一个意思有十几种写法——
 * 「全学科」「科技全领域」「自然科学」「理工农医」「500+ 研究方向」都是综合源，
 * 但旧逻辑只认「全学科」四个字，导致 PubScholar / NSTL / SciEngine / 百度学术
 * 掉到兜底 0.3，比日本 CiNii 还低。
 *
 * 刻意不收录裸的「全领域」：否则「医学全领域」（中华医学期刊全文数据库）会被误判为综合源。
 */
export const BROAD = [
  "全学科",
  "全类型",
  "科技全领域",
  "科技资源",
  "自然科学",
  "科学技术",
  "理工农医",
  "理 / 工 / 农 / 医",
  "500+ 研究方向",
  "全球仓储",
  "各类研究产出",
];

export interface RelHit {
  v: number;
  label: string;
  /** 实际命中的关键词，界面用来回答「为什么」 */
  kw: string[];
  /** 命中发生在哪些字段 */
  field: string;
  /** 兜底档以外的补充说明（如封顶原因） */
  note?: string;
}

/**
 * 一次性算出场景相关性档位 + 命中依据。
 * relVal / 界面提示共用同一实现，避免两处逻辑漂移。
 *
 * 档位顺序（修过两处顺序 bug，见 migration/01_测试设计文档.md 决策记录）：
 *   1.00 强相关  → 0.75 上游学科 → [中文场景] 他国区域 → 0.45 综合大源
 *                → [非中文] 他领域垂类 → 0.30 兜底
 *
 *   · 旧逻辑把 lo（他领域/他国）查在最前面，导致 NASA ADS「天文 / 物理 / arXiv」
 *     因含「天文」被直接踩到 0.15，明明「物理」是芯片场景的上游学科。
 *   · 旧逻辑用 hitCore(["全学科","全球"]) 判综合档，而「全球」是地域词写在 ge 里，
 *     结果 MathSciNet（纯数学）、Reaxys（化学）等垂类源靠 ge="全球" 蹭到 0.45，
 *     与 Scopus 同分。现在综合档只认 sb 里的 BROAD 词表。
 */
export function relCalc(d: Source, sc: Scenario): RelHit | null {
  const r = sc.rel;
  if (!r) return null;
  const CORE = ["n", "t", "sb", "ge"];
  const CORE_LABEL = "名称 / 分层 / 学科 / 地域";

  let kw = matchedIn(d, r.hi1 || [], CORE);
  if (kw.length) {
    // 混合学科封顶：sb 主学科写着他领域、又不属综合源时，即使命中 hi1 也只给 0.75。
    // 否则 Europe PMC「生医+专利+预印本+学位论文」会因含「专利」拿到 1.0，
    // 在芯片场景排到 IEEE Xplore 前面 —— 这正是「筛选结果无法理解」的来源。
    const mixed =
      sc.id !== "cn" && !matchedIn(d, BROAD, ["sb"]).length && matchedIn(d, r.lo || [], ["sb"]).length;
    return mixed
      ? { v: 0.75, label: "上游 / 邻近学科", kw, field: "学科覆盖", note: "主学科属他领域，强相关封顶 0.75" }
      : { v: 1, label: "强相关", kw, field: CORE_LABEL };
  }

  kw = matchedIn(d, r.hi2 || [], CORE);
  if (kw.length) return { v: 0.75, label: "上游 / 邻近学科", kw, field: "名称 / 分层 / 学科 / 地域" };

  // 中文场景：地域是硬约束，他国区域源再综合也不算中文源，故排在「综合」之前
  if (sc.id === "cn") {
    kw = matchedIn(d, r.lo || [], ["ge"]);
    if (kw.length) return { v: 0.1, label: "他国区域", kw, field: "地域 / 语种" };
  }

  // 学科型场景：综合档只认 sb。
  // 中文场景是地域场景，ge 里的「全球」本身就是有效信号（国际大源对中文场景有用但非重点），
  // 若照搬学科场景一并剔除，会把 IEEE Xplore、PubMed、arXiv 等全球源误降到兜底档。
  const broadKw = sc.id === "cn" ? BROAD.concat(["全球"]) : BROAD;
  const broadFields = sc.id === "cn" ? ["sb", "ge"] : ["sb"];
  const broad = matchedIn(d, broadKw, broadFields);
  if (broad.length) {
    return {
      v: 0.45,
      label: "综合性大源",
      kw: broad,
      field: sc.id === "cn" ? "学科覆盖 / 地域" : "学科覆盖",
    };
  }

  if (sc.id !== "cn") {
    kw = matchedIn(d, r.lo || [], ["sb"]);
    if (kw.length) return { v: 0.15, label: "他领域垂类", kw, field: "学科覆盖" };
  }

  return { v: 0.3, label: "未命中，兜底", kw: [], field: "—" };
}

/** 场景相关性分值（无 rel 的场景恒为 0） */
export function relVal(d: Source, sc: Scenario): number {
  const c = relCalc(d, sc);
  return c ? c.v : 0;
}

/** 「他领域 / 他国」= 落入最低档，该场景下基本无用，默认被「只看场景相关」隐藏 */
export const relLow = (d: Source, sc: Scenario): boolean => !!sc.rel && relVal(d, sc) <= 0.15;

/** 计算某源在某场景下的适配度 */
export function fitOf(d: Source, sc: Scenario): FitResult {
  const P: FitResult["P"] = [];
  const add = (label: string, max: number | undefined, r: number | undefined): number => {
    const v = +(((max || 0) * (r || 0))).toFixed(2);
    P.push({ label, max: max || 0, v });
    return v;
  };

  let m = add("API", sc.w.api, R_API[d.api]);
  m += add("成本", sc.w.cost, R_COST[d.cost]);
  m += add("DOI", sc.w.doi, R_DOI[d.doi]);
  m += add("PDF", sc.w.pdf, R_PDF[d.pdf]);

  (["leg", "cit", "oar"] as const).forEach((k) => {
    if (sc.w[k]) m += add(k === "leg" ? "合规落地" : k === "cit" ? "引文能力" : "OA 覆盖", sc.w[k], SCORERS[k](d));
  });

  let rel: RelHit | null = null;
  if (sc.w.rel) {
    rel = relCalc(d, sc);
    m += add("场景相关", sc.w.rel, rel ? rel.v : 0);
  }

  m = +Math.min(10, m).toFixed(2);

  let lab: FitResult["lab"] = m >= HIGH_MIN ? "High" : m >= MEDIUM_MIN ? "Medium" : "Low";
  let total = m;
  let adj: FitResult["adj"] = null;

  // 通用场景保留人工修正（覆盖独特性 / 不可替代性）
  if (sc.id === "gen" && d.fr && d.fit && d.fit in BAND) {
    const fitKey = d.fit as keyof typeof BAND;
    adj = { from: m, to: BAND[fitKey], lab: d.fit, why: d.fr };
    total = BAND[fitKey];
    lab = d.fit as FitResult["lab"];
  }

  return { m, total, lab, P, adj, rel, sc };
}
