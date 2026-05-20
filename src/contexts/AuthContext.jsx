import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CLIENT_ID, SCOPES } from '../config';
import { getStoredToken, storeToken, clearToken, fetchUserInfo } from '../services/googleAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const tokenClientRef = useRef(null);

  // Initialize token client once GIS library loads
  useEffect(() => {
    const initGIS = () => {
      if (!window.google?.accounts?.oauth2) {
        // GIS not loaded yet, retry
        setTimeout(initGIS, 200);
        return;
      }

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (response) => {
          if (response.error) {
            console.error('OAuth error:', response.error);
            return;
          }
          const stored = storeToken(response);
          setToken(stored.access_token);
          try {
            const info = await fetchUserInfo(stored.access_token);
            setUser(info);
          } catch (err) {
            console.error('Failed to fetch user info:', err);
            // Fallback — we have a valid token, set a placeholder user
            setUser({ name: 'User', picture: '' });
          }
          setLoading(false);
        },
      });

      // Try silent re-auth from stored token
      const stored = getStoredToken();
      if (stored) {
        setToken(stored.access_token);
        fetchUserInfo(stored.access_token)
          .then(info => setUser(info))
          .catch(() => {
            // Token expired or invalid, clear it
            clearToken();
            setToken(null);
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    };

    initGIS();
  }, []);

  const signIn = useCallback(() => {
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
    }
  }, []);

  const signOut = useCallback(() => {
    if (token) {
      window.google?.accounts?.oauth2?.revoke(token, () => {
        console.log('Token revoked');
      });
    }
    clearToken();
    setToken(null);
    setUser(null);
  }, [token]);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
