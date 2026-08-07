import axios from 'axios';
import { getAccessToken, setAccessToken } from './authToken';

// Primary and fallback API URLs
const PRIMARY_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const FALLBACK_API_URL = import.meta.env.VITE_API_FALLBACK_URL || 'https://chaintrack-backend.onrender.com/api';

const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const startOnFallback = !import.meta.env.VITE_API_URL && !isLocal;

let currentBaseURL = startOnFallback ? FALLBACK_API_URL : PRIMARY_API_URL;
let fallbackAttempted = startOnFallback;

const api = axios.create({
  baseURL: currentBaseURL,
});

const switchToFallback = () => {
  if (!fallbackAttempted && currentBaseURL !== FALLBACK_API_URL) {
    console.warn(`Primary API failed, switching to fallback: ${FALLBACK_API_URL}`);
    currentBaseURL = FALLBACK_API_URL;
    api.defaults.baseURL = FALLBACK_API_URL;
    fallbackAttempted = true;
  }
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isNetworkError = !error.response && (error.code === 'ECONNABORTED' || error.message.includes('Network Error') || error.message.includes('CORS'));
    if (isNetworkError && !fallbackAttempted && currentBaseURL === PRIMARY_API_URL) {
      console.warn('Network error detected, attempting fallback API...');
      switchToFallback();
      const originalRequest = error.config;
      originalRequest.baseURL = FALLBACK_API_URL;
      return axios.request(originalRequest);
    }

    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const refreshToken = sessionStorage.getItem('chaintrack_token');
        if (!refreshToken) {
          return Promise.reject(error);
        }
        const refreshResponse = await axios.post(`${currentBaseURL}/auth/refresh`, { refreshToken });
        const newToken = refreshResponse.data?.token;
        const newRefreshToken = refreshResponse.data?.refreshToken;
        if (newToken) {
          setAccessToken(newToken);
          if (newRefreshToken) {
            sessionStorage.setItem('chaintrack_token', newRefreshToken);
          }
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return axios.request(error.config);
        }
      } catch {
        setAccessToken(null);
        sessionStorage.removeItem('chaintrack_token');
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

export const getCurrentBaseURL = () => currentBaseURL;
export const resetToPrimary = () => {
  currentBaseURL = PRIMARY_API_URL;
  api.defaults.baseURL = PRIMARY_API_URL;
  fallbackAttempted = false;
};

export default api;