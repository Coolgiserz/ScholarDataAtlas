/** 名称单元格：有官网则渲染外链，无官网则为纯文本 */

interface Props {
  name: string;
  url?: string;
  sub?: string;
}

export default function NameCell({ name, url, sub }: Props) {
  if (!url) {
    return (
      <span className="nm off" translate="no">
        {name}
        {sub ? <small>{sub}</small> : null}
      </span>
    );
  }
  return (
    <a
      className="nm"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      translate="no"
      data-col-name={name}
    >
      {name}
      <span className="ext" aria-hidden="true">
        ↗
      </span>
      <span className="sr-only">（在新窗口打开）</span>
      {sub ? <small>{sub}</small> : null}
    </a>
  );
}
