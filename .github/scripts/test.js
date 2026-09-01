const ARXIV_ID = "2301.07041";

async function fetchMetadata(arxivId) {
  const url = `https://export.arxiv.org/api/query?id_list=${arxivId}`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "GitHub-Actions/add_arxiv_paper (senry-senry/website; Node.js)" },
  });
  if (!resp.ok) throw new Error(`HTTP error: ${resp.status}`);
  return await resp.text();
}

try {
  console.log(`Fetching arXiv ID: ${ARXIV_ID}`);
  const xml = await fetchMetadata(ARXIV_ID);
  console.log("Response:\n", xml);
} catch (e) {
  console.error("Error:", e.message);
}
