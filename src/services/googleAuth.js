import { TOKEN_KEY } from '../config';

/**
 * Read stored token from localStorage
 */
export function getStoredToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Check expiry
    if (parsed.expires_at && Date.now() > parsed.expires_at) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save token + user info to localStorage
 */
export function storeToken(tokenResponse) {
  const data = {
    access_token: tokenResponse.access_token,
    expires_at: Date.now() + (tokenResponse.expires_in || 3600) * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
  return data;
}

/**
 * Clear stored token
 */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Fetch user info from Google
 */
export async function fetchUserInfo(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`UserInfo API ${res.status}: ${body}`);
    throw new Error(`Failed to fetch user info (${res.status})`);
  }
  return res.json();
}
