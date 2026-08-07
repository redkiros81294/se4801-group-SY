import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use your machine's LAN IP here so a physical device on the same network can reach the backend.
// For emulator/simulator, keep localhost. For physical device, replace with your LAN IP.
const LAN_API_URL = 'http://192.168.1.3:8080/api';
const LOCAL_API_URL = 'http://localhost:8080/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || LAN_API_URL;

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { token, refreshToken: newRefresh } = response.data;
          await SecureStore.setItemAsync('access_token', token);
          if (newRefresh) await SecureStore.setItemAsync('refresh_token', newRefresh);
          error.config.headers.Authorization = `Bearer ${token}`;
          return axios.request(error.config);
        } catch {
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
