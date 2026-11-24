import React, { useState } from "react";
import { Users, Trash2, Plus, X, Save, Building, Hash, MapPin, Phone, Mail, FileText, Sparkles } from "lucide-react";
import { formatNit } from "../../utils/currency";

const DEFAULT_CLIENT = {
  razon_social: "",
  nit: "",
  direccion: "",
  telefono: "",
  email: "",
  consecutivo_remision_actual: 1,
  campos_extra: [],
};

export default function ClientFormModal({
  cliente,
  isOpen,
  onClose,
  onSaveClient,
}) {
  const [formData, setFormData] = useState(DEFAULT_CLIENT);
  const [nuevoCampo, setNuevoCampo] = useState({ clave: "", valor: "" });
  const [prevCliente, setPrevCliente] = useState(cliente);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (cliente !== prevCliente || isOpen !== prevIsOpen) {
    setPrevCliente(cliente);
    setPrevIsOpen(isOpen);
    setFormData(
      cliente
        ? {
            ...cliente,
            campos_extra: Array.isArray(cliente.campos_extra)
              ? cliente.campos_extra
              : [],
          }
        : DEFAULT_CLIENT,
    );
  }

  if (!isOpen) return null;

  const agregarCampo = () => {
    if (!nuevoCampo.clave.trim() || !nuevoCampo.valor.trim()) return;
    setFormData({
      ...formData,
      campos_extra: [
        ...(formData.campos_extra || []),
        { id: Date.now().toString(), ...nuevoCampo },
      ],
    });
    setNuevoCampo({ clave: "", valor: "" });
  };

  const eliminarCampo = (id) => {
    setFormData({
      ...formData,
      campos_extra: formData.campos_extra.filter((c) => c.id !== id),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveClient(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 max-w-xl w-full rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Fijo */}
        <div className="bg-slate-900 p-4 sm:p-5 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-xs sm:text-base truncate">
                {cliente?.id ? `Editar Cliente: ${cliente.razon_social}` : "Añadir Nuevo Cliente"}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {cliente?.id ? "Actualice datos fiscales y consecutivos" : "Registre los datos fiscales y de contacto del cliente"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario y Contenido Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs font-bold text-slate-700 dark:text-slate-200">
            <div>
              <label className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1.5 uppercase text-[11px]">
                <Building className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Razón Social / Nombre Comercial *
              </label>
              <input
                required
                type="text"
                placeholder="Nombre completo o razón social del cliente"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 sm:p-3 uppercase font-bold text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-2xs"
                value={formData.razon_social}
                onChange={(e) =>
                  setFormData({ ...formData, razon_social: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1.5 uppercase text-[11px]">
                  <Hash className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> NIT / Cédula *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej: 900123456-7"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 sm:p-3 font-bold text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-2xs font-mono"
                  value={formData.nit}
                  onBlur={(e) =>
                    setFormData({ ...formData, nit: formatNit(e.target.value) })
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, nit: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1.5 uppercase text-[11px]">
                  <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Consecutivo Remisión Actual
                </label>
                <input
                  type="number"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 sm:p-3 font-bold text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-2xs font-mono"
                  value={formData.consecutivo_remision_actual}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      consecutivo_remision_actual:
                        parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1.5 uppercase text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Dirección de Entrega / Facturación
              </label>
              <input
                type="text"
                placeholder="Dirección fiscal o punto de entrega"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 sm:p-3 font-medium text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-2xs"
                value={formData.direccion}
                onChange={(e) =>
                  setFormData({ ...formData, direccion: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1.5 uppercase text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Teléfono / Celular
                </label>
                <input
                  type="text"
                  placeholder="Número de contacto"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 sm:p-3 font-medium text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-2xs"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1.5 uppercase text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 sm:p-3 font-medium text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-2xs"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Campos Personalizados */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3.5 space-y-2.5">
              <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Campos Adicionales (Conductor, Placa, Bodega...)
              </span>
              {(formData.campos_extra || []).map((c) => (
                <div key={c.id} className="flex gap-2 items-center">
                  <span className="w-1/3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-slate-800 dark:text-slate-200 font-bold truncate">
                    {c.clave}
                  </span>
                  <span className="flex-1 bg-slate-50 dark:bg-slate-850 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-slate-700 dark:text-slate-300 font-medium truncate">
                    {c.valor}
                  </span>
                  <button
                    type="button"
                    onClick={() => eliminarCampo(c.id)}
                    className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition"
                    title="Eliminar campo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Campo (ej. Placa)"
                  className="sm:w-1/3 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  value={nuevoCampo.clave}
                  onChange={(e) =>
                    setNuevoCampo({ ...nuevoCampo, clave: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Valor asignado"
                  className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  value={nuevoCampo.valor}
                  onChange={(e) =>
                    setNuevoCampo({ ...nuevoCampo, valor: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={agregarCampo}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 font-bold cursor-pointer shrink-0 transition"
                >
                  <Plus className="w-4 h-4" /> <span>Añadir</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Fijo */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 p-3.5 sm:p-4 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" /> <span>Guardar Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
