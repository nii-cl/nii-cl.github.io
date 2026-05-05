#!/usr/bin/env python3
"""Fetch arXiv metadata and insert an al-folio BibTeX entry into papers.bib."""

import os
import re
import sys
import requests
import xml.etree.ElementTree as ET
from datetime import datetime

ATOM_NS = "http://www.w3.org/2005/Atom"
MONTHS = ["jan", "feb", "mar", "apr", "may", "jun",
          "jul", "aug", "sep", "oct", "nov", "dec"]


def extract_arxiv_id(text: str) -> str:
    match = re.search(r"(\d{4}\.\d{4,5})(?:v\d+)?", text)
    if not match:
        raise ValueError(f"arXiv IDが見つかりません: {text!r}")
    return match.group(1)


def fetch_metadata(arxiv_id: str) -> dict:
    url = f"http://export.arxiv.org/api/query?id_list={arxiv_id}"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()

    root = ET.fromstring(resp.text)
    entry = root.find(f"{{{ATOM_NS}}}entry")
    if entry is None:
        raise ValueError(f"arXiv ID {arxiv_id!r} が見つかりません")

    title = re.sub(r"\s+", " ", entry.find(f"{{{ATOM_NS}}}title").text.strip())

    authors = []
    for el in entry.findall(f"{{{ATOM_NS}}}author"):
        name = el.find(f"{{{ATOM_NS}}}name").text.strip()
        parts = name.rsplit(" ", 1)
        authors.append(f"{parts[1]}, {parts[0]}" if len(parts) == 2 else name)

    published = entry.find(f"{{{ATOM_NS}}}published").text
    dt = datetime.fromisoformat(published.replace("Z", "+00:00"))

    return {
        "title": title,
        "authors": authors,
        "year": dt.year,
        "month": MONTHS[dt.month - 1],
        "arxiv_id": arxiv_id,
    }


def make_key(meta: dict) -> str:
    last = re.sub(r"[^a-z]", "", meta["authors"][0].split(",")[0].lower())
    word = re.sub(r"[^a-z]", "", meta["title"].split()[0].lower())
    return f"{last}{meta['year']}{word}"


def make_bibtex(meta: dict) -> tuple[str, str]:
    key = make_key(meta)
    arxiv_id = meta["arxiv_id"]
    entry = (
        f"@article{{{key},\n"
        f"  title   = {{{meta['title']}}},\n"
        f"  author  = {{{' and '.join(meta['authors'])}}},\n"
        f"  journal = {{arXiv preprint arXiv:{arxiv_id}}},\n"
        f"  year    = {{{meta['year']}}},\n"
        f"  month   = {meta['month']},\n"
        f"  abbr    = {{Preprint}},\n"
        f"  arxiv   = {{{arxiv_id}}},\n"
        f"  html    = {{https://arxiv.org/abs/{arxiv_id}}},\n"
        f"  pdf     = {{https://arxiv.org/pdf/{arxiv_id}}},\n"
        f"}}"
    )
    return entry, key


def insert_into_bib(bibtex: str, bib_path: str, arxiv_id: str) -> None:
    with open(bib_path, "r") as f:
        content = f.read()

    if arxiv_id in content:
        raise ValueError(f"arXiv ID {arxiv_id} は既に papers.bib に存在します")

    # Jekyll front matter は "---\n---\n" で終わる
    insert_pos = content.find("---\n", 3) + 4
    with open(bib_path, "w") as f:
        f.write(content[:insert_pos] + "\n" + bibtex + "\n" + content[insert_pos:])


def set_output(key: str, value: str) -> None:
    path = os.environ.get("GITHUB_OUTPUT", "")
    if path:
        with open(path, "a") as f:
            f.write(f"{key}={value}\n")
    print(f"[output] {key}={value}")


def main() -> None:
    issue_body = os.environ.get("ISSUE_BODY", "")
    bib_path = os.environ.get("BIB_PATH", "_bibliography/papers.bib")

    try:
        arxiv_id = extract_arxiv_id(issue_body)
        meta = fetch_metadata(arxiv_id)
        bibtex, key = make_bibtex(meta)
        insert_into_bib(bibtex, bib_path, arxiv_id)

        set_output("success", "true")
        set_output("arxiv_id", arxiv_id)
        set_output("title", meta["title"])
        set_output("key", key)
        set_output("author", " and ".join(meta["authors"]))
        set_output("year", str(meta["year"]))
        set_output("month", meta["month"])
        print(f"追加完了: {key}")
    except Exception as e:
        set_output("success", "false")
        set_output("error", str(e))
        print(f"エラー: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
