import { useState, useEffect, useCallback } from "react";
import {
  ServerOff,
  RefreshCw,
  ShieldCheck,
  Activity,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { checkServerHealth } from "../api/apiClient";

export default function ServerDownView({ onReconnected, onContinueOffline }) {
  const [checking, setChecking] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [lastCheckFailed, setLastCheckFailed] = useState(false);
  const [hasDraft] = useState(() => {
    try {
      const rawDraft =
        localStorage.getItem("app_order_draft") ||
        localStorage.getItem("fruver_order_draft");
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        return Boolean(
          parsed &&
            ((parsed.productos && parsed.productos.length > 0) ||
              parsed.numeroOC)
        );
      }
    } catch {
      // ignore
    }
    return false;
  });

  const probarConexion = useCallback(async () => {
    setChecking(true);
    setLastCheckFailed(false);
    const isOnline = await checkServerHealth(3500);
    setChecking(false);
    if (isOnline) {
      if (onReconnected) onReconnected();
    } else {
      setLastCheckFailed(true);
      setCountdown(5);
    }
  }, [onReconnected]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          probarConexion();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [probarConexion]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 antialiased selection:bg-red-500 selection:text-white">
      <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-red-950/80 border-2 border-red-500/40 flex items-center justify-center text-red-400 shadow-lg shadow-red-950/50 animate-pulse">
              <ServerOff className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-slate-900" />
            </span>
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
              <Activity className="w-3 h-3 animate-spin" /> Conexión con Backend
              Interrumpida
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Servidor No Disponible
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
            No se pudo establecer comunicación con el{" "}
            <code className="text-amber-300 font-mono bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
              Servicio Backend
            </code>
            . El sistema está reintentando la conexión de forma automática.
          </p>
        </div>

        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3 text-left">
          <div className="p-2 rounded-xl bg-emerald-900/50 text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
              <span>Tus Datos Están Protegidos</span>
              {hasDraft && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                  Borrador Activo Guardado
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-300 leading-normal">
              La información del navegador se encuentra respaldada de forma
              segura. Tan pronto como el servidor en la nube responda, se
              sincronizará automáticamente.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={probarConexion}
            disabled={checking}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white font-black text-xs sm:text-sm py-3.5 px-5 rounded-2xl transition flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/50 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${checking ? "animate-spin" : ""}`}
            />
            <span>
              {checking
                ? "Comprobando conexión..."
                : "Reintentar Conexión Ahora"}
            </span>
          </button>

          {onContinueOffline && (
            <button
              onClick={onContinueOffline}
              type="button"
              className="w-full bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
            >
              <span>Continuar en Modo Local (Solo Consulta)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Reintentando automáticamente en:
            </span>
            <span className="font-mono font-bold text-amber-400 tabular-nums text-xs">
              {countdown}s
            </span>
          </div>

          {lastCheckFailed && (
            <div className="text-[11px] text-red-400 bg-red-950/50 border border-red-500/20 rounded-xl p-2.5 text-center font-semibold flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              El backend aún no responde. Verifique el estado de la API o la
              conexión a internet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
