import apiClient from "./apiClient";

const CACHE_KEY_CONCEPTOS = "app_conceptos_gasto_cache";

export const expenseCategoryApi = {
  getAll: async (empresaId = null) => {
    try {
      const res = await apiClient.get("/conceptos-gasto", {
        params: empresaId ? { empresa_id: empresaId } : {},
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        try {
          localStorage.setItem(CACHE_KEY_CONCEPTOS, JSON.stringify(res.data));
        } catch {
          // ignore
        }
      }
      return res.data;
    } catch (err) {
      try {
        const cached = localStorage.getItem(CACHE_KEY_CONCEPTOS);
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore
      }
      throw err;
    }
  },

  create: async (data) => {
    const res = await apiClient.post("/conceptos-gasto", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await apiClient.put(`/conceptos-gasto/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await apiClient.delete(`/conceptos-gasto/${id}`);
    return res.data;
  },
};

export default expenseCategoryApi;
