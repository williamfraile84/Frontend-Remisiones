import React from "react";
import { Building2, Plus, Check, MapPin, Hash, Phone, ArrowRight } from "lucide-react";
import { API_BASE_URL } from "../../api/apiClient";

export default function CompanySelectorModal({
  isOpen,
  onClose,
  empresas = [],
  empresaActiva = null,
  onSelectEmpresa,
  onOpenNuevaEmpresa,
  canCreate = true,
}) {
  if (!isOpen) return null;

  const getLogoUrl = (empresaItem) => {
    if (!empresaItem?.logo_path) return null;
    const clean = empresaItem.logo_path.replace(/\\/g, "/").replace(/^\/+/, "");
    const base = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${base}/api/storage/${clean}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 text-white flex items-center justify-center rounded-2xl shadow-md shadow-emerald-600/30 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Seleccionar Empresa
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Elija la empresa u organización sobre la cual desea operar en esta sesión.
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-sm font-bold"
            >
              Cerrar
            </button>
          )}
        </div>

        {/* Lista de Empresas */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
          {empresas.length === 0 ? (
            <div className="text-center py-10">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No hay empresas registradas</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                Registre la primera empresa para comenzar a operar el sistema.
              </p>
            </div>
          ) : (
            empresas.map((item) => {
              const isSelected = empresaActiva && empresaActiva.id === item.id;
              const logoUrl = getLogoUrl(item);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectEmpresa(item)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 shadow-sm ring-2 ring-emerald-500/20"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/80 dark:hover:bg-slate-800 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={item.nombre}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {item.nombre}
                        </h3>
                        {isSelected && (
                          <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3" /> Activa
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-slate-400 shrink-0" />
                          NIT: {item.nit}
                        </span>
                        {item.direccion && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {item.direccion}
                          </span>
                        )}
                        {item.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            {item.telefono}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEmpresa(item);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{isSelected ? "Seleccionada" : "Trabajar Aquí"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {canCreate && (
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              ¿Desea registrar otra empresa o sucursal?
            </span>
            <button
              type="button"
              onClick={onOpenNuevaEmpresa}
              className="w-full sm:w-auto bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-white py-2.5 px-5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Registrar Nueva Empresa</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
