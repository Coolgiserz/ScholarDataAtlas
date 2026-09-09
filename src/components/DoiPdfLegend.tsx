/** DOI / PDF 能力档位说明 —— 让 ●/◐/○/— 四个符号可读可复核。
 *  展开后给出两栏对照表：DOI 单查能力（4 档）+ PDF 可获取性（4 档）。
 *  平时收在 <details> 里，不占首屏空间。 */

const DOI_TIERS: Array<[string, string, string]> = [
  ["●", "专用端点", "有专门的 DOI 单查 / DOI 字段查询 endpoint（如 Crossref /works/{doi}、DataCite /dois/{doi}），可作为按 DOI 取元数据的主路径"],
  ["◐", "支持检索", "关键词检索能命中 DOI 字段，但无专门 DOI endpoint（如 OpenAlex ?filter=doi:、arXiv search_query=doi:），工程上走批量检索再过滤 DOI"],
  ["○", "无可靠 API", "DOI 数据存在于网页 / 抓取结果里，但无公开可靠的 API（如 Google Scholar 搜索结果里塞 DOI），不可工程化"],
  ["—", "不支持", "该源不暴露 DOI 字段（如部分中文期刊只给题录无 DOI）"],
];

const PDF_TIERS: Array<[string, string, string]> = [
  ["●", "全量免费", "全部 PDF 可直接下载（OAI-PMH / 直链 / 机构订阅全打通）"],
  ["◐", "仅 OA", "只对 OA 子集免费（如 HAL 只对 Open 部分下 PDF，订阅部分不可得）"],
  ["○", "仅订阅", "仅在机构订阅 / 付费后可下 PDF，公开访问被付费墙拦截"],
  ["—", "不支持", "该源不托管 PDF（如 Crossref 只给元数据不给全文）"],
];

export default function DoiPdfLegend() {
  return (
    <details className="relhelp">
      <summary>DOI / PDF 能力档位怎么分的？</summary>
      <div className="relhelp-b">
        <div className="legend-grid">
          <table className="tier">
            <caption>DOI 单查能力（doi 字段）</caption>
            <thead>
              <tr>
                <th scope="col">档位</th>
                <th scope="col">标签</th>
                <th scope="col">判定条件</th>
              </tr>
            </thead>
            <tbody>
              {DOI_TIERS.map(([v, label, cond]) => (
                <tr key={v}>
                  <th scope="row">{v}</th>
                  <td>{label}</td>
                  <td>{cond}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="tier">
            <caption>PDF 可获取性（pdf 字段）</caption>
            <thead>
              <tr>
                <th scope="col">档位</th>
                <th scope="col">标签</th>
                <th scope="col">判定条件</th>
              </tr>
            </thead>
            <tbody>
              {PDF_TIERS.map(([v, label, cond]) => (
                <tr key={v}>
                  <th scope="row">{v}</th>
                  <td>{label}</td>
                  <td>{cond}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}