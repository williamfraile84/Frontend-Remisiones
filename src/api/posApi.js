import apiClient from "./apiClient";

export const posApi = {
  getStatus: async () => {
    const res = await apiClient.get("/pos/status");
    return res.data;
  },

  search: async (query = "") => {
    const res = await apiClient.get("/pos/search", { params: { query } });
    return res.data;
  },

  getItem: async (itemId) => {
    const res = await apiClient.get(`/pos/items/${itemId}`);
    return res.data;
  },

  updatePrice: async ({ barcode, new_price, item_id, modal_barcode, item_name }) => {
    const res = await apiClient.post("/pos/update-price", {
      barcode,
      new_price,
      item_id,
      modal_barcode,
      item_name,
    });
    return res.data;
  },

  conciliar: async (items, actualizarCatalogoLocal = true) => {
    const res = await apiClient.post("/pos/conciliar", {
      items,
      actualizar_catalogo_local: actualizarCatalogoLocal,
    });
    return res.data;
  },
};

export default posApi;
