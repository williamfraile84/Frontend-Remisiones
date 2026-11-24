import apiClient from "./apiClient";

export const orderApi = {
  getHistoryByClient: async (clientId) => {
    const res = await apiClient.get(`/pedidos/historial/${clientId}`);
    return res.data;
  },

  getOrderById: async (orderId) => {
    const res = await apiClient.get(`/pedidos/${orderId}`);
    return res.data;
  },

  uploadDocument: async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await apiClient.post("/pedidos/upload-documento", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  saveOrder: async (orderPayload) => {
    const res = await apiClient.post("/pedidos/guardar", orderPayload);
    return res.data;
  },

  deleteOrder: async (orderId) => {
    const res = await apiClient.delete(`/pedidos/${orderId}`);
    return res.data;
  },

  softDeleteOrder: async (orderId) => {
    const res = await apiClient.delete(`/pedidos/${orderId}`);
    return res.data;
  },

  uploadClosureFile: async (orderId, type, file) => {
    const fd = new FormData();
    fd.append("file", file);
    const endpoint = type === "factura" ? "factura" : "remision-firmada";
    const res = await apiClient.post(`/pedidos/${orderId}/${endpoint}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};
