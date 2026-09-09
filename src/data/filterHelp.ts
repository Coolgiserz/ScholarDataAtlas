/** 筛选项帮助文案 —— 三个 Tab 全部筛选项的字段说明 + 选项白话解释。
 *
 *  设计动机（2026-09-09 用户反馈）：像「层级」里的「索引底座 / 学科底座 / OA 全文层」
 *  这类项目内部术语，用户无法理解；DOI/PDF 之外的所有筛选项都有同样问题。
 *  因此每个筛选项都配一个问号图标：悬浮 / 点击展开「字段说明 + 各选项详细说明」。
 *
 *  措辞原则：面向最终用户（研究者），不暴露后端 / 治理类术语；
 *  选项说明尽量给「这句话能帮你判断该不该勾选它」的信息，而非定义复读。 */

export interface HelpOpt {
  label: string;
  desc: string;
}

export interface FieldHelp {
  /** 字段本身的说明 */
  desc: string;
  /** 各选项的详细说明；可省略（选项自解释时） */
  options?: HelpOpt[];
}

/** 把数据推导出的取值列表与帮助文案合并成 MultiSelect 的 options。
 *  匹配规则：取值与说明条目 label 相等，或以 label 为前缀即命中——
 *  因为数据里常见「多源（2.7 亿+ 论文）」「开放网络（LLM 整合）」这类带后缀的取值。 */
export const withDesc = (vs: string[], help?: FieldHelp) =>
  vs.map((v) => {
    const o = help?.options?.find((x) => v === x.label || v.startsWith(x.label));
    return o ? { value: v, label: v, desc: o.desc } : { value: v, label: v };
  });

/* ---------- DOI / PDF 能力档位（chip label + 悬浮说明，原 FilterBar 内联文案迁入） ---------- */

export const DOI_CHIPS: Record<string, { label: string; desc: string }> = {
  "3": {
    label: "● 专用端点",
    desc: "有专门的 DOI 单查 / DOI 字段查询 endpoint（如 Crossref /works/{doi}、DataCite /dois/{doi}），可作为按 DOI 取元数据的主路径",
  },
  "2": {
    label: "◐ 支持检索",
    desc: "通过关键词检索能命中 DOI 字段，但无专门 DOI endpoint（如 OpenAlex ?filter=doi:、arXiv search_query=doi:），工程上走批量检索再过滤 DOI",
  },
  "1": {
    label: "○ 无可靠 API",
    desc: "DOI 数据存在于网页 / 抓取结果里，但无公开可靠的 API，不可工程化（如 Google Scholar 搜索结果里塞 DOI）",
  },
  "0": {
    label: "— 不支持",
    desc: "该源不暴露 DOI 字段（如部分中文期刊只给题录，无 DOI）",
  },
};
export const PDF_CHIPS: Record<string, { label: string; desc: string }> = {
  "3": {
    label: "● 全量免费",
    desc: "全部 PDF 可直接下载（OAI-PMH / 直链 / 机构订阅全打通）",
  },
  "2": {
    label: "◐ 仅 OA",
    desc: "只对 OA 子集免费（如 HAL 只对 Open 部分下 PDF，订阅部分不可得）",
  },
  "1": {
    label: "○ 仅订阅",
    desc: "仅在机构订阅 / 付费后可下 PDF，公开访问被付费墙拦截",
  },
  "0": {
    label: "— 不支持",
    desc: "该源不托管 PDF（如 Crossref 只给元数据不给全文）",
  },
};
const chips = (rec: Record<string, { label: string; desc: string }>, keys: string[]): HelpOpt[] =>
  keys.map((k) => ({ label: rec[k].label, desc: rec[k].desc }));

/* ---------- Tab 1：数据源 ---------- */

export const SRC_HELP: Record<string, FieldHelp> = {
  scen: {
    desc: "选定研究场景后，表格按该场景的权重重新计算每条数据源的适配度；学科场景还会自动隐藏明显不属于该领域的垂类源。各场景的打分依据与推荐检索式，见表格下方的「场景相关性判定说明」。",
  },
  q: {
    desc: "按名称、学科覆盖、一句话要点等文本模糊匹配，输入即过滤，无需回车。",
  },
  fR: {
    desc: "数据源主要服务的地理与语种范围。",
    options: [
      { label: "全球", desc: "覆盖全球多语种文献，无地域偏向（如 OpenAlex、Crossref）" },
      { label: "国内", desc: "以中文文献为主，主要服务国内研究者（如 CNKI、万方体系）" },
      { label: "协议", desc: "本身不是文献库，而是跨机构的数据交换标准（如 OAI-PMH）；成员馆 / 出版商按协议互连数据" },
    ],
  },
  fL: {
    desc: "按数据源在「文献检索链条」里扮演的角色分层：从给论文发身份编号，到通用索引、学科库、全文聚合，再到商业增值与中文专库。",
    options: [
      { label: "L0 标识层", desc: "只负责给论文发全球唯一编号（DOI），不存文献内容——是一切精确检索的根基（Crossref、DataCite）" },
      { label: "L1 索引底座", desc: "跨出版商收录海量论文的通用索引，检索面最广，但以题录信息为主、全文有限（OpenAlex、Semantic Scholar）" },
      { label: "L2 学科底座", desc: "深耕单个学科的权威文献库，学科内收录最全、字段最专业（PubMed 之于生物医学、arXiv 之于物理）" },
      { label: "L3 OA 全文层", desc: "聚合「开放获取」免费全文的库，帮你在付费墙之外找到可下载的 PDF（Unpaywall、CORE）" },
      { label: "L4 商业增强", desc: "付费商业产品，在索引之上叠加引文分析、期刊评价等增值功能（Scopus、Web of Science）" },
      { label: "L5 中文专层", desc: "以中文学术文献为主的数据库（CNKI、万方、维普）" },
    ],
  },
  fC: {
    desc: "使用该数据源需要跨过的付费门槛。",
    options: [
      { label: "免费", desc: "检索与数据获取都不花钱，部分接口有调用次数限制" },
      { label: "Freemium", desc: "基础功能免费，高级功能或大批量访问需付费" },
      { label: "机构订阅", desc: "需学校 / 机构统一购买后才能用，个人无法单独开通（如 Web of Science）" },
      { label: "商业授权", desc: "面向企业或商用场景，需商务洽谈签订授权协议" },
    ],
  },
  fA: {
    desc: "能否用程序批量获取数据，以及开通门槛——直接决定能否自动化接入。",
    options: [
      { label: "免 key", desc: "无需注册账号，直接调用公开接口，适合快速上手和脚本化" },
      { label: "需 key", desc: "免费注册后拿到密钥（API key）即可调用" },
      { label: "申请制", desc: "需提交申请说明用途，审核通过后开通，常有审核周期和用量评估" },
      { label: "机构 IP", desc: "仅机构内网可以调用，个人在外网用不了" },
      { label: "无 API", desc: "没有程序接口，只能网页查询、手动导出" },
    ],
  },
  fF: {
    desc: "由当前场景加权打分（满分 10 分）自动算出的三档结论，随场景切换而变化；逐项得分明细见表格行内展开。",
    options: [
      { label: "High", desc: "综合得分 ≥ 7.5，当前场景下优先考虑" },
      { label: "Medium", desc: "得分 5 ~ 7.5，可用但有明显短板" },
      { label: "Low", desc: "得分 < 5，当前场景下不建议" },
    ],
  },
  fD: {
    desc: "能否按 DOI 精确锁定一篇文献。DOI 是论文的全球唯一编号，按 DOI 查询 = 精准定位，适合引文核对与批量补全元数据。",
    options: chips(DOI_CHIPS, ["3", "2", "1", "0"]),
  },
  fP: {
    desc: "能否直接拿到 PDF 全文，以及免费获取的范围。",
    options: chips(PDF_CHIPS, ["3", "2", "1", "0"]),
  },
};

/* ---------- Tab 2：检索 / 查询服务 ---------- */

const M_OPT: HelpOpt[] = [
  { label: "活跃", desc: "近期持续更新，问题反馈正常响应，可放心用于生产" },
  { label: "低频", desc: "仍在维护但更新慢（数月一次），出问题修复周期长" },
  { label: "停更", desc: "已停止维护，上游数据源改版后可能悄悄失效，用前先验证" },
  { label: "归档", desc: "仓库已归档只读，仅作历史参考，不建议新项目采用" },
];

export const SVC_HELP: Record<string, FieldHelp> = {
  q: {
    desc: "按服务名、覆盖的数据源、适用场景等文本模糊匹配。",
  },
  sT: {
    desc: "服务的形态：是代码库、程序接口，还是开箱即用的成品。",
    options: [
      { label: "开源SDK", desc: "开源代码库 / 软件包，自己部署或本地调用（如 habanero）" },
      { label: "官方API", desc: "数据源官方提供的接口，最权威、与官方数据同步" },
      { label: "开放API", desc: "第三方封装的公开接口，无需与官方签约即可使用" },
      { label: "AI产品", desc: "面向最终用户的 AI 检索 / 问答产品（如 Elicit、Consensus），开箱即用" },
      { label: "爬取服务", desc: "通过爬虫抓取数据的工具，注意目标网站的使用条款与封禁风险" },
    ],
  },
  sLang: {
    desc: "客户端代码库 / 接口的主要编程语言，选与你技术栈匹配的。",
    options: [
      { label: "多语言/HTTP", desc: "提供多种语言的绑定，或纯 HTTP 接口、任何语言都能调" },
      { label: "HTTP/JSON", desc: "纯 HTTP 接口返回 JSON，不绑定特定编程语言" },
    ],
  },
  sSub: {
    desc: "使用前提是否依赖机构已购买的数据库订阅。",
    options: [
      { label: "是", desc: "该服务建立在机构订阅的数据源之上——机构没买就用不了" },
      { label: "否", desc: "个人可直接使用（免费或个人付费即可）" },
    ],
  },
  sM: {
    desc: "项目的维护活跃度，直接关系到「上游数据源改版后还能不能用」。",
    options: M_OPT,
  },
  sSrc: {
    desc: "该服务能查询的底层数据源。写「多源」表示同时聚合多个库；写单个名称表示只对接该库。",
    options: [
      { label: "多源", desc: "同时聚合多个数据源，一次查询跨库覆盖" },
      { label: "PubMed", desc: "美国国立医学图书馆的生物医学文献库" },
      { label: "Crossref", desc: "全球最大的 DOI 注册机构，覆盖各出版商的论文元数据" },
      { label: "OpenAlex", desc: "开源的全球论文索引（2.5 亿+），替代旧版 Microsoft Academic" },
      { label: "Google Scholar", desc: "谷歌学术搜索，覆盖面广但无官方接口（多为爬取方案）" },
      { label: "Semantic Scholar", desc: "Allen AI 的论文索引，带 AI 摘要与引文字段" },
    ],
  },
};

/* ---------- Tab 3：开放网络 / 通用检索（非学术） ---------- */

export const WB_HELP: Record<string, FieldHelp> = {
  q: {
    desc: "按 API 名称、用途、数据覆盖等文本模糊匹配。",
  },
  wT: {
    desc: "服务的形态：代码库、程序接口，还是开箱即用的成品。",
    options: [
      { label: "官方API", desc: "服务商官方提供的接口" },
      { label: "开放API", desc: "公开注册即可使用的接口" },
      { label: "AI产品", desc: "面向最终用户的 AI 搜索 / 问答产品，开箱即用" },
    ],
  },
  wM: {
    desc: "项目的维护活跃度。",
    options: M_OPT,
  },
  wSrc: {
    desc: "该 API 的数据来自哪里、覆盖什么范围。",
    options: [
      { label: "开放网络", desc: "抓取 / 整合公开网页内容，部分产品针对 LLM 场景做了优化" },
      { label: "Google SERP", desc: "返回 Google 搜索结果的结构化 JSON（标题 / 链接 / 摘要）" },
      { label: "自建索引", desc: "服务商自己爬取并维护的网页索引库" },
    ],
  },
};
