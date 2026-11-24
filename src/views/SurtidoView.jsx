import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Truck,
  PackageCheck,
  Calculator,
  Copy,
  Check,
  FileText,
  Search,
  Share2,
  Save,
  CheckSquare,
  Package,
  Sliders,
  Printer,
  Trash2,
  Scale,
  Download,
  TrendingUp,
  MessageSquare,
  Store,
  Table,
  LayoutGrid,
} from "lucide-react";

import OrderItemsTable from "../components/orders/OrderItemsTable";
import TextOrderModal from "../components/modals/TextOrderModal";
import ExpensesManager from "../components/orders/ExpensesManager";
import FinancialSummaryCards from "../components/summary/FinancialSummaryCards";
import PackageCostCalculatorModal from "../components/modals/PackageCostCalculatorModal";
import GlobalProfitMarginModal from "../components/modals/GlobalProfitMarginModal";
import PosReconciliationModal from "../components/modals/PosReconciliationModal";
import FinancialItemRow from "../components/financial/FinancialItemRow";
import FinancialItemCard from "../components/financial/FinancialItemCard";

import { parseTextOrder } from "../utils/textOrderParser";
import { formatMoney, parseMoney } from "../utils/currency";
import { redondearCentenaEstricta, calcularLiquidacion } from "../utils/math";
import { esUnidadClasica, calcularKilosItem } from "../utils/unitMatcher";
import { normalizeText } from "../utils/productMatcher";
import { downloadBlob } from "../utils/download";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { productApi } from "../api/productApi";
import { exportApi } from "../api/exportApi";

const QUICK_OBS_TAGS = [
  "Incompleto / Faltó peso",
  "Calidad regular / Averiado",
  "Muy maduro",
  "No llegó en pedido",
  "Excelente calidad",
];

function readCachedSurtido() {
  try {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("fruver_surtido_active_v3")
        : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (_e) {
    // ignore
  }
  return null;
}

export default function SurtidoView({ empaquesManager, onOpenPresentaciones }) {
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const cachedSurtido = useMemo(() => readCachedSurtido(), []);

  const canVerSurtido = hasPermission("puede_ver_surtido");
  const canCrearSurtido = hasPermission("puede_crear_surtido");
  const canChecklist = hasPermission("puede_verificar_checklist");
  const canLiquidar = hasPermission("puede_liquidar_surtido");
  const canConciliarPos = hasPermission("puede_conciliar_pos");
  const canApplyCatalog = hasPermission("puede_aplicar_precios_catalogo");
  const canExport = hasPermission("puede_exportar");

  // Pestaña activa: "pedido" | "checklist" | "liquidacion"
  const [activeTab, setActiveTab] = useState(
    () =>
      (typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("tab")) ||
      "pedido",
  );

  // Estado del modal de texto oficial
  const [textModalOpen, setTextModalOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("open_modal") === "text",
  );

  // Lista principal de productos de surtido
  const [productos, setProductos] = useState(() =>
    Array.isArray(cachedSurtido?.productos) ? cachedSurtido.productos : [],
  );

  // Drag and drop para OrderItemsTable
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = useCallback((index) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (index) => {
      if (draggedIndex === null || draggedIndex === index) return;
      setProductos((prev) => {
        const copy = [...prev];
        const [movedItem] = copy.splice(draggedIndex, 1);
        copy.splice(index, 0, movedItem);
        return copy;
      });
      setDraggedIndex(null);
    },
    [draggedIndex],
  );

  // Checklist de recepción & observaciones individuales
  const [checklistMap, setChecklistMap] = useState(
    () => cachedSurtido?.checklistMap || {},
  );
  const [itemObservations, setItemObservations] = useState(
    () => cachedSurtido?.itemObservations || {},
  );
  const [generalNotes, setGeneralNotes] = useState(
    () => cachedSurtido?.generalNotes || "",
  );
  const [checklistFilter, setChecklistFilter] = useState("todos"); // "todos" | "pendientes" | "recibidos" | "con_novedad"
  const [checklistSearch, setChecklistSearch] = useState("");

  // Gastos logísticos de compras (ExpensesManager)
  const [gastos, setGastos] = useState(() =>
    Array.isArray(cachedSurtido?.gastos) ? cachedSurtido.gastos : [],
  );
  const [utilidadGlobal, setUtilidadGlobal] = useState(() =>
    cachedSurtido?.utilidadGlobal !== undefined
      ? cachedSurtido.utilidadGlobal
      : 30,
  );
  const [tempUtilidadGlobal, setTempUtilidadGlobal] = useState(() =>
    cachedSurtido?.utilidadGlobal !== undefined
      ? cachedSurtido.utilidadGlobal
      : 30,
  );
  const [showMargenModal, setShowMargenModal] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("open_modal") === "margen",
  );
  const [targetMargen, setTargetMargen] = useState(() =>
    cachedSurtido?.utilidadGlobal !== undefined
      ? cachedSurtido.utilidadGlobal
      : 30,
  );

  // Modal asistente de cálculo de empaque/bulto
  const [calcModalOpen, setCalcModalOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("open_modal") === "calculadora",
  );
  const [selectedIdxForCalc, setSelectedIdxForCalc] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("open_modal") === "calculadora"
        ? 0
        : null,
  );

  // Catálogo maestro de productos
  const [masterProducts, setMasterProducts] = useState([]);
  const [applyingPrices, setApplyingPrices] = useState(false);
  const [conciliacionModalOpen, setConciliacionModalOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("open_modal") ===
        "conciliar",
  );
  const [copiedClean, setCopiedClean] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [tableViewMode, setTableViewMode] = useState("table");

  const masterProductsMap = useMemo(() => {
    const map = new Map();
    (masterProducts || []).forEach((p) => {
      if (p.nombre) map.set(normalizeText(p.nombre), p);
    });
    return map;
  }, [masterProducts]);

  const tiposEmpaque = empaquesManager?.tiposEmpaque || [];

  // Cargar catálogo de productos
  useEffect(() => {
    let isMounted = true;
    productApi
      .getAll()
      .then((data) => {
        if (isMounted && Array.isArray(data)) setMasterProducts(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Guardar en localStorage de forma reactiva
  useEffect(() => {
    try {
      localStorage.setItem(
        "fruver_surtido_active_v3",
        JSON.stringify({
          productos,
          checklistMap,
          itemObservations,
          generalNotes,
          gastos,
          utilidadGlobal,
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch (_e) {
      // Ignorar error de cuota o restricción de localStorage
    }
  }, [
    productos,
    checklistMap,
    itemObservations,
    generalNotes,
    gastos,
    utilidadGlobal,
  ]);

  const [prevUtilidadGlobal, setPrevUtilidadGlobal] = useState(utilidadGlobal);
  if (utilidadGlobal !== prevUtilidadGlobal) {
    setPrevUtilidadGlobal(utilidadGlobal);
    setTempUtilidadGlobal(utilidadGlobal);
  }

  // --------------------------------------------------------------------------
  // CÁLCULOS IDÉNTICOS A FINANCIALVIEW
  // --------------------------------------------------------------------------

  // Detección de Tipo de Empaque Estandarizado para un ítem
  const obtenerInfoEmpaque = useCallback(
    (item) => {
      if (!item) return null;

      // 1. Si el ítem ya tiene empaque_info registrado (calculado con asistente)
      if (
        item.empaque_info &&
        item.empaque_info.presentacion &&
        parseFloat(item.empaque_info.peso_kg) > 0
      ) {
        const pKg = parseFloat(item.empaque_info.peso_kg);
        const pLb =
          parseFloat(item.empaque_info.peso_lb) ||
          parseFloat((pKg * 2).toFixed(2));
        return {
          nombre: item.empaque_info.presentacion,
          presentacion: item.empaque_info.presentacion,
          peso_kg: pKg,
          peso_lb: pLb,
          descripcion: item.empaque_info.descripcion || "",
          esCalculado: true,
        };
      }

      const u = (item.unidad || "").trim();

      // Si la unidad es clásica y no tiene empaque_info, no es un embalaje
      if (esUnidadClasica(u)) return null;

      if (empaquesManager?.resolverTipoEmpaque) {
        const resolved = empaquesManager.resolverTipoEmpaque(item);
        if (resolved) return resolved;
      }

      return null;
    },
    [empaquesManager],
  );

  // Obtener kilos reales del ítem considerando Tipo de Empaque Estandarizado
  const obtenerKilosItem = useCallback(
    (item) => {
      if (!item) return 0;
      const cant = parseFloat(item.cantidad) || 0;
      if (cant <= 0) return 0;

      const u = (item.unidad || "").trim();

      if (esUnidadClasica(u)) {
        const uNorm = u.toLowerCase();
        if (
          uNorm === "libra" ||
          uNorm === "libras" ||
          uNorm === "lb" ||
          uNorm === "lbs"
        ) {
          return parseFloat((cant * 0.5).toFixed(2));
        }
        if (
          uNorm === "gr" ||
          uNorm === "gramo" ||
          uNorm === "gramos" ||
          uNorm === "g"
        ) {
          return parseFloat((cant * 0.001).toFixed(3));
        }
        return cant;
      }

      const empaque = obtenerInfoEmpaque(item);
      if (empaque && parseFloat(empaque.peso_kg) > 0) {
        return parseFloat((cant * parseFloat(empaque.peso_kg)).toFixed(2));
      }

      return cant;
    },
    [obtenerInfoEmpaque],
  );

  // Obtener libras reales del ítem considerando Tipo de Empaque Estandarizado
  const obtenerLibrasItem = useCallback(
    (item) => {
      if (!item) return 0;
      const cant = parseFloat(item.cantidad) || 0;
      if (cant <= 0) return 0;

      const u = (item.unidad || "").trim();
      if (esUnidadClasica(u)) {
        const uNorm = u.toLowerCase();
        if (
          uNorm === "libra" ||
          uNorm === "libras" ||
          uNorm === "lb" ||
          uNorm === "lbs"
        ) {
          return cant;
        }
        const k = obtenerKilosItem(item);
        return parseFloat((k * 2).toFixed(2));
      }

      const empaque = obtenerInfoEmpaque(item);
      if (empaque && parseFloat(empaque.peso_lb) > 0) {
        return parseFloat((cant * parseFloat(empaque.peso_lb)).toFixed(2));
      }

      const k = obtenerKilosItem(item);
      return parseFloat((k * 2).toFixed(2));
    },
    [obtenerInfoEmpaque, obtenerKilosItem],
  );

  // Total de kilos del pedido de surtido
  const totalKilosCalculo = useMemo(() => {
    return (
      productos.reduce((acc, p) => {
        const k = obtenerKilosItem(p);
        return acc + (k > 0 ? k : 0);
      }, 0) || 1
    );
  }, [productos, obtenerKilosItem]);

  // Total de gastos logísticos
  const totalGastosCalculo = useMemo(() => {
    return gastos
      .filter((g) => g.aplicado !== false)
      .reduce((acc, g) => acc + (parseFloat(g.valor) || 0), 0);
  }, [gastos]);

  // Gasto por kilo prorrateado a centenas
  const gastoPorKilo = useMemo(() => {
    return redondearCentenaEstricta(totalGastosCalculo / totalKilosCalculo);
  }, [totalGastosCalculo, totalKilosCalculo]);

  // Detección de cuántos productos tienen margen manual personalizado
  const manualProductsCount = useMemo(() => {
    return productos.filter((p) =>
      Boolean(
        p.porcentaje_utilidad_manual ||
        p.precio_venta_manual ||
        (p.porcentaje_utilidad !== undefined &&
          p.porcentaje_utilidad !== null &&
          p.porcentaje_utilidad !== "" &&
          Math.round(parseFloat(p.porcentaje_utilidad)) !==
            Math.round(utilidadGlobal)),
      ),
    ).length;
  }, [productos, utilidadGlobal]);

  // Liquidación completa y reactiva
  const liquidacion = useMemo(() => {
    return calcularLiquidacion(productos, gastos, utilidadGlobal);
  }, [productos, gastos, utilidadGlobal]);

  const items = liquidacion?.items || productos;

  // --------------------------------------------------------------------------
  // HANDLERS RECÍPROCOS DE CÁLCULO FINANCIERO (IDÉNTICOS A FINANCIALVIEW)
  // --------------------------------------------------------------------------

  const handleConfirmMargenGlobal = (val) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 0) {
      setTempUtilidadGlobal(utilidadGlobal);
      return;
    }
    const newMargen = Math.round(parsed);
    if (newMargen === Math.round(utilidadGlobal)) {
      setTempUtilidadGlobal(newMargen);
      return;
    }
    setTargetMargen(newMargen);
    setShowMargenModal(true);
  };

  const handleApplyToAll = () => {
    setUtilidadGlobal(targetMargen);
    setTempUtilidadGlobal(targetMargen);
    const updated = productos.map((p) => {
      const k = obtenerKilosItem(p);
      const costoKilo =
        p.costo_compra_kilo !== undefined && p.costo_compra_kilo !== null
          ? redondearCentenaEstricta(p.costo_compra_kilo)
          : k > 0
            ? redondearCentenaEstricta((p.valor_compra_total || 0) / k)
            : 0;
      const costoReal = redondearCentenaEstricta(costoKilo + gastoPorKilo);
      const pVenta =
        costoReal > 0
          ? redondearCentenaEstricta(costoReal * (1 + targetMargen / 100))
          : redondearCentenaEstricta(p.precio_venta_kilo || 0);
      const totalVenta = redondearCentenaEstricta(pVenta * k);
      return {
        ...p,
        costo_compra_kilo: costoKilo,
        costo_real_kilo: costoReal,
        porcentaje_utilidad: targetMargen,
        porcentaje_utilidad_manual: false,
        precio_venta_manual: false,
        precio_venta_kilo: pVenta,
        valor_total_venta: totalVenta,
      };
    });
    setProductos(updated);
    setShowMargenModal(false);
    showToast(`Margen de utilidad fijado a ${targetMargen}% para todo el surtido.`);
  };

  const handleApplyToNonManual = () => {
    setUtilidadGlobal(targetMargen);
    setTempUtilidadGlobal(targetMargen);
    const updated = productos.map((p) => {
      const isManual = Boolean(
        p.porcentaje_utilidad_manual ||
        p.precio_venta_manual ||
        (p.porcentaje_utilidad !== undefined &&
          p.porcentaje_utilidad !== null &&
          p.porcentaje_utilidad !== "" &&
          Math.round(parseFloat(p.porcentaje_utilidad)) !==
            Math.round(utilidadGlobal)),
      );
      if (isManual) {
        return {
          ...p,
          porcentaje_utilidad_manual: true,
        };
      }
      const k = obtenerKilosItem(p);
      const costoKilo =
        p.costo_compra_kilo !== undefined && p.costo_compra_kilo !== null
          ? redondearCentenaEstricta(p.costo_compra_kilo)
          : k > 0
            ? redondearCentenaEstricta((p.valor_compra_total || 0) / k)
            : 0;
      const costoReal = redondearCentenaEstricta(costoKilo + gastoPorKilo);
      const pVenta =
        costoReal > 0
          ? redondearCentenaEstricta(costoReal * (1 + targetMargen / 100))
          : redondearCentenaEstricta(p.precio_venta_kilo || 0);
      const totalVenta = redondearCentenaEstricta(pVenta * k);
      return {
        ...p,
        costo_compra_kilo: costoKilo,
        costo_real_kilo: costoReal,
        porcentaje_utilidad: targetMargen,
        porcentaje_utilidad_manual: false,
        precio_venta_manual: false,
        precio_venta_kilo: pVenta,
        valor_total_venta: totalVenta,
      };
    });
    setProductos(updated);
    setShowMargenModal(false);
    showToast(`Margen de utilidad fijado a ${targetMargen}% para productos no manuales.`);
  };

  // 1. Modificar Costo Compra por Kilo directamente
  const handleCostoCompraKiloChange = (idx, inputValue) => {
    const costoKilo = parseMoney(inputValue);
    const copy = [...productos];
    const k = obtenerKilosItem(copy[idx]);

    copy[idx].costo_compra_kilo = costoKilo;
    copy[idx].kilos = k;
    copy[idx].valor_compra_total =
      costoKilo > 0 ? Math.round(costoKilo * k) : 0;

    const empaque = obtenerInfoEmpaque(copy[idx]);
    if (empaque) {
      copy[idx].empaque_info = empaque;
    }

    const costoReal = costoKilo > 0 ? costoKilo + gastoPorKilo : 0;
    copy[idx].costo_real_kilo = costoReal;
    const util = Math.round(copy[idx]?.porcentaje_utilidad ?? utilidadGlobal);
    if (costoReal > 0) {
      copy[idx].precio_venta_kilo = Math.round(costoReal * (1 + util / 100));
      copy[idx].valor_total_venta = Math.round(copy[idx].precio_venta_kilo * k);
    } else {
      copy[idx].precio_venta_kilo = 0;
      copy[idx].valor_total_venta = 0;
    }

    setProductos(copy);
  };

  const handleCostoCompraKiloBlur = (idx) => {
    const copy = [...productos];
    const current = copy[idx]?.costo_compra_kilo || 0;
    const rounded = redondearCentenaEstricta(current);
    const k = obtenerKilosItem(copy[idx]);

    copy[idx].costo_compra_kilo = rounded;
    copy[idx].kilos = k;
    copy[idx].valor_compra_total = redondearCentenaEstricta(rounded * k);

    const empaque = obtenerInfoEmpaque(copy[idx]);
    if (empaque) {
      copy[idx].empaque_info = empaque;
    }

    const costoReal =
      rounded > 0 ? redondearCentenaEstricta(rounded + gastoPorKilo) : 0;
    copy[idx].costo_real_kilo = costoReal;
    const util = Math.round(copy[idx]?.porcentaje_utilidad ?? utilidadGlobal);
    if (costoReal > 0) {
      copy[idx].precio_venta_kilo = redondearCentenaEstricta(
        costoReal * (1 + util / 100),
      );
      copy[idx].valor_total_venta = redondearCentenaEstricta(
        copy[idx].precio_venta_kilo * k,
      );
    } else {
      copy[idx].precio_venta_kilo = 0;
      copy[idx].valor_total_venta = 0;
    }

    setProductos(copy);
  };

  // 2. Modificar Total Compra ($)
  const handleTotalCompraChange = (idx, inputValue) => {
    const val = parseMoney(inputValue);
    const copy = [...productos];
    copy[idx].valor_compra_total = val;

    const k = obtenerKilosItem(copy[idx]);
    const costoKilo = k > 0 ? Math.round(val / k) : 0;
    copy[idx].costo_compra_kilo = costoKilo;
    copy[idx].kilos = k;

    const empaque = obtenerInfoEmpaque(copy[idx]);
    if (empaque) {
      copy[idx].empaque_info = empaque;
    }

    const costoReal = costoKilo > 0 ? costoKilo + gastoPorKilo : 0;
    copy[idx].costo_real_kilo = costoReal;
    const util = Math.round(copy[idx]?.porcentaje_utilidad ?? utilidadGlobal);
    if (costoReal > 0) {
      copy[idx].precio_venta_kilo = Math.round(costoReal * (1 + util / 100));
      copy[idx].valor_total_venta = Math.round(copy[idx].precio_venta_kilo * k);
    } else {
      copy[idx].precio_venta_kilo = 0;
      copy[idx].valor_total_venta = 0;
    }

    setProductos(copy);
  };

  const handleTotalCompraBlur = (idx) => {
    const copy = [...productos];
    const current = copy[idx]?.valor_compra_total || 0;
    const rounded = redondearCentenaEstricta(current);
    const k = obtenerKilosItem(copy[idx]);

    copy[idx].valor_compra_total = rounded;
    const costoKilo = k > 0 ? redondearCentenaEstricta(rounded / k) : 0;
    copy[idx].costo_compra_kilo = costoKilo;
    copy[idx].kilos = k;

    const empaque = obtenerInfoEmpaque(copy[idx]);
    if (empaque) {
      copy[idx].empaque_info = empaque;
    }

    const costoReal =
      costoKilo > 0 ? redondearCentenaEstricta(costoKilo + gastoPorKilo) : 0;
    copy[idx].costo_real_kilo = costoReal;
    const util = Math.round(copy[idx]?.porcentaje_utilidad ?? utilidadGlobal);
    if (costoReal > 0) {
      copy[idx].precio_venta_kilo = redondearCentenaEstricta(
        costoReal * (1 + util / 100),
      );
      copy[idx].valor_total_venta = redondearCentenaEstricta(
        copy[idx].precio_venta_kilo * k,
      );
    } else {
      copy[idx].precio_venta_kilo = 0;
      copy[idx].valor_total_venta = 0;
    }

    setProductos(copy);
  };

  // 3. Modificar Costo Real por Kilo directamente
  const handleCostoRealKiloChange = (idx, inputValue) => {
    const nuevoCostoReal = parseMoney(inputValue);
    const copy = [...productos];
    const k = obtenerKilosItem(copy[idx]);

    const costoBaseKilo = Math.max(0, nuevoCostoReal - gastoPorKilo);
    copy[idx].costo_compra_kilo = costoBaseKilo;
    copy[idx].costo_real_kilo = nuevoCostoReal;
    copy[idx].kilos = k;
    copy[idx].valor_compra_total =
      costoBaseKilo > 0 ? Math.round(costoBaseKilo * k) : 0;

    const empaque = obtenerInfoEmpaque(copy[idx]);
    if (empaque) {
      copy[idx].empaque_info = empaque;
    }

    const util = Math.round(copy[idx]?.porcentaje_utilidad ?? utilidadGlobal);
    if (nuevoCostoReal > 0) {
      copy[idx].precio_venta_kilo = Math.round(
        nuevoCostoReal * (1 + util / 100),
      );
      copy[idx].valor_total_venta = Math.round(copy[idx].precio_venta_kilo * k);
    } else {
      copy[idx].precio_venta_kilo = 0;
      copy[idx].valor_total_venta = 0;
    }

    setProductos(copy);
  };

  const handleCostoRealKiloBlur = (idx) => {
    const copy = [...productos];
    const current = copy[idx]?.costo_real_kilo || 0;
    const rounded = redondearCentenaEstricta(current);
    const k = obtenerKilosItem(copy[idx]);

    const costoBaseKilo = Math.max(
      0,
      redondearCentenaEstricta(rounded - gastoPorKilo),
    );
    copy[idx].costo_compra_kilo = costoBaseKilo;
    copy[idx].costo_real_kilo = rounded;
    copy[idx].kilos = k;
    copy[idx].valor_compra_total = redondearCentenaEstricta(costoBaseKilo * k);

    const empaque = obtenerInfoEmpaque(copy[idx]);
    if (empaque) {
      copy[idx].empaque_info = empaque;
    }

    const util = Math.round(copy[idx]?.porcentaje_utilidad ?? utilidadGlobal);
    if (rounded > 0) {
      copy[idx].precio_venta_kilo = redondearCentenaEstricta(
        rounded * (1 + util / 100),
      );
      copy[idx].valor_total_venta = redondearCentenaEstricta(
        copy[idx].precio_venta_kilo * k,
      );
    } else {
      copy[idx].precio_venta_kilo = 0;
      copy[idx].valor_total_venta = 0;
    }

    setProductos(copy);
  };

  // 4. Asistente de Empaques / Bultos
  const handleApplyPackageCost = (calcResult) => {
    if (selectedIdxForCalc === null || selectedIdxForCalc === undefined) return;
    const copy = [...productos];
    const itemActual = copy[selectedIdxForCalc];
    if (!itemActual) return;

    const costoKiloRedondeado = redondearCentenaEstricta(calcResult.costo_kilo);
    const totalCompraRedondeado = redondearCentenaEstricta(
      calcResult.total_compra,
    );
    itemActual.costo_compra_kilo = costoKiloRedondeado;
    itemActual.valor_compra_total = totalCompraRedondeado;
    itemActual.empaque_info = calcResult.empaque_info;
    if (calcResult.tipo_nombre) {
      itemActual.unidad = calcResult.tipo_nombre;
    }
    if (calcResult.kilos && parseFloat(calcResult.kilos) > 0) {
      itemActual.kilos = parseFloat(calcResult.kilos);
    }

    const costoReal = redondearCentenaEstricta(
      costoKiloRedondeado + gastoPorKilo,
    );
    const util = Math.round(itemActual.porcentaje_utilidad ?? utilidadGlobal);
    if (costoReal > 0) {
      itemActual.precio_venta_kilo = redondearCentenaEstricta(
        costoReal * (1 + util / 100),
      );
      itemActual.valor_total_venta = redondearCentenaEstricta(
        itemActual.precio_venta_kilo * (itemActual.kilos || 1),
      );
    }

    setProductos(copy);
    setCalcModalOpen(false);
    setSelectedIdxForCalc(null);
    showToast("Cálculo de empaque aplicado al producto.");
  };

  // 5. Modificar % Utilidad directamente
  const handlePorcentajeUtilChange = (idx, inputValue) => {
    const copy = [...productos];
    if (inputValue === "" || inputValue === null || inputValue === undefined) {
      copy[idx].porcentaje_utilidad = "";
    } else {
      copy[idx].porcentaje_utilidad = parseFloat(inputValue);
    }
    copy[idx].porcentaje_utilidad_manual = true;

    const costoReal = copy[idx]?.costo_real_kilo || 0;
    const utilNum = parseFloat(copy[idx].porcentaje_utilidad) || 0;
    if (costoReal > 0) {
      copy[idx].precio_venta_kilo = redondearCentenaEstricta(
        costoReal * (1 + utilNum / 100),
      );
      const k = obtenerKilosItem(copy[idx]);
      copy[idx].valor_total_venta = redondearCentenaEstricta(
        copy[idx].precio_venta_kilo * k,
      );
    }

    setProductos(copy);
  };

  const handlePorcentajeUtilBlur = (idx) => {
    const copy = [...productos];
    if (
      copy[idx].porcentaje_utilidad === "" ||
      copy[idx].porcentaje_utilidad === null ||
      isNaN(copy[idx].porcentaje_utilidad)
    ) {
      copy[idx].porcentaje_utilidad = 0;
      setProductos(copy);
    }
  };

  // 6. Modificar Precio Venta por Kilo directamente
  const handlePrecioVentaChange = (idx, inputValue) => {
    const nuevoPrecio = parseMoney(inputValue);
    const copy = [...productos];
    const itemActual = copy[idx];

    let costoReal = itemActual?.costo_real_kilo || 0;
    if (!costoReal) {
      const k = parseFloat(copy[idx]?.kilos || copy[idx]?.cantidad) || 0;
      const vCompra = parseFloat(copy[idx]?.valor_compra_total) || 0;
      const costoKilo = k > 0 ? vCompra / k : 0;
      costoReal = costoKilo + gastoPorKilo;
    }

    const k = obtenerKilosItem(copy[idx]);
    copy[idx].precio_venta_kilo = nuevoPrecio;
    copy[idx].valor_total_venta =
      nuevoPrecio > 0 ? Math.round(nuevoPrecio * k) : 0;
    copy[idx].precio_venta_manual = true;
    copy[idx].porcentaje_utilidad_manual = true;

    if (costoReal > 0) {
      if (nuevoPrecio > 0) {
        copy[idx].porcentaje_utilidad = Math.round(
          ((nuevoPrecio - costoReal) / costoReal) * 100,
        );
      } else {
        copy[idx].porcentaje_utilidad = 0;
      }
    }

    setProductos(copy);
  };

  const handlePrecioVentaBlur = (idx) => {
    const copy = [...productos];
    const current = copy[idx]?.precio_venta_kilo || 0;
    const rounded = redondearCentenaEstricta(current);
    const k = obtenerKilosItem(copy[idx]);
    copy[idx].precio_venta_kilo = rounded;
    copy[idx].valor_total_venta = redondearCentenaEstricta(rounded * k);
    copy[idx].precio_venta_manual = true;
    copy[idx].porcentaje_utilidad_manual = true;

    const costoReal = copy[idx]?.costo_real_kilo || 0;
    if (costoReal > 0 && rounded > 0) {
      copy[idx].porcentaje_utilidad = Math.round(
        ((rounded - costoReal) / costoReal) * 100,
      );
    } else {
      copy[idx].porcentaje_utilidad = 0;
    }

    setProductos(copy);
  };

  // 7. Modificar Total Venta ($) directamente
  const handleTotalVentaChange = (idx, inputValue) => {
    const val = parseMoney(inputValue);
    const copy = [...productos];
    const k = obtenerKilosItem(copy[idx]);
    const pVenta = k > 0 ? Math.round(val / k) : 0;

    copy[idx].valor_total_venta = val;
    copy[idx].precio_venta_kilo = pVenta;
    copy[idx].precio_venta_manual = true;
    copy[idx].porcentaje_utilidad_manual = true;

    const itemActual = copy[idx];
    let costoReal = itemActual?.costo_real_kilo || 0;
    if (costoReal > 0 && pVenta > 0) {
      copy[idx].porcentaje_utilidad = Math.round(
        ((pVenta - costoReal) / costoReal) * 100,
      );
    } else {
      copy[idx].porcentaje_utilidad = 0;
    }

    setProductos(copy);
  };

  const handleTotalVentaBlur = (idx) => {
    const copy = [...productos];
    const current = copy[idx]?.valor_total_venta || 0;
    const rounded = redondearCentenaEstricta(current);
    const k = obtenerKilosItem(copy[idx]);
    const pVenta = k > 0 ? redondearCentenaEstricta(rounded / k) : 0;

    copy[idx].valor_total_venta = rounded;
    copy[idx].precio_venta_kilo = pVenta;
    copy[idx].precio_venta_manual = true;
    copy[idx].porcentaje_utilidad_manual = true;

    const costoReal = copy[idx]?.costo_real_kilo || 0;
    if (costoReal > 0 && pVenta > 0) {
      copy[idx].porcentaje_utilidad = Math.round(
        ((pVenta - costoReal) / costoReal) * 100,
      );
    } else {
      copy[idx].porcentaje_utilidad = 0;
    }

    setProductos(copy);
  };

  // Métricas rápidas para checklist
  const metricasChecklist = useMemo(() => {
    const total = productos.length;
    const recibidos = productos.filter((p) => {
      const key = p.id || p.producto;
      return checklistMap[key] === true;
    }).length;
    const pendientes = total - recibidos;
    const conObs = productos.filter((p) => {
      const key = p.id || p.producto;
      return Boolean(itemObservations[key]?.trim());
    }).length;
    const pct = total > 0 ? Math.round((recibidos / total) * 100) : 0;
    return { total, recibidos, pendientes, conObs, pct };
  }, [productos, checklistMap, itemObservations]);

  // Cargar pedido desde Texto (reutilizando TextOrderModal)
  const handleConfirmCargarTexto = (rawText) => {
    const parsed = parseTextOrder(rawText, utilidadGlobal);
    if (!parsed || parsed.length === 0) {
      showToast("No se encontraron productos en el texto.", "warning");
      return;
    }

    const nuevos = parsed.map((p, idx) => {
      const id = Date.now() + idx;
      const cant = parseFloat(p.cantidad) || 1;
      const k = calcularKilosItem(cant, p.unidad || "Kg", 1.0, null, tiposEmpaque);
      return {
        id,
        producto: (p.producto || `PRODUCTO_${idx + 1}`).toUpperCase().trim(),
        cantidad: cant,
        unidad: p.unidad || "Kg",
        descripcion: "",
        kilos: k,
        valor_compra_total: p.valor_compra_total || 0,
        costo_compra_kilo:
          k > 0 && p.valor_compra_total
            ? redondearCentenaEstricta(p.valor_compra_total / k)
            : 0,
        porcentaje_utilidad: utilidadGlobal,
        precio_venta_kilo: 0,
        valor_total_venta: 0,
      };
    });

    setProductos(nuevos);
    const initialChecklist = {};
    nuevos.forEach((it) => {
      initialChecklist[it.id || it.producto] = false;
    });
    setChecklistMap(initialChecklist);
    showToast(`¡${nuevos.length} productos cargados al Surtido desde texto!`);
  };

  // Copiar lista estándar bidireccional
  const copiarListaBidireccional = async () => {
    if (productos.length === 0) {
      showToast("No hay productos para copiar.", "warning");
      return;
    }
    let txt = "";
    productos.forEach((p) => {
      const v = p.valor_compra_total ? ` ${p.valor_compra_total}` : "";
      txt += `${p.cantidad} ${p.unidad} ${p.producto}${v}\n`;
    });
    try {
      await navigator.clipboard.writeText(txt.trim());
      setCopiedClean(true);
      showToast("¡Lista copiada! Formato limpio listo para pegar en Cargar por Texto.");
      setTimeout(() => setCopiedClean(false), 2500);
    } catch (_e) {
      showToast("Error al copiar texto.", "error");
    }
  };

  // Copiar mensaje para WhatsApp
  const copiarMensajeWhatsApp = async () => {
    if (productos.length === 0) {
      showToast("No hay productos para compartir.", "warning");
      return;
    }
    let msg = `🛒 *PEDIDO DE SURTIDO / COMPRAS*\n`;
    msg += `📅 *Fecha:* ${new Date().toLocaleDateString("es-CO")}\n`;
    msg += `📦 *Total Ítems:* ${productos.length}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    productos.forEach((p, idx) => {
      const desc = p.descripcion ? ` _(${p.descripcion})_` : "";
      msg += `${idx + 1}. *${p.producto}* ➔ ${p.cantidad} ${p.unidad}${desc}\n`;
    });
    msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n_Favor despachar a la mayor brevedad._`;
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedReport(true);
      showToast("¡Mensaje para WhatsApp copiado con éxito!");
      setTimeout(() => setCopiedReport(false), 2500);
    } catch (_e) {
      showToast("Error al copiar texto.", "error");
    }
  };

  // Copiar Reporte de Faltantes / Checklist
  const copiarReporteChecklist = async () => {
    if (productos.length === 0) {
      showToast("No hay productos en el checklist.", "warning");
      return;
    }
    const recibidos = productos.filter((p) => checklistMap[p.id || p.producto] === true);
    const faltantes = productos.filter((p) => checklistMap[p.id || p.producto] !== true);

    let msg = `📋 *REPORTE DE RECEPCIÓN / CHECKLIST DE SURTIDO*\n`;
    msg += `📅 *Fecha:* ${new Date().toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}\n`;
    msg += `📊 *Estado:* ${recibidos.length}/${productos.length} Recibidos (${metricasChecklist.pct}%)\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (faltantes.length > 0) {
      msg += `⏳ *FALTANTES / PENDIENTES (${faltantes.length}):*\n`;
      faltantes.forEach((p, idx) => {
        const key = p.id || p.producto;
        msg += `${idx + 1}. ✗ *${p.producto}* (${p.cantidad} ${p.unidad})\n`;
        const obs = itemObservations[key];
        if (obs && obs.trim()) {
          msg += `   └ ⚠️ *Obs:* ${obs.trim()}\n`;
        }
      });
      msg += `\n`;
    } else {
      msg += `🎉 *¡TODOS LOS PRODUCTOS LLEGARON COMPLETOS!*\n\n`;
    }

    if (recibidos.length > 0) {
      msg += `✅ *RECIBIDOS COMPLETOS (${recibidos.length}):*\n`;
      recibidos.forEach((p, idx) => {
        const key = p.id || p.producto;
        msg += `${idx + 1}. ✓ *${p.producto}* (${p.cantidad} ${p.unidad})\n`;
        const obs = itemObservations[key];
        if (obs && obs.trim()) {
          msg += `   └ 📝 *Obs:* ${obs.trim()}\n`;
        }
      });
      msg += `\n`;
    }

    if (generalNotes.trim()) {
      msg += `📝 *OBSERVACIONES GENERALES:*\n${generalNotes.trim()}\n\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n_Reporte generado en Sistema Fruver_`;

    try {
      await navigator.clipboard.writeText(msg);
      showToast("¡Reporte de faltantes copiado para WhatsApp!");
    } catch (_e) {
      showToast("Error al copiar reporte.", "error");
    }
  };

  // Sincronizar y actualizar precios de venta en catálogo oficial
  const aplicarPreciosAlCatalogo = async () => {
    if (productos.length === 0) {
      showToast("No hay productos con precios calculados para aplicar.", "warning");
      return;
    }

    if (
      !window.confirm(
        `¿Desea actualizar los precios de costo y venta de ${productos.length} productos en el Catálogo Oficial? Los próximos pedidos a clientes tomarán estos nuevos precios.`,
      )
    ) {
      return;
    }

    setApplyingPrices(true);
    let actualizados = 0;

    try {
      const catalogMap = new Map();
      masterProducts.forEach((p) => {
        if (p.nombre) catalogMap.set(p.nombre.trim().toUpperCase(), p);
      });

      for (const item of liquidacion.items) {
        const normName = item.producto.trim().toUpperCase();
        const pEnCatalogo = catalogMap.get(normName);

        if (pEnCatalogo && pEnCatalogo.id) {
          try {
            await productApi.update(pEnCatalogo.id, {
              precio_costo_referencia: item.costo_real_kilo,
              precio_venta_referencia: item.precio_venta_kilo,
            });
            actualizados++;
          } catch (_err) {
            // Ignorar fallo al actualizar un producto individual
          }
        }
      }

      showToast(`¡Catálogo actualizado! Se fijaron los nuevos precios para ${actualizados} productos.`);
    } catch (_e) {
      showToast("Error al actualizar catálogo de productos.", "error");
    } finally {
      setApplyingPrices(false);
    }
  };

  // Exportar liquidación en PDF o Excel
  const exportarInformeSurtido = async (tipo) => {
    if (productos.length === 0) {
      showToast("No hay productos en el surtido para exportar.", "warning");
      return;
    }
    const payload = {
      cliente_id: null,
      numero_remision: "SURTIDO",
      numero_oc: "SURTIDO",
      fecha_entrega: new Date().toISOString().split("T")[0],
      numero_canastas: "",
      observaciones: generalNotes || "Liquidación de compra y surtido",
      productos: liquidacion?.items || productos,
      gastos,
      utilidad_global: utilidadGlobal,
      liquidacion,
    };
    try {
      let blob;
      let filename = `informe_surtido_${new Date().toISOString().split("T")[0]}`;
      if (tipo === "pdf") {
        blob = await exportApi.exportPdfInforme(payload);
        filename += ".pdf";
      } else {
        blob = await exportApi.exportExcelInforme(payload);
        filename += ".xlsx";
      }
      downloadBlob(blob, filename);
      showToast(`Documento ${filename} generado.`);
    } catch (err) {
      console.error("Error generando exportación:", err);
      showToast("Error generando exportación.", "error");
    }
  };

  // Filtrado de productos en checklist
  const itemsFiltradosChecklist = useMemo(() => {
    return productos.filter((p) => {
      const key = p.id || p.producto;
      const isChecked = checklistMap[key] === true;
      const hasObs = Boolean(itemObservations[key]?.trim());

      if (checklistFilter === "pendientes" && isChecked) return false;
      if (checklistFilter === "recibidos" && !isChecked) return false;
      if (checklistFilter === "con_novedad" && !hasObs) return false;

      if (checklistSearch.trim()) {
        const q = checklistSearch.toLowerCase();
        const matchName = p.producto.toLowerCase().includes(q);
        const matchUnit = (p.unidad || "").toLowerCase().includes(q);
        const matchObs = (itemObservations[key] || "").toLowerCase().includes(q);
        if (!matchName && !matchUnit && !matchObs) return false;
      }

      return true;
    });
  }, [productos, checklistMap, itemObservations, checklistFilter, checklistSearch]);

  if (!canVerSurtido) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <Truck className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Acceso Restringido a Surtido & Compras
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Su usuario no dispone del permiso{" "}
          <code className="text-emerald-600 font-mono font-bold">
            puede_ver_surtido
          </code>
          . Contacte a un administrador para asignarlo en la Matriz de Permisos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
      {/* Modal Oficial de Carga por Texto (TextOrderModal) */}
      <TextOrderModal
        isOpen={textModalOpen}
        onClose={() => setTextModalOpen(false)}
        onConfirm={(txt) => {
          handleConfirmCargarTexto(txt);
          setTextModalOpen(false);
        }}
        defaultMargin={utilidadGlobal}
      />

      {/* ====================================================================
          1. ENCABEZADO SUPERIOR LIMPIO DE SURTIDO & ABASTECIMIENTO
          ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                Abastecimiento Fruver
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                Compras de Plaza & Inventario
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight mt-0.5">
              Surtido, Checklist & Fijación de Precios
            </h1>
          </div>
        </div>

        {/* Acciones Rápidas de la Barra Superior */}
        <div className="flex flex-wrap items-center gap-2">
          {canCrearSurtido && (
            <button
              type="button"
              onClick={() => setTextModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-black px-4 py-2.5 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
              title="Pegar lista de compras del fruver desde WhatsApp"
            >
              <FileText className="w-4 h-4 text-teal-200" />
              <span>Cargar por Texto (Surtido)</span>
            </button>
          )}

          <button
            type="button"
            onClick={copiarListaBidireccional}
            disabled={productos.length === 0}
            className={`text-xs font-black px-3.5 py-2.5 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50 ${
              copiedClean
                ? "bg-teal-700 text-white"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
            title="Copia en formato texto limpio estándar para volver a pegar en Cargar por Texto en cualquier momento"
          >
            {copiedClean ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>Copiar Lista (Reutilizable)</span>
          </button>

          <button
            type="button"
            onClick={copiarMensajeWhatsApp}
            disabled={productos.length === 0}
            className={`text-xs font-black px-3.5 py-2.5 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50 ${
              copiedReport
                ? "bg-emerald-700 text-white"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
            }`}
            title="Copia con formato de viñetas para compartir a proveedor por WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden xs:inline">WhatsApp</span>
          </button>

          {canCrearSurtido && productos.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("¿Desea limpiar todo el surtido actual?")) {
                  setProductos([]);
                  setChecklistMap({});
                  setItemObservations({});
                  showToast("Surtido reiniciado.");
                }
              }}
              className="text-slate-400 hover:text-red-600 text-xs font-bold p-2.5 rounded-xl hover:bg-red-50 transition cursor-pointer"
              title="Limpiar todo el surtido"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ====================================================================
          2. PESTAÑAS DE NAVEGACIÓN SEGMENTADAS (RESPONSIVE, SIN SCROLL HORIZONTAL)
          ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 bg-slate-200/70 p-1.5 rounded-2xl border border-slate-300/60 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("pedido")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === "pedido"
              ? "bg-white text-slate-900 shadow-xs scale-[1.01]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          <Package className="w-4 h-4 text-emerald-600" />
          <span>1. Armar Pedido</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {productos.length} ítems
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("checklist")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === "checklist"
              ? "bg-white text-slate-900 shadow-xs scale-[1.01]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          <PackageCheck className="w-4 h-4 text-teal-600" />
          <span>2. Checklist Llegada</span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              metricasChecklist.recibidos === metricasChecklist.total && metricasChecklist.total > 0
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {metricasChecklist.recibidos}/{metricasChecklist.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("liquidacion")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === "liquidacion"
              ? "bg-white text-slate-900 shadow-xs scale-[1.01]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          <Calculator className="w-4 h-4 text-blue-600" />
          <span>3. Liquidación & Precios</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {formatMoney(totalKilosCalculo)} Kg
          </span>
        </button>
      </div>

      {/* ====================================================================
          PESTAÑA 1: ARMAR PEDIDO (COMPONENTE OFICIAL ORDERITEMSTABLE)
          ==================================================================== */}
      {activeTab === "pedido" && (
        <div className="space-y-4">
          <OrderItemsTable
            productos={productos}
            setProductos={setProductos}
            isPedidoBloqueado={false}
            draggedIndex={draggedIndex}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            ejecutarRecalculo={() => {}}
            triggerAutoSave={() => {}}
            utilidadGlobal={utilidadGlobal}
            gastos={gastos}
            empaquesManager={empaquesManager}
          />
        </div>
      )}

      {/* ====================================================================
          PESTAÑA 2: CHECKLIST DE RECEPCIÓN & NOVEDADES
          ==================================================================== */}
      {activeTab === "checklist" && (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda de Checklist */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setChecklistFilter("todos")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  checklistFilter === "todos"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Todos ({metricasChecklist.total})
              </button>
              <button
                type="button"
                onClick={() => setChecklistFilter("pendientes")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  checklistFilter === "pendientes"
                    ? "bg-amber-500 text-white shadow-2xs font-black"
                    : "text-amber-800 hover:bg-amber-50"
                }`}
              >
                <span>⏳ Pendientes ({metricasChecklist.pendientes})</span>
              </button>
              <button
                type="button"
                onClick={() => setChecklistFilter("recibidos")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  checklistFilter === "recibidos"
                    ? "bg-emerald-600 text-white shadow-2xs font-black"
                    : "text-emerald-800 hover:bg-emerald-50"
                }`}
              >
                <span>✅ Recibidos ({metricasChecklist.recibidos})</span>
              </button>
              <button
                type="button"
                onClick={() => setChecklistFilter("con_novedad")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  checklistFilter === "con_novedad"
                    ? "bg-indigo-600 text-white shadow-2xs font-black"
                    : "text-indigo-700 hover:bg-indigo-50"
                }`}
              >
                <span>📝 Con Obs ({metricasChecklist.conObs})</span>
              </button>
            </div>

            <div className="flex items-center gap-2 justify-between md:justify-end">
              <div className="relative flex-1 md:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar producto u observación..."
                  value={checklistSearch}
                  onChange={(e) => setChecklistSearch(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={copiarReporteChecklist}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Copiar Reporte Faltantes</span>
              </button>
            </div>
          </div>

          {/* Cuadrícula Responsive de Productos en Verificación */}
          {itemsFiltradosChecklist.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
              <CheckSquare className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-bold">
                {productos.length === 0
                  ? "No hay productos en el surtido. Cargue productos en la pestaña 'Armar Pedido'."
                  : "No hay productos que coincidan con el filtro seleccionado."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {itemsFiltradosChecklist.map((p, idx) => {
                const key = p.id || p.producto;
                const isChecked = checklistMap[key] === true;
                const obs = itemObservations[key] || "";
                const hasObs = Boolean(obs.trim());

                return (
                  <div
                    key={key}
                    className={`rounded-2xl border p-3.5 sm:p-4 flex flex-col justify-between gap-3 transition-all duration-150 ${
                      isChecked
                        ? "bg-white border-emerald-300 shadow-xs"
                        : "bg-white border-amber-300/80 shadow-xs ring-1 ring-amber-300/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          disabled={!canChecklist}
                          onClick={() => {
                            if (!canChecklist) return;
                            setChecklistMap((prev) => ({
                              ...prev,
                              [key]: !prev[key],
                            }));
                          }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            isChecked
                              ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                              : "border-2 border-slate-300 hover:border-amber-500 bg-slate-50 text-transparent"
                          }`}
                          title={isChecked ? "Marcar como pendiente" : "Marcar como recibido"}
                        >
                          <Check className={`w-5 h-5 stroke-[3] ${isChecked ? "text-white" : "text-transparent"}`} />
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              #{idx + 1}
                            </span>
                            <span
                              onClick={() => {
                                if (!canChecklist) return;
                                setChecklistMap((prev) => ({
                                  ...prev,
                                  [key]: !prev[key],
                                }));
                              }}
                              className={`text-xs sm:text-sm font-black cursor-pointer truncate max-w-full leading-tight ${
                                isChecked
                                  ? "text-emerald-900"
                                  : "text-slate-900"
                              }`}
                            >
                              {p.producto}
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 mt-1">
                            📦 Esperado: <strong className="text-slate-900">{p.cantidad} {p.unidad}</strong>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!canChecklist}
                        onClick={() => {
                          if (!canChecklist) return;
                          setChecklistMap((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }));
                        }}
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full cursor-pointer transition active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isChecked
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {isChecked ? "✓ Recibido" : "⏳ Pendiente"}
                      </button>
                    </div>

                    {/* Observación puntual del producto */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>Observación de este producto:</span>
                        </span>
                        {hasObs && (
                          <button
                            type="button"
                            onClick={() =>
                              setItemObservations((prev) => {
                                const c = { ...prev };
                                delete c[key];
                                return c;
                              })
                            }
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        disabled={!canChecklist}
                        value={obs}
                        onChange={(e) =>
                          setItemObservations((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        placeholder={
                          canChecklist
                            ? "Ej: Faltaron 3 kg, llegó maduro, empaque averiado..."
                            : "Sin permiso para registrar observaciones"
                        }
                        className={`w-full text-xs font-medium px-2.5 py-1.5 rounded-xl border outline-none transition disabled:bg-slate-100 disabled:cursor-not-allowed ${
                          hasObs
                            ? "bg-amber-50/50 border-amber-300 text-slate-900"
                            : "bg-slate-50 border-slate-200 text-slate-800 focus:ring-1 focus:ring-emerald-500"
                        }`}
                      />

                      {canChecklist && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          <span className="text-[9px] uppercase font-black text-slate-400 mr-0.5">
                            Rápido:
                          </span>
                          {QUICK_OBS_TAGS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setItemObservations((prev) => {
                                  const cur = prev[key] || "";
                                  if (!cur.trim()) return { ...prev, [key]: tag };
                                  if (cur.includes(tag)) return prev;
                                  return { ...prev, [key]: `${cur} - ${tag}` };
                                });
                              }}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer border border-slate-200/60"
                            >
                              +{tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Observaciones Generales */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Observaciones Generales de la Entrega (Transporte / Conductor)</span>
            </label>
            <textarea
              rows={2}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Ej: Conductor entregó remisión #8412 con viaje parcial. Pendiente segundo envío..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>
      )}

      {/* ====================================================================
          PESTAÑA 3: LIQUIDACIÓN & PRECIOS (100% IDÉNTICO A FINANCIALVIEW)
          ==================================================================== */}
      {activeTab === "liquidacion" && (
        <div className="space-y-4 sm:space-y-5">
          {/* Barra Superior con Botones de Imprimir, PDF, Excel y Estado Comercial */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* Sección Izquierda: Título y Badges informativos (amplio y sin comprimir) */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                  Liquidación & Gastos Comerciales
                </h3>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-lg shadow-2xs">
                    ⚖️ Redondeo comercial a centenas ($100)
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-lg shadow-2xs">
                    Gastos: +${formatMoney(gastoPorKilo)}/Kg
                  </span>
                </div>
              </div>
            </div>

            {/* Sección Derecha: Exportaciones y Acciones Operativas */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Grupo de Exportaciones compacto */}
              {canExport && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                    title="Imprimir liquidación financiera"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Imprimir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportarInformeSurtido("pdf")}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition"
                    title="Exportar informe de liquidación en PDF"
                  >
                    <FileText className="w-3.5 h-3.5 text-red-600" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportarInformeSurtido("excel")}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition"
                    title="Exportar informe de liquidación en Excel"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel</span>
                  </button>
                </div>
              )}

              {/* Botón Conciliación POS */}
              {canConciliarPos && (
                <button
                  type="button"
                  onClick={() => setConciliacionModalOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  title="Conciliar y sincronizar precios calculados con el Sistema POS"
                >
                  <Store className="w-4 h-4" />
                  <span>Conciliación POS</span>
                </button>
              )}

              {/* Botón Aplicar al Catálogo Oficial */}
              <button
                type="button"
                onClick={aplicarPreciosAlCatalogo}
                disabled={!canApplyCatalog || applyingPrices || productos.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title={
                  !canApplyCatalog
                    ? "Requiere permiso: puede_aplicar_precios_catalogo"
                    : "Actualizar catálogo de productos con los precios calculados"
                }
              >
                {applyingPrices ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Aplicar Precios al Catálogo Oficial</span>
              </button>
            </div>
          </div>

          {/* 1. Resumen Financiero Consolidado */}
          <FinancialSummaryCards liquidacion={liquidacion} />

          {/* 2. Barra de Utilidad Global y Enlace a Medidas */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-black text-xs sm:text-sm text-slate-900 block leading-tight">
                  Margen de Utilidad Global
                </span>
                <p className="text-[11px] text-slate-400 truncate">
                  Aplica por defecto a los productos sin margen individual asignado.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {onOpenPresentaciones && (
                <button
                  type="button"
                  onClick={onOpenPresentaciones}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title="Configurar pesos de ponys, canastillas, bultos y cajas"
                >
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">
                    Configurar Empaques & Medidas
                  </span>
                  <span className="sm:hidden">Empaques</span>
                </button>
              )}

              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <input
                  type="number"
                  inputMode="decimal"
                  aria-label="Porcentaje de margen global"
                  title="Presione Enter o haga clic fuera para actualizar el margen global"
                  className="w-16 sm:w-20 border border-slate-200/80 bg-white rounded-lg py-1 px-2 text-center text-emerald-700 font-black text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 tabular-nums transition shadow-2xs"
                  value={tempUtilidadGlobal}
                  onChange={(e) => setTempUtilidadGlobal(e.target.value)}
                  onBlur={() => handleConfirmMargenGlobal(tempUtilidadGlobal)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.target.blur();
                    }
                  }}
                />
                <span className="text-xs font-black text-slate-400 pr-1">%</span>
              </div>
            </div>
          </div>

          {/* 3. Tabla de Liquidación y Costeo */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 sm:px-5 py-3 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Liquidación de Productos por Kilo
                </h3>
                <span className="text-[11px] font-bold text-slate-400 ml-1">
                  ({items.length} productos calculados)
                </span>
              </div>

              {/* Selector de Vista: Tabla / Tarjetas (estilo inventario_fruver) */}
              <div className="inline-flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-300/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setTableViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    tableViewMode === "table"
                      ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Vista de Tabla Horizontal Compacta"
                >
                  <Table className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Tabla</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTableViewMode("cards")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    tableViewMode === "cards"
                      ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Vista de Tarjetas Responsivas (sin scroll)"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>Tarjetas</span>
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400 italic">
                No hay productos cargados en el pedido de surtido.
              </p>
            ) : tableViewMode === "cards" ? (
              /* VISTA DE TARJETAS (RESPONSIVA, SIN SCROLL HORIZONTAL) */
              <div className="p-3.5 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {items.map((p, idx) => {
                  const matched = masterProductsMap.get(
                    normalizeText(p.producto || p.nombre || ""),
                  );
                  const posItemId = p.pos_item_id || matched?.pos_item_id || null;
                  const precioPosActual =
                    p.precio_pos_actual !== undefined && p.precio_pos_actual !== null && Number(p.precio_pos_actual) > 0
                      ? Number(p.precio_pos_actual)
                      : Number(matched?.precio_pos_actual || 0);

                  const empaque = obtenerInfoEmpaque(p);
                  const k = obtenerKilosItem(p);
                  const libras = obtenerLibrasItem(p);
                  const costoKiloBase =
                    p.costo_compra_kilo !== undefined &&
                    p.costo_compra_kilo !== null &&
                    p.costo_compra_kilo !== "" &&
                    parseFloat(p.costo_compra_kilo) >= 0
                      ? parseFloat(p.costo_compra_kilo)
                      : k > 0
                        ? (parseFloat(p.valor_compra_total) || 0) / k
                        : 0;
                  const costoEmpaqueBase =
                    empaque && parseFloat(empaque.peso_kg) > 0
                      ? Math.round(costoKiloBase * parseFloat(empaque.peso_kg))
                      : 0;
                  const costoLibraBase =
                    libras > 0
                      ? Math.round(
                          (parseFloat(p.valor_compra_total) || 0) / libras,
                        )
                      : Math.round(costoKiloBase / 2);

                  return (
                    <FinancialItemCard
                      key={p.id || idx}
                      p={p}
                      idx={idx}
                      posItemId={posItemId}
                      precioPosActual={precioPosActual}
                      empaque={empaque}
                      k={k}
                      libras={libras}
                      costoKiloBase={costoKiloBase}
                      costoEmpaqueBase={costoEmpaqueBase}
                      costoLibraBase={costoLibraBase}
                      gastoPorKilo={gastoPorKilo}
                      isInputsDisabled={!canLiquidar}
                      valorCompraTotal={p.valor_compra_total}
                      utilidadGlobal={utilidadGlobal}
                      onCostoCompraKiloChange={handleCostoCompraKiloChange}
                      onCostoCompraKiloBlur={handleCostoCompraKiloBlur}
                      onTotalCompraChange={handleTotalCompraChange}
                      onTotalCompraBlur={handleTotalCompraBlur}
                      onCostoRealKiloChange={handleCostoRealKiloChange}
                      onCostoRealKiloBlur={handleCostoRealKiloBlur}
                      onPorcentajeUtilChange={handlePorcentajeUtilChange}
                      onPorcentajeUtilBlur={handlePorcentajeUtilBlur}
                      onPrecioVentaChange={handlePrecioVentaChange}
                      onPrecioVentaBlur={handlePrecioVentaBlur}
                      onTotalVentaChange={handleTotalVentaChange}
                      onTotalVentaBlur={handleTotalVentaBlur}
                      onOpenCalcModal={(i) => {
                        setSelectedIdxForCalc(i);
                        setCalcModalOpen(true);
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <>
                {/* VISTA MÓVIL (< 768px) */}
                <div className="md:hidden divide-y divide-slate-100 p-2.5 space-y-3">
                  {items.map((p, idx) => {
                    const matched = masterProductsMap.get(
                      normalizeText(p.producto || p.nombre || ""),
                    );
                    const posItemId = p.pos_item_id || matched?.pos_item_id || null;
                    const precioPosActual =
                      p.precio_pos_actual !== undefined && p.precio_pos_actual !== null && Number(p.precio_pos_actual) > 0
                        ? Number(p.precio_pos_actual)
                        : Number(matched?.precio_pos_actual || 0);

                    const empaque = obtenerInfoEmpaque(p);
                    const k = obtenerKilosItem(p);
                    const libras = obtenerLibrasItem(p);
                    const costoKiloBase =
                      p.costo_compra_kilo !== undefined &&
                      p.costo_compra_kilo !== null &&
                      p.costo_compra_kilo !== "" &&
                      parseFloat(p.costo_compra_kilo) >= 0
                        ? parseFloat(p.costo_compra_kilo)
                        : k > 0
                          ? (parseFloat(p.valor_compra_total) || 0) / k
                          : 0;
                    const costoEmpaqueBase =
                      empaque && parseFloat(empaque.peso_kg) > 0
                        ? Math.round(costoKiloBase * parseFloat(empaque.peso_kg))
                        : 0;
                    const costoLibraBase =
                      libras > 0
                        ? Math.round(
                            (parseFloat(p.valor_compra_total) || 0) / libras,
                          )
                        : Math.round(costoKiloBase / 2);

                    return (
                      <FinancialItemCard
                        key={p.id || idx}
                        p={p}
                        idx={idx}
                        posItemId={posItemId}
                        precioPosActual={precioPosActual}
                        empaque={empaque}
                        k={k}
                        libras={libras}
                        costoKiloBase={costoKiloBase}
                        costoEmpaqueBase={costoEmpaqueBase}
                        costoLibraBase={costoLibraBase}
                        gastoPorKilo={gastoPorKilo}
                        isInputsDisabled={!canLiquidar}
                        valorCompraTotal={p.valor_compra_total}
                        utilidadGlobal={utilidadGlobal}
                        onCostoCompraKiloChange={handleCostoCompraKiloChange}
                        onCostoCompraKiloBlur={handleCostoCompraKiloBlur}
                        onTotalCompraChange={handleTotalCompraChange}
                        onTotalCompraBlur={handleTotalCompraBlur}
                        onCostoRealKiloChange={handleCostoRealKiloChange}
                        onCostoRealKiloBlur={handleCostoRealKiloBlur}
                        onPorcentajeUtilChange={handlePorcentajeUtilChange}
                        onPorcentajeUtilBlur={handlePorcentajeUtilBlur}
                        onPrecioVentaChange={handlePrecioVentaChange}
                        onPrecioVentaBlur={handlePrecioVentaBlur}
                        onTotalVentaChange={handleTotalVentaChange}
                        onTotalVentaBlur={handleTotalVentaBlur}
                        onOpenCalcModal={(i) => {
                          setSelectedIdxForCalc(i);
                          setCalcModalOpen(true);
                        }}
                      />
                    );
                  })}
                </div>

                {/* VISTA ESCRITORIO (>= 768px) */}
                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                  <table className="w-full min-w-[890px] text-left text-xs border-collapse">
                    <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-black uppercase text-[10px] sm:text-[10.5px] tracking-wider border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                      <tr>
                        <th className="px-2 py-2.5 w-7 text-center">#</th>
                        <th className="px-2 py-2.5 min-w-[120px] max-w-[200px]">Producto</th>
                        <th className="px-2 py-2.5 text-center min-w-[85px]">Cant. / Unidad</th>
                        <th className="px-2 py-2.5 text-right min-w-[110px] bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300">
                          Costo Compra/Kg
                        </th>
                        <th className="px-2 py-2.5 text-right min-w-[95px] bg-amber-100/50 dark:bg-amber-900/30 text-amber-950 dark:text-amber-200">
                          Total Compra ($)
                        </th>
                        <th className="px-2 py-2.5 text-right min-w-[105px] bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200">
                          <div>
                            <span>Costo Real/Kg</span>
                            <span className="block text-[8px] font-black text-amber-700 dark:text-amber-400 normal-case">
                              (+${formatMoney(gastoPorKilo)} gastos)
                            </span>
                          </div>
                        </th>
                        <th className="px-2 py-2.5 text-center min-w-[60px] bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300">
                          % Util
                        </th>
                        <th className="px-2 py-2.5 text-right min-w-[95px] bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300">
                          P. Venta / Kg
                        </th>
                        <th className="px-2 py-2.5 text-center min-w-[105px] bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300">
                          <div>
                            <span>Precio POS</span>
                            <span className="block text-[8px] font-bold text-purple-700 dark:text-purple-400 normal-case">
                              (Sistema POS)
                            </span>
                          </div>
                        </th>
                        <th className="px-2 py-2.5 text-right min-w-[105px] bg-emerald-50/70 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-300">
                          Total Venta ($)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 font-medium">
                      {items.map((p, idx) => {
                        const matched = masterProductsMap.get(
                          normalizeText(p.producto || p.nombre || ""),
                        );
                        const posItemId = p.pos_item_id || matched?.pos_item_id || null;
                        const precioPosActual =
                          p.precio_pos_actual !== undefined && p.precio_pos_actual !== null && Number(p.precio_pos_actual) > 0
                            ? Number(p.precio_pos_actual)
                            : Number(matched?.precio_pos_actual || 0);

                        const empaque = obtenerInfoEmpaque(p);
                        const k = obtenerKilosItem(p);
                        const libras = obtenerLibrasItem(p);
                        const costoKiloBase =
                          p.costo_compra_kilo !== undefined &&
                          p.costo_compra_kilo !== null &&
                          p.costo_compra_kilo !== "" &&
                          parseFloat(p.costo_compra_kilo) >= 0
                            ? parseFloat(p.costo_compra_kilo)
                            : k > 0
                              ? (parseFloat(p.valor_compra_total) || 0) / k
                              : 0;
                        const costoEmpaqueBase =
                          empaque && parseFloat(empaque.peso_kg) > 0
                            ? Math.round(
                                costoKiloBase * parseFloat(empaque.peso_kg),
                              )
                            : 0;
                        const costoLibraBase =
                          libras > 0
                            ? Math.round(
                                (parseFloat(p.valor_compra_total) || 0) / libras,
                              )
                            : Math.round(costoKiloBase / 2);

                        return (
                          <FinancialItemRow
                            key={p.id || idx}
                            p={p}
                            idx={idx}
                            posItemId={posItemId}
                            precioPosActual={precioPosActual}
                            empaque={empaque}
                            k={k}
                            libras={libras}
                            costoKiloBase={costoKiloBase}
                            costoEmpaqueBase={costoEmpaqueBase}
                            costoLibraBase={costoLibraBase}
                            gastoPorKilo={gastoPorKilo}
                            isInputsDisabled={!canLiquidar}
                            valorCompraTotal={p.valor_compra_total}
                            utilidadGlobal={utilidadGlobal}
                            onCostoCompraKiloChange={handleCostoCompraKiloChange}
                            onCostoCompraKiloBlur={handleCostoCompraKiloBlur}
                            onTotalCompraChange={handleTotalCompraChange}
                            onTotalCompraBlur={handleTotalCompraBlur}
                            onCostoRealKiloChange={handleCostoRealKiloChange}
                            onCostoRealKiloBlur={handleCostoRealKiloBlur}
                            onPorcentajeUtilChange={handlePorcentajeUtilChange}
                            onPorcentajeUtilBlur={handlePorcentajeUtilBlur}
                            onPrecioVentaChange={handlePrecioVentaChange}
                            onPrecioVentaBlur={handlePrecioVentaBlur}
                            onTotalVentaChange={handleTotalVentaChange}
                            onTotalVentaBlur={handleTotalVentaBlur}
                            onOpenCalcModal={(i) => {
                              setSelectedIdxForCalc(i);
                              setCalcModalOpen(true);
                            }}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* 4. Gastos Operativos con Prorrateo a Centenas */}
          <ExpensesManager
            gastos={gastos}
            setGastos={setGastos}
            isPedidoBloqueado={false}
            ejecutarRecalculo={() => {}}
            triggerAutoSave={() => {}}
            productos={productos}
            utilidadGlobal={utilidadGlobal}
          />

          {/* Modal Asistente de Cálculo por Presentación / Bulto */}
          {calcModalOpen &&
            selectedIdxForCalc !== null &&
            items[selectedIdxForCalc] && (
              <PackageCostCalculatorModal
                isOpen={calcModalOpen}
                onClose={() => {
                  setCalcModalOpen(false);
                  setSelectedIdxForCalc(null);
                }}
                item={items[selectedIdxForCalc]}
                onApply={handleApplyPackageCost}
                onOpenPresentaciones={onOpenPresentaciones}
                tiposEmpaqueProp={empaquesManager?.tiposEmpaque}
                empaquesProp={empaquesManager?.empaques}
                productosCatalogoProp={empaquesManager?.productosCatalogo}
                obtenerEmpaquesDeProductoProp={
                  empaquesManager?.obtenerEmpaquesDeProducto
                }
              />
            )}

          {/* Modal de confirmación para aplicar margen global */}
          <GlobalProfitMarginModal
            isOpen={showMargenModal}
            targetMargin={targetMargen}
            currentMargin={utilidadGlobal}
            totalProducts={productos.length}
            manualCount={manualProductsCount}
            onApplyToAll={handleApplyToAll}
            onApplyToNonManual={handleApplyToNonManual}
            onCancel={() => {
              setTempUtilidadGlobal(utilidadGlobal);
              setShowMargenModal(false);
            }}
          />

          {/* Modal de Conciliación con Sistema POS */}
          <PosReconciliationModal
            isOpen={conciliacionModalOpen}
            onClose={() => setConciliacionModalOpen(false)}
            items={items}
            currentProducts={items}
            masterProducts={masterProducts}
            onSuccess={() => {
              productApi
                .getAll()
                .then((data) => {
                  if (Array.isArray(data)) setMasterProducts(data);
                })
                .catch(() => {});
            }}
            onPricesUpdated={() => {
              productApi
                .getAll()
                .then((data) => {
                  if (Array.isArray(data)) setMasterProducts(data);
                })
                .catch(() => {});
            }}
          />
        </div>
      )}
    </div>
  );
}
