// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import Tabs from "../../src/components/Tabs";

const TABS = [
  { id: "src", label: "数据源（85）" },
  { id: "svc", label: "检索 / 查询服务" },
];

const setup = (active = "src", onChange = vi.fn()) => {
  const utils = render(<Tabs tabs={TABS} active={active} onChange={onChange} />);
  return { ...utils, onChange };
};

/** T2.6 —— Tab 键盘导航（WAI-ARIA APG） */
describe("T2.6 Tab 键盘导航", () => {
  it("role / aria-selected / roving tabindex 正确", () => {
    setup();
    const [a, b] = screen.getAllByRole("tab");
    expect(a.getAttribute("aria-selected")).toBe("true");
    expect(a.tabIndex).toBe(0);
    expect(b.getAttribute("aria-selected")).toBe("false");
    expect(b.tabIndex).toBe(-1);
  });

  it("ArrowRight 切到下一个并移动焦点", () => {
    const { onChange } = setup();
    const [a, b] = screen.getAllByRole("tab");
    a.focus();
    fireEvent.keyDown(a, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("svc");
    expect(document.activeElement).toBe(b);
  });

  it("ArrowRight 在末尾回绕到第一个", () => {
    const { onChange } = setup("svc");
    const [, b] = screen.getAllByRole("tab");
    fireEvent.keyDown(b, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("src");
  });

  it("ArrowLeft 反向切换", () => {
    const { onChange } = setup("svc");
    const [, b] = screen.getAllByRole("tab");
    fireEvent.keyDown(b, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith("src");
  });

  it("Home 跳到第一个", () => {
    const o = vi.fn();
    const { container } = render(<Tabs tabs={TABS} active="svc" onChange={o} />);
    fireEvent.keyDown(container.querySelectorAll('[role="tab"]')[1], { key: "Home" });
    expect(o).toHaveBeenCalledWith("src");
  });

  it("End 跳到最后一个", () => {
    const o = vi.fn();
    const { container } = render(<Tabs tabs={TABS} active="src" onChange={o} />);
    fireEvent.keyDown(container.querySelectorAll('[role="tab"]')[0], { key: "End" });
    expect(o).toHaveBeenCalledWith("svc");
  });

  it("无关按键不触发切换", () => {
    const { onChange } = setup();
    fireEvent.keyDown(screen.getAllByRole("tab")[0], { key: "a" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("点击也能切换", () => {
    const { onChange } = setup();
    fireEvent.click(screen.getAllByRole("tab")[1]);
    expect(onChange).toHaveBeenCalledWith("svc");
  });
});
