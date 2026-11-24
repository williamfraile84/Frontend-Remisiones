import React, { useState } from "react";
import {
  Users,
  CheckCircle,
  X,
  MapPin,
  Phone,
  Mail,
  Hash,
  Building,
} from "lucide-react";

export default function ClientQuickRegisterModal({
  initialData,
  isOpen,
  onClose,
  onSaveClient,
}) {
  const [formData, setFormData] = useState({
    razon_social: initialData?.razon_social || "",
    nit: initialData?.nit || "",
    direccion: initialData?.direccion || "",
    telefono: initialData?.telefono || "",
    email: initialData?.email || "",
    consecutivo_remision_actual: 1,
  });
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    if (initialData) {
      setFormData({
        razon_social: initialData.razon_social || "",
        nit: initialData.nit || "",
        direccion: initialData.direccion || "",
        telefono: initialData.telefono || "",
        email: initialData.email || "",
        consecutivo_remision_actual: 1,
      });
    }
  }

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.razon_social.trim() || !formData.nit.trim()) {
      alert("La Razón Social y el NIT del cliente son obligatorios.");
      return;
    }
    onSaveClient(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Fijo */}
        <div className="flex justify-between items-start p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/80 shrink-0">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-base truncate">
                Nuevo Cliente Detectado
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
              Datos extraídos automáticamente del documento cargado.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-3.5 overflow-y-auto custom-scrollbar flex-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div>
              <label className="flex items-center gap-1.5 mb-1 text-slate-600 dark:text-slate-300">
                <Building className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Razón Social *
              </label>
              <input
                required
                type="text"
                placeholder="Razón social del cliente"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-bold transition"
                value={formData.razon_social}
                onChange={(e) =>
                  setFormData({ ...formData, razon_social: e.target.value })
                }
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 mb-1 text-slate-600 dark:text-slate-300">
                <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> NIT / Cédula *
              </label>
              <input
                required
                type="text"
                placeholder="NIT / Cédula"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition"
                value={formData.nit}
                onChange={(e) =>
                  setFormData({ ...formData, nit: e.target.value })
                }
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 mb-1 text-slate-600 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Dirección
              </label>
              <input
                type="text"
                placeholder="Dirección del cliente"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-normal transition"
                value={formData.direccion}
                onChange={(e) =>
                  setFormData({ ...formData, direccion: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 mb-1 text-slate-600 dark:text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Teléfono
                </label>
                <input
                  type="text"
                  placeholder="Teléfono"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-normal transition"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 mb-1 text-slate-600 dark:text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Email
                </label>
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-normal transition"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 mb-1 text-slate-600 dark:text-slate-300">
                Consecutivo Inicial de Remisión
              </label>
              <input
                type="number"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition"
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

          {/* Footer Fijo */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/80 p-3.5 sm:p-4 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-emerald-600 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" /> <span>Registrar y Vincular</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
