import { useEffect, useState } from "react";
import { getOpenAIConfig, hasOpenAIKey } from "../config/openai";
import {
  clearStoredApiKey,
  getStoredApiKey,
  getStoredProxyUrl,
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
  const [proxyUrlInput, setProxyUrlInput] = useState("");
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
    setProxyUrlInput(getStoredProxyUrl());
  }, []);

  const handleSave = async () => {
    if (!apiKeyInput.trim() && !savedKey && !proxyUrlInput.trim()) {
      setMessageOk(false);
      setMessage("API 키 또는 프록시 URL 중 하나 이상을 입력하세요.");
      return;
    }

    try {
      saveOpenAISettings(apiKeyInput, proxyUrlInput);
      setSavedKey(getStoredApiKey());
      setProxyUrlInput(getStoredProxyUrl());
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
        <code>index.html</code>에 넣으려면 수정 후 <strong>커밋·재배포</strong>가 필요합니다.
        GitHub Pages에서는 OpenAI CORS 때문에 <strong>프록시 URL</strong>이 필요할 수 있습니다.
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

      <div className="field">
        <label htmlFor="openai-proxy-url">프록시 URL (GitHub Pages 필수에 가까움)</label>
        <input
          id="openai-proxy-url"
          type="url"
          value={proxyUrlInput}
          onChange={(e) => setProxyUrlInput(e.target.value)}
          placeholder="https://your-worker.example.com/v1/chat/completions"
          autoComplete="off"
        />
        <span className="field-hint">
          로컬(`npm run dev`)은 /openai-api 프록시 자동. Vercel/Netlify도 rewrites 지원. GitHub
          Pages만 직접 프록시 없음.
        </span>
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
