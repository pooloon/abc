/** Open DART API URL (dev proxy · Vercel/Netlify rewrites · optional proxy URL) */
export function getDartProxyBase(): string {
  try {
    const custom = localStorage.getItem("dart_proxy_base")?.trim();
    if (custom) return custom.replace(/\/$/, "");
  } catch {
    /* ignore */
  }
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "");
  return `${base}/api/dart`;
}

export function saveDartProxyBase(url: string): void {
  const trimmed = url.trim().replace(/\/$/, "");
  if (trimmed) {
    localStorage.setItem("dart_proxy_base", trimmed);
  } else {
    localStorage.removeItem("dart_proxy_base");
  }
}

export function getDartProxyBaseForSettings(): string {
  try {
    return localStorage.getItem("dart_proxy_base") ?? "";
  } catch {
    return "";
  }
}

export function buildDartApiUrl(endpoint: string, params: URLSearchParams): string {
  const base = getDartProxyBase();
  const path = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${base}/${path}?${params.toString()}`;
}

export function buildDartStaticCorpUrl(): string {
  return `${import.meta.env.BASE_URL}dart-corp-code.json`;
}
