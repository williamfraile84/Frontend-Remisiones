import React, { useState } from "react";
import {
  Building2,
  Upload,
  Trash2,
  Plus,
  X,
  Save,
  ImageIcon,
} from "lucide-react";
import { API_BASE_URL } from "../../api/apiClient";

export default function CompanyProfileModal({
  empresa,
  isOpen,
  onClose,
  onUpdateEmpresa,
  onUploadLogo,
}) {
  const [formData, setFormData] = useState({
    nombre: empresa?.nombre || "",
    nit: empresa?.nit || "",
    direccion: empresa?.direccion || "",
    telefono: empresa?.telefono || "",
    email: empresa?.email || "",
    campos_extra: Array.isArray(empresa?.campos_extra)
      ? empresa.campos_extra
      : [],
  });
  const [nuevoCampo, setNuevoCampo] = useState({ clave: "", valor: "" });
  const [prevEmpresa, setPrevEmpresa] = useState(empresa);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (empresa !== prevEmpresa || isOpen !== prevIsOpen) {
    setPrevEmpresa(empresa);
    setPrevIsOpen(isOpen);
    if (empresa) {
      setFormData({
        nombre: empresa.nombre || "",
        nit: empresa.nit || "",
        direccion: empresa.direccion || "",
        telefono: empresa.telefono || "",
        email: empresa.email || "",
        campos_extra: Array.isArray(empresa.campos_extra)
          ? empresa.campos_extra
          : [],
      });
    }
  }

  if (!isOpen) return null;

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await onUploadLogo(file);
    }
  };

  const agregarCampoExtra = () => {
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

  const eliminarCampoExtra = (id) => {
    setFormData({
      ...formData,
      campos_extra: formData.campos_extra.filter((c) => c.id !== id),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateEmpresa(formData);
  };

  const logoUrl = empresa?.logo_path
    ? `${API_BASE_URL.replace("/api", "")}/storage_data/${empresa.logo_path}`
    : null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Fijo */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 min-w-0">
            <Building2 className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-base truncate">
              Perfil y Configuración de Empresa
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            {/* Logo de la Empresa */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 sm:gap-4 p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-center sm:text-left">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <ImageIcon className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Logo Corporativo
                </span>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 font-normal">
                  Se incluirá automáticamente en las notas de remisión e informes oficiales.
                </p>
                <label className="inline-flex items-center gap-1.5 bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition shadow-xs">
                  <Upload className="w-3.5 h-3.5 shrink-0" /> <span>Cambiar Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            </div>

            {/* Inputs de la Empresa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 dark:text-slate-300 block mb-1">Razón Social *</label>
                <input
                  required
                  type="text"
                  placeholder="Nombre de la empresa"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white uppercase bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-300 block mb-1">NIT *</label>
                <input
                  required
                  type="text"
                  placeholder="NIT / Cédula"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={formData.nit}
                  onChange={(e) =>
                    setFormData({ ...formData, nit: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-300 block mb-1">Dirección</label>
                <input
                  type="text"
                  placeholder="Dirección fiscal"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-normal text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-300 block mb-1">Teléfono</label>
                <input
                  type="text"
                  placeholder="Teléfono comercial"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-normal text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-slate-600 dark:text-slate-300 block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="contacto@empresa.com"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-normal text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Campos Extra */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                Campos Personalizados de Empresa
              </span>
              {(formData.campos_extra || []).map((c) => (
                <div key={c.id} className="flex gap-2 items-center">
                  <span className="w-1/3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-slate-700 dark:text-slate-200 truncate">
                    {c.clave}
                  </span>
                  <span className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-slate-700 dark:text-slate-200 truncate">
                    {c.valor}
                  </span>
                  <button
                    type="button"
                    onClick={() => eliminarCampoExtra(c.id)}
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
                  placeholder="Nombre Campo (ej. Régimen)"
                  className="sm:w-1/3 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-normal bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  value={nuevoCampo.clave}
                  onChange={(e) =>
                    setNuevoCampo({ ...nuevoCampo, clave: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Valor"
                  className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-normal bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  value={nuevoCampo.valor}
                  onChange={(e) =>
                    setNuevoCampo({ ...nuevoCampo, valor: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={agregarCampoExtra}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1 font-bold cursor-pointer shrink-0 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Añadir</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Fijo */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900 p-3.5 sm:p-4 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" /> <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
