/** 通用下拉筛选控件：label 与 select 通过 htmlFor / id 关联（无障碍） */

interface Option {
  value: string;
  label: string;
}

interface Props {
  id: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  className?: string;
}

export default function SelectField({ id, label, value, options, onChange, className }: Props) {
  return (
    <div className={"fld" + (className ? " " + className : "")}>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">全部</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** 把字符串数组转成选项（value === label） */
export const asOptions = (arr: string[]): Option[] => arr.map((v) => ({ value: v, label: v }));
