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
    return i >= 0 && parts[i + 1] ? parts[i + 1].replace(/\/$/, '') : '';
  } catch {
    return '';
  }
}

export function stripHtml(html: string) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}


