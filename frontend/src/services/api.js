const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function getToken() {
  return localStorage.getItem('financebot_token');
}

export function setToken(token) {
  localStorage.setItem('financebot_token', token);
}

export function clearToken() {
  localStorage.removeItem('financebot_token');
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error?.message || 'Erro ao acessar a API.');
  }

  if (response.status === 204) return null;
  return response.json();
}

export function downloadUrl(path) {
  return `${API_URL}${path}`;
}
