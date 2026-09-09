/** 筛选项帮助提示 —— 问号图标，悬浮或点击展开「字段说明 + 选项详细说明」。
 *
 *  交互设计：
 *  ① 桌面端 hover 即显（CSS :hover / :focus-within），不用等点击；
 *  ② 移动端没有 hover，点击问号 toggle（.open class）；
 *  ③ a11y：真实 <button>（键盘可达）+ aria-expanded + aria-label；
 *     Escape 或点击面板外关闭，面板内容可被读屏顺序读到。
 *
 *  零依赖：问号用内联 SVG，不引图标库（项目 0 运行时依赖原则）。 */

import { useEffect, useRef, useState } from "react";

interface Props {
  /** 字段名，用于 aria-label 与面板标题 */
  label: string;
  /** 字段说明 */
  desc: string;
  /** 各选项的详细说明（可省略） */
  options?: Array<{ label: string; desc: string }>;
}

export default function HelpHint({ label, desc, options }: Props) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);

  /* 面板打开时：点击外部关闭 + Escape 关闭 */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span className={"hh" + (open ? " open" : "")} ref={box}>
      <button
        type="button"
        className="hh-btn"
        aria-expanded={open}
        aria-label={label + " 筛选说明"}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false">
          <circle cx="8" cy="8" r="6.7" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8 4.1c1.5 0 2.7 1 2.7 2.4 0 .96-.55 1.48-1.22 2-.52.4-.83.68-.83 1.27v.33H7.3v-.5c0-.8.5-1.25 1.08-1.7.56-.44.77-.76.77-1.28 0-.7-.5-1.18-1.15-1.18-.63 0-1.1.43-1.16 1.1H5.4C5.46 5.25 6.55 4.1 8 4.1Zm-.7 6.7h1.55v1.55H7.3Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <span className="hh-pop" role="note" aria-label={label + " 说明"}>
        <b className="hh-t">{label}</b>
        <span className="hh-d">{desc}</span>
        {options?.length ? (
          <span className="hh-opts">
            {options.map((o) => (
              <span className="hh-opt" key={o.label}>
                <b>{o.label}</b>
                <span>{o.desc}</span>
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </span>
  );
}
