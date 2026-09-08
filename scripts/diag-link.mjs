/** 可行性分析：检索服务的 src 字段能否直接关联到数据源条目 */
import { readFileSync } from "node:fs";

function arr(file, name) {
  const t = readFileSync(new URL("../src/data/" + file, import.meta.url), "utf8");
  const h = new RegExp("export const " + name + "\\b[^=]*=\\s*").exec(t);
  if (!h) throw new Error("not found " + name);
  const j = h.index + h[0].length;
  let d = 0, k = j;
  for (; k < t.length; k++) { if (t[k] === "[") d++; else if (t[k] === "]") { d--; if (!d) break; } }
  return new Function("return " + t.slice(j, k + 1))();
}

const S = arr("services.ts", "SERVICES");
const D = arr("sources.ts", "SOURCES");
const names = D.map((d) => d.n);

let linked = 0, unlinked = 0;
const linkedRows = [], unlinkedRows = [];
for (const s of S) {
  const v = (s.src || "").trim();
  if (!v) { unlinked++; unlinkedRows.push([s.n, "(空)"]); continue; }
  const hit = names.filter((n) => v.includes(n));
  if (hit.length) { linked++; linkedRows.push([s.n, v, hit]); }
  else { unlinked++; unlinkedRows.push([s.n, v]); }
}
console.log("检索服务总数:", S.length, "｜ 数据源总数:", D.length);
console.log("src 直接命中数据源名称:", linked);
console.log("src 命中不到（多源 / 泛化 / 本体）:", unlinked);

console.log("\n--- 可关联样例（前 10）---");
linkedRows.slice(0, 10).forEach(([n, v, h]) => console.log(`  ${n.padEnd(22)} src="${v}"  →  ${h.join(" / ")}`));

console.log("\n--- 关联不到（前 14）---");
unlinkedRows.slice(0, 14).forEach(([n, v]) => console.log(`  ${n.padEnd(26)} src="${v}"`));

const c = {};
S.forEach((s) => (c[s.src || ""] = (c[s.src || ""] || 0) + 1));
console.log("\n--- src 取值分布（" + Object.keys(c).length + " 种）---");
Object.entries(c).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log("  " + String(v).padStart(3) + "  " + k));

// 反向：每个数据源被多少个服务覆盖
const back = {};
S.forEach((s) => names.filter((n) => (s.src || "").includes(n)).forEach((n) => (back[n] = (back[n] || 0) + 1)));
const top = Object.entries(back).sort((a, b) => b[1] - a[1]);
console.log("\n--- 被服务覆盖最多的数据源（前 10）---");
top.slice(0, 10).forEach(([n, v]) => console.log(`  ${String(v).padStart(3)} 个服务  ${n}`));
console.log("\n无任何服务覆盖的数据源:", D.length - top.length, "个");
