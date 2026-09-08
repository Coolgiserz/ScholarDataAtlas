// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import DataTable from "../../src/components/DataTable";
import { SOURCE_COLUMNS, SERVICE_COLUMNS } from "../../src/columns";
import { SOURCES } from "../../src/data/sources";
import { SERVICES } from "../../src/data/services";
import { SCENARIO_MAP } from "../../src/data/scenarios";
import { fitOf } from "../../src/core/fit";

const sc = SCENARIO_MAP.gen;
const noop = () => {};

const setup = (rows = SOURCES) =>
  render(
    <DataTable
      columns={SOURCE_COLUMNS}
      rows={rows}
      scenario={sc}
      sortKey={null}
      sortDir={1}
      onSort={noop}
      caption="测试表"
      className="t-src"
      emptyText="没有匹配的数据源"
      onReset={noop}
    />,
  );

/** T2.10 —— 列数一致：表头与表体由同一份 columns 生成，长度必然相等 */
describe("T2.10 列数一致（防 v1.3.1 漏列 bug 复发）", () => {
  it("数据源表：表头 12 列 == 首行 12 个单元格", () => {
    const { container } = setup();
    const ths = container.querySelectorAll("thead th");
    const cells = container.querySelectorAll("tbody tr:first-child > *");
    expect(ths.length).toBe(SOURCE_COLUMNS.length);
    expect(cells.length).toBe(ths.length);
  });

  it("服务表：表头 9 列 == 首行 9 个单元格", () => {
    const { container } = render(
      <DataTable
        columns={SERVICE_COLUMNS}
        rows={SERVICES}
        scenario={sc}
        sortKey={null}
        sortDir={1}
        onSort={noop}
        caption="测试表"
        className="t-svc"
        emptyText="无"
        onReset={noop}
      />,
    );
    const ths = container.querySelectorAll("thead th");
    const cells = container.querySelectorAll("tbody tr:first-child > *");
    expect(ths.length).toBe(SERVICE_COLUMNS.length);
    expect(cells.length).toBe(ths.length);
  });

  it("每一行的单元格数都与表头一致（不只是首行）", () => {
    const { container } = setup();
    const n = container.querySelectorAll("thead th").length;
    const bad = [...container.querySelectorAll("tbody tr")].filter(
      (tr) => tr.children.length !== n,
    );
    expect(bad.length).toBe(0);
  });
});

/** T2.11 —— 列内容对位：按 data-col 逐列断言，能抓住「列数对了但顺序错位」 */
describe("T2.11 列内容对位", () => {
  it("每个 th 与同列 td 的 data-col 一一对应", () => {
    const { container } = setup();
    const keys = [...container.querySelectorAll("thead th")].map((th) => th.getAttribute("data-col"));
    const row = container.querySelector("tbody tr")!;
    keys.forEach((k, i) => {
      expect(row.children[i].getAttribute("data-col")).toBe(k);
    });
  });

  it("DOI 列含符号与无障碍名称，PDF 列同理", () => {
    const { container } = setup();
    const doi = container.querySelector('tbody tr td[data-col="doi"]')!;
    const pdf = container.querySelector('tbody tr td[data-col="pdf"]')!;
    expect(doi.querySelector('[aria-hidden="true"]')?.textContent).toBeTruthy();
    expect(doi.querySelector(".sr-only")?.textContent).toBeTruthy();
    expect(pdf.querySelector(".sr-only")?.textContent).toBeTruthy();
  });

  it("适配度列的值与 core/fit 计算结果一致", () => {
    const { container } = setup();
    SOURCES.slice(0, 10).forEach((d, i) => {
      const cell = container.querySelectorAll('tbody tr td[data-col="fit"]')[i];
      /* 适配度单元格含 档位标签 + 分值 + 「为什么」展开块，断言取标签本身 */
      expect(cell.querySelector(".tag")!.textContent).toBe(fitOf(d, sc).lab);
    });
  });

  it("学科覆盖 / 地域 / 一句话要点列内容取自对应字段", () => {
    const { container } = setup();
    const row = container.querySelectorAll("tbody tr")[0];
    expect(row.querySelector('[data-col="sb"]')!.textContent).toBe(SOURCES[0].sb);
    expect(row.querySelector('[data-col="ge"]')!.textContent).toBe(SOURCES[0].ge);
    expect(row.querySelector('[data-col="nt"]')!.textContent).toBe(SOURCES[0].nt);
  });
});

/** T2.1 / T2.12 —— 渲染与语义 */
describe("T2.1 渲染与语义", () => {
  it("渲染全部 73 行", () => {
    const { container } = setup();
    expect(container.querySelectorAll("tbody tr").length).toBe(73);
  });

  it("行首为 th scope=row，表头为 th scope=col", () => {
    const { container } = setup();
    expect(container.querySelector("tbody tr > th")?.getAttribute("scope")).toBe("row");
    [...container.querySelectorAll("thead th")].forEach((th) =>
      expect(th.getAttribute("scope")).toBe("col"),
    );
  });

  it("有 sr-only caption", () => {
    const { container } = setup();
    const cap = container.querySelector("caption")!;
    expect(cap.className).toContain("sr-only");
    expect(cap.textContent).toBe("测试表");
  });

  it("数据源名为 brand 词免翻译", () => {
    setup();
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    expect(links[0].getAttribute("translate")).toBe("no");
    expect(links[0].getAttribute("rel")).toContain("noopener");
  });
});

/** T2.5 —— 排序三态 */
describe("T2.5 排序状态", () => {
  it("未排序时所有可排序列 aria-sort=none", () => {
    const { container } = setup();
    const sortable = [...container.querySelectorAll("thead th[data-col]")].filter((th) =>
      th.querySelector("button.srt"),
    );
    expect(sortable.length).toBeGreaterThan(0);
    sortable.forEach((th) => expect(th.getAttribute("aria-sort")).toBe("none"));
  });

  it("激活列显示 ascending / descending，其余为 none", () => {
    const asc = setup();
    asc.unmount();
    const { container } = render(
      <DataTable
        columns={SOURCE_COLUMNS}
        rows={SOURCES}
        scenario={sc}
        sortKey="fit"
        sortDir={-1}
        onSort={noop}
        caption="t"
        className="t-src"
        emptyText=""
        onReset={noop}
      />,
    );
    const fit = container.querySelector('thead th[data-col="fit"]')!;
    const n = container.querySelector('thead th[data-col="n"]')!;
    expect(fit.getAttribute("aria-sort")).toBe("descending");
    expect(n.getAttribute("aria-sort")).toBe("none");
  });
});

/** 空状态 */
describe("空状态与重置", () => {
  it("无数据时显示空状态与重置按钮", () => {
    setup([]);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("重置筛选")).toBeTruthy();
  });
});
