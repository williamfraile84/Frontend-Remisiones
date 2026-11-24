import React from "react";
import { Scale, ShoppingCart, Receipt, TrendingUp, DollarSign } from "lucide-react";

export default function FinancialSummaryCards({ liquidacion }) {
  if (!liquidacion || !liquidacion.resumen) return null;
  const res = liquidacion.resumen;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3 xl:gap-4">
      {/* Total Kilos */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 xl:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition hover:border-slate-300 dark:hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">
            Total Kilos
          </span>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Scale className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div>
          <p
            className="text-base xs:text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white truncate tabular-nums"
            title={`${(res.total_kilos || 0).toLocaleString("es-CO")} Kg`}
          >
            {(res.total_kilos || 0).toLocaleString("es-CO")}{" "}
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500">Kg</span>
          </p>
          <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 whitespace-nowrap">Peso volumétrico</span>
        </div>
      </div>

      {/* Total Compras */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 xl:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition hover:border-slate-300 dark:hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">
            Total Compras
          </span>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div>
          <p
            className="text-base xs:text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white truncate tabular-nums"
            title={`$${(res.total_compras || 0).toLocaleString("es-CO")}`}
          >
            ${(res.total_compras || 0).toLocaleString("es-CO")}
          </p>
          <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 whitespace-nowrap">Costo adquisición</span>
        </div>
      </div>

      {/* Total Gastos */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 xl:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition hover:border-slate-300 dark:hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">
            Total Gastos
          </span>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Receipt className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div>
          <p
            className="text-base xs:text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white truncate tabular-nums"
            title={`$${(res.total_gastos || 0).toLocaleString("es-CO")}`}
          >
            ${(res.total_gastos || 0).toLocaleString("es-CO")}
          </p>
          <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 whitespace-nowrap">Fletes y operación</span>
        </div>
      </div>

      {/* Total Ventas */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 xl:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition hover:border-slate-300 dark:hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">
            Total Ventas
          </span>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div>
          <p
            className="text-base xs:text-lg sm:text-xl lg:text-2xl font-black text-blue-700 dark:text-blue-400 truncate tabular-nums"
            title={`$${(res.total_ventas || 0).toLocaleString("es-CO")}`}
          >
            ${(res.total_ventas || 0).toLocaleString("es-CO")}
          </p>
          <span className="text-[9px] sm:text-[10px] text-blue-500 dark:text-blue-400 font-semibold block mt-0.5 whitespace-nowrap">Facturación cliente</span>
        </div>
      </div>

      {/* Ganancia Estimada */}
      <div className="col-span-2 sm:col-span-2 xl:col-span-1 bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/50 dark:to-emerald-900/30 p-3 sm:p-3.5 xl:p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-xs flex flex-col justify-between transition hover:border-emerald-300 dark:hover:border-emerald-700">
        <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
            Ganancia ({res.margen_global_porcentaje}%)
          </span>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div>
          <p
            className="text-base xs:text-lg sm:text-xl lg:text-2xl font-black text-emerald-950 dark:text-emerald-300 truncate tabular-nums"
            title={`$${(res.ganancia || 0).toLocaleString("es-CO")}`}
          >
            ${(res.ganancia || 0).toLocaleString("es-CO")}
          </p>
          <span className="text-[9px] sm:text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block mt-0.5 whitespace-nowrap">Margen neto proyectado</span>
        </div>
      </div>
    </div>
  );
}
