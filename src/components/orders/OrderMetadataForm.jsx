import React from "react";
import {
  Hash,
  FileSpreadsheet,
  Calendar,
  Package,
  FileText,
  Check,
} from "lucide-react";

export const NOTA_ESTANDAR_ENTREGA =
  "Recibido a satisfacción por el responsable designado en el punto de entrega.";

export default function OrderMetadataForm({
  numeroRemision,
  setNumeroRemision,
  numeroOC,
  setNumeroOC,
  fechaEntrega,
  setFechaEntrega,
  numeroCanastas,
  setNumeroCanastas,
  observaciones = "",
  setObservaciones,
  isPedidoBloqueado,
  triggerAutoSave,
}) {
  const usarNotaEstandar = () => {
    if (setObservaciones) {
      setObservaciones(NOTA_ESTANDAR_ENTREGA);
      triggerAutoSave();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 transition-colors">
      {/* 4 Campos Principales */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 text-xs font-semibold">
        {/* Nº Remisión */}
        <div className="space-y-1.5">
          <label className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
            <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Hash className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">Nº Remisión</span>
          </label>
          <input
            disabled={isPedidoBloqueado}
            type="text"
            placeholder="Ej: 1045"
            className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-800 rounded-xl p-2.5 sm:p-3 font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 dark:disabled:text-slate-600 transition shadow-2xs font-mono"
            value={numeroRemision}
            onChange={(e) => {
              setNumeroRemision(e.target.value);
              triggerAutoSave();
            }}
          />
        </div>

        {/* Nº Orden Compra (OC) */}
        <div className="space-y-1.5">
          <label className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
            <div className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">Nº Orden Compra (OC)</span>
          </label>
          <input
            disabled={isPedidoBloqueado}
            type="text"
            placeholder="Ej: OC-8921"
            className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-800 rounded-xl p-2.5 sm:p-3 font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 dark:disabled:text-slate-600 transition shadow-2xs"
            value={numeroOC}
            onChange={(e) => {
              setNumeroOC(e.target.value);
              triggerAutoSave();
            }}
          />
        </div>

        {/* Fecha Entrega */}
        <div className="space-y-1.5">
          <label className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
            <div className="w-5 h-5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">Fecha Entrega</span>
          </label>
          <input
            disabled={isPedidoBloqueado}
            type="text"
            placeholder="DD/MM/AAAA"
            className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-800 rounded-xl p-2.5 sm:p-3 font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 dark:disabled:text-slate-600 transition shadow-2xs"
            value={fechaEntrega}
            onChange={(e) => {
              setFechaEntrega(e.target.value);
              triggerAutoSave();
            }}
          />
        </div>

        {/* Nº Canastillas */}
        <div className="space-y-1.5">
          <label className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
            <div className="w-5 h-5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Package className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">Nº Canastillas</span>
          </label>
          <input
            disabled={isPedidoBloqueado}
            type="text"
            placeholder="Ej: 14 canastillas"
            className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-800 rounded-xl p-2.5 sm:p-3 font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 dark:disabled:text-slate-600 transition shadow-2xs"
            value={numeroCanastas}
            onChange={(e) => {
              setNumeroCanastas(e.target.value);
              triggerAutoSave();
            }}
          />
        </div>
      </div>

      {/* Campo Amplio de Observaciones / Términos de Entrega */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
            <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span>Observaciones / Términos de Entrega</span>
          </label>
          {!isPedidoBloqueado && setObservaciones && (
            <button
              type="button"
              onClick={usarNotaEstandar}
              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer border border-emerald-200/50 dark:border-emerald-800/50"
              title="Insertar nota legal de entrega a satisfacción"
            >
              <Check className="w-3 h-3" />
              <span>Usar Nota Estándar de Entrega</span>
            </button>
          )}
        </div>
        <textarea
          disabled={isPedidoBloqueado}
          rows={3}
          placeholder='Ej: "Recibido a satisfacción por el responsable designado en el punto de entrega."'
          className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-800 rounded-xl p-3 font-medium text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 dark:disabled:text-slate-600 transition shadow-2xs min-h-[90px] resize-y custom-scrollbar"
          value={observaciones}
          onChange={(e) => {
            if (setObservaciones) {
              setObservaciones(e.target.value);
              triggerAutoSave();
            }
          }}
        />
      </div>
    </div>
  );
}
