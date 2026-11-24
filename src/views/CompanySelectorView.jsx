import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  Building2,
  Plus,
  MapPin,
  Hash,
  Phone,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { useCompanyContext } from "../context/CompanyContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../api/apiClient";
import InitialSetupModal from "../components/modals/InitialSetupModal";

export default function CompanySelectorView() {
  const navigate = useNavigate();
  const {
    empresa,
    empresas,
    empresaConfigurada,
    seleccionarEmpresa,
    crearNuevaEmpresa,
    loading,
  } = useCompanyContext();
  const { isAdmin, logout } = useAuth();
  useToast();

  const [modalNuevaEmpresaOpen, setModalNuevaEmpresaOpen] = useState(false);

  // Si no hay ninguna empresa en la BD, redirigir a /setup-empresa
  if (!loading && !empresaConfigurada) {
    return <Navigate to="/setup-empresa" replace />;
  }

  // Si solo hay una empresa y ya está activa, ir a /pedidos
  if (!loading && empresas.length === 1 && empresa) {
    return <Navigate to="/pedidos" replace />;
  }

  const getLogoUrl = (empresaItem) => {
    if (!empresaItem?.logo_path) return null;
    const clean = empresaItem.logo_path.replace(/\\/g, "/").replace(/^\/+/, "");
    const base = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${base}/api/storage/${clean}`;
  };

  const handleSelect = (emp) => {
    seleccionarEmpresa(emp);
    navigate("/pedidos", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-3 sm:p-6 relative overflow-hidden font-sans">
      {/* Luces de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-80 sm:w-96 h-80 sm:h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-80 sm:w-96 h-80 sm:h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-800 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Building2 className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                Seleccionar Empresa de Trabajo
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Seleccione la sucursal o razón social sobre la cual va a operar en esta sesión.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setModalNuevaEmpresaOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva Empresa</span>
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lista de Empresas */}
        <div className="p-5 sm:p-7 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
          {empresas.map((emp) => {
            const logoUrl = getLogoUrl(emp);
            const esActiva = empresa?.id === emp.id;

            return (
              <div
                key={emp.id}
                onClick={() => handleSelect(emp)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                  esActiva
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs"
                    : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500 hover:bg-slate-50/80 dark:hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={emp.nombre}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase truncate">
                        {emp.nombre}
                      </h4>
                      {esActiva && (
                        <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                          ACTUAL
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {emp.nit && (
                        <span className="flex items-center gap-1 font-mono font-medium">
                          <Hash className="w-3 h-3 text-slate-400" />
                          {emp.nit}
                        </span>
                      )}
                      {emp.direccion && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {emp.direccion}
                        </span>
                      )}
                      {emp.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {emp.telefono}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex sm:justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(emp);
                    }}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      esActiva
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:bg-emerald-600 group-hover:text-white"
                    }`}
                  >
                    <span>{esActiva ? "Continuar" : "Seleccionar"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal para Crear Nueva Empresa */}
      {modalNuevaEmpresaOpen && (
        <InitialSetupModal
          onSave={crearNuevaEmpresa}
          onCancel={() => setModalNuevaEmpresaOpen(false)}
          title="Registrar Nueva Empresa"
          description="Ingrese los datos de la nueva empresa o sucursal."
        />
      )}
    </div>
  );
}
