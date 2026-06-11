import axios from 'axios';

// In production set REACT_APP_API_URL=https://your-api-domain.com
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,   // Send httpOnly cookie with every request
});

// No Authorization header — authentication is handled via httpOnly cookie.
// The browser attaches the cookie automatically on every request to API_URL.

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or cookie missing — redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
