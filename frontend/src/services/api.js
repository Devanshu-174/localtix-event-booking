export const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Shared transport supports server error messages and empty cancellation responses.
export function createApiClient(token) {
  return async (path, options = {}) => {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(options.headers || {}),
      },
    });
    if (!response.ok) {
      let message = 'Something went wrong';
      try {
        message = (await response.json()).message || message;
      } catch {}
      throw new Error(message);
    }
    return response.status === 204 ? null : response.json();
  };
}
export function auth(path, data) {
  return createApiClient()(path, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
