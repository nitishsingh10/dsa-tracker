/**
 * Fetches the problem description from coding platforms.
 * - LeetCode: Uses GraphQL API to get problem content
 * - GFG: Tries HTML proxy
 * - Others: Returns null (use fallback)
 */
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Route to the right fetcher
  if (parsedUrl.hostname.includes('leetcode.com')) {
    return handleLeetCode(parsedUrl, res);
  } else if (parsedUrl.hostname.includes('geeksforgeeks.org')) {
    return handleGFG(parsedUrl, res);
  } else {
    return handleGeneric(url, parsedUrl, res);
  }
}

/**
 * LeetCode: Extract slug from URL, call GraphQL API
 */
async function handleLeetCode(parsedUrl, res) {
  // Extract problem slug: /problems/two-sum/ → two-sum
  const match = parsedUrl.pathname.match(/\/problems\/([^/]+)/);
  if (!match) {
    return res.status(400).json({ error: 'Could not extract LeetCode problem slug' });
  }

  const slug = match[1];

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': `https://leetcode.com/problems/${slug}/`,
        'Origin': 'https://leetcode.com',
      },
      body: JSON.stringify({
        query: `query getQuestionDetail($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionId
            title
            titleSlug
            content
            difficulty
            topicTags { name slug }
            hints
            exampleTestcaseList
          }
        }`,
        variables: { titleSlug: slug },
      }),
    });

    const data = await response.json();
    const q = data?.data?.question;

    if (!q || !q.content) {
      return res.status(404).json({ error: 'Problem not found on LeetCode' });
    }

    // Build a clean HTML page with the problem content
    const html = buildProblemPage({
      title: q.title,
      difficulty: q.difficulty,
      content: q.content,
      tags: q.topicTags?.map(t => t.name) || [],
      hints: q.hints || [],
      platform: 'LeetCode',
      url: parsedUrl.href,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(html);
  } catch (err) {
    return res.status(502).json({ error: 'LeetCode API failed: ' + err.message });
  }
}

/**
 * GFG: Fetch page and extract article content
 */
async function handleGFG(parsedUrl, res) {
  try {
    const response = await fetch(parsedUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });

    let html = await response.text();

    // Try to extract the article content
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const contentMatch = html.match(/<div[^>]*class="[^"]*text[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i);
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);

    const content = articleMatch ? articleMatch[0] : (contentMatch ? contentMatch[0] : null);

    if (content) {
      const cleanHtml = buildProblemPage({
        title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Problem',
        content: content,
        platform: 'GeeksforGeeks',
        url: parsedUrl.href,
      });

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
      return res.status(200).send(cleanHtml);
    }

    // Fallback: proxy the whole page with rewritten URLs
    return handleGeneric(parsedUrl.href, parsedUrl, res);
  } catch (err) {
    return res.status(502).json({ error: 'GFG fetch failed: ' + err.message });
  }
}

/**
 * Generic: proxy with URL rewriting
 */
async function handleGeneric(url, parsedUrl, res) {
  const allowed = ['leetcode.com', 'geeksforgeeks.org', 'hackerrank.com', 'codeforces.com', 'codechef.com', 'interviewbit.com', 'naukri.com'];
  const isAllowed = allowed.some(d => parsedUrl.hostname.includes(d));
  if (!isAllowed) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });

    let body = await response.text();
    const base = `${parsedUrl.protocol}//${parsedUrl.host}`;

    body = body
      .replace(/(href|src|action)="\/(?!\/)/g, `$1="${base}/`)
      .replace(/(href|src|action)='\/(?!\/)/g, `$1='${base}/`);

    body = body.replace(/<head([^>]*)>/i, `<head$1><base href="${base}/">`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).send(body);
  } catch (err) {
    return res.status(502).json({ error: 'Fetch failed: ' + err.message });
  }
}

/**
 * Build a clean, styled problem page
 */
function buildProblemPage({ title, difficulty, content, tags, hints, platform, url }) {
  const diffColor = difficulty === 'Easy' ? '#22c55e' : difficulty === 'Medium' ? '#eab308' : difficulty === 'Hard' ? '#ef4444' : '#94a3b8';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Problem'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0f;
      color: #d4d4d8;
      line-height: 1.7;
      padding: 28px 32px;
      max-width: 800px;
    }
    h1 { font-size: 20px; font-weight: 700; color: #fafafa; margin-bottom: 10px; }
    .meta { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .badge {
      font-size: 11px; font-weight: 600; padding: 3px 10px;
      border-radius: 6px; background: ${diffColor}15; color: ${diffColor};
      border: 1px solid ${diffColor}30;
    }
    .platform { font-size: 11px; color: #71717a; }
    .tag {
      font-size: 10px; color: #818cf8; background: #818cf810;
      padding: 2px 8px; border-radius: 4px;
    }
    .content { font-size: 14px; color: #d4d4d8; }
    .content h2, .content h3 { color: #fafafa; margin: 20px 0 8px; font-size: 16px; }
    .content p { margin: 8px 0; }
    .content pre {
      background: #18181b; border: 1px solid #27272a; border-radius: 8px;
      padding: 14px 16px; overflow-x: auto; font-size: 13px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      color: #a1a1aa; margin: 10px 0;
    }
    .content code {
      background: #27272a; padding: 1px 6px; border-radius: 4px;
      font-size: 13px; font-family: 'SF Mono', Monaco, monospace;
    }
    .content pre code { background: none; padding: 0; }
    .content strong { color: #fafafa; }
    .content em { color: #a1a1aa; }
    .content ul, .content ol { padding-left: 20px; margin: 8px 0; }
    .content li { margin: 4px 0; }
    .content img { max-width: 100%; border-radius: 8px; margin: 10px 0; }
    .content table { border-collapse: collapse; margin: 10px 0; }
    .content th, .content td {
      border: 1px solid #27272a; padding: 6px 12px; font-size: 13px;
    }
    .content th { background: #18181b; color: #fafafa; }
    .hints { margin-top: 24px; }
    .hints summary {
      cursor: pointer; font-size: 13px; color: #818cf8; font-weight: 500;
      padding: 8px 0;
    }
    .hints .hint-content {
      font-size: 13px; color: #a1a1aa; padding: 8px 16px;
      background: #18181b; border-radius: 8px; margin: 4px 0 12px;
    }
    .open-link {
      display: inline-flex; align-items: center; gap: 6px;
      margin-top: 24px; padding: 8px 16px; background: #27272a;
      border: 1px solid #3f3f46; border-radius: 8px; color: #a1a1aa;
      text-decoration: none; font-size: 12px; transition: all 0.2s;
    }
    .open-link:hover { color: #fafafa; border-color: #52525b; }
  </style>
</head>
<body>
  <h1>${title || 'Problem'}</h1>
  <div class="meta">
    ${difficulty ? `<span class="badge">${difficulty}</span>` : ''}
    ${platform ? `<span class="platform">${platform}</span>` : ''}
    ${(tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
  </div>
  <div class="content">${content || '<p>Could not load problem content.</p>'}</div>
  ${(hints && hints.length > 0) ? `
    <div class="hints">
      ${hints.map((h, i) => `
        <details>
          <summary>💡 Hint ${i + 1}</summary>
          <div class="hint-content">${h}</div>
        </details>
      `).join('')}
    </div>
  ` : ''}
  ${url ? `<a href="${url}" target="_blank" class="open-link">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
    </svg>
    Open on ${platform || 'original site'}
  </a>` : ''}
</body>
</html>`;
}
