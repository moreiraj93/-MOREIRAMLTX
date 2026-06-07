/**
 * MockJ Knowledge Search
 * ───────────────────────
 * Lightweight client-side knowledge retrieval.
 * Returns the most relevant KnowledgeEntry items for a query.
 * Always includes static + custom localStorage entries via getAllEntries().
 */

import { getAllEntries, KnowledgeEntry, KnowledgeCategory } from '@/data/knowledgeBase';

export interface SearchResult {
  entry: KnowledgeEntry;
  score: number;
}

/**
 * Score a single entry against a query.
 * Higher = more relevant.
 */
function scoreEntry(entry: KnowledgeEntry, tokens: string[]): number {
  let score = 0;
  const titleLower = entry.title.toLowerCase();
  const contentLower = entry.content.toLowerCase();

  for (const token of tokens) {
    if (token.length < 2) continue;

    // Keyword exact match — highest signal
    for (const kw of entry.keywords) {
      if (kw.toLowerCase() === token) score += 10;
      else if (kw.toLowerCase().includes(token)) score += 5;
    }

    // Title match
    if (titleLower.includes(token)) score += 4;

    // Content match (count occurrences, capped)
    let idx = contentLower.indexOf(token);
    let hits = 0;
    while (idx !== -1 && hits < 5) {
      score += 2;
      hits++;
      idx = contentLower.indexOf(token, idx + 1);
    }

    // Category name match
    if (entry.category.toLowerCase().includes(token)) score += 3;
  }

  return score;
}

/**
 * Tokenise a free-text query into lowercase tokens,
 * stripping common stopwords.
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'on',
  'at', 'by', 'for', 'with', 'about', 'as', 'into', 'through', 'from',
  'up', 'down', 'out', 'off', 'over', 'under', 'then', 'than', 'that',
  'this', 'these', 'those', 'and', 'but', 'or', 'nor', 'not', 'no',
  'what', 'how', 'when', 'where', 'who', 'which', 'why', 'tell', 'me',
  'i', 'my', 'your', 'it', 'its', 'so', 'if', 'just', 'get', 'know',
]);

export function tokenise(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Main search function.
 *
 * @param query     Natural language query from user
 * @param topK      Max results to return (default 3)
 * @param minScore  Minimum relevance score threshold (default 4)
 */
export function searchKnowledge(
  query: string,
  topK = 3,
  minScore = 4
): SearchResult[] {
  const tokens = tokenise(query);
  if (tokens.length === 0) return [];

  const allEntries = getAllEntries();

  const scored: SearchResult[] = allEntries
    .map(entry => ({ entry, score: scoreEntry(entry, tokens) }))
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

/**
 * Check if a query is related to the knowledge base at all.
 */
export function isKnowledgeQuery(query: string): boolean {
  return searchKnowledge(query, 1, 4).length > 0;
}

/**
 * Format search results into a concise context block
 * to inject into the AI system prompt.
 */
export function formatKnowledgeContext(results: SearchResult[]): string {
  if (results.length === 0) return '';

  const sections = results.map(r => `### ${r.entry.title}\n${r.entry.content}`);

  return `
== MockJ Project Knowledge (authoritative — use this to answer the question) ==
${sections.join('\n\n')}
== End of project knowledge ==

Using the above knowledge, answer the user's question accurately and confidently.
Never say you don't know about these projects — all the information above is authoritative.
`.trim();
}

/**
 * Get all entries in a given category (static + custom).
 */
export function getByCategory(category: KnowledgeCategory): KnowledgeEntry[] {
  return getAllEntries().filter(e => e.category === category);
}

/**
 * Get a single entry by id (static + custom).
 */
export function getById(id: string): KnowledgeEntry | undefined {
  return getAllEntries().find(e => e.id === id);
}
