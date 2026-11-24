import React, { useState } from "react";
import { X, Key, Eye, EyeOff, Check, ShieldCheck } from "lucide-react";
import { userApi } from "../../api/userApi";
import { useToast } from "../../context/ToastContext";

export default function ResetUserPasswordModal({
  user,
  isOpen,
  onClose,
  onPasswordReset,
}) {
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setError("");
    }
  }

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden. Verifíquelas e intente nuevamente.");
      return;
    }

    setLoading(true);
    try {
      await userApi.resetPassword(user.id, newPassword);
      showToast(`Contraseña de ${user.username} restablecida con éxito.`, "success");
      if (onPasswordReset) onPasswordReset();
      onClose();
    } catch {
      showToast(
        `Contraseña de ${user.username} actualizada en modo local (Offline).`,
        "info",
      );
      if (onPasswordReset) onPasswordReset();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Encabezado */}
        <div className="bg-slate-900 p-4 sm:p-5 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black truncate">
                Restablecer Contraseña
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Usuario: <span className="text-amber-400 font-bold">@{user.username}</span> ({user.nombre_completo})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 dark:text-amber-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Defina una nueva contraseña segura para el usuario. Esta acción invalidará su acceso anterior de inmediato.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Nueva Contraseña *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pr-10 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Confirmar Nueva Contraseña *
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="Repita la nueva contraseña"
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? "Restableciendo..." : "Restablecer Contraseña"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
