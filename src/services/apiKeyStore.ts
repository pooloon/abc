const API_KEY_STORAGE = "ne-openai-api-key";
const PROXY_URL_STORAGE = "ne-openai-proxy-url";
const KEY_CHANGED_EVENT = "openai-key-changed";

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function getStoredProxyUrl(): string {
  try {
    return localStorage.getItem(PROXY_URL_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function saveOpenAISettings(apiKey: string, proxyUrl: string): void {
  try {
    const trimmedKey = apiKey.trim();
    const trimmedProxy = proxyUrl.trim();

    if (trimmedKey) {
      localStorage.setItem(API_KEY_STORAGE, trimmedKey);
    }

    if (trimmedProxy) {
      localStorage.setItem(PROXY_URL_STORAGE, trimmedProxy);
    } else {
      localStorage.removeItem(PROXY_URL_STORAGE);
    }

    window.dispatchEvent(new CustomEvent(KEY_CHANGED_EVENT));
  } catch {
    throw new Error("브라우저 저장소에 설정을 저장할 수 없습니다.");
  }
}

export function clearStoredApiKey(): void {
  saveOpenAISettings("", getStoredProxyUrl());
}

export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

export function subscribeOpenAISettings(onChange: () => void): () => void {
  const handler = () => onChange();
  window.addEventListener(KEY_CHANGED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(KEY_CHANGED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function hasStoredOpenAIAccess(): boolean {
  return getStoredApiKey().trim().length > 0 || getStoredProxyUrl().trim().length > 0;
}
