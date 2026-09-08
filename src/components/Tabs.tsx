/** Tab 切换：WAI-ARIA APG 模式 —— roving tabindex + ←/→/Home/End 键盘导航 */

import { useRef } from "react";

export interface TabItem {
  id: string;
  label: string;
}

interface Props {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, active, onChange }: Props) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === active);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  };

  return (
    <div className="tabs" role="tablist" aria-label="数据视图" onKeyDown={onKeyDown}>
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={"tab-" + t.id}
            aria-controls={"pane-" + t.id}
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            className={"tab" + (on ? " on" : "")}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
