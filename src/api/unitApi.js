import apiClient from "./apiClient";

const CACHE_KEY_UNIDADES = "app_unidades_medida_cache";

export const unitApi = {
  getAll: async () => {
    try {
      const res = await apiClient.get("/unidades-medida");
      if (Array.isArray(res.data) && res.data.length > 0) {
        try {
          localStorage.setItem(CACHE_KEY_UNIDADES, JSON.stringify(res.data));
        } catch {
          // ignore
        }
      }
      return res.data;
    } catch (err) {
      try {
        const cached = localStorage.getItem(CACHE_KEY_UNIDADES);
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore
      }
      throw err;
    }
  },

  create: async (data) => {
    const res = await apiClient.post("/unidades-medida", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await apiClient.put(`/unidades-medida/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await apiClient.delete(`/unidades-medida/${id}`);
    return res.data;
  },
};

export default unitApi;
