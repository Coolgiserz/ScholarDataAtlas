// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";

/* 必须在每个用例前重置：App 启动时会从 URL 恢复筛选状态，
   若上一个用例留下 ?sT=… 之类参数，会污染当前用例（这本身也验证了 URL 恢复链路是通的）。 */
beforeEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";

import App from "../../src/App";
import { SERVICES } from "../../src/data/services";
import { mSvc } from "../../src/core/filter";

const setup = () => render(<App />);
const toSvc = () => fireEvent.click(screen.getByRole("tab", { name: /检索/ }));
const rowCount = () => document.querySelectorAll("table.t-svc tbody tr").length;

/** 多选控件是 chip 组（不是 <select>）：按 data-ms / data-val 精确点选，
 *  避免「同名文本出现在表格里」造成的歧义。 */
const pick = (id: string, value: string) => {
  const btn = [...document.querySelectorAll<HTMLButtonElement>(`[data-ms="${id}"]`)].find(
    (b) => b.dataset.val === value,
  );
  if (!btn) throw new Error(`找不到筛选项 ${id}=${value}`);
  fireEvent.click(btn);
};
const clear = (id: string) =>
  fireEvent.click(document.querySelector(`[data-ms-clear="${id}"]`)!);
const pressed = (id: string) =>
  [...document.querySelectorAll(`[data-ms="${id}"]`)].filter((b) => b.getAttribute("aria-pressed") === "true").length;

describe("服务页筛选（M2 回归修复：原 React 版丢失了除搜索外的全部筛选项）", () => {
  it("服务页存在 5 个筛选项 + 搜索框，且都是可多选的 chip 组", () => {
    setup();
    toSvc();
    ["类型", "语言", "需机构订阅", "维护状态", "覆盖数据源"].forEach((l) => {
      expect(screen.getByRole("group", { name: new RegExp("^" + l) }), l).toBeTruthy();
    });
    expect(screen.getByLabelText("搜索")).toBeTruthy();
  });

  it("默认展示 73 行", () => {
    setup();
    toSvc();
    expect(rowCount()).toBe(73);
  });

  it("按类型筛选的结果与 core/filter 一致（数组入参）", () => {
    setup();
    toSvc();
    pick("sT", "开源SDK");
    expect(rowCount()).toBe(SERVICES.filter((d) => mSvc(d, { sT: ["开源SDK"] })).length);
  });

  it("按语言筛选：含原版下拉漏掉的 HTTP/JSON（已改为从数据推导）", () => {
    setup();
    toSvc();
    const opts = [...document.querySelectorAll('[data-ms="sLang"]')].map((b) => b.getAttribute("data-val"));
    expect(opts).toContain("HTTP/JSON");
    pick("sLang", "HTTP/JSON");
    expect(rowCount()).toBeGreaterThan(0);
    expect(rowCount()).toBeLessThan(73);
  });

  it("按需机构订阅筛选：是 / 否", () => {
    setup();
    toSvc();
    pick("sSub", "1");
    const yes = rowCount();
    clear("sSub");
    pick("sSub", "0");
    const no = rowCount();
    expect(yes + no).toBe(73);
    expect(yes).toBeGreaterThan(0);
  });

  it("按维护状态筛选：活跃", () => {
    setup();
    toSvc();
    pick("sM", "活跃");
    expect(rowCount()).toBe(SERVICES.filter((d) => mSvc(d, { sM: ["活跃"] })).length);
  });

  it("按覆盖数据源筛选走子串匹配", () => {
    setup();
    toSvc();
    pick("sSrc", "OpenAlex");
    expect(rowCount()).toBe(SERVICES.filter((d) => mSvc(d, { sSrc: ["OpenAlex"] })).length);
  });

  it("不同维度叠加为交集", () => {
    setup();
    toSvc();
    pick("sT", "开源SDK");
    const a = rowCount();
    pick("sM", "活跃");
    const b = rowCount();
    expect(b).toBeLessThanOrEqual(a);
  });

  it("重置筛选恢复 73 行", () => {
    setup();
    toSvc();
    pick("sT", "开源SDK");
    expect(rowCount()).toBeLessThan(73);
    fireEvent.click(within(document.querySelector(".ctrl")!).getByText("重置筛选"));
    expect(rowCount()).toBe(73);
  });

  it("搜索生效", () => {
    setup();
    toSvc();
    fireEvent.change(screen.getByLabelText("搜索"), { target: { value: "zzz-不存在-zzz" } });
    expect(rowCount()).toBe(0);
  });
});

/* ── 新增：多选语义（用户要求「不互斥的筛选项应允许多选」）── */
describe("多选筛选：同一维度内取并集（OR）", () => {
  it("同时选 Python + R 得到两者并集，且 ≥ 任一单选", () => {
    setup();
    toSvc();
    pick("sLang", "Python");
    const py = rowCount();
    clear("sLang");
    pick("sLang", "R");
    const r = rowCount();
    pick("sLang", "Python"); // 叠加第二个值
    const both = rowCount();

    expect(pressed("sLang")).toBe(2);
    expect(both).toBe(SERVICES.filter((d) => mSvc(d, { sLang: ["R", "Python"] })).length);
    expect(both).toBeGreaterThanOrEqual(py);
    expect(both).toBeGreaterThanOrEqual(r);
    // 数据里 Python 与 R 无交集，故并集 = 两者之和
    expect(both).toBe(py + r);
  });

  it("再次点击同一项 = 取消选择", () => {
    setup();
    toSvc();
    pick("sT", "开源SDK");
    expect(pressed("sT")).toBe(1);
    pick("sT", "开源SDK");
    expect(pressed("sT")).toBe(0);
    expect(rowCount()).toBe(73);
  });

  it("计数徽标显示已选数量，清空按钮可一键归零", () => {
    setup();
    toSvc();
    pick("sM", "活跃");
    pick("sM", "低频");
    // 标签上的计数徽标
    const lab = document.getElementById("sM-lab")!;
    expect(lab.querySelector(".ms-n")!.textContent).toBe("2");
    const btn = document.querySelector<HTMLButtonElement>('[data-ms-clear="sM"]');
    expect(btn).toBeTruthy();
    fireEvent.click(btn!);
    expect(pressed("sM")).toBe(0);
    expect(document.getElementById("sM-lab")!.querySelector(".ms-n")).toBeNull();
    expect(rowCount()).toBe(73);
  });

  it("多选状态写进 URL，刷新后可恢复（逗号分隔）", () => {
    setup();
    toSvc();
    pick("sLang", "Python");
    pick("sLang", "R");
    const u = new URL(window.location.href);
    expect(u.searchParams.get("sLang")).toBe("Python,R");
  });

  it("老的单值链接仍能解析（向后兼容）", () => {
    window.history.replaceState(null, "", "/?sLang=Python");
    setup();
    toSvc();
    expect(pressed("sLang")).toBe(1);
    expect(rowCount()).toBe(SERVICES.filter((d) => mSvc(d, { sLang: ["Python"] })).length);
  });
});

describe("两个 Tab 的筛选状态互相独立", () => {
  it("在数据源页筛选后切到服务页，服务页仍为全量", () => {
    setup();
    fireEvent.change(screen.getByLabelText("搜索"), { target: { value: "zzz-不存在-zzz" } });
    expect(document.querySelectorAll("table.t-src tbody tr").length).toBe(0);
    toSvc();
    expect(rowCount()).toBe(73);
  });
});
