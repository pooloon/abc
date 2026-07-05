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

function resolveEndpoint(): string {
  const { proxyUrl } = getOpenAIConfig();
  const trimmedProxy = proxyUrl.trim();
  if (trimmedProxy) return trimmedProxy;

  const base = import.meta.env.BASE_URL.replace(/\/?$/, "");
  return `${base}/openai-api/v1/chat/completions`;
}

function buildHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey.trim()) {
    headers.Authorization = `Bearer ${apiKey.trim()}`;
  }

  return headers;
}

function mapFetchError(err: unknown): Error {
  if (err instanceof TypeError) {
    return new Error(
      "OpenAI API 연결 실패(CORS). GitHub Pages에서는 챗봇이 제한됩니다. npm run dev 로컬 실행을 사용하세요.",
    );
  }
  return err instanceof Error ? err : new Error("알 수 없는 오류가 발생했습니다.");
}

export async function testOpenAIConnection(): Promise<{ ok: boolean; message: string }> {
  const { apiKey, model } = getOpenAIConfig();
  if (!apiKey.trim()) {
    return {
      ok: false,
      message:
        "API 키가 없습니다. sk- 키를 재무·설정에 저장하거나 index.html의 __NE_CONFIG__.openai.apiKey에 입력 후 재배포하세요.",
    };
  }

  try {
    const response = await fetch(resolveEndpoint(), {
      method: "POST",
      headers: buildHeaders(apiKey),
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      }),
    });

    let data: ChatCompletionResponse;
    try {
      data = (await response.json()) as ChatCompletionResponse;
    } catch {
      if (!response.ok && response.status === 404) {
        return {
          ok: false,
          message:
            "OpenAI API 경로를 찾을 수 없습니다(404). GitHub Pages에서는 챗봇이 제한됩니다. npm run dev 로컬 실행을 사용하세요.",
        };
      }
      return { ok: false, message: "서버 응답을 JSON으로 읽을 수 없습니다." };
    }

    if (!response.ok) {
      const msg =
        data.error?.message ??
        (response.status === 401
          ? "API 키가 올바르지 않습니다."
          : `요청 실패 (${response.status})`);
      return { ok: false, message: msg };
    }

    return { ok: true, message: `연동 성공 · 모델 ${model}` };
  } catch (err) {
    return { ok: false, message: mapFetchError(err).message };
  }
}

export async function sendChatMessage(
  history: ChatMessage[],
  userText: string,
): Promise<string> {
  const { apiKey, model } = getOpenAIConfig();

  if (!apiKey.trim()) {
    throw new Error(
      "API 키가 없습니다. 재무·설정 → AI 도우미에서 sk- 키를 저장하거나 index.html __NE_CONFIG__에 입력하세요.",
    );
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

  let response: Response;
  try {
    response = await fetch(resolveEndpoint(), {
      method: "POST",
      headers: buildHeaders(apiKey),
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw mapFetchError(err);
  }

  let data: ChatCompletionResponse;
  try {
    data = (await response.json()) as ChatCompletionResponse;
  } catch {
    if (response.status === 404) {
      throw new Error(
        "GitHub Pages에서는 OpenAI CORS 제한으로 챗봇을 사용할 수 없습니다. npm run dev 로컬 실행을 사용하세요.",
      );
    }
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
