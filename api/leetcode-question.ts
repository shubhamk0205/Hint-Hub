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

    const upstream = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables: { titleSlug: slug } }),
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      return new Response(
        JSON.stringify({ error: `Upstream ${upstream.status}`, details: body.slice(0, 500) }),
        { status: 502, headers: { 'content-type': 'application/json' } }
      );
    }

    const data = await upstream.json();
    const q = data?.data?.question;
    if (!q) {
      return new Response(JSON.stringify({ error: 'Question not found' }), {
        status: 404,
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