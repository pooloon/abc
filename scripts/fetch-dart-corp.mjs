#!/usr/bin/env node
/**
 * Build-time: Open DART corpCode.xml → public/dart-corp-code.json
 * Usage: DART_API_KEY=xxx node scripts/fetch-dart-corp.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const key = process.env.DART_API_KEY?.trim() || process.env.VITE_DART_API_KEY?.trim();
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "public", "dart-corp-code.json");

if (!key) {
  console.log("skip: DART_API_KEY not set — dart-corp-code.json not generated");
  process.exit(0);
}

const url = `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${encodeURIComponent(key)}`;
const res = await fetch(url);
if (!res.ok) {
  console.error(`DART corpCode download failed: HTTP ${res.status}`);
  process.exit(1);
}

const buffer = await res.arrayBuffer();
const zip = await JSZip.loadAsync(buffer);
const xmlFile = zip.file("CORPCODE.xml");
if (!xmlFile) {
  console.error("CORPCODE.xml not found in zip");
  process.exit(1);
}

const xml = await xmlFile.async("text");
const map = {};
const listRegex = /<list>([\s\S]*?)<\/list>/g;
let match = listRegex.exec(xml);
while (match) {
  const block = match[1];
  const stock = block.match(/<stock_code>([^<]*)<\/stock_code>/)?.[1]?.trim();
  const corp = block.match(/<corp_code>([^<]*)<\/corp_code>/)?.[1]?.trim();
  if (stock && corp && stock.length === 6) {
    map[stock] = corp;
  }
  match = listRegex.exec(xml);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(map));
console.log(`wrote ${Object.keys(map).length} corp codes → public/dart-corp-code.json`);
