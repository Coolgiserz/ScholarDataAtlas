/** 应用主组件：状态提升到此处，业务计算全部委托给 core/ 纯函数 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { SOURCES } from "./data/sources";
import { SERVICES } from "./data/services";
import { WEBSEARCHES } from "./data/websearch";
import { SCENARIOS, SCENARIO_MAP } from "./data/scenarios";
import { mSrc, mSvc, mWb } from "./core/filter";
import { relLow } from "./core/fit";
import { describeSrcFilters, describeSvcFilters, describeWbFilters } from "./core/describe";
import { doSort } from "./core/sort";
import { srcRows, svcRows, wbRows, metaRows } from "./core/rows";
import { buildXlsx } from "./core/export/xlsx";
import { toCsv } from "./core/export/csv";
import { serializeUrl, parseUrl } from "./core/urlState";
import type { ServiceFilters, SourceFilters, WebsearchFilters } from "./types";

import Tabs from "./components/Tabs";
import FilterBar from "./components/FilterBar";
import ServiceFilterBar from "./components/ServiceFilterBar";
import WebsearchFilterBar from "./components/WebsearchFilterBar";
import DataTable from "./components/DataTable";
import Toast from "./components/Toast";
import RelLegend from "./components/RelLegend";
import DoiPdfLegend from "./components/DoiPdfLegend";
import type { MouseEvent } from "react";
import { SOURCE_COLUMNS, SERVICE_COLUMNS, WEBSEARCH_COLUMNS } from "./columns";

const TABS = [
  { id: "src", label: "数据源（" + SOURCES.length + "）" },
  { id: "svc", label: "检索服务（" + SERVICES.length + "）" },
  { id: "wb", label: "开放网络（非学术专用）（" + WEBSEARCHES.length + "）" },
];

const EMPTY_SRC: SourceFilters = { scen: "gen" };
const EMPTY_SVC: ServiceFilters = {};
const EMPTY_WB: WebsearchFilters = {};

const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))].sort();

export default function App() {
  const [tab, setTab] = useState("src");
  const [srcF, setSrcF] = useState<SourceFilters>(EMPTY_SRC);
  const [svcF, setSvcF] = useState<ServiceFilters>(EMPTY_SVC);
  const [wbF, setWbF] = useState<WebsearchFilters>(EMPTY_WB);
  const [sort1, setSort1] = useState<{ k: string; d: number } | null>(null);
  const [sort2, setSort2] = useState<{ k: string; d: number } | null>(null);
  const [sort3, setSort3] = useState<{ k: string; d: number } | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const [busy, setBusy] = useState(false);

  /* 关联 chip 的跨表跳转：切到目标表并按名称筛选。 */
  const onJump = useCallback((e: MouseEvent<HTMLTableElement>) => {
    const el = (e.target as HTMLElement).closest("[data-jump]") as HTMLElement | null;
    if (!el) return;
    const name = el.dataset.jump!;
    if (el.dataset.target === "svc") {
      setTab("svc");
      setSvcF({ ...EMPTY_SVC, q: name });
    } else {
      setTab("src");
      setSrcF({ ...EMPTY_SRC, q: name });
    }
  }, []);

  const scenario = SCENARIO_MAP[srcF.scen] || SCENARIOS[0];

  /* 恢复 URL 状态（仅首次） */
  useEffect(() => {
    const s = parseUrl(window.location.search);
    if (s.tab) setTab(s.tab);
    setSrcF((f) => ({ ...f, ...s.src, scen: s.scen || f.scen }));
    setSvcF((f) => ({ ...f, ...s.svc }));
    setWbF((f) => ({ ...f, ...s.wb }));
    if (s.sort1) setSort1(s.sort1);
    if (s.sort2) setSort2(s.sort2);
    if (s.sort3) setSort3(s.sort3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 同步 URL */
  useEffect(() => {
    const qs = serializeUrl({
      tab, scen: srcF.scen, src: srcF, svc: svcF, wb: wbF,
      sort1: sort1 || undefined, sort2: sort2 || undefined, sort3: sort3 || undefined,
    });
    try {
      window.history.replaceState(null, "", qs ? "?" + qs : window.location.pathname);
    } catch {
      /* file:// 下可能受限，忽略 */
    }
  }, [tab, srcF, svcF, wbF, sort1, sort2, sort3]);

  const srcRowsFiltered = useMemo(() => {
    const rows = SOURCES.filter((d) => mSrc(d, srcF, scenario));
    return sort1 ? doSort(rows, sort1.k, sort1.d, scenario) : rows;
  }, [srcF, scenario, sort1]);

  const svcRowsFiltered = useMemo(() => {
    const rows = SERVICES.filter((d) => mSvc(d, svcF));
    return sort2 ? doSort(rows, sort2.k, sort2.d, scenario) : rows;
  }, [svcF, scenario, sort2]);

  const wbRowsFiltered = useMemo(() => {
    const rows = WEBSEARCHES.filter((d) => mWb(d, wbF));
    return sort3 ? doSort(rows, sort3.k, sort3.d, scenario) : rows;
  }, [wbF, scenario, sort3]);

  const hiddenCount = useMemo(
    () => (scenario.rel ? SOURCES.filter((d) => relLow(d, scenario)).length : 0),
    [scenario],
  );

  const onSort1 = useCallback((k: string) => setSort1((c) => (c && c.k === k ? { k, d: -c.d } : { k, d: 1 })), []);
  const onSort2 = useCallback((k: string) => setSort2((c) => (c && c.k === k ? { k, d: -c.d } : { k, d: 1 })), []);
  const onSort3 = useCallback((k: string) => setSort3((c) => (c && c.k === k ? { k, d: -c.d } : { k, d: 1 })), []);

  const exportNow = useCallback(
    (kind: "src" | "svc" | "wb", fmt: "xlsx" | "csv") => {
      const rows = kind === "src" ? srcRowsFiltered : kind === "svc" ? svcRowsFiltered : wbRowsFiltered;
      if (!rows.length) {
        setToast({ msg: "当前筛选没有数据，无法导出。请放宽筛选条件后重试。", kind: "err" });
        return;
      }
      setBusy(true);
      requestAnimationFrame(() =>
        setTimeout(() => {
          try {
            if (fmt === "csv") {
              const sheet =
                kind === "src" ? srcRows(rows as never, scenario) :
                kind === "svc" ? svcRows(rows as never) :
                wbRows(rows as never);
              download(toCsv(sheet.rows), "text/csv;charset=utf-8", sheet.name + ".csv");
            } else {
              const sheets = [
                srcRows(srcRowsFiltered as never, scenario),
                svcRows(svcRowsFiltered as never),
                wbRows(wbRowsFiltered as never),
                metaRows({
                  sc: scenario,
                  srcCount: srcRowsFiltered.length,
                  srcTotal: SOURCES.length,
                  svcCount: svcRowsFiltered.length,
                  svcTotal: SERVICES.length,
                  wbCount: wbRowsFiltered.length,
                  wbTotal: WEBSEARCHES.length,
                  allSources: SOURCES,
                  filterDesc: [
                    ...describeSrcFilters(srcF).map((s) => "数据源页 — " + s),
                    ...describeSvcFilters(svcF).map((s) => "服务页 — " + s),
                    ...describeWbFilters(wbF).map((s) => "开放网络页 — " + s),
                  ],
                }),
              ];
              downloadBytes(buildXlsx(sheets), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "ScholarDataAtlas.xlsx");
            }
            setToast({ msg: "已导出 " + rows.length + " 条。", kind: "ok" });
          } catch (e) {
            setToast({ msg: "导出失败：" + (e as Error).message, kind: "err" });
          } finally {
            setBusy(false);
          }
        }, 0),
      );
    },
    [srcRowsFiltered, svcRowsFiltered, wbRowsFiltered, scenario],
  );

  const srcDesc = useMemo(() => describeSrcFilters(srcF), [srcF]);
  const svcDesc = useMemo(() => describeSvcFilters(svcF), [svcF]);
  const wbDesc = useMemo(() => describeWbFilters(wbF), [wbF]);

  const svcOpts = useMemo(
    () => ({
      tyOptions: uniq(SERVICES.map((d) => d.ty)),
      langOptions: uniq(SERVICES.map((d) => d.lang)),
      mOptions: uniq(SERVICES.map((d) => d.m)),
      srcOptions: ["OpenAlex", "Crossref", "PubMed", "arXiv", "Scopus", "WoS", "Semantic Scholar", "OAI-PMH", "多源"].filter(
        (s) => s === "多源" || SERVICES.some((d) => d.src.indexOf(s) >= 0),
      ),
    }),
    [],
  );

  const wbOpts = useMemo(
    () => ({
      tyOptions: uniq(WEBSEARCHES.map((d) => d.ty)),
      mOptions: uniq(WEBSEARCHES.map((d) => d.m)),
      srcOptions: uniq(WEBSEARCHES.map((d) => d.src)),
    }),
    [],
  );

  const opts = useMemo(
    () => ({
      regionOptions: uniq(SOURCES.map((d) => d.r)),
      layerOptions: uniq(SOURCES.map((d) => d.l)),
      costOptions: uniq(SOURCES.map((d) => d.cost)),
      apiOptions: uniq(SOURCES.map((d) => d.api)),
      fitOptions: ["High", "Medium", "Low"],
      /* DOI / PDF 维度按 3→2→1→0 降序排，把「专用端点/全量免费」这种用户最关心的档位放前面 */
      doiOptions: ["3", "2", "1", "0"].filter((v) => SOURCES.some((d) => String(d.doi) === v)),
      pdfOptions: ["3", "2", "1", "0"].filter((v) => SOURCES.some((d) => String(d.pdf) === v)),
    }),
    [],
  );

  return (
    <div className="wrap" id="main">
      <a className="skip" href="#main">
        跳到主内容
      </a>
      <h1>论文数据源 &amp; 检索服务对比表</h1>
      <div className="sub">
        核查日期 <b>2026-09-08</b> ｜ <b>{SOURCES.length}</b> 个数据源 + <b>{SERVICES.length}</b> 个检索服务 + <b>{WEBSEARCHES.length}</b> 个开放网络检索
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "src" ? (
        <div id="pane-src" role="tabpanel" aria-labelledby="tab-src">
          <h2 className="sr-only">数据源对比</h2>
          <FilterBar
            filters={srcF}
            scenario={scenario}
            onChange={(patch) => setSrcF((f) => ({ ...f, ...patch }))}
            onReset={() => {
              setSrcF(EMPTY_SRC);
              setSort1(null);
            }}
            {...opts}
          />
          <RelLegend scenario={scenario} />
          <DoiPdfLegend />
          <div className="cnt" role="status" aria-live="polite">
            显示 <b>{srcRowsFiltered.length}</b> / <span>{SOURCES.length}</span>
            <span className="hidn">{hiddenCount ? "（已隐藏 " + hiddenCount + " 个不相关源）" : ""}</span>
          </div>
          <div className="expbar" style={{ margin: "0 0 10px" }}>
            <button
              type="button"
              className="exp"
              disabled={busy || !srcRowsFiltered.length}
              title={"导出当前筛选结果的 " + srcRowsFiltered.length + " 条"}
              onClick={() => exportNow("src", "xlsx")}
            >
              {busy ? "导出中…" : "⬇ 导出 Excel（" + srcRowsFiltered.length + "）"}
            </button>
            <button
              type="button"
              className="exp ghost"
              disabled={busy || !srcRowsFiltered.length}
              title={"导出当前筛选结果的 " + srcRowsFiltered.length + " 条（CSV）"}
              onClick={() => exportNow("src", "csv")}
            >
              CSV
            </button>
            <span className="expnote">
              {srcDesc.length ? "筛选：" + srcDesc.join(" ｜ ") : "未设置筛选，导出全部 " + SOURCES.length + " 条"}
            </span>
          </div>
          <DataTable
            columns={SOURCE_COLUMNS}
            rows={srcRowsFiltered}
            scenario={scenario}
            sortKey={sort1?.k ?? null}
            sortDir={sort1?.d ?? 1}
            onSort={onSort1}
            caption={`论文数据源对比表：${SOURCES.length} 个数据源，${SOURCE_COLUMNS.length} 列。表头按钮可排序。`}
            onJump={onJump}
            className="t-src"
            emptyText="没有匹配的数据源，试试放宽筛选条件。"
            onReset={() => {
              setSrcF(EMPTY_SRC);
              setSort1(null);
            }}
          />
        </div>
      ) : tab === "svc" ? (
        <div id="pane-svc" role="tabpanel" aria-labelledby="tab-svc">
          <h2 className="sr-only">检索 / 查询服务对比</h2>
          <ServiceFilterBar
            filters={svcF}
            onChange={(patch) => setSvcF((f) => ({ ...f, ...patch }))}
            onReset={() => {
              setSvcF(EMPTY_SVC);
              setSort2(null);
            }}
            {...svcOpts}
          />
          <div className="cnt" role="status" aria-live="polite">
            显示 <b>{svcRowsFiltered.length}</b> / <span>{SERVICES.length}</span>
          </div>
          <div className="expbar" style={{ margin: "0 0 10px" }}>
            <button
              type="button"
              className="exp"
              disabled={busy || !svcRowsFiltered.length}
              title={"导出当前筛选结果的 " + svcRowsFiltered.length + " 条"}
              onClick={() => exportNow("svc", "xlsx")}
            >
              {busy ? "导出中…" : "⬇ 导出 Excel（" + svcRowsFiltered.length + "）"}
            </button>
            <button
              type="button"
              className="exp ghost"
              disabled={busy || !svcRowsFiltered.length}
              title={"导出当前筛选结果的 " + svcRowsFiltered.length + " 条（CSV）"}
              onClick={() => exportNow("svc", "csv")}
            >
              CSV
            </button>
            <span className="expnote">
              {svcDesc.length ? "筛选：" + svcDesc.join(" ｜ ") : "未设置筛选，导出全部 " + SERVICES.length + " 条"}
            </span>
          </div>
          <DataTable
            columns={SERVICE_COLUMNS}
            rows={svcRowsFiltered}
            scenario={scenario}
            sortKey={sort2?.k ?? null}
            sortDir={sort2?.d ?? 1}
            onSort={onSort2}
            caption={`论文检索服务对比表：${SERVICES.length} 个服务，${SERVICE_COLUMNS.length} 列。表头按钮可排序。`}
            onJump={onJump}
            className="t-svc"
            emptyText="没有匹配的服务，试试放宽筛选条件。"
            onReset={() => {
              setSvcF(EMPTY_SVC);
              setSort2(null);
            }}
          />
        </div>
      ) : (
        <div id="pane-wb" role="tabpanel" aria-labelledby="tab-wb">
          <h2 className="sr-only">开放网络 / 通用检索（非学术）</h2>
          <p className="wb-note">
            本栏收录「通用 web 检索」类 API（非学术库），主要适用跨域事实检索 / AI Agent 联网 / RAG 实时数据。
            <b>学术研究应优先使用上方「数据源」与「检索服务」两栏。</b>
          </p>
          <WebsearchFilterBar
            filters={wbF}
            onChange={(patch) => setWbF((f) => ({ ...f, ...patch }))}
            onReset={() => {
              setWbF(EMPTY_WB);
              setSort3(null);
            }}
            {...wbOpts}
          />
          <div className="cnt" role="status" aria-live="polite">
            显示 <b>{wbRowsFiltered.length}</b> / <span>{WEBSEARCHES.length}</span>
          </div>
          <div className="expbar" style={{ margin: "0 0 10px" }}>
            <button
              type="button"
              className="exp"
              disabled={busy || !wbRowsFiltered.length}
              title={"导出当前筛选结果的 " + wbRowsFiltered.length + " 条"}
              onClick={() => exportNow("wb", "xlsx")}
            >
              {busy ? "导出中…" : "⬇ 导出 Excel（" + wbRowsFiltered.length + "）"}
            </button>
            <button
              type="button"
              className="exp ghost"
              disabled={busy || !wbRowsFiltered.length}
              title={"导出当前筛选结果的 " + wbRowsFiltered.length + " 条（CSV）"}
              onClick={() => exportNow("wb", "csv")}
            >
              CSV
            </button>
            <span className="expnote">
              {wbDesc.length ? "筛选：" + wbDesc.join(" ｜ ") : "未设置筛选，导出全部 " + WEBSEARCHES.length + " 条"}
            </span>
          </div>
          <DataTable
            columns={WEBSEARCH_COLUMNS}
            rows={wbRowsFiltered}
            scenario={scenario}
            sortKey={sort3?.k ?? null}
            sortDir={sort3?.d ?? 1}
            onSort={onSort3}
            caption={`开放网络检索对比表：${WEBSEARCHES.length} 个 API，${WEBSEARCH_COLUMNS.length} 列。表头按钮可排序。`}
            onJump={onJump}
            className="t-wb"
            emptyText="没有匹配的 API，试试放宽筛选条件。"
            onReset={() => {
              setWbF(EMPTY_WB);
              setSort3(null);
            }}
          />
        </div>
      )}

      {toast ? <Toast msg={toast.msg} kind={toast.kind} onDone={() => setToast(null)} /> : null}
    </div>
  );
}

/* ---------- 下载辅助（唯一的浏览器副作用出口） ---------- */
function download(text: string, mime: string, name: string) {
  const blob = new Blob([text], { type: mime });
  triggerDownload(URL.createObjectURL(blob), name);
}
function downloadBytes(data: Uint8Array, mime: string, name: string) {
  /* TS 5.7+ 把 Uint8Array<ArrayBufferLike> 与 BlobPart<ArrayBuffer> 区分开（SharedArrayBuffer 不可赋）。
     把 buffer 显式拷到新的 ArrayBuffer 视图上即可解决（且不会影响下载正确性）。 */
  const buf = new Uint8Array(data.byteLength);
  buf.set(data);
  const blob = new Blob([buf], { type: mime });
  triggerDownload(URL.createObjectURL(blob), name);
}
function triggerDownload(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(href);
    a.remove();
  }, 2000);
}