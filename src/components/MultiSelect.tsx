/** 多选筛选控件 —— 用切换 chip 而不是 <select multiple>：
 *  ① 移动端可用（原生多选下拉在 iOS 上体验极差）；
 *  ② 已选项一眼可见，不需要展开就知道选了什么；
 *  ③ aria-pressed + role=group，键盘与读屏都能用。
 *
 *  选项超过 6 个时收进 <details>，避免筛选栏被撑爆（层级有 56 个取值）。
 *
 *  Option.desc 选填：填了则在 chip 上加原生 title 属性，鼠标悬停 / 触屏长按
 *  时显示详细说明（如「DOI 单查专用 endpoint，与 Crossref REST 同级」）。 */

interface Option { value: string; label: string; desc?: string }

interface Props {
  id: string;
  label: string;
  values: string[];
  options: Option[];
  onChange: (v: string[]) => void;
}

export default function MultiSelect({ id, label, values, options, onChange }: Props) {
  const set = new Set(values);
  const toggle = (v: string) =>
    onChange(set.has(v) ? values.filter((x) => x !== v) : values.concat(v));
  const many = options.length > 6;
  const labId = id + "-lab";

  const body = (
    <div className={"chips" + (many ? " ms-many" : "")} role="group" aria-labelledby={labId}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={"chip tog" + (set.has(o.value) ? " on" : "")}
          aria-pressed={set.has(o.value)}
          aria-label={o.desc ? o.label + "：" + o.desc : undefined}
          title={o.desc || undefined}
          data-ms={id}
          data-val={o.value}
          onClick={() => toggle(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fld ms">
      <span className="ms-lab" id={labId}>
        {label}
        {values.length ? <span className="ms-n">{values.length}</span> : null}
      </span>
      {many ? (
        <details className="ms-det">
          <summary>{values.length ? "已选 " + values.length + " 项" : "展开选择（" + options.length + "）"}</summary>
          {body}
        </details>
      ) : (
        body
      )}
      {values.length ? (
        <button type="button" className="ms-clear" data-ms-clear={id} onClick={() => onChange([])}>
          清空
        </button>
      ) : null}
    </div>
  );
}
