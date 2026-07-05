#!/usr/bin/env node
/**
 * 공무원연금공단 CSV(거래증권사·위탁운용사) + 지역 매트릭스 → broker-branches.json
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pensionDir = join(root, "public", "data", "pension");
const outPath = join(root, "public", "data", "broker-branches.json");

const KOREA = {
  서울특별시: [
    "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구",
    "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구",
    "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구",
  ],
  부산광역시: [
    "강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구",
    "서구", "수영구", "연제구", "영도구", "중구", "해운대구",
  ],
  대구광역시: ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"],
  인천광역시: [
    "강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구",
  ],
  광주광역시: ["광산구", "남구", "동구", "북구", "서구"],
  대전광역시: ["대덕구", "동구", "서구", "유성구", "중구"],
  울산광역시: ["남구", "동구", "북구", "울주군", "중구"],
  세종특별자치시: ["세종시"],
  경기도: [
    "수원시", "성남시", "고양시", "용인시", "부천시", "안산시", "안양시", "남양주시", "화성시",
    "평택시", "의정부시", "시흥시", "파주시", "김포시", "광명시", "광주시", "군포시", "하남시",
    "오산시", "이천시",
  ],
  강원특별자치도: ["춘천시", "원주시", "강릉시", "동해시", "속초시", "삼척시"],
  충청북도: ["청주시", "충주시", "제천시", "음성군", "진천군"],
  충청남도: ["천안시", "아산시", "서산시", "당진시", "공주시"],
  전북특별자치도: ["전주시", "군산시", "익산시", "정읍시", "남원시"],
  전라남도: ["목포시", "여수시", "순천시", "나주시", "광양시"],
  경상북도: ["포항시", "경주시", "구미시", "김천시", "안동시", "영주시"],
  경상남도: ["창원시", "김해시", "진주시", "양산시", "거제시", "통영시"],
  제주특별자치도: ["제주시", "서귀포시"],
};

const TIER1 = new Set([
  "KB증권", "NH투자증권", "삼성증권", "한국투자증권", "키움증권",
  "신한투자증권", "하나증권", "메리츠증권",
]);

const TIER2 = new Set([
  "대신증권", "유진투자증권", "한화투자증권", "DB증권", "SK증권", "LS증권",
  "IBK투자증권", "현대차증권", "교보증권", "iM증권", "BNK투자증권",
]);

const METRO = new Set([
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "경기도",
]);

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  return lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));
}

function loadBrokers() {
  const path = join(pensionDir, "공무원연금공단_국내 주식 거래증권사_20251231.csv");
  const rows = parseCsv(readFileSync(path, "utf8"));
  const names = new Set();
  for (const row of rows) {
    for (let i = 2; i <= 5; i += 1) {
      if (row[i]) names.add(row[i]);
    }
  }
  return [...names].sort();
}

function loadAssetManagers() {
  const path = join(pensionDir, "공무원연금공단_국내 주식 위탁운용사_20251231.csv");
  const rows = parseCsv(readFileSync(path, "utf8"));
  return rows.map((r) => r[2]).filter(Boolean).sort();
}

function hashPick(list, seed, count) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const picked = [];
  const copy = [...list];
  while (picked.length < count && copy.length > 0) {
    h = (h * 1103515245 + 12345) >>> 0;
    const idx = h % copy.length;
    picked.push(copy.splice(idx, 1)[0]);
  }
  return picked;
}

function branchAddress(province, district, company) {
  if (province === "서울특별시") {
    return `서울특별시 ${district} (접근 거점 · ${company})`;
  }
  if (province.endsWith("광역시")) {
    return `${province} ${district} (접근 거점 · ${company})`;
  }
  if (province === "세종특별자치시") {
    return `세종특별자치시 (접근 거점 · ${company})`;
  }
  return `${province} ${district} (접근 거점 · ${company})`;
}

function selectBrokersForDistrict(province, district, allBrokers) {
  const tier1 = allBrokers.filter((b) => TIER1.has(b));
  const tier2 = allBrokers.filter((b) => TIER2.has(b));
  const tier3 = allBrokers.filter((b) => !TIER1.has(b) && !TIER2.has(b));

  const selected = new Set(tier1);

  if (METRO.has(province) || province === "세종특별자치시") {
    for (const b of tier2) selected.add(b);
    for (const b of hashPick(tier3, `${province}-${district}`, 4)) selected.add(b);
  } else if (province === "제주특별자치도") {
    for (const b of hashPick(tier2, `${province}-${district}`, 5)) selected.add(b);
    for (const b of hashPick(tier3, `${province}-${district}-t3`, 2)) selected.add(b);
  } else {
    for (const b of hashPick(tier2, `${province}-${district}`, 6)) selected.add(b);
    for (const b of hashPick(tier3, `${province}-${district}-t3`, 3)) selected.add(b);
  }

  return [...selected].sort();
}

function main() {
  const brokers = loadBrokers();
  const assetManagers = loadAssetManagers();
  const branches = [];
  let id = 1;

  for (const [province, districts] of Object.entries(KOREA)) {
    for (const district of districts) {
      const companies = selectBrokersForDistrict(province, district, brokers);
      for (const company of companies) {
        branches.push({
          id: String(id++),
          companyName: company,
          companyType: "broker",
          province,
          district,
          branchName: `${company} ${district.replace(/시|군|구$/, "")} 접근점`,
          address: branchAddress(province, district, company),
          pensionListed: true,
        });
      }
    }
  }

  const amDistricts = ["강남구", "영등포구", "중구", "서초구"];
  for (const manager of assetManagers) {
    for (const district of amDistricts) {
      branches.push({
        id: String(id++),
        companyName: manager,
        companyType: "asset_manager",
        province: "서울특별시",
        district,
        branchName: `${manager} 본사(기관)`,
        address: `서울특별시 ${district} · ${manager} (위탁운용 · 공무원연금공단 거래 목록)`,
        pensionListed: true,
      });
    }
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: "2025-12-31",
        source: "공무원연금공단_국내주식_거래증권사·위탁운용사_20251231",
        brokerCount: brokers.length,
        assetManagerCount: assetManagers.length,
        branchCount: branches.length,
        branches,
      },
      null,
      2,
    ),
  );

  console.log(`wrote ${branches.length} branches (${brokers.length} brokers, ${assetManagers.length} AM) → public/data/broker-branches.json`);
}

main();
