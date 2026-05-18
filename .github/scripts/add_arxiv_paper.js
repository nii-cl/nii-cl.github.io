#!/usr/bin/env node
"use strict";

const fs = require("fs");

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function extractArxivId(text) {
  const match = text.match(/(\d{4}\.\d{4,5})(?:v\d+)?/);
  if (!match) throw new Error(`arXiv IDが見つかりません: ${JSON.stringify(text)}`);
  return match[1];
}

async function fetchMetadata(arxivId) {
  const url = `https://export.arxiv.org/api/query?id_list=${arxivId}`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "GitHub-Actions/add_arxiv_paper (senry-senry/website; Node.js)" },
  });
  if (!resp.ok) throw new Error(`HTTP error: ${resp.status}`);
  const xml = await resp.text();
  console.debug("[debug] raw XML (first 500 chars):", xml.slice(0, 500));

  const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
  if (!entryMatch) throw new Error(`arXiv ID ${JSON.stringify(arxivId)} が見つかりません`);
  const entry = entryMatch[1];
  console.debug("[debug] entry block:", entry.slice(0, 300));

  const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
  if (!titleMatch) throw new Error("title not found");
  const title = titleMatch[1].trim().replace(/\s+/g, " ");
  console.debug("[debug] title:", title);

  const authors = [];
  const authorRegex = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g;
  let authorMatch;
  while ((authorMatch = authorRegex.exec(entry)) !== null) {
    const name = authorMatch[1].trim();
    const spaceIdx = name.lastIndexOf(" ");
    if (spaceIdx !== -1) {
      authors.push(`${name.slice(spaceIdx + 1)}, ${name.slice(0, spaceIdx)}`);
    } else {
      authors.push(name);
    }
  }
  console.debug("[debug] authors:", authors);

  const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
  if (!publishedMatch) throw new Error("published date not found");
  const dt = new Date(publishedMatch[1].trim());
  console.debug("[debug] published:", publishedMatch[1].trim(), "→ year:", dt.getUTCFullYear(), "month:", MONTHS[dt.getUTCMonth()]);

  return { title, authors, year: dt.getUTCFullYear(), month: MONTHS[dt.getUTCMonth()], arxivId };
}

function makeKey(meta) {
  const last = meta.authors[0]
    .split(",")[0]
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const word = meta.title
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return `${last}${meta.year}${word}`;
}

function makeBibtex(meta) {
  const key = makeKey(meta);
  const { arxivId } = meta;
  const entry = [
    `@article{${key},`,
    `  title   = {${meta.title}},`,
    `  author  = {${meta.authors.join(" and ")}},`,
    `  journal = {arXiv preprint arXiv:${arxivId}},`,
    `  year    = {${meta.year}},`,
    `  month   = ${meta.month},`,
    `  abbr    = {Preprint},`,
    `  arxiv   = {${arxivId}},`,
    `  html    = {https://arxiv.org/abs/${arxivId}},`,
    `  pdf     = {https://arxiv.org/pdf/${arxivId}},`,
    `}`,
  ].join("\n");
  return { entry, key };
}

function insertIntoBib(bibtex, bibPath, arxivId) {
  const content = fs.readFileSync(bibPath, "utf8");
  console.debug("[debug] bib file (first 100 chars):", content.slice(0, 100));
  if (content.includes(arxivId)) {
    throw new Error(`arXiv ID ${arxivId} は既に papers.bib に存在します`);
  }
  // Jekyll front matter ends with "---\n---\n"
  const insertPos = content.indexOf("---\n", 3) + 4;
  console.debug("[debug] insertPos:", insertPos, "(content length:", content.length, ")");
  fs.writeFileSync(bibPath, content.slice(0, insertPos) + "\n" + bibtex + "\n" + content.slice(insertPos), "utf8");
}

function setOutput(key, value) {
  const githubOutput = process.env.GITHUB_OUTPUT || "";
  if (githubOutput) fs.appendFileSync(githubOutput, `${key}=${value}\n`);
  console.log(`[output] ${key}=${value}`);
}

async function main() {
  const issueBody = process.env.ISSUE_BODY || "";
  const bibPath = process.env.BIB_PATH || "_bibliography/papers.bib";

  const githubOutput = process.env.GITHUB_OUTPUT || "";
  if (githubOutput) {
    fs.appendFileSync(githubOutput, "success=false\n");
    fs.appendFileSync(githubOutput, "error=スクリプト実行中に予期しないエラーが発生しました\n");
  }

  try {
    const arxivId = extractArxivId(issueBody);
    console.log(`arXiv ID: ${arxivId}`);

    const meta = await fetchMetadata(arxivId);
    console.log(`取得完了: ${meta.title}`);

    const { entry: bibtex, key } = makeBibtex(meta);
    insertIntoBib(bibtex, bibPath, arxivId);

    setOutput("success", "true");
    setOutput("error", "");
    setOutput("arxiv_id", arxivId);
    setOutput("title", meta.title);
    setOutput("key", key);
    setOutput("author", meta.authors.join(" and "));
    setOutput("year", String(meta.year));
    setOutput("month", meta.month);
    console.log(`追加完了: ${key}`);
  } catch (e) {
    const errorMsg = e.message || e.constructor.name;
    setOutput("error", errorMsg);
    console.error(`エラー: ${errorMsg}`);
    process.exit(1);
  }
}

main();
