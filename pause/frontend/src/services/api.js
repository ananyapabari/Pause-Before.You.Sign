import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 25000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pause_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  updateProfile: (payload) => api.put("/auth/profile", payload),
  verifyCode: (payload) => api.post("/auth/verify-code", payload),
  resendCode: (payload) => api.post("/auth/resend-code", payload),
  forgotPassword: (payload) => api.post("/auth/forgot-password", payload),
  resetPassword: (payload) => api.post("/auth/reset-password", payload),
};

export const analysisApi = {
  analyzeOffer: (payload) => api.post("/analysis/analyze", payload),
  getHistory: () => api.get("/analysis/history"),
};

export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard"),
  getRules: () => api.get("/admin/rules"),
  updateRule: (ruleName, payload) => api.put(`/admin/rules/${ruleName}`, payload),
  getLogs: () => api.get("/admin/logs"),
  getUsers: (params) => api.get("/admin/users", { params }),
  updateUserStatus: (userId, payload) => api.put(`/admin/users/${userId}/status`, payload),
  updateUserRole: (userId, payload) => api.put(`/admin/users/${userId}/role`, payload),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getFlaggedOffers: () => api.get("/admin/flagged-offers"),
  reviewFlaggedOffer: (offerId, payload) => api.put(`/admin/flagged-offers/${offerId}/review`, payload),
};

export default api;
