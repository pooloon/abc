import type { DashboardTab } from "./Sidebar";

interface DashboardTabNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const TABS: { id: DashboardTab; label: string }[] = [
  { id: "strategy", label: "순차 전략" },
  { id: "market", label: "시장·시세" },
  { id: "backtest", label: "백테스트" },
  { id: "report", label: "통합 리포트" },
  { id: "alerts", label: "알림" },
  { id: "brokers", label: "증권사 위치" },
  { id: "profile", label: "재무·설정" },
];

export default function DashboardTabNav({ activeTab, onTabChange }: DashboardTabNavProps) {
  return (
    <nav className="dashboard-tab-nav" aria-label="대시보드 탭">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`dashboard-tab-btn ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
