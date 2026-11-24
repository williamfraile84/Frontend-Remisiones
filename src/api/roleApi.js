import apiClient from "./apiClient";

export const roleApi = {
  getRoles: async (activoOnly = true) => {
    const response = await apiClient.get("/roles", { params: { activo_only: activoOnly } });
    return response.data;
  },

  getPermisos: async (modulo = "") => {
    const params = modulo ? { modulo } : {};
    const response = await apiClient.get("/roles/permisos", { params });
    return response.data;
  },

  getRoleById: async (roleId) => {
    const response = await apiClient.get(`/roles/${roleId}`);
    return response.data;
  },

  createRole: async (roleData) => {
    const response = await apiClient.post("/roles", roleData);
    return response.data;
  },

  updateRole: async (roleId, roleData) => {
    const response = await apiClient.put(`/roles/${roleId}`, roleData);
    return response.data;
  },

  deleteRole: async (roleId) => {
    const response = await apiClient.delete(`/roles/${roleId}`);
    return response.data;
  },
};

export default roleApi;

