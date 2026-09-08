/** 排序 —— 纯函数。中文用固定 Intl.Collator，避免 Node / 浏览器 ICU 差异 */

import type { Scenario, Service, Source, Websearch } from "../types";
import { fitOf } from "./fit";

const ORD: Record<string, Record<string, number>> = {
  fit: { High: 3, Medium: 2, Low: 1 },
  doi: { "3": 3, "2": 2, "1": 1 },
  pdf: { "3": 3, "2": 2, "1": 1, "0": 0 },
  m: { 活跃: 4, 低频: 3, 停更: 2, 归档: 1, 未知: 0 },
};

/** 中文排序器：显式固定 locale 与用法，避免跨环境结果漂移 */
const ZH = new Intl.Collator("zh");

export type Sortable = Source | Service | Websearch;

export function vOf(d: Sortable, k: string, sc: Scenario): string | number {
  if (k === "fit") return fitOf(d as Source, sc).total;
  const rec = d as unknown as Record<string, string | number | undefined>;
  const raw = rec[k];
  /* Star 存成字符串（与其余字段一致），但排序必须按数值，否则 "9173" < "5119" 会排错 */
  if (k === "st") return Number(raw || 0);
  if (ORD[k] && raw !== undefined && ORD[k][String(raw)] !== undefined) return ORD[k][String(raw)];
  return raw !== undefined ? (raw as string | number) : "";
}

export function doSort<T extends Sortable>(a: T[], k: string, dir: number, sc: Scenario): T[] {
  return [...a].sort((x, y) => {
    const p = vOf(x, k, sc);
    const q = vOf(y, k, sc);
    if (typeof p === "number" && typeof q === "number") return (p - q) * dir;
    return ZH.compare(String(p), String(q)) * dir;
  });
}
