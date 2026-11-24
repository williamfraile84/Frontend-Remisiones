import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Store,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Package,
} from "lucide-react";
import { formatMoney } from "../../utils/currency";
import { normalizeText } from "../../utils/productMatcher";
import { posApi } from "../../api/posApi";
import { productApi } from "../../api/productApi";
import { useToast } from "../../context/ToastContext";

export default function PosReconciliationModal({
  isOpen,
  onClose,
  items = [],
  currentProducts = [],
  masterProducts = [],
  onSuccess,
  onPricesUpdated,
}) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'diff', 'same', 'unlinked'
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [actualizarCatalogoLocal, setActualizarCatalogoLocal] = useState(true);
  const [catalogProducts, setCatalogProducts] = useState(masterProducts || []);

  const [prevMasterProducts, setPrevMasterProducts] = useState(masterProducts);
  if (masterProducts !== prevMasterProducts) {
    setPrevMasterProducts(masterProducts);
    if (masterProducts && masterProducts.length > 0) {
      setCatalogProducts(masterProducts);
    }
  }

  // Cargar catálogo maestro si no fue suministrado o viene vacío
  useEffect(() => {
    if (!isOpen) return;
    if (!masterProducts || masterProducts.length === 0) {
      productApi
        .getAll()
        .then((data) => {
          if (Array.isArray(data)) setCatalogProducts(data);
        })
        .catch(() => {});
    }
  }, [isOpen, masterProducts]);

  // Mapeo de masterProducts por nombre normalizado, id y pos_item_id
  const masterMap = useMemo(() => {
    const map = new Map();
    (catalogProducts || []).forEach((p) => {
      if (p.nombre) {
        map.set(normalizeText(p.nombre), p);
      }
      if (p.id) {
        map.set(String(p.id), p);
      }
      if (p.pos_item_id) {
        map.set(`pos_${p.pos_item_id}`, p);
      }
    });
    return map;
  }, [catalogProducts]);

  // Lista base de items a conciliar
  const sourceItems = useMemo(() => {
    const provided =
      items && items.length > 0
        ? items
        : currentProducts && currentProducts.length > 0
          ? currentProducts
          : [];
    if (provided && provided.length > 0) {
      return provided;
    }
    // Si no hay productos en la liquidación activa, conciliar catálogo maestro con POS
    return (catalogProducts || []).filter((p) => Boolean(p.pos_item_id));
  }, [items, currentProducts, catalogProducts]);

  // Enriquecer items con info POS
  const reconciledItems = useMemo(() => {
    return (sourceItems || []).map((it, idx) => {
      const rawName = it.producto || it.nombre || "";
      const normName = normalizeText(rawName);
      const masterProd =
        masterMap.get(normName) ||
        (it.producto_id ? masterMap.get(String(it.producto_id)) : null) ||
        (it.id ? masterMap.get(String(it.id)) : null) ||
        (it.pos_item_id ? masterMap.get(`pos_${it.pos_item_id}`) : null);

      const posItemId = it.pos_item_id || masterProd?.pos_item_id || null;
      const codigo = it.codigo || masterProd?.codigo || null;
      const precioPos =
        it.precio_pos_actual !== undefined &&
        it.precio_pos_actual !== null &&
        Number(it.precio_pos_actual) > 0
          ? Number(it.precio_pos_actual)
          : Number(masterProd?.precio_pos_actual || 0);

      const nuevoPrecio = Math.round(
        Number(
          it.precio_venta_kilo ||
            it.precio_venta ||
            it.precio_venta_referencia ||
            masterProd?.precio_venta_referencia ||
            0,
        ),
      );
      const costoReal = Math.round(
        Number(
          it.costo_real_kilo ||
            it.costo_compra_kilo ||
            it.precio_costo_referencia ||
            masterProd?.precio_costo_referencia ||
            0,
        ),
      );

      const diff =
        precioPos > 0 && nuevoPrecio > 0 ? nuevoPrecio - precioPos : 0;
      const diffPct =
        precioPos > 0 && diff !== 0 ? Math.round((diff / precioPos) * 100) : 0;
      const hasDiff = precioPos > 0 && diff !== 0;
      const isSame = precioPos > 0 && diff === 0;
      const isUnlinked = !posItemId;

      return {
        id:
          it.id !== undefined && it.id !== null
            ? it.id
            : posItemId
              ? `pos_${posItemId}`
              : idx,
        idx,
        producto_id: masterProd?.id || it.id || null,
        nombre: rawName || masterProd?.nombre || "Sin Nombre",
        codigo,
        pos_item_id: posItemId,
        precio_pos_actual: precioPos,
        nuevo_precio_venta: nuevoPrecio,
        costo_real: costoReal,
        diff,
        diffPct,
        hasDiff,
        isSame,
        isUnlinked,
      };
    });
  }, [sourceItems, masterMap]);

  // Pre-seleccionar por defecto al abrir el modal los items con cambio de precio o vinculados
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      const initialSelected = new Set();
      reconciledItems.forEach((it) => {
        if (it.hasDiff || (it.pos_item_id && it.nuevo_precio_venta > 0)) {
          initialSelected.add(it.id);
        }
      });
      setSelectedIds(initialSelected);
    }
  }

  // Contadores para resumen
  const stats = useMemo(() => {
    let withDiff = 0;
    let same = 0;
    let unlinked = 0;

    reconciledItems.forEach((it) => {
      if (it.isUnlinked) unlinked++;
      else if (it.hasDiff) withDiff++;
      else if (it.isSame) same++;
    });

    return {
      total: reconciledItems.length,
      withDiff,
      same,
      unlinked,
      selected: selectedIds.size,
    };
  }, [reconciledItems, selectedIds]);

  // Filtrado de items
  const filteredItems = useMemo(() => {
    return reconciledItems.filter((it) => {
      if (searchTerm.trim()) {
        const q = normalizeText(searchTerm);
        const matchName = normalizeText(it.nombre).includes(q);
        const matchCode = it.codigo && normalizeText(it.codigo).includes(q);
        const matchPos = it.pos_item_id && String(it.pos_item_id).includes(q);
        if (!matchName && !matchCode && !matchPos) return false;
      }

      if (activeFilter === "diff") return it.hasDiff;
      if (activeFilter === "same") return it.isSame;
      if (activeFilter === "unlinked") return it.isUnlinked;
      return true;
    });
  }, [reconciledItems, searchTerm, activeFilter]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      const next = new Set();
      filteredItems.forEach((it) => next.add(it.id));
      setSelectedIds(next);
    }
  };

  const handleApplyToPos = async () => {
    const toApply = reconciledItems.filter((it) => selectedIds.has(it.id));
    if (toApply.length === 0) {
      showToast("Seleccione al menos un producto para aplicar.", "warning");
      return;
    }

    setIsApplying(true);
    try {
      const payload = toApply.map((it) => ({
        producto_id: it.producto_id,
        pos_item_id: it.pos_item_id,
        barcode: it.codigo,
        nombre: it.nombre,
        nuevo_precio_venta: it.nuevo_precio_venta,
        nuevo_costo: it.costo_real > 0 ? it.costo_real : null,
      }));

      const res = await posApi.conciliar(payload, actualizarCatalogoLocal);

      showToast(
        `¡Conciliación completada! Se actualizaron ${res.total_actualizados || toApply.length} precios.`,
        "success"
      );

      if (onSuccess) onSuccess(res);
      if (onPricesUpdated) onPricesUpdated(res);
      onClose();
    } catch (err) {
      showToast(
        `Error al conciliar precios: ${err?.response?.data?.detail || err.message}`,
        "error"
      );
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-purple-900/10 via-purple-600/5 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800 shadow-xs">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  Conciliación de Precios - Sistema POS
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                  CSOPOS / SOFTWAREPOS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Compara los precios calculados en la liquidación actual contra los precios vigentes en el Sistema POS y sincroniza las tarifas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjetas de Estadísticas / Resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:px-6 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Productos</span>
            <span className="text-base font-black text-slate-900 dark:text-white">{stats.total}</span>
          </div>

          <div
            onClick={() => setActiveFilter(activeFilter === "diff" ? "all" : "diff")}
            className={`p-2.5 rounded-xl border shadow-2xs cursor-pointer transition ${
              activeFilter === "diff"
                ? "bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-700 ring-2 ring-purple-400"
                : "bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-900/60 hover:bg-purple-50/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">Con Variación</span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                Cambio
              </span>
            </div>
            <span className="text-base font-black text-purple-800 dark:text-purple-300">{stats.withDiff}</span>
          </div>

          <div
            onClick={() => setActiveFilter(activeFilter === "same" ? "all" : "same")}
            className={`p-2.5 rounded-xl border shadow-2xs cursor-pointer transition ${
              activeFilter === "same"
                ? "bg-slate-100 dark:bg-slate-700 border-slate-400 ring-2 ring-slate-400"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100/50"
            }`}
          >
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Precios Iguales</span>
            <span className="text-base font-black text-slate-700 dark:text-slate-300">{stats.same}</span>
          </div>

          <div
            onClick={() => setActiveFilter(activeFilter === "unlinked" ? "all" : "unlinked")}
            className={`p-2.5 rounded-xl border shadow-2xs cursor-pointer transition ${
              activeFilter === "unlinked"
                ? "bg-amber-50 dark:bg-amber-950/50 border-amber-300 ring-2 ring-amber-400"
                : "bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-900/60 hover:bg-amber-50/50"
            }`}
          >
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase block">Sin Vincular</span>
            <span className="text-base font-black text-amber-800 dark:text-amber-300">{stats.unlinked}</span>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="p-3.5 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por producto, código o ID POS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              {selectedIds.size === filteredItems.length && filteredItems.length > 0
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </button>
          </div>
        </div>

        {/* Tabla Principal de Conciliación */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold">No se encontraron productos con el filtro aplicado.</p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-2xs">
              <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                        onChange={selectAllFiltered}
                        className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 min-w-[180px]">Producto (Catálogo)</th>
                    <th className="p-3 w-28 text-center bg-purple-50/50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300">
                      ID / Código POS
                    </th>
                    <th className="p-3 w-28 text-right bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                      Costo Real
                    </th>
                    <th className="p-3 w-32 text-right bg-purple-50/70 dark:bg-purple-950/60 text-purple-950 dark:text-purple-200">
                      Precio Actual POS
                    </th>
                    <th className="p-3 w-32 text-right bg-blue-50/70 dark:bg-blue-950/50 text-blue-950 dark:text-blue-200">
                      Nuevo P. Venta
                    </th>
                    <th className="p-3 w-32 text-center bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-300">
                      Variación
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-medium">
                  {filteredItems.map((it) => {
                    const isSelected = selectedIds.has(it.id);
                    return (
                      <tr
                        key={it.id}
                        onClick={() => toggleSelect(it.id)}
                        className={`transition cursor-pointer ${
                          isSelected
                            ? "bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50/70 dark:hover:bg-purple-950/30"
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(it.id)}
                            className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </td>

                        <td className="p-3">
                          <span className="font-bold text-slate-900 dark:text-slate-100 uppercase block leading-tight">
                            {it.nombre}
                          </span>
                          {it.codigo && (
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                              PLU/UPC: {it.codigo}
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center bg-purple-50/20 dark:bg-purple-950/10">
                          {it.pos_item_id ? (
                            <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[10.5px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              #{it.pos_item_id}
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold italic">
                              Sin vincular
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right tabular-nums text-slate-600 dark:text-slate-400 font-bold">
                          ${formatMoney(it.costo_real)}
                        </td>

                        <td className="p-3 text-right tabular-nums bg-purple-50/20 dark:bg-purple-950/20 font-black text-purple-900 dark:text-purple-200">
                          {it.precio_pos_actual > 0 ? (
                            <span>${formatMoney(it.precio_pos_actual)}</span>
                          ) : (
                            <span className="text-slate-400 italic font-normal">$0</span>
                          )}
                        </td>

                        <td className="p-3 text-right tabular-nums bg-blue-50/20 dark:bg-blue-950/20 font-black text-blue-700 dark:text-blue-300">
                          ${formatMoney(it.nuevo_precio_venta)}
                        </td>

                        <td className="p-3 text-center">
                          {it.isUnlinked ? (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              Pendiente POS
                            </span>
                          ) : it.diff !== 0 ? (
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
                                it.diff > 0
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                              }`}
                            >
                              {it.diff > 0 ? (
                                <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-rose-600 shrink-0" />
                              )}
                              <span>
                                {it.diff > 0 ? "+" : ""}${formatMoney(it.diff)} ({it.diffPct}%)
                              </span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                              ✓ Sin cambios
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 sm:px-6 bg-slate-50/90 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              id="chk-cat-local"
              checked={actualizarCatalogoLocal}
              onChange={(e) => setActualizarCatalogoLocal(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="chk-cat-local" className="text-slate-700 dark:text-slate-300 cursor-pointer font-bold">
              Actualizar simultáneamente precios de costo y venta en el Catálogo Maestro local
            </label>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleApplyToPos}
              disabled={isApplying || selectedIds.size === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 cursor-pointer disabled:opacity-50"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Sincronizando con Sistema POS...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ Aplicar {selectedIds.size} Precios al Sistema POS</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
