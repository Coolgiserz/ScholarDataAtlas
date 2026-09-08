/** 筛选 —— 纯函数。与单文件版口径一致：场景既影响适配度，也（在 relOnly 时）过滤行。
 *
 *  所有取值型筛选都是数组语义：多选命中任一即通过（OR），空数组表示不限。
 *  例外是「场景」——它是互斥的，一次只有一套打分权重，故不在这里参与匹配。 */

import type { Scenario, Service, ServiceFilters, Source, SourceFilters, Websearch, WebsearchFilters } from "../types";
import { fitOf, relLow } from "./fit";

/** 未选 / 空数组 = 不限；有选则须命中其中任一 */
const anyOf = (arr: string[] | undefined, v: string): boolean =>
  !arr || arr.length === 0 || arr.indexOf(v) >= 0;

/** 数据源筛选（不含场景过滤） */
export function mSrcBase(d: Source, f: SourceFilters, sc: Scenario): boolean {
  const q = (f.q || "").trim().toLowerCase();
  if (q) {
    const hay = [d.n, d.t, d.sb, d.ge, d.nt, d.scale, d.as || "", d.u || ""].join(" ").toLowerCase();
    if (hay.indexOf(q) < 0) return false;
  }
  if (!anyOf(f.fR, d.r)) return false;
  if (!anyOf(f.fL, d.l)) return false;
  if (!anyOf(f.fC, d.cost)) return false;
  if (!anyOf(f.fA, d.api)) return false;
  if (!anyOf(f.fD, String(d.doi))) return false;
  if (!anyOf(f.fP, String(d.pdf))) return false;
  if (f.fF && f.fF.length && !anyOf(f.fF, fitOf(d, sc).lab)) return false;
  return true;
}

/** 数据源筛选（含场景过滤） */
export function mSrc(d: Source, f: SourceFilters, sc: Scenario): boolean {
  if (!mSrcBase(d, f, sc)) return false;
  if (sc.rel && f.relOnly && relLow(d, sc)) return false;
  return true;
}

/** 检索服务筛选 */
export function mSvc(d: Service, f: ServiceFilters): boolean {
  const q = (f.q || "").trim().toLowerCase();
  if (q) {
    const hay = [d.n, d.ty, d.lang, d.src, d.sc, d.nt, d.u || ""].join(" ").toLowerCase();
    if (hay.indexOf(q) < 0) return false;
  }
  if (!anyOf(f.sT, d.ty)) return false;
  if (!anyOf(f.sLang, d.lang)) return false;
  if (!anyOf(f.sSub, String(d.sub))) return false;
  if (!anyOf(f.sM, d.m)) return false;
  // src 是自由文本（如「全学科 + 专利」），用包含匹配而不是全等
  if (f.sSrc && f.sSrc.length && !f.sSrc.some((v) => d.src.indexOf(v) >= 0)) return false;
  return true;
}

/** 开放网络 / 通用检索（非学术）筛选 —— 与学术库刻意隔离，参数化核心仍是多选 OR + 跨维 AND */
export function mWb(d: Websearch, f: WebsearchFilters): boolean {
  const q = (f.q || "").trim().toLowerCase();
  if (q) {
    const hay = [d.n, d.ty, d.src, d.sc, d.nt, d.pricing, d.u || ""].join(" ").toLowerCase();
    if (hay.indexOf(q) < 0) return false;
  }
  if (!anyOf(f.wT, d.ty)) return false;
  if (!anyOf(f.wM, d.m)) return false;
  // src 是自由文本（如「开放网络（LLM 整合）」），用包含匹配
  if (f.wSrc && f.wSrc.length && !f.wSrc.some((v) => d.src.indexOf(v) >= 0)) return false;
  return true;
}