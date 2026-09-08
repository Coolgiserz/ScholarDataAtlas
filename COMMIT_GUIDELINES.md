# Commit 规范

本项目用 [Release Please](https://github.com/googleapis/release-please) 自动生成 CHANGELOG 和版本号。
Release Please 通过解析 commit 标题来识别变更类型，**遵循 Conventional Commits 规范**才能生效。

## 📋 提交模板

```
<type>(<scope>): <subject>

<body>

<footer>
```

## 🏷️ type 含义（决定版本怎么 bump）

| type | 含义 | 版本变化 | 示例 |
|---|---|---|---|
| `feat:` | 新功能 | minor bump（2.0.0 → 2.1.0） | `feat: add web search tab` |
| `fix:` | bug 修复 | patch bump（2.0.0 → 2.0.1） | `fix: restore URL not always returning` |
| `feat!:` / `fix!:` | 破坏性变更 | major bump（2.0.0 → 3.0.0） | `feat!: drop Perplexity from services` |
| `perf:` | 性能优化 | patch bump | `perf: cache openalex filter` |
| `refactor:` | 重构（无功能变化） | 不发布 | `refactor: extract filter logic` |
| `docs:` | 文档 | 不发布 | `docs: add README badges` |
| `test:` | 测试 | 不发布 | `test: add websearch filter cases` |
| `build:` | 构建系统 | 不发布 | `build: switch to vite 5.4` |
| `ci:` | CI/CD | 不发布 | `ci: add release-please workflow` |
| `chore:` | 杂项 | 不发布 | `chore: bump deps` |
| `style:` | 代码格式 | 不发布 | `style: format with prettier` |

## 📦 scope（可选但推荐）

表示改动的范围：
- `src` — 业务代码
- `tests` — 测试
- `workflows` — GitHub Actions
- `deps` — 依赖
- `data` — 数据文件
- `types` — TypeScript 类型
- `core` — 核心层

## 💡 实战示例

```bash
# 新功能
git commit -m "feat(src): add Websearch tab with 7 open web APIs"
git commit -m "feat(data): update services with 2026-09 star counts"

# bug 修复
git commit -m "fix(src): restore URL state on first load"
git commit -m "fix(tests): flush xlsx golden bytes after sheet change"

# 破坏性变更（major bump）
git commit -m "feat!: drop Perplexity from services table"

# 不发布
git commit -m "refactor(core): extract anyOf helper"
git commit -m "docs: add CHANGELOG.md"
git commit -m "test: add DOI/PDF filter cases"
git commit -m "ci: add github pages deploy"
```

## 🔄 Release Please 行为

1. **push 到 main** → Release Please 自动扫描 commit
2. 识别到 `feat:` / `fix:` / `feat!:` → 自动开 PR：
   - bump `package.json` 的 version
   - 更新 `release-please-manifest.json`
   - 生成 `CHANGELOG.md`
3. **合并该 PR** → 自动打 tag（如 `v2.1.0`）+ 自动创建 GitHub Release
4. 合并后 → GitHub Pages 部署 workflow 触发，发布新版本到 Pages

## ⚠️ 注意事项

- **不写 type 的 commit**（如 `git commit -m "update README"`）→ Release Please 不会收录进 CHANGELOG，但也不会报错
- 合并 release-please PR 时**不要 squash**（要保留原始 commit 信息让 changelog 完整）
- 第一次跑前，`.github/release-please-manifest.json` 已写 `".": "2.0.0"` 作为起点
