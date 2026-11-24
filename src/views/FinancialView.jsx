import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Sliders,
  FileText,
  Download,
  Lock,
  TrendingUp,
  Scale,
  Printer,
  Table,
  LayoutGrid,
} from "lucide-react";

import ExpensesManager from "../components/orders/ExpensesManager";
import FinancialSummaryCards from "../components/summary/FinancialSummaryCards";
import PackageCostCalculatorModal from "../components/modals/PackageCostCalculatorModal";
import GlobalProfitMarginModal from "../components/modals/GlobalProfitMarginModal";
import FinancialItemRow from "../components/financial/FinancialItemRow";
import FinancialItemCard from "../components/financial/FinancialItemCard";
import { formatMoney, parseMoney } from "../utils/currency";
import { redondearCentenaEstricta } from "../utils/math";
import { useAuth } from "../context/AuthContext";
import { productApi } from "../api/productApi";
import { normalizeText } from "../utils/productMatcher";

import { esUnidadClasica } from "../utils/unitMatcher";

export default function FinancialView({
  activeOrder,
  onOpenPresentaciones,
  empaquesManager,
}) {
  const {
    productos,
    setProductos,
    gastos,
    setGastos,
    utilidadGlobal,
    setUtilidadGlobal,
    liquidacion,
    isPedidoBloqueado,
    ejecutarRecalculo,
    triggerAutoSave,
    exportarDocumento,
  } = activeOrder;

  const { hasPermission } = useAuth();
  const canEditOrders = hasPermission("puede_editar_pedidos");
  const canExport = hasPermission("puede_exportar");
  const canViewFinancial = hasPermission("puede_ver_financiero");
  const canEditCostos = hasPermission("puede_editar_costos");
  const canModifyMargenes = hasPermission("puede_modificar_margenes");
  const canManageGastos = hasPermission("puede_gestionar_gastos");

  // Estado del modal asistente de empaques / bultos
  const [calcModalOpen, setCalcModalOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("open_modal") === "calc",
  );
  const [selectedIdxForCalc, setSelectedIdxForCalc] = useState(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("open_modal") === "calc"
      ? 0
      : null,
  );

  // Estado del modal para confirmar cambio de margen global
  const [tempUtilidadGlobal, setTempUtilidadGlobal] = useState(utilidadGlobal);
  const [showMargenModal, setShowMargenModal] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("open_modal") ===
        "margen",
  );
  const [targetMargen, setTargetMargen] = useState(utilidadGlobal);

  // Catálogo maestro (para vincular IDs y precios de referencia del Sistema POS)
  const [masterProducts, setMasterProducts] = useState([]);

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

  const masterProductsMap = useMemo(() => {
    const map = new Map();
    (masterProducts || []).forEach((p) => {
      if (p.nombre) map.set(normalizeText(p.nombre), p);
    });
    return map;
  }, [masterProducts]);

  const [prevUtilidadGlobal, setPrevUtilidadGlobal] = useState(utilidadGlobal);
  if (utilidadGlobal !== prevUtilidadGlobal) {
    setPrevUtilidadGlobal(utilidadGlobal);
    setTempUtilidadGlobal(utilidadGlobal);
  }

  const items = liquidacion?.items || productos;
  const isInputsDisabled = isPedidoBloqueado || !canEditOrders || !canEditCostos;
  const [tableViewMode, setTableViewMode] = useState("table");

  // Detección de Tipo de Empaque Estandarizado para un ítem
  // Detección de Tipo de Empaque Estandarizado para un ítem
  const obtenerInfoEmpaque = useCallback(
    (item) => {
      if (!item) return null;

      // 1. Si el ítem ya tiene empaque_info registrado (calculado con el asistente o guardado en backend)
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

      // Si la unidad es clásica (Kg, Libra, Bloque, Paquete, Und, Gr) y no tiene empaque_info, no es un embalaje
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

      // Si la unidad en el pedido es clásica (Kg, Libra, etc.), el peso del pedido se calcula con esa unidad y cantidad
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
        // Kg, kilogramo, bloque, paquete, etc.
        return cant;
      }

      // Si la unidad en el pedido es un embalaje (Bulto, Pony, Arroba, etc.), se calcula con el peso del empaque
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

  // Cálculo del total de kilos del pedido considerando tipos de empaque estandarizados
  const totalKilosCalculo = useMemo(() => {
    return (
      productos.reduce((acc, p) => {
        const k = obtenerKilosItem(p);
        return acc + (k > 0 ? k : 0);
      }, 0) || 1
    );
  }, [productos, obtenerKilosItem]);

  const totalGastosCalculo = useMemo(() => {
    return gastos
      .filter((g) => g.aplicado !== false)
      .reduce((acc, g) => acc + (parseFloat(g.valor) || 0), 0);
  }, [gastos]);

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
    ejecutarRecalculo(updated, gastos, targetMargen);
    triggerAutoSave();
    setShowMargenModal(false);
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
    ejecutarRecalculo(updated, gastos, targetMargen);
    triggerAutoSave();
    setShowMargenModal(false);
  };

  // 1. Modificar Costo Compra por Kilo directamente (sin redondeo destructivo al teclear)
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
    ejecutarRecalculo(copy, gastos, utilidadGlobal);
    triggerAutoSave();
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
    ejecutarRecalculo(copy, gastos, utilidadGlobal);
    triggerAutoSave();
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
    ejecutarRecalculo(copy, gastos, utilidadGlobal);
    triggerAutoSave();
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
    ejecutarRecalculo(copy, gastos, utilidadGlobal);
    triggerAutoSave();
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
    ejecutarRecalculo(copy, gastos, utilidadGlobal);
    triggerAutoSave();
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
    ejecutarRecalculo(copy, gastos, utilidadGlobal);
    triggerAutoSave();
  };

  // 4. Aplicar cálculo desde el Asistente de Empaques/Bultos
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
    ejecutarRecalculo(copy, gastos, utilidadGlobal);
    triggerAutoSave();
  };

  const handlePorcentajeUtilChange = (idx, inputValue) => {
    const copy = [...productos];
    if (inputValue === "" || inputValue === null || inputValue === undefined) {
      copy[idx].porcentaje_utilidad = "";
    } else {
      copy[idx].porcentaje_utilidad = parseFloat(inputValue);
    }
    copy[idx].porcentaje_utilidad_manual = true;

    const itemActual = items[idx];
    const costoReal = itemActual?.costo_real_kilo || 0;
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
    ejecutarRecalculo(copy, gastos, utilidadGlobal);
    triggerAutoSave();
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
      ejecutarRecalculo(copy, gastos, utilidadGlobal);
      triggerAutoSave();
    }
  };

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
    ejecutarRecalculo(copy, gastos, utilidadGlobal);
    triggerAutoSave();
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
    ejecutarRecalculo(copy, gastos, utilidadGlobal);
    triggerAutoSave();
  };

  // 6. Modificar Total Venta ($) directamente
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
    ejecutarRecalculo(copy, gastos, utilidadGlobal);
    triggerAutoSave();
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
    ejecutarRecalculo(copy, gastos, utilidadGlobal);
    triggerAutoSave();
  };

  if (!canViewFinancial) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-slate-900 dark:text-white">
          Acceso Restringido
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          No cuenta con permisos para visualizar o modificar el módulo
          financiero y de liquidación. Contacte al administrador para solicitar
          acceso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Banner Prominente de Pedido Cerrado */}
      {isPedidoBloqueado && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex items-center gap-3 text-amber-900 shadow-xs animate-in fade-in">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-amber-950">
              🔒 PEDIDO CERRADO Y BLOQUEADO
            </h3>
            <p className="text-xs text-amber-800">
              Este pedido se encuentra cerrado. La liquidación, costos y
              márgenes se presentan en modo de solo lectura.
            </p>
          </div>
        </div>
      )}

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
            {canExport && (
              <>
                <button
                  type="button"
                  onClick={() => exportarDocumento("pdf", "informe")}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition"
                  title="Exportar informe de liquidación en PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-red-600" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportarDocumento("excel", "informe")}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition"
                  title="Exportar informe de liquidación en Excel"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 1. Resumen Financiero Consolidado */}
      <FinancialSummaryCards liquidacion={liquidacion} />

      {/* 2. Barra de Utilidad Global y Enlace a Medidas */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white block leading-tight">
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
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Configurar pesos de ponys, canastillas, bultos y cajas"
            >
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">
                Configurar Empaques & Medidas
              </span>
              <span className="sm:hidden">Empaques</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <input
              disabled={isInputsDisabled || !canModifyMargenes}
              type="number"
              inputMode="decimal"
              aria-label="Porcentaje de margen global"
              title="Presione Enter o haga clic fuera para actualizar el margen global"
              className="w-16 sm:w-20 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg py-1 px-2 text-center text-emerald-700 dark:text-emerald-400 font-black text-sm outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 tabular-nums transition shadow-2xs"
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
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
            No hay productos cargados en el pedido activo.
          </p>
        ) : tableViewMode === "cards" ? (
          /* VISTA DE TARJETAS (RESPONSIVA, SIN SCROLL HORIZONTAL) */
          <div className="p-3.5 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {items.map((p, idx) => {
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

              const masterProd = masterProductsMap.get(normalizeText(p.producto || p.nombre || ""));
              const posItemId = p.pos_item_id || masterProd?.pos_item_id || null;
              const precioPosActual =
                p.precio_pos_actual !== undefined && p.precio_pos_actual !== null && Number(p.precio_pos_actual) > 0
                  ? Number(p.precio_pos_actual)
                  : Number(masterProd?.precio_pos_actual || 0);

              return (
                <FinancialItemCard
                  key={p.id || idx}
                  p={p}
                  idx={idx}
                  empaque={empaque}
                  k={k}
                  libras={libras}
                  costoKiloBase={costoKiloBase}
                  costoEmpaqueBase={costoEmpaqueBase}
                  costoLibraBase={costoLibraBase}
                  gastoPorKilo={gastoPorKilo}
                  isInputsDisabled={isInputsDisabled}
                  valorCompraTotal={p.valor_compra_total}
                  utilidadGlobal={utilidadGlobal}
                  posItemId={posItemId}
                  precioPosActual={precioPosActual}
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

                const masterProd = masterProductsMap.get(normalizeText(p.producto || p.nombre || ""));
                const posItemId = p.pos_item_id || masterProd?.pos_item_id || null;
                const precioPosActual =
                  p.precio_pos_actual !== undefined && p.precio_pos_actual !== null && Number(p.precio_pos_actual) > 0
                    ? Number(p.precio_pos_actual)
                    : Number(masterProd?.precio_pos_actual || 0);

                return (
                  <FinancialItemCard
                    key={p.id || idx}
                    p={p}
                    idx={idx}
                    empaque={empaque}
                    k={k}
                    libras={libras}
                    costoKiloBase={costoKiloBase}
                    costoEmpaqueBase={costoEmpaqueBase}
                    costoLibraBase={costoLibraBase}
                    gastoPorKilo={gastoPorKilo}
                    isInputsDisabled={isInputsDisabled}
                    valorCompraTotal={p.valor_compra_total}
                    utilidadGlobal={utilidadGlobal}
                    posItemId={posItemId}
                    precioPosActual={precioPosActual}
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
            <div
              className="hidden md:block overflow-x-auto custom-scrollbar"
              tabIndex={0}
              role="region"
              aria-label="Tabla de liquidación de productos por kilo"
            >
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

                    const masterProd = masterProductsMap.get(normalizeText(p.producto || p.nombre || ""));
                    const posItemId = p.pos_item_id || masterProd?.pos_item_id || null;
                    const precioPosActual =
                      p.precio_pos_actual !== undefined && p.precio_pos_actual !== null && Number(p.precio_pos_actual) > 0
                        ? Number(p.precio_pos_actual)
                        : Number(masterProd?.precio_pos_actual || 0);

                    return (
                      <FinancialItemRow
                        key={p.id || idx}
                        p={p}
                        idx={idx}
                        empaque={empaque}
                        k={k}
                        libras={libras}
                        costoKiloBase={costoKiloBase}
                        costoEmpaqueBase={costoEmpaqueBase}
                        costoLibraBase={costoLibraBase}
                        gastoPorKilo={gastoPorKilo}
                        isInputsDisabled={isInputsDisabled}
                        valorCompraTotal={p.valor_compra_total}
                        utilidadGlobal={utilidadGlobal}
                        posItemId={posItemId}
                        precioPosActual={precioPosActual}
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
        isPedidoBloqueado={isInputsDisabled || !canManageGastos}
        ejecutarRecalculo={ejecutarRecalculo}
        triggerAutoSave={triggerAutoSave}
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
    </div>
  );
}
