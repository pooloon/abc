import { useEffect, useMemo, useState } from "react";
import { filterInstruments, getInstrumentsForCountry } from "../data/marketUniverse";
import { analyzeInstrumentIssues, gradeColor, sentimentLabel } from "../services/issueAnalysisService";
import { fetchQuotes, formatMarketCap, formatPrice } from "../services/marketDataService";
import type { User } from "../types";
import type { AssetClass, NewsItem, QuoteSnapshot } from "../types/market";
import type { KrxLoadResult, KrxListedStock } from "../types/krxDart";
import StockDetailPage from "./StockDetailPage";
import { buildDartSearchUrl } from "../utils/dartWebLinks";
import type { MarketInstrument } from "../types/market";

interface MarketExplorerProps {
  user: User;
  instruments: MarketInstrument[];
  krxMeta: KrxLoadResult | null;
  krxLoading: boolean;
  krxError: string | null;
  onKrxReload: () => void;
  news: Map<string, NewsItem[]>;
  newsLoading: boolean;
  onRefreshNews: () => void;
  onSetPriceAlert?: (
    symbol: string,
    name: string,
    localCode: string,
    price: number,
    currency: string,
  ) => void;
}

const ASSET_OPTIONS: { value: AssetClass | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "stock", label: "주식" },
  { value: "etf", label: "ETF" },
  { value: "bond", label: "채권ETF" },
  { value: "commodity", label: "원자재" },
];

const PAGE_SIZE = 80;

export default function MarketExplorer({
  user,
  instruments,
  krxMeta,
  krxLoading,
  krxError,
  onKrxReload,
  news,
  newsLoading,
  onRefreshNews,
  onSetPriceAlert,
}: MarketExplorerProps) {
  const [query, setQuery] = useState("");
  const [assetClass, setAssetClass] = useState<AssetClass | "all">("all");
  const [page, setPage] = useState(0);
  const [quotes, setQuotes] = useState<Map<string, QuoteSnapshot>>(new Map());
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [detailInstrument, setDetailInstrument] = useState<MarketInstrument | null>(null);

  const isKor = user.countryCode === "KOR";
  const fallbackInstruments = useMemo(
    () => getInstrumentsForCountry(user.countryCode),
    [user.countryCode],
  );
  const allInstruments = instruments.length > 0 ? instruments : fallbackInstruments;

  const krxMap = useMemo(() => {
    const map = new Map<string, KrxListedStock>();
    for (const s of krxMeta?.stocks ?? []) map.set(s.code, s);
    return map;
  }, [krxMeta]);

  const filtered = useMemo(
    () => filterInstruments(allInstruments, query, assetClass),
    [allInstruments, query, assetClass],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  );

  useEffect(() => {
    setPage(0);
  }, [query, assetClass]);

  useEffect(() => {
    const symbols = paged.slice(0, 40).map((i) => i.symbol);
    if (symbols.length === 0) return;
    setQuotesLoading(true);
    fetchQuotes(symbols)
      .then(setQuotes)
      .finally(() => setQuotesLoading(false));
  }, [paged]);

  const rows = useMemo(
    () =>
      paged.map((inst) => {
        const headlines = news.get(inst.symbol)?.map((n) => n.title) ?? [];
        const quote = quotes.get(inst.symbol);
        const krx = krxMap.get(inst.localCode);
        return {
          inst,
          quote,
          krx,
          issue: analyzeInstrumentIssues(inst, quote, headlines),
          newsItems: news.get(inst.symbol) ?? [],
        };
      }),
    [paged, quotes, news, krxMap],
  );

  if (detailInstrument) {
    const headlines = news.get(detailInstrument.symbol)?.map((n) => n.title) ?? [];
    return (
      <StockDetailPage
        instrument={detailInstrument}
        krxStock={krxMap.get(detailInstrument.localCode)}
        newsHeadlines={headlines}
        onBack={() => setDetailInstrument(null)}
        onSetPriceAlert={onSetPriceAlert}
      />
    );
  }

  return (
    <div className="market-layout">
      <section className="panel market-panel">
        <div className="panel-header">
          <div>
            <h2>시장 유니버스 · KRX · DART</h2>
            <p className="panel-desc">
              {isKor && krxMeta
                ? `KRX ${krxMeta.stocks.length}종목 · 기준일 ${krxMeta.tradingDate} · 표시 ${filtered.length}건`
                : `${allInstruments.length}종목 · ${user.countryCode}`}
            </p>
          </div>
          <div className="inline-controls">
            {isKor ? (
              <button type="button" className="btn btn-sm" onClick={onKrxReload} disabled={krxLoading}>
                {krxLoading ? "KRX…" : "KRX 새로고침"}
              </button>
            ) : null}
            <button type="button" className="btn btn-sm" onClick={onRefreshNews} disabled={newsLoading}>
              {newsLoading ? "뉴스…" : "뉴스"}
            </button>
          </div>
        </div>

        {krxError ? <p className="form-error banner-error">{krxError}</p> : null}
        {quotesLoading ? <p className="meta-line">Yahoo 시세·PER 로드 중 (현재 페이지)…</p> : null}

        <div className="filter-bar">
          <input
            type="search"
            placeholder="종목명·코드·섹터 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            value={assetClass}
            onChange={(e) => setAssetClass(e.target.value as AssetClass | "all")}
          >
            {ASSET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {pageCount > 1 ? (
          <div className="pagination">
            <button type="button" className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              이전
            </button>
            <span>
              {page + 1} / {pageCount}
            </span>
            <button
              type="button"
              className="btn btn-sm"
              disabled={page >= pageCount - 1}
              onClick={() => setPage(page + 1)}
            >
              다음
            </button>
          </div>
        ) : null}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>종목</th>
                <th>코드</th>
                <th>시장</th>
                <th>현재가</th>
                <th>등락</th>
                <th>PER</th>
                <th>시총</th>
                <th>등급</th>
                <th>공시</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ inst, quote, krx, issue }) => {
                const price =
                  quote?.price ??
                  (krx?.closePrice != null ? krx.closePrice : null);
                const currency = quote?.currency || (isKor ? "KRW" : "");
                const change = quote?.changePercent ?? krx?.changeRate ?? null;
                return (
                  <tr
                    key={inst.symbol}
                    className="clickable-row"
                    onClick={() => setDetailInstrument(inst)}
                  >
                    <td>
                      <strong>{inst.name}</strong>
                      <span className="cell-sub">{inst.assetClass}</span>
                    </td>
                    <td>
                      <code>{inst.localCode}</code>
                    </td>
                    <td>{krx?.market ?? inst.sector}</td>
                    <td>{formatPrice(price, currency)}</td>
                    <td className={change != null && change >= 0 ? "up" : "down"}>
                      {change != null ? `${change.toFixed(2)}%` : "—"}
                    </td>
                    <td>{quote?.peRatio?.toFixed(1) ?? "—"}</td>
                    <td>
                      {quote?.marketCap != null
                        ? formatMarketCap(quote.marketCap)
                        : krx?.marketCap != null
                          ? formatMarketCap(krx.marketCap * 1_000_000)
                          : "—"}
                    </td>
                    <td>
                      <span className={`grade-badge ${gradeColor(issue.grade)}`}>{issue.grade}</span>
                      <span className="cell-sub">{sentimentLabel(issue.newsSentiment)}</span>
                    </td>
                    <td>
                      {inst.assetClass === "stock" && isKor ? (
                        <a
                          className="link-btn"
                          href={buildDartSearchUrl(inst.localCode, inst.name)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          DART ↗
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="link-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailInstrument(inst);
                        }}
                      >
                        차트·재무
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
