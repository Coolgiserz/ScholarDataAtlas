/** 数据源 ↔ 检索服务 双向关联 —— 纯函数，零 React / 零 DOM 依赖。
 *
 *  为什么需要别名表：服务的 `src` 字段是人工填写的自由文本，与数据源的 `n` 并不一致——
 *  `src="PubMed"` 对不上数据源名 `PubMed / PMC`，`WoS` 对不上 `Web of Science`。
 *  不做归一化，73 个服务里只有 38 个能自动关联（覆盖率 52%）。
 */

import type { Service, Source } from "../types";

/** 服务 src 取值 → 数据源名称。key 必须与 services.ts 里的 src 原文完全一致 */
export const SRC_ALIAS: Record<string, string> = {
  PubMed: "PubMed / PMC",
  WoS: "Web of Science",
  万方: "万方数据",
  CNKI: "中国知网 CNKI",
};

/**
 * 明确无法归到单一数据源的 src 取值。
 * 「多源」是天然的多对多（一个收割器打十几个库），硬塞一个链接反而是错的；
 * 其余是处理工具（GROBID）、文献管理器（Zotero / Mendeley）或非学术网络，本来就不是数据源。
 */
export const UNLINKABLE = new Set([
  "多源",
  "多源（2.7 亿+ 论文）",
  "OpenReview",
  "PDF → TEI",
  "GROBID 服务",
  "Zotero",
  "Mendeley",
  "未公开",
  "开放网络（非学术库）",
]);

/** 把服务的 src 原文解析成数据源名称；解析不出返回 null */
export function resolveSrc(v: string | undefined, sourceNames: string[]): string | null {
  const raw = (v || "").trim();
  if (!raw || UNLINKABLE.has(raw)) return null;
  if (SRC_ALIAS[raw]) return SRC_ALIAS[raw];
  return sourceNames.find((n) => raw.includes(n)) ?? null;
}

export interface LinkIndex {
  /** 服务名 → 它覆盖的数据源名（0 或 1 个；多源类为空） */
  toSources: Map<string, string[]>;
  /** 数据源名 → 能访问它的服务名（可能多个，按服务表原序） */
  toServices: Map<string, string[]>;
  /** 解析失败的服务名，供诊断脚本排查数据质量 */
  unresolved: string[];
}

export function buildLinks(sources: Source[], services: Service[]): LinkIndex {
  const names = sources.map((d) => d.n);
  const toSources = new Map<string, string[]>();
  const toServices = new Map<string, string[]>();
  const unresolved: string[] = [];

  for (const s of services) {
    const hit = resolveSrc(s.src, names);
    if (!hit) {
      toSources.set(s.n, []);
      if ((s.src || "").trim() && !UNLINKABLE.has(s.src!)) unresolved.push(s.n + '（src="' + s.src + '"）');
      continue;
    }
    toSources.set(s.n, [hit]);
    const list = toServices.get(hit) || [];
    list.push(s.n);
    toServices.set(hit, list);
  }

  return { toSources, toServices, unresolved };
}

/** 便捷读取器：缺省返回空数组，调用方不必判空 */
export const linkedSources = (idx: LinkIndex, svc: string): string[] => idx.toSources.get(svc) || [];
export const linkedServices = (idx: LinkIndex, src: string): string[] => idx.toServices.get(src) || [];
