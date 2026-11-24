import React, { memo } from "react";
import { Calculator } from "lucide-react";
import { formatMoney } from "../../utils/currency";

function FinancialItemCard({
  p,
  idx,
  empaque,
  k,
  libras,
  costoKiloBase,
  costoEmpaqueBase,
  costoLibraBase,
  gastoPorKilo,
  isInputsDisabled,
  valorCompraTotal,
  _utilidadGlobal,
  posItemId,
  precioPosActual,
  onCostoCompraKiloChange,
  onCostoCompraKiloBlur,
  onTotalCompraChange,
  onTotalCompraBlur,
  onCostoRealKiloChange,
  onCostoRealKiloBlur,
  onPorcentajeUtilChange,
  onPorcentajeUtilBlur,
  onPrecioVentaChange,
  onPrecioVentaBlur,
  onTotalVentaChange,
  onTotalVentaBlur,
  onOpenCalcModal,
}) {
  const finalPosId = posItemId || p.pos_item_id || null;
  const posPrice =
    precioPosActual !== undefined && precioPosActual !== null && Number(precioPosActual) > 0
      ? Number(precioPosActual)
      : Number(p.precio_pos_actual || 0);
  const ventaKilo = parseFloat(p.precio_venta_kilo) || 0;
  const diff = posPrice > 0 && ventaKilo > 0 ? Math.round(ventaKilo - posPrice) : 0;
  const diffPct = posPrice > 0 && diff !== 0 ? Math.round((diff / posPrice) * 100) : 0;
  return (
    <div className="bg-slate-50/70 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 space-y-2.5 shadow-2xs transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="font-black text-xs text-slate-900 dark:text-slate-100 uppercase block truncate">
            {idx + 1}. {p.producto}
          </span>
          {p.descripcion && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 italic block truncate mt-0.5">
              📝 {p.descripcion}
            </span>
          )}
          {empaque && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md mt-1 border border-emerald-200 dark:border-emerald-800">
              🏷️ {empaque.presentacion} ({empaque.peso_kg} Kg /{" "}
              {empaque.peso_lb} Lb)
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs block">
            {p.cantidad} {p.unidad || "Kg"}
          </span>
          {empaque ? (
            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
              ({k} Kg / {libras} Lb)
            </span>
          ) : (
            parseFloat(p.kilos) !== parseFloat(p.cantidad) &&
            parseFloat(p.kilos) > 0 && (
              <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                ({p.kilos} Kg)
              </span>
            )
          )}
        </div>
      </div>

      {/* Fila 1: Costo Compra/Kg y Botón Calculadora */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-amber-800 dark:text-amber-300 font-black uppercase">
              Costo Compra/Kg:
            </span>
            {!isInputsDisabled && (
              <button
                type="button"
                onClick={() => onOpenCalcModal(idx)}
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 p-0.5 rounded transition"
                title="Calcular por Bulto / Pony / Canastilla"
              >
                <Calculator className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <input
            disabled={isInputsDisabled}
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="w-full font-black text-amber-950 dark:text-amber-300 outline-none text-xs tabular-nums bg-transparent"
            value={formatMoney(costoKiloBase)}
            onChange={(e) => onCostoCompraKiloChange(idx, e.target.value)}
            onBlur={() => onCostoCompraKiloBlur(idx)}
          />
          {empaque && (
            <div className="text-[9px] font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 px-1 py-0.5 rounded flex items-center justify-between gap-1 mt-0.5">
              <span>
                ${formatMoney(costoEmpaqueBase)}/{empaque.presentacion}
              </span>
              <span>•</span>
              <span>${formatMoney(costoLibraBase)}/Lb</span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 shadow-2xs">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase block truncate">
            Total Compra ($):
          </span>
          <input
            disabled={isInputsDisabled}
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="w-full font-black text-slate-900 dark:text-slate-100 outline-none text-xs tabular-nums bg-transparent"
            value={formatMoney(valorCompraTotal)}
            onChange={(e) => onTotalCompraChange(idx, e.target.value)}
            onBlur={() => onTotalCompraBlur(idx)}
          />
        </div>
      </div>

      {/* Fila 2: Costo Real/Kg (con label informativo de gastos), % Util y P. Venta/Kg */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase block truncate">
              Costo Real:
            </span>
            <span className="text-[8px] font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-800">
              +{formatMoney(gastoPorKilo)}
            </span>
          </div>
          <input
            disabled={isInputsDisabled}
            type="text"
            inputMode="numeric"
            className="w-full font-black text-slate-800 dark:text-slate-100 outline-none text-xs tabular-nums bg-transparent"
            value={formatMoney(p.costo_real_kilo)}
            onChange={(e) => onCostoRealKiloChange(idx, e.target.value)}
            onBlur={() => onCostoRealKiloBlur(idx)}
          />
        </div>

        <div
          className={`p-2 rounded-xl border space-y-1 shadow-2xs ${
            p.porcentaje_utilidad_manual
              ? "bg-amber-50/70 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700"
              : "bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[9px] font-black uppercase truncate ${
                p.porcentaje_utilidad_manual
                  ? "text-amber-800 dark:text-amber-300"
                  : "text-emerald-700 dark:text-emerald-400"
              }`}
            >
              % Util:
            </span>
            {p.porcentaje_utilidad_manual && (
              <span className="text-[8px] font-black text-amber-700 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-1 rounded uppercase">
                Manual
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <input
              disabled={isInputsDisabled}
              type="number"
              inputMode="decimal"
              className={`w-full font-black outline-none text-xs tabular-nums bg-transparent ${
                p.porcentaje_utilidad_manual
                  ? "text-amber-900 dark:text-amber-300"
                  : "text-emerald-800 dark:text-emerald-300"
              }`}
              value={
                p.porcentaje_utilidad !== undefined &&
                p.porcentaje_utilidad !== null
                  ? p.porcentaje_utilidad
                  : ""
              }
              onChange={(e) => onPorcentajeUtilChange(idx, e.target.value)}
              onBlur={() => onPorcentajeUtilBlur && onPorcentajeUtilBlur(idx)}
            />
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black">%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1 shadow-2xs">
          <span className="text-[9px] text-blue-500 dark:text-blue-400 font-black uppercase block truncate">
            P. Venta/Kg:
          </span>
          <input
            disabled={isInputsDisabled}
            type="text"
            inputMode="numeric"
            className="w-full font-black text-blue-700 dark:text-blue-300 outline-none text-xs tabular-nums bg-transparent"
            value={formatMoney(p.precio_venta_kilo)}
            onChange={(e) => onPrecioVentaChange(idx, e.target.value)}
            onBlur={() => onPrecioVentaBlur(idx)}
          />
        </div>
      </div>

      {/* Fila 3: Precio Actual POS y Comparación */}
      <div className="p-2 bg-purple-50/50 dark:bg-purple-950/40 rounded-xl border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-purple-900 dark:text-purple-300">Precio Actual POS:</span>
          {finalPosId && (
            <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-purple-200/60 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
              #{finalPosId}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-purple-950 dark:text-purple-100">
            ${formatMoney(posPrice)}
          </span>
          {diff !== 0 && posPrice > 0 ? (
            <span
              className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                diff > 0
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
              }`}
            >
              {diff > 0 ? "+" : ""}${formatMoney(diff)} ({diffPct}%)
            </span>
          ) : posPrice > 0 ? (
            <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              = Igual
            </span>
          ) : (
            <span className="text-[9.5px] text-amber-600 dark:text-amber-400 italic">
              Sin vincular
            </span>
          )}
        </div>
      </div>

      <div className="p-2 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-xs">
        <span className="font-bold text-emerald-800 dark:text-emerald-300">Total Venta ($):</span>
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">$</span>
          <input
            disabled={isInputsDisabled}
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="w-28 text-right border border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 focus:border-emerald-500 bg-white dark:bg-slate-800 rounded-lg px-2 py-1 font-black text-emerald-900 dark:text-emerald-200 outline-none tabular-nums transition shadow-2xs"
            value={formatMoney(p.valor_total_venta)}
            onChange={(e) =>
              onTotalVentaChange && onTotalVentaChange(idx, e.target.value)
            }
            onBlur={() => onTotalVentaBlur && onTotalVentaBlur(idx)}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(FinancialItemCard);
