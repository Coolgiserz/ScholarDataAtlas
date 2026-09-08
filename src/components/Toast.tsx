/** 轻量提示条：替代 alert()，成功 / 失败分色，自动消失 */

import { useEffect } from "react";

interface Props {
  msg: string;
  kind?: "ok" | "err";
  onDone: () => void;
  /** 毫秒，0 表示不自动关闭 */
  duration?: number;
}

export default function Toast({ msg, kind = "ok", onDone, duration = 2600 }: Props) {
  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [msg, duration, onDone]);

  return (
    <div className={"toast " + kind} role="status" aria-live="polite">
      {msg}
    </div>
  );
}
