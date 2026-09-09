import type { Source } from "../../types";

/** 领域垂直学术出版社 / 学会数据库（12 条，2026-09-09 联网核实补录）
 *
 *  补录目的：原 73 条数据无任何"领域垂直学术出版社 / 学会"，导致 chip / opt / nev
 *  三个学科场景的"强相关"档都只有 3 条，且全部靠 hi1 里的"专利"一词命中。
 *  真正的领域学术出版社（SPIE / Optica / ECS / IOPscience 等）完全缺失。
 *
 *  字段约定：
 *  - 全部为「学术论文数据库」（期刊 / 会议录 / 预印本），**不含**行业 / 金融 / 政策数据
 *  - `t` 复用自由文本：学术出版社 / 学会出版社 / 中文期刊 / 学术期刊
 *  - `l` 全部归为 L4 商业增强（与现有商业数据库同层）
 *  - `sb` 必须包含对应场景的 hi1 关键词，否则 relCalc 仍会落到 0.45 综合档或 0.3 兜底
 *  - `doi/pdf` 按真实可获取性
 *
 *  ⚠️ 警告：修改本文件后必须重跑 `REGEN=1 tests/unit/_regen-fixtures.test.ts` 重算 fit+filter 基线，
 *  以及 `REGEN=1 tests/unit/regen-golden.test.ts` 重算 xlsx 基线。
 *
 *  📝 与 2026-09-08 误版的差异：前一版混入 BNEF / Wood Mac / IEA / IRENA / CPIA / SNE Research 等
 *  行业 / 投行 / 政策数据，与"学术论文数据源"项目定位不符，已撤回重做。
 */

/* ---- 新能源 / 电池 / 储能（4 条）---- */

/** 1. ECS（电化学学会）：电池 / 燃料电池 / 腐蚀 / 电沉积领域最古老的学术期刊（1902 起） */
const ECS: Source = {
  n: "ECS（电化学学会）",
  u: "https://iopscience.iop.org/journal/1945-7111",
  t: "学会出版社",
  r: "全球",
  l: "L4 商业增强",
  scale: "8+ 期刊 JES / ECS J. Solid State Sci. Technol. / J. Power Sources / Electrochim. Acta 等；累计 100,000+ 论文（自 1902）",
  cost: "机构订阅",
  api: "机构 IP",
  as: "Journal of The Electrochemical Society (JES, 1902 起) + ECS Journal of Solid-State Science and Technology + ECS Electrochemistry Letters + Journal of Power Sources + Electrochimica Acta · 电池 / 燃料电池 / 腐蚀 / 电沉积 / 电镀 · 自 2023 起改由 IOP Publishing 出版 · IOP 平台机构 IP · 2020 起全部回溯 OA",
  doi: 3,
  pdf: 2,
  sb: "电化学 / 电池 / 储能 / 能源",
  ge: "全球 / 英文",
  fit: "High",
  fr: "电池 / 电化学领域最古老旗舰刊（1902 起）；IOP 平台后机构订阅仍不可替代",
  nt: "电化学学会旗舰，JES 自 1902 起刊；电池 / 燃料电池 / 腐蚀领域必读；2023 起改由 IOP 出版但仍是 ECS 旗下；本条为补录（2026-09-09）",
};

/** 2. IOPscience（英国物理学会）：30+ 期刊，物理 / 能源 / 材料 / 半导体 */
const IOPscience:Source = {
  n: "IOPscience（英国物理学会）",
  u: "https://iopscience.iop.org",
  t: "学会出版社",
  r: "全球",
  l: "L4 商业增强",
  scale: "30+ 期刊；含 J. Phys. Energy / J. Phys. D / Semiconductor Sci. Technol. / J. Phys. Condens. Matter 等",
  cost: "机构订阅",
  api: "机构 IP",
  as: "30+ 期刊 + 会议录 · J. Phys. Energy（2019 起）/ J. Phys. D: Applied Physics / Semiconductor Science and Technology / J. Phys.: Condensed Matter / J. Phys.: Materials · IOP Platform 机构 IP · 自 2020 起部分期刊支持 OA · 物理 / 材料 / 能源 / 半导体",
  doi: 3,
  pdf: 2,
  sb: "物理 / 能源 / 材料 / 半导体",
  ge: "全球 / 英文",
  fit: "High",
  fr: "J. Phys. Energy（能源旗舰刊）+ Semiconductor Sci. Technol.（半导体物理）是新能源 / 芯片场景的核心学术源",
  nt: "英国物理学会旗舰；J. Phys. Energy 是新能源物理核心刊；Semiconductor Sci. Technol. 是半导体物理必读；本条为补录（2026-09-09）",
};

/** 3. 储能科学与技术：中文储能领域旗舰 */
const CHINESE_ENERGY_STORAGE:Source = {
  n: "储能科学与技术",
  u: "https://www.energystoragejournals.com",
  t: "中文期刊",
  r: "国内",
  l: "L4 商业增强",
  scale: "中文储能旗舰，月刊；累计 1,000+ 篇（2026-09）",
  cost: "机构订阅",
  api: "申请制",
  as: "中文储能旗舰 · 月刊 · 储能电池 / 储能系统 / 储能材料 / 储能政策 · 中国化工学会储能工程分会 + 化学工业出版社主办 · 需申请订阅 · 综述与研究文章占比均衡",
  doi: 3,
  pdf: 2,
  sb: "储能 / 电池 / 能源",
  ge: "中国大陆",
  fit: "High",
  fr: "中文储能领域唯一旗舰；中文场景新能源 / 电池储能不可替代",
  nt: "中文储能领域唯一旗舰；中国化工学会储能工程分会 + 化学工业出版社主办；本条为补录（2026-09-09）",
};

/** 4. 电源技术：中国电源学会主办 */
const CHINESE_POWER_TECH:Source = {
  n: "电源技术",
  u: "https://www.cjpstjournal.com",
  t: "中文期刊",
  r: "国内",
  l: "L4 商业增强",
  scale: "中国电源学会主办，月刊；累计 10,000+ 篇",
  cost: "机构订阅",
  api: "无 API",
  as: "中国电源学会主办 · 月刊 · 电源 / 电池 / 储能 / 燃料电池 · 化学与物理电源综合 · 含综述 / 研究 / 工程报告 · 订阅制 · 无公开 API",
  doi: 3,
  pdf: 2,
  sb: "电池 / 储能 / 能源 / 电源",
  ge: "中国大陆",
  fit: "Medium",
  fr: "中文电源领域核心刊；与储能科学与技术互补（电源偏工程，储能偏材料）",
  nt: "中国电源学会主办；电源 / 电池 / 储能中文综合刊；本条为补录（2026-09-09）",
};

/* ---- 光电 / 光学 / 激光（4 条）---- */

/** 5. SPIE Digital Library：7000+ 卷光学会议录 + 8 期刊，最大光学出版社 */
const SPIE:Source = {
  n: "SPIE Digital Library",
  u: "https://www.spiedigitallibrary.org",
  t: "学会出版社",
  r: "全球",
  l: "L4 商业增强",
  scale: "7000+ 卷会议录（1962 至今）+ 8 种期刊；累计 500,000+ 论文",
  cost: "机构订阅",
  api: "机构 IP",
  as: "SPIE Conference Proceedings 7000+ 卷（1962 至今）+ 8 种期刊（Optical Engineering / J. Electronic Imaging / J. Biomedical Optics 等）· 机构 IP 访问 · 光学 / 光子学 / 激光 / 光电子 / 红外 / 成像 / 生物医学光学全覆盖",
  doi: 3,
  pdf: 2,
  sb: "光学 / 光子学 / 激光 / 光电子 / 光纤 / 红外 / 光谱 / 成像",
  ge: "全球 / 英文",
  fit: "High",
  fr: "光学领域最大出版社；会议录 7000+ 卷是会议论文的金标准",
  nt: "国际光学工程学会（SPIE）旗舰；会议录 7000+ 卷自 1962 起；与 Optica 双寡头；本条为补录（2026-09-09）",
};

/** 6. OSA / Optica Publishing Group：17 期刊 + 470+ 会议 */
const OPTICA:Source = {
  n: "OSA / Optica Publishing Group",
  u: "https://opg.optica.org",
  t: "学会出版社",
  r: "全球",
  l: "L4 商业增强",
  scale: "17 期刊（Optica / Optics Letters / Optics Express 等）+ 470+ 会议（自 1916）；累计 270,000+ 论文",
  cost: "机构订阅",
  api: "机构 IP",
  as: "17 期刊（Optica / Optics Letters / Optics Express / Applied Optics / JOSA A / JOSA B 等）+ 470+ 会议（自 1916 至今）· 机构 IP · OSA 自 2021 改名 Optica · 光学 / 光子学 / 激光 / 光通信 / 显示 / 成像",
  doi: 3,
  pdf: 2,
  sb: "光学 / 光子学 / 激光 / 光电子 / 光纤 / 光谱 / 显示 / LED / 发光 / 成像",
  ge: "全球 / 英文",
  fit: "High",
  fr: "光学领域第一学会；Optica 期刊 IF 行业最高；与 SPIE 双寡头",
  nt: "美国光学学会（OSA / Optica）旗舰；17 期刊 + 470+ 会议自 1916 起；与 SPIE 双寡头但 Optica 期刊 IF 普遍高于 SPIE；本条为补录（2026-09-09）",
};

/** 7. Photonics Research：中国光学学会与 OSA 合作旗舰刊 */
const PHOTONICS_RESEARCH:Source = {
  n: "Photonics Research",
  u: "https://www.photonicsresearch.org",
  t: "学会出版社",
  r: "全球",
  l: "L4 商业增强",
  scale: "中国光学学会与 Optica 合作主办；2013 创刊，IF 7.6（2024）",
  cost: "机构订阅",
  api: "申请制",
  as: "中国光学学会 + Optica 联合主办 · 2013 创刊 · IF 7.6（2024 JCR 光学期刊 Q1）· 月刊 · 光学 / 光子学 / 激光 / 光通信 / 光电子 · 申请制访问 · 高影响力国际期刊",
  doi: 3,
  pdf: 2,
  sb: "光学 / 光子学 / 激光 / 光电子 / 光纤 / 成像",
  ge: "全球 / 英文",
  fit: "High",
  fr: "中国与 OSA 合作的国际旗舰光学期刊（IF 7.6）；学术质量对标 Optica 主刊",
  nt: "中国光学学会与 Optica 合作期刊，IF 7.6（光学期刊 Q1）；本条为补录（2026-09-09）",
};

/** 8. 光学学报：中国光学学会旗舰中文期刊 */
const CHINESE_OPTICS:Source = {
  n: "光学学报",
  u: "https://www.opticsjournal.net",
  t: "中文期刊",
  r: "国内",
  l: "L4 商业增强",
  scale: "中国光学学会旗舰中文刊，月刊；EI 收录",
  cost: "机构订阅",
  api: "申请制",
  as: "中国光学学会主办 · 月刊 · EI 收录 · 中文为主 · 光学 / 光子学 / 激光 / 光通信 / 光电子 / 光纤 · 申请制访问 · 与 Photonics Research 互为中英文姊妹刊",
  doi: 3,
  pdf: 2,
  sb: "光学 / 光子学 / 激光 / 光电子 / 光纤",
  ge: "中国大陆",
  fit: "High",
  fr: "中文光学旗舰；与 Photonics Research 互为姊妹刊",
  nt: "中国光学学会旗舰中文刊；EI 收录；本条为补录（2026-09-09）",
};

/* ---- 芯片 / 半导体 / 微电子（4 条）---- */

/** 9. IET Digital Library（英国工程技术学会）：Electronics Letters / IET Circuits, Devices & Systems */
const IET:Source = {
  n: "IET Digital Library（英国工程技术学会）",
  u: "https://digital-library.theiet.org",
  t: "学会出版社",
  r: "全球",
  l: "L4 商业增强",
  scale: "30+ 期刊含 Electronics Letters（1965 起）/ IET Circuits, Devices & Systems / IET Microwaves, Antennas & Propagation 等",
  cost: "机构订阅",
  api: "机构 IP",
  as: "30+ 期刊 + 会议录 · Electronics Letters（1965 起，电子学经典）/ IET Circuits, Devices & Systems / IET Microwaves, Antennas & Propagation · 机构 IP · 英国工程技术学会（IET，前 IEE）主办 · 偏电子 / 通信 / 电路",
  doi: 3,
  pdf: 2,
  sb: "电子 / 电气 / 通信 / 工程",
  ge: "全球 / 英文",
  fit: "High",
  fr: "Electronics Letters 是电子学领域经典期刊（1965 起）；不含半导体旗舰刊（Semiconductor Sci. Technol. 已归 IOPscience）",
  nt: "英国工程技术学会（IET，前 IEE）旗舰；Electronics Letters 自 1965 起；电子 / 通信 / 电路经典；半导体旗舰刊 Semiconductor Sci. Technol. 已归 IOPscience 不重复；本条为补录（2026-09-09）",
};

/** 10. 半导体学报 / J. Semiconductors：中科院微电子所 + 中国半导体行业协会 */
const J_SEMICONDUCTORS:Source = {
  n: "半导体学报（J. Semiconductors）",
  u: "https://www.jos.ac.cn",
  t: "中文期刊",
  r: "国内",
  l: "L4 商业增强",
  scale: "中科院微电子所 + 中国半导体行业协会联合主办；1980 创刊；EI 收录",
  cost: "机构订阅",
  api: "申请制",
  as: "中科院微电子所 + 中国半导体行业协会联合主办 · 1980 创刊 · EI 收录 · 月刊 · 半导体 / 集成电路 / 微电子学 / 半导体器件物理 · 申请制访问 · 中文为主含英文稿",
  doi: 3,
  pdf: 2,
  sb: "半导体 / 集成电路 / 微电子",
  ge: "中国大陆",
  fit: "High",
  fr: "中文半导体领域旗舰；中科院微电子所 + 中国半导体行业协会双背书",
  nt: "中科院微电子所 + 中国半导体行业协会联合主办；中文半导体旗舰；EI 收录；本条为补录（2026-09-09）",
};

/** 11. 微电子学：中国电子学会 + 中科院微电子所 */
const MICROELECTRONICS:Source = {
  n: "微电子学",
  u: "https://www.wdzx.com.cn",
  t: "中文期刊",
  r: "国内",
  l: "L4 商业增强",
  scale: "中国电子学会 + 中科院微电子所；1971 创刊；双月刊",
  cost: "机构订阅",
  api: "无 API",
  as: "中国电子学会 + 中科院微电子所联合主办 · 1971 创刊 · 双月刊 · 微电子学 / 集成电路 / 半导体器件 / 工艺与设备 · 订阅制 · 无公开 API · 与半导体学报互补（偏器件工艺）",
  doi: 3,
  pdf: 2,
  sb: "微电子 / 半导体 / 集成电路",
  ge: "中国大陆",
  fit: "Medium",
  fr: "中文微电子学核心刊；与半导体学报互补（偏器件工艺 vs 偏物理）",
  nt: "中国电子学会 + 中科院微电子所主办；中文微电子核心刊；本条为补录（2026-09-09）",
};

/** 12. 微纳电子技术：中国电子科技集团第 13 研究所 */
const MICRO_NANO:Source = {
  n: "微纳电子技术",
  u: "https://www.microsolapan.cn",
  t: "中文期刊",
  r: "国内",
  l: "L4 商业增强",
  scale: "中国电子科技集团第 13 研究所；1974 创刊；双月刊",
  cost: "机构订阅",
  api: "无 API",
  as: "中国电子科技集团第 13 研究所主办 · 1974 创刊 · 双月刊 · 微纳电子 / 半导体 / MEMS / 化合物半导体 · 订阅制 · 无公开 API · 与半导体学报 / 微电子学互补（偏微纳尺度）",
  doi: 1,
  pdf: 2,
  sb: "微纳电子 / 半导体",
  ge: "中国大陆",
  fit: "Medium",
  fr: "中文微纳电子核心刊；中国电子科技集团背书；偏微纳尺度",
  nt: "中国电子科技集团第 13 研究所主办；中文微纳电子核心刊；本条为补录（2026-09-09）",
};

/** 12 条学术源汇总：新能源 4 + 光电 4 + 芯片 4 */
export const SPECIALTY_SOURCES: Source[] = [
  /* 新能源 / 电池 / 储能 */
  ECS,
  IOPscience,
  CHINESE_ENERGY_STORAGE,
  CHINESE_POWER_TECH,
  /* 光电 / 光学 / 激光 */
  SPIE,
  OPTICA,
  PHOTONICS_RESEARCH,
  CHINESE_OPTICS,
  /* 芯片 / 半导体 / 微电子 */
  IET,
  J_SEMICONDUCTORS,
  MICROELECTRONICS,
  MICRO_NANO,
];