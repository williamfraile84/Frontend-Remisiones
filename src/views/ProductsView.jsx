import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  RefreshCw,
  Package,
  Scale,
  Check,
  X,
  Layers,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { productApi } from "../api/productApi";
import { unitApi } from "../api/unitApi";
import { empaqueApi } from "../api/empaqueApi";
import { formatCurrency } from "../utils/currency";
import ProductEmpaquesTableView from "./ProductEmpaquesTableView";

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

export default function ProductsView() {
  const { showToast } = useToast();
  const [pestanaActiva, setPestanaActiva] = useState("catalogo"); // "catalogo" | "matriz_empaques"
  const [productos, setProductos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [tiposEmpaque, setTiposEmpaque] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("TODAS");

  // Modal
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    pos_item_id: "",
    categoria: "VERDURAS",
    unidad_medida_id: "",
    tipo_empaque_id: "",
    empaque_ids: [],
    empaques_kilos: {},
    precio_costo_referencia: 0,
    precio_venta_referencia: 0,
    precio_pos_actual: 0,
    merma_esperada_pct: 0,
  });
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [prods, units, tipos] = await Promise.all([
        productApi.getAll(),
        unitApi.getAll(),
        empaqueApi.getTipos(),
      ]);
      setProductos(prods || []);
      setUnidades(units || []);
      setTiposEmpaque(tipos || []);
    } catch {
      showToast("Error al cargar el catálogo de productos", "error");
    } finally {
      setCargando(false);
    }
  }, [showToast]);

  useEffect(() => {
    Promise.resolve().then(() => {
      cargarDatos();
    });
  }, [cargarDatos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const cumpleBusqueda =
        !busqueda.trim() ||
        p.nombre?.toUpperCase().includes(busqueda.toUpperCase().trim()) ||
        p.codigo?.toUpperCase().includes(busqueda.toUpperCase().trim()) ||
        p.pos_item_id?.toUpperCase().includes(busqueda.toUpperCase().trim());
      const cumpleCategoria =
        categoriaFiltro === "TODAS" ||
        (p.categoria &&
          p.categoria.toUpperCase() === categoriaFiltro.toUpperCase());
      return cumpleBusqueda && cumpleCategoria;
    });
  }, [productos, busqueda, categoriaFiltro]);

  const abrirCrear = () => {
    setEditandoId(null);
    const defaultKilos = {};
    tiposEmpaque.forEach((t) => {
      defaultKilos[t.id] = t.peso_kg;
    });
    setFormData({
      nombre: "",
      codigo: "",
      pos_item_id: "",
      categoria: "VERDURAS",
      unidad_medida_id: unidades[0]?.id ? String(unidades[0].id) : "",
      tipo_empaque_id: tiposEmpaque[0]?.id ? String(tiposEmpaque[0].id) : "",
      empaque_ids: [],
      empaques_kilos: defaultKilos,
      precio_costo_referencia: 0,
      precio_venta_referencia: 0,
      precio_pos_actual: 0,
      merma_esperada_pct: 0,
    });
    setMostrarModal(true);
  };

  const abrirEditar = (prod) => {
    setEditandoId(prod.id);
    const selectedEmpaques = (prod.empaques_permitidos || []).map((e) => e.id);
    if (
      prod.tipo_empaque_id &&
      !selectedEmpaques.includes(prod.tipo_empaque_id)
    ) {
      selectedEmpaques.push(prod.tipo_empaque_id);
    }

    const kilosMap = {};
    tiposEmpaque.forEach((t) => {
      kilosMap[t.id] = t.peso_kg;
    });
    (prod.empaques_permitidos || []).forEach((e) => {
      if (e.peso_kg !== undefined && e.peso_kg !== null) {
        kilosMap[e.id] = e.peso_kg;
      }
    });

    setFormData({
      nombre: prod.nombre || "",
      codigo: prod.codigo || "",
      pos_item_id: prod.pos_item_id || "",
      categoria: prod.categoria || "VERDURAS",
      unidad_medida_id: prod.unidad_medida_id
        ? String(prod.unidad_medida_id)
        : "",
      tipo_empaque_id: prod.tipo_empaque_id ? String(prod.tipo_empaque_id) : "",
      empaque_ids: selectedEmpaques,
      empaques_kilos: kilosMap,
      precio_costo_referencia: prod.precio_costo_referencia || 0,
      precio_venta_referencia: prod.precio_venta_referencia || 0,
      precio_pos_actual: prod.precio_pos_actual || 0,
      merma_esperada_pct: prod.merma_esperada_pct || 0,
    });
    setMostrarModal(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    const cleanNombre = formData.nombre.trim().toUpperCase();
    if (!cleanNombre) {
      showToast("El nombre del producto es obligatorio", "error");
      return;
    }

    // Validación anti-duplicados en catálogo
    const yaExiste = productos.some(
      (p) =>
        p.nombre?.trim().toUpperCase() === cleanNombre && p.id !== editandoId,
    );
    if (yaExiste) {
      showToast(
        `El producto "${cleanNombre}" ya existe en el catálogo maestro.`,
        "error",
      );
      return;
    }

    setGuardando(true);
    try {
      const empaquesConfig = (formData.empaque_ids || []).map((id) => {
        const t = tiposEmpaque.find((x) => x.id === id);
        const kVal = formData.empaques_kilos?.[id];
        const finalKg =
          kVal !== undefined && kVal !== "" && !isNaN(parseFloat(kVal))
            ? parseFloat(kVal)
            : t
              ? parseFloat(t.peso_kg)
              : 0;
        return {
          tipo_empaque_id: parseInt(id, 10),
          peso_kg: finalKg,
        };
      });

      const payload = {
        nombre: formData.nombre.trim(),
        codigo: formData.codigo?.trim() || null,
        pos_item_id: formData.pos_item_id?.trim() || null,
        categoria: formData.categoria || null,
        unidad_medida_id: formData.unidad_medida_id
          ? parseInt(formData.unidad_medida_id, 10)
          : null,
        tipo_empaque_id: formData.tipo_empaque_id
          ? parseInt(formData.tipo_empaque_id, 10)
          : null,
        empaque_ids: (formData.empaque_ids || []).map((id) => parseInt(id, 10)),
        empaques_config: empaquesConfig,
        precio_costo_referencia:
          parseFloat(formData.precio_costo_referencia) || 0,
        precio_venta_referencia:
          parseFloat(formData.precio_venta_referencia) || 0,
        precio_pos_actual:
          parseFloat(formData.precio_pos_actual) || 0,
        merma_esperada_pct: parseFloat(formData.merma_esperada_pct) || 0,
      };

      if (editandoId) {
        await productApi.update(editandoId, payload);
        showToast("Producto actualizado exitosamente", "success");
      } else {
        await productApi.create(payload);
        showToast("Producto creado exitosamente", "success");
      }
      setMostrarModal(false);
      await cargarDatos();
      try {
        localStorage.removeItem("app_productos_catalogo_cache");
      } catch {
        // ignore
      }
      window.dispatchEvent(new CustomEvent("catalog_products_updated"));
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Error al guardar el producto",
        "error",
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Está seguro de desactivar el producto "${nombre}"?`))
      return;
    try {
      await productApi.delete(id);
      showToast("Producto desactivado correctamente", "success");
      await cargarDatos();
      try {
        localStorage.removeItem("app_productos_catalogo_cache");
      } catch {
        // ignore
      }
      window.dispatchEvent(new CustomEvent("catalog_products_updated"));
    } catch {
      showToast("Error al desactivar el producto", "error");
    }
  };

  if (pestanaActiva === "matriz_empaques") {
    return (
      <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-4">
        <div className="flex items-center gap-2 border-b border-slate-200/90 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setPestanaActiva("catalogo")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Package className="w-4 h-4 text-slate-500" />
            <span>Catálogo General</span>
          </button>
          <button
            type="button"
            onClick={() => setPestanaActiva("matriz_empaques")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black bg-emerald-600 text-white shadow-xs transition cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Matriz de Empaques y Kilos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-800 text-emerald-200 font-bold">
              Lotes
            </span>
          </button>
        </div>
        <ProductEmpaquesTableView onNavigateToCatalog={() => setPestanaActiva("catalogo")} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Selector de Pestañas Superior */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setPestanaActiva("catalogo")}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black bg-emerald-600 text-white shadow-xs transition cursor-pointer"
        >
          <Package className="w-4 h-4" />
          <span>Catálogo General</span>
        </button>
        <button
          type="button"
          onClick={() => setPestanaActiva("matriz_empaques")}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Matriz de Empaques y Kilos</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
            Edición por Lotes
          </span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Catálogo Maestro de Productos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Estandarice códigos, unidades físicas de medida y presentaciones de
            empaque.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Recargar"
          >
            <RefreshCw
              className={`w-5 h-5 ${cargando ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={abrirCrear}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-lg font-medium shadow-sm transition-colors text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          <Layers className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex gap-1">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  categoriaFiltro === cat
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm">Cargando catálogo maestro...</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 stroke-1" />
            <p className="font-medium text-slate-600 dark:text-slate-300">
              No se encontraron productos
            </p>
            <p className="text-xs mt-1">
              {busqueda || categoriaFiltro !== "TODAS"
                ? "Pruebe ajustando los filtros de búsqueda."
                : "Agregue su primer producto con el botón 'Nuevo Producto'."}
            </p>
          </div>
        ) : (
          <>
            {/* VISTA MÓVIL Y TABLETS (< 1024px) - DISEÑO DE TARJETAS FLUIDAS */}
            <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {productosFiltrados.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3.5 sm:p-4 space-y-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* Fila Superior: Nombre, Código, Categoría y Acciones */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                          {prod.nombre}
                        </h4>
                        {prod.codigo && (
                          <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            #{prod.codigo}
                          </span>
                        )}
                        {prod.pos_item_id && (
                          <span
                            className="font-mono text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800"
                            title="ID Artículo Sistema POS"
                          >
                            POS: #{prod.pos_item_id}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {prod.categoria || "GENERAL"}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Unidad:{" "}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {prod.unidad_medida?.codigo || "KG"}
                          </strong>
                          {prod.unidad_medida?.nombre &&
                            ` (${prod.unidad_medida.nombre})`}
                        </span>
                      </div>
                    </div>

                    {/* Botones de Acción Táctiles */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => abrirEditar(prod)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                        title="Editar Producto"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(prod.id, prod.nombre)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                        title="Desactivar Producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Empaques permitidos */}
                  {((prod.empaques_permitidos &&
                    prod.empaques_permitidos.length > 0) ||
                    prod.tipo_empaque?.nombre) && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium mr-0.5">
                          Empaques:
                        </span>
                        {prod.empaques_permitidos &&
                        prod.empaques_permitidos.length > 0 ? (
                          prod.empaques_permitidos.map((emp) => (
                            <span
                              key={emp.id}
                              className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                            >
                              {emp.nombre} ({emp.peso_kg} Kg)
                            </span>
                          ))
                        ) : (
                          <strong className="text-slate-800 dark:text-slate-200">
                            {prod.tipo_empaque.nombre}
                          </strong>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mini-cuadrícula de precios de referencia */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50/70 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                        Costo Ref.
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(prod.precio_costo_referencia || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                        Venta Ref.
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(prod.precio_venta_referencia || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase block">
                        Precio POS
                      </span>
                      <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
                        {prod.precio_pos_actual
                          ? formatCurrency(prod.precio_pos_actual)
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* VISTA ESCRITORIO (>= 1024px) - TABLA COMPLETA */}
            <div
              className="hidden lg:block overflow-x-auto custom-scrollbar"
              tabIndex={0}
              role="region"
              aria-label="Catálogo maestro de productos"
            >
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3 text-purple-700 dark:text-purple-300">ID POS</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Unidad Base</th>
                    <th className="px-4 py-3">Empaques Permitidos</th>
                    <th className="px-4 py-3 text-right">Costo Ref.</th>
                    <th className="px-4 py-3 text-right">Venta Ref.</th>
                    <th className="px-4 py-3 text-right text-purple-700 dark:text-purple-300">Precio POS</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {productosFiltrados.map((prod) => (
                    <tr
                      key={prod.id}
                      className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {prod.codigo || "-"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-purple-700 dark:text-purple-300">
                        {prod.pos_item_id ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-bold bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                            #{prod.pos_item_id}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {prod.nombre}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {prod.categoria || "GENERAL"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {prod.unidad_medida?.codigo || "KG"}
                        </span>
                        {prod.unidad_medida?.nombre && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                            ({prod.unidad_medida.nombre})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {prod.empaques_permitidos &&
                          prod.empaques_permitidos.length > 0 ? (
                            prod.empaques_permitidos.map((emp) => (
                              <span
                                key={emp.id}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                {emp.nombre} ({emp.peso_kg} Kg)
                              </span>
                            ))
                          ) : prod.tipo_empaque?.nombre ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {prod.tipo_empaque.nombre}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-xs">
                              -
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(prod.precio_costo_referencia || 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                        {formatCurrency(prod.precio_venta_referencia || 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-purple-700 dark:text-purple-400 font-bold">
                        {prod.precio_pos_actual
                          ? formatCurrency(prod.precio_pos_actual)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => abrirEditar(prod)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminar(prod.id, prod.nombre)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors cursor-pointer"
                            title="Desactivar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal de Creación / Edición */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 shrink-0">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {editandoId ? "Editar Producto" : "Nuevo Producto"}
              </h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleGuardar}
              className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: TOMATE CHONTO, PAPA PASTUSA..."
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Código Interno
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: PROD-001"
                    value={formData.codigo}
                    onChange={(e) =>
                      setFormData({ ...formData, codigo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase mb-1">
                    ID Sistema POS
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 8011 o 8420"
                    value={formData.pos_item_id}
                    onChange={(e) =>
                      setFormData({ ...formData, pos_item_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30 text-purple-950 dark:text-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) =>
                      setFormData({ ...formData, categoria: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  >
                    {CATEGORIAS.filter((c) => c !== "TODAS").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Unidad de Medida Física
                  </label>
                  <select
                    value={formData.unidad_medida_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unidad_medida_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  >
                    <option value="">Seleccione Unidad...</option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.codigo} - {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Empaque Sugerido / Principal
                  </label>
                  <select
                    value={formData.tipo_empaque_id}
                    onChange={(e) => {
                      const val = e.target.value;
                      const empId = val ? parseInt(val, 10) : null;
                      const curEmpaques = formData.empaque_ids || [];
                      const newEmpaques =
                        empId && !curEmpaques.includes(empId)
                          ? [...curEmpaques, empId]
                          : curEmpaques;
                      const curKilos = { ...(formData.empaques_kilos || {}) };
                      if (empId && curKilos[empId] === undefined) {
                        const matchingT = tiposEmpaque.find(
                          (t) => t.id === empId,
                        );
                        if (matchingT) curKilos[empId] = matchingT.peso_kg;
                      }
                      setFormData({
                        ...formData,
                        tipo_empaque_id: val,
                        empaque_ids: newEmpaques,
                        empaques_kilos: curKilos,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  >
                    <option value="">Ninguno / A granel</option>
                    {tiposEmpaque.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} (
                        {formData.empaques_kilos?.[t.id] ?? t.peso_kg} Kg)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                    Tipos de Empaque Permitidos y Kilos por Empaque
                  </label>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Personalice los Kilos si difieren del catálogo
                  </span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/60 dark:bg-slate-800/50 custom-scrollbar">
                  {tiposEmpaque.map((t) => {
                    const isChecked = (formData.empaque_ids || []).includes(
                      t.id,
                    );
                    const currentKg =
                      formData.empaques_kilos?.[t.id] ?? t.peso_kg;
                    const numKg = parseFloat(currentKg) || 0;
                    const currentLb = (numKg * 2).toFixed(1);
                    const isCustom =
                      isChecked &&
                      Math.abs(numKg - parseFloat(t.peso_kg)) > 0.001;

                    return (
                      <div
                        key={t.id}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isChecked
                            ? "bg-white dark:bg-slate-800 border-emerald-400 dark:border-emerald-500 shadow-xs"
                            : "bg-white/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const current = formData.empaque_ids || [];
                                const updated = e.target.checked
                                  ? [...current, t.id]
                                  : current.filter((id) => id !== t.id);
                                const updatedKilos = {
                                  ...(formData.empaques_kilos || {}),
                                  [t.id]:
                                    formData.empaques_kilos?.[t.id] ??
                                    t.peso_kg,
                                };
                                setFormData({
                                  ...formData,
                                  empaque_ids: updated,
                                  empaques_kilos: updatedKilos,
                                });
                              }}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span
                              className={`text-xs truncate ${
                                isChecked
                                  ? "font-bold text-slate-900 dark:text-white"
                                  : "font-medium text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {t.nombre}
                            </span>
                          </label>

                          <div className="flex items-center gap-2 shrink-0">
                            {!isChecked ? (
                              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                Catálogo: {t.peso_kg} Kg (
                                {t.peso_lb || t.peso_kg * 2} Lb)
                              </span>
                            ) : (
                              <>
                                {isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        empaques_kilos: {
                                          ...prev.empaques_kilos,
                                          [t.id]: t.peso_kg,
                                        },
                                      }));
                                    }}
                                    className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded cursor-pointer transition"
                                    title={`Restablecer a estándar (${t.peso_kg} Kg)`}
                                  >
                                    Restablecer ({t.peso_kg} Kg)
                                  </button>
                                )}
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  {currentLb} Lb (calc.)
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Controles de Kilos si está seleccionado */}
                        {isChecked && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              Kilos por empaque para este producto:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className="relative w-28">
                                <input
                                  type="number"
                                  step="any"
                                  min="0.01"
                                  required={isChecked}
                                  value={currentKg}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData((prev) => ({
                                      ...prev,
                                      empaques_kilos: {
                                        ...prev.empaques_kilos,
                                        [t.id]: val,
                                      },
                                    }));
                                  }}
                                  className="w-full pl-2 pr-7 py-1 text-xs font-bold text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-right transition"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                                  Kg
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Costo Ref. ($)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={formData.precio_costo_referencia}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        precio_costo_referencia: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Venta Ref. ($)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={formData.precio_venta_referencia}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        precio_venta_referencia: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase mb-1">
                    Precio POS Actual ($)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={formData.precio_pos_actual}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        precio_pos_actual: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30 text-purple-950 dark:text-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  {guardando ? "Guardando..." : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
