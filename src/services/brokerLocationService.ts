import type {
  BrokerBranch,
  BrokerBranchDataset,
  PensionAssetManagerRow,
  PensionBrokerRow,
} from "../types/brokerLocation";
import {
  KOREA_PROVINCES,
  type KoreaProvince,
  getDistricts,
} from "../data/koreaRegions";

let datasetCache: BrokerBranchDataset | null = null;

function dataUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

export async function loadBrokerBranchDataset(): Promise<BrokerBranchDataset> {
  if (datasetCache) return datasetCache;
  const res = await fetch(dataUrl("data/broker-branches.json"));
  if (!res.ok) throw new Error("증권사 지점 데이터를 불러오지 못했습니다.");
  datasetCache = (await res.json()) as BrokerBranchDataset;
  return datasetCache;
}

export function getProvinces(): readonly KoreaProvince[] {
  return KOREA_PROVINCES;
}

export function getProvinceDistricts(province: KoreaProvince): readonly string[] {
  return getDistricts(province);
}

export async function findBranchesInDistrict(
  province: KoreaProvince,
  district: string,
): Promise<BrokerBranch[]> {
  const data = await loadBrokerBranchDataset();
  return data.branches
    .filter((b) => b.province === province && b.district === district)
    .sort((a, b) => {
      if (a.companyType !== b.companyType) {
        return a.companyType === "broker" ? -1 : 1;
      }
      return a.companyName.localeCompare(b.companyName, "ko");
    });
}

export async function loadPensionBrokerCsv(): Promise<PensionBrokerRow[]> {
  const res = await fetch(dataUrl("data/pension/공무원연금공단_국내 주식 거래증권사_20251231.csv"));
  if (!res.ok) return [];
  const text = await res.text();
  return parseBrokerCsv(text);
}

export async function loadPensionAssetManagerCsv(): Promise<PensionAssetManagerRow[]> {
  const res = await fetch(
    dataUrl("data/pension/공무원연금공단_국내 주식 위탁운용사_20251231.csv"),
  );
  if (!res.ok) return [];
  const text = await res.text();
  return parseAssetManagerCsv(text);
}

function parseBrokerCsv(text: string): PensionBrokerRow[] {
  const lines = text.trim().split(/\r?\n/).slice(1);
  return lines
    .map((line) => line.split(",").map((c) => c.trim()))
    .filter((cols) => cols.length >= 6)
    .map((cols) => ({
      no: Number(cols[0]),
      field: cols[1],
      q1: cols[2],
      q2: cols[3],
      q3: cols[4],
      q4: cols[5],
    }));
}

function parseAssetManagerCsv(text: string): PensionAssetManagerRow[] {
  const lines = text.trim().split(/\r?\n/).slice(1);
  return lines
    .map((line) => line.split(",").map((c) => c.trim()))
    .filter((cols) => cols.length >= 3)
    .map((cols) => ({
      no: Number(cols[0]),
      field: cols[1],
      name: cols[2],
    }));
}

export function companyTypeLabel(type: BrokerBranch["companyType"]): string {
  switch (type) {
    case "broker":
      return "거래증권사";
    case "asset_manager":
      return "위탁운용사";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export async function getDatasetMeta(): Promise<{
  source: string;
  generatedAt: string;
  brokerCount: number;
  assetManagerCount: number;
}> {
  const data = await loadBrokerBranchDataset();
  return {
    source: data.source,
    generatedAt: data.generatedAt,
    brokerCount: data.brokerCount,
    assetManagerCount: data.assetManagerCount,
  };
}
