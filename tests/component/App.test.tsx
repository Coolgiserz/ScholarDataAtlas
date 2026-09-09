// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import App from "../../src/App";

beforeEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

const setup = () => render(<App />);
/* 必须限定在数据表内：页面还有「场景相关性判定说明」里的五档阶梯表，
   用全局 "tbody tr" 会把那 5 行一起数进来。 */
const rowCount = (table = "table.t-src") => document.querySelectorAll(table + " tbody tr").length;
const selectScenario = (id: string) => {
  fireEvent.change(screen.getByLabelText("场景"), { target: { value: id } });
};

/** T2.1 —— 首屏渲染 */
describe("T2.1 首屏", () => {
  it("数据源表默认展示 85 行（73 原有 + 12 新能源 2026-09-09 补录）", () => {
    setup();
    expect(rowCount()).toBe(85);
  });

  it("计数播报为 85 / 85", () => {
    setup();
    const cnt = document.querySelector(".cnt")!;
    expect(cnt.textContent).toContain("85");
  });
});

/** T2.2 —— 场景切换触发过滤 */
describe("T2.2 场景切换", () => {
  it("切到「芯片 / 半导体」后只剩 72 行（85 - 13 他领域）并显示隐藏计数", () => {
    setup();
    selectScenario("chip");
    expect(rowCount()).toBe(72);
    expect(document.querySelector(".hidn")!.textContent).toContain("已隐藏 13");
  });

  it("临床类源在芯片场景下不再出现", () => {
    setup();
    selectScenario("chip");
    const names = [...document.querySelectorAll("table.t-src tbody tr th[data-col='n']")].map((n) => n.textContent);
    expect(names.join("|")).not.toContain("PubMed");
    expect(names.join("|")).not.toContain("SinoMed");
  });

  it("全球性大源仍然保留", () => {
    setup();
    selectScenario("chip");
    const names = [...document.querySelectorAll("table.t-src tbody tr th[data-col='n']")].map((n) => n.textContent);
    expect(names.join("|")).toContain("Crossref");
    expect(names.join("|")).toContain("OpenAlex");
  });
});

/** T2.3 —— 场景相关性过滤（已移除「只看场景相关」开关：选场景即默认过滤他领域垂类） */
describe("T2.3 场景相关性隐式过滤", () => {
  it("选 chip 场景后自动隐藏 13 个他领域垂类源", () => {
    setup();
    expect(rowCount()).toBe(85);
    selectScenario("chip");
    expect(rowCount()).toBe(72);
    expect(document.querySelector(".hidn")!.textContent).toContain("已隐藏 13");
  });
  it("选通用建库场景下不过滤他领域垂类（无 rel）", () => {
    setup();
    selectScenario("gen");
    expect(rowCount()).toBe(85);
    expect(document.querySelector(".hidn")!.textContent).toBe("");
  });
});

/** T2.4 —— 旧版开关条件渲染（已删除：开关从产品里彻底移除） */
describe.skip("T2.4 旧版「只看场景相关」开关（已删除）", () => {
  it("通用建库场景下不渲染", () => {
    setup();
    expect(screen.queryByLabelText("只看场景相关")).toBeNull();
  });
  it("学科场景下渲染", () => {
    setup();
    selectScenario("bio");
    expect(screen.queryByLabelText("只看场景相关")).toBeNull();
  });
});

/** T2.7 —— 空状态与重置 */
describe("T2.7 空状态与重置", () => {
  it("搜索无结果时显示空状态与重置按钮", () => {
    setup();
    fireEvent.change(screen.getByLabelText("搜索"), { target: { value: "zzz-不存在-zzz" } });
    expect(rowCount()).toBe(0);
    const resetBtns = screen.getAllByText("重置筛选");
    expect(resetBtns.length).toBeGreaterThan(0);
    fireEvent.click(resetBtns[0]);
    expect(rowCount()).toBe(85);
  });
});

/** T2.9 —— URL 状态同步 */
describe("T2.9 URL 状态", () => {
  it("切换场景后 URL 带上 sc 参数", () => {
    setup();
    selectScenario("chip");
    expect(window.location.search).toContain("sc=chip");
  });
  it("fRel 参数已被移除（不再序列化）", () => {
    setup();
    selectScenario("chip");
    expect(window.location.search).not.toContain("fRel");
    expect(window.location.search).not.toContain("fRel=0");
  });
});

/** T2.8 —— 导出按钮状态（按钮文案带条数，故用正则匹配） */
describe("T2.8 导出按钮", () => {
  const btn = () => screen.getByRole("button", { name: /导出 Excel/ }) as HTMLButtonElement;
  it("无结果时导出按钮禁用", () => {
    setup();
    fireEvent.change(screen.getByLabelText("搜索"), { target: { value: "zzz-不存在-zzz" } });
    expect(btn().disabled).toBe(true);
  });
  it("有结果时可点击", () => {
    setup();
    expect(btn().disabled).toBe(false);
  });
  it("按钮与提示都反映当前筛选条数", () => {
    setup();
    expect(btn().textContent).toContain("85");
    expect(document.querySelector(".expnote")!.textContent).toContain("未设置筛选");
  });
});

/** DOI / PDF 维度筛选 */
describe("DOI / PDF 维度筛选", () => {
  it("FilterBar 渲染 DOI 检索 + PDF 全文 两个多选 chip 组", () => {
    setup();
    expect(screen.getByText("DOI 检索")).toBeTruthy();
    expect(screen.getByText("PDF 全文")).toBeTruthy();
  });
  it("点击 DOI「专用端点」chip 后筛选生效，URL 带上 fD=3", () => {
    setup();
    const before = rowCount();
    fireEvent.click(screen.getByRole("button", { name: "● 专用端点" }));
    expect(rowCount()).toBeLessThan(before);
    expect(window.location.search).toContain("fD=3");
  });
  it("点击 PDF「全量免费」chip 后筛选生效", () => {
    setup();
    const before = rowCount();
    fireEvent.click(screen.getByRole("button", { name: "● 全量免费" }));
    expect(rowCount()).toBeLessThan(before);
    expect(window.location.search).toContain("fP=3");
  });
});

/** Tab 切换 */
describe("Tab 切换", () => {
  it("切到服务表后渲染 72 行（已从 SERVICES 移除 Perplexity API）", () => {
    setup();
    fireEvent.click(screen.getByRole("tab", { name: /检索服务/ }));
    expect(rowCount("table.t-svc")).toBe(72);
  });
  it("切到开放网络表后渲染 7 行", () => {
    setup();
    fireEvent.click(screen.getByRole("tab", { name: /开放网络/ }));
    expect(rowCount("table.t-wb")).toBe(7);
  });
  it("Tab 渲染 3 个", () => {
    setup();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(3);
  });
});
