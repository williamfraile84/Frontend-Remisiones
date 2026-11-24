import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  Building2,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Hash,
  Building,
  ImageIcon,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { useCompanyContext } from "../context/CompanyContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function InitialSetupView() {
  const navigate = useNavigate();
  const { empresaConfigurada, guardarInicial, loading } = useCompanyContext();
  const { isAdmin, logout } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    nit: "",
    direccion: "",
    telefono: "",
    email: "",
    ciudad: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Si ya está configurada, redirigir atómicamente a /pedidos
  if (!loading && empresaConfigurada) {
    return <Navigate to="/pedidos" replace />;
  }

  // Si no es administrador, no tiene permisos de configuración inicial
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl mx-auto flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Configuración Pendiente
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Aún no se ha registrado la empresa en el sistema. El usuario administrador debe completar la configuración inicial.
          </p>
          <button
            onClick={logout}
            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    );
  }

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
      showToast("La Razón Social y el NIT son obligatorios.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const ok = await guardarInicial(formData, logoFile);
      if (ok) {
        showToast("¡Empresa configurada exitosamente! Bienvenido.");
        navigate("/pedidos", { replace: true });
      }
    } catch {
      showToast("Error al guardar la configuración inicial.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-3 sm:p-6 relative overflow-hidden font-sans">
      {/* Luces de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-80 sm:w-96 h-80 sm:h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-80 sm:w-96 h-80 sm:h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="bg-slate-950 p-6 sm:p-7 text-center text-white relative border-b border-slate-800">
          <button
            type="button"
            onClick={logout}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800/80 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>

          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3 border border-emerald-300/30">
            <Building2 className="w-7 h-7 text-slate-950" />
          </div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
            Configuración Inicial de Empresa
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Defina la información legal y corporativa de su negocio para iniciar la operación del sistema.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Razón Social */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-600" />
                <span>Razón Social / Nombre Comercial *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: DISTRIBUIDORA FRUVER LA SABANA S.A.S"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value.toUpperCase() })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            {/* NIT */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-600" />
                <span>NIT / Documento *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 901.234.567-8"
                value={formData.nit}
                onChange={(e) =>
                  setFormData({ ...formData, nit: e.target.value.toUpperCase() })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ciudad / Municipio</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Bogotá D.C."
                value={formData.ciudad}
                onChange={(e) =>
                  setFormData({ ...formData, ciudad: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            {/* Dirección */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dirección Comercial / Sede Principal</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Corabastos Bodega 12 Local 4"
                value={formData.direccion}
                onChange={(e) =>
                  setFormData({ ...formData, direccion: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Teléfono de Contacto</span>
              </label>
              <input
                type="tel"
                placeholder="Ej: 310 123 4567"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>Correo Electrónico</span>
              </label>
              <input
                type="email"
                placeholder="Ej: ventas@empresa.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Logo Corporativo */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Logo Corporativo (Opcional - Para Remisiones y Facturas)</span>
            </label>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Vista previa logo"
                  className="w-14 h-14 object-contain rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 bg-slate-200/80 dark:bg-slate-700/80 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoChange}
                  className="text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 dark:file:bg-emerald-950/40 file:text-emerald-700 dark:file:text-emerald-300 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-900/40 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Formatos recomendados: PNG o JPG con fondo transparente o blanco.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {submitting
                  ? "Guardando Configuración..."
                  : "Guardar Empresa y Comenzar"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
