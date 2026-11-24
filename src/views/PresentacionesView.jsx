import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Scale,
  Check,
  X,
  RefreshCw,
  Tag,
  Info,
  Package,
  Layers,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useEmpaques } from "../hooks/useEmpaques";

export default function PresentacionesView({
  empaquesManager: empaquesManagerProp,
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const localEmpaquesManager = useEmpaques();
  const manager = empaquesManagerProp || localEmpaquesManager;

  const { tiposEmpaque, cargando, cargarDatos, guardarTipo, eliminarTipo } =
    manager;

  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    peso_kg: "50",
    peso_lb: "100",
    descripcion: "",
    activo: true,
  });

  // Cálculo automático reactivo: Kg -> Lb (ReadOnly)
  const handleKgChange = (kgVal) => {
    const num = parseFloat(kgVal) || 0;
    setFormData((prev) => ({
      ...prev,
      peso_kg: kgVal,
      peso_lb: num > 0 ? (num * 2).toFixed(2).replace(/\.00$/, "") : "",
    }));
  };

  const handleIniciarNuevo = () => {
    setEditandoId(null);
    setFormData({
      nombre: "",
      peso_kg: "50",
      peso_lb: "100",
      descripcion: "",
      activo: true,
    });
    setMostrarModal(true);
  };

  const handleIniciarEditar = (item) => {
    setEditandoId(item.id);
    setFormData({
      nombre: item.nombre || "",
      peso_kg: String(item.peso_kg || 0),
      peso_lb: String(item.peso_lb || 0),
      descripcion: item.descripcion || "",
      activo: item.activo !== undefined ? item.activo : true,
    });
    setMostrarModal(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    const nombre = formData.nombre.trim();
    if (!nombre) {
      showToast("El nombre del empaque es obligatorio.", "error");
      return;
    }
    const kg = parseFloat(formData.peso_kg) || 0;
    if (kg <= 0) {
      showToast("El peso en kilogramos debe ser mayor a 0.", "error");
      return;
    }
    const lb = parseFloat(formData.peso_lb) || kg * 2;

    setGuardando(true);
    try {
      const payload = {
        nombre,
        peso_kg: kg,
        peso_lb: lb,
        descripcion: formData.descripcion.trim(),
        activo: formData.activo,
      };

      await guardarTipo(editandoId, payload);
      showToast(
        editandoId
          ? "Tipo de empaque actualizado exitosamente."
          : "Tipo de empaque creado exitosamente.",
        "success",
      );
      setMostrarModal(false);
      setEditandoId(null);
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Error al guardar el tipo de empaque.";
      showToast(msg, "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar el empaque "${nombre}"? Los productos que lo utilicen perderán su referencia.`,
      )
    ) {
      return;
    }
    try {
      await eliminarTipo(id);
      showToast(`Empaque "${nombre}" eliminado.`, "success");
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Error al eliminar el tipo de empaque.";
      showToast(msg, "error");
    }
  };

  const listaFiltrada = useMemo(() => {
    if (!busqueda.trim()) return tiposEmpaque;
    const term = busqueda.toLowerCase().trim();
    return tiposEmpaque.filter(
      (t) =>
        (t.nombre && t.nombre.toLowerCase().includes(term)) ||
        (t.descripcion && t.descripcion.toLowerCase().includes(term)),
    );
  }, [tiposEmpaque, busqueda]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Cabecera Principal */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wider">
              Catálogo Maestro de Empaques y Medidas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gestione los tipos de empaque estandarizados (Bulto, Pony,
              Canastilla, Caja, etc.) con sus pesos oficiales en Kg y Lb.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate("/matriz-empaques")}
            className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title="Ir a la matriz rápida de empaques y kilos por producto"
          >
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Matriz por Producto</span>
          </button>
          <button
            type="button"
            onClick={() => cargarDatos()}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold p-2.5 rounded-xl transition cursor-pointer"
            title="Recargar catálogo"
          >
            <RefreshCw
              className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`}
            />
          </button>
          <button
            type="button"
            onClick={handleIniciarNuevo}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Empaque</span>
          </button>
        </div>
      </div>

      {/* Tarjeta de Información Estandarizada */}
      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-start gap-2.5 text-emerald-950 dark:text-emerald-200 text-xs">
        <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Estandarización 3NF en Operación:</span>{" "}
          Los empaques representan unidades de transporte físico independientes.
          Los productos se vinculan a estos empaques en el Catálogo de Productos
          y heredan automáticamente la capacidad en kilogramos y libras para
          cubicajes de flete y liquidación.
        </div>
      </div>

      {/* Barra de Búsqueda y Estadísticas */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción (ej: Bulto, Canastilla, Huacal)..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-2xs transition"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          Empaques registrados:{" "}
          <strong className="text-slate-900 dark:text-white">
            {listaFiltrada.length}
          </strong>
        </span>
      </div>

      {/* Grid de Empaques */}
      {listaFiltrada.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs italic">
          No se encontraron empaques que coincidan con la búsqueda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listaFiltrada.map((t) => (
            <div
              key={t.id || t.nombre}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase truncate">
                        {t.nombre}
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        ID: #{t.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleIniciarEditar(t)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition cursor-pointer"
                      title="Editar empaque"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(t.id, t.nombre)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      title="Eliminar empaque"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-mono font-black text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-xl">
                    ⚖️ {t.peso_kg || 0} Kg
                  </span>
                  <span className="text-xs font-mono font-black text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl">
                    {t.peso_lb || 0} Lb
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 pt-1 leading-relaxed">
                  {t.descripcion ||
                    "Tipo de empaque estándar para transporte de fruver."}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                <span
                  className={`font-black px-2 py-0.5 rounded-full ${
                    t.activo !== false
                      ? "bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {t.activo !== false ? "ACTIVO" : "INACTIVO"}
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  {t.peso_kg > 0 ? `1 un = ${t.peso_kg} kg` : "Variable"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Creación / Edición */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-4">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase">
                  {editandoId
                    ? "Modificar Tipo de Empaque"
                    : "Nuevo Tipo de Empaque"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleGuardar}
              className="p-4 sm:p-5 space-y-4 text-xs font-semibold"
            >
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Nombre del Empaque *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Bulto 50 Kg / Canastilla"
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Capacidad Kilogramos (Kg) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Ej: 50"
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 rounded-xl p-2.5 font-black text-center text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition tabular-nums"
                    value={formData.peso_kg}
                    onChange={(e) => handleKgChange(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Capacidad Libras (Lb)
                    <span className="ml-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                      Calculado
                    </span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    placeholder="Auto: Kg × 2"
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/50 rounded-xl p-2.5 font-black text-center text-slate-500 dark:text-slate-400 outline-none transition tabular-nums cursor-not-allowed select-none"
                    value={formData.peso_lb}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Descripción / Especificación Técnica
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Bulto completo de polipropileno tradicional para transporte masivo (50 kg / 100 lb)"
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="empaqueActivo"
                  className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  checked={formData.activo}
                  onChange={(e) =>
                    setFormData({ ...formData, activo: e.target.checked })
                  }
                />
                <label
                  htmlFor="empaqueActivo"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Empaque Activo y disponible para selección
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {guardando
                      ? "Guardando..."
                      : editandoId
                        ? "Actualizar"
                        : "Crear Empaque"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
