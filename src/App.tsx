import { useMemo, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { getCountryPack } from "./data/countries";
import { useMarketNews } from "./hooks/useMarketNews";
import { useMarketQuotes } from "./hooks/useMarketQuotes";
import { useKrxUniverse } from "./hooks/useKrxUniverse";
import AuthPage from "./components/AuthPage";
import AlertsPanel from "./components/AlertsPanel";
import BacktestPanel from "./components/BacktestPanel";
import DartSettings from "./components/DartSettings";
import FullReportPanel from "./components/FullReportPanel";
import InvestmentInputForm from "./components/InvestmentInputForm";
import MarketExplorer from "./components/MarketExplorer";
import StrategyReport from "./components/StrategyReport";
import BrokerLocationPanel from "./components/BrokerLocationPanel";
import ChatBot from "./components/ChatBot";
import OpenAISettingsSection from "./components/OpenAISettingsSection";
import AppShell, { type DashboardTab } from "./components/layout/AppShell";

interface AlertPrefill {
  symbol: string;
  name: string;
  localCode: string;
  targetPrice?: number;
}

function Dashboard() {
  const { user, investmentForm, setInvestmentForm, signOut } = useAuth();
  const [tab, setTab] = useState<DashboardTab>("strategy");
  const [alertPrefill, setAlertPrefill] = useState<AlertPrefill | null>(null);
  const { quotes, error } = useMarketQuotes(user?.countryCode ?? "");
  const { news, loading: newsLoading, refresh: refreshNews } = useMarketNews(
    user?.countryCode ?? "",
  );
  const krx = useKrxUniverse(user?.countryCode === "KOR");

  const pack = useMemo(
    () => (user ? getCountryPack(user.countryCode) : null),
    [user],
  );

  if (!user || !pack) return null;

  const handleSetPriceAlert = (
    symbol: string,
    name: string,
    localCode: string,
    price: number,
  ) => {
    setAlertPrefill({ symbol, name, localCode, targetPrice: Math.round(price) });
    setTab("alerts");
  };

  return (
    <AppShell
      user={user}
      activeTab={tab}
      onTabChange={setTab}
      onSignOut={signOut}
      quotes={quotes}
    >
      <ChatBot />
      {error ? <p className="form-error banner-error">{error}</p> : null}

      {tab === "strategy" && (
        <StrategyReport user={user} form={investmentForm} quotes={quotes} news={news} />
      )}
      {tab === "market" && (
        <MarketExplorer
          user={user}
          instruments={krx.instruments}
          krxMeta={krx.meta}
          krxLoading={krx.loading}
          krxError={krx.error}
          onKrxReload={krx.reload}
          news={news}
          newsLoading={newsLoading}
          onRefreshNews={refreshNews}
          onSetPriceAlert={handleSetPriceAlert}
        />
      )}
      {tab === "backtest" && (
        <BacktestPanel user={user} form={investmentForm} quotes={quotes} />
      )}
      {tab === "report" && (
        <FullReportPanel user={user} form={investmentForm} quotes={quotes} news={news} />
      )}
      {tab === "alerts" && (
        <AlertsPanel
          quotes={quotes}
          prefill={alertPrefill}
          onClearPrefill={() => setAlertPrefill(null)}
          onNavigateMarket={() => setTab("market")}
        />
      )}
      {tab === "brokers" ? <BrokerLocationPanel /> : null}
      {tab === "profile" && (
        <>
          <OpenAISettingsSection />
          {user.countryCode === "KOR" ? <DartSettings /> : null}
          <InvestmentInputForm user={user} form={investmentForm} setForm={setInvestmentForm} />
        </>
      )}
    </AppShell>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="app">
      {user ? <Dashboard /> : <AuthPage />}
    </div>
  );
}
