/**
 * Simple API helper - wraps fetch with auth token and base URL
 * Auto-logout when JWT is expired (401 Unauthorized)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('satya_token');
  }
  return null;
};

const handleUnauthorized = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('satya_token');
    localStorage.removeItem('satya_user');
    document.cookie = 'satya_token=; path=/; max-age=0';
    // Redirect ke login dengan parameter expired agar bisa tampil pesan
    window.location.href = '/login?expired=1';
  }
};

const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Token expired atau tidak valid → auto logout
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }

  return data;
};

export const api = {
  get: (endpoint) => apiFetch(endpoint, { method: 'GET' }),
  post: (endpoint, body) =>
    apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) =>
    apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => apiFetch(endpoint, { method: 'DELETE' }),
};

export default api;
