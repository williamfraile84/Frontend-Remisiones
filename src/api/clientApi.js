import apiClient from "./apiClient";

export const clientApi = {
  getAll: async () => {
    const res = await apiClient.get("/clientes");
    return res.data;
  },

  save: async (clientData) => {
    const res = await apiClient.post("/clientes", clientData);
    return res.data;
  },
};
