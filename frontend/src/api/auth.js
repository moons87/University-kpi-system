import client from './client';

/**
 * Login — backend sets an httpOnly cookie.
 * Returns { message: 'Login successful' }.
 */
export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then((r) => r.data);

/**
 * Logout — backend clears the httpOnly cookie.
 */
export const logout = () =>
  client.post('/auth/logout').then((r) => r.data);

/**
 * Get current authenticated user (reads the cookie server-side).
 * Throws 401 if not authenticated.
 */
export const getMe = () =>
  client.get('/auth/me').then((r) => r.data);
