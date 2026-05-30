import axios from "axios";

//export const API_BASE_URL = "https://arsa1-api.onrender.com/api";

// For Android emulator use:
//export const API_BASE_URL = "http://192.168.1.11:5000/api";

// For real phone, use your Mac IP address:
export const API_BASE_URL =
  "http://clygqpwyuza7ozpve34pq2g8.5.223.55.252.sslip.io/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "ARSA1SECRETKEY",
  },
});

export default api;
