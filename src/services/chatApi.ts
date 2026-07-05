import { getOpenAIConfig } from "../config/openai";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string };
}

const SYSTEM_PROMPT = `당신은 "Nationality Engine" 투자 설계 AI 도우미입니다.
종목·시세·순차 전략·Reference Pack·ISA/연금·DART 공시·백테스트·통합 리포트·알림 기능을 안내합니다.
한국어로 간결하고 친절하게 답변하세요. 앱 탭(순차 전략, 시장·시세, 백테스트, 통합 리포트, 알림, 재무·설정)을 구체적으로 안내할 수 있습니다.
투자 수익을 보장하지 않으며, 모든 조언은 참고용임을 필요 시 상기하세요.`;

function resolveEndpoint(): { url: string; useProxy: boolean } {
  const { proxyUrl } = getOpenAIConfig();
  const trimmedProxy = proxyUrl.trim();

  if (trimmedProxy) {
    return { url: trimmedProxy, useProxy: true };
  }

  if (import.meta.env.DEV) {
    return { url: "/openai-api/v1/chat/completions", useProxy: true };
  }

  return { url: "https://api.openai.com/v1/chat/completions", useProxy: false };
}

export async function sendChatMessage(
  history: ChatMessage[],
  userText: string,
): Promise<string> {
  const { apiKey, model } = getOpenAIConfig();
  const { url, useProxy } = resolveEndpoint();

  if (!useProxy && !apiKey.trim()) {
    throw new Error(
      "API 키가 없습니다. index.html __NE_CONFIG__ 또는 재무·설정 → AI 도우미에서 OpenAI API 키를 저장하세요.",
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!useProxy || (import.meta.env.DEV && !getOpenAIConfig().proxyUrl.trim())) {
    headers.Authorization = `Bearer ${apiKey.trim()}`;
  }

  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.filter((m) => m.role !== "system"),
      { role: "user", content: userText },
    ],
    temperature: 0.7,
    max_tokens: 900,
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  let data: ChatCompletionResponse;
  try {
    data = (await response.json()) as ChatCompletionResponse;
  } catch {
    throw new Error("서버 응답을 읽을 수 없습니다.");
  }

  if (!response.ok) {
    const msg =
      data.error?.message ??
      (response.status === 401
        ? "API 키가 올바르지 않습니다."
        : `요청 실패 (${response.status})`);
    throw new Error(msg);
  }

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("응답 내용이 비어 있습니다.");
  }

  return reply;
}
