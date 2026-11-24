import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Sparkles,
  PackageCheck,
  Layers,
  AlertTriangle,
  Check,
  X,
  Search,
} from "lucide-react";

import { parseMoney } from "../../utils/currency";
import { empaqueApi } from "../../api/empaqueApi";
import { productApi } from "../../api/productApi";
import {
  matchProductWithCatalog,
  normalizeText,
} from "../../utils/productMatcher";
import {
  calcularKilosItem,
  coincideUnidadConEmpaque,
} from "../../utils/unitMatcher";
import ProductResolveModal from "../modals/ProductResolveModal";
import UnitSelector from "./UnitSelector";
import OrderItemRow from "./OrderItemRow";
import OrderItemCard from "./OrderItemCard";
import { useToast } from "../../context/ToastContext";

export default function OrderItemsTable({
  productos = [],
  setProductos,
  isPedidoBloqueado = false,
  draggedIndex,
  handleDragStart,
  handleDragOver,
  handleDrop,
  ejecutarRecalculo,
  triggerAutoSave,
  utilidadGlobal = 30,
  gastos = [],
  empaquesProp,
  tiposEmpaqueProp,
  empaquesManager,
}) {
  const { showToast } = useToast();
  const [nuevoProd, setNuevoProd] = useState({
    producto: "",
    cantidad: "",
    unidad: "Kg",
    descripcion: "",
    valor_compra_total: "",
    peso_kg: 1.0,
    empaque_info: null,
  });

  // Catálogo maestro de productos y empaques para resolución de nombres
  const [masterProducts, setMasterProducts] = useState([]);
  const [internalEmpaques, setInternalEmpaques] = useState([]);
  const [internalTipos, setInternalTipos] = useState([]);

  const _empaques =
    empaquesProp || empaquesManager?.empaques || internalEmpaques;
  void _empaques;
  const tiposEmpaque =
    tiposEmpaqueProp || empaquesManager?.tiposEmpaque || internalTipos;

  // Estado del modal de resolución de producto
  const [modalResolveOpen, setModalResolveOpen] = useState(false);
  const [itemToResolve, setItemToResolve] = useState(null);
  const [similarOptionsForModal, setSimilarOptionsForModal] = useState([]);
  const [targetItemIdx, setTargetItemIdx] = useState(null);

  // Estado de aviso único para productos no registrados
  const [dismissedBatchSignature, setDismissedBatchSignature] = useState("");
  const [addingToCatalogBatch, setAddingToCatalogBatch] = useState(false);

  // Detección reactiva de viewport móvil para evitar doble renderizado en el DOM
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile((prev) => (prev !== mobile ? mobile : prev));
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cargar catálogo maestro y presentaciones
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [prods, dataEmpaques, dataTipos] = await Promise.all([
          productApi.getAll(),
          !empaquesProp && !empaquesManager
            ? empaqueApi.getAll()
            : Promise.resolve([]),
          !tiposEmpaqueProp && !empaquesManager
            ? empaqueApi.getTipos()
            : Promise.resolve([]),
        ]);
        if (prods) setMasterProducts(prods);
        if (dataEmpaques && dataEmpaques.length > 0)
          setInternalEmpaques(dataEmpaques);
        if (dataTipos && dataTipos.length > 0) setInternalTipos(dataTipos);
      } catch (err) {
        console.warn(
          "No se pudo precargar catálogo completo de productos:",
          err,
        );
      }
    };
    cargarCatalogos();

    const handleUpdate = () => {
      cargarCatalogos();
    };
    window.addEventListener("catalog_products_updated", handleUpdate);
    return () => {
      window.removeEventListener("catalog_products_updated", handleUpdate);
    };
  }, [empaquesProp, tiposEmpaqueProp, empaquesManager]);

  const catalogProductNames = useMemo(() => {
    const fromMaster = (masterProducts || []).map((p) =>
      (p.nombre || "").toUpperCase().trim(),
    );
    return Array.from(new Set(fromMaster.filter(Boolean)));
  }, [masterProducts]);

  // Detectar productos no registrados en el catálogo maestro (posibles errores de digitación)
  // Firma de nombres para evitar recálculos costosos de Levenshtein al editar cantidades/precios
  const productNamesKey = useMemo(() => {
    return productos
      .map((p) => (p.producto || p.nombre || "").trim().toUpperCase())
      .join(":::");
  }, [productos]);

  // Detectar productos no registrados en el catálogo maestro
  const unregisteredItems = useMemo(() => {
    if (!catalogProductNames || catalogProductNames.length === 0) return [];
    return productos.filter((p) => {
      const name = (p.producto || p.nombre || "").trim();
      if (!name) return false;
      const match = matchProductWithCatalog(name, catalogProductNames);
      return match.status === "NEW" || match.status === "SIMILAR";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productNamesKey, catalogProductNames]);

  const uniqueUnregisteredNames = useMemo(() => {
    return Array.from(
      new Set(
        unregisteredItems
          .map((p) => (p.producto || p.nombre || "").trim().toUpperCase())
          .filter(Boolean),
      ),
    );
  }, [unregisteredItems]);

  const currentBatchSignature = useMemo(() => {
    return [...uniqueUnregisteredNames].sort().join("|");
  }, [uniqueUnregisteredNames]);

  const showUnregisteredBanner = useMemo(() => {
    return (
      uniqueUnregisteredNames.length > 0 &&
      currentBatchSignature !== dismissedBatchSignature
    );
  }, [uniqueUnregisteredNames, currentBatchSignature, dismissedBatchSignature]);

  const handleAddAllUnregisteredToCatalog = async () => {
    setAddingToCatalogBatch(true);
    let added = 0;
    for (const name of uniqueUnregisteredNames) {
      try {
        await productApi.create({ nombre: name, categoria: "OTROS" });
        added += 1;
      } catch (err) {
        // Ignorar si ya existía en backend
      }
    }
    try {
      const refreshed = await productApi.getAll();
      setMasterProducts(refreshed || []);
    } catch {
      // ignore
    }
    setDismissedBatchSignature(currentBatchSignature);
    setAddingToCatalogBatch(false);
    showToast(`Se añadieron ${added} producto(s) al Catálogo Maestro.`);
  };

  const handleStartReviewingSuggestions = () => {
    const firstUnreg = unregisteredItems[0];
    if (firstUnreg) {
      const idx = productos.findIndex(
        (p) =>
          (p.producto || p.nombre || "").trim().toUpperCase() ===
          (firstUnreg.producto || firstUnreg.nombre || "").trim().toUpperCase(),
      );
      const match = matchProductWithCatalog(
        firstUnreg.producto || firstUnreg.nombre,
        catalogProductNames,
      );
      setTargetItemIdx(idx >= 0 ? idx : 0);
      setItemToResolve(firstUnreg);
      setSimilarOptionsForModal(match.similarMatches || []);
      setModalResolveOpen(true);
    }
  };

  const totalCantidad = useMemo(() => {
    return productos.reduce((sum, p) => sum + (parseFloat(p.cantidad) || 0), 0);
  }, [productos]);

  const agregarProductoManual = () => {
    const cleanNombre = nuevoProd.producto.trim().toUpperCase();
    if (!cleanNombre || !nuevoProd.cantidad) return;

    // Validación anti-duplicados estricta en el pedido
    const yaExisteEnPedido = productos.some(
      (p) =>
        (p.producto || p.nombre || "").trim().toUpperCase() === cleanNombre,
    );
    if (yaExisteEnPedido) {
      showToast(
        `El producto "${cleanNombre}" ya se encuentra agregado en este pedido. No se permiten productos duplicados.`,
        "error",
      );
      return;
    }

    const cant = parseFloat(nuevoProd.cantidad) || 0;
    let finalEmpaqueInfo = nuevoProd.empaque_info;
    let finalPesoKg = nuevoProd.peso_kg;

    if (!finalEmpaqueInfo && masterProducts && masterProducts.length > 0) {
      const normName = normalizeText(cleanNombre);
      const prodInMaster = masterProducts.find(
        (p) => normalizeText(p.nombre) === normName,
      );
      if (prodInMaster) {
        const matchingPerm = (prodInMaster.empaques_permitidos || []).find(
          (e) => coincideUnidadConEmpaque(nuevoProd.unidad || "Kg", e.nombre),
        );
        if (matchingPerm && parseFloat(matchingPerm.peso_kg) > 0) {
          finalPesoKg = parseFloat(matchingPerm.peso_kg);
          finalEmpaqueInfo = {
            id: matchingPerm.id,
            presentacion: matchingPerm.nombre,
            peso_kg: finalPesoKg,
            peso_lb: parseFloat(matchingPerm.peso_lb) || finalPesoKg * 2,
            descripcion: matchingPerm.descripcion || "",
            esPersonalizado:
              Math.abs(
                finalPesoKg -
                  (parseFloat(matchingPerm.peso_kg_default) || finalPesoKg),
              ) > 0.001,
          };
        } else if (
          prodInMaster.tipo_empaque &&
          coincideUnidadConEmpaque(
            nuevoProd.unidad || "Kg",
            prodInMaster.tipo_empaque.nombre,
          )
        ) {
          finalPesoKg = parseFloat(prodInMaster.tipo_empaque.peso_kg);
          finalEmpaqueInfo = {
            id: prodInMaster.tipo_empaque.id,
            presentacion: prodInMaster.tipo_empaque.nombre,
            peso_kg: finalPesoKg,
            peso_lb:
              parseFloat(prodInMaster.tipo_empaque.peso_lb) || finalPesoKg * 2,
            descripcion: prodInMaster.tipo_empaque.descripcion || "",
            esPersonalizado: false,
          };
        }
      }
    }

    const calculatedKilos = calcularKilosItem(
      cant,
      nuevoProd.unidad || "Kg",
      finalPesoKg,
      finalEmpaqueInfo,
      tiposEmpaque,
    );
    const item = {
      id: Date.now(),
      producto: cleanNombre,
      cantidad: cant,
      unidad: nuevoProd.unidad || "Kg",
      descripcion: nuevoProd.descripcion.trim() || "",
      kilos: calculatedKilos,
      valor_compra_total: parseMoney(nuevoProd.valor_compra_total),
      porcentaje_utilidad: utilidadGlobal,
      empaque_info: finalEmpaqueInfo,
    };

    const updated = [...productos, item];
    setProductos(updated);
    setNuevoProd({
      producto: "",
      cantidad: "",
      unidad: "Kg",
      descripcion: "",
      valor_compra_total: "",
      peso_kg: 1.0,
      empaque_info: null,
    });
    ejecutarRecalculo(updated, gastos, utilidadGlobal);
    triggerAutoSave();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      agregarProductoManual();
    }
  };

  const handleMoveItem = useCallback(
    (idx, direction) => {
      setProductos((prev) => {
        const targetIdx = idx + direction;
        if (targetIdx < 0 || targetIdx >= prev.length) return prev;
        const copy = [...prev];
        const temp = copy[idx];
        copy[idx] = copy[targetIdx];
        copy[targetIdx] = temp;
        ejecutarRecalculo(copy, gastos, utilidadGlobal);
        triggerAutoSave();
        return copy;
      });
    },
    [ejecutarRecalculo, gastos, utilidadGlobal, triggerAutoSave, setProductos],
  );

  const handleRemoveItem = useCallback(
    (idx) => {
      setProductos((prev) => {
        const copy = prev.filter((_, i) => i !== idx);
        ejecutarRecalculo(copy, gastos, utilidadGlobal);
        triggerAutoSave();
        return copy;
      });
    },
    [ejecutarRecalculo, gastos, utilidadGlobal, triggerAutoSave, setProductos],
  );

  const handleUpdateField = useCallback(
    (idx, field, value) => {
      setProductos((prev) => {
        const copy = [...prev];
        if (!copy[idx]) return prev;
        copy[idx] = { ...copy[idx], [field]: value };
        if (field === "cantidad") {
          const c = parseFloat(value) || 0;
          copy[idx].kilos = calcularKilosItem(
            c,
            copy[idx].unidad,
            copy[idx].empaque_info?.peso_kg,
            copy[idx].empaque_info,
            tiposEmpaque,
          );
        }
        ejecutarRecalculo(copy, gastos, utilidadGlobal);
        triggerAutoSave();
        return copy;
      });
    },
    [
      tiposEmpaque,
      ejecutarRecalculo,
      gastos,
      utilidadGlobal,
      triggerAutoSave,
      setProductos,
    ],
  );

  const handleUpdateUnidad = useCallback(
    (idx, nuevaUnidad, meta) => {
      setProductos((prev) => {
        const copy = [...prev];
        if (!copy[idx]) return prev;

        let effectivePesoKg = meta.peso_kg;
        let effectivePesoLb = meta.peso_lb;
        let esPersonalizado = false;

        const pName = (copy[idx].producto || copy[idx].nombre || "").trim();
        if (pName && masterProducts && masterProducts.length > 0) {
          const normName = normalizeText(pName);
          const prodInMaster = masterProducts.find(
            (p) => normalizeText(p.nombre) === normName,
          );
          if (prodInMaster) {
            const matchingPerm = (prodInMaster.empaques_permitidos || []).find(
              (e) => coincideUnidadConEmpaque(nuevaUnidad, e.nombre),
            );
            if (matchingPerm && parseFloat(matchingPerm.peso_kg) > 0) {
              effectivePesoKg = parseFloat(matchingPerm.peso_kg);
              effectivePesoLb =
                parseFloat(matchingPerm.peso_lb) || effectivePesoKg * 2;
              esPersonalizado =
                Math.abs(
                  effectivePesoKg -
                    (parseFloat(matchingPerm.peso_kg_default) ||
                      effectivePesoKg),
                ) > 0.001;
            } else if (
              prodInMaster.tipo_empaque &&
              coincideUnidadConEmpaque(
                nuevaUnidad,
                prodInMaster.tipo_empaque.nombre,
              )
            ) {
              effectivePesoKg = parseFloat(prodInMaster.tipo_empaque.peso_kg);
              effectivePesoLb =
                parseFloat(prodInMaster.tipo_empaque.peso_lb) ||
                effectivePesoKg * 2;
            }
          }
        }

        const empaqueInfo = meta.isEmpaque
          ? {
              presentacion: nuevaUnidad,
              peso_kg: effectivePesoKg,
              peso_lb: effectivePesoLb,
              descripcion: meta.descripcion,
              esPersonalizado,
            }
          : null;
        copy[idx] = {
          ...copy[idx],
          unidad: nuevaUnidad,
          empaque_info: empaqueInfo,
          kilos: calcularKilosItem(
            copy[idx].cantidad,
            nuevaUnidad,
            effectivePesoKg,
            empaqueInfo,
            tiposEmpaque,
          ),
        };
        ejecutarRecalculo(copy, gastos, utilidadGlobal);
        triggerAutoSave();
        return copy;
      });
    },
    [
      tiposEmpaque,
      masterProducts,
      ejecutarRecalculo,
      gastos,
      utilidadGlobal,
      triggerAutoSave,
      setProductos,
    ],
  );

  const handleApplyResolvedName = useCallback(
    (idx, newName) => {
      setProductos((prev) => {
        const copy = [...prev];
        if (!copy[idx]) return prev;
        copy[idx] = { ...copy[idx], producto: newName.toUpperCase().trim() };
        ejecutarRecalculo(copy, gastos, utilidadGlobal);
        triggerAutoSave();
        return copy;
      });
    },
    [ejecutarRecalculo, gastos, utilidadGlobal, triggerAutoSave, setProductos],
  );

  const openResolveModal = useCallback((p, idx, similarMatches = []) => {
    setTargetItemIdx(idx);
    setItemToResolve(p);
    setSimilarOptionsForModal(similarMatches);
    setModalResolveOpen(true);
  }, []);

  const handleAddNewProductToCatalog = useCallback(
    async (newProdData) => {
      try {
        // Registrar en el Catálogo Maestro de Productos con su empaque si aplica
        try {
          const matchingTipo = (internalTipos || []).find(
            (t) =>
              (t.nombre || "").toUpperCase() ===
              (newProdData.presentacion || "").toUpperCase(),
          );
          await productApi.create({
            nombre: newProdData.producto.trim().toUpperCase(),
            categoria: "OTROS",
            tipo_empaque_id: matchingTipo?.id || null,
          });
          const refreshed = await productApi.getAll();
          setMasterProducts(refreshed || []);
        } catch (_e) {
          // Ignorar si ya existía
        }

        if (targetItemIdx !== null && targetItemIdx !== undefined) {
          setProductos((prev) => {
            if (!prev[targetItemIdx]) return prev;
            const copy = [...prev];
            copy[targetItemIdx] = {
              ...copy[targetItemIdx],
              producto: newProdData.producto,
              empaque_info:
                newProdData.empaque_info || copy[targetItemIdx].empaque_info,
            };
            ejecutarRecalculo(copy, gastos, utilidadGlobal);
            triggerAutoSave();
            return copy;
          });
        }
      } catch (err) {
        console.error("Error al crear producto en catálogo:", err);
      }
    },
    [
      targetItemIdx,
      ejecutarRecalculo,
      gastos,
      utilidadGlobal,
      triggerAutoSave,
      setProductos,
      internalTipos,
    ],
  );

  return (
    <div className="space-y-4">
      {/* Banner / Pregunta Única para Productos No Registrados */}
      {showUnregisteredBanner && !isPedidoBloqueado && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 dark:from-amber-950/40 dark:via-amber-950/30 dark:to-orange-950/40 border-2 border-amber-500/40 dark:border-amber-700/60 rounded-2xl p-4 sm:p-5 shadow-xs animate-in fade-in space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[10px] tracking-wide uppercase bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-md">
                    Verificación de Ortografía y Catálogo
                  </span>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    Se detectaron {uniqueUnregisteredNames.length} producto(s)
                    no registrado(s) en el Catálogo Maestro
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Revise si se trata de posibles errores ortográficos o de
                  digitación humana antes de continuar, o añádalos al catálogo
                  tal cual:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {uniqueUnregisteredNames.map((name) => (
                    <span
                      key={name}
                      className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-amber-300/80 dark:border-amber-700/80 shadow-2xs"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissedBatchSignature(currentBatchSignature)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/60 justify-end">
            <button
              type="button"
              onClick={() => setDismissedBatchSignature(currentBatchSignature)}
              className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
            >
              Conservar solo en este pedido
            </button>
            <button
              type="button"
              disabled={addingToCatalogBatch}
              onClick={handleAddAllUnregisteredToCatalog}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {addingToCatalogBatch
                  ? "Añadiendo..."
                  : "Añadir al catálogo tal cual"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleStartReviewingSuggestions}
              className="bg-slate-900 dark:bg-slate-800 hover:bg-amber-600 active:scale-[0.98] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs border border-transparent dark:border-slate-700"
            >
              <Search className="w-3.5 h-3.5 text-amber-300" />
              <span>Revisar sugerencias y corregir ortografía</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra de Inserción Rápida Manual con Autocompletado */}
      {!isPedidoBloqueado && (
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition">
          <div className="flex flex-wrap justify-between items-center mb-3 gap-1">
            <span className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" /> Añadir
              Producto al Pedido
            </span>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              Presione{" "}
              <kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[9px]">
                Enter
              </kbd>{" "}
              para agregar
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3 text-xs font-semibold items-end">
            {/* Nombre del Producto con Datalist del catálogo */}
            <div className="sm:col-span-2 lg:col-span-4 relative">
              <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">
                Producto *
              </label>
              <input
                type="text"
                list="productos-catalogo-datalist"
                placeholder="Nombre del producto o ítem..."
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 dark:text-slate-100 bg-slate-50/70 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-800 transition shadow-2xs"
                value={nuevoProd.producto}
                onChange={(e) =>
                  setNuevoProd({ ...nuevoProd, producto: e.target.value })
                }
                onKeyDown={handleKeyDown}
              />
              <datalist id="productos-catalogo-datalist">
                {catalogProductNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Cantidad */}
            <div className="col-span-1 lg:col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-center font-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 dark:text-slate-100 bg-slate-50/70 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-800 tabular-nums transition shadow-2xs"
                value={nuevoProd.cantidad}
                onChange={(e) =>
                  setNuevoProd({ ...nuevoProd, cantidad: e.target.value })
                }
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Unidad / Empaque */}
            <div className="col-span-1 lg:col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">
                Unidad / Empaque
              </label>
              <UnitSelector
                value={nuevoProd.unidad}
                tiposEmpaque={tiposEmpaque}
                onChange={(nuevaUnidad, meta) => {
                  let effectivePesoKg = meta.peso_kg;
                  let effectivePesoLb = meta.peso_lb;
                  let esPersonalizado = false;

                  const pName = (nuevoProd.producto || "").trim();
                  if (pName && masterProducts && masterProducts.length > 0) {
                    const normName = normalizeText(pName);
                    const prodInMaster = masterProducts.find(
                      (p) => normalizeText(p.nombre) === normName,
                    );
                    if (prodInMaster) {
                      const matchingPerm = (
                        prodInMaster.empaques_permitidos || []
                      ).find((e) =>
                        coincideUnidadConEmpaque(nuevaUnidad, e.nombre),
                      );
                      if (
                        matchingPerm &&
                        parseFloat(matchingPerm.peso_kg) > 0
                      ) {
                        effectivePesoKg = parseFloat(matchingPerm.peso_kg);
                        effectivePesoLb =
                          parseFloat(matchingPerm.peso_lb) ||
                          effectivePesoKg * 2;
                        esPersonalizado =
                          Math.abs(
                            effectivePesoKg -
                              (parseFloat(matchingPerm.peso_kg_default) ||
                                effectivePesoKg),
                          ) > 0.001;
                      } else if (
                        prodInMaster.tipo_empaque &&
                        coincideUnidadConEmpaque(
                          nuevaUnidad,
                          prodInMaster.tipo_empaque.nombre,
                        )
                      ) {
                        effectivePesoKg = parseFloat(
                          prodInMaster.tipo_empaque.peso_kg,
                        );
                        effectivePesoLb =
                          parseFloat(prodInMaster.tipo_empaque.peso_lb) ||
                          effectivePesoKg * 2;
                      }
                    }
                  }

                  setNuevoProd({
                    ...nuevoProd,
                    unidad: nuevaUnidad,
                    peso_kg: effectivePesoKg,
                    empaque_info: meta.isEmpaque
                      ? {
                          presentacion: nuevaUnidad,
                          peso_kg: effectivePesoKg,
                          peso_lb: effectivePesoLb,
                          descripcion: meta.descripcion,
                          esPersonalizado,
                        }
                      : null,
                  });
                }}
              />
            </div>

            {/* Especificación */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">
                Especificación (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Grande, Lavada, Desgranada..."
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 dark:text-slate-200 bg-slate-50/70 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-800 transition shadow-2xs"
                value={nuevoProd.descripcion}
                onChange={(e) =>
                  setNuevoProd({ ...nuevoProd, descripcion: e.target.value })
                }
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Botón Agregar */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <button
                type="button"
                onClick={agregarProductoManual}
                className="w-full bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98] text-white rounded-xl font-bold py-2.5 px-3 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                title="Añadir producto"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="lg:hidden font-bold">Agregar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor Principal de la Tabla de Productos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Cabecera del Bloque de Tabla */}
        <div className="px-3.5 sm:px-5 py-3.5 bg-slate-50/80 dark:bg-slate-850 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Productos del Pedido
              </h3>
              {!isPedidoBloqueado && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
                  Ordene la secuencia de entrega física arrastrando o con las
                  flechas.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 sm:px-3 py-1 rounded-xl shadow-2xs">
              Ítems:{" "}
              <strong className="text-slate-900 dark:text-white font-black">
                {productos.length}
              </strong>
            </span>
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 sm:px-3 py-1 rounded-xl shadow-2xs">
              Total Cant:{" "}
              <strong className="text-emerald-950 dark:text-emerald-200 font-black tabular-nums">
                {totalCantidad.toLocaleString("es-CO")}
              </strong>
            </span>
          </div>
        </div>

        {productos.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-400 dark:text-slate-500 italic flex flex-col items-center gap-2">
            <PackageCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 stroke-1" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              No hay productos en el pedido activo. Cargue un documento o use el
              formulario superior.
            </span>
          </div>
        ) : isMobile ? (
          /* VISTA 1: MÓVIL (< 768px) - Tarjetas Táctiles Interactivas */
          <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2.5 space-y-2.5">
            {productos.map((p, idx) => (
              <OrderItemCard
                key={p.id || `card-${idx}`}
                p={p}
                idx={idx}
                isFirst={idx === 0}
                isLast={idx === productos.length - 1}
                isPedidoBloqueado={isPedidoBloqueado}
                catalogProductNames={catalogProductNames}
                tiposEmpaque={tiposEmpaque}
                onUpdateField={handleUpdateField}
                onUpdateUnidad={handleUpdateUnidad}
                onApplyResolvedName={handleApplyResolvedName}
                onOpenResolveModal={openResolveModal}
                onMoveItem={handleMoveItem}
                onRemoveItem={handleRemoveItem}
              />
            ))}
          </div>
        ) : (
          <>
            {/* VISTA 1: MÓVIL (< 768px) - Tarjetas Táctiles Interactivas */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-2.5 space-y-2.5">
              {productos.map((p, idx) => (
                <OrderItemCard
                  key={p.id || `card-${idx}`}
                  p={p}
                  idx={idx}
                  isFirst={idx === 0}
                  isLast={idx === productos.length - 1}
                  isPedidoBloqueado={isPedidoBloqueado}
                  catalogProductNames={catalogProductNames}
                  tiposEmpaque={tiposEmpaque}
                  onUpdateField={handleUpdateField}
                  onUpdateUnidad={handleUpdateUnidad}
                  onApplyResolvedName={handleApplyResolvedName}
                  onOpenResolveModal={openResolveModal}
                  onMoveItem={handleMoveItem}
                  onRemoveItem={handleRemoveItem}
                />
              ))}
            </div>

            {/* VISTA 2: TABLETS, ESCRITORIO Y PANTALLAS GRANDES (>= 768px) */}
            <div
              className="hidden md:block w-full overflow-x-auto custom-scrollbar"
              tabIndex={0}
              role="region"
              aria-label="Tabla de productos del pedido activo"
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 w-10 text-center"></th>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 min-w-[240px]">Producto</th>
                    <th className="p-3 text-center w-28">Cant.</th>
                    <th className="p-3 text-center w-28">Unidad</th>
                    <th className="p-3 min-w-[180px]">
                      Descripción / Especificación
                    </th>
                    {!isPedidoBloqueado && (
                      <th className="p-3 text-center w-24">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 font-medium">
                  {productos.map((p, idx) => (
                    <OrderItemRow
                      key={p.id || `row-${idx}`}
                      p={p}
                      idx={idx}
                      isFirst={idx === 0}
                      isLast={idx === productos.length - 1}
                      isPedidoBloqueado={isPedidoBloqueado}
                      isDragged={draggedIndex === idx}
                      catalogProductNames={catalogProductNames}
                      tiposEmpaque={tiposEmpaque}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onUpdateField={handleUpdateField}
                      onUpdateUnidad={handleUpdateUnidad}
                      onApplyResolvedName={handleApplyResolvedName}
                      onOpenResolveModal={openResolveModal}
                      onMoveItem={handleMoveItem}
                      onRemoveItem={handleRemoveItem}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal para Resolver Productos Similares o Añadir Nuevo al Catálogo */}
      {modalResolveOpen && itemToResolve && (
        <ProductResolveModal
          isOpen={modalResolveOpen}
          onClose={() => {
            setModalResolveOpen(false);
            setItemToResolve(null);
            setSimilarOptionsForModal([]);
            setTargetItemIdx(null);
          }}
          productItem={itemToResolve}
          similarOptions={similarOptionsForModal}
          tiposEmpaque={tiposEmpaque}
          onSelectExisting={(selectedName) => {
            if (
              targetItemIdx !== null &&
              targetItemIdx !== undefined &&
              productos[targetItemIdx]
            ) {
              handleApplyResolvedName(targetItemIdx, selectedName);
            }
          }}
          onAddNewProduct={handleAddNewProductToCatalog}
        />
      )}
    </div>
  );
}
