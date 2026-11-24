import React, { memo } from "react";
import {
  Trash2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { matchProductWithCatalog } from "../../utils/productMatcher";
import UnitSelector from "./UnitSelector";

function OrderItemCard({
  p,
  idx,
  isFirst,
  isLast,
  isPedidoBloqueado,
  catalogProductNames,
  tiposEmpaque,
  onUpdateField,
  onUpdateUnidad,
  onApplyResolvedName,
  onOpenResolveModal,
  onMoveItem,
  onRemoveItem,
}) {
  const match = matchProductWithCatalog(p.producto, catalogProductNames);

  return (
    <div className="bg-slate-50/70 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 space-y-2.5 shadow-2xs transition">
      {/* Fila Superior: Número, Nombre y Acciones */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[11px] flex items-center justify-center shrink-0">
              {idx + 1}
            </span>
            <input
              disabled={isPedidoBloqueado}
              type="text"
              aria-label="Nombre de producto"
              className="flex-1 font-bold text-slate-900 dark:text-slate-100 uppercase text-xs border border-slate-200 dark:border-slate-700 focus:border-emerald-500 bg-white dark:bg-slate-800 rounded-lg px-2.5 py-1.5 outline-none truncate transition shadow-2xs"
              value={p.producto || ""}
              onChange={(e) =>
                onUpdateField(idx, "producto", e.target.value.toUpperCase())
              }
            />
          </div>

          {/* Labels de alerta de productos similares o nuevos */}
          {match.status === "SIMILAR" && (
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/90 dark:border-amber-800 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 text-[11px] font-black">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>⚠️ Producto ambiguo / similar:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {match.similarMatches.slice(0, 2).map((cand) => (
                  <button
                    key={cand}
                    type="button"
                    onClick={() => onApplyResolvedName(idx, cand)}
                    className="text-[10px] font-black uppercase text-amber-950 dark:text-amber-200 bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 hover:text-emerald-900 dark:hover:text-emerald-200 border border-amber-300 dark:border-amber-700 hover:border-emerald-400 px-2 py-0.5 rounded-md transition cursor-pointer shadow-2xs"
                  >
                    Ajustar a "{cand}"
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    onOpenResolveModal(p, idx, match.similarMatches)
                  }
                  className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 underline cursor-pointer pl-1"
                >
                  Ver opciones ({match.similarMatches.length})
                </button>
              </div>
            </div>
          )}

          {match.status === "NEW" && (
            <div className="flex items-center justify-between p-1.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 rounded-xl text-[11px]">
              <span className="flex items-center gap-1 font-bold text-indigo-900 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Nuevo en catálogo
              </span>
              <button
                type="button"
                onClick={() => onOpenResolveModal(p, idx, [])}
                className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-950 px-2 py-0.5 rounded-lg transition cursor-pointer"
              >
                + Añadir al catálogo
              </button>
            </div>
          )}
        </div>

        {!isPedidoBloqueado && (
          <div className="flex items-center gap-1 shrink-0 pt-0.5">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onMoveItem(idx, -1)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Mover arriba"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => onMoveItem(idx, 1)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Mover abajo"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onRemoveItem(idx)}
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer ml-0.5"
              title="Eliminar producto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Fila Media: Cantidad y Unidad */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 shadow-2xs">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black mr-1.5 shrink-0">
            Cant:
          </span>
          <input
            disabled={isPedidoBloqueado}
            type="number"
            inputMode="decimal"
            className="w-full text-right font-black text-slate-900 dark:text-slate-100 outline-none bg-transparent tabular-nums"
            value={p.cantidad ?? ""}
            onChange={(e) => onUpdateField(idx, "cantidad", e.target.value)}
          />
        </div>

        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black mr-1 shrink-0 ml-1">
            Unidad:
          </span>
          <div className="flex-1 min-w-0">
            <UnitSelector
              disabled={isPedidoBloqueado}
              value={p.unidad || "Kg"}
              tiposEmpaque={tiposEmpaque}
              compact
              onChange={(nuevaUnidad, meta) =>
                onUpdateUnidad(idx, nuevaUnidad, meta)
              }
            />
          </div>
        </div>
      </div>

      {/* Fila Inferior: Descripción / Nota */}
      <div>
        <input
          disabled={isPedidoBloqueado}
          type="text"
          placeholder="Especificación (opcional)..."
          className="w-full text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition"
          value={p.descripcion || ""}
          onChange={(e) => onUpdateField(idx, "descripcion", e.target.value)}
        />
      </div>
    </div>
  );
}

export default memo(OrderItemCard);
