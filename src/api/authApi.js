import apiClient from "./apiClient";

export const authApi = {
  getSetupStatus: async () => {
    const res = await apiClient.get("/auth/setup-status");
    return res.data;
  },

  setupInitialAdmin: async (adminData) => {
    const res = await apiClient.post("/auth/setup-initial-admin", adminData);
    return res.data;
  },

  login: async (credentials) => {
    const res = await apiClient.post("/auth/login", credentials);
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get("/auth/me");
    return res.data;
  },

  changePassword: async (passwords) => {
    const res = await apiClient.post("/auth/change-password", passwords);
    return res.data;
  },

  logout: async () => {
    try {
      const res = await apiClient.post("/auth/logout");
      return res.data;
    } catch {
      return null;
    }
  },

  getSesiones: async () => {
    const res = await apiClient.get("/auth/sesiones");
    return res.data;
  },
};
