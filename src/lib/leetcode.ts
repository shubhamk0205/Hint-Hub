export async function fetchLeetCodeQuestion(slug: string) {
  const r = await fetch('/api/leetcode-question', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Proxy ${r.status}: ${t.slice(0, 300)}`);
  }
  return (await r.json()) as {
    title: string;
    content: string; // HTML
    difficulty: string;
    exampleTestcases?: string;
    topicTags?: { name: string; slug: string }[];
    codeSnippets?: { lang: string; code: string }[];
  };
}

export function deriveSlugFromUrl(url: string) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const i = parts.findIndex(p => p === 'problems');
    const raw = i >= 0 && parts[i + 1] ? parts[i + 1].replace(/\/$/, '') : '';
    return normalizeLegacySlug(raw);
  } catch {
    return '';
  }
}

export function stripHtml(html: string) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Fallback mapping for study items that reference techniques rather than concrete LeetCode problems
export function mapTitleToSlug(title: string): string {
  const t = (title || '').toLowerCase().trim();
  const map: Record<string, string> = {
    // KMP-related problems commonly used to teach the algorithm
    'kmp algorithm': 'find-the-index-of-the-first-occurrence-in-a-string', // implement strStr
    'knuth morris pratt': 'find-the-index-of-the-first-occurrence-in-a-string',
    'knuth-morris-pratt': 'find-the-index-of-the-first-occurrence-in-a-string',
    'kmp': 'find-the-index-of-the-first-occurrence-in-a-string',

    // String techniques
    'implement atoi/strstr': 'string-to-integer-atoi',
    'atoi': 'string-to-integer-atoi',
    'strstr': 'find-the-index-of-the-first-occurrence-in-a-string',

    // Arrays / DP aliases
    "kadane's algorithm (maximum subarray)": 'maximum-subarray',
    'stock buy sell': 'best-time-to-buy-and-sell-stock',
    'grid unique paths': 'unique-paths',
    'reverse pairs': 'reverse-pairs',

    // Linked list aliases
    'reverse linked list in groups of k': 'reverse-nodes-in-k-group',
    'find starting point of loop': 'linked-list-cycle-ii',

    // Two pointer aliases
    'trapping rainwater': 'trapping-rain-water',

    // Recursion/backtracking aliases
    'k-th permutation sequence': 'permutation-sequence',
    'print all permutations': 'permutations',

    // Graph/Topo aliases
    'topological sort bfs': 'course-schedule',

    // Misc
    'implement pow(x,n)': 'powx-n',
    'implement sqrt(x)': 'sqrtx',
  };
  return map[t] || '';
}

export function normalizeLegacySlug(slug: string): string {
  const s = (slug || '').toLowerCase().trim();
  const map: Record<string, string> = {
    'implement-strstr': 'find-the-index-of-the-first-occurrence-in-a-string',
  };
  return map[s] || s;
}


