import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de Solicitud para inyectar token JWT
// Interceptor de Solicitud para inyectar token JWT y Empresa Activa
apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("app_token") || localStorage.getItem("fruver_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const empresaId = localStorage.getItem("app_empresa_activa_id");
    if (empresaId) {
      config.headers["X-Empresa-Id"] = empresaId;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor de Respuesta para gestionar expiración de sesión y caídas del servidor
apiClient.interceptors.response.use(
  (response) => {
    // Si la respuesta fue exitosa y veníamos de un estado caído, emitir recuperación
    if (window._app_is_server_down) {
      window._app_is_server_down = false;
      window.dispatchEvent(new CustomEvent("app_server_up"));
    }
    return response;
  },
  (error) => {
    const isNetworkError =
      !error.response ||
      error.code === "ERR_NETWORK" ||
      error.code === "ECONNREFUSED" ||
      error.message === "Network Error";
    const isServer5xx =
      error.response && [502, 503, 504].includes(error.response.status);

    if (isNetworkError || isServer5xx) {
      const isHealthCheck =
        error.config?.url?.includes("/health") || error.config?.isHealthProbe;
      if (!isHealthCheck) {
        window._app_is_server_down = true;
        window.dispatchEvent(
          new CustomEvent("app_server_down", {
            detail: {
              status: error.response?.status || 0,
              message: error.message || "Servidor inaccesible",
            },
          }),
        );
      }
    } else if (error.response && error.response.status === 401) {
      // Si la ruta no es la de login ni setup, limpiar sesión si token expira
      const url = error.config?.url || "";
      if (!url.includes("/auth/login") && !url.includes("/auth/setup")) {
        localStorage.removeItem("app_token");
        localStorage.removeItem("app_user");
        localStorage.removeItem("fruver_token");
        localStorage.removeItem("fruver_user");
        window.dispatchEvent(new Event("app_session_expired"));
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Realiza un sondeo (ping) rápido al backend para comprobar si el servicio está en línea.
 */
export async function checkServerHealth(timeoutMs = 4000) {
  try {
    const rootUrl = API_BASE_URL.replace("/api", "") || "http://127.0.0.1:8000";
    await axios.get(`${rootUrl}/`, {
      timeout: timeoutMs,
      isHealthProbe: true,
      headers: { "Cache-Control": "no-cache" },
    });
    window._app_is_server_down = false;
    window._fruver_is_server_down = false;
    window.dispatchEvent(new CustomEvent("app_server_up"));
    window.dispatchEvent(new CustomEvent("fruver_server_up"));
    return true;
  } catch {
    return false;
  }
}

export default apiClient;
