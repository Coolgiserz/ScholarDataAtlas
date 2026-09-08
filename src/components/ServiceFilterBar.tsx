/** 检索服务筛选栏 —— 类型 / 语言 / 需订阅 / 维护状态 / 覆盖数据源
 *  选项一律从数据推导：原版下拉写死过 5 个语言值，漏了实际存在的「HTTP/JSON」，
 *  导致这类服务永远筛不出来。此处改为 derive-from-data，顺带修掉该缺陷。 */

import type { ServiceFilters } from "../types";
import { asOptions } from "./SelectField";
import MultiSelect from "./MultiSelect";

interface Props {
  filters: ServiceFilters;
  onChange: (patch: Partial<ServiceFilters>) => void;
  onReset: () => void;
  tyOptions: string[];
  langOptions: string[];
  mOptions: string[];
  srcOptions: string[];
}

export default function ServiceFilterBar({
  filters, onChange, onReset, tyOptions, langOptions, mOptions, srcOptions,
}: Props) {
  return (
    <div className="ctrl">
      <div className="fld">
        <label htmlFor="q2">搜索</label>
        <input
          id="q2"
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="服务名 / 数据源 / 场景…"
          value={filters.q || ""}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </div>

      <MultiSelect id="sT" label="类型" values={filters.sT || []} options={asOptions(tyOptions)} onChange={(v) => onChange({ sT: v })} />
      <MultiSelect id="sLang" label="语言" values={filters.sLang || []} options={asOptions(langOptions)} onChange={(v) => onChange({ sLang: v })} />
      <MultiSelect
        id="sSub"
        label="需机构订阅"
        values={filters.sSub || []}
        options={[
          { value: "1", label: "是" },
          { value: "0", label: "否" },
        ]}
        onChange={(v) => onChange({ sSub: v })}
      />
      <MultiSelect id="sM" label="维护状态" values={filters.sM || []} options={asOptions(mOptions)} onChange={(v) => onChange({ sM: v })} />
      <MultiSelect id="sSrc" label="覆盖数据源" values={filters.sSrc || []} options={asOptions(srcOptions)} onChange={(v) => onChange({ sSrc: v })} />

      <div className="expbar">
        <button type="button" className="exp ghost" onClick={onReset}>
          重置筛选
        </button>
      </div>
    </div>
  );
}
