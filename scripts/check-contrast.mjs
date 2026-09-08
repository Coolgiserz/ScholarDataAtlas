#!/usr/bin/env node
/**
 * T3.2 — WCAG 2.1 对比度静态校验
 *
 * 为什么不用 axe 的 color-contrast 规则：jsdom 不实现 CSS 层叠与 getComputedStyle 的
 * 真实解析，axe 在 jsdom 下会把该规则标为 incomplete。因此把「设计令牌 → 前景/背景
 * 组合」这件事从 CSS 里抽出来，用脚本精确计算，属于可重复执行的回归资产。
 *
 * 规则依据：
 *   1.4.3 Contrast (Minimum)  AA —— 正文 <18.66px bold / <24px 需 ≥4.5:1
 *   1.4.11 Non-text Contrast  AA —— UI 组件边界/图形 需 ≥3.0:1
 *
 * 用法：node scripts/check-contrast.mjs [--json]
 *   退出码 0 = 全部通过；1 = 存在未达标项
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(HERE, "..", "src", "styles.css"), "utf8");

/* ---------- 1. 从 styles.css 抽取设计令牌（单一事实来源） ---------- */

function tokens() {
  const root = CSS.match(/:root\s*\{([\s\S]*?)\}/);
  if (!root) throw new Error("styles.css 中找不到 :root 块");
  const out = {};
  for (const m of root[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

const T = tokens();

/* ---------- 2. 颜色工具 ---------- */

function parse(c) {
  c = c.trim();
  if (c.startsWith("var(")) {
    const name = c.slice(4, -1).trim();
    const v = T[name];
    if (!v) throw new Error(`未定义的 CSS 变量: ${name}`);
    return parse(v);
  }
  if (c.startsWith("#")) {
    const h = c.slice(1);
    const n = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
    return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16), a: 1 };
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(",").map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  throw new Error(`无法解析颜色: ${c}`);
}

/** 半透明前景叠在背景上（sRGB 通道线性叠加） */
function over(fg, bg) {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

function lum({ r, g, b }) {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function ratio(fgHex, bgSpec) {
  // bgSpec: 单个颜色，或 [半透明层, 底层]（支持多层叠加）
  const list = Array.isArray(bgSpec) ? bgSpec : [bgSpec];
  let bg = parse(list[list.length - 1]);
  for (let i = list.length - 2; i >= 0; i--) bg = over(parse(list[i]), bg);
  const fg = over(parse(fgHex), bg);
  const L1 = lum(fg);
  const L2 = lum(bg);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

/* ---------- 3. 待校验组合（增删改样式时同步维护） ---------- */

const N = 4.5; // 正文阈值
const U = 3.0; // 大字号 / 非文本阈值

const CASES = [
  // — 正文与辅助文字 —
  { id: "body/tx-on-bg", name: "正文", fg: "var(--tx)", bg: "var(--bg)", min: N },
  { id: "body/tx-on-panel", name: "表格正文", fg: "var(--tx)", bg: "var(--panel)", min: N },
  { id: "body/tx2-on-panel", name: "次级文字(面板)", fg: "var(--tx2)", bg: "var(--panel)", min: N },
  { id: "body/tx2-on-panel2", name: "次级文字(输入框/图例)", fg: "var(--tx2)", bg: "var(--panel2)", min: N },
  { id: "body/tx3-on-panel", name: "三级文字(面板)", fg: "var(--tx3)", bg: "var(--panel)", min: N },
  { id: "body/tx3-on-panel2", name: "三级文字(说明块)", fg: "var(--tx3)", bg: "var(--panel2)", min: N },
  { id: "body/tx-on-panel2", name: "输入框文字", fg: "var(--tx)", bg: "var(--panel2)", min: N },
  { id: "body/tx2-on-th", name: "表头文字(#24242C)", fg: "var(--tx2)", bg: "#24242C", min: N },
  { id: "body/tx3-on-bg", name: "代码块/空态文字", fg: "var(--tx3)", bg: "var(--bg)", min: N },

  // — 强调色 —
  { id: "accent/acc-on-panel", name: "强调蓝(面板)", fg: "var(--acc)", bg: "var(--panel)", min: N },
  { id: "accent/acc2-on-panel", name: "强调青(面板)", fg: "var(--acc2)", bg: "var(--panel)", min: N },

  // — 标签（前景色 + 15% 同色底 叠在面板上）—
  { id: "tag/free", name: "标签 免费", fg: "var(--free)", bg: ["rgba(63,185,80,0.15)", "var(--panel)"], min: N },
  { id: "tag/freemium", name: "标签 Freemium", fg: "var(--freemium)", bg: ["rgba(217,162,39,0.15)", "var(--panel)"], min: N },
  { id: "tag/sub", name: "标签 机构订阅", fg: "var(--sub)", bg: ["rgba(229,103,74,0.15)", "var(--panel)"], min: N },
  { id: "tag/biz", name: "标签 商业授权", fg: "var(--biz)", bg: ["rgba(169,123,240,0.15)", "var(--panel)"], min: N },
  { id: "tag/arch", name: "标签 归档(最深底)", fg: "#FF7B5A", bg: ["rgba(229,103,74,0.22)", "var(--panel)"], min: N },
  { id: "tag/unknown", name: "标签 未知", fg: "var(--tx2)", bg: ["rgba(147,147,155,0.13)", "var(--panel)"], min: N },

  // — 按钮 —
  { id: "btn/primary", name: "主按钮(深字/蓝底)", fg: "#0d1117", bg: "var(--acc)", min: N },
  { id: "btn/skip", name: "跳转链接(深字/蓝底)", fg: "#0d1117", bg: "var(--acc)", min: N },
  { id: "btn/help", name: "帮助按钮(深字/灰底)", fg: "var(--bg)", bg: "var(--tx3)", min: N },
  { id: "btn/ghost", name: "次要按钮边框", fg: "var(--line-ui)", bg: "var(--panel)", min: U },

  // — 非文本（控件边界 / 状态指示，1.4.11 要求 ≥3:1）—
  { id: "ui/input-border", name: "输入框边框", fg: "var(--line-ui)", bg: "var(--panel2)", min: U },
  { id: "ui/focus-ring", name: "焦点环", fg: "var(--focus)", bg: "var(--panel)", min: U },
  { id: "ui/scrollbar-thumb", name: "滚动条滑块", fg: "#63637D", bg: "var(--bg)", min: U },

  // — 纯装饰（1.4.11 不强制：不承载「识别控件或其状态」的信息）—
  { id: "decor/panel-border", name: "面板边框(装饰)", fg: "var(--line)", bg: "var(--panel)", min: U,
    decor: true, note: "仅划分视觉区块，控件边界另有 --line-ui 承担" },
  { id: "decor/row-sep", name: "表格行分隔线(装饰)", fg: "#23232B", bg: "var(--panel)", min: U,
    decor: true, note: "行与行的区分由内容承担，分隔线非必需信息" },
];

/* ---------- 4. 执行 ---------- */

const rows = CASES.map((c) => {
  const r = ratio(c.fg, c.bg);
  return { ...c, ratio: Math.round(r * 100) / 100, pass: r >= c.min };
});

const failed = rows.filter((r) => !r.pass && !r.decor);
const decor = rows.filter((r) => r.decor);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ total: rows.length, failed: failed.length, decor: decor.length, rows }, null, 2));
} else {
  const pad = (s, n) => String(s).padEnd(n, " ");
  console.log("\nWCAG 2.1 对比度校验 —— styles.css 设计令牌\n");
  console.log(pad("组合", 26) + pad("前景", 20) + pad("背景", 34) + pad("比值", 8) + pad("阈值", 7) + "结果");
  console.log("-".repeat(100));
  for (const r of rows) {
    const bgTxt = Array.isArray(r.bg) ? r.bg.join(" ⨯ ") : r.bg;
    console.log(
      pad(r.name, 26) +
      pad(r.fg, 20) +
      pad(bgTxt, 34) +
      pad(r.ratio + ":1", 8) +
      pad(r.min + ":1", 7) +
      (r.pass ? "PASS" : "FAIL"),
    );
  }
  console.log("-".repeat(100));
  console.log(`合计 ${rows.length} 项（强制 ${rows.length - decor.length} + 装饰豁免 ${decor.length}），未达标 ${failed.length}\n`);
  if (decor.length) {
    console.log("装饰性豁免（1.4.11 不适用于纯装饰，仅记录数值）：");
    for (const d of decor) console.log(`  · [${d.id}] ${d.note} —— 实测 ${d.ratio}:1`);
    console.log("");
  }
  if (failed.length) {
    for (const f of failed) console.log(`  ✗ [${f.id}] ${f.name}：${f.ratio}:1 < 要求 ${f.min}:1`);
    console.log("");
  }
}

process.exit(failed.length ? 1 : 0);
