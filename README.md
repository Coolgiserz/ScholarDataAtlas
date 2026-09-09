# ScholarDataAtlas

学术数据源导览 —— 85 个学术数据源 + 73 个检索 / 查询服务 + 7 个开放网络检索 API。

**数据周期**：2026-09-08 核查

[![CI](https://github.com/Coolgiserz/ScholarDataAtlas/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Coolgiserz/ScholarDataAtlas/actions/workflows/deploy-pages.yml)
[![Release](https://github.com/Coolgiserz/ScholarDataAtlas/actions/workflows/release-please.yml/badge.svg)](https://github.com/Coolgiserz/ScholarDataAtlas/actions/workflows/release-please.yml)

## ✨ 特性

- 三个 Tab：数据源（85）/ 检索服务（73）/ 开放网络（非学术，7）
- 多选 chip 筛选（区域 / 层级 / 收费 / API / DOI / PDF / 适配度 / 维护状态 / 数据覆盖 / 机构订阅）
- 场景加权打分（10 个选型场景，含 7 个学科场景）
- 导出 Excel（4 sheet）+ CSV，xlsx 字节级可复现
- URL 状态同步、可分享深链接
- 键盘可达、读屏友好（WCAG APG 模式）
- 零运行时依赖：vite + React 18 + TypeScript + 0 个 UI 库

## 🚀 在线访问

- GitHub Pages：https://weirdgiser.site/ScholarDataAtlas/

## 💻 本地开发

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc + vite build → dist/
npm run test         # vitest 全量
```

## 📦 版本与 Changelog

用 [Release Please](https://github.com/googleapis/release-please) 自动管理。
push 到 `main` 时，根据 commit 标题自动开 PR → 合并后自动 bump 版本 + 生成 CHANGELOG + 打 tag。

提交规范见 [COMMIT_GUIDELINES.md](./COMMIT_GUIDELINES.md)。

## 🏗️ 技术栈

| 类别 | 选型 |
|---|---|
| 框架 | React 18 + TypeScript 5 |
| 构建 | Vite 8（兼容 vite 5/6/7/8） |
| 测试 | Vitest 5 + @testing-library/react |
| CI/CD | GitHub Actions + Release Please |
| 部署 | GitHub Pages |
| 数据 | 内置 JSON（73 源 + 73 服务 + 7 websearch），运行时无后端 |

## 📁 目录结构

```
app/
├── src/
│   ├── App.tsx                # 应用主组件 + 三个 Tab
│   ├── main.tsx               # React 入口
│   ├── types.ts               # 领域模型
│   ├── columns.tsx            # 表格列定义（数据源 / 服务 / websearch）
│   ├── styles.css
│   ├── components/            # Tabs / DataTable / FilterBar / MultiSelect
│   ├── core/                  # 纯函数业务逻辑
│   │   ├── filter.ts          # 筛选
│   │   ├── fit.ts             # 场景打分
│   │   ├── sort.ts            # 排序
│   │   ├── describe.ts        # 筛选条件 → 人类可读
│   │   ├── urlState.ts        # URL 状态序列化
│   │   ├── rows.ts            # 导出数据集组装
│   │   ├── link.ts            # 跨表关联
│   │   └── export/            # xlsx / csv 零依赖生成
│   └── data/                  # 静态数据（sources / services / websearch / scenarios）
├── tests/
│   ├── unit/                  # 单元测试（filter / fit / sort / export / rel / link / xlsx 基线）
│   ├── component/             # 组件测试（App / DataTable / Tabs / FilterBar）
│   └── a11y/                  # 无障碍测试
├── fixtures/
│   └── golden-*.json          # 测试黄金基线
├── .github/
│   ├── release-please-config.json
│   ├── release-please-manifest.json
│   └── workflows/
│       ├── release-please.yml
│       └── deploy-pages.yml
└── COMMIT_GUIDELINES.md
```

## 📄 许可

MIT
