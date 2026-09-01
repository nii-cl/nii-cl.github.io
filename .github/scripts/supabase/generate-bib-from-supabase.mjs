#!/usr/bin/env node
// Supabase の `papers` テーブルから全件取得し、_bibliography/papers.bib を再生成する。
// jekyll build の直前に実行することで、Supabase を書誌情報の正として扱う。
//
// 使い方:
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_ANON_KEY=xxxx \
//   node .github/scripts/supabase/generate-bib-from-supabase.mjs [path/to/papers.bib]

import fs from "node:fs";
import { formatBibEntry } from "./lib/bibtex.mjs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const API_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const BIB_PATH = process.argv[2] ?? "_bibliography/papers.bib";

if (!SUPABASE_URL || !API_KEY) {
  console.error("環境変数 SUPABASE_URL と SUPABASE_ANON_KEY を設定してください。");
  process.exit(1);
}

const res = await fetch(`${SUPABASE_URL}/rest/v1/papers?select=*&order=year.desc.nullslast,month.desc.nullslast`, {
  headers: {
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
  },
});

if (!res.ok) {
  console.error(`Supabase からの取得に失敗しました: ${res.status} ${res.statusText}`);
  console.error(await res.text());
  process.exit(1);
}

const rows = await res.json();
const body = rows.map(formatBibEntry).join("\n\n");
const header =
  "% このファイルは Supabase (papers テーブル) から自動生成されています。\n" +
  "% 直接編集しても、次回のビルドで上書きされます。内容を変更する場合は Supabase 側を更新してください。\n";
fs.writeFileSync(BIB_PATH, `---\n---\n${header}\n${body}\n`);

console.log(`${rows.length} 件のエントリを Supabase から取得し、${BIB_PATH} を生成しました。`);
