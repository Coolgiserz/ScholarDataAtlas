/** 场景相关性判定说明 —— 直接回答「这个源凭什么算相关 / 为什么被隐藏」。
 *  展开后给出五档阶梯与本场景实际使用的词表，让每个分数都可自行复核。 */

import type { Scenario } from "../types";

const TIERS: Array<[string, string, string]> = [
  ["1.00", "强相关", "命中本场景强相关词"],
  ["0.75", "上游 / 邻近学科", "命中上游学科词；或主学科属他领域时的封顶档"],
  ["0.45", "综合性大源", "学科覆盖含「全学科」等同义写法"],
  ["0.30", "未命中，兜底", "以上都没有命中"],
  ["0.15", "他领域垂类", "学科覆盖命中他领域词，默认被「只看场景相关」隐藏"],
];

export default function RelLegend({ scenario }: { scenario: Scenario }) {
  const r = scenario.rel;
  if (!r) return null;
  const relW = scenario.w.rel ?? 6;
  const px = (v: number) => (+(v * relW).toFixed(1)).toString();

  return (
    <details className="relhelp">
      <summary>场景相关性怎么判的？为什么有些源被隐藏？</summary>
      <div className="relhelp-b">
        <p className="relhelp-p">
          判定只看 <b>学科覆盖</b>、<b>地域 / 语种</b> 两个字段（外加名称与分层），在拼接文本里做关键词匹配：
          英文走词边界，中文走子串。本场景相关性满分 <b>{relW} 分</b>，占总分的{" "}
          {Math.round((relW / 10) * 100)}%。
        </p>
        <table className="tier">
          <caption className="sr-only">场景相关性五档阶梯</caption>
          <thead>
            <tr>
              <th scope="col">档位</th>
              <th scope="col">含义</th>
              <th scope="col">判定条件</th>
              <th scope="col">得分</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map(([v, label, cond]) => (
              <tr key={v}>
                <th scope="row">{v}</th>
                <td>{label}</td>
                <td>{cond}</td>
                <td>{px(+v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="relhelp-kw">
          <b>强相关词</b>：{r.hi1?.join("、") || "—"}
        </p>
        <p className="relhelp-kw">
          <b>上游 / 邻近学科词</b>：{r.hi2?.join("、") || "—"}
        </p>
        <p className="relhelp-kw">
          <b>他领域{scenario.id === "cn" ? "区域" : ""}词</b>：{r.lo?.join("、") || "—"}
          {scenario.id === "cn" ? "（按「地域 / 语种」字段判定）" : "（按「学科覆盖」字段判定）"}
        </p>
        <p className="relhelp-p relhelp-note">
          顺序是固定的：先查强相关 → 上游学科 →{" "}
          {scenario.id === "cn" ? "他国区域" : "综合性大源 → 他领域垂类"} → 兜底。
          每一行适配度单元格里的「为什么」会给出该源实际命中的词。
        </p>
      </div>
    </details>
  );
}
