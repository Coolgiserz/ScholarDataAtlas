/** 开放网络 / 通用检索（非学术）—— 7 条 web 检索 API
 *
 *  立意区分：本表收录「通用 web 检索」类 API，与 SERVICES（学术/半学术）表刻意分栏，
 *  避免用户在选型时把开放网络混入学术库决策。学术研究应优先走 SOURCES/SERVICES 表。
 *  本表条目主要适用于「跨域事实检索 / AI Agent 联网 / RAG 实时数据」类需求。
 *
 *  数据核查日期：2026-09-08（与 SERVICES 同批次）
 */

export interface Websearch {
  /** 名称 */
  n: string;
  /** 官网 URL */
  u?: string;
  /** GitHub star（开源 SDK 才有） */
  st?: string;
  /** 类型：官方API / 开放API / AI产品 */
  ty: string;
  /** 数据覆盖：开放网络 / Google SERP / 自建索引 / 神经搜索 */
  src: string;
  /** 详细定价（含免费额度 + 单价） */
  pricing: string;
  /** 速率限制 */
  quota: string;
  /** 维护状态：活跃 / 低频 */
  m: string;
  /** 最适合场景 */
  sc: string;
  /** 备注与坑点 */
  nt: string;
}

/** 7 个开放网络/通用 web 检索 API */
export const WEBSEARCHES: Websearch[] = [
  {
    n: "Perplexity Sonar API",
    u: "https://www.perplexity.ai",
    ty: "AI产品",
    src: "开放网络（LLM 整合）",
    pricing: "Search API $5/千次；Sonar $1/M in + $1/M out；Sonar Pro $3/M in + $15/M out",
    quota: "50 req/s（团队档）",
    m: "活跃",
    sc: "跨域事实检索 + LLM 摘要",
    nt: "search 模式返回原始链接；sonar 模式直接返回 LLM 摘要+引用。学术场景不推荐：底层是开放网络不是学术库，引用质量不可控（移到本表）",
  },
  {
    n: "Tavily",
    u: "https://tavily.com",
    ty: "开放API",
    src: "开放网络（针对 LLM 优化）",
    pricing: "免费 1,000 credits/月；Standard $0.008/credit（$30/5K credits 起）",
    quota: "100 RPM",
    m: "活跃",
    sc: "AI Agent 实时联网检索 + RAG",
    nt: "默认返回清洗过的正文 + 5–10 个 source；advanced search 深度模式额外收费；专为 LLM 工作流设计（直接给可读文本而非 SERP HTML）",
  },
  {
    n: "Brave Search API",
    u: "https://brave.com/search/api",
    ty: "官方API",
    src: "自建索引 + 开放网络",
    pricing: "免费 2,000 queries/月（1 qps）；Data for Search $5/CPM；Pro AI $9/CPM",
    quota: "1 qps 免费 / 20+ qps 付费",
    m: "活跃",
    sc: "隐私友好型 web 检索 / 高量抓取",
    nt: "自建索引（非 Google/Bing 转发），数据干净；学术场景适用性中等（通用 web 而非学术库）；无中文针对性优化",
  },
  {
    n: "Exa",
    u: "https://exa.ai",
    ty: "AI产品",
    src: "神经/语义搜索（开放网络）",
    pricing: "免费 1,000 次/月；$5/1K 次起；新试用 $10 credit",
    quota: "50 RPM",
    m: "活跃",
    sc: "语义相似度搜索（找含义相似的网页）",
    nt: "支持 natural language query 而非关键词；提供 highlights + summary；可按 category/domain 过滤；2024 由 Metaphor 更名",
  },
  {
    n: "Serper",
    u: "https://serper.dev",
    ty: "开放API",
    src: "Google SERP（结构化 JSON）",
    pricing: "免费 2,500 次；$1/1K；$50/50K；$500/500K",
    quota: "100 RPM",
    m: "活跃",
    sc: "高量 Google SERP 抓取（结构化 JSON）",
    nt: "单条最便宜的 Google SERP；违反 Google ToS；不支持 Google Scholar（仅通用 web）；字段最全（含 knowledge graph / PAA / related）",
  },
  {
    n: "SerpAPI",
    u: "https://serpapi.com",
    ty: "开放API",
    src: "Google SERP（含 Scholar/News/Shopping）",
    pricing: "免费 250 次/月；Developer $75/月（5K）；Production $150/月（15K）；Big Data $250/月（30K）；Enterprise $5K+/年",
    quota: "按订阅档位",
    m: "活跃",
    sc: "字段最全的 SERP 抓取（含 Scholar）",
    nt: "违反 Google ToS；数据处于灰色地带；不要作为商业产品唯一数据源；唯一支持 Google Scholar SERP 抓取的成熟方案",
  },
  {
    n: "Linkup",
    u: "https://linkup.so",
    ty: "AI产品",
    src: "开放网络（欧洲）",
    pricing: "免费 1,000 calls/月；Standard €5/1K calls；Deep €10/1K",
    quota: "60 RPM",
    m: "活跃",
    sc: "合规性强的 web 检索 + 实时数据",
    nt: "GDPR / EU AI Act 合规；返回 source + content 配对；适合欧洲/合规场景；2025 新晋，公司位于巴黎",
  },
];