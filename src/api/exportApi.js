import apiClient from "./apiClient";

export const exportApi = {
  exportPdfRemision: async (payload) => {
    const res = await apiClient.post(
      "/pedidos/exportar/pdf-remision",
      payload,
      {
        responseType: "blob",
      },
    );
    return res.data;
  },

  exportExcelRemision: async (payload) => {
    const res = await apiClient.post(
      "/pedidos/exportar/excel-remision",
      payload,
      {
        responseType: "blob",
      },
    );
    return res.data;
  },

  // Endpoints corregidos que solucionan el error 404
  exportPdfInforme: async (payload) => {
    const res = await apiClient.post("/pedidos/exportar/pdf-informe", payload, {
      responseType: "blob",
    });
    return res.data;
  },

  exportExcelInforme: async (payload) => {
    const res = await apiClient.post(
      "/pedidos/exportar/excel-informe",
      payload,
      {
        responseType: "blob",
      },
    );
    return res.data;
  },
};
