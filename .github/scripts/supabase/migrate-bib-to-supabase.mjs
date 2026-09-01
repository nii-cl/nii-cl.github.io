#!/usr/bin/env node
// _bibliography/papers.bib の内容を Supabase の `papers` テーブルへ一度だけ投入する移行スクリプト。
// 事前に supabase/schema.sql を Supabase の SQL Editor で実行しておくこと。
//
// 使い方:
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=xxxx \
//   node .github/scripts/supabase/migrate-bib-to-supabase.mjs [path/to/papers.bib]

import fs from "node:fs";
import { parseBibFile, toDbRow } from "./lib/bibtex.mjs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BIB_PATH = process.argv[2] ?? "_bibliography/papers.bib";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("環境変数 SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください。");
  process.exit(1);
}

const content = fs.readFileSync(BIB_PATH, "utf8");
const entries = parseBibFile(content);
const rows = entries.map(toDbRow);

console.log(`${rows.length} 件のエントリを ${BIB_PATH} から読み込みました。Supabase へ投入します...`);

const res = await fetch(`${SUPABASE_URL}/rest/v1/papers?on_conflict=citation_key`, {
  method: "POST",
  headers: {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=representation",
  },
  body: JSON.stringify(rows),
});

if (!res.ok) {
  console.error(`投入に失敗しました: ${res.status} ${res.statusText}`);
  console.error(await res.text());
  process.exit(1);
}

const inserted = await res.json();
console.log(`完了: ${inserted.length} 件を投入/更新しました。`);
