/** CSV 生成：带 UTF-8 BOM（Excel 中文不乱码），标准引号转义 */

export function toCsv(rows: Array<Array<string | number>>): string {
  return (
    "﻿" +
    rows
      .map((r) =>
        r
          .map((v) => {
            const s = v == null ? "" : String(v);
            return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
          })
          .join(","),
      )
      .join("\r\n")
  );
}
