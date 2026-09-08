/** 关联跳转 chip —— 点击切换到另一张表并按名称筛选，把「数据源 ↔ 检索服务」的
 *  关系从两列互不相干的文本变成可导航的入口。
 *
 *  用事件委托而不是给 columns 传回调：columns 是模块级静态常量，
 *  传回调会迫使它变成工厂函数，连带改动所有 import 方与测试。 */

interface Props {
  names: string[];
  /** 点击后要跳到哪张表 */
  target: "src" | "svc";
  /** 无关联时的兜底文案（如「多源」） */
  fallback?: string;
}

export default function LinkChips({ names, target, fallback = "—" }: Props) {
  if (!names.length) return <span className="rg">{fallback}</span>;
  const to = target === "src" ? "数据源" : "检索服务";
  return (
    <span className="chips">
      {names.map((n) => (
        <button
          key={n}
          type="button"
          className="chip"
          data-jump={n}
          data-target={target}
          title={`在「${to}」表中查看 ${n}`}
        >
          {n}
        </button>
      ))}
    </span>
  );
}
