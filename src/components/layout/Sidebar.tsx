import type { User } from "../../types";

export type DashboardTab =
  | "strategy"
  | "market"
  | "backtest"
  | "report"
  | "alerts"
  | "brokers"
  | "profile";

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  user: User;
}

const NAV_ITEMS: { id: DashboardTab; label: string; icon: string }[] = [
  { id: "strategy", label: "순차 전략", icon: "◈" },
  { id: "market", label: "시장·시세", icon: "◉" },
  { id: "backtest", label: "백테스트", icon: "◎" },
  { id: "report", label: "통합 리포트", icon: "▣" },
  { id: "alerts", label: "알림", icon: "◐" },
  { id: "brokers", label: "증권사 위치", icon: "⌖" },
  { id: "profile", label: "재무·설정", icon: "⚙" },
];

export default function Sidebar({ activeTab, onTabChange, user }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="대시보드 메뉴">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon" aria-hidden="true">
          ⬡
        </span>
        <div>
          <strong className="sidebar-brand-title">ENGINE</strong>
          <span className="sidebar-brand-sub">Retirement Authority</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-link ${activeTab === item.id ? "active" : ""}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="sidebar-link-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span className="status-dot" aria-hidden="true" />
          <span>SYSTEM ONLINE</span>
        </div>
        <p className="sidebar-meta">
          {user.name} · {user.countryCode}
        </p>
      </div>
    </aside>
  );
}
