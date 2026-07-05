import type { ReactNode } from "react";
import type { User } from "../../types";
import type { QuoteSnapshot } from "../../types/market";
import AppFooter from "./AppFooter";
import AppHeader from "./AppHeader";
import DashboardTabNav from "./DashboardTabNav";
import MainVideoBanner from "./MainVideoBanner";
import MarketTicker from "./MarketTicker";
import Sidebar, { type DashboardTab } from "./Sidebar";

const PAGE_META: Record<DashboardTab, { title: string; subtitle: string }> = {
  strategy: {
    title: "Tactical Strategy Dashboard",
    subtitle: "순차 매수·자산배분·Bear/Base/Bull 시나리오",
  },
  market: {
    title: "KRX Market Intelligence",
    subtitle: "실시간 KOSPI·KOSDAQ 시세 및 DART 공시",
  },
  backtest: {
    title: "Strategy Backtest Lab",
    subtitle: "과거 수익률·변동성·MDD 시뮬레이션",
  },
  report: {
    title: "Integrated Report",
    subtitle: "Step 0–9 통합 투자 설계 리포트 · PDF 내보내기",
  },
  alerts: {
    title: "Intelligence Notifications",
    subtitle: "목표가·리밸런싱·시장 트리거 알림",
  },
  brokers: {
    title: "Broker & Asset Manager Locator",
    subtitle: "공무원연금공단 거래 목록 · 지역별 증권사·운용사 접근 거점",
  },
  profile: {
    title: "Settings & Financial Profile",
    subtitle: "DART API · 투자 입력 · Reference Pack",
  },
};

interface AppShellProps {
  user: User;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onSignOut: () => void;
  quotes: Map<string, QuoteSnapshot>;
  children: ReactNode;
}

export default function AppShell({
  user,
  activeTab,
  onTabChange,
  onSignOut,
  quotes,
  children,
}: AppShellProps) {
  const meta = PAGE_META[activeTab];

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} user={user} />
      <div className="app-main">
        <AppHeader
          user={user}
          onSignOut={onSignOut}
          title={meta.title}
          subtitle={meta.subtitle}
        />
        <MarketTicker quotes={quotes} />
        <MainVideoBanner />
        <DashboardTabNav activeTab={activeTab} onTabChange={onTabChange} />
        <main className="app-content">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}

export type { DashboardTab };
