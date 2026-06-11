import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getMe } from '../api/auth';

/**
 * Checks authentication via httpOnly cookie (calls GET /auth/me).
 * If the cookie is valid, the backend returns the user object and we proceed.
 * If the cookie is missing or expired, the backend returns 401 and we redirect to /login.
 *
 * getMe() is only called once per session — after a successful call, isAuthenticated
 * is set to true and subsequent route transitions skip the check.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, setUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(!isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) return;  // Already verified this session

    getMe()
      .then((userData) => {
        setUser(userData);
        setLoading(false);
      })
      .catch(() => {
        logout();
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
