import axios from 'axios';
import { getToken, clearToken } from '../contexts/AuthContext';

// Primary and fallback API URLs
const PRIMARY_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const FALLBACK_API_URL = import.meta.env.VITE_API_FALLBACK_URL || 'https://chaintrack-backend.onrender.com/api';

let currentBaseURL = PRIMARY_API_URL;
let fallbackAttempted = false;

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
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Reset fallback on successful request
    if (fallbackAttempted && currentBaseURL === FALLBACK_API_URL) {
      // Optionally switch back to primary after some successful requests
      // For now, stick with fallback once switched
    }
    return response;
  },
  (error) => {
    // Check if it's a network/CORS error (not a 4xx/5xx response)
    const isNetworkError = !error.response && (error.code === 'ECONNABORTED' || error.message.includes('Network Error') || error.message.includes('CORS'));
    
    if (isNetworkError && !fallbackAttempted && currentBaseURL === PRIMARY_API_URL) {
      console.warn('Network error detected, attempting fallback API...');
      switchToFallback();
      
      // Retry the original request with fallback
      const originalRequest = error.config;
      originalRequest.baseURL = FALLBACK_API_URL;
      return axios.request(originalRequest);
    }
    
    if (error.response?.status === 401) {
      clearToken();
      window.location.assign(`${import.meta.env.BASE_URL}login`);
    }
    if (error.response?.status === 403) {
      window.location.assign(`${import.meta.env.BASE_URL}forbidden`);
    }
    if (error.response?.status === 404) {
      window.location.assign(`${import.meta.env.BASE_URL}not-found`);
    }
    if (error.response?.status >= 500) {
      const msg = encodeURIComponent(error.response?.data?.message || 'Something went wrong');
      window.location.assign(`${import.meta.env.BASE_URL}error?msg=${msg}`);
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