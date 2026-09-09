/** 开放网络 / 通用检索（非学术）筛选栏 —— 类型 / 维护状态 / 数据覆盖
 *  与 ServiceFilterBar 同形态，避免引入新交互。
 *  每个筛选项带问号帮助（文案见 src/data/filterHelp.ts）。 */

import type { WebsearchFilters } from "../types";
import { WB_HELP, withDesc } from "../data/filterHelp";
import MultiSelect from "./MultiSelect";
import HelpHint from "./HelpHint";

interface Props {
  filters: WebsearchFilters;
  onChange: (patch: Partial<WebsearchFilters>) => void;
  onReset: () => void;
  tyOptions: string[];
  mOptions: string[];
  srcOptions: string[];
}

export default function WebsearchFilterBar({
  filters, onChange, onReset, tyOptions, mOptions, srcOptions,
}: Props) {
  return (
    <div className="ctrl">
      <div className="fld">
        <span className="lab-row">
          <label htmlFor="q3">搜索</label>
          <HelpHint label="搜索" desc={WB_HELP.q.desc} />
        </span>
        <input
          id="q3"
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="API 名 / 用途 / 覆盖…"
          value={filters.q || ""}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </div>

      <MultiSelect id="wT" label="类型" values={filters.wT || []} options={withDesc(tyOptions, WB_HELP.wT)} help={WB_HELP.wT} onChange={(v) => onChange({ wT: v })} />
      <MultiSelect id="wM" label="维护状态" values={filters.wM || []} options={withDesc(mOptions, WB_HELP.wM)} help={WB_HELP.wM} onChange={(v) => onChange({ wM: v })} />
      <MultiSelect id="wSrc" label="数据覆盖" values={filters.wSrc || []} options={withDesc(srcOptions, WB_HELP.wSrc)} help={WB_HELP.wSrc} onChange={(v) => onChange({ wSrc: v })} />

      <div className="expbar">
        <button type="button" className="exp ghost" onClick={onReset}>
          重置筛选
        </button>
      </div>
    </div>
  );
}
