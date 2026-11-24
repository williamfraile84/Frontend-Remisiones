import apiClient from "./apiClient";

export const companyApi = {
  getStatus: async (empresaId = null) => {
    const params = empresaId ? { empresa_id: empresaId } : {};
    const res = await apiClient.get("/empresa/status", { params });
    return res.data;
  },

  getAll: async () => {
    const res = await apiClient.get("/empresa");
    return res.data;
  },

  saveProfile: async (data, empresaId = null) => {
    const params = empresaId ? { empresa_id: empresaId } : {};
    const res = await apiClient.post("/empresa", data, { params });
    return res.data;
  },

  uploadLogo: async (file, empresaId = null) => {
    const fd = new FormData();
    fd.append("file", file);
    const params = empresaId ? { empresa_id: empresaId } : {};
    const res = await apiClient.post("/empresa/logo", fd, {
      params,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default companyApi;
