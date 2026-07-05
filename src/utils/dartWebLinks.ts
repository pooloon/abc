/** Open DART 전자공시 웹사이트 (브라우저에서 바로 열람 — API 프록시 불필요) */
export function buildDartSearchUrl(stockCode: string, stockName?: string): string {
  const code = stockCode.padStart(6, "0");
  const query = stockName?.trim() ? `${stockName.trim()} ${code}` : code;
  return `https://dart.fss.or.kr/main/search/search.do?text=${encodeURIComponent(query)}`;
}

export function buildDartCorpDisclosureUrl(stockCode: string): string {
  const code = stockCode.padStart(6, "0");
  return `https://dart.fss.or.kr/html/search/SearchCompany.html?text=${encodeURIComponent(code)}`;
}
