import React, { useState, useMemo, useEffect } from "react";
import {
  Trash2,
  Plus,
  Receipt,
  Calculator,
  Sparkles,
} from "lucide-react";
import { formatMoney, parseMoney } from "../../utils/currency";
import { redondearCentena } from "../../utils/math";
import { expenseCategoryApi } from "../../api/expenseCategoryApi";

export default function ExpensesManager({
  gastos = [],
  setGastos,
  isPedidoBloqueado = false,
  ejecutarRecalculo,
  triggerAutoSave,
  productos = [],
  utilidadGlobal = 30,
}) {
  const [nuevoGasto, setNuevoGasto] = useState({
    concepto: "",
    valor: "",
    concepto_gasto_id: null,
    distribuir_en_costo: true,
  });
  const [conceptosCatalogo, setConceptosCatalogo] = useState([]);

  useEffect(() => {
    let isMounted = true;
    expenseCategoryApi
      .getAll()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setConceptosCatalogo(data.filter((c) => c.activo !== false));
        }
      })
      .catch(() => {
        // Manejado por caché local en expenseCategoryApi
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const totalKilos = useMemo(() => {
    return (
      productos.reduce(
        (sum, p) =>
          sum +
          (parseFloat(p.kilos || p.cantidad) > 0
            ? parseFloat(p.kilos || p.cantidad)
            : 0),
        0,
      ) || 0
    );
  }, [productos]);

  const totalGastos = useMemo(() => {
    return gastos.reduce((sum, g) => {
      return g.aplicado ? sum + (parseFloat(g.valor) || 0) : sum;
    }, 0);
  }, [gastos]);

  // Regla comercial: suma de gastos dividida en kg totales y redondeada al 100 más cercano
  const gastoPorKiloExacto = totalKilos > 0 ? totalGastos / totalKilos : 0;
  const gastoPorKiloRedondeado = redondearCentena(gastoPorKiloExacto);

  const agregarGastoManual = () => {
    if (!nuevoGasto.concepto.trim() || !nuevoGasto.valor) return;
    const item = {
      id: Date.now().toString(),
      concepto: nuevoGasto.concepto.trim(),
      valor: parseMoney(nuevoGasto.valor),
      aplicado: nuevoGasto.distribuir_en_costo !== false,
      concepto_gasto_id: nuevoGasto.concepto_gasto_id || null,
    };
    const updated = [...gastos, item];
    setGastos(updated);
    setNuevoGasto({
      concepto: "",
      valor: "",
      concepto_gasto_id: null,
      distribuir_en_costo: true,
    });
    if (ejecutarRecalculo)
      ejecutarRecalculo(productos, updated, utilidadGlobal);
    if (triggerAutoSave) triggerAutoSave();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      agregarGastoManual();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Cabecera de la sección de gastos */}
      <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Gastos Operativos (Prorrateo por Kilo)
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Distribución proporcional sobre el peso total en kilos del pedido.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
            {gastos.length} {gastos.length === 1 ? "concepto" : "conceptos"}
          </span>
          <span className="text-xs font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 px-3 py-1 rounded-xl tabular-nums">
            Total Seleccionado: ${totalGastos.toLocaleString("es-CO")}
          </span>
        </div>
      </div>

      {/* Tarjeta Informativa de la Operación y Redondeo de Gastos (Requerido) */}
      <div className="p-3.5 bg-gradient-to-r from-rose-50/80 to-amber-50/80 dark:from-rose-950/30 dark:to-amber-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-rose-800 dark:text-rose-300 tracking-wider block">
              Operación de Prorrateo a Centenas
            </span>
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              Suma de gastos seleccionados (
              <strong>${totalGastos.toLocaleString("es-CO")}</strong>) ÷
              Cantidad total ({totalKilos} Kg)
              {totalKilos > 0 && (
                <>
                  {" "}
                  ={" "}
                  <span className="font-mono font-bold">
                    ${gastoPorKiloExacto.toFixed(1)}/Kg
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0 bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 shadow-2xs">
          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 block">
            Gasto asignado por kilo
          </span>
          <strong className="text-sm font-black text-rose-700 dark:text-rose-400 font-mono">
            +${gastoPorKiloRedondeado.toLocaleString("es-CO")} / Kg
          </strong>
          <span className="text-[9px] text-slate-500 dark:text-slate-400 block">
            Redondeo al $100
          </span>
        </div>
      </div>

      {/* Formulario de Añadir Gasto Rápido */}
      {!isPedidoBloqueado && (
        <div className="bg-slate-50/70 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block">
            Registrar Nuevo Gasto Operativo
          </span>

          {conceptosCatalogo.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Catálogo de Gastos:
              </span>
              {conceptosCatalogo.map((cat) => (
                <button
                  key={cat.id || cat.nombre}
                  type="button"
                  onClick={() => {
                    setNuevoGasto({
                      ...nuevoGasto,
                      concepto: cat.nombre,
                      concepto_gasto_id: cat.id,
                      distribuir_en_costo: cat.distribuir_por_defecto !== false,
                    });
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition cursor-pointer active:scale-95 ${
                    nuevoGasto.concepto.toLowerCase() ===
                    cat.nombre.toLowerCase()
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                  title={cat.tipo ? `Tipo: ${cat.tipo}` : cat.nombre}
                >
                  + {cat.nombre}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 text-xs font-semibold items-end">
            <div className="sm:col-span-6 lg:col-span-7">
              <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">
                Concepto del Gasto *
              </label>
              <input
                type="text"
                list="conceptos-gasto-sugeridos"
                placeholder="Ej: Flete, Cuadrilla de descargue, Peajes, Empaque..."
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
                value={nuevoGasto.concepto}
                onChange={(e) => {
                  const val = e.target.value;
                  const matched = conceptosCatalogo.find(
                    (c) => c.nombre.toLowerCase() === val.trim().toLowerCase(),
                  );
                  setNuevoGasto({
                    ...nuevoGasto,
                    concepto: val,
                    concepto_gasto_id: matched?.id || null,
                    distribuir_en_costo: matched
                      ? matched.distribuir_por_defecto !== false
                      : true,
                  });
                }}
                onKeyDown={handleKeyDown}
              />
              <datalist id="conceptos-gasto-sugeridos">
                {conceptosCatalogo.map((cat) => (
                  <option key={cat.id || cat.nombre} value={cat.nombre}>
                    {cat.tipo ? `${cat.nombre} (${cat.tipo})` : cat.nombre}
                  </option>
                ))}
              </datalist>
            </div>
            <div className="sm:col-span-3 lg:col-span-3">
              <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">
                Valor Total ($) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-black outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 tabular-nums transition shadow-2xs"
                value={formatMoney(nuevoGasto.valor)}
                onChange={(e) =>
                  setNuevoGasto({ ...nuevoGasto, valor: e.target.value })
                }
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="sm:col-span-3 lg:col-span-2">
              <button
                type="button"
                onClick={agregarGastoManual}
                className="w-full bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Añadir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listado de Gastos en Tarjetas Responsivas */}
      {gastos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {gastos.map((gasto, idx) => (
            <div
              key={gasto.id || idx}
              className={`flex items-center justify-between p-3 bg-white dark:bg-slate-850 dark:bg-slate-900 border rounded-2xl gap-2.5 transition shadow-2xs ${
                gasto.aplicado
                  ? "border-slate-200 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-700"
                  : "border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <input
                  disabled={isPedidoBloqueado}
                  type="checkbox"
                  checked={gasto.aplicado}
                  aria-label={`Aplicar gasto ${gasto.concepto}`}
                  onChange={() => {
                    const copy = [...gastos];
                    copy[idx].aplicado = !copy[idx].aplicado;
                    setGastos(copy);
                    if (ejecutarRecalculo)
                      ejecutarRecalculo(productos, copy, utilidadGlobal);
                    if (triggerAutoSave) triggerAutoSave();
                  }}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                />

                <input
                  disabled={isPedidoBloqueado}
                  type="text"
                  aria-label="Concepto de gasto"
                  className="w-full border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 bg-transparent py-0.5 text-xs font-bold text-slate-800 dark:text-slate-100 disabled:text-slate-400 dark:disabled:text-slate-500 outline-none truncate"
                  value={gasto.concepto}
                  onChange={(e) => {
                    const copy = [...gastos];
                    copy[idx].concepto = e.target.value;
                    setGastos(copy);
                    if (triggerAutoSave) triggerAutoSave();
                  }}
                />
              </div>

              <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-black text-slate-400 dark:text-slate-500">$</span>
                <input
                  disabled={isPedidoBloqueado}
                  type="text"
                  inputMode="numeric"
                  aria-label="Valor de gasto"
                  className="w-20 text-right text-xs font-black text-slate-900 dark:text-slate-100 outline-none bg-transparent tabular-nums"
                  value={formatMoney(gasto.valor)}
                  onChange={(e) => {
                    const copy = [...gastos];
                    copy[idx].valor = parseMoney(e.target.value);
                    setGastos(copy);
                    if (ejecutarRecalculo)
                      ejecutarRecalculo(productos, copy, utilidadGlobal);
                    if (triggerAutoSave) triggerAutoSave();
                  }}
                />
              </div>

              {!isPedidoBloqueado && (
                <button
                  type="button"
                  onClick={() => {
                    const copy = gastos.filter((_, i) => i !== idx);
                    setGastos(copy);
                    if (ejecutarRecalculo)
                      ejecutarRecalculo(productos, copy, utilidadGlobal);
                    if (triggerAutoSave) triggerAutoSave();
                  }}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer shrink-0"
                  title="Eliminar gasto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 italic">
          No hay gastos operativos registrados para este pedido.
        </p>
      )}
    </div>
  );
}
