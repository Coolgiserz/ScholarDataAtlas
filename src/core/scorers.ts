/** 场景中的函数式打分维度（leg / cit / oar）—— 无法随数据序列化，故独立于此 */

import type { Source } from "../types";
import { hit, hitCore } from "./match";

/** ① 零成本全量建库 · 合规落地 1 分 */
export function leg(d: Source): number {
  if (
    hit(d, [
      "CC0", "整库", "快照", "dump", "FTP", "baseline", "OAI-PMH", "免审核",
      "全量免费", "可整库落地", "批量下载", "整包",
    ])
  ) {
    return 1;
  }
  return hit(d, ["禁止建本地副本", "商用需授权", "禁商用", "严禁", "不得", "需授权", "保留 AI 训练"])
    ? 0
    : 0.5;
}

/** ② 引文网络 / 科研评价 · 引文能力 3.5 分 */
export function cit(d: Source): number {
  if (
    hitCore(d, [
      "引文", "被引", "引用关系", "引用图", "citation", "COCI", "times-cited",
      "JIF", "JCR", "SciVal", "h 指数", "被引次数",
    ])
  ) {
    return 1;
  }
  return hitCore(d, [
    "Scopus", "Web of Science", "Dimensions", "Semantic Scholar", "OpenAlex", "Crossref", "OpenCitations",
  ])
    ? 0.9
    : 0.1;
}

/** ③ 最大 OA 全文覆盖 · OA 覆盖 1 分 */
export function oar(d: Source): number {
  return hit(d, ["开放获取", "Open Access", "免费全文", "全量免费", "OA", "预印本", "自托管", "仅 OA"])
    ? 1
    : 0.4;
}

/** 维度名 → 打分函数 */
export const SCORERS: Record<string, (d: Source) => number> = { leg, cit, oar };
