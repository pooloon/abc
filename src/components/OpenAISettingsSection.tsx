import { useEffect, useState } from "react";
import {
  clearStoredApiKey,
  getStoredApiKey,
  getStoredProxyUrl,
  maskApiKey,
  saveOpenAISettings,
} from "../services/apiKeyStore";
import { getOpenAIConfig, hasOpenAIKey } from "../config/openai";

export default function OpenAISettingsSection() {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [proxyUrlInput, setProxyUrlInput] = useState("");
  const [savedKey, setSavedKey] = useState(getStoredApiKey());
  const [message, setMessage] = useState("");
  const runtimeKey = getOpenAIConfig().apiKey;
  const configured = hasOpenAIKey();

  useEffect(() => {
    setSavedKey(getStoredApiKey());
    setProxyUrlInput(getStoredProxyUrl());
  }, []);

  const handleSave = () => {
    if (!apiKeyInput.trim() && !savedKey && !proxyUrlInput.trim()) {
      setMessage("API 키 또는 프록시 URL 중 하나 이상을 입력하세요.");
      return;
    }

    try {
      saveOpenAISettings(apiKeyInput, proxyUrlInput);
      setSavedKey(getStoredApiKey());
      setProxyUrlInput(getStoredProxyUrl());
      setApiKeyInput("");
      setMessage("AI 설정을 이 기기에 저장했습니다. GitHub에는 올라가지 않습니다.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "저장에 실패했습니다.");
    }
  };

  const handleClearKey = () => {
    clearStoredApiKey();
    setSavedKey("");
    setApiKeyInput("");
    setMessage("브라우저에 저장된 API 키를 삭제했습니다.");
  };

  return (
    <section className="panel">
      <h2>AI 도우미 · OpenAI GPT</h2>
      <p className="panel-desc">
        GPT API 키는 <strong>브라우저에만</strong> 저장됩니다. 또는{" "}
        <code>index.html</code>의 <code>window.__NE_CONFIG__.openai.apiKey</code>에 sk- 키를
        넣을 수 있습니다 (localStorage가 우선).
      </p>

      {configured ? (
        <p className="pack-banner">
          API 키 상태: <strong>설정됨</strong>
          {savedKey ? (
            <>
              {" "}
              (저장됨: <code>{maskApiKey(savedKey)}</code>)
            </>
          ) : runtimeKey ? (
            <> (index.html / .env)</>
          ) : null}
        </p>
      ) : (
        <p className="hint-box">OpenAI API 키가 없으면 AI 도우미를 사용할 수 없습니다.</p>
      )}

      <div className="field">
        <label htmlFor="openai-api-key">OpenAI API 키</label>
        <input
          id="openai-api-key"
          type="password"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          placeholder={savedKey ? "새 키로 교체하려면 입력" : "sk-..."}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="field">
        <label htmlFor="openai-proxy-url">프록시 URL (선택)</label>
        <input
          id="openai-proxy-url"
          type="url"
          value={proxyUrlInput}
          onChange={(e) => setProxyUrlInput(e.target.value)}
          placeholder="https://your-worker.example.com/v1/chat/completions"
          autoComplete="off"
        />
        <span className="field-hint">
          GitHub Pages 등 공개 배포에서 CORS 오류가 나면 프록시 URL을 입력하세요.
        </span>
      </div>

      <div className="form-actions-row">
        <button type="button" className="btn primary" onClick={handleSave}>
          키 저장
        </button>
        {savedKey ? (
          <button type="button" className="btn" onClick={handleClearKey}>
            키 삭제
          </button>
        ) : null}
      </div>

      {message ? <p className="form-error">{message}</p> : null}
    </section>
  );
}
