import { useEffect, useState } from "react";
import { getOpenAIConfig, hasOpenAIKey } from "../config/openai";
import {
  clearStoredApiKey,
  getStoredApiKey,
  maskApiKey,
  saveOpenAISettings,
} from "../services/apiKeyStore";
import { testOpenAIConnection } from "../services/chatApi";

function describeKeySources(): string {
  const stored = getStoredApiKey().trim();
  const runtime = window.__NE_CONFIG__?.openai?.apiKey?.trim() ?? "";
  const env = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)?.trim() ?? "";

  if (stored) return `브라우저 저장 (${maskApiKey(stored)})`;
  if (runtime) return `index.html 설정 (${maskApiKey(runtime)})`;
  if (env) return `.env 설정 (${maskApiKey(env)})`;
  return "없음";
}

export default function OpenAISettingsSection() {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savedKey, setSavedKey] = useState(getStoredApiKey());
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const configured = hasOpenAIKey();

  useEffect(() => {
    setSavedKey(getStoredApiKey());
  }, []);

  const handleSave = async () => {
    if (!apiKeyInput.trim() && !savedKey) {
      setMessageOk(false);
      setMessage("OpenAI API 키를 입력하세요.");
      return;
    }

    try {
      saveOpenAISettings(apiKeyInput, "");
      setSavedKey(getStoredApiKey());
      setApiKeyInput("");
      setMessageOk(true);
      setMessage("AI 설정을 이 브라우저에 저장했습니다.");
      setTestResult(null);

      if (apiKeyInput.trim() || getOpenAIConfig().apiKey.trim()) {
        setTesting(true);
        const result = await testOpenAIConnection();
        setTestResult(result);
        setTesting(false);
      }
    } catch (err) {
      setMessageOk(false);
      setMessage(err instanceof Error ? err.message : "저장에 실패했습니다.");
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testOpenAIConnection();
    setTestResult(result);
    setTesting(false);
  };

  const handleClearKey = () => {
    clearStoredApiKey();
    setSavedKey("");
    setApiKeyInput("");
    setTestResult(null);
    setMessageOk(true);
    setMessage("브라우저에 저장된 API 키를 삭제했습니다.");
  };

  return (
    <section className="panel">
      <h2>AI 도우미 · OpenAI GPT</h2>
      <p className="panel-desc">
        sk- 키는 <strong>재무·설정 → 키 저장</strong>으로 브라우저에 저장하세요.{" "}
        <code>npm run dev</code> 로컬 실행 시 챗봇이 동작합니다. GitHub Pages에서는 OpenAI
        CORS 제한으로 챗봇이 제한될 수 있습니다.
      </p>

      <p className="hint-box">
        현재 키 출처: <strong>{describeKeySources()}</strong>
        {configured ? " · 감지됨" : " · 미설정"}
      </p>

      <div className="field">
        <label htmlFor="openai-api-key">OpenAI API 키</label>
        <input
          id="openai-api-key"
          type="password"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          placeholder={savedKey ? "새 키로 교체하려면 입력" : "sk-proj-..."}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="form-actions-row">
        <button type="button" className="btn primary" onClick={() => void handleSave()}>
          키 저장
        </button>
        <button
          type="button"
          className="btn btn-sm"
          disabled={testing || !configured}
          onClick={() => void handleTest()}
        >
          {testing ? "확인 중…" : "연동 확인"}
        </button>
        {savedKey ? (
          <button type="button" className="btn btn-sm" onClick={handleClearKey}>
            키 삭제
          </button>
        ) : null}
      </div>

      {message ? (
        <p className={messageOk ? "trigger-banner" : "form-error"} role="status">
          {message}
        </p>
      ) : null}

      {testResult ? (
        <p className={testResult.ok ? "trigger-banner" : "form-error"} role="status">
          {testResult.message}
        </p>
      ) : null}
    </section>
  );
}
