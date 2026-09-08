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

/** DOI / PDF 能力档位的 label 解释，避免用户看到 ●/◐/○/— 不知所云 */
const DOI_LABELS: Record<string, string> = {
  "3": "● 专用端点",
  "2": "◐ 支持检索",
  "1": "○ 无可靠 API",
  "0": "— 不支持",
};
const PDF_LABELS: Record<string, string> = {
  "3": "● 全量免费",
  "2": "◐ 仅 OA",
  "1": "○ 仅订阅",
  "0": "— 不支持",
};

const labeled = (vs: string[], labels: Record<string, string>) =>
  vs.map((v) => ({ value: v, label: labels[v] || v }));

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

      {scenario.rel ? (
        <div className="fld chk" id="fRelWrap">
          <input
            type="checkbox"
            id="fRel"
            checked={filters.relOnly}
            onChange={(e) => onChange({ relOnly: e.target.checked })}
          />
          <label htmlFor="fRel">只看场景相关</label>
        </div>
      ) : null}

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