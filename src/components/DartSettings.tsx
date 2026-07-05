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
        <a href="https://opendart.fss.or.kr/" target="_blank" rel="noreferrer">
          opendart.fss.or.kr
        </a>
        에서 API 키를 발급받아 입력하세요. 공시·기업개요·재무제표 조회에 사용됩니다.
        {import.meta.env.VITE_DART_API_KEY ? " (.env 키 설정됨)" : ""}
      </p>
      <div className="field-row">
        <div className="field">
          <label htmlFor="dart-key">DART API Key</label>
          <input
            id="dart-key"
            type="password"
            placeholder="40자 인증키"
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
          disabled={checking || !hasDartApiKey()}
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

      {!hasDartApiKey() && !import.meta.env.VITE_DART_API_KEY ? (
        <p className="hint-box">API 키 없으면 KRX 종목은 조회되지만 공시는 표시되지 않습니다.</p>
      ) : null}
    </section>
  );
}
