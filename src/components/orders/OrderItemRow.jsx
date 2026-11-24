import React, { memo } from "react";
import {
  Trash2,
  GripVertical,
  Sparkles,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { matchProductWithCatalog } from "../../utils/productMatcher";
import UnitSelector from "./UnitSelector";

function OrderItemRow({
  p,
  idx,
  isFirst,
  isLast,
  isPedidoBloqueado,
  isDragged,
  catalogProductNames,
  tiposEmpaque,
  onDragStart,
  onDragOver,
  onDrop,
  onUpdateField,
  onUpdateUnidad,
  onApplyResolvedName,
  onOpenResolveModal,
  onMoveItem,
  onRemoveItem,
}) {
  const match = matchProductWithCatalog(p.producto, catalogProductNames);

  return (
    <tr
      draggable={!isPedidoBloqueado}
      onDragStart={(e) => onDragStart(e, idx)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, idx)}
      className={`hover:bg-emerald-50/30 dark:hover:bg-slate-800/40 transition group ${
        isDragged ? "opacity-40 bg-emerald-100 dark:bg-emerald-950/50" : ""
      }`}
    >
      {/* Grip Drag & Drop */}
      <td className="p-2.5 text-center cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition">
        {!isPedidoBloqueado && <GripVertical className="w-4 h-4 mx-auto" />}
      </td>

      {/* Índice de fila */}
      <td className="p-2.5 text-center">
        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs inline-flex items-center justify-center">
          {idx + 1}
        </span>
      </td>

      {/* Nombre Producto con Detección de Similares/Nuevos */}
      <td className="p-2.5">
        <div className="space-y-1.5">
          <input
            disabled={isPedidoBloqueado}
            type="text"
            className="w-full border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 bg-slate-50/50 dark:bg-slate-800/60 rounded-lg px-3 py-1.5 font-bold text-slate-900 dark:text-slate-100 uppercase disabled:bg-transparent disabled:border-transparent outline-none transition shadow-2xs"
            value={p.producto || ""}
            onChange={(e) =>
              onUpdateField(idx, "producto", e.target.value.toUpperCase())
            }
          />

          {/* Alerta de Producto Similar o Ambiguo */}
          {match.status === "SIMILAR" && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Similar:</span>
              </span>
              {match.similarMatches.slice(0, 2).map((cand) => (
                <button
                  key={cand}
                  type="button"
                  onClick={() => onApplyResolvedName(idx, cand)}
                  className="text-[10px] font-black uppercase text-amber-950 dark:text-amber-200 bg-amber-100/70 dark:bg-amber-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-950 hover:text-emerald-900 dark:hover:text-emerald-200 border border-amber-300 dark:border-amber-700 hover:border-emerald-400 px-1.5 py-0.5 rounded transition cursor-pointer"
                  title={`Ajustar nombre a "${cand}"`}
                >
                  Ajustar a "{cand}"
                </button>
              ))}
              <button
                type="button"
                onClick={() => onOpenResolveModal(p, idx, match.similarMatches)}
                className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline cursor-pointer ml-1"
              >
                Opciones ({match.similarMatches.length})
              </button>
            </div>
          )}

          {/* Alerta de Producto Nuevo */}
          {match.status === "NEW" && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                <span>Nuevo</span>
              </span>
              <button
                type="button"
                onClick={() => onOpenResolveModal(p, idx, [])}
                className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 hover:underline cursor-pointer"
              >
                + Añadir al catálogo
              </button>
            </div>
          )}
        </div>
      </td>

      {/* Cantidad */}
      <td className="p-2.5 text-center">
        <input
          disabled={isPedidoBloqueado}
          type="number"
          inputMode="decimal"
          className="w-24 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 bg-slate-50/50 dark:bg-slate-800/60 rounded-lg px-2 py-1.5 text-center font-black text-slate-900 dark:text-slate-100 tabular-nums disabled:bg-transparent disabled:border-transparent outline-none transition shadow-2xs"
          value={p.cantidad ?? ""}
          onChange={(e) => onUpdateField(idx, "cantidad", e.target.value)}
        />
      </td>

      {/* Unidad / Empaque */}
      <td className="p-2.5 text-center w-36">
        <UnitSelector
          disabled={isPedidoBloqueado}
          value={p.unidad || "Kg"}
          tiposEmpaque={tiposEmpaque}
          compact
          onChange={(nuevaUnidad, meta) =>
            onUpdateUnidad(idx, nuevaUnidad, meta)
          }
        />
      </td>

      {/* Descripción */}
      <td className="p-2.5">
        <input
          disabled={isPedidoBloqueado}
          type="text"
          placeholder="Sin especificación"
          className="w-full border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 bg-slate-50/50 dark:bg-slate-800/60 rounded-lg px-3 py-1.5 text-slate-600 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 disabled:bg-transparent disabled:border-transparent outline-none transition shadow-2xs"
          value={p.descripcion || ""}
          onChange={(e) => onUpdateField(idx, "descripcion", e.target.value)}
        />
      </td>

      {/* Acciones */}
      {!isPedidoBloqueado && (
        <td className="p-2.5 text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onMoveItem(idx, -1)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Mover arriba"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => onMoveItem(idx, 1)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Mover abajo"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onRemoveItem(idx)}
              className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer ml-1"
              title="Eliminar producto"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

export default memo(OrderItemRow);
