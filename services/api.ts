import axios from "axios";

//export const API_BASE_URL = "https://arsa1-api.onrender.com/api";

// For Android emulator use:
//export const API_BASE_URL = "http://192.168.1.11:5000/api";

// For real phone, use your Mac IP address:
export const API_BASE_URL = "https://arsa1.antiguasbakeandcuisine.com/api";

export const API_KEY = "ARSA1SECRETKEY";

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

// Called when the server rejects the session (expired / disabled account).
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  },
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = error?.config?.url?.includes("/auth/login");

    if (error?.response?.status === 401 && authToken && !isLogin) {
      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);

// Prefer the API's own message over axios' generic "Request failed..."
export function errorMessage(error: any, fallback = "Something went wrong.") {
  return error?.response?.data?.message || error?.message || fallback;
}

export default api;
