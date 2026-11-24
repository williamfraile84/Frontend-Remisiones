import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { companyApi } from "../api/companyApi";
import { useToast } from "./ToastContext";
import { useAuth } from "./AuthContext";

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  const [empresaConfigurada, setEmpresaConfigurada] = useState(() => {
    try {
      const cached = localStorage.getItem("app_empresa_configurada");
      return cached !== null ? JSON.parse(cached) : true;
    } catch {
      return true;
    }
  });

  const [empresas, setEmpresas] = useState(() => {
    try {
      const cached = localStorage.getItem("app_empresas_lista");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [empresa, setEmpresa] = useState(() => {
    try {
      const cached = localStorage.getItem("app_empresa_cache");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [modalSelectorOpen, setModalSelectorOpen] = useState(false);
  const [modalNuevaEmpresaOpen, setModalNuevaEmpresaOpen] = useState(false);
  const [loading, setLoading] = useState(
    () =>
      !(
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("dev_auto_auth") === "1"
      ),
  );
  const [isVerifying, setIsVerifying] = useState(false);

  const seleccionarEmpresa = useCallback(
    (empresaOId) => {
      let target = null;
      if (typeof empresaOId === "object" && empresaOId !== null) {
        target = empresaOId;
      } else if (empresaOId) {
        target = empresas.find((e) => e.id === Number(empresaOId)) || null;
      }

      if (target) {
        setEmpresa(target);
        localStorage.setItem("app_empresa_activa_id", String(target.id));
        localStorage.setItem("app_empresa_cache", JSON.stringify(target));
        setModalSelectorOpen(false);
        showToast(`Empresa activa: ${target.nombre}`);
        // Notificar cambio de empresa
        window.dispatchEvent(
          new CustomEvent("app_empresa_cambiada", { detail: target }),
        );
      }
    },
    [empresas, showToast],
  );

  const verificarEstado = useCallback(async () => {
    try {
      setIsVerifying(true);
      const activeId = localStorage.getItem("app_empresa_activa_id");
      const data = await companyApi.getStatus(
        activeId ? Number(activeId) : null,
      );

      const listaEmpresas =
        data.empresas || (data.empresa ? [data.empresa] : []);
      setEmpresas(listaEmpresas);
      try {
        localStorage.setItem(
          "app_empresas_lista",
          JSON.stringify(listaEmpresas),
        );
      } catch { // ignore
    }

      setEmpresaConfigurada(data.configurada);
      try {
        localStorage.setItem(
          "app_empresa_configurada",
          JSON.stringify(data.configurada),
        );
      } catch { // ignore
    }

      if (!data.configurada || listaEmpresas.length === 0) {
        setEmpresa(null);
        localStorage.removeItem("app_empresa_activa_id");
        localStorage.removeItem("app_empresa_cache");
        return;
      }

      // Si hay una empresa activa devuelta por el backend
      if (data.empresa) {
        setEmpresa(data.empresa);
        localStorage.setItem("app_empresa_activa_id", String(data.empresa.id));
        localStorage.setItem(
          "app_empresa_cache",
          JSON.stringify(data.empresa),
        );
      } else if (listaEmpresas.length === 1) {
        // Si solo hay 1 empresa registrada, auto-seleccionarla
        const unica = listaEmpresas[0];
        setEmpresa(unica);
        localStorage.setItem("app_empresa_activa_id", String(unica.id));
        localStorage.setItem("app_empresa_cache", JSON.stringify(unica));
      } else if (listaEmpresas.length > 1 && !activeId) {
        // Múltiples empresas sin selección previa
        setEmpresa(null);
      }
    } catch {
      // Modo offline: usar datos en caché
      const cached = localStorage.getItem("app_empresa_cache");
      if (cached) {
        try {
          setEmpresa(JSON.parse(cached));
          setEmpresaConfigurada(true);
        } catch { // ignore
    }
      }
    } finally {
      setIsVerifying(false);
      setLoading(false);
    }
  }, []);

  const guardarInicial = async (datos, logoFile) => {
    try {
      setLoading(true);
      const res = await companyApi.saveProfile(datos);
      const nuevaEmpresa = res.empresa;
      setEmpresa(nuevaEmpresa);
      localStorage.setItem("app_empresa_activa_id", String(nuevaEmpresa.id));
      localStorage.setItem("app_empresa_cache", JSON.stringify(nuevaEmpresa));

      if (logoFile) {
        try {
          await companyApi.uploadLogo(logoFile, nuevaEmpresa.id);
        } catch { // ignore
    }
      }

      setEmpresaConfigurada(true);
      localStorage.setItem("app_empresa_configurada", JSON.stringify(true));
      showToast("Empresa configurada exitosamente.");
      await verificarEstado();
      return true;
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        "Error guardando datos iniciales de empresa.";
      showToast(msg, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const crearNuevaEmpresa = async (datos, logoFile) => {
    try {
      setLoading(true);
      const res = await companyApi.saveProfile(datos);
      const nuevaEmpresa = res.empresa;

      if (logoFile) {
        try {
          await companyApi.uploadLogo(logoFile, nuevaEmpresa.id);
        } catch { // ignore
    }
      }

      showToast(`Empresa "${nuevaEmpresa.nombre}" creada con éxito.`);
      setModalNuevaEmpresaOpen(false);
      await verificarEstado();
      seleccionarEmpresa(nuevaEmpresa);
      return true;
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Error al registrar la nueva empresa.";
      showToast(msg, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const actualizarPerfil = async (datos, targetId = null) => {
    try {
      setLoading(true);
      const idToUpdate = targetId || empresa?.id;
      const res = await companyApi.saveProfile(datos, idToUpdate);
      setEmpresa(res.empresa);
      localStorage.setItem("app_empresa_cache", JSON.stringify(res.empresa));
      showToast("Perfil de empresa actualizado.");
      await verificarEstado();
      return true;
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Error al actualizar empresa.";
      showToast(msg, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const subirLogo = async (file, targetId = null) => {
    try {
      const idToUpdate = targetId || empresa?.id;
      const res = await companyApi.uploadLogo(file, idToUpdate);
      setEmpresa((prev) =>
        prev ? { ...prev, logo_path: res.logo_path } : null,
      );
      showToast("Logo actualizado exitosamente.");
      await verificarEstado();
      return true;
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Error al subir el logo corporativo.";
      showToast(msg, "error");
      return false;
    }
  };

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("dev_auto_auth") === "1"
    ) {
      Promise.resolve().then(() => {
        setLoading(false);
      });
      return;
    }

    if (isAuthenticated) {
      Promise.resolve().then(() => {
        verificarEstado();
      });
    } else {
      Promise.resolve().then(() => {
        setLoading(false);
      });
    }
  }, [isAuthenticated, verificarEstado]);

  const value = {
    empresa,
    empresas,
    empresaConfigurada,
    modalSelectorOpen,
    setModalSelectorOpen,
    modalNuevaEmpresaOpen,
    setModalNuevaEmpresaOpen,
    loading,
    isVerifying,
    seleccionarEmpresa,
    guardarInicial,
    crearNuevaEmpresa,
    actualizarPerfil,
    subirLogo,
    verificarEstado,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompanyContext debe ser usado dentro de un CompanyProvider");
  }
  return context;
}

export default CompanyContext;

