/** 数据源筛选栏 —— 场景 + 只看场景相关 + 各维度下拉 + 搜索 */

import type { Scenario, SourceFilters } from "../types";
import { SCENARIOS } from "../data/scenarios";
import { asOptions } from "./SelectField";
import MultiSelect from "./MultiSelect";

interface Props {
  filters: SourceFilters;
  scenario: Scenario;
  onChange: (patch: Partial<SourceFilters>) => void;
  onReset: () => void;
  regionOptions: string[];
  layerOptions: string[];
  costOptions: string[];
  apiOptions: string[];
  fitOptions: string[];
  doiOptions: string[];
  pdfOptions: string[];
}

/** DOI / PDF 能力档位的 label 解释，避免用户看到 ●/◐/○/— 不知所云
 *  desc 字段悬浮提示（chip title + aria-label）—— 解释这个档位的工程含义
 *
 *  DOI 档位（doi 字段，数字越大能力越强）：
 *    3 = ● 专用端点  → 有专门的 DOI 单查 / DOI 字段查询 endpoint
 *                       （如 Crossref REST 的 GET /works/{doi}、DataCite REST 的 GET /dois/{doi}），
 *                       工程上可作为"按 DOI 取元数据"的主路径
 *    2 = ◐ 支持检索  → 通过关键词检索能命中 DOI 字段，但不是专门 endpoint
 *                       （如 OpenAlex ?filter=doi:xxx、arXiv search_query=doi:），
 *                       工程上可批量走关键词检索再过滤 DOI 字段
 *    1 = ○ 无可靠 API → 有 DOI 数据但没有公开 / 可靠的 API
 *                       （如 Google Scholar 仅在 HTML 结果里塞 DOI），不可工程化
 *    0 = — 不支持    → 该源不暴露 DOI 字段（如部分中文期刊只给题录）
 *
 *  PDF 档位（pdf 字段，数字越大可获取性越强）：
 *    3 = ● 全量免费  → 全部 PDF 可直接下载（OAI-PMH / 直链 / 机构订阅全打通）
 *    2 = ◐ 仅 OA      → 只对 OA 子集免费（如 HAL 只对 Open 部分下 PDF）
 *    1 = ○ 仅订阅    → 仅在机构订阅 / 付费后可下
 *    0 = — 不支持    → 该源不托管 PDF
 */
const DOI_LABELS: Record<string, { label: string; desc: string }> = {
  "3": {
    label: "● 专用端点",
    desc: "有专门的 DOI 单查 / DOI 字段查询 endpoint（如 Crossref /works/{doi}、DataCite /dois/{doi}），可作为按 DOI 取元数据的主路径",
  },
  "2": {
    label: "◐ 支持检索",
    desc: "通过关键词检索能命中 DOI 字段，但无专门 DOI endpoint（如 OpenAlex ?filter=doi:、arXiv search_query=doi:），工程上走批量检索再过滤 DOI",
  },
  "1": {
    label: "○ 无可靠 API",
    desc: "DOI 数据存在于网页 / 抓取结果里，但无公开可靠的 API，不可工程化（如 Google Scholar 搜索结果里塞 DOI）",
  },
  "0": {
    label: "— 不支持",
    desc: "该源不暴露 DOI 字段（如部分中文期刊只给题录，无 DOI）",
  },
};
const PDF_LABELS: Record<string, { label: string; desc: string }> = {
  "3": {
    label: "● 全量免费",
    desc: "全部 PDF 可直接下载（OAI-PMH / 直链 / 机构订阅全打通）",
  },
  "2": {
    label: "◐ 仅 OA",
    desc: "只对 OA 子集免费（如 HAL 只对 Open 部分下 PDF，订阅部分不可得）",
  },
  "1": {
    label: "○ 仅订阅",
    desc: "仅在机构订阅 / 付费后可下 PDF，公开访问被付费墙拦截",
  },
  "0": {
    label: "— 不支持",
    desc: "该源不托管 PDF（如 Crossref 只给元数据不给全文）",
  },
};

const labeled = (vs: string[], labels: Record<string, { label: string; desc: string }>) =>
  vs.map((v) => {
    const e = labels[v];
    return e ? { value: v, label: e.label, desc: e.desc } : { value: v, label: v };
  });

export default function FilterBar({
  filters, scenario, onChange, onReset,
  regionOptions, layerOptions, costOptions, apiOptions, fitOptions, doiOptions, pdfOptions,
}: Props) {
  return (
    <div className="ctrl">
      <div className="fld scen">
        <label htmlFor="fS">场景</label>
        <select id="fS" value={filters.scen} onChange={(e) => onChange({ scen: e.target.value })}>
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.n}
            </option>
          ))}
        </select>
      </div>

      <div className="fld">
        <label htmlFor="q">搜索</label>
        <input
          id="q"
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="名称 / 学科 / 要点…"
          value={filters.q || ""}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </div>

      <MultiSelect id="fR" label="区域" values={filters.fR || []} options={asOptions(regionOptions)} onChange={(v) => onChange({ fR: v })} />
      <MultiSelect id="fL" label="层级" values={filters.fL || []} options={asOptions(layerOptions)} onChange={(v) => onChange({ fL: v })} />
      <MultiSelect id="fC" label="收费" values={filters.fC || []} options={asOptions(costOptions)} onChange={(v) => onChange({ fC: v })} />
      <MultiSelect id="fA" label="API" values={filters.fA || []} options={asOptions(apiOptions)} onChange={(v) => onChange({ fA: v })} />
      <MultiSelect id="fF" label="适配度" values={filters.fF || []} options={asOptions(fitOptions)} onChange={(v) => onChange({ fF: v })} />
      <MultiSelect id="fD" label="DOI 检索" values={filters.fD || []} options={labeled(doiOptions, DOI_LABELS)} onChange={(v) => onChange({ fD: v })} />
      <MultiSelect id="fP" label="PDF 全文" values={filters.fP || []} options={labeled(pdfOptions, PDF_LABELS)} onChange={(v) => onChange({ fP: v })} />

      <div className="expbar">
        <button type="button" className="exp ghost" onClick={onReset}>
          重置筛选
        </button>
      </div>
    </div>
  );
}