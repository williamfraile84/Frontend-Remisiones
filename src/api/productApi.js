import apiClient from "./apiClient";

export const productApi = {
  getAll: async (search = "", categoria = "") => {
    const params = {};
    if (search) params.search = search;
    if (categoria) params.categoria = categoria;
    const res = await apiClient.get("/productos", { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await apiClient.get(`/productos/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await apiClient.post("/productos", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await apiClient.put(`/productos/${id}`, data);
    return res.data;
  },

  batchUpdateEmpaques: async (items) => {
    const res = await apiClient.put("/productos/batch-empaques", { items });
    return res.data;
  },

  delete: async (id) => {
    const res = await apiClient.delete(`/productos/${id}`);
    return res.data;
  },

  getPosStatus: async () => {
    const res = await apiClient.get("/pos/status");
    return res.data;
  },

  conciliarPreciosPos: async (items, actualizarCatalogoLocal = true) => {
    const res = await apiClient.post("/pos/conciliar", {
      items,
      actualizar_catalogo_local: actualizarCatalogoLocal,
    });
    return res.data;
  },
};

export default productApi;
