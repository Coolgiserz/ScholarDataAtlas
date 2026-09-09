/** URL 状态序列化 —— 纯函数（不直接触碰 history，交由 App 的 effect 调用），便于测试。
 *
 *  多选筛选值用英文逗号连接；解析时单值也能兼容（老链接 ?sLang=Python 会解析成 ["Python"]）。 */

import type { ServiceFilters, SourceFilters, WebsearchFilters } from "../types";

export interface UrlState {
  tab?: string;
  scen?: string;
  src?: Partial<SourceFilters>;
  svc?: Partial<ServiceFilters>;
  wb?: Partial<WebsearchFilters>;
  sort1?: { k: string; d: number };
  sort2?: { k: string; d: number };
  sort3?: { k: string; d: number };
}

/** 多选字段（q 是文本，单独处理） */
export const SRC_KEYS = ["fR", "fL", "fC", "fA", "fD", "fP", "fF"] as const;
export const SVC_KEYS = ["sT", "sLang", "sSub", "sM", "sSrc"] as const;
export const WB_KEYS = ["wT", "wM", "wSrc"] as const;

const join = (v?: string[]) => (v && v.length ? v.join(",") : "");
const split = (v: string | null): string[] | undefined => {
  if (v == null) return undefined;
  const parts = v.split(",").filter(Boolean);
  return parts.length ? parts : undefined;
};

export function serializeUrl(s: UrlState): string {
  const p = new URLSearchParams();
  if (s.tab && s.tab !== "src") p.set("tab", s.tab);
  if (s.scen && s.scen !== "gen") p.set("sc", s.scen);
  if (s.src?.q) p.set("q", s.src.q);
  SRC_KEYS.forEach((k) => {
    const v = join(s.src?.[k]);
    if (v) p.set(k, v);
  });
  if (s.svc?.q) p.set("q2", s.svc.q);
  SVC_KEYS.forEach((k) => {
    const v = join(s.svc?.[k]);
    if (v) p.set(k, v);
  });
  if (s.wb?.q) p.set("q3", s.wb.q);
  WB_KEYS.forEach((k) => {
    const v = join(s.wb?.[k]);
    if (v) p.set(k, v);
  });
  if (s.sort1) { p.set("s1", s.sort1.k); p.set("d1", String(s.sort1.d)); }
  if (s.sort2) { p.set("s2", s.sort2.k); p.set("d2", String(s.sort2.d)); }
  if (s.sort3) { p.set("s3", s.sort3.k); p.set("d3", String(s.sort3.d)); }
  return p.toString();
}

export function parseUrl(search: string): UrlState {
  const p = new URLSearchParams(search);
  const out: UrlState = {};
  const tab = p.get("tab"); if (tab) out.tab = tab;
  const sc = p.get("sc"); if (sc) out.scen = sc;

  const src: Partial<SourceFilters> = {};
  if (p.get("q") != null) src.q = p.get("q")!;
  SRC_KEYS.forEach((k) => { const v = split(p.get(k)); if (v) src[k] = v; });
  if (Object.keys(src).length) out.src = src;

  const svc: Partial<ServiceFilters> = {};
  if (p.get("q2") != null) svc.q = p.get("q2")!;
  SVC_KEYS.forEach((k) => { const v = split(p.get(k)); if (v) svc[k] = v; });
  if (Object.keys(svc).length) out.svc = svc;

  const wb: Partial<WebsearchFilters> = {};
  if (p.get("q3") != null) wb.q = p.get("q3")!;
  WB_KEYS.forEach((k) => { const v = split(p.get(k)); if (v) wb[k] = v; });
  if (Object.keys(wb).length) out.wb = wb;

  if (p.get("s1")) out.sort1 = { k: p.get("s1")!, d: +(p.get("d1") || 1) };
  if (p.get("s2")) out.sort2 = { k: p.get("s2")!, d: +(p.get("d2") || 1) };
  if (p.get("s3")) out.sort3 = { k: p.get("s3")!, d: +(p.get("d3") || 1) };
  return out;
}