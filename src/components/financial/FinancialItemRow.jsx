import React, { memo } from "react";
import { Calculator } from "lucide-react";
import { formatMoney } from "../../utils/currency";

function FinancialItemRow({
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
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
      <td className="px-2 py-2 text-center text-slate-400 dark:text-slate-500 font-bold text-xs w-7">
        {idx + 1}
      </td>

      {/* Producto con insignia de empaque si aplica */}
      <td className="px-2 py-2 min-w-[120px] max-w-[200px]">
        <span
          className="font-bold text-slate-900 dark:text-slate-100 uppercase block leading-tight text-xs truncate"
          title={p.producto}
        >
          {p.producto}
        </span>
        {p.descripcion && (
          <span
            className="text-[10px] text-slate-500 dark:text-slate-400 italic block mt-0.5 truncate"
            title={p.descripcion}
          >
            📝 {p.descripcion}
          </span>
        )}
        {empaque && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded mt-0.5 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
            🏷️ {empaque.presentacion} ({empaque.peso_kg} Kg)
          </span>
        )}
      </td>

      {/* Cantidad & Unidad combinadas */}
      <td className="px-2 py-2 text-center tabular-nums font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
        <div className="flex flex-col items-center justify-center">
          <span className="font-black text-xs text-slate-900 dark:text-slate-100 block">
            {p.cantidad} {p.unidad || "Kg"}
          </span>
          {empaque ? (
            <span className="text-[8.5px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap border border-emerald-200/50 dark:border-emerald-800/40">
              {k} Kg / {libras} Lb
            </span>
          ) : (
            parseFloat(p.kilos) !== parseFloat(p.cantidad) &&
            parseFloat(p.kilos) > 0 && (
              <span className="text-[8.5px] font-semibold text-slate-500 dark:text-slate-400 block whitespace-nowrap">
                ({p.kilos} Kg)
              </span>
            )
          )}
        </div>
      </td>

      {/* Costo Compra por Kilo */}
      <td className="px-2 py-2 bg-amber-50/20 dark:bg-amber-950/20 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <span className="text-[11px] font-bold text-amber-500 shrink-0">$</span>
          <input
            disabled={isInputsDisabled}
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="w-[74px] sm:w-[78px] text-right border border-slate-200 dark:border-slate-700 hover:border-amber-400 focus:border-amber-500 bg-white dark:bg-slate-800 rounded-lg px-1.5 py-1 font-mono font-black text-xs text-amber-950 dark:text-amber-300 outline-none tabular-nums transition shadow-2xs"
            value={formatMoney(costoKiloBase)}
            onChange={(e) => onCostoCompraKiloChange(idx, e.target.value)}
            onBlur={() => onCostoCompraKiloBlur(idx)}
          />
          {!isInputsDisabled && (
            <button
              type="button"
              onClick={() => onOpenCalcModal(idx)}
              className="p-1 text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 rounded-md transition cursor-pointer shrink-0"
              title="Calcular por Bulto / Canastilla"
            >
              <Calculator className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {empaque && (
          <div className="text-[8px] font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 px-1 py-0.5 rounded flex items-center justify-between gap-1 mt-1 whitespace-nowrap">
            <span title="Costo por empaque">${formatMoney(costoEmpaqueBase)}/{empaque.presentacion}</span>
            <span>•</span>
            <span title="Costo por libra">${formatMoney(costoLibraBase)}/Lb</span>
          </div>
        )}
      </td>

      {/* Total Compra ($) */}
      <td className="px-2 py-2 bg-amber-100/20 dark:bg-amber-950/20 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">$</span>
          <input
            disabled={isInputsDisabled}
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="w-[74px] sm:w-[78px] text-right border border-slate-200 dark:border-slate-700 hover:border-slate-300 focus:border-emerald-500 bg-white dark:bg-slate-800 rounded-lg px-1.5 py-1 font-mono font-bold text-xs text-slate-900 dark:text-slate-100 outline-none tabular-nums transition shadow-2xs"
            value={formatMoney(valorCompraTotal)}
            onChange={(e) => onTotalCompraChange(idx, e.target.value)}
            onBlur={() => onTotalCompraBlur(idx)}
          />
        </div>
      </td>

      {/* Costo Real/Kg con valor de gastos */}
      <td className="px-2 py-2 bg-slate-50/50 dark:bg-slate-800/30 text-right whitespace-nowrap">
        <div className="space-y-0.5">
          <div className="flex items-center justify-end gap-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">$</span>
            <input
              disabled={isInputsDisabled}
              type="text"
              inputMode="numeric"
              className="w-[74px] sm:w-[78px] text-right border border-slate-200 dark:border-slate-700 hover:border-slate-300 focus:border-emerald-500 bg-white dark:bg-slate-800 rounded-lg px-1.5 py-1 font-mono font-black text-xs text-slate-800 dark:text-slate-100 outline-none tabular-nums transition shadow-2xs"
              value={formatMoney(p.costo_real_kilo)}
              onChange={(e) => onCostoRealKiloChange(idx, e.target.value)}
              onBlur={() => onCostoRealKiloBlur(idx)}
            />
          </div>
          <span className="inline-block text-[8px] font-black text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 px-1 py-0.5 rounded leading-none whitespace-nowrap">
            +{formatMoney(gastoPorKilo)}/Kg gastos
          </span>
        </div>
      </td>

      {/* % Utilidad */}
      <td className="px-2 py-2 text-center bg-emerald-50/20 dark:bg-emerald-950/20 whitespace-nowrap">
        <div className="flex flex-col items-center justify-center gap-0.5">
          <div className="flex items-center justify-center gap-0.5">
            <input
              disabled={isInputsDisabled}
              type="number"
              inputMode="decimal"
              placeholder="0"
              className={`w-11 sm:w-12 border rounded-lg px-1 py-1 text-center font-mono font-black text-xs outline-none tabular-nums transition shadow-2xs ${
                p.porcentaje_utilidad_manual
                  ? "border-amber-400 dark:border-amber-600 bg-amber-50/70 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 focus:border-amber-500"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 focus:border-emerald-500 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400"
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
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">%</span>
          </div>
          {p.porcentaje_utilidad_manual && (
            <span className="text-[7.5px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter leading-none">
              Manual
            </span>
          )}
        </div>
      </td>

      {/* Precio Venta/Kg */}
      <td className="px-2 py-2 bg-blue-50/20 dark:bg-blue-950/20 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <span className="text-[11px] font-bold text-blue-400 shrink-0">$</span>
          <input
            disabled={isInputsDisabled}
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="w-[74px] sm:w-[78px] text-right border border-blue-200 dark:border-blue-800 hover:border-blue-300 focus:border-blue-500 bg-white dark:bg-slate-800 rounded-lg px-1.5 py-1 font-mono font-black text-xs text-blue-700 dark:text-blue-300 outline-none tabular-nums transition shadow-2xs"
            value={formatMoney(p.precio_venta_kilo)}
            onChange={(e) => onPrecioVentaChange(idx, e.target.value)}
            onBlur={() => onPrecioVentaBlur(idx)}
          />
        </div>
      </td>

      {/* Precio Actual en Sistema POS & Variación */}
      <td className="px-2 py-2 bg-purple-50/20 dark:bg-purple-950/20 text-center whitespace-nowrap">
        <div className="flex flex-col items-center justify-center gap-0.5">
          <div className="font-mono font-black text-xs text-purple-950 dark:text-purple-200 leading-tight">
            {posPrice > 0 ? (
              <span>${formatMoney(posPrice)}</span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 italic font-normal text-[11px]">$0</span>
            )}
          </div>
          <div className="flex items-center gap-1 justify-center whitespace-nowrap mt-0.5">
            {finalPosId ? (
              <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 leading-none">
                #{finalPosId}
              </span>
            ) : (
              <span className="text-[8.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 leading-none">
                S/V
              </span>
            )}
            {diff !== 0 && posPrice > 0 ? (
              <span
                className={`text-[8.5px] font-black px-1.5 py-0.5 rounded leading-none ${
                  diff > 0
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                }`}
                title={`Diferencia respecto a POS: ${diff > 0 ? "+" : ""}$${formatMoney(diff)} (${diffPct}%)`}
              >
                {diff > 0 ? "+" : ""}${formatMoney(diff)}
              </span>
            ) : posPrice > 0 ? (
              <span className="text-[8.5px] font-bold px-1 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 leading-none">
                = Igual
              </span>
            ) : null}
          </div>
        </div>
      </td>

      {/* Total Venta */}
      <td className="px-2 py-2 bg-emerald-50/40 dark:bg-emerald-950/30 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">$</span>
          <input
            disabled={isInputsDisabled}
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="w-[76px] sm:w-[82px] text-right border border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 focus:border-emerald-500 bg-white dark:bg-slate-800 rounded-lg px-1.5 py-1 font-mono font-black text-xs text-emerald-800 dark:text-emerald-300 outline-none tabular-nums transition shadow-2xs"
            value={formatMoney(p.valor_total_venta)}
            onChange={(e) =>
              onTotalVentaChange && onTotalVentaChange(idx, e.target.value)
            }
            onBlur={() => onTotalVentaBlur && onTotalVentaBlur(idx)}
          />
        </div>
      </td>
    </tr>
  );
}

export default memo(FinancialItemRow);
