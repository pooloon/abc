export type BrokerCompanyType = "broker" | "asset_manager";

export interface BrokerBranch {
  id: string;
  companyName: string;
  companyType: BrokerCompanyType;
  province: string;
  district: string;
  branchName: string;
  address: string;
  pensionListed: boolean;
}

export interface BrokerBranchDataset {
  generatedAt: string;
  source: string;
  brokerCount: number;
  assetManagerCount: number;
  branchCount: number;
  branches: BrokerBranch[];
}

export interface PensionBrokerRow {
  no: number;
  field: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
}

export interface PensionAssetManagerRow {
  no: number;
  field: string;
  name: string;
}

export type BrokerLocationView = "provinces" | "districts" | "branches";
