/** vite 配置 —— GitHub Pages 部署友好
 *
 *  base 优先级：
 *    1. 环境变量 VITE_BASE（CI 显式覆盖）
 *    2. GITHUB_REPOSITORY 自动推断（CI 注入）→ "/<repo-name>/"
 *    3. 本地 dev 默 "/"
 *
 *  这样 dev 走根路径，build 走项目页子路径，无需手动改 config。 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "";
const base =
  process.env.VITE_BASE ??
  (repoName ? `/${repoName}/` : "/");

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/unit/**/*.test.ts"],
    // 组件测试单独走 jsdom 环境（通过文件头 // @vitest-environment jsdom 覆盖）
  },
  build: {
    target: "es2020",
    // 首屏 JS gzip 预算：React 运行时 ~45KB + 业务 ~15KB
    reportCompressedSize: true,
  },
});