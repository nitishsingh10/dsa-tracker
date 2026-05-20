export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Only allow known coding platforms
  const allowed = ['leetcode.com', 'geeksforgeeks.org', 'hackerrank.com', 'codeforces.com', 'codechef.com', 'interviewbit.com', 'naukri.com'];
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const isAllowed = allowed.some(d => parsedUrl.hostname.includes(d));
  if (!isAllowed) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || 'text/html';
    let body = await response.text();

    // Rewrite relative URLs to absolute so resources load
    const base = `${parsedUrl.protocol}//${parsedUrl.host}`;
    body = body
      .replace(/(href|src|action)="\/(?!\/)/g, `$1="${base}/`)
      .replace(/(href|src|action)='\/(?!\/)/g, `$1='${base}/`)
      .replace(/url\(\/(?!\/)/g, `url(${base}/`);

    // Inject a <base> tag so remaining relative URLs resolve
    body = body.replace(/<head([^>]*)>/i, `<head$1><base href="${base}/">`);

    // Set permissive headers — no X-Frame-Options, no restrictive CSP
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    // Explicitly remove frame-blocking
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', '');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(200).send(body);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to fetch: ' + err.message });
  }
}
