/** 领域模型定义 —— 与单文件版 v1.3.2 字段一一对应 */

/** 数据源（85 条 = 73 原有 + 12 领域垂直学术源，2026-09-09 补录） */
export interface Source {
  /** 名称 */
  n: string;
  /** 官网 URL，找不到则为空串 */
  u?: string;
  /** 类型，如「DOI 注册机构 / 索引」 */
  t: string;
  /** 区域：全球 / 国内 */
  r: string;
  /** 分层：L0 标识层 … L5 中文专层 */
  l: string;
  /** 规模描述 */
  scale: string;
  /** 收费：免费 / Freemium / 机构订阅 / 商业授权 */
  cost: string;
  /** API：免 key / 需 key / 申请制 / 机构 IP / 无 API */
  api: string;
  /** API 覆盖范围（文献类型 / 学科期刊 / 回溯 / 字段深度 / 配额） */
  as?: string;
  /** DOI 能力 3/2/1 */
  doi: number;
  /** PDF 能力 3/2/1/0 */
  pdf: number;
  /** 学科覆盖 */
  sb: string;
  /** 地域 / 语种 */
  ge: string;
  /** 通用场景下的原始档位（仅通用场景人工修正时使用） */
  fit?: string;
  /** 仅通用场景：人工修正理由 */
  fr?: string;
  /** 一句话要点 */
  nt: string;
}

/** 检索 / 查询服务（73 条） */
export interface Service {
  n: string;
  u?: string;
  /** GitHub star 数（仅开源仓库项目有；非 GitHub 服务为空）。2026-09-08 实测 */
  st?: string;
  /** 类型：开源SDK / 官方API / 开放API / AI产品 / 爬取服务 */
  ty: string;
  /** 语言 */
  lang: string;
  /** 覆盖数据源 */
  src: string;
  cost: string;
  /** 是否需机构订阅：'1' / '0' */
  sub: string;
  /** 维护状态：活跃 / 低频 / 停更 / 归档 */
  m: string;
  /** 最适合场景 */
  sc: string;
  nt: string;
}

/** 场景相关性关键词三档 */
export interface Rel {
  hi1?: string[];
  hi2?: string[];
  lo?: string[];
}

/** 场景权重，键为维度名，值为满分 */
export type Weights = Record<string, number>;

/** 选型场景（10 个） */
export interface Scenario {
  id: string;
  n: string;
  /** 分组：目标 / 学科 */
  g: string;
  w: Weights;
  /** 场景说明（含 HTML 片段） */
  d: string;
  /** 打分规则说明（含 HTML 片段） */
  rd?: string;
  /** 学科场景才有：相关性关键词 */
  rel?: Rel;
  /** 推荐检索式 */
  q?: string[];
}

/** 适配度计算结果 */
export interface FitResult {
  /** 机械分（未截断前，实际已 ≤10） */
  m: number;
  /** 最终分值（可能经人工修正） */
  total: number;
  /** 档位 */
  lab: "High" | "Medium" | "Low";
  /** 逐项得分明细 */
  P: Array<{ label: string; max: number; v: number }>;
  /** 是否被人工修正 */
  adj: { from: number; to: number; lab: string; why: string } | null;
  /** 场景相关性命中依据（仅学科型场景有值），界面用来回答「为什么是这个分」 */
  rel: {
    v: number;
    label: string;
    kw: string[];
    field: string;
    note?: string;
  } | null;
  sc: Scenario;
}

/** 数据源筛选条件 */
/** 筛选值一律用数组：空数组 / undefined 均表示「不限」。
 *  逐项互斥性分析见 migration/01_测试设计文档.md——只有「场景」是真正互斥的（一次只按一套权重打分）；
 *  区域 / 层级 / 收费 / API / DOI / PDF / 适配度 都是「属于这些取值之一」的语义，可多选。
 *
 *  设计变更（2026-09-09）：「只看场景相关」开关移除——选场景就默认走相关性过滤，
 *  隐藏他领域垂类是隐含的语义而非可选选项；保留开关会让人怀疑「选场景真的有用吗」。 */
export interface SourceFilters {
  q?: string;
  fR?: string[];
  fL?: string[];
  fC?: string[];
  fA?: string[];
  fD?: string[];
  fP?: string[];
  fF?: string[];
  /** 场景 id */
  scen: string;
}

/** 服务筛选条件 */
export interface ServiceFilters {
  q?: string;
  sT?: string[];
  sLang?: string[];
  /** 二值项：是 / 否，天然互斥，但为统一仍用数组（最多 1 项） */
  sSub?: string[];
  sM?: string[];
  sSrc?: string[];
}

/** 开放网络 / 通用检索（非学术）API（7 条，与学术库刻意隔离） */
export interface Websearch {
  /** 名称 */
  n: string;
  /** 官网 URL */
  u?: string;
  /** GitHub star（仅开源 SDK 才有） */
  st?: string;
  /** 类型：官方API / 开放API / AI产品 */
  ty: string;
  /** 数据覆盖：开放网络 / Google SERP / 自有索引 等 */
  src: string;
  /** 详细定价（含免费额度 + 单价） */
  pricing: string;
  /** 速率限制 */
  quota: string;
  /** 维护状态 */
  m: string;
  /** 最适合场景 */
  sc: string;
  /** 备注与坑点 */
  nt: string;
}

/** 开放网络 / 通用检索（非学术）筛选条件 */
export interface WebsearchFilters {
  q?: string;
  wT?: string[];   // 类型
  wM?: string[];   // 维护状态
  wSrc?: string[]; // 数据覆盖
}

/** 导出工作表：rows[0] 为表头 */
export interface Sheet {
  name: string;
  titles: Array<{ w: number }>;
  rows: Array<Array<string | number>>;
}
