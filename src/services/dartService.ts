import JSZip from "jszip";
import type {
  DartCompanySummary,
  DartDisclosure,
  DartFinancialReport,
  DartFinancialRow,
} from "../types/krxDart";
import {
  buildDartApiUrl,
  buildDartStaticCorpUrl,
} from "../utils/dartApiBase";

const CORP_CACHE_KEY = "dart_corp_code_map";
const CORP_CACHE_EXPIRY_KEY = "dart_corp_code_expiry";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface DartListResponse {
  status: string;
  message: string;
  list?: Array<{
    corp_code: string;
    corp_name: string;
    stock_code: string;
    report_nm: string;
    rcept_no: string;
    rcept_dt: string;
    flr_nm: string;
  }>;
}

interface DartCompanyResponse {
  status: string;
  message: string;
  corp_code?: string;
  corp_name?: string;
  stock_code?: string;
  ceo_nm?: string;
  induty_code?: string;
  est_dt?: string;
  hm_url?: string;
}

export function getDartApiKey(): string {
  const fromEnv = import.meta.env.VITE_DART_API_KEY as string | undefined;
  if (fromEnv?.trim()) return fromEnv.trim();
  return localStorage.getItem("dart_api_key") ?? "";
}

export function saveDartApiKey(key: string): void {
  localStorage.setItem("dart_api_key", key.trim());
}

export function hasDartApiKey(): boolean {
  return getDartApiKey().length > 0;
}

export interface DartKeyVerifyResult {
  ok: boolean;
  message: string;
  corpCount?: number;
}

export async function verifyDartApiKey(apiKey?: string): Promise<DartKeyVerifyResult> {
  const staticMap = await loadCorpCodeFromStatic();
  if (staticMap && staticMap.size > 0) {
    return {
      ok: true,
      message: `연동 성공 · 빌드 캐시 corpCode ${staticMap.size.toLocaleString()}건`,
      corpCount: staticMap.size,
    };
  }

  const key = (apiKey ?? getDartApiKey()).trim();
  if (!key) {
    return { ok: false, message: "API 키가 비어 있습니다. (로컬 dev 또는 GitHub Secret 재배포)" };
  }
  if (key.length < 20) {
    return { ok: false, message: "Open DART 인증키 형식이 올바르지 않습니다. (40자)" };
  }

  try {
    const map = await loadCorpCodeMap(key);
    if (map.size === 0) {
      return { ok: false, message: "corpCode 맵이 비어 있습니다. 키를 확인하세요." };
    }
    return {
      ok: true,
      message: `연동 성공 · 상장사 corpCode ${map.size.toLocaleString()}건 로드됨`,
      corpCount: map.size,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "DART API 연동 검증 실패",
    };
  }
}

function parseCorpCodeXml(xml: string): Map<string, string> {
  const map = new Map<string, string>();
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const lists = doc.getElementsByTagName("list");
  for (let i = 0; i < lists.length; i += 1) {
    const node = lists[i];
    const corpCode = node.getElementsByTagName("corp_code")[0]?.textContent?.trim();
    const stockCode = node.getElementsByTagName("stock_code")[0]?.textContent?.trim();
    if (corpCode && stockCode && stockCode.length === 6) {
      map.set(stockCode, corpCode);
    }
  }
  return map;
}

function loadCachedCorpMap(): Map<string, string> | null {
  const expiry = localStorage.getItem(CORP_CACHE_EXPIRY_KEY);
  if (!expiry || Date.now() > Number(expiry)) return null;
  try {
    const raw = localStorage.getItem(CORP_CACHE_KEY);
    if (!raw) return null;
    return new Map(Object.entries(JSON.parse(raw) as Record<string, string>));
  } catch {
    return null;
  }
}

function saveCachedCorpMap(map: Map<string, string>): void {
  localStorage.setItem(CORP_CACHE_KEY, JSON.stringify(Object.fromEntries(map)));
  localStorage.setItem(CORP_CACHE_EXPIRY_KEY, String(Date.now() + CACHE_TTL_MS));
}

export async function loadCorpCodeMap(apiKey?: string): Promise<Map<string, string>> {
  const key = apiKey ?? getDartApiKey();
  if (!key) throw new Error("Open DART API 키가 필요합니다.");

  const cached = loadCachedCorpMap();
  if (cached && cached.size > 0) return cached;

  try {
    const params = new URLSearchParams({ crtfc_key: key });
    const res = await fetch(buildDartApiUrl("corpCode.xml", params));
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const buffer = await res.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const xmlFile = zip.file("CORPCODE.xml");
    if (!xmlFile) throw new Error("CORPCODE.xml 파싱 실패");

    const xml = await xmlFile.async("text");
    const map = parseCorpCodeXml(xml);
    if (map.size === 0) throw new Error("corpCode 맵이 비어 있습니다");
    saveCachedCorpMap(map);
    return map;
  } catch (err) {
    const staticMap = await loadCorpCodeFromStatic();
    if (staticMap) {
      saveCachedCorpMap(staticMap);
      return staticMap;
    }

    if (err instanceof TypeError) {
      throw new Error(
        "DART API 연결 실패(CORS). GitHub Pages는 빌드 캐시를 사용하고, 공시는 dart.fss.or.kr 링크로 열람하세요.",
      );
    }

    const detail = err instanceof Error ? err.message : "알 수 없음";
    throw new Error(
      `DART corpCode 다운로드 실패 (${detail}). GitHub Secrets에 DART_API_KEY 설정 후 Actions 재배포하거나 npm run dev를 사용하세요.`,
    );
  }
}

async function loadCorpCodeFromStatic(): Promise<Map<string, string> | null> {
  try {
    const res = await fetch(buildDartStaticCorpUrl());
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, string>;
    const map = new Map(Object.entries(data));
    return map.size > 0 ? map : null;
  } catch {
    return null;
  }
}

export async function resolveCorpCode(stockCode: string, apiKey?: string): Promise<string | null> {
  const map = await loadCorpCodeMap(apiKey);
  return map.get(stockCode.padStart(6, "0")) ?? null;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export async function fetchDisclosures(
  stockCode: string,
  options?: { days?: number; pageCount?: number; apiKey?: string },
): Promise<DartDisclosure[]> {
  const key = options?.apiKey ?? getDartApiKey();
  if (!key) throw new Error("Open DART API 키가 필요합니다.");

  const corpCode = await resolveCorpCode(stockCode, key);
  if (!corpCode) return [];

  const days = options?.days ?? 180;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  const params = new URLSearchParams({
    crtfc_key: key,
    corp_code: corpCode,
    bgn_de: formatDate(start),
    end_de: formatDate(end),
    page_no: "1",
    page_count: String(options?.pageCount ?? 20),
  });

  const res = await fetch(buildDartApiUrl("list.json", params));
  const json = (await res.json()) as DartListResponse;

  if (json.status !== "000") {
    if (json.status === "013") return [];
    throw new Error(json.message || "DART 공시 조회 실패");
  }

  return (json.list ?? []).map((row) => ({
    corpCode: row.corp_code,
    corpName: row.corp_name,
    stockCode: row.stock_code,
    reportName: row.report_nm,
    receiptNo: row.rcept_no,
    receiptDate: row.rcept_dt,
    submitter: row.flr_nm,
    reportUrl: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${row.rcept_no}`,
  }));
}

export async function fetchCompanySummary(
  stockCode: string,
  apiKey?: string,
): Promise<DartCompanySummary | null> {
  const key = apiKey ?? getDartApiKey();
  if (!key) return null;

  const corpCode = await resolveCorpCode(stockCode, key);
  if (!corpCode) return null;

  const params = new URLSearchParams({ crtfc_key: key, corp_code: corpCode });
  const res = await fetch(buildDartApiUrl("company.json", params));
  const json = (await res.json()) as DartCompanyResponse;

  if (json.status !== "000" || !json.corp_name) return null;

  return {
    corpCode: json.corp_code ?? corpCode,
    corpName: json.corp_name,
    stockCode: json.stock_code ?? stockCode,
    ceoName: json.ceo_nm ?? "",
    industry: json.induty_code ?? "",
    listingDate: json.est_dt ?? "",
    homepage: json.hm_url ?? "",
  };
}

interface DartFinancialResponse {
  status: string;
  message: string;
  list?: Array<{
    account_nm: string;
    thstrm_amount: string;
    frmtrm_amount: string;
    currency: string;
  }>;
}

const REPORT_CODES: { code: string; label: string }[] = [
  { code: "11011", label: "사업보고서" },
  { code: "11012", label: "반기보고서" },
  { code: "11013", label: "1분기보고서" },
  { code: "11014", label: "3분기보고서" },
];

const KEY_ACCOUNTS = [
  "매출액",
  "영업이익",
  "당기순이익",
  "자산총계",
  "부채총계",
  "자본총계",
  "영업활동현금흐름",
];

function parseAmount(s: string | undefined): number | null {
  if (!s || s === "-") return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function fetchFinancialReport(
  corpCode: string,
  businessYear: string,
  reprtCode: string,
  fsDiv: "CFS" | "OFS",
  apiKey: string,
): Promise<DartFinancialReport | null> {
  const params = new URLSearchParams({
    crtfc_key: apiKey,
    corp_code: corpCode,
    bsns_year: businessYear,
    reprt_code: reprtCode,
    fs_div: fsDiv,
  });

  const res = await fetch(buildDartApiUrl("fnlttSinglAcnt.json", params));
  const json = (await res.json()) as DartFinancialResponse;

  if (json.status !== "000" || !json.list?.length) return null;

  const rows: DartFinancialRow[] = json.list
    .filter((row) => KEY_ACCOUNTS.some((k) => row.account_nm.includes(k)))
    .map((row) => ({
      accountName: row.account_nm,
      currentAmount: parseAmount(row.thstrm_amount),
      previousAmount: parseAmount(row.frmtrm_amount),
      currency: row.currency || "KRW",
    }));

  if (rows.length === 0) return null;

  const label = REPORT_CODES.find((r) => r.code === reprtCode)?.label ?? reprtCode;

  return {
    stockCode: "",
    corpName: "",
    businessYear,
    reportCode: reprtCode,
    reportLabel: label,
    fsDiv,
    rows,
  };
}

export async function fetchLatestFinancials(
  stockCode: string,
  apiKey?: string,
): Promise<DartFinancialReport | null> {
  const key = apiKey ?? getDartApiKey();
  if (!key) throw new Error("Open DART API 키가 필요합니다.");

  const corpCode = await resolveCorpCode(stockCode, key);
  if (!corpCode) return null;

  const company = await fetchCompanySummary(stockCode, key);
  const currentYear = new Date().getFullYear();

  for (let y = 0; y < 3; y += 1) {
    const year = String(currentYear - y);
    for (const { code } of REPORT_CODES) {
      const report = await fetchFinancialReport(corpCode, year, code, "CFS", key);
      if (report) {
        return {
          ...report,
          stockCode,
          corpName: company?.corpName ?? "",
        };
      }
    }
  }

  return null;
}
