import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authApi } from "../api/authApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved =
        localStorage.getItem("app_user") || localStorage.getItem("fruver_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(
    () =>
      localStorage.getItem("app_token") ||
      localStorage.getItem("fruver_token") ||
      null,
  );
  const [loading, setLoading] = useState(
    () =>
      !(
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("dev_auto_auth") === "1"
      ),
  );
  const [needsSetup, setNeedsSetup] = useState(false);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignorar fallo de red durante logout
    }
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem("app_token");
      localStorage.removeItem("app_user");
      localStorage.removeItem("fruver_token");
      localStorage.removeItem("fruver_user");
      localStorage.removeItem("app_order_draft");
      localStorage.removeItem("fruver_order_draft");
      localStorage.removeItem("app_active_client_id");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (
          !navigator.onLine ||
          (typeof window !== "undefined" &&
            new URLSearchParams(window.location.search).get("dev_auto_auth") ===
              "1")
        ) {
          setNeedsSetup(false);
          setLoading(false);
          return;
        }

        const setupInfo = await authApi.getSetupStatus();
        setNeedsSetup(setupInfo.needs_initial_admin);
        const setupPromise = authApi.getSetupStatus();
        const profilePromise = token ? authApi.getMe() : Promise.resolve(null);

        const [setupResult, profileResult] = await Promise.allSettled([
          setupPromise,
          profilePromise,
        ]);

        if (setupResult.status === "fulfilled") {
          setNeedsSetup(Boolean(setupResult.value?.needs_initial_admin));
        } else {
          const err = setupResult.reason;
          const isNetworkError =
            !err?.response ||
            err?.code === "ERR_NETWORK" ||
            err?.code === "ECONNREFUSED" ||
            err?.message === "Network Error";
          if (isNetworkError) {
            setNeedsSetup(false);
          }
        }

        if (token) {
          const profile = await authApi.getMe();
          setUser(profile);
          localStorage.setItem("app_user", JSON.stringify(profile));
          if (profileResult.status === "fulfilled") {
            const profile = profileResult.value;
            setUser(profile);
            localStorage.setItem("app_user", JSON.stringify(profile));
          } else {
            const err = profileResult.reason;
            if (err?.response?.status === 401) {
              logout();
            }
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        const isNetworkError =
          !err.response ||
          err.code === "ERR_NETWORK" ||
          err.code === "ECONNREFUSED" ||
          err.message === "Network Error";
        !err?.response ||
          err?.code === "ERR_NETWORK" ||
          err?.code === "ECONNREFUSED" ||
          err?.message === "Network Error";

        if (isNetworkError) {
          // Mantener sesión activa offline si hay credenciales guardadas
          setNeedsSetup(false);
        } else if (err?.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const handleExpired = () => {
      logout();
    };

    window.addEventListener("app_session_expired", handleExpired);
    window.addEventListener("fruver_session_expired", handleExpired);
    return () => {
      window.removeEventListener("app_session_expired", handleExpired);
      window.removeEventListener("fruver_session_expired", handleExpired);
    };
  }, [token, logout]);

  const login = async (username, password) => {
    // Al iniciar sesión, siempre iniciar limpio sin clientes ni pedidos residuales
    try {
      localStorage.removeItem("app_order_draft");
      localStorage.removeItem("fruver_order_draft");
      localStorage.removeItem("app_active_client_id");
    } catch {
      // ignore
    }
    const data = await authApi.login({ username, password });
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("app_token", data.access_token);
    localStorage.setItem("app_user", JSON.stringify(data.user));
    setNeedsSetup(false);
    return data.user;
  };

  const setupAdmin = async (adminData) => {
    try {
      localStorage.removeItem("app_order_draft");
      localStorage.removeItem("fruver_order_draft");
      localStorage.removeItem("app_active_client_id");
    } catch {
      // ignore
    }
    const data = await authApi.setupInitialAdmin(adminData);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("app_token", data.access_token);
    localStorage.setItem("app_user", JSON.stringify(data.user));
    setNeedsSetup(false);
    return data.user;
  };

  const hasPermission = (permissionKey) => {
    if (!user) return false;
    if (user.rol === "admin") return true;
    if (!user.permisos || typeof user.permisos !== "object") return false;
    return Boolean(user.permisos[permissionKey]);
  };

  const updateProfileState = (updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem("app_user", JSON.stringify(merged));
      return merged;
    });
  };

  const value = {
    user,
    token,
    loading,
    needsSetup,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.rol === "admin",
    login,
    setupAdmin,
    logout,
    hasPermission,
    updateProfileState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
}
