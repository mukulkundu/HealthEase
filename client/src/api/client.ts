import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// On 401 — try to refresh (cookies sent automatically), then retry the original request.
// Skip for login/register so failed credentials show the error instead of redirecting.
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url ?? "";
    const skipRefresh =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/me");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !skipRefresh
    ) {
      originalRequest._retry = true;

      try {
        await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return client(originalRequest);
      } catch {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default client;
