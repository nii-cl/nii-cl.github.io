// papers.bib と Supabase の `papers` テーブル間で BibTeX エントリを
// 相互変換するための最小限のパーサー・フォーマッター。
// 汎用の BibTeX 仕様全体はカバーせず、_bibliography/papers.bib で
// 実際に使われている記法（{} で囲んだ値 / 裸のマクロ値 / ネストした {} ）のみを対象とする。

export const KNOWN_COLUMNS = [
  "title",
  "author",
  "year",
  "month",
  "journal",
  "booktitle",
  "publisher",
  "volume",
  "number",
  "pages",
  "doi",
  "url",
  "abstract",
  "award",
  "award_name",
];

// 生成時のフィールド並び順（_layouts/bib.liquid や慣習に合わせた読みやすい順序）
const FIELD_ORDER = [
  "title",
  "author",
  "editor",
  "booktitle",
  "journal",
  "publisher",
  "series",
  "address",
  "location",
  "year",
  "month",
  "volume",
  "number",
  "pages",
  "articleno",
  "numpages",
  "isbn",
  "issn",
  "doi",
  "url",
  "note",
  "keywords",
  "abstract",
  "abbr",
  "additional_info",
  "altmetric",
  "annotation",
  "arxiv",
  "award",
  "award_name",
  "bibtex_show",
  "blog",
  "code",
  "dimensions",
  "eprint",
  "archivePrefix",
  "primaryClass",
  "google_scholar_id",
  "hal",
  "html",
  "inspirehep_id",
  "pdf",
  "pmid",
  "poster",
  "preprint",
  "preview",
  "selected",
  "slides",
  "supp",
  "video",
  "website",
];

export function parseBibFile(content) {
  const body = content.replace(/^---\r?\n---\r?\n/, "");
  const entries = [];
  let i = 0;
  while (i < body.length) {
    const at = body.indexOf("@", i);
    if (at === -1) break;
    const braceOpen = body.indexOf("{", at);
    if (braceOpen === -1) break;
    const entryType = body.slice(at + 1, braceOpen).trim().toLowerCase();

    let depth = 1;
    let j = braceOpen + 1;
    while (j < body.length && depth > 0) {
      if (body[j] === "{") depth++;
      else if (body[j] === "}") depth--;
      j++;
    }
    entries.push(parseEntry(entryType, body.slice(braceOpen + 1, j - 1)));
    i = j;
  }
  return entries;
}

function parseEntry(entryType, inner) {
  let depth = 0;
  let k = 0;
  while (k < inner.length) {
    const c = inner[k];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === "," && depth === 0) break;
    k++;
  }
  const citationKey = inner.slice(0, k).trim();
  const raw = {};
  for (const chunk of splitFields(inner.slice(k + 1))) {
    const eq = chunk.indexOf("=");
    if (eq === -1) continue;
    const name = chunk.slice(0, eq).trim().toLowerCase();
    if (name) raw[name] = unwrapValue(chunk.slice(eq + 1).trim());
  }
  return { entryType, citationKey, raw };
}

function splitFields(str) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === "," && depth === 0) {
      parts.push(str.slice(start, i));
      start = i + 1;
    }
  }
  const last = str.slice(start);
  if (last.trim()) parts.push(last);
  return parts.filter((p) => p.trim().length > 0);
}

function unwrapValue(value) {
  value = value.trim();
  if (value.startsWith("{") && value.endsWith("}")) {
    let depth = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === "{") depth++;
      else if (value[i] === "}") {
        depth--;
        if (depth === 0 && i !== value.length - 1) return value; // 外側が完全に対応していない
      }
    }
    return value.slice(1, -1);
  }
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  return value; // 裸の語・数値・マクロ（例: month = oct）
}

// 解析済みエントリを Supabase `papers` テーブルの1行に変換する
export function toDbRow(entry) {
  const { entryType, citationKey, raw } = entry;
  const known = new Set([...KNOWN_COLUMNS, "selected"]);
  const extra = {};
  for (const [name, value] of Object.entries(raw)) {
    if (!known.has(name)) extra[name] = value;
  }

  const yearRaw = raw.year?.trim();
  const year = yearRaw && /^\d+$/.test(yearRaw) ? parseInt(yearRaw, 10) : null;

  return {
    citation_key: citationKey,
    entry_type: entryType,
    title: raw.title ?? "",
    author: raw.author ?? "",
    year,
    month: raw.month ?? null,
    journal: raw.journal ?? null,
    booktitle: raw.booktitle ?? null,
    publisher: raw.publisher ?? null,
    volume: raw.volume ?? null,
    number: raw.number ?? null,
    pages: raw.pages ?? null,
    doi: raw.doi ?? null,
    url: raw.url ?? null,
    abstract: raw.abstract ?? null,
    selected: (raw.selected ?? "").trim().toLowerCase() === "true",
    award: raw.award ?? null,
    award_name: raw.award_name ?? null,
    extra,
  };
}

// Supabase の1行を BibTeX エントリのテキストに変換する（papers.bib 生成用）
export function formatBibEntry(row) {
  const fields = { ...row.extra };
  for (const col of KNOWN_COLUMNS) {
    const value = row[col];
    if (value !== null && value !== undefined && value !== "") fields[col] = value;
  }
  if (row.selected) fields.selected = "true";

  const orderedNames = [
    ...FIELD_ORDER.filter((name) => fields[name] !== undefined),
    ...Object.keys(fields)
      .filter((name) => !FIELD_ORDER.includes(name))
      .sort(),
  ];

  const lines = [`@${row.entry_type}{${row.citation_key},`];
  for (const name of orderedNames) {
    const value = fields[name];
    if (value === null || value === undefined || value === "") continue;
    const isBareMonth = name === "month" && /^[a-z]{3,9}$/i.test(String(value));
    lines.push(`  ${name} = ${isBareMonth ? value : `{${value}}`},`);
  }
  lines.push("}");
  return lines.join("\n");
}
