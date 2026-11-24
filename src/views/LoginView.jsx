import React, { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCompanyContext } from "../context/CompanyContext";
import { useToast } from "../context/ToastContext";

export default function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { login, setupAdmin, needsSetup, isAuthenticated } = useAuth();
  const { empresaConfigurada, empresas, empresa, verificarEstado } =
    useCompanyContext();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Si ya está autenticado, redirigir atómicamente según el estado del sistema
  if (isAuthenticated) {
    if (!empresaConfigurada) {
      return <Navigate to="/setup-empresa" replace />;
    }
    if (!empresa && empresas.length > 1) {
      return <Navigate to="/seleccionar-empresa" replace />;
    }
    const target = location.state?.from?.pathname || "/pedidos";
    return <Navigate to={target === "/login" ? "/pedidos" : target} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast("Por favor complete todos los campos requeridos.", "error");
      return;
    }

    setLoading(true);
    try {
      if (needsSetup) {
        if (!nombreCompleto.trim()) {
          showToast(
            "El nombre completo es obligatorio para configurar el administrador.",
            "error",
          );
          setLoading(false);
          return;
        }
        await setupAdmin({
          username: username.trim(),
          nombre_completo: nombreCompleto.trim(),
          email: email.trim() || null,
          password,
        });
        showToast(
          "¡Administrador configurado con éxito! Bienvenido al sistema.",
        );
        navigate("/setup-empresa", { replace: true });
      } else {
        await login(username.trim(), password);
        showToast("Inicio de sesión exitoso.");
        try {
          await verificarEstado();
        } catch {
          // ignore
        }
        const from = location.state?.from?.pathname || "/pedidos";
        navigate(from === "/login" ? "/pedidos" : from, { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        "Error en autenticación. Verifique sus credenciales.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-3 sm:p-4 relative overflow-hidden font-sans transition-colors duration-200">
      {/* Botón Flotante Selector de Tema */}
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-30 p-2 sm:px-3 sm:py-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-md backdrop-blur-md flex items-center gap-2 text-xs font-bold"
        title={isDark ? "Cambiar a Modo Claro (☀️)" : "Cambiar a Modo Oscuro (🌙)"}
        aria-label="Alternar tema claro y oscuro"
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Claro</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span className="hidden sm:inline">Oscuro</span>
          </>
        )}
      </button>

      {/* Elementos visuales de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-72 sm:w-96 h-72 sm:h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-72 sm:w-96 h-72 sm:h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Cabecera del Login */}
        <div className="bg-slate-950 p-6 sm:p-8 text-center text-white relative border-b border-slate-850">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3 sm:mb-4 border border-emerald-300/30">
            <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-slate-950" />
          </div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
            Sistema de Gestión
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {needsSetup
              ? "Configuración Inicial de Administrador"
              : "Gestión de Pedidos, Remisiones & Logística"}
          </p>

          {needsSetup && (
            <div className="mt-3 inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5" /> Primer Inicio del Sistema
            </div>
          )}
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-8 space-y-3.5 sm:space-y-4"
        >
          {needsSetup && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Nombre Completo del Administrador *
              </label>
              <input
                type="text"
                required
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="ej: Carlos Alberto Pérez"
                className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          )}

          {needsSetup && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Correo Electrónico (Opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ej: admin@empresa.com"
                className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
              Usuario o Correo *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={needsSetup ? "ej: admin" : "Ingrese su usuario"}
                className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 rounded-xl p-3 pl-10 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
              Contraseña *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 rounded-xl p-3 pl-10 pr-10 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3.5 top-3.5 cursor-pointer p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>
              {loading
                ? "Verificando..."
                : needsSetup
                  ? "Crear Administrador & Entrar"
                  : "Iniciar Sesión"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">
            Control de Acceso Seguro & Trazabilidad Inmutable &copy;{" "}
            {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
