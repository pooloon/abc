import { useEffect, useRef, useState } from "react";
import { hasOpenAIKey } from "../config/openai";
import { sendChatMessage, type ChatMessage } from "../services/chatApi";
import { subscribeOpenAISettings } from "../services/apiKeyStore";

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "안녕하세요! Nationality Engine AI 도우미입니다. 순차 전략, 시장·시세, DART 공시, 백테스트, 리포트·알림 사용법을 물어보세요.",
};

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [configured, setConfigured] = useState(hasOpenAIKey);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return subscribeOpenAISettings(() => {
      setConfigured(hasOpenAIKey());
    });
  }, []);

  useEffect(() => {
    if (open) {
      setConfigured(hasOpenAIKey());
    }
  }, [open]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const history = messages.filter((m) => m.role !== "system");
      const reply = await sendChatMessage(history, text);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="chatbot" aria-label="AI 투자 도우미">
      <button
        type="button"
        className={`chatbot-toggle ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="chatbot-panel"
      >
        <span className="chatbot-toggle-icon" aria-hidden="true">
          ✦
        </span>
        <span className="chatbot-toggle-text">
          <strong>AI 투자 도우미</strong>
          <small>{open ? "닫기" : "GPT 질문하기"}</small>
        </span>
        <span className="chatbot-chevron" aria-hidden="true">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div id="chatbot-panel" className="chatbot-panel">
          {!configured && (
            <p className="chatbot-setup-hint">
              <strong>재무·설정</strong> → <strong>AI 도우미</strong>에서 OpenAI API 키를
              저장하거나, <code>index.html</code>의 <code>__NE_CONFIG__.openai.apiKey</code>에
              sk- 키를 입력하세요.
            </p>
          )}

          <div className="chatbot-messages" ref={listRef} role="log">
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={`chatbot-bubble ${msg.role === "user" ? "user" : "assistant"}`}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="chatbot-bubble assistant chatbot-loading">답변 생성 중…</div>
            )}
          </div>

          {error ? <p className="chatbot-error">{error}</p> : null}

          <form
            className="chatbot-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder="예: 순차 전략 Phase 1은 어떤 종목부터 매수하나요?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              className="chatbot-send"
              disabled={loading || !input.trim()}
            >
              전송
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
