export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  try {
    const { slug } = await req.json();
    if (!slug || typeof slug !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing slug' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          title
          content
          difficulty
          exampleTestcases
          topicTags { name slug }
          codeSnippets { lang code }
        }
      }
    `;

    async function fetchFrom(endpoint: string) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          // Adding referer improves reliability for some LeetCode regions
          'referer': 'https://leetcode.com/',
        },
        body: JSON.stringify({ query, variables: { titleSlug: slug } }),
      });
      return res;
    }

    // Try primary (.com), then fallback to (.cn) if not found or error
    let upstream = await fetchFrom('https://leetcode.com/graphql');
    let data: any = null;
    let q: any = null;
    if (upstream.ok) {
      try {
        data = await upstream.json();
        q = data?.data?.question || null;
      } catch {}
    }

    if (!upstream.ok || !q) {
      const fallback = await fetchFrom('https://leetcode.cn/graphql');
      if (fallback.ok) {
        try {
          const d2 = await fallback.json();
          const q2 = d2?.data?.question || null;
          if (q2) {
            q = q2;
          } else if (!upstream.ok) {
            // If both failed to return a question and primary was an error, surface fallback body
            return new Response(
              JSON.stringify({ error: 'Question not found', details: d2 }),
              { status: 404, headers: { 'content-type': 'application/json' } }
            );
          }
        } catch {}
      }
    }

    if (!q) {
      // Return last known upstream status if available, else 404
      const status = upstream?.status && upstream.status !== 200 ? upstream.status : 404;
      let details: string | undefined = undefined;
      try {
        const txt = await upstream.text();
        details = txt.slice(0, 500);
      } catch {}
      return new Response(JSON.stringify({ error: 'Question not found', details }), {
        status,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        title: q.title,
        content: q.content, // full HTML
        difficulty: q.difficulty,
        exampleTestcases: q.exampleTestcases,
        topicTags: q.topicTags,
        codeSnippets: q.codeSnippets,
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'public, max-age=3600',
        },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}