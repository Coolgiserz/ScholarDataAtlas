// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import App from "../../src/App";

/* axe-core 以绝对路径引入（本机沙箱无法装进项目 node_modules，正式环境应改为 `import axe from "axe-core"`） */
const AXE = "/Users/tarnished/.workbuddy/binaries/node/workspace/node_modules/axe-core/axe.min.js";

async function loadAxe() {
  const mod = await import(/* @vite-ignore */ AXE);
  return (mod.default ?? (globalThis as unknown as { axe: never }).axe) as {
    run: (n: Element, o?: unknown) => Promise<{ violations: Array<{ id: string; impact?: string; nodes: unknown[] }> }>;
  };
}

beforeEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

/** T3.1 —— 无障碍自动扫描：两个 Tab 各扫一次，要求 0 violations */
describe("T3.1 axe-core 无障碍扫描", () => {
  it("数据源页 0 violations", async () => {
    const axe = await loadAxe();
    const { container } = render(<App />);
    const res = await axe.run(container, {
      rules: {
        // jsdom 无布局引擎，颜色对比度无法计算；该项由 T3.2 脚本单独验证
        "color-contrast": { enabled: false },
      },
    });
    if (res.violations.length) {
      console.error(JSON.stringify(res.violations.map((v) => ({ id: v.id, n: v.nodes.length })), null, 1));
    }
    expect(res.violations).toEqual([]);
  });

  it("检索服务页 0 violations", async () => {
    const axe = await loadAxe();
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: /检索/ }));
    const res = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    if (res.violations.length) {
      console.error(JSON.stringify(res.violations.map((v) => ({ id: v.id, n: v.nodes.length })), null, 1));
    }
    expect(res.violations).toEqual([]);
  });
});

/** T3.3 —— 键盘可达性（结构性检查，不依赖布局） */
describe("T3.3 键盘可达性", () => {
  it("所有交互控件都是原生可聚焦元素", () => {
    render(<App />);
    const controls = document.querySelectorAll("button, input, select, a[href]");
    expect(controls.length).toBeGreaterThan(0);
    controls.forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === "a") expect(el.getAttribute("href")).toBeTruthy();
      else expect(["button", "input", "select"]).toContain(tag);
      // 不应出现 tabindex="-1" 的永久不可达控件（roving tabindex 的 tab 除外）
      if (el.getAttribute("role") !== "tab") {
        expect(el.getAttribute("tabindex")).not.toBe("-1");
      }
    });
  });

  it("每个表单控件都有可访问名称", () => {
    render(<App />);
    const ids = [...document.querySelectorAll("input, select")].map((e) => e.id);
    expect(ids.length).toBeGreaterThan(0);
    ids.forEach((id) => {
      const label = document.querySelector(`label[for="${id}"]`);
      expect(label, `控件 #${id} 缺少 label`).toBeTruthy();
    });
  });

  it("存在跳转到主内容的 skip link", () => {
    render(<App />);
    const skip = document.querySelector("a.skip")!;
    expect(skip.getAttribute("href")).toBe("#main");
  });

  it("表格有 caption、行首 th scope=row、表头 scope=col", () => {
    render(<App />);
    expect(document.querySelector("caption")).toBeTruthy();
    expect(document.querySelector("tbody th[scope='row']")).toBeTruthy();
    [...document.querySelectorAll("thead th")].forEach((th) =>
      expect(th.getAttribute("scope")).toBe("col"),
    );
  });
});
