import { useState } from "react";
import {
  hasDartApiKey,
  saveDartApiKey,
  verifyDartApiKey,
  type DartKeyVerifyResult,
} from "../services/dartService";

export default function DartSettings() {
  const [key, setKey] = useState(() => localStorage.getItem("dart_api_key") ?? "");
  const [saved, setSaved] = useState(false);
  const [verify, setVerify] = useState<DartKeyVerifyResult | null>(null);
  const [checking, setChecking] = useState(false);

  const handleSave = async () => {
    saveDartApiKey(key);
    setSaved(true);
    setVerify(null);
    window.setTimeout(() => setSaved(false), 2000);
    await runVerify(key);
  };

  const runVerify = async (value?: string) => {
    setChecking(true);
    const result = await verifyDartApiKey(value);
    setVerify(result);
    setChecking(false);
  };

  return (
    <section className="panel dart-settings">
      <h2>Open DART · 전자공시 연동</h2>
      <p className="panel-desc">
        GitHub Pages에서는 종목→기업코드(corpCode)가{" "}
        <strong>배포 시 빌드 캐시</strong>로 제공됩니다. 공시·재무는{" "}
        <a href="https://dart.fss.or.kr/" target="_blank" rel="noreferrer">
          dart.fss.or.kr
        </a>
        링크로 바로 열람하세요. 로컬(<code>npm run dev</code>)에서는 API 키로 앱 내 조회도
        가능합니다.
      </p>
      <div className="field-row">
        <div className="field">
          <label htmlFor="dart-key">DART API Key (로컬·선택)</label>
          <input
            id="dart-key"
            type="password"
            placeholder="40자 인증키 — 로컬 dev용"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setVerify(null);
            }}
          />
        </div>
        <button type="button" className="btn primary" onClick={() => void handleSave()}>
          {saved ? "저장됨 ✓" : "키 저장"}
        </button>
        <button
          type="button"
          className="btn btn-sm"
          disabled={checking}
          onClick={() => void runVerify()}
        >
          {checking ? "확인 중…" : "연동 확인"}
        </button>
      </div>

      {verify ? (
        <p className={verify.ok ? "trigger-banner" : "form-error"} role="status">
          {verify.message}
        </p>
      ) : null}

      {!hasDartApiKey() ? (
        <p className="hint-box">
          GitHub Pages만 사용 시 키 없이도 corpCode 캐시가 있으면 연동 확인이 통과합니다. 공시는
          시장·시세 탭의 DART 링크를 이용하세요.
        </p>
      ) : null}
    </section>
  );
}
