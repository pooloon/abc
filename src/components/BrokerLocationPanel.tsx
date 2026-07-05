import { useEffect, useMemo, useState } from "react";
import { formatRegionLabel, type KoreaProvince } from "../data/koreaRegions";
import {
  companyTypeLabel,
  findBranchesInDistrict,
  getDatasetMeta,
  getProvinceDistricts,
  getProvinces,
  loadPensionAssetManagerCsv,
  loadPensionBrokerCsv,
} from "../services/brokerLocationService";
import type { BrokerBranch, BrokerLocationView } from "../types/brokerLocation";

export default function BrokerLocationPanel() {
  const [view, setView] = useState<BrokerLocationView>("provinces");
  const [province, setProvince] = useState<KoreaProvince | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [branches, setBranches] = useState<BrokerBranch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Awaited<ReturnType<typeof getDatasetMeta>> | null>(null);
  const [brokerRows, setBrokerRows] = useState(0);
  const [filter, setFilter] = useState<"all" | "broker" | "asset_manager">("all");

  useEffect(() => {
    void getDatasetMeta().then(setMeta).catch(() => setMeta(null));
    void loadPensionBrokerCsv().then((rows) => setBrokerRows(rows.length));
    void loadPensionAssetManagerCsv();
  }, []);

  useEffect(() => {
    if (!province || !district) {
      setBranches([]);
      return;
    }
    setLoading(true);
    setError(null);
    void findBranchesInDistrict(province, district)
      .then(setBranches)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "조회 실패");
        setBranches([]);
      })
      .finally(() => setLoading(false));
  }, [province, district]);

  const filteredBranches = useMemo(() => {
    if (filter === "all") return branches;
    return branches.filter((b) => b.companyType === filter);
  }, [branches, filter]);

  const brokerCount = branches.filter((b) => b.companyType === "broker").length;
  const amCount = branches.filter((b) => b.companyType === "asset_manager").length;

  const selectProvince = (p: KoreaProvince) => {
    setProvince(p);
    setDistrict(null);
    setView("districts");
  };

  const selectDistrict = (d: string) => {
    setDistrict(d);
    setView("branches");
  };

  const goProvinces = () => {
    setView("provinces");
    setProvince(null);
    setDistrict(null);
  };

  const goDistricts = () => {
    if (!province) {
      goProvinces();
      return;
    }
    setView("districts");
    setDistrict(null);
  };

  return (
    <section className="panel broker-location-panel">
      <div className="panel-header">
        <div>
          <h2>증권사 위치</h2>
          <p className="panel-desc">
            접속·거주 지역 기준으로 공무원연금공단 거래 목록(
            {meta ? `${meta.brokerCount}개 증권사 · ${meta.assetManagerCount}개 운용사` : "CSV"}
            )에 포함된 금융사 접근 거점을 안내합니다.{" "}
            {meta ? `기준일 ${meta.generatedAt}` : ""}
          </p>
        </div>
      </div>

      <nav className="broker-breadcrumb" aria-label="지역 탐색">
        <button type="button" className="link-btn" onClick={goProvinces}>
          전국
        </button>
        {province ? (
          <>
            <span aria-hidden="true">›</span>
            <button
              type="button"
              className={`link-btn ${view === "districts" ? "active-crumb" : ""}`}
              onClick={goDistricts}
            >
              {province}
            </button>
          </>
        ) : null}
        {province && district ? (
          <>
            <span aria-hidden="true">›</span>
            <span className="active-crumb">{district}</span>
          </>
        ) : null}
      </nav>

      {view === "provinces" ? (
        <>
          <h3 className="sub-heading">시·도 선택</h3>
          <p className="meta-line">거주·접속 지역의 시·도를 선택하세요.</p>
          <div className="region-grid">
            {getProvinces().map((p) => (
              <button key={p} type="button" className="region-btn" onClick={() => selectProvince(p)}>
                <span className="region-btn-label">{p.replace("특별자치", "").replace("광역", "")}</span>
                <span className="region-btn-sub">{getProvinceDistricts(p).length}개 세부지역</span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {view === "districts" && province ? (
        <>
          <h3 className="sub-heading">{province} · 시·군·구 선택</h3>
          <p className="meta-line">
            세부 지역을 선택하면 주변 거래증권사·위탁운용사 접근 거점을 표시합니다.
          </p>
          <div className="region-grid region-grid-dense">
            {getProvinceDistricts(province).map((d) => (
              <button key={d} type="button" className="region-btn region-btn-sm" onClick={() => selectDistrict(d)}>
                {d}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {view === "branches" && province && district ? (
        <>
          <div className="broker-result-header">
            <div>
              <h3 className="sub-heading">{formatRegionLabel(province, district)}</h3>
              <p className="meta-line">
                거래증권사 {brokerCount}곳 · 위탁운용사 {amCount}곳 (공무원연금공단 CSV 기준 목록)
              </p>
            </div>
            <div className="inline-controls">
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as "all" | "broker" | "asset_manager")
                }
                aria-label="유형 필터"
              >
                <option value="all">전체</option>
                <option value="broker">거래증권사</option>
                <option value="asset_manager">위탁운용사</option>
              </select>
            </div>
          </div>

          {loading ? <p className="meta-line">주변 금융사 조회 중…</p> : null}
          {error ? <p className="form-error">{error}</p> : null}

          {!loading && filteredBranches.length === 0 ? (
            <p className="hint-box">해당 지역에 표시할 접근 거점이 없습니다. 인근 시·군·구를 선택해 보세요.</p>
          ) : (
            <ul className="broker-branch-list">
              {filteredBranches.map((branch) => (
                <li key={branch.id} className="broker-branch-card">
                  <div className="broker-branch-head">
                    <strong>{branch.companyName}</strong>
                    <span
                      className={`broker-type-badge ${branch.companyType === "asset_manager" ? "am" : "broker"}`}
                    >
                      {companyTypeLabel(branch.companyType)}
                    </span>
                    {branch.pensionListed ? (
                      <span className="broker-pension-tag">연금공단 거래</span>
                    ) : null}
                  </div>
                  <p className="broker-branch-name">{branch.branchName}</p>
                  <p className="cell-sub">{branch.address}</p>
                </li>
              ))}
            </ul>
          )}

          <details className="broker-csv-details">
            <summary>공무원연금공단 원본 CSV ({brokerRows}행 거래증권사)</summary>
            <p className="cell-sub">
              출처: 공무원연금공단 국내주식 거래증권사·위탁운용사 목록 (2025.12.31). 지점 위치는
              CSV 명단과 지역 매트릭스를 조합한 접근 거점 안내이며, 실제 지점 주소는 각사 홈페이지에서
              확인하세요.
            </p>
          </details>
        </>
      ) : null}
    </section>
  );
}
