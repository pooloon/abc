import {
  getStoredApiKey,
  getStoredProxyUrl,
  hasStoredOpenAIAccess,
} from "../services/apiKeyStore";

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  proxyUrl: string;
}

const DEFAULT_MODEL = "gpt-4o-mini";

function fromRuntimeConfig(): Partial<OpenAIConfig> {
  return window.__NE_CONFIG__?.openai ?? {};
}

export function getOpenAIConfig(): OpenAIConfig {
  const runtime = fromRuntimeConfig();
  const fromEnv = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

  return {
    apiKey: getStoredApiKey().trim() || runtime.apiKey?.trim() || fromEnv?.trim() || "",
    model: runtime.model?.trim() || DEFAULT_MODEL,
    proxyUrl: getStoredProxyUrl().trim() || runtime.proxyUrl?.trim() || "",
  };
}

export function hasOpenAIKey(): boolean {
  return hasStoredOpenAIAccess() || getOpenAIConfig().apiKey.trim().length > 0;
}
