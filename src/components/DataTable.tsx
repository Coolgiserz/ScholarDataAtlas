/** 通用表格：表头与单元格均由 columns 生成，二者长度必然相等 */

import { memo } from "react";
import type { Scenario, Service, Source, Websearch } from "../types";
import { fitOf } from "../core/fit";
import type { Column } from "../columns";

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  scenario: Scenario;
  sortKey: string | null;
  sortDir: number;
  onSort: (key: string) => void;
  caption: string;
  className: string;
  emptyText: string;
  onReset: () => void;
  /** 表格级点击委托：处理关联 chip 的跨表跳转 */
  onJump?: (e: React.MouseEvent<HTMLTableElement>) => void;
  thExtra?: (col: Column<T>) => React.ReactNode;
}

function DataTableInner<T extends Source | Service | Websearch>({
  columns, rows, scenario, sortKey, sortDir, onSort, caption, className, emptyText, onReset, thExtra, onJump,
}: Props<T>) {
  return (
    <div className="tblbox">
      <table className={className} onClick={onJump}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={[c.className, c.sortable ? "" : "na"].filter(Boolean).join(" ") || undefined}
                data-col={c.key}
                aria-sort={c.sortable ? (sortKey === c.key ? (sortDir === 1 ? "ascending" : "descending") : "none") : undefined}
              >
                {c.sortable ? (
                  <button type="button" className="srt" onClick={() => onSort(c.key)}>
                    {c.title}
                    <span className="srt-g" aria-hidden="true">
                      {sortKey !== c.key ? "⇅" : sortDir === 1 ? "▲" : "▼"}
                    </span>
                  </button>
                ) : (
                  c.title
                )}
                {thExtra ? thExtra(c) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => {
            const fit = "doi" in d ? fitOf(d as Source, scenario) : null;
            return (
              <tr key={d.n} data-row={i}>
                {columns.map((c, ci) =>
                  ci === 0 ? (
                    <th key={c.key} scope="row" className={c.className} data-col={c.key}>
                      {c.render(d, scenario, fit as never)}
                    </th>
                  ) : (
                    <td key={c.key} className={c.className} data-col={c.key}>
                      {c.render(d, scenario, fit as never)}
                    </td>
                  ),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <div className="empty" role="status">
          {emptyText}
          <div style={{ marginTop: 12 }}>
            <button type="button" className="exp ghost" onClick={onReset}>
              重置筛选
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default memo(DataTableInner) as typeof DataTableInner;
