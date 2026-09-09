/** 检索服务筛选栏 —— 类型 / 语言 / 需订阅 / 维护状态 / 覆盖数据源
 *  选项一律从数据推导：原版下拉写死过 5 个语言值，漏了实际存在的「HTTP/JSON」，
 *  导致这类服务永远筛不出来。此处改为 derive-from-data，顺带修掉该缺陷。
 *  每个筛选项带问号帮助（文案见 src/data/filterHelp.ts）。 */

import type { ServiceFilters } from "../types";
import { SVC_HELP, withDesc } from "../data/filterHelp";
import MultiSelect from "./MultiSelect";
import HelpHint from "./HelpHint";

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
        <span className="lab-row">
          <label htmlFor="q2">搜索</label>
          <HelpHint label="搜索" desc={SVC_HELP.q.desc} />
        </span>
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

      <MultiSelect id="sT" label="类型" values={filters.sT || []} options={withDesc(tyOptions, SVC_HELP.sT)} help={SVC_HELP.sT} onChange={(v) => onChange({ sT: v })} />
      <MultiSelect id="sLang" label="语言" values={filters.sLang || []} options={withDesc(langOptions, SVC_HELP.sLang)} help={SVC_HELP.sLang} onChange={(v) => onChange({ sLang: v })} />
      <MultiSelect
        id="sSub"
        label="需机构订阅"
        values={filters.sSub || []}
        options={withDesc(["是", "否"], SVC_HELP.sSub)}
        help={SVC_HELP.sSub}
        onChange={(v) => onChange({ sSub: v })}
      />
      <MultiSelect id="sM" label="维护状态" values={filters.sM || []} options={withDesc(mOptions, SVC_HELP.sM)} help={SVC_HELP.sM} onChange={(v) => onChange({ sM: v })} />
      <MultiSelect id="sSrc" label="覆盖数据源" values={filters.sSrc || []} options={withDesc(srcOptions, SVC_HELP.sSrc)} help={SVC_HELP.sSrc} onChange={(v) => onChange({ sSrc: v })} />

      <div className="expbar">
        <button type="button" className="exp ghost" onClick={onReset}>
          重置筛选
        </button>
      </div>
    </div>
  );
}
