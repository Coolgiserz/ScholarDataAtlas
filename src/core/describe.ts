/** 把当前筛选条件翻译成人类可读的一句话列表。
 *  用途：① 导出文件的「导出说明」页记录这批数据是怎么筛出来的（可复现）；
 *        ② 导出按钮旁的状态提示，让用户确认导出范围。
 *  刻意做成纯函数 —— 与筛选逻辑同处 core 层，便于单测锁死。 */

import type { ServiceFilters, SourceFilters, WebsearchFilters } from "../types";
import { SCENARIO_MAP } from "../data/scenarios";

const j = (v?: string[]) => (v && v.length ? v.join(" / ") : "");

export function describeSrcFilters(f: SourceFilters): string[] {
  const out: string[] = [];
  const sc = SCENARIO_MAP[f.scen];
  if (sc && f.scen !== "gen") out.push("场景：" + sc.n);
  if (f.q && f.q.trim()) out.push("搜索：" + f.q.trim());
  const r = j(f.fR); if (r) out.push("区域：" + r);
  const l = j(f.fL); if (l) out.push("层级：" + l);
  const c = j(f.fC); if (c) out.push("收费：" + c);
  const a = j(f.fA); if (a) out.push("API：" + a);
  const d = j(f.fD); if (d) out.push("DOI 检索：" + d);
  const p = j(f.fP); if (p) out.push("PDF 全文：" + p);
  const t = j(f.fF); if (t) out.push("适配度：" + t);
  return out;
}

export function describeSvcFilters(f: ServiceFilters): string[] {
  const out: string[] = [];
  if (f.q && f.q.trim()) out.push("搜索：" + f.q.trim());
  const t = j(f.sT); if (t) out.push("类型：" + t);
  const l = j(f.sLang); if (l) out.push("语言：" + l);
  const sub = f.sSub?.length
    ? f.sSub.map((x) => (x === "1" ? "是" : "否")).join(" / ")
    : "";
  if (sub) out.push("需机构订阅：" + sub);
  const m = j(f.sM); if (m) out.push("维护状态：" + m);
  const src = j(f.sSrc); if (src) out.push("覆盖数据源：" + src);
  return out;
}

export function describeWbFilters(f: WebsearchFilters): string[] {
  const out: string[] = [];
  if (f.q && f.q.trim()) out.push("搜索：" + f.q.trim());
  const t = j(f.wT); if (t) out.push("类型：" + t);
  const m = j(f.wM); if (m) out.push("维护状态：" + m);
  const src = j(f.wSrc); if (src) out.push("数据覆盖：" + src);
  return out;
}
