/** 关键词匹配 —— 与单文件版口径严格一致：ASCII 走词边界，中文走子串 */

import type { Source } from "../types";

const ASCIIRE = /^[\x20-\x7e]+$/;

const escapeRe = (k: string): string => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 在拼接后的文本里判定是否命中任一词 */
function matchAny(hay: string, kw: string[]): boolean {
  if (!kw || !kw.length) return false;
  const s = hay.toLowerCase();
  return kw.some((raw) => {
    const k = String(raw).toLowerCase();
    if (ASCIIRE.test(k)) {
      return new RegExp("(^|[^a-z0-9])" + escapeRe(k) + "([^a-z0-9]|$)").test(s);
    }
    return s.indexOf(k) >= 0;
  });
}

/** 全字段匹配：n + t + sb + ge + nt + scale */
export function hit(d: Source, kw: string[]): boolean {
  return matchAny([d.n, d.t, d.sb, d.ge, d.nt, d.scale].join(" "), kw);
}

/** 指定字段匹配 */
export function hitIn(d: Source, kw: string[], fields: string[]): boolean {
  const rec = d as unknown as Record<string, string | undefined>;
  return matchAny(fields.map((f) => rec[f] || "").join(" "), kw);
}

/** 核心字段：n / t / sb / ge */
export const hitCore = (d: Source, kw: string[]): boolean => hitIn(d, kw, ["n", "t", "sb", "ge"]);

/** 仅学科覆盖字段 */
export const hitSb = (d: Source, kw: string[]): boolean => hitIn(d, kw, ["sb"]);

/** 仅地域 / 语种字段 */
export const hitGe = (d: Source, kw: string[]): boolean => hitIn(d, kw, ["ge"]);

/** 返回实际命中的关键词（用于界面暴露判定依据） */
export function matchedIn(d: Source, kw: string[], fields: string[]): string[] {
  if (!kw || !kw.length) return [];
  const rec = d as unknown as Record<string, string | undefined>;
  const hay = fields.map((f) => rec[f] || "").join(" ");
  return kw.filter((raw) => matchAny(hay, [raw]));
}
