/** 表格列定义 —— 表头与单元格由同一份声明生成，结构上杜绝「列数不一致」类 bug。
 *  （v1.3.1 曾因表头 12 列 / 表体 11 格导致整体错位，此处从设计上消除该可能：
 *    表头用 columns.map 生成，每行也用 columns.map 生成，二者不可能不等长。） */

import type { ReactNode } from "react";
import type { Scenario, Service, Source, Websearch } from "./types";
import { DS, DL, PL } from "./core/rows";
import { SOURCES } from "./data/sources";
import { fitOf } from "./core/fit";
import { buildLinks } from "./core/link";
import { SERVICES } from "./data/services";
import NameCell from "./components/NameCell";
import LinkChips from "./components/LinkChips";

/** 关联索引：模块级只算一次，73×73 规模可忽略开销 */
const LINKS = buildLinks(SOURCES, SERVICES);

export interface Column<T> {
  /** 列标识：同时用于排序键、data-col 属性与测试定位 */
  key: string;
  title: string;
  sortable?: boolean;
  /** 附加到 th / td 的 class */
  className?: string;
  render: (d: T, sc: Scenario, fit: ReturnType<typeof fitOf>) => ReactNode;
}

/** 数据源表：12 列 */
export const SOURCE_COLUMNS: Column<Source>[] = [
  {
    key: "n", title: "数据源", sortable: true, className: "sticky",
    render: (d) => <NameCell name={d.n} url={d.u} sub={d.t} />,
  },
  { key: "r", title: "区域", render: (d) => <span className="rg">{d.r}</span> },
  { key: "scale", title: "规模", sortable: true, className: "sc", render: (d) => d.scale },
  {
    key: "cost", title: "收费", sortable: true,
    render: (d) => <span className={"tag t-" + d.cost}>{d.cost}</span>,
  },
  { key: "api", title: "API", sortable: true, render: (d) => <span className="ap">{d.api}</span> },
  { key: "as", title: "API 覆盖范围（文献类型 / 学科期刊 / 回溯 / 字段深度 / 配额）", className: "asc",
    render: (d) => <div className="as">{d.as || ""}</div> },
  {
    key: "doi", title: "DOI", sortable: true,
    render: (d) => (
      <>
        <span aria-hidden="true">{DS[d.doi]}</span>
        <span className="sr-only">{DL[d.doi]}</span>
      </>
    ),
  },
  {
    key: "pdf", title: "PDF", sortable: true,
    render: (d) => (
      <>
        <span aria-hidden="true">{d.pdf === 0 ? "—" : DS[d.pdf]}</span>
        <span className="sr-only">{PL[d.pdf]}</span>
      </>
    ),
  },
  { key: "sb", title: "学科覆盖", className: "sb", render: (d) => d.sb },
  { key: "ge", title: "地域 / 语种", className: "ge", render: (d) => d.ge },
  {
    key: "svcs", title: "可用 SDK / 服务", className: "lnk",
    render: (d) => <LinkChips names={LINKS.toServices.get(d.n) || []} target="svc" fallback="无开源封装" />,
  },
  {
    key: "fit", title: "适配度", sortable: true, className: "fitc",
    render: (_d, _sc, fit) => (
      <div className="fitcell">
        <span className="fitrow">
          <span className={"tag t-" + fit.lab}>{fit.lab}</span>
          <span className="fitsc">{fit.total.toFixed(1)}</span>
        </span>
        <details className="why">
          <summary>为什么</summary>
          <div className="whyp">
            <ul>
              {fit.P.map((p) => (
                <li key={p.label}>
                  {p.label} {p.v} / {p.max}
                </li>
              ))}
            </ul>
            {fit.rel ? (
              <p className="relwhy">
                场景相关 {fit.rel.v}：{fit.rel.label}
                <br />
                命中「{fit.rel.kw.join("、") || "无"}」，来自{fit.rel.field}
                {fit.rel.note ? `。${fit.rel.note}` : ""}
              </p>
            ) : null}
            {fit.adj ? (
              <p className="adjwhy">
                人工修正 {fit.adj.from} → {fit.adj.to}：{fit.adj.why}
              </p>
            ) : null}
          </div>
        </details>
      </div>
    ),
  },
  { key: "nt", title: "一句话要点", className: "nt", render: (d) => d.nt },
];

/** 检索服务表：9 列 */
export const SERVICE_COLUMNS: Column<Service>[] = [
  {
    key: "n", title: "服务", sortable: true, className: "sticky",
    render: (d) => <NameCell name={d.n} url={d.u} sub={d.ty} />,
  },
  { key: "ty", title: "类型", render: (d) => <span className={"tag t-" + d.ty}>{d.ty}</span> },
  { key: "lang", title: "语言", render: (d) => <span className="ap">{d.lang}</span> },
  {
    key: "src", title: "覆盖数据源", className: "sb",
    render: (d) => <LinkChips names={LINKS.toSources.get(d.n) || []} target="src" fallback={d.src || "多源"} />,
  },
  { key: "cost", title: "收费", className: "sc", render: (d) => d.cost },
  {
    key: "sub", title: "需订阅",
    render: (d) => (d.sub === "1" ? <span className="tag t-机构订阅">是</span> : <span className="rg">否</span>),
  },
  { key: "m", title: "维护 / API", sortable: true, render: (d) => <span className={"tag t-" + d.m}>{d.m}</span> },
  {
    key: "st", title: "Star", sortable: true, className: "star",
    render: (d) =>
      d.st ? (
        <span className="stn" title={"GitHub star（2026-09-08 实测）"}>
          <span aria-hidden="true">★</span> {d.st}
        </span>
      ) : (
        <span className="rg" aria-label="不适用">—</span>
      ),
  },
  { key: "sc", title: "最适合场景", className: "ge", render: (d) => d.sc },
  { key: "nt", title: "备注与坑点", className: "nt", render: (d) => d.nt },
];

/** 开放网络 / 通用检索（非学术）表：8 列 —— 聚焦「价格 + 覆盖 + 学术风险」 */
export const WEBSEARCH_COLUMNS: Column<Websearch>[] = [
  {
    key: "n", title: "API", sortable: true, className: "sticky",
    render: (d) => <NameCell name={d.n} url={d.u} sub={d.ty} />,
  },
  { key: "ty", title: "类型", render: (d) => <span className={"tag t-" + d.ty}>{d.ty}</span> },
  { key: "src", title: "数据覆盖", className: "sb", render: (d) => d.src },
  { key: "pricing", title: "定价", className: "as", render: (d) => <div className="as">{d.pricing}</div> },
  { key: "quota", title: "速率", className: "sc", render: (d) => d.quota },
  {
    key: "m", title: "维护状态", sortable: true, render: (d) => <span className={"tag t-" + d.m}>{d.m}</span>,
  },
  { key: "sc", title: "最适合场景", className: "ge", render: (d) => d.sc },
  { key: "nt", title: "备注与坑点", className: "nt", render: (d) => d.nt },
];
