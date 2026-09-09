/** 数据源筛选栏 —— 场景 + 各维度下拉 + 搜索。
 *  每个筛选项都带问号帮助（help 字段 → HelpHint 问号图标），
 *  选项说明由 withDesc 合并进 chip 的悬浮提示。文案集中在 src/data/filterHelp.ts。 */

import type { SourceFilters } from "../types";
import { SCENARIOS } from "../data/scenarios";
import { SRC_HELP, DOI_CHIPS, PDF_CHIPS, withDesc } from "../data/filterHelp";
import MultiSelect from "./MultiSelect";
import HelpHint from "./HelpHint";

interface Props {
  filters: SourceFilters;
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

/** chip 档位 label（●/◐/○/— 符号 + 短语）来自 DOI_CHIPS / PDF_CHIPS */
const chipLabeled = (
  vs: string[],
  chips: Record<string, { label: string; desc: string }>,
) =>
  vs.map((v) => {
    const e = chips[v];
    return e ? { value: v, label: e.label, desc: e.desc } : { value: v, label: v };
  });

export default function FilterBar({
  filters, onChange, onReset,
  regionOptions, layerOptions, costOptions, apiOptions, fitOptions, doiOptions, pdfOptions,
}: Props) {
  return (
    <div className="ctrl">
      <div className="fld scen">
        <span className="lab-row">
          <label htmlFor="fS">场景</label>
          <HelpHint label="场景" desc={SRC_HELP.scen.desc} />
        </span>
        <select id="fS" value={filters.scen} onChange={(e) => onChange({ scen: e.target.value })}>
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.n}
            </option>
          ))}
        </select>
      </div>

      <div className="fld">
        <span className="lab-row">
          <label htmlFor="q">搜索</label>
          <HelpHint label="搜索" desc={SRC_HELP.q.desc} />
        </span>
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

      <MultiSelect id="fR" label="区域" values={filters.fR || []} options={withDesc(regionOptions, SRC_HELP.fR)} help={SRC_HELP.fR} onChange={(v) => onChange({ fR: v })} />
      <MultiSelect id="fL" label="层级" values={filters.fL || []} options={withDesc(layerOptions, SRC_HELP.fL)} help={SRC_HELP.fL} onChange={(v) => onChange({ fL: v })} />
      <MultiSelect id="fC" label="收费" values={filters.fC || []} options={withDesc(costOptions, SRC_HELP.fC)} help={SRC_HELP.fC} onChange={(v) => onChange({ fC: v })} />
      <MultiSelect id="fA" label="API" values={filters.fA || []} options={withDesc(apiOptions, SRC_HELP.fA)} help={SRC_HELP.fA} onChange={(v) => onChange({ fA: v })} />
      <MultiSelect id="fF" label="适配度" values={filters.fF || []} options={withDesc(fitOptions, SRC_HELP.fF)} help={SRC_HELP.fF} onChange={(v) => onChange({ fF: v })} />
      <MultiSelect id="fD" label="DOI 检索" values={filters.fD || []} options={chipLabeled(doiOptions, DOI_CHIPS)} help={SRC_HELP.fD} onChange={(v) => onChange({ fD: v })} />
      <MultiSelect id="fP" label="PDF 全文" values={filters.fP || []} options={chipLabeled(pdfOptions, PDF_CHIPS)} help={SRC_HELP.fP} onChange={(v) => onChange({ fP: v })} />

      <div className="expbar">
        <button type="button" className="exp ghost" onClick={onReset}>
          重置筛选
        </button>
      </div>
    </div>
  );
}
