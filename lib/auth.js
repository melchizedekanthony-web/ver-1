// Authentication helper functions

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fittr_token');
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem('fittr_user');
  return userData ? JSON.parse(userData) : null;
}

export function setAuth(token, user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fittr_token', token);
  localStorage.setItem('fittr_user', JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('fittr_token');
  localStorage.removeItem('fittr_user');
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

  return response;
}

export async function signOut() {
  await fetch('/api/signout', { method: 'POST' });
  clearAuth();
  window.location.href = '/';
}
