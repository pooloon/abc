import { useEffect, useState } from "react";
import { analyzeInstrumentIssues, gradeColor } from "../services/issueAnalysisService";
import { calcHistoryStats, fetchPriceHistory } from "../services/chartService";
import {
  fetchCompanySummary,
  fetchDisclosures,
  fetchLatestFinancials,
  hasDartApiKey,
} from "../services/dartService";
import { fetchQuotes, formatPrice } from "../services/marketDataService";
import type { MarketInstrument, QuoteSnapshot } from "../types/market";
import type { DartFinancialReport, KrxListedStock } from "../types/krxDart";
import PriceChart from "./PriceChart";
import { buildDartSearchUrl } from "../utils/dartWebLinks";

interface StockDetailPageProps {
  instrument: MarketInstrument;
  krxStock?: KrxListedStock;
  newsHeadlines: string[];
  onBack: () => void;
  onSetPriceAlert?: (symbol: string, name: string, localCode: string, price: number, currency: string) => void;
}

export default function StockDetailPage({
  instrument,
  krxStock,
  newsHeadlines,
  onBack,
  onSetPriceAlert,
}: StockDetailPageProps) {
  const [quote, setQuote] = useState<QuoteSnapshot | null>(null);
  const [range, setRange] = useState<"6mo" | "1y" | "5y">("1y");
  const [history, setHistory] = useState<Awaited<ReturnType<typeof fetchPriceHistory>> | null>(null);
  const [financials, setFinancials] = useState<DartFinancialReport | null>(null);
  const [disclosures, setDisclosures] = useState<Awaited<ReturnType<typeof fetchDisclosures>>>([]);
  const [company, setCompany] = useState<Awaited<ReturnType<typeof fetchCompanySummary>>>(null);
  const [loading, setLoading] = useState(true);
  const [finError, setFinError] = useState<string | null>(null);

  const issue = analyzeInstrumentIssues(instrument, quote ?? undefined, newsHeadlines);
  const stats = history ? calcHistoryStats(history.points) : null;
  const isKorStock = instrument.countryCodes.includes("KOR") && instrument.assetClass === "stock";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const quotes = await fetchQuotes([instrument.symbol]);
      if (cancelled) return;
      setQuote(quotes.get(instrument.symbol) ?? null);

      const hist = await fetchPriceHistory(instrument.symbol, range);
      if (cancelled) return;
      setHistory(hist);

      if (isKorStock && hasDartApiKey()) {
        try {
          const [fin, disc, comp] = await Promise.all([
            fetchLatestFinancials(instrument.localCode),
            fetchDisclosures(instrument.localCode, { pageCount: 8 }),
            fetchCompanySummary(instrument.localCode),
          ]);
          if (!cancelled) {
            setFinancials(fin);
            setDisclosures(disc);
            setCompany(comp);
            setFinError(null);
          }
        } catch (err) {
          if (!cancelled) {
            setFinError(err instanceof Error ? err.message : "재무제표 조회 실패");
          }
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [instrument, range, isKorStock]);

  const price = quote?.price ?? krxStock?.closePrice ?? null;
  const currency = quote?.currency || (isKorStock ? "KRW" : "USD");

  return (
    <section className="panel stock-detail">
      <div className="panel-header">
        <div>
          <button type="button" className="btn btn-sm" onClick={onBack}>
            ← 목록
          </button>
          <h2>
            {instrument.name}{" "}
            <code>{instrument.localCode}</code>
          </h2>
          <p className="panel-desc">
            {instrument.symbol} · {instrument.exchange} · {instrument.sector}
          </p>
        </div>
        <span className={`grade-badge ${gradeColor(issue.grade)}`}>{issue.grade}</span>
      </div>

      <div className="detail-metrics">
        <div className="metric-card">
          <span className="metric-label">현재가</span>
          <span className="metric-value">{formatPrice(price, currency)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">PER</span>
          <span className="metric-value">{quote?.peRatio?.toFixed(1) ?? "—"}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">기간 수익</span>
          <span className={`metric-value ${stats?.changePercent != null && stats.changePercent >= 0 ? "up" : "down"}`}>
            {stats?.changePercent != null ? `${stats.changePercent}%` : "—"}
          </span>
        </div>
        {onSetPriceAlert && price != null ? (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => onSetPriceAlert(instrument.symbol, instrument.name, instrument.localCode, price, currency)}
          >
            목표가 알림
          </button>
        ) : null}
      </div>

      <div className="chart-controls">
        {(["6mo", "1y", "5y"] as const).map((r) => (
          <button
            key={r}
            type="button"
            className={`tab-btn ${range === r ? "active" : ""}`}
            onClick={() => setRange(r)}
          >
            {r === "6mo" ? "6개월" : r === "1y" ? "1년" : "5년"}
          </button>
        ))}
      </div>

      {loading ? <p className="meta-line">로딩 중…</p> : <PriceChart points={history?.points ?? []} />}

      <h3 className="sub-heading">이슈·전망</h3>
      <p>{issue.outlook}</p>
      <ul className="issue-list">
        <li>거시: {issue.macro}</li>
        <li>섹터: {issue.sector}</li>
        <li>밸류: {issue.valuation}</li>
      </ul>

      {isKorStock ? (
        <>
          <h3 className="sub-heading">DART 재무·공시</h3>
          <p className="hint-box">
            <a
              href={buildDartSearchUrl(instrument.localCode, instrument.name)}
              target="_blank"
              rel="noreferrer"
            >
              dart.fss.or.kr에서 {instrument.name} 공시·재무 보기 ↗
            </a>
          </p>
          {finError ? <p className="form-error">{finError}</p> : null}
          {!hasDartApiKey() ? (
            <p className="meta-line">앱 내 재무표는 로컬 dev + API 키 설정 시 표시됩니다.</p>
          ) : financials ? (
            <>
              <p className="meta-line">
                {financials.businessYear} · {financials.reportLabel} ·{" "}
                {financials.fsDiv === "CFS" ? "연결" : "별도"}
                {company ? ` · ${company.corpName}` : ""}
              </p>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>계정</th>
                      <th>당기</th>
                      <th>전기</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financials.rows.map((row) => (
                      <tr key={row.accountName}>
                        <td>{row.accountName}</td>
                        <td>{row.currentAmount?.toLocaleString() ?? "—"}</td>
                        <td>{row.previousAmount?.toLocaleString() ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            !loading && <p className="meta-line">재무제표 데이터 없음</p>
          )}

          <h3 className="sub-heading">최근 공시</h3>
          <ul className="disclosure-list">
            {disclosures.map((d) => (
              <li key={d.receiptNo}>
                <span className="disclosure-date">{d.receiptDate}</span>
                <a href={d.reportUrl} target="_blank" rel="noreferrer">
                  {d.reportName}
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
