/** 诊断：学科型场景的相关性判定到底靠什么字段命中 —— 纯 Node 运行，不进测试套件 */
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/data/sources.ts", import.meta.url), "utf8");
const scen = readFileSync(new URL("../src/data/scenarios.ts", import.meta.url), "utf8");

function parseArr(text, varName) {
  // 注意：声明形如 `export const SOURCES: Source[] = [`，
  // 必须跳过 `Source[]` 里的方括号，从 `= [` 之后开始配对
  const head = new RegExp("export const " + varName + "\\b[^=]*=\\s*").exec(text);
  if (!head) throw new Error("找不到 " + varName);
  const j = head.index + head[0].length;
  if (text[j] !== "[") throw new Error(varName + " 不是数组字面量");
  let depth = 0, k = j;
  for (; k < text.length; k++) {
    if (text[k] === "[") depth++;
    else if (text[k] === "]") { depth--; if (!depth) break; }
  }
  return new Function("return " + text.slice(j, k + 1))();
}
const SOURCES = parseArr(src, "SOURCES");
const SCEN = parseArr(scen, "SCENARIOS");

/* ---- 复刻 core/match.ts ---- */
const ASCIIRE = /^[\x20-\x7e]+$/;
const esc = (k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function matchAny(hay, kw) {
  if (!kw || !kw.length) return false;
  const s = hay.toLowerCase();
  return kw.some((raw) => {
    const k = String(raw).toLowerCase();
    if (ASCIIRE.test(k)) return new RegExp("(^|[^a-z0-9])" + esc(k) + "([^a-z0-9]|$)").test(s);
    return s.indexOf(k) >= 0;
  });
}
const f = (d, fs) => fs.map((x) => d[x] || "").join(" ");
const BROAD = ["全学科","全类型","科技全领域","科技资源","自然科学","科学技术","理工农医","理 / 工 / 农 / 医","500+ 研究方向","全球仓储","各类研究产出"];
const hitCore = (d, kw) => matchAny(f(d, ["n", "t", "sb", "ge"]), kw);
const hitSb = (d, kw) => matchAny(f(d, ["sb"]), kw);
const hitGe = (d, kw) => matchAny(f(d, ["ge"]), kw);

const SCID = process.argv[2] || "chip";
const sc = SCEN.find((s) => s.id === SCID);
console.log(`\n场景 = ${sc.id} 「${sc.n}」  rel=${JSON.stringify(sc.rel)}\n`);

const LABEL = { 1: "强相关", 0.75: "上游学科", 0.45: "全球性大源", 0.3: "其他", 0.15: "他领域垂类", 0.1: "他国区域" };
const rows = [];
for (const d of SOURCES) {
  let v, why = "", kw = [];
  const firstHit = (fs, list) => {
    const k = (list || []).filter((x) => matchAny(f(d, fs), [x]));
    return k.length ? k : null;
  };
  // 与 core/fit.ts relCalc() 同序：hi1 → hi2 → [cn] ge-lo → BROAD → lo → 兜底
  const hi1 = firstHit(["n", "t", "sb", "ge"], sc.rel.hi1);
  const hi2 = firstHit(["n", "t", "sb", "ge"], sc.rel.hi2);
  const geLo = firstHit(["ge"], sc.rel.lo);
  const broad = firstHit(["sb"], BROAD);
  const sbLo = firstHit(["sb"], sc.rel.lo);
  if (hi1) { v = 1; why = "hi1 强相关词"; kw = hi1; }
  else if (hi2) { v = 0.75; why = "hi2 上游学科"; kw = hi2; }
  else if (sc.id === "cn" && geLo) { v = 0.1; why = "ge 他国区域"; kw = geLo; }
  else if (broad) { v = 0.45; why = "sb 综合词表"; kw = broad; }
  else if (sc.id !== "cn" && sbLo) { v = 0.15; why = "sb 他领域词"; kw = sbLo; }
  else { v = 0.3; why = "兜底：什么都没命中"; }
  rows.push({ n: d.n, t: d.t, sb: d.sb, ge: d.ge, v, why, kw: kw.join("/") });
}
rows.sort((a, b) => b.v - a.v || a.n.localeCompare(b.n, "zh"));
const p = (s, w) => String(s ?? "").slice(0, w).padEnd(w);
console.log(p("名称", 22) + p("sb(学科覆盖)", 28) + p("ge(地域)", 14) + p("分值", 6) + p("命中词", 14) + "判定依据");
console.log("-".repeat(110));
for (const r of rows) console.log(p(r.n, 22) + p(r.sb, 28) + p(r.ge, 14) + p(r.v, 6) + p(r.kw, 14) + r.why);

const by = {};
for (const r of rows) by[r.v] = (by[r.v] || 0) + 1;
console.log("\n分布:", Object.entries(by).map(([k, v]) => `${LABEL[k] ?? k}=${v}`).join("  "));
console.log("被「只看场景相关」隐藏(=0.15/0.1):", rows.filter((r) => r.v <= 0.15).map((r) => r.n).join("、") || "无");
