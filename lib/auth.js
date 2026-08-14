// Authentication helper functions
//
// Reads/writes the real signed-in session. `setAuth` (called from the
// signin/register pages) stores whatever token + user the backend actually
// issued in /api/signin — these getters just need to read that back.

const TOKEN_KEY = 'fittr_token';
const USER_KEY = 'fittr_user';

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse stored user, clearing corrupt session:', err);
    clearAuth();
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getAuthToken() && getUser());
}

export function setAuth(token, user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // A 401 means the stored session is dead (expired/invalid token) — clear it
  // locally so the next page load correctly redirects to sign-in instead of
  // silently pretending the user is still logged in.
  if (response.status === 401 && typeof window !== 'undefined') {
    clearAuth();
  }

  return response;
}

export async function signOut() {
  try {
    await fetchWithAuth('/api/signout', { method: 'POST' });
  } catch (err) {
    console.error('Sign out request failed:', err);
  } finally {
    clearAuth();
    window.location.href = '/';
  }
}
