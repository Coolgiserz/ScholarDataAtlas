/** 测试专用配置：与 vite.config.ts 分离，避免单元测试加载 React 插件。
 *  刻意不使用 import { defineConfig } —— 保持零导入，避免依赖解析问题。
 *
 *  ⚠️ resolve.alias 仅为绕过本机沙箱限制（无法把依赖装进项目 node_modules）。
 *     正式环境执行 npm install 后不需要这些别名，可整段删除。 */
const M = "/Users/tarnished/.workbuddy/binaries/node/workspace/node_modules";

export default {
  resolve: {
    alias: [
      { find: /^react$/, replacement: M + "/react" },
      { find: /^react\/jsx-runtime$/, replacement: M + "/react/jsx-runtime" },
      { find: /^react\/jsx-dev-runtime$/, replacement: M + "/react/jsx-dev-runtime" },
      { find: /^react-dom$/, replacement: M + "/react-dom" },
      { find: /^react-dom\/client$/, replacement: M + "/react-dom/client" },
      { find: /^react-dom\/test-utils$/, replacement: M + "/react-dom/test-utils" },
      { find: /^@testing-library\/react$/, replacement: M + "/@testing-library/react" },
      { find: /^@testing-library\/jest-dom$/, replacement: M + "/@testing-library/jest-dom" },
      { find: /^@testing-library\/user-event$/, replacement: M + "/@testing-library/user-event" },
      { find: /^axe-core$/, replacement: M + "/axe-core" },
    ],
  },
  test: {
    environment: "node",
    globals: true,
    include: [
      "tests/unit/**/*.test.ts",
      "tests/component/**/*.test.tsx",
      "tests/a11y/**/*.test.tsx",
    ],
    // axe-core 在 jsdom 下解析 CSS 较慢，放宽单测超时
    testTimeout: 30000,
    hookTimeout: 30000,
  },
};
