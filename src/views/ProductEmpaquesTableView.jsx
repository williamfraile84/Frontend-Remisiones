import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layers,
  Search,
  Save,
  RotateCcw,
  Check,
  CheckSquare,
  Square,
  Sliders,
  Package,
  Scale,
  Sparkles,
  Download,
  AlertCircle,
  Info,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { productApi } from "../api/productApi";
import { empaqueApi } from "../api/empaqueApi";

const CATEGORIAS = [
  "TODAS",
  "VERDURAS Y HORTALIZAS",
  "FRUTAS",
  "TUBERCULOS",
  "HIERBAS Y AROMATICAS",
  "LACTEOS Y HUEVOS",
  "EMBUTIDOS",
  "PANADERIA",
  "GRANOS Y ABARROTES",
  "OTROS",
];

export default function ProductEmpaquesTableView({ onNavigateToCatalog }) {
  const { showToast } = useToast();

  const [productos, setProductos] = useState([]);
  const [tiposEmpaque, setTiposEmpaque] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("TODAS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS"); // TODOS | MODIFICADOS | CON_EMPAQUES | SIN_EMPAQUES

  // Estado de edición reactiva en memoria: { [productoId]: { empaques: { [tipoId]: { activo: bool, peso_kg: number|string } }, tipo_empaque_id: number|null } }
  const [ediciones, setEdiciones] = useState({});

  // Selección múltiple para acciones masivas
  const [seleccionados, setSeleccionados] = useState(new Set());

  // Diálogo / Panel de acción masiva
  const [loteEmpaqueId, setLoteEmpaqueId] = useState("");
  const [lotePesoKg, setLotePesoKg] = useState("");
  const [loteAccion, setLoteAccion] = useState("asignar"); // asignar | principal | desmarcar

  // Cargar datos iniciales
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [prods, tipos] = await Promise.all([
        productApi.getAll(),
        empaqueApi.getTipos(),
      ]);

      const prodsList = prods || [];
      const tiposList = (tipos || []).filter((t) => t.activo !== false);

      setProductos(prodsList);
      setTiposEmpaque(tiposList);

      // Inicializar el estado de edición base para cada producto
      const estadoInicial = {};
      prodsList.forEach((prod) => {
        const empaquesObj = {};

        // Empaques ya permitidos
        (prod.empaques_permitidos || []).forEach((e) => {
          empaquesObj[e.id] = {
            activo: true,
            peso_kg: e.peso_kg !== undefined && e.peso_kg !== null ? e.peso_kg : e.peso_kg_default || 0,
          };
        });

        // Asegurar que si tiene tipo_empaque_id esté registrado
        if (prod.tipo_empaque_id && !empaquesObj[prod.tipo_empaque_id]) {
          const tDef = tiposList.find((t) => t.id === prod.tipo_empaque_id);
          empaquesObj[prod.tipo_empaque_id] = {
            activo: true,
            peso_kg: tDef ? tDef.peso_kg : 0,
          };
        }

        estadoInicial[prod.id] = {
          empaques: empaquesObj,
          tipo_empaque_id: prod.tipo_empaque_id || null,
        };
      });

      setEdiciones(estadoInicial);
      setSeleccionados(new Set());
    } catch {
      showToast("Error al cargar datos de productos y empaques.", "error");
    } finally {
      setCargando(false);
    }
  }, [showToast]);

  useEffect(() => {
    Promise.resolve().then(() => {
      cargarDatos();
    });
  }, [cargarDatos]);

  // Verificar si un producto tiene cambios sin guardar comparado con el catálogo original
  const productoModificado = useCallback(
    (prodId) => {
      const original = productos.find((p) => p.id === prodId);
      const actual = ediciones[prodId];
      if (!original || !actual) return false;

      // Comparar tipo principal
      if ((original.tipo_empaque_id || null) !== (actual.tipo_empaque_id || null)) {
        return true;
      }

      // Comparar empaques permitidos
      const origMap = {};
      (original.empaques_permitidos || []).forEach((e) => {
        origMap[e.id] = parseFloat(e.peso_kg) || 0;
      });

      const actualActivos = Object.entries(actual.empaques || {}).filter(
        ([, v]) => v.activo,
      );

      // Si difiere la cantidad de activos
      if (Object.keys(origMap).length !== actualActivos.length) {
        return true;
      }

      // Si alguno difiere en ID o peso
      for (const [tIdStr, v] of actualActivos) {
        const tId = parseInt(tIdStr, 10);
        if (!(tId in origMap)) return true;
        const actualKg = parseFloat(v.peso_kg) || 0;
        if (Math.abs(actualKg - origMap[tId]) > 0.001) return true;
      }

      return false;
    },
    [productos, ediciones],
  );

  // Lista de IDs modificados actualmente
  const idsModificados = useMemo(() => {
    return productos.filter((p) => productoModificado(p.id)).map((p) => p.id);
  }, [productos, productoModificado]);

  const tieneCambiosPendientes = idsModificados.length > 0;

  // Filtrado de productos
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      // Búsqueda
      const q = busqueda.trim().toUpperCase();
      const matchBusqueda =
        !q ||
        (p.nombre && p.nombre.toUpperCase().includes(q)) ||
        (p.codigo && p.codigo.toUpperCase().includes(q)) ||
        (p.pos_item_id && p.pos_item_id.toUpperCase().includes(q));

      // Categoría
      const matchCat =
        categoriaFiltro === "TODAS" ||
        (p.categoria && p.categoria.toUpperCase() === categoriaFiltro.toUpperCase());

      // Estado
      let matchEstado = true;
      const estadoProd = ediciones[p.id];
      const cantActivos = Object.values(estadoProd?.empaques || {}).filter(
        (e) => e.activo,
      ).length;

      if (filtroEstado === "MODIFICADOS") {
        matchEstado = idsModificados.includes(p.id);
      } else if (filtroEstado === "CON_EMPAQUES") {
        matchEstado = cantActivos > 0;
      } else if (filtroEstado === "SIN_EMPAQUES") {
        matchEstado = cantActivos === 0;
      }

      return matchBusqueda && matchCat && matchEstado;
    });
  }, [productos, busqueda, categoriaFiltro, filtroEstado, ediciones, idsModificados]);

  // Manejadores de interacción en celdas
  const toggleEmpaque = (prodId, tipoEmpaqueId) => {
    const tDef = tiposEmpaque.find((t) => t.id === tipoEmpaqueId);
    setEdiciones((prev) => {
      const prodEd = prev[prodId] || { empaques: {}, tipo_empaque_id: null };
      const current = prodEd.empaques[tipoEmpaqueId];
      const newActivo = !current?.activo;

      const newEmpaques = {
        ...prodEd.empaques,
        [tipoEmpaqueId]: {
          activo: newActivo,
          peso_kg:
            newActivo && (!current?.peso_kg || parseFloat(current.peso_kg) <= 0)
              ? tDef?.peso_kg || 0
              : current?.peso_kg || tDef?.peso_kg || 0,
        },
      };

      // Si desmarcamos el empaque que era principal, limpiar el principal
      let newTipoPrincipal = prodEd.tipo_empaque_id;
      if (!newActivo && newTipoPrincipal === tipoEmpaqueId) {
        newTipoPrincipal = null;
      } else if (newActivo && !newTipoPrincipal) {
        newTipoPrincipal = tipoEmpaqueId;
      }

      return {
        ...prev,
        [prodId]: {
          ...prodEd,
          empaques: newEmpaques,
          tipo_empaque_id: newTipoPrincipal,
        },
      };
    });
  };

  const handlePesoChange = (prodId, tipoEmpaqueId, nuevoPeso) => {
    setEdiciones((prev) => {
      const prodEd = prev[prodId] || { empaques: {}, tipo_empaque_id: null };
      const current = prodEd.empaques[tipoEmpaqueId];

      return {
        ...prev,
        [prodId]: {
          ...prodEd,
          empaques: {
            ...prodEd.empaques,
            [tipoEmpaqueId]: {
              activo: current ? current.activo : true,
              peso_kg: nuevoPeso,
            },
          },
        },
      };
    });
  };

  const handleTipoPrincipalChange = (prodId, tipoEmpaqueId) => {
    const val = tipoEmpaqueId ? parseInt(tipoEmpaqueId, 10) : null;
    setEdiciones((prev) => {
      const prodEd = prev[prodId] || { empaques: {}, tipo_empaque_id: null };

      // Si se asigna un principal, asegurar que quede activo en empaques
      let newEmpaques = { ...prodEd.empaques };
      if (val && !newEmpaques[val]?.activo) {
        const tDef = tiposEmpaque.find((t) => t.id === val);
        newEmpaques[val] = {
          activo: true,
          peso_kg: tDef?.peso_kg || 0,
        };
      }

      return {
        ...prev,
        [prodId]: {
          ...prodEd,
          tipo_empaque_id: val,
          empaques: newEmpaques,
        },
      };
    });
  };

  // Revertir un producto individual
  const revertirProducto = (prodId) => {
    const original = productos.find((p) => p.id === prodId);
    if (!original) return;

    const empaquesObj = {};
    (original.empaques_permitidos || []).forEach((e) => {
      empaquesObj[e.id] = {
        activo: true,
        peso_kg: e.peso_kg !== undefined && e.peso_kg !== null ? e.peso_kg : e.peso_kg_default || 0,
      };
    });

    setEdiciones((prev) => ({
      ...prev,
      [prodId]: {
        empaques: empaquesObj,
        tipo_empaque_id: original.tipo_empaque_id || null,
      },
    }));
  };

  // Guardar un producto individual
  const guardarProductoFila = async (prodId) => {
    const prodEd = ediciones[prodId];
    if (!prodEd) return;

    const empaquesConfig = Object.entries(prodEd.empaques || {})
      .filter(([, v]) => v.activo)
      .map(([tId, v]) => ({
        tipo_empaque_id: parseInt(tId, 10),
        peso_kg: parseFloat(v.peso_kg) || 0,
      }));

    try {
      await productApi.update(prodId, {
        tipo_empaque_id: prodEd.tipo_empaque_id,
        empaque_ids: empaquesConfig.map((e) => e.tipo_empaque_id),
        empaques_config: empaquesConfig,
      });

      // Actualizar en el estado de productos
      setProductos((prev) =>
        prev.map((p) => {
          if (p.id !== prodId) return p;
          const permitidos = empaquesConfig.map((ec) => {
            const tDef = tiposEmpaque.find((t) => t.id === ec.tipo_empaque_id);
            return {
              id: ec.tipo_empaque_id,
              nombre: tDef?.nombre || `Empaque #${ec.tipo_empaque_id}`,
              peso_kg: ec.peso_kg,
              peso_lb: round2(ec.peso_kg * 2),
              peso_kg_default: tDef?.peso_kg || 0,
            };
          });
          return {
            ...p,
            tipo_empaque_id: prodEd.tipo_empaque_id,
            empaques_permitidos: permitidos,
          };
        }),
      );

      showToast("Configuración de empaque guardada con éxito.", "success");
    } catch {
      showToast("Error al guardar la configuración de empaque.", "error");
    }
  };

  // Guardar todos los cambios pendientes por lote (batch API)
  const guardarTodosLosCambios = useCallback(async () => {
    if (!tieneCambiosPendientes) {
      showToast("No hay cambios pendientes por guardar.", "info");
      return;
    }

    setGuardando(true);
    try {
      const itemsPayload = idsModificados.map((prodId) => {
        const prodEd = ediciones[prodId];
        const empaquesConfig = Object.entries(prodEd?.empaques || {})
          .filter(([, v]) => v.activo)
          .map(([tId, v]) => ({
            tipo_empaque_id: parseInt(tId, 10),
            peso_kg: parseFloat(v.peso_kg) || 0,
          }));

        return {
          producto_id: prodId,
          tipo_empaque_id: prodEd?.tipo_empaque_id || null,
          empaques_config: empaquesConfig,
        };
      });

      await productApi.batchUpdateEmpaques(itemsPayload);

      // Sincronizar catálogo local
      await cargarDatos();
      showToast(
        `¡Éxito! Se actualizaron ${itemsPayload.length} productos correctamente.`,
        "success",
      );
    } catch {
      showToast("Error al procesar el guardado masivo de empaques.", "error");
    } finally {
      setGuardando(false);
    }
  }, [tieneCambiosPendientes, showToast, idsModificados, ediciones, cargarDatos]);

  // Atajo de teclado: Ctrl+S para guardar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (tieneCambiosPendientes && !guardando) {
          guardarTodosLosCambios();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tieneCambiosPendientes, guardando, guardarTodosLosCambios]);

  // Selección masiva
  const toggleSeleccionarTodo = () => {
    if (seleccionados.size === productosFiltrados.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(productosFiltrados.map((p) => p.id)));
    }
  };

  const toggleSeleccion = (prodId) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(prodId)) next.delete(prodId);
      else next.add(prodId);
      return next;
    });
  };

  // Aplicar acción por lote a los productos seleccionados
  const aplicarAccionLote = () => {
    if (seleccionados.size === 0) {
      showToast("Seleccione al menos un producto en la tabla.", "warning");
      return;
    }

    const tId = parseInt(loteEmpaqueId, 10);
    const tDef = tiposEmpaque.find((t) => t.id === tId);

    if (loteAccion === "asignar") {
      if (!tId) {
        showToast("Seleccione un tipo de empaque a asignar.", "warning");
        return;
      }
      const pesoFinal =
        lotePesoKg !== "" && !isNaN(parseFloat(lotePesoKg))
          ? parseFloat(lotePesoKg)
          : tDef?.peso_kg || 0;

      setEdiciones((prev) => {
        const next = { ...prev };
        seleccionados.forEach((prodId) => {
          const prodEd = next[prodId] || { empaques: {}, tipo_empaque_id: null };
          next[prodId] = {
            ...prodEd,
            tipo_empaque_id: prodEd.tipo_empaque_id || tId,
            empaques: {
              ...prodEd.empaques,
              [tId]: {
                activo: true,
                peso_kg: pesoFinal,
              },
            },
          };
        });
        return next;
      });

      showToast(
        `Empaque "${tDef?.nombre}" asignado a ${seleccionados.size} productos con ${pesoFinal} kg. Guarde los cambios para confirmar.`,
        "info",
      );
    } else if (loteAccion === "principal") {
      if (!tId) {
        showToast("Seleccione el empaque que será principal.", "warning");
        return;
      }
      setEdiciones((prev) => {
        const next = { ...prev };
        seleccionados.forEach((prodId) => {
          const prodEd = next[prodId] || { empaques: {}, tipo_empaque_id: null };
          const curEmpaque = prodEd.empaques[tId];
          next[prodId] = {
            ...prodEd,
            tipo_empaque_id: tId,
            empaques: {
              ...prodEd.empaques,
              [tId]: {
                activo: true,
                peso_kg: curEmpaque?.peso_kg || tDef?.peso_kg || 0,
              },
            },
          };
        });
        return next;
      });

      showToast(
        `Empaque principal "${tDef?.nombre}" asignado a ${seleccionados.size} productos.`,
        "info",
      );
    } else if (loteAccion === "desmarcar") {
      if (!tId) {
        showToast("Seleccione el empaque a remover.", "warning");
        return;
      }
      setEdiciones((prev) => {
        const next = { ...prev };
        seleccionados.forEach((prodId) => {
          const prodEd = next[prodId] || { empaques: {}, tipo_empaque_id: null };
          if (prodEd.empaques[tId]) {
            const newEmp = { ...prodEd.empaques };
            delete newEmp[tId];
            next[prodId] = {
              ...prodEd,
              tipo_empaque_id:
                prodEd.tipo_empaque_id === tId ? null : prodEd.tipo_empaque_id,
              empaques: newEmp,
            };
          }
        });
        return next;
      });

      showToast(
        `Empaque removido de ${seleccionados.size} productos.`,
        "info",
      );
    }
  };

  // Exportar a CSV de configuración
  const exportarConfiguracion = () => {
    const headers = ["ID", "CODIGO", "PRODUCTO", "CATEGORIA", "EMPAQUE_PRINCIPAL"];
    tiposEmpaque.forEach((t) => headers.push(`${t.nombre}_ACTIVO`, `${t.nombre}_KG`));

    const rows = productos.map((p) => {
      const ed = ediciones[p.id];
      const tPrincipal = tiposEmpaque.find((t) => t.id === ed?.tipo_empaque_id);
      const row = [
        p.id,
        `"${p.codigo || ""}"`,
        `"${p.nombre}"`,
        `"${p.categoria || ""}"`,
        `"${tPrincipal?.nombre || ""}"`,
      ];
      tiposEmpaque.forEach((t) => {
        const eInfo = ed?.empaques[t.id];
        row.push(eInfo?.activo ? "SI" : "NO");
        row.push(eInfo?.activo ? eInfo.peso_kg : "");
      });
      return row.join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `empaques_productos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-5 md:p-6 w-full max-w-[1700px] mx-auto min-h-screen">
      {/* Encabezado y Navegación Rápida */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Layers className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Matriz de Empaques y Kilos por Producto
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="w-3 h-3" /> Edición Rápida Masiva
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
              Configure empaques permitidos y pesos específicos (kg/unidades) de forma directa y por lotes.
            </p>
          </div>
        </div>

        {/* Acciones Superiores */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
          {onNavigateToCatalog && (
            <button
              type="button"
              onClick={onNavigateToCatalog}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Package className="w-4 h-4 text-slate-500" />
              <span>Ver Catálogo General</span>
            </button>
          )}

          <button
            type="button"
            onClick={exportarConfiguracion}
            disabled={cargando}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Exportar configuración actual a CSV"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          {/* Botón Guardar Todos los Cambios con Badge */}
          <button
            type="button"
            onClick={guardarTodosLosCambios}
            disabled={!tieneCambiosPendientes || guardando}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-sm cursor-pointer ${
              tieneCambiosPendientes
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 ring-2 ring-emerald-500/40 animate-pulse"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
            }`}
          >
            {guardando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
                {tieneCambiosPendientes && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-800 text-[10px] text-emerald-200 font-mono">
                    {idsModificados.length}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resumen de Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Productos</span>
            <Package className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {productos.length}
          </div>
          <span className="text-[10px] text-slate-500">en catálogo activo</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Empaques</span>
            <Scale className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {tiposEmpaque.length}
          </div>
          <span className="text-[10px] text-slate-500">tipos estandarizados</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Seleccionados</span>
            <CheckSquare className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {seleccionados.size}
          </div>
          <span className="text-[10px] text-slate-500">para acciones en lote</span>
        </div>

        <div
          className={`border p-3 sm:p-4 rounded-xl shadow-2xs transition ${
            tieneCambiosPendientes
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Modificados</span>
            <AlertCircle
              className={`w-4 h-4 ${
                tieneCambiosPendientes ? "text-amber-500 animate-bounce" : "text-slate-400"
              }`}
            />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 ${
              tieneCambiosPendientes
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {idsModificados.length}
          </div>
          <span className="text-[10px] text-slate-500">
            {tieneCambiosPendientes ? "¡Presione Guardar o Ctrl+S!" : "todo sincronizado"}
          </span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          {/* Input de Búsqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto por nombre, código o POS..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Selector de Categoría */}
          <div className="relative">
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="w-full sm:w-auto text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c === "TODAS" ? "Todas las Categorías" : c}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Estado */}
          <div className="relative">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full sm:w-auto text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="MODIFICADOS">
                Solo Modificados ({idsModificados.length})
              </option>
              <option value="CON_EMPAQUES">Con Empaques Asignados</option>
              <option value="SIN_EMPAQUES">Sin Empaques Asignados</option>
            </select>
          </div>
        </div>

        {/* Botón Seleccionar / Desmarcar Todos */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={toggleSeleccionarTodo}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-2 cursor-pointer shadow-2xs"
            title="Seleccionar o desmarcar todos los productos mostrados"
          >
            {seleccionados.size > 0 &&
            seleccionados.size === productosFiltrados.length ? (
              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {seleccionados.size > 0 &&
              seleccionados.size === productosFiltrados.length
                ? "Desmarcar Todos"
                : "Seleccionar Todos"}
            </span>
          </button>
        </div>
      </div>

      {/* Barra de Acciones Masivas por Lote (Aparece cuando hay seleccionados) */}
      {seleccionados.size > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-black">
            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{seleccionados.size} producto(s) seleccionado(s)</span>
            <button
              type="button"
              onClick={() => setSeleccionados(new Set())}
              className="text-xs text-emerald-700 dark:text-emerald-300 underline font-normal ml-2 hover:opacity-80 cursor-pointer"
            >
              Desmarcar todos
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={loteAccion}
              onChange={(e) => setLoteAccion(e.target.value)}
              className="text-xs font-bold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-100"
            >
              <option value="asignar">Asignar Empaque & Kilos</option>
              <option value="principal">Establecer como Principal</option>
              <option value="desmarcar">Remover Empaque</option>
            </select>

            <select
              value={loteEmpaqueId}
              onChange={(e) => {
                const tid = e.target.value;
                setLoteEmpaqueId(tid);
                const t = tiposEmpaque.find((x) => String(x.id) === String(tid));
                if (t && lotePesoKg === "") {
                  setLotePesoKg(String(t.peso_kg || ""));
                }
              }}
              className="text-xs font-bold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-100"
            >
              <option value="">Seleccione Empaque...</option>
              {tiposEmpaque.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} ({t.peso_kg} kg defecto)
                </option>
              ))}
            </select>

            {loteAccion === "asignar" && (
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl px-2 py-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={lotePesoKg}
                  onChange={(e) => setLotePesoKg(e.target.value)}
                  placeholder="Kilos"
                  className="w-16 text-xs font-mono font-bold text-center bg-transparent focus:outline-none text-slate-800 dark:text-slate-100"
                />
                <span className="text-[10px] text-slate-400 font-bold">kg</span>
              </div>
            )}

            <button
              type="button"
              onClick={aplicarAccionLote}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Aplicar a seleccionados</span>
            </button>
          </div>
        </div>
      )}

      {/* Contenedor Principal de la Tabla o Fichas */}
      {cargando ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
            Cargando productos y matriz de empaques...
          </p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
            No se encontraron productos
          </h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Pruebe modificando los términos de búsqueda o los filtros de categoría y estado.
          </p>
        </div>
      ) : (
        /* VISTA FICHAS / TARJETAS */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
          {productosFiltrados.map((prod) => {
            const prodEd = ediciones[prod.id] || {
              empaques: {},
              tipo_empaque_id: null,
            };
            const isModificado = productoModificado(prod.id);
            const isSeleccionado = seleccionados.has(prod.id);

            return (
              <div
                key={prod.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all ${
                  isModificado
                    ? "border-amber-400 dark:border-amber-700/80 ring-1 ring-amber-400/30"
                    : isSeleccionado
                      ? "border-emerald-400 dark:border-emerald-700 ring-1 ring-emerald-400/30"
                      : "border-slate-200/90 dark:border-slate-800"
                }`}
              >
                <div>
                  {/* Cabecera de la Tarjeta */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleSeleccion(prod.id)}
                        className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer shrink-0"
                      >
                        {isSeleccionado ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                          {prod.nombre}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          {prod.codigo && (
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">
                              {prod.codigo}
                            </span>
                          )}
                          <span className="font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                            {prod.unidad_medida?.codigo || "KG"}
                          </span>
                          <span className="truncate">{prod.categoria || "Sin categoría"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Badge de Estado y Acciones Rápidas */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isModificado ? (
                        <>
                          <button
                            type="button"
                            onClick={() => guardarProductoFila(prod.id)}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Save className="w-3 h-3" />
                            <span>Guardar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => revertirProducto(prod.id)}
                            className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                            title="Revertir cambios"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="hidden sm:inline">Ok</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selector de Empaque Principal */}
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500">
                      Empaque Principal:
                    </span>
                    <select
                      value={prodEd.tipo_empaque_id || ""}
                      onChange={(e) =>
                        handleTipoPrincipalChange(prod.id, e.target.value)
                      }
                      className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200"
                    >
                      <option value="">(Sin principal)</option>
                      {tiposEmpaque.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lista de Empaques en Chips */}
                  <div className="mt-3 flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                      Empaques y Pesos Específicos:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {tiposEmpaque.map((t) => {
                        const eInfo = prodEd.empaques[t.id];
                        const activo = Boolean(eInfo?.activo);
                        const pesoKg =
                          eInfo?.peso_kg !== undefined
                            ? eInfo.peso_kg
                            : t.peso_kg || 0;
                        const esPersonalizado =
                          activo &&
                          Math.abs(parseFloat(pesoKg) - parseFloat(t.peso_kg)) >
                            0.001;

                        return (
                          <div
                            key={t.id}
                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border transition ${
                              activo
                                ? esPersonalizado
                                  ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                                : "bg-transparent border-dashed border-slate-200 dark:border-slate-800 opacity-60"
                            }`}
                          >
                            <label className="flex items-center gap-2 cursor-pointer min-w-0">
                              <input
                                type="checkbox"
                                checked={activo}
                                onChange={() => toggleEmpaque(prod.id, t.id)}
                                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                              />
                              <span
                                className={`text-xs truncate ${
                                  activo
                                    ? "font-bold text-slate-800 dark:text-slate-200"
                                    : "text-slate-400"
                                }`}
                              >
                                {t.nombre}
                              </span>
                            </label>

                            {activo && (
                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={pesoKg}
                                  onChange={(e) =>
                                    handlePesoChange(prod.id, t.id, e.target.value)
                                  }
                                  className="w-14 px-1 py-0.5 text-xs text-center font-mono font-bold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                                />
                                <span className="text-[10px] text-slate-400 font-bold">
                                  kg
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pie de Página con Atajos y Consejos */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[11px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <b>Atajo:</b> Presione <b>Ctrl+S</b> para guardar todos los cambios pendientes sin soltar el teclado. Use <b>Tab</b> para saltar rápidamente entre celdas numéricas.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Peso personalizado</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Cambio sin guardar</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function round2(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}
