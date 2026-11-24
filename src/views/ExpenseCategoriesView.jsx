import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  RefreshCw,
  DollarSign,
  Check,
  X,
  Tag,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { expenseCategoryApi } from "../api/expenseCategoryApi";

const TIPOS_GASTO = ["OPERATIVO", "LOGISTICO", "TRANSPORTE", "ADMINISTRATIVO"];

export default function ExpenseCategoriesView() {
  const { showToast } = useToast();
  const [conceptos, setConceptos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Modal
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    tipo: "OPERATIVO",
    distribuir_por_defecto: true,
  });
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const data = await expenseCategoryApi.getAll();
      setConceptos(data || []);
    } catch {
      showToast("Error al cargar conceptos de gastos", "error");
    } finally {
      setCargando(false);
    }
  }, [showToast]);

  useEffect(() => {
    Promise.resolve().then(() => {
      cargarDatos();
    });
  }, [cargarDatos]);

  const conceptosFiltrados = useMemo(() => {
    return conceptos.filter((c) => {
      if (!busqueda.trim()) return true;
      const term = busqueda.toUpperCase().trim();
      return (
        c.nombre?.toUpperCase().includes(term) ||
        c.tipo?.toUpperCase().includes(term)
      );
    });
  }, [conceptos, busqueda]);

  const abrirCrear = () => {
    setEditandoId(null);
    setFormData({
      nombre: "",
      codigo: "",
      tipo: "OPERATIVO",
      distribuir_por_defecto: true,
    });
    setMostrarModal(true);
  };

  const abrirEditar = (item) => {
    setEditandoId(item.id);
    setFormData({
      nombre: item.nombre || "",
      codigo: item.codigo || "",
      tipo: item.tipo || "OPERATIVO",
      distribuir_por_defecto: item.distribuir_por_defecto ?? true,
    });
    setMostrarModal(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      showToast("El nombre del concepto es obligatorio", "error");
      return;
    }
    setGuardando(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        codigo: formData.codigo?.trim() || null,
        tipo: formData.tipo,
        distribuir_por_defecto: formData.distribuir_por_defecto,
      };

      if (editandoId) {
        await expenseCategoryApi.update(editandoId, payload);
        showToast("Concepto de gasto actualizado", "success");
      } else {
        await expenseCategoryApi.create(payload);
        showToast("Concepto de gasto registrado", "success");
      }
      setMostrarModal(false);
      cargarDatos();
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Error al guardar el concepto",
        "error",
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Está seguro de desactivar el concepto "${nombre}"?`))
      return;
    try {
      await expenseCategoryApi.delete(id);
      showToast("Concepto desactivado correctamente", "success");
      cargarDatos();
    } catch {
      showToast("Error al desactivar el concepto", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Catálogo de Conceptos de Gastos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Parametrice fletes, descargues, peajes y determine si se distribuyen
            en el costo por kilo.
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
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Concepto
          </button>
        </div>
      </div>

      {/* Barra de Filtro */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por concepto o tipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
      </div>

      {/* Tabla de Conceptos */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm">Cargando conceptos de gasto...</p>
          </div>
        ) : conceptosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <Tag className="w-12 h-12 mx-auto mb-3 stroke-1" />
            <p className="font-medium text-slate-600 dark:text-slate-300">
              No se encontraron conceptos de gasto
            </p>
            <p className="text-xs mt-1">
              Cree un concepto nuevo o ajuste la búsqueda.
            </p>
          </div>
        ) : (
          <>
            {/* VISTA MÓVIL Y TABLETS (< 1024px) - DISEÑO DE TARJETAS FLUIDAS */}
            <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {conceptosFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 space-y-2.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* Fila Superior: Nombre, Código, Tipo y Acciones */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                          {item.nombre}
                        </h4>
                        {item.codigo && (
                          <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            #{item.codigo}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.tipo || "OPERATIVO"}
                        </span>
                      </div>
                    </div>

                    {/* Botones de Acción Táctiles */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => abrirEditar(item)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                        title="Editar Concepto"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(item.id, item.nombre)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                        title="Desactivar Concepto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Indicador de Prorrateo / Distribución en Costo */}
                  <div className="pt-1">
                    {item.distribuir_por_defecto ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Se distribuye en costo (Prorrateado por Kg)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <X className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>
                          Gasto directo / Cuenta separada (No prorratear)
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* VISTA ESCRITORIO (>= 1024px) - TABLA COMPLETA */}
            <div
              className="hidden lg:block overflow-x-auto custom-scrollbar"
              tabIndex={0}
              role="region"
              aria-label="Tabla de conceptos de gasto"
            >
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Concepto de Gasto</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3 text-center">
                      ¿Distribuir en Costo?
                    </th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {conceptosFiltrados.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {item.nombre}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
                          {item.tipo || "OPERATIVO"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.distribuir_por_defecto ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3.5 h-3.5" /> Sí (Prorratear)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <X className="w-3.5 h-3.5" /> No (Gasto Directo)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => abrirEditar(item)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminar(item.id, item.nombre)}
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

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {editandoId
                  ? "Editar Concepto de Gasto"
                  : "Nuevo Concepto de Gasto"}
              </h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nombre del Concepto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Flete, Peajes, Cargue y Descargue..."
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tipo de Gasto
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                >
                  {TIPOS_GASTO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.distribuir_por_defecto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        distribuir_por_defecto: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white block">
                      Distribuir por defecto en costo unitario
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">
                      Si está activo, este gasto se prorratea por kilo entre los
                      productos del pedido.
                    </span>
                  </div>
                </label>
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
                  {guardando ? "Guardando..." : "Guardar Concepto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
