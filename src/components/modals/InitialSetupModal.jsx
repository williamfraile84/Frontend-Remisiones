import React, { useState } from "react";
import {
  Building2,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Hash,
  Building,
  ImageIcon,
  X,
} from "lucide-react";

export default function InitialSetupModal({
  onSave,
  onCancel = null,
  title = "Configuración Inicial de Empresa",
  description = "Ingrese los datos de su negocio. Esta configuración inicial se guardará de forma persistente.",
}) {
  const [formData, setFormData] = useState({
    nombre: "",
    nit: "",
    direccion: "",
    telefono: "",
    email: "",
    campos_extra: [],
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.nit.trim()) {
      alert("La Razón Social y el NIT son obligatorios.");
      return;
    }
    setSubmitting(true);
    await onSave(formData, logoFile);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 max-w-xl w-full rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer z-10"
            title="Cancelar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {/* Header Fijo */}
        <div className="text-center p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/80 shrink-0">
          <div className="w-12 h-12 bg-emerald-600 text-white flex items-center justify-center rounded-2xl mx-auto shadow-md shadow-emerald-600/30 mb-2">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {description}
          </p>
        </div>

        {/* Cuerpo Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <div className="flex-1 space-y-1 text-center sm:text-left min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Logo de la Empresa
                </span>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                  Aparecerá en el encabezado de las notas de remisión e informes oficiales.
                </p>
                <label className="inline-block bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition shadow-xs">
                  Seleccionar Imagen
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 mb-1 text-slate-600 dark:text-slate-300">
                <Building className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Razón Social / Nombre Comercial *
              </label>
              <input
                required
                type="text"
                placeholder="Ej. NOMBRE EMPRESA"
                className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded-xl p-2.5 sm:p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold uppercase transition"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 mb-1 text-slate-600 dark:text-slate-300">
                <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> NIT / Identificación Tributaria *
              </label>
              <input
                required
                type="text"
                placeholder="Ej. 00000000-0"
                className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded-xl p-2.5 sm:p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition"
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
                placeholder="Ej. CR 00 #00-00 BARRIO"
                className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded-xl p-2.5 sm:p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
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
                  placeholder="Ej. 3000000000"
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded-xl p-2.5 sm:p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
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
                  placeholder="contacto@contacto.com"
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded-xl p-2.5 sm:p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Footer Fijo */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/80 p-3.5 sm:p-4 flex justify-end shrink-0">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3 px-8 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? "Guardando..." : "Guardar y Continuar"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
