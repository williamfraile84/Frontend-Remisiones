import apiClient, { API_BASE_URL } from "./apiClient";

export const auditApi = {
  getLogs: async (params = {}) => {
    const res = await apiClient.get("/auditoria", { params });
    return res.data;
  },

  getTotalCount: async () => {
    const res = await apiClient.get("/auditoria/total-count");
    return res.data;
  },

  exportCsvUrl: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.modulo) searchParams.set("modulo", params.modulo);
    if (params.accion) searchParams.set("accion", params.accion);
    if (params.search) searchParams.set("search", params.search);
    return `${API_BASE_URL}/auditoria/export-csv?${searchParams.toString()}`;
  },
};
