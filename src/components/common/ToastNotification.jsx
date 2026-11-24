import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

export default function ToastNotification({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  const isWarning = toast.type === "warning";
  const isInfo = toast.type === "info";

  return (
    <div
      role="alert"
      className={`fixed bottom-20 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-50 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold text-white transition-all transform duration-300 max-w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 ${
        isError
          ? "bg-rose-600 border border-rose-500 shadow-rose-900/30"
          : isWarning
            ? "bg-amber-600 border border-amber-500 shadow-amber-900/30"
            : isInfo
              ? "bg-sky-600 border border-sky-500 shadow-sky-900/30"
              : "bg-slate-900 border border-emerald-500/80 shadow-slate-950/40"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {isError ? (
          <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
        ) : isWarning ? (
          <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
        ) : isInfo ? (
          <Info className="w-4 h-4 text-sky-200 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span className="leading-snug break-words">{toast.msg}</span>
      </div>
      <button
        onClick={onClose}
        className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer shrink-0 ml-2"
        title="Cerrar notificación"
        aria-label="Cerrar notificación"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
