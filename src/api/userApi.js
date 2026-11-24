import apiClient from "./apiClient";

export const userApi = {
  getAllUsers: async () => {
    const res = await apiClient.get("/usuarios");
    return res.data;
  },

  createUser: async (userData) => {
    const res = await apiClient.post("/usuarios", userData);
    return res.data;
  },

  updateUser: async (id, userData) => {
    const res = await apiClient.put(`/usuarios/${id}`, userData);
    return res.data;
  },

  toggleUserStatus: async (id, activo) => {
    const res = await apiClient.patch(`/usuarios/${id}/status`, { activo });
    return res.data;
  },

  resetPassword: async (id, newPassword) => {
    const res = await apiClient.post(`/usuarios/${id}/reset-password`, {
      new_password: newPassword,
    });
    return res.data;
  },
};
