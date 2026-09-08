# 本轮交付概览

## ✅ 已完成

### 1. 多选筛选（互斥性分析 + 双端实现）
**互斥性结论**：只有「场景」是真正互斥（一次只按一套权重打分），保持单选下拉；其余 11 个取值型筛选项（区域/层级/收费/API/DOI/PDF/适配度、类型/语言/需订阅/维护状态/覆盖数据源）都是「属于这些取值之一」的语义，**全部改为多选**。

- 组内取并集（OR），跨维度取交集（AND）；空数组 = 不限
- 新建 `MultiSelect.tsx`：切换 chip 组，`aria-pressed` + `role=group`，选项 >6 收进 `<details>`
- URL 用逗号序列化（`?sLang=Python,R`），**兼容老的单值链接**
- 标签带已选计数徽标 + 一键清空

### 2. 「页面下拉后有大量空白」—— 根因修复
**根因**（Playwright 实测 + 二分定位）：每一行数据源名称里的 `<span class="sr-only">（在新窗口打开）</span>` 是 `position:absolute`，而它的所有祖先都是 `static` → 包含块变成**初始包含块（即整个文档）**。于是第 73 行那个 1×1px 的 span 的静态位置落在 y≈5900，把文档滚动区撑到 5997px。

**修复**：`.tblbox` 与 `table` 加 `position:relative`，把绝对定位后代限制在本盒内。

**效果**：1728×1117 视口下文档高 5997 → **1341**，可滚距离 4880 → **224**；滚到底看到的是真实内容而非空白。

### 3. 顺带挖出的既有 bug（与本次改动无关，本来就一直存在）
`restoreUrl()` 里 `[].slice.call(p.keys())` 恒返回 `[]`（`URLSearchParams.keys()` 是迭代器，没有 `length`，`slice` 取不到元素）→ **分享链接里的筛选条件从来没被恢复过**。改为 `[...p.keys()]`。

### 4. GitHub 项目地址真实性核查（你报的 habanero 404 引发）
全量核查 73 个服务 + 73 个数据源的链接，**修正 9 个失效地址**：

| 项目 | 原（404） | 已改为 | star |
|---|---|---|---|
| habanero | github.com/CrossRef/habanero | github.com/**sckott**/habanero | 251 |
| unpywall | github.com/ropensci/unpywall | github.com/**unpywall**/unpywall | 35 |
| pygetpapers | github.com/ContentMine/pygetpapers | github.com/**petermr**/pygetpapers | 92 |
| zenodo-client | github.com/mbdevpl/zenodo-client | github.com/**cthoyt**/zenodo-client | 46 |
| datacite (pyDatacite) | github.com/inveniosoftware/pydatacite | github.com/inveniosoftware/**datacite** | 34 |
| pubmedpy | github.com/greenelab/pubmedpy | github.com/**dhimmel**/pubmedpy | 11 |
| pyscopus | github.com/titipata/pyscopus | github.com/**zhiyzuo**/python-scopus | 25 |
| Colrev | colrev.readthedocs.io | **colrev-environment.github.io/colrev** | — |
| Semantic Scholar Datasets | semanticscholar.org/product/datasets | **api.semanticscholar.org/corpus** | — |

另：GROBID 两个仓库组织改名 `kermitt2` → `grobidOrg`（旧址仍 301，已统一为 canonical）。

**验证方法论**：GitHub API 确认 404 后，用 **PyPI JSON API 的 `project_urls`** 作为权威仓库来源（比 GitHub 模糊搜索可靠），再回 GitHub API 验证存在性 + 取 star。

### 5. 服务表新增「Star」列
37 个 GitHub 开源项目补上 star 数（2026-09-08 实测），可排序（按数值而非字符串）。导出 Excel/CSV 也含此列。Top：paper-qa 9173、GROBID 5119、scholarly 1880、arxiv 1543、pyzotero 1408。

## 🧪 验证结果
- 单元 + 组件 + a11y：**171 passed / 1 skipped**（含多选 OR 语义、URL 序列化、老链接兼容、计数徽标、清空）
- xlsx 黄金基线随导出结构变更重生成（固定时间戳 `2026-09-08 12:00`，避免时间戳污染）
- Playwright 实测：数据源页 73 行 / 服务页 73 行 / Star 列渲染 37 个 / 无 JS 报错

## ⚠️ 遗留
- `tsc --noEmit` 有一批**既有**类型错误（缺 `@types/node`、`Uint8Array<ArrayBuffer>` 泛型、未使用的 `toggleSort`），不影响 vitest，但会挡 `npm run build`
- 数据源表中 11 个非 GitHub 链接在沙箱内 HTTP 0（网络被拦），**并非失效**，需换网络复核
