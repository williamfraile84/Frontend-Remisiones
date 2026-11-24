import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { orderApi } from "../api/orderApi";
import { exportApi } from "../api/exportApi";
import { calcularLiquidacion } from "../utils/math";
import { downloadBlob } from "../utils/download";
import { parseTextOrder } from "../utils/textOrderParser";
import { useToast } from "../context/ToastContext";

export const DEFAULT_OBSERVACIONES =
  "Recibido a satisfacción por el responsable designado en el punto de entrega.";

export const CLIENTE_SURTIDO_INTERNO = {
  id: null,
  razon_social: "SURTIDO / INVENTARIO INTERNO",
  nit: "USO INTERNO",
  direccion: "SEDE PRINCIPAL",
  telefono: "-",
  email: "-",
  es_interno: true,
};

const DEFAULT_PROFIT_MARGIN =
  Number(import.meta.env.VITE_DEFAULT_PROFIT_MARGIN) || 30;
const AUTO_SAVE_DELAY_MS =
  Number(import.meta.env.VITE_AUTO_SAVE_DELAY_MS) || 600;

function readCachedOrderDraft() {
  try {
    const raw =
      localStorage.getItem("app_order_draft") ||
      localStorage.getItem("fruver_order_draft");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (_e) {
    // ignore parse error
  }
  return null;
}

export function useActiveOrder(
  clienteSeleccionado,
  clientes = [],
  onDetectarNuevoCliente,
  onSeleccionarCliente,
) {
  const { showToast } = useToast();

  // Leer borrador de LocalStorage una única vez para inicialización eficiente
  const [cachedDraft] = useState(() => readCachedOrderDraft() || {});

  // Metadatos y Estados de Bloqueo / Modo Temporal inicializados al instante con cachedDraft (0 ms)
  const [esTemporal, setEsTemporal] = useState(() =>
    Boolean(
      cachedDraft?.esTemporal || cachedDraft?.numeroRemision === "SURTIDO",
    ),
  );
  const [pedidoId, setPedidoId] = useState(() =>
    cachedDraft?.esTemporal ? null : cachedDraft?.pedidoId || null,
  );
  const [facturaCargada, setFacturaCargada] = useState(() =>
    Boolean(cachedDraft?.facturaCargada),
  );
  const [remisionFirmadaCargada, setRemisionFirmadaCargada] = useState(() =>
    Boolean(cachedDraft?.remisionFirmadaCargada),
  );
  const [remisionFirmadaNombre, setRemisionFirmadaNombre] = useState(
    () => cachedDraft?.remisionFirmadaNombre || null,
  );
  const [completado, setCompletado] = useState(() =>
    Boolean(cachedDraft?.completado),
  );
  const [numeroOC, setNumeroOC] = useState(
    () => cachedDraft?.numeroOC || (cachedDraft?.esTemporal ? "SURTIDO" : ""),
  );
  const [numeroRemision, setNumeroRemision] = useState(
    () =>
      cachedDraft?.numeroRemision ||
      (cachedDraft?.esTemporal ? "SURTIDO" : "1"),
  );
  const [fechaEntrega, setFechaEntrega] = useState(
    () => cachedDraft?.fechaEntrega || "",
  );
  const [numeroCanastas, setNumeroCanastas] = useState(
    () => cachedDraft?.numeroCanastas || "",
  );
  const [observaciones, setObservaciones] = useState(() =>
    cachedDraft?.observaciones !== undefined
      ? cachedDraft.observaciones || DEFAULT_OBSERVACIONES
      : DEFAULT_OBSERVACIONES,
  );

  // Estructuras de Ítems y Gastos
  const [productos, setProductos] = useState(() =>
    Array.isArray(cachedDraft?.productos) ? cachedDraft.productos : [],
  );
  const [gastos, setGastos] = useState(() =>
    Array.isArray(cachedDraft?.gastos) ? cachedDraft.gastos : [],
  );
  const [utilidadGlobal, setUtilidadGlobal] = useState(() =>
    cachedDraft?.utilidadGlobal !== undefined
      ? Math.round(cachedDraft.utilidadGlobal)
      : DEFAULT_PROFIT_MARGIN,
  );
  const liquidacion = useMemo(() => {
    if (productos && productos.length > 0) {
      return calcularLiquidacion(productos, gastos, utilidadGlobal);
    }
    return null;
  }, [productos, gastos, utilidadGlobal]);
  const [historialCliente, setHistorialCliente] = useState([]);

  // Estados de Operación, Guardado y Drag & Drop
  const [cargando, setCargando] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(() => {
    return cachedDraft?.esTemporal
      ? "local_draft"
      : cachedDraft?.pedidoId
        ? "saved"
        : cachedDraft && Object.keys(cachedDraft).length > 0
          ? "local_draft"
          : "idle";
  });
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState("Procesando...");
  const [draggedIndex, setDraggedIndex] = useState(null);

  const isPedidoBloqueado = useMemo(
    () => Boolean(facturaCargada || remisionFirmadaCargada || completado),
    [facturaCargada, remisionFirmadaCargada, completado],
  );

  const isSavingRef = useRef(false);
  const saveQueueRef = useRef(false);
  const debounceTimer = useRef(null);

  // Ref que mantiene el estado actual sincronizado para evitar cierres obsoletos en autoguardado
  const orderStateRef = useRef({});

  // TIER 1: Autoguardado optimizado con amortiguación (Debounce 150ms) en memoria local (LocalStorage)
  const localDraftTimerRef = useRef(null);
  useEffect(() => {
    orderStateRef.current = {
      esTemporal,
      pedidoId,
      clienteSeleccionado,
      numeroOC,
      numeroRemision,
      fechaEntrega,
      numeroCanastas,
      observaciones,
      productos,
      gastos,
      utilidadGlobal,
      liquidacion,
      completado,
      isPedidoBloqueado,
    };
    if (isPedidoBloqueado) return;
    const currentClientId = clienteSeleccionado?.id || null;
    const hasContent =
      esTemporal ||
      (productos && productos.length > 0) ||
      Boolean(numeroOC) ||
      Boolean(fechaEntrega) ||
      Boolean(numeroCanastas) ||
      Boolean(observaciones) ||
      Boolean(pedidoId) ||
      Boolean(currentClientId);

    if (localDraftTimerRef.current) {
      clearTimeout(localDraftTimerRef.current);
    }

    if (hasContent) {
      localDraftTimerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(
            "app_order_draft",
            JSON.stringify({
              esTemporal,
              pedidoId: esTemporal ? null : pedidoId,
              clienteId: currentClientId || null,
              numeroOC,
              numeroRemision,
              fechaEntrega,
              numeroCanastas,
              observaciones,
              productos,
              gastos,
              utilidadGlobal,
              liquidacion,
              facturaCargada,
              remisionFirmadaCargada,
              remisionFirmadaNombre,
              completado,
              updatedAt: new Date().toISOString(),
            }),
          );
        } catch {
          // ignore storage quota errors
        }
      }, 150);
    }

    return () => {
      if (localDraftTimerRef.current) {
        clearTimeout(localDraftTimerRef.current);
      }
    };
  }, [
    esTemporal,
    pedidoId,
    clienteSeleccionado,
    numeroOC,
    numeroRemision,
    fechaEntrega,
    numeroCanastas,
    observaciones,
    productos,
    gastos,
    utilidadGlobal,
    liquidacion,
    facturaCargada,
    remisionFirmadaCargada,
    remisionFirmadaNombre,
    completado,
    isPedidoBloqueado,
  ]);

  const cargarHistorial = useCallback(async (clienteId) => {
    if (!clienteId) return;
    try {
      const data = await orderApi.getHistoryByClient(clienteId);
      setHistorialCliente(data);
      try {
        localStorage.setItem(
          `app_history_cache_${clienteId}`,
          JSON.stringify(data),
        );
      } catch (e) {
        // ignore
      }
    } catch (err) {
      // Fallback offline: cargar historial guardado en caché para este cliente
      try {
        const cached = localStorage.getItem(`app_history_cache_${clienteId}`);
        if (cached) {
          setHistorialCliente(JSON.parse(cached));
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const ejecutarRecalculo = useCallback(
    (prods = productos, gsts = gastos, util = utilidadGlobal) => {
      return calcularLiquidacion(prods, gsts, util);
    },
    [productos, gastos, utilidadGlobal],
  );

  const guardarPedidoRef = useRef(null);

  // TIER 2: Autoguardado en backend con Mutex anti-duplicados y reintento
  const guardarPedido = useCallback(async () => {
    const state = orderStateRef.current;
    if (state.isPedidoBloqueado) return;

    const hasCustomObs =
      Boolean(state.observaciones) &&
      state.observaciones.trim() !== DEFAULT_OBSERVACIONES.trim();
    const hasData =
      (state.productos && state.productos.length > 0) ||
      (Boolean(state.numeroOC) && state.numeroOC !== "SURTIDO") ||
      hasCustomObs;
    if (!hasData) return;

    // Los pedidos temporales de surtido se protegen solo en LocalStorage (sin servidor)
    if (state.esTemporal) {
      setSaveStatus("local_draft");
      return;
    }

    if (!state.clienteSeleccionado) {
      setSaveStatus("local_draft");
      return;
    }

    // Si ya hay un guardado en vuelo, marcar la cola y esperar para no enviar id: null duplicado
    if (isSavingRef.current) {
      saveQueueRef.current = true;
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const liq = calcularLiquidacion(
        state.productos,
        state.gastos,
        state.utilidadGlobal,
      );
      const payload = {
        id: state.pedidoId,
        cliente_id: state.clienteSeleccionado.id,
        numero_oc: state.numeroOC,
        numero_remision: state.numeroRemision,
        fecha_entrega: state.fechaEntrega,
        numero_canastas: state.numeroCanastas,
        observaciones: state.observaciones,
        productos: state.productos,
        gastos: state.gastos,
        utilidad_global: state.utilidadGlobal,
        liquidacion: liq,
      };

      const guardado = await orderApi.saveOrder(payload);

      // Sincronizar ID inmediatamente en la referencia para llamadas subsecuentes
      orderStateRef.current.pedidoId = guardado.id;
      setPedidoId(guardado.id);
      setLastSavedAt(new Date());
      setSaveStatus("saved");

      // Actualizar borrador en localStorage con el ID asignado para persistencia tras recargas
      try {
        localStorage.setItem(
          "app_order_draft",
          JSON.stringify({
            pedidoId: guardado.id,
            clienteId: state.clienteSeleccionado?.id || null,
            numeroOC: state.numeroOC,
            numeroRemision: state.numeroRemision,
            fechaEntrega: state.fechaEntrega,
            numeroCanastas: state.numeroCanastas,
            observaciones: state.observaciones,
            productos: state.productos,
            gastos: state.gastos,
            utilidadGlobal: state.utilidadGlobal,
            liquidacion: liq,
            updatedAt: new Date().toISOString(),
          }),
        );
      } catch {
        // ignore
      }
      cargarHistorial(state.clienteSeleccionado.id);
    } catch (err) {
      console.warn(
        "Fallo temporal al autoguardar en backend; borrador protegido localmente:",
        err,
      );
      setSaveStatus("local_draft");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);

      // Si entraron cambios mientras se guardaba, ejecutar el siguiente ciclo de autoguardado
      if (saveQueueRef.current) {
        saveQueueRef.current = false;
        guardarPedidoRef.current?.();
      }
    }
  }, [cargarHistorial]);

  useEffect(() => {
    guardarPedidoRef.current = guardarPedido;
  });

  const triggerAutoSave = useCallback(() => {
    if (orderStateRef.current.isPedidoBloqueado) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      guardarPedido();
    }, AUTO_SAVE_DELAY_MS);
  }, [guardarPedido]);

  // Sincronizar consecutivo, historial y persistencia cuando cambie el cliente activo
  useEffect(() => {
    // Si estamos en modo surtido / inventario interno, nunca sobreescribir número de remisión
    if (esTemporal || numeroRemision === "SURTIDO") return;

    if (clienteSeleccionado) {
      Promise.resolve().then(() => {
        cargarHistorial(clienteSeleccionado.id);
        if (!pedidoId) {
          setNumeroRemision(
            clienteSeleccionado.consecutivo_remision_actual?.toString() || "1",
          );
        }
        // Solo disparar autoguardado si realmente hay productos cargados en el formulario
        const hasRealContent = productos && productos.length > 0;
        if (hasRealContent && !pedidoId && !isPedidoBloqueado) {
          triggerAutoSave();
        }
      });
    } else {
      Promise.resolve().then(() => {
        setHistorialCliente([]);
        if (!pedidoId) {
          setNumeroRemision("1");
        }
      });
    }
  }, [
    clienteSeleccionado,
    cargarHistorial,
    pedidoId,
    esTemporal,
    numeroRemision,
    isPedidoBloqueado,
    productos,
    triggerAutoSave,
  ]);

  const nuevoPedidoEnBlanco = useCallback(
    (cliente = clienteSeleccionado) => {
      try {
        localStorage.removeItem("app_order_draft");
        localStorage.removeItem("fruver_order_draft");
        if (!cliente) {
          localStorage.removeItem("app_active_client_id");
          if (onSeleccionarCliente) onSeleccionarCliente(null);
        }
      } catch {
        // ignore
      }
      setEsTemporal(false);
      setPedidoId(null);
      setFacturaCargada(false);
      setRemisionFirmadaCargada(false);
      setRemisionFirmadaNombre(null);
      setCompletado(false);
      setNumeroOC("");
      setNumeroRemision(
        cliente ? cliente.consecutivo_remision_actual?.toString() || "1" : "1",
      );
      setFechaEntrega("");
      setNumeroCanastas("");
      setObservaciones(DEFAULT_OBSERVACIONES);
      setProductos([]);
      setGastos([]);
      setUtilidadGlobal(DEFAULT_PROFIT_MARGIN);
      setSaveStatus("idle");
      showToast("Formulario listo para nuevo pedido.");
    },
    [clienteSeleccionado, onSeleccionarCliente, showToast],
  );

  const cargarDesdeHistorial = useCallback(
    async (p) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      setEsTemporal(false);
      setPedidoId(p.id);
      orderStateRef.current.pedidoId = p.id;

      // Intentar obtener el detalle completo fresco desde el servidor
      let fullOrder = p;
      try {
        const remote = await orderApi.getOrderById(p.id);
        if (remote && remote.id) {
          fullOrder = remote;
        }
      } catch (err) {
        console.warn("Usando datos locales de historial:", err);
      }

      setFacturaCargada(Boolean(fullOrder.factura_cargada));
      setRemisionFirmadaCargada(Boolean(fullOrder.remision_firmada_cargada));
      setRemisionFirmadaNombre(fullOrder.remision_firmada_nombre || null);
      setCompletado(Boolean(fullOrder.completado));
      setNumeroOC(fullOrder.numero_oc || "");
      setNumeroRemision(fullOrder.numero_remision || "1");
      setFechaEntrega(fullOrder.fecha_entrega || "");
      setNumeroCanastas(fullOrder.numero_canastas || "");
      setObservaciones(fullOrder.observaciones || DEFAULT_OBSERVACIONES);
      setProductos(fullOrder.productos || []);
      setGastos(fullOrder.gastos || []);
      setUtilidadGlobal(fullOrder.utilidad_global ?? DEFAULT_PROFIT_MARGIN);

      orderStateRef.current = {
        ...orderStateRef.current,
        esTemporal: false,
        pedidoId: fullOrder.id,
        numeroOC: fullOrder.numero_oc || "",
        numeroRemision: fullOrder.numero_remision || "1",
        fechaEntrega: fullOrder.fecha_entrega || "",
        numeroCanastas: fullOrder.numero_canastas || "",
        observaciones: fullOrder.observaciones || DEFAULT_OBSERVACIONES,
        productos: fullOrder.productos || [],
        gastos: fullOrder.gastos || [],
        utilidadGlobal: fullOrder.utilidad_global ?? DEFAULT_PROFIT_MARGIN,
        liquidacion: fullOrder.liquidacion || null,
        completado: Boolean(fullOrder.completado),
      };

      showToast(`Pedido #${fullOrder.numero_remision} cargado.`);
    },
    [showToast],
  );

  const cargarPedidoTemporalDesdeTexto = useCallback(
    (rawText) => {
      const prods = parseTextOrder(rawText, utilidadGlobal);
      if (!prods || prods.length === 0) {
        showToast(
          "No se detectaron productos válidos en el texto ingresado.",
          "error",
        );
        return false;
      }
      if (onSeleccionarCliente) {
        onSeleccionarCliente(null);
      }
      try {
        localStorage.removeItem("app_active_client_id");
      } catch {
        // ignore
      }
      setEsTemporal(true);
      setPedidoId(null);
      setFacturaCargada(false);
      setRemisionFirmadaCargada(false);
      setRemisionFirmadaNombre(null);
      setCompletado(false);
      setNumeroOC("SURTIDO");
      setNumeroRemision("SURTIDO");
      setFechaEntrega(new Date().toISOString().split("T")[0]);
      setNumeroCanastas("");
      setObservaciones(
        "Pedido de surtido interno para cálculo de precios e inventario.",
      );
      setProductos(prods);
      setGastos([]);
      ejecutarRecalculo(prods, [], utilidadGlobal);
      setSaveStatus("local_draft");
      showToast(`Cargados ${prods.length} productos para surtido temporal.`);
      return true;
    },
    [utilidadGlobal, ejecutarRecalculo, showToast, onSeleccionarCliente],
  );

  const eliminarPedido = useCallback(
    async (id) => {
      const target = historialCliente.find((p) => p.id === id);
      if (
        (target &&
          (target.factura_cargada ||
            target.remision_firmada_cargada ||
            target.completado)) ||
        (orderStateRef.current.pedidoId === id &&
          orderStateRef.current.isPedidoBloqueado)
      ) {
        showToast(
          "No es posible dar de baja un pedido cerrado, facturado o con remisión firmada.",
          "error",
        );
        return;
      }

      if (
        !window.confirm(
          "¿Seguro que desea desactivar este pedido (baja lógica)?",
        )
      ) {
        return;
      }
      try {
        const res = await orderApi.softDeleteOrder(id);
        showToast(res?.message || "Pedido desactivado correctamente.");
        if (orderStateRef.current.pedidoId === id) {
          nuevoPedidoEnBlanco();
        }
        if (clienteSeleccionado) {
          cargarHistorial(clienteSeleccionado.id);
        }
      } catch (err) {
        const msg =
          err.response?.data?.detail || "Error al desactivar el pedido.";
        showToast(msg, "error");
      }
    },
    [
      clienteSeleccionado,
      cargarHistorial,
      nuevoPedidoEnBlanco,
      showToast,
      historialCliente,
    ],
  );

  const handleUploadDocumento = useCallback(
    async (file) => {
      if (!file) return;
      setLoadingMsg("Analizando Documento...");
      setCargando(true);
      try {
        const progressTimer = setTimeout(() => {
          setLoadingMsg(
            "Extrayendo cliente, productos, unidades y cantidades automáticamente...",
          );
        }, 350);

        const res = await orderApi.uploadDocument(file);
        clearTimeout(progressTimer);
        const d = res.datos;
        setNumeroOC(d.numero_oc || "");
        setFechaEntrega(d.fecha_entrega || d.fecha || "");
        setObservaciones(d.observaciones || "");
        const prods = (d.productos || []).map((p, idx) => ({
          id: idx + 1,
          producto: (p.producto || "").toUpperCase(),
          cantidad: p.cantidad,
          unidad: p.unidad || "Kg",
          descripcion: p.descripcion || "",
          kilos: p.kilos || p.cantidad,
          valor_compra_total: 0,
          porcentaje_utilidad: utilidadGlobal,
        }));

        setProductos(prods);
        setGastos([]);
        setEsTemporal(false);
        setPedidoId(null);
        setFacturaCargada(false);
        setRemisionFirmadaCargada(false);
        setRemisionFirmadaNombre(null);
        setCompletado(false);
        ejecutarRecalculo(prods, [], utilidadGlobal);

        // Algoritmo de reconocimiento de cliente
        const rawNit = d.cliente?.nit || "";
        const cleanedRS = (d.cliente?.razon_social || "").trim();
        const docNitDigits = rawNit.replace(/\D/g, "");

        let clienteEncontrado = null;
        if (docNitDigits || cleanedRS) {
          clienteEncontrado = clientes.find((c) => {
            const cNit = (c.nit || "").replace(/\D/g, "");
            const cRS = (c.razon_social || "").trim().toLowerCase();
            return (
              (docNitDigits && cNit && docNitDigits === cNit) ||
              (cleanedRS && cRS && cleanedRS.toLowerCase().includes(cRS))
            );
          });
        }

        if (clienteEncontrado) {
          showToast(`Cliente detectado: ${clienteEncontrado.razon_social}`);
          if (onSeleccionarCliente) {
            onSeleccionarCliente(clienteEncontrado);
          }
        } else if (cleanedRS || rawNit) {
          if (onDetectarNuevoCliente) {
            onDetectarNuevoCliente({
              ...d.cliente,
              razon_social: cleanedRS,
              nit: rawNit,
            });
          }
        } else {
          showToast("Documento procesado correctamente.");
        }

        // Disparar autoguardado tras poblar datos
        setTimeout(() => {
          triggerAutoSave();
        }, 150);
      } catch {
        showToast("Error analizando documento. Verifique el formato.", "error");
      } finally {
        setCargando(false);
      }
    },
    [
      clientes,
      utilidadGlobal,
      ejecutarRecalculo,
      onDetectarNuevoCliente,
      onSeleccionarCliente,
      triggerAutoSave,
      showToast,
    ],
  );

  const handleSubirArchivoCierre = useCallback(
    async (id, tipo, file) => {
      if (!file) return;
      const targetId = id || pedidoId;
      if (!targetId) {
        showToast(
          "Guarde el pedido antes de adjuntar soportes de cierre.",
          "error",
        );
        return;
      }

      setLoadingMsg(
        tipo === "factura"
          ? "Cargando factura..."
          : "Cargando remisión firmada...",
      );
      setCargando(true);

      try {
        const res = await orderApi.uploadClosureFile(targetId, tipo, file);
        showToast(
          `${tipo === "factura" ? "Factura" : "Remisión firmada"} cargada con éxito.`,
        );

        // Si el archivo subido corresponde al pedido activo en pantalla
        if (targetId === orderStateRef.current.pedidoId) {
          if (tipo === "factura") {
            setFacturaCargada(true);
          }
          if (tipo === "remision-firmada") {
            setRemisionFirmadaCargada(true);
            setRemisionFirmadaNombre(res.nombre || file.name);
          }
        }

        // Actualizar el historial del cliente sin reiniciar los campos activos
        if (clienteSeleccionado) {
          cargarHistorial(clienteSeleccionado.id);
        }
      } catch (err) {
        const msg =
          err.response?.data?.detail || "Error al subir archivo de cierre.";
        showToast(msg, "error");
      } finally {
        setCargando(false);
      }
    },
    [clienteSeleccionado, pedidoId, cargarHistorial, showToast],
  );

  const exportarDocumento = useCallback(
    async (tipo, documento = "remision") => {
      const isSurtido = Boolean(
        esTemporal || numeroRemision === "SURTIDO" || !clienteSeleccionado,
      );
      if (!clienteSeleccionado && !isSurtido) {
        showToast("Seleccione un cliente para exportar.", "error");
        return;
      }
      const liq =
        liquidacion || calcularLiquidacion(productos, gastos, utilidadGlobal);
      const payload = {
        cliente_id: clienteSeleccionado?.id || null,
        numero_remision: numeroRemision || (isSurtido ? "SURTIDO" : "1"),
        numero_oc: numeroOC || (isSurtido ? "SURTIDO" : "S/N"),
        fecha_entrega: fechaEntrega || new Date().toISOString().split("T")[0],
        numero_canastas: numeroCanastas || "",
        observaciones: observaciones || "",
        productos: liq?.items || productos,
        gastos,
        utilidad_global: utilidadGlobal,
        liquidacion: liq,
      };
      try {
        let blob;
        let filename = `${documento}_${numeroRemision || (isSurtido ? "SURTIDO" : "1")}`;
        if (documento === "remision") {
          if (tipo === "pdf") {
            blob = await exportApi.exportPdfRemision(payload);
            filename += ".pdf";
          } else {
            blob = await exportApi.exportExcelRemision(payload);
            filename += ".xlsx";
          }
        } else {
          if (tipo === "pdf") {
            blob = await exportApi.exportPdfInforme(payload);
            filename += "_informe.pdf";
          } else {
            blob = await exportApi.exportExcelInforme(payload);
            filename += "_informe.xlsx";
          }
        }
        downloadBlob(blob, filename);
        showToast(`Documento ${filename} generado.`);
      } catch (err) {
        console.error("Error generando exportación:", err);
        showToast("Error generando exportación.", "error");
      }
    },
    [
      clienteSeleccionado,
      esTemporal,
      numeroRemision,
      numeroOC,
      fechaEntrega,
      numeroCanastas,
      observaciones,
      liquidacion,
      productos,
      gastos,
      utilidadGlobal,
      showToast,
    ],
  );

  // Drag & drop handlers
  const handleDragStart = useCallback(
    (index) => {
      if (isPedidoBloqueado) return;
      setDraggedIndex(index);
    },
    [isPedidoBloqueado],
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (index) => {
      if (isPedidoBloqueado || draggedIndex === null || draggedIndex === index)
        return;
      const reordered = [...productos];
      const [movedItem] = reordered.splice(draggedIndex, 1);
      reordered.splice(index, 0, movedItem);
      const updated = reordered.map((item, idx) => ({ ...item, id: idx + 1 }));
      setProductos(updated);
      setDraggedIndex(null);
      ejecutarRecalculo(updated, gastos, utilidadGlobal);
      triggerAutoSave();
    },
    [
      draggedIndex,
      isPedidoBloqueado,
      productos,
      gastos,
      utilidadGlobal,
      ejecutarRecalculo,
      triggerAutoSave,
    ],
  );

  return {
    // Estados
    esTemporal,
    setEsTemporal,
    pedidoId,
    facturaCargada,
    remisionFirmadaCargada,
    remisionFirmadaNombre,
    completado,
    setCompletado,
    numeroOC,
    setNumeroOC,
    numeroRemision,
    setNumeroRemision,
    fechaEntrega,
    setFechaEntrega,
    numeroCanastas,
    setNumeroCanastas,
    observaciones,
    setObservaciones,
    productos,
    setProductos,
    gastos,
    setGastos,
    utilidadGlobal,
    setUtilidadGlobal,
    liquidacion,
    historialCliente,
    cargando,
    isSaving,
    saveStatus,
    lastSavedAt,
    loadingMsg,
    isPedidoBloqueado,
    draggedIndex,

    // Operaciones
    triggerAutoSave,
    ejecutarRecalculo,
    guardarPedido,
    nuevoPedidoEnBlanco,
    cargarDesdeHistorial,
    cargarPedidoTemporalDesdeTexto,
    eliminarPedido,
    handleUploadDocumento,
    handleSubirArchivoCierre,
    exportarDocumento,
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
}
