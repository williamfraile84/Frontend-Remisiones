import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CheckSquare,
  Square,
  Copy,
  Check,
  X,
  Search,
  CheckCircle2,
  Clock,
  RotateCcw,
  MessageSquare,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

/**
 * Quick tag presets for faster mobile / desktop data entry per product
 */
const QUICK_TAGS = [
  "Incompleto / Faltó peso",
  "Calidad regular / Averiado",
  "Muy maduro",
  "No llegó en pedido",
  "Excelente calidad",
];

/**
 * Modal Ergonómico y Responsive de Checklist de Recepción & Faltantes (Modo Surtido / Pedidos)
 *
 * Características:
 * 1. Campo de observación individual DIRECTO para cada producto, con tags rápidos de un toque.
 * 2. Distribución optimizada y responsive: cuadrícula de 2 columnas en desktop y tarjetas táctiles en mobile.
 * 3. Cabecera y métricas ultra-compactas para maximizar el área visible de la lista de productos (hasta 85% del modal).
 * 4. Clara distinción visual entre ítems Recibidos (Verde) vs Pendientes (Ámbar/Rojo).
 * 5. Filtros por Todos, Pendientes, Recibidos y "Con Observación".
 * 6. Copiado profesional para WhatsApp formateando cada producto y su novedad puntual.
 * 7. Persistencia automática en localStorage sin afectar cálculos ni datos del servidor.
 */
export default function SurtidoChecklistModal({
  isOpen,
  onClose,
  productos = [],
  esTemporal = false,
  numeroRemision = "SURTIDO",
}) {
  const { showToast } = useToast();

  // Clave de almacenamiento local aislada por contexto
  const storageKey = useMemo(() => {
    const suffix = esTemporal ? "surtido" : numeroRemision || "general";
    return `fruver_checklist_v2_${suffix}`;
  }, [esTemporal, numeroRemision]);

  // Estados del checklist
  const [checkedMap, setCheckedMap] = useState({});
  const [itemNotes, setItemNotes] = useState({});
  const [generalNotes, setGeneralNotes] = useState("");
  const [filterMode, setFilterMode] = useState("todos"); // "todos" | "pendientes" | "completos" | "con_novedad"
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedRecently, setCopiedRecently] = useState(false);
  const [showGeneralNotes, setShowGeneralNotes] = useState(false);

  // Cargar estado persistente al abrir o cambiar de remisión
  const [prevStorageKey, setPrevStorageKey] = useState(null);
  if (isOpen && storageKey !== prevStorageKey) {
    setPrevStorageKey(storageKey);
    try {
      const savedRaw = localStorage.getItem(storageKey);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed && typeof parsed === "object") {
          setCheckedMap(parsed.checkedMap || {});
          setItemNotes(parsed.itemNotes || {});
          setGeneralNotes(parsed.generalNotes || "");
          if (parsed.generalNotes && parsed.generalNotes.trim()) {
            setShowGeneralNotes(true);
          }
        }
      }
    } catch (_e) {
      // Ignorar error de parseo local
    }
  }

  // Guardar en localStorage de forma automática
  useEffect(() => {
    if (!isOpen) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          checkedMap,
          itemNotes,
          generalNotes,
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch (_e) {
      // Ignorar límite de almacenamiento
    }
  }, [isOpen, storageKey, checkedMap, itemNotes, generalNotes]);

  // Identificador estable para cada ítem
  const getItemKey = useCallback((prod, index) => {
    if (!prod) return `item_${index}`;
    return prod.id || `${prod.producto || "prod"}_${prod.unidad || "u"}_${index}`;
  }, []);

  // Lista normalizada de productos con su estado reactivo
  const itemsConEstado = useMemo(() => {
    return productos.map((prod, index) => {
      const key = getItemKey(prod, index);
      const isChecked = Boolean(checkedMap[key]);
      const note = itemNotes[key] || "";
      const nombre = prod.producto || `Producto #${index + 1}`;
      const cantidad = prod.cantidad ?? "-";
      const unidad = prod.unidad || "Kg";
      return {
        key,
        index,
        original: prod,
        nombre,
        cantidad,
        unidad,
        isChecked,
        note,
      };
    });
  }, [productos, checkedMap, itemNotes, getItemKey]);

  // Métricas
  const totalItems = itemsConEstado.length;
  const completadosCount = itemsConEstado.filter((i) => i.isChecked).length;
  const pendientesCount = totalItems - completadosCount;
  const conNovedadCount = itemsConEstado.filter((i) => Boolean(i.note && i.note.trim())).length;
  const porcentaje = totalItems > 0 ? Math.round((completadosCount / totalItems) * 100) : 0;

  // Filtrado reactivo por pestañas y búsqueda
  const itemsFiltrados = useMemo(() => {
    return itemsConEstado.filter((item) => {
      // Filtro por pestaña
      if (filterMode === "pendientes" && item.isChecked) return false;
      if (filterMode === "completos" && !item.isChecked) return false;
      if (filterMode === "con_novedad" && !item.note.trim()) return false;

      // Filtro por texto de búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.nombre.toLowerCase().includes(query);
        const matchUnit = item.unidad.toLowerCase().includes(query);
        const matchNote = item.note.toLowerCase().includes(query);
        if (!matchName && !matchUnit && !matchNote) return false;
      }

      return true;
    });
  }, [itemsConEstado, filterMode, searchQuery]);

  // Alternar recibido/pendiente
  const toggleItem = useCallback((key) => {
    setCheckedMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  // Modificar observación de un ítem puntual
  const setItemNote = useCallback((key, noteText) => {
    setItemNotes((prev) => {
      const copy = { ...prev };
      if (!noteText || !noteText.trim()) {
        delete copy[key];
      } else {
        copy[key] = noteText;
      }
      return copy;
    });
  }, []);

  // Agregar tag rápido a la observación del producto
  const addQuickTagToItem = useCallback((key, tag) => {
    setItemNotes((prev) => {
      const current = prev[key] || "";
      if (!current.trim()) return { ...prev, [key]: tag };
      if (current.includes(tag)) return prev; // ya lo tiene
      return { ...prev, [key]: `${current} - ${tag}` };
    });
  }, []);

  // Acciones masivas
  const marcarTodos = () => {
    const next = {};
    itemsConEstado.forEach((item) => {
      next[item.key] = true;
    });
    setCheckedMap(next);
    showToast("Todos los productos marcados como recibidos.");
  };

  const desmarcarTodos = () => {
    setCheckedMap({});
    showToast("Todos los productos marcados como pendientes.");
  };

  const reiniciarChecklist = () => {
    if (window.confirm("¿Desea reiniciar todo el checklist y borrar todas las observaciones de los productos?")) {
      setCheckedMap({});
      setItemNotes({});
      setGeneralNotes("");
      try {
        localStorage.removeItem(storageKey);
      } catch (_e) {
        // Ignorar fallo de almacenamiento local
      }
      showToast("Checklist reiniciado a estado inicial.");
    }
  };

  // Formatear y Copiar reporte para WhatsApp
  const copiarReporte = async () => {
    if (totalItems === 0) {
      showToast("No hay productos cargados en el pedido para copiar.", "warning");
      return;
    }

    const fechaStr = new Date().toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    });

    const completos = itemsConEstado.filter((i) => i.isChecked);
    const pendientes = itemsConEstado.filter((i) => !i.isChecked);

    let texto = `📋 *REPORTE DE RECEPCIÓN / CHECKLIST DE SURTIDO*\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `📅 *Fecha:* ${fechaStr}\n`;
    texto += `📦 *Tipo:* ${esTemporal ? "Modo Surtido / Inventario Interno" : `Pedido / Remisión #${numeroRemision}`}\n`;
    texto += `📊 *Resumen:* ${completadosCount}/${totalItems} Recibidos (${porcentaje}%) | ${pendientesCount} Pendientes\n\n`;

    if (pendientes.length > 0) {
      texto += `⏳ *PENDIENTES / FALTANTES (${pendientes.length}):*\n`;
      pendientes.forEach((item, idx) => {
        texto += `${idx + 1}. ✗ *${item.nombre}* (${item.cantidad} ${item.unidad})\n`;
        if (item.note && item.note.trim()) {
          texto += `   └ ⚠️ *Obs:* ${item.note.trim()}\n`;
        }
      });
      texto += `\n`;
    } else {
      texto += `🎉 *¡TODOS LOS PRODUCTOS LLEGARON COMPLETOS!*\n\n`;
    }

    if (completos.length > 0) {
      texto += `✅ *RECIBIDOS COMPLETOS (${completos.length}):*\n`;
      completos.forEach((item, idx) => {
        texto += `${idx + 1}. ✓ *${item.nombre}* (${item.cantidad} ${item.unidad})\n`;
        if (item.note && item.note.trim()) {
          texto += `   └ 📝 *Obs:* ${item.note.trim()}\n`;
        }
      });
      texto += `\n`;
    }

    if (generalNotes.trim()) {
      texto += `📝 *OBSERVACIÓN GENERAL DEL PEDIDO:*\n${generalNotes.trim()}\n\n`;
    }

    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `_Reporte generado desde Sistema Fruver_`;

    try {
      await navigator.clipboard.writeText(texto);
      setCopiedRecently(true);
      showToast("¡Reporte con observaciones individuales copiado al portapapeles!");
      setTimeout(() => setCopiedRecently(false), 2500);
    } catch (_err) {
      showToast("No se pudo copiar automáticamente. Por favor inténtelo de nuevo.", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[95vh] sm:h-[90vh] overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-200">

        {/* ====================================================================
            1. CABECERA COMPACTA Y ERGONÓMICA
            ==================================================================== */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
              <PackageCheck className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-wider bg-black/25 px-2 py-0.5 rounded-md text-teal-200">
                  {esTemporal ? "Modo Surtido" : `Remisión #${numeroRemision}`}
                </span>
                <span className="text-xs font-bold text-teal-100 hidden sm:inline">
                  Verificación de Recepción & Faltantes
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black truncate leading-tight">
                Checklist de Productos
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Botón Copiar Reporte */}
            <button
              type="button"
              onClick={copiarReporte}
              disabled={totalItems === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-xs disabled:opacity-50 ${
                copiedRecently
                  ? "bg-white text-emerald-800"
                  : "bg-white/90 hover:bg-white text-teal-950 active:scale-95"
              }`}
              title="Copiar reporte detallado con observaciones a WhatsApp"
            >
              {copiedRecently ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="hidden xs:inline">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-teal-700" />
                  <span className="hidden xs:inline">Copiar Reporte</span>
                  <span className="xs:hidden">Copiar</span>
                </>
              )}
            </button>

            {/* Cerrar modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ====================================================================
            2. BARRA DE MÉTRICAS COMPACTA Y PROGRESO (MINIMALISTA)
            ==================================================================== */}
        <div className="px-3 sm:px-6 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 shrink-0 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Métricas rápidas */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="font-bold text-slate-500 dark:text-slate-400">
              Total: <strong className="text-slate-800 dark:text-slate-100 tabular-nums">{totalItems}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 inline" />
              Recibidos: <strong className="tabular-nums">{completadosCount}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className={`font-bold flex items-center gap-1 ${
              pendientesCount > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-400"
            }`}>
              <Clock className="w-3.5 h-3.5 inline" />
              Pendientes: <strong className="tabular-nums">{pendientesCount}</strong>
            </span>
            {conNovedadCount > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 inline" />
                  Con Obs: <strong className="tabular-nums">{conNovedadCount}</strong>
                </span>
              </>
            )}
          </div>

          {/* Barra de progreso visual compacta */}
          <div className="flex items-center gap-2 w-full xs:w-auto flex-1 xs:max-w-xs justify-end">
            <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 tabular-nums">
              {porcentaje}%
            </span>
            <div className="w-24 sm:w-36 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  porcentaje === 100
                    ? "bg-emerald-500"
                    : porcentaje > 50
                      ? "bg-teal-500"
                      : "bg-amber-500"
                }`}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>
        </div>

        {/* ====================================================================
            3. BARRA DE CONTROL: FILTROS, BÚSQUEDA Y ACCIONES MASIVAS
            ==================================================================== */}
        <div className="px-3 sm:px-6 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2">
          {/* Pestañas de Filtro */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilterMode("todos")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterMode === "todos"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Todos ({totalItems})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("pendientes")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                filterMode === "pendientes"
                  ? "bg-amber-500 text-white shadow-2xs font-black"
                  : "text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              }`}
            >
              <span>⏳ Pendientes ({pendientesCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("completos")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                filterMode === "completos"
                  ? "bg-emerald-600 text-white shadow-2xs font-black"
                  : "text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              }`}
            >
              <span>✅ Recibidos ({completadosCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("con_novedad")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                filterMode === "con_novedad"
                  ? "bg-indigo-600 text-white shadow-2xs font-black"
                  : "text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              }`}
            >
              <span>📝 Con Obs ({conNovedadCount})</span>
            </button>
          </div>

          {/* Buscador + Acciones Masivas */}
          <div className="flex items-center gap-2 justify-between md:justify-end">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar producto u observación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-7 py-1 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={marcarTodos}
                className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                title="Marcar todos como recibidos"
              >
                <Check className="w-3 h-3" />
                <span className="hidden sm:inline">Todos</span>
              </button>

              <button
                type="button"
                onClick={desmarcarTodos}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                title="Marcar todos como pendientes"
              >
                <Square className="w-3 h-3" />
                <span className="hidden sm:inline">Ninguno</span>
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================================
            4. LISTADO PRINCIPAL DE PRODUCTOS (ESPACIOSO Y RESPONSIVE)
            ==================================================================== */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar bg-slate-100/60 dark:bg-slate-950/40">
          {itemsFiltrados.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500 space-y-2">
              <CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
              <p className="text-sm font-bold">
                {totalItems === 0
                  ? "No hay productos en el pedido actual. Cargue un pedido para verificar su llegada."
                  : searchQuery
                    ? `No se encontraron productos que coincidan con "${searchQuery}".`
                    : filterMode === "pendientes"
                      ? "¡Excelente! No hay productos pendientes, todo el pedido fue recibido."
                      : filterMode === "con_novedad"
                        ? "No hay productos con observaciones o novedades registradas."
                        : "No hay productos en esta vista."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {itemsFiltrados.map((item) => {
                const isChecked = item.isChecked;
                const hasNote = Boolean(item.note && item.note.trim());

                return (
                  <div
                    key={item.key}
                    className={`rounded-2xl border p-3 sm:p-4 flex flex-col justify-between gap-2.5 transition-all duration-150 ${
                      isChecked
                        ? "bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-700/80 shadow-xs"
                        : "bg-white dark:bg-slate-900 border-amber-300/80 dark:border-amber-700/60 shadow-xs ring-1 ring-amber-300/30"
                    }`}
                  >
                    {/* Fila 1: Selector de Estado + Nombre del Producto + Cantidad */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        {/* Botón táctil grande de Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleItem(item.key)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-90 cursor-pointer ${
                            isChecked
                              ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                              : "border-2 border-slate-300 dark:border-slate-600 hover:border-amber-500 bg-slate-50 dark:bg-slate-800 text-transparent"
                          }`}
                          title={isChecked ? "Marcar como pendiente" : "Marcar como recibido"}
                        >
                          <Check className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[3] ${isChecked ? "text-white" : "text-transparent"}`} />
                        </button>

                        {/* Nombre del Producto y Cantidad esperada */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                              #{item.index + 1}
                            </span>
                            <span
                              onClick={() => toggleItem(item.key)}
                              className={`text-xs sm:text-sm font-black cursor-pointer truncate max-w-full leading-tight ${
                                isChecked
                                  ? "text-emerald-900 dark:text-emerald-200"
                                  : "text-slate-900 dark:text-slate-100"
                              }`}
                              title={item.nombre}
                            >
                              {item.nombre}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              📦 Esperado: <strong className="text-slate-900 dark:text-white">{item.cantidad} {item.unidad}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Badge de Estado: Recibido vs Pendiente */}
                      <button
                        type="button"
                        onClick={() => toggleItem(item.key)}
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full cursor-pointer transition active:scale-95 shrink-0 ${
                          isChecked
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                            : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                        }`}
                      >
                        {isChecked ? "✓ Recibido" : "⏳ Pendiente"}
                      </button>
                    </div>

                    {/* Fila 2: Campo de Observación PUNTUAL del producto */}
                    <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Observación de este producto:</span>
                        </label>
                        {hasNote && (
                          <button
                            type="button"
                            onClick={() => setItemNote(item.key, "")}
                            className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                            title="Borrar observación"
                          >
                            <X className="w-2.5 h-2.5" />
                            <span>Limpiar</span>
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={item.note}
                          onChange={(e) => setItemNote(item.key, e.target.value)}
                          placeholder="Ej: Faltaron 3 kg, llegó maduro, empaque averiado..."
                          className={`w-full text-xs font-medium px-2.5 py-1.5 rounded-xl border outline-none transition ${
                            hasNote
                              ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-amber-500"
                              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500"
                          }`}
                        />
                      </div>

                      {/* Chips de Observación Rápida de 1 toque */}
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        <span className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 mr-0.5">
                          Rápido:
                        </span>
                        {QUICK_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => addQuickTagToItem(item.key, tag)}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer border border-slate-200/60 dark:border-slate-700"
                          >
                            +{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ====================================================================
            5. SECCIÓN DESPLEGABLE: OBSERVACIÓN GENERAL DE LA ENTREGA
            ==================================================================== */}
        <div className="bg-slate-50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setShowGeneralNotes(!showGeneralNotes)}
            className="w-full px-4 py-2 sm:px-6 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Observación General del Pedido (Opcional)</span>
              {generalNotes.trim() && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>{showGeneralNotes ? "Ocultar" : "Escribir nota general"}</span>
              {showGeneralNotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {showGeneralNotes && (
            <div className="px-4 pb-3 sm:px-6 pt-1 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Aplica para toda la remisión (ej. nombre del conductor, novedades del camión):
                </span>
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setGeneralNotes("Todo recibido en orden y a entera satisfacción.")}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Todo OK
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={() => setGeneralNotes("Se registran faltantes pendientes de entregar por proveedor.")}
                    className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Con Faltantes
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Escriba aquí observaciones globales de la entrega o transporte..."
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>
          )}
        </div>

        {/* ====================================================================
            6. PIE DE ACCIONES DEL MODAL
            ==================================================================== */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={reiniciarChecklist}
            className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 text-xs font-bold flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
            title="Reiniciar todo el checklist y observaciones"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copiarReporte}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer shadow-sm shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Reporte</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Listo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
