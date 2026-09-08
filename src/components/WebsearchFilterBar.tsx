/** 开放网络 / 通用检索（非学术）筛选栏 —— 类型 / 维护状态 / 数据覆盖
 *  与 ServiceFilterBar 同形态，避免引入新交互。 */

import type { WebsearchFilters } from "../types";
import { asOptions } from "./SelectField";
import MultiSelect from "./MultiSelect";

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
        <label htmlFor="q3">搜索</label>
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

      <MultiSelect id="wT" label="类型" values={filters.wT || []} options={asOptions(tyOptions)} onChange={(v) => onChange({ wT: v })} />
      <MultiSelect id="wM" label="维护状态" values={filters.wM || []} options={asOptions(mOptions)} onChange={(v) => onChange({ wM: v })} />
      <MultiSelect id="wSrc" label="数据覆盖" values={filters.wSrc || []} options={asOptions(srcOptions)} onChange={(v) => onChange({ wSrc: v })} />

      <div className="expbar">
        <button type="button" className="exp ghost" onClick={onReset}>
          重置筛选
        </button>
      </div>
    </div>
  );
}