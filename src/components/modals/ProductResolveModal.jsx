import React, { useState } from "react";
import {
  X,
  Sparkles,
  AlertTriangle,
  Check,
  CheckCircle2,
  Edit3,
  ArrowRight,
  Plus,
} from "lucide-react";
import UnitSelector from "../orders/UnitSelector";

export default function ProductResolveModal({
  isOpen,
  onClose,
  productItem,
  similarOptions = [],
  tiposEmpaque = [],
  onSelectExisting,
  onAddNewProduct,
}) {
  const [activeTab, setActiveTab] = useState(
    similarOptions && similarOptions.length > 0 ? "similar" : "new",
  );
  const [nombreModificado, setNombreModificado] = useState("");
  const [unidadSeleccionada, setUnidadSeleccionada] = useState("Kg");
  const [tipoEmpaqueSeleccionado, setTipoEmpaqueSeleccionado] =
    useState("Bulto");
  const [pesoKg, setPesoKg] = useState("50");
  const [pesoLb, setPesoLb] = useState("100");
  const [empaqueMeta, setEmpaqueMeta] = useState(null);
  const descripcion = "Registrado desde pedido";

  const [prevProductItem, setPrevProductItem] = useState(productItem);
  if (productItem !== prevProductItem) {
    setPrevProductItem(productItem);
    if (productItem) {
      setNombreModificado((productItem.producto || "").toUpperCase());
      setActiveTab(
        similarOptions && similarOptions.length > 0 ? "similar" : "new",
      );
      if (tiposEmpaque.length > 0) {
        setTipoEmpaqueSeleccionado(tiposEmpaque[0].nombre || "Bulto");
        const defaultKg = tiposEmpaque[0].peso_kg || 50;
        setPesoKg(defaultKg.toString());
        setPesoLb((tiposEmpaque[0].peso_lb || defaultKg * 2).toString());
      }
      setUnidadSeleccionada(productItem.unidad || "Kg");
    }
  }

  if (!isOpen || !productItem) return null;

  const handleUnitChange = (nuevaUnidad, meta) => {
    setUnidadSeleccionada(nuevaUnidad);
    setEmpaqueMeta(meta);
    if (meta.peso_kg) {
      setPesoKg(meta.peso_kg.toString());
      setPesoLb((meta.peso_lb || meta.peso_kg * 2).toString());
    }
    if (meta.isEmpaque) {
      setTipoEmpaqueSeleccionado(nuevaUnidad);
    }
  };

  const handleKgChange = (kgVal) => {
    setPesoKg(kgVal);
    const num = parseFloat(kgVal) || 0;
    setPesoLb(num > 0 ? (num * 2).toString() : "");
  };

  const handleAddTalCual = () => {
    const raw = (productItem.producto || "").trim().toUpperCase();
    if (!raw) return;
    if (onAddNewProduct) {
      onAddNewProduct({
        producto: raw,
        unidad: unidadSeleccionada,
        presentacion: tipoEmpaqueSeleccionado || "Bulto",
        peso_kg: parseFloat(pesoKg) || 50,
        peso_lb: parseFloat(pesoLb) || 100,
        empaque_info: empaqueMeta?.isEmpaque
          ? {
              presentacion: tipoEmpaqueSeleccionado || unidadSeleccionada,
              peso_kg: parseFloat(pesoKg) || 50,
              peso_lb: parseFloat(pesoLb) || 100,
            }
          : null,
        descripcion: descripcion || "Registrado desde pedido",
      });
    }
    onClose();
  };

  const handleAddModificado = (e) => {
    e.preventDefault();
    const finalName = nombreModificado.trim().toUpperCase();
    if (!finalName) return;
    if (onAddNewProduct) {
      onAddNewProduct({
        producto: finalName,
        unidad: unidadSeleccionada,
        presentacion: tipoEmpaqueSeleccionado || "Bulto",
        peso_kg: parseFloat(pesoKg) || 50,
        peso_lb: parseFloat(pesoLb) || 100,
        empaque_info: empaqueMeta?.isEmpaque
          ? {
              presentacion: tipoEmpaqueSeleccionado || unidadSeleccionada,
              peso_kg: parseFloat(pesoKg) || 50,
              peso_lb: parseFloat(pesoLb) || 100,
            }
          : null,
        descripcion: descripcion || "Registrado desde pedido",
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
              {similarOptions.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-300" />
              ) : (
                <Sparkles className="w-5 h-5 text-emerald-200" />
              )}
            </div>
            <div>
              <h3 className="font-black text-sm sm:base leading-tight">
                {similarOptions.length > 0
                  ? "Estandarizar Nombre de Producto"
                  : "Añadir Nuevo Producto al Catálogo"}
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Ítem ingresado:{" "}
                <strong className="text-white underline decoration-emerald-300">
                  "{productItem.producto}"
                </strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas si hay opciones similares */}
        {similarOptions.length > 0 && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-black">
            <button
              type="button"
              onClick={() => setActiveTab("similar")}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === "similar"
                  ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Opciones Similares ({similarOptions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("new")}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === "new"
                  ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Añadir como Nuevo</span>
            </button>
          </div>
        )}

        {/* Contenido del modal */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* VISTA 1: PRODUCTOS SIMILARES / AMBIGUOS */}
          {activeTab === "similar" && similarOptions.length > 0 && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 rounded-2xl flex items-start gap-2.5 text-amber-950 dark:text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  En el pedido colocaron{" "}
                  <strong>"{productItem.producto}"</strong>. Seleccione el
                  producto formal creado en el sistema para ajustar el pedido
                  sin errores:
                </span>
              </div>

              <div className="space-y-2">
                {similarOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (onSelectExisting) onSelectExisting(opt);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/40 active:scale-[0.99] transition flex items-center justify-between group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-700 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 text-slate-600 dark:text-slate-300 font-black text-xs flex items-center justify-center transition">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs uppercase text-slate-800 dark:text-slate-100 group-hover:text-emerald-900 dark:group-hover:text-emerald-300">
                        {opt}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 text-xs font-bold transition">
                      <span>Usar este</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* VISTA 2: AÑADIR NUEVO PRODUCTO AL CATÁLOGO */}
          {activeTab === "new" && (
            <form onSubmit={handleAddModificado} className="space-y-3.5">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-2.5 text-emerald-950 dark:text-emerald-300 text-xs">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  ¿Desea registrar <strong>"{productItem.producto}"</strong> en
                  el catálogo para futuros pedidos? Puede añadirlo tal cual o
                  modificar su nombre y parámetros de pesaje:
                </span>
              </div>

              {/* Modificación de nombre */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Nombre del Producto *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold uppercase text-slate-900 dark:text-slate-100 bg-slate-50/60 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition text-xs shadow-2xs"
                    value={nombreModificado}
                    onChange={(e) =>
                      setNombreModificado(e.target.value.toUpperCase())
                    }
                  />
                  <Edit3 className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Unidad de Medida / Empaque estandarizado */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Unidad de Medida / Empaque
                </label>
                <UnitSelector
                  value={unidadSeleccionada}
                  tiposEmpaque={tiposEmpaque}
                  onChange={handleUnitChange}
                />
              </div>

              {/* Medida inicial estandarizada (Pesos) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Peso Kg */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Peso en Kg *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-center font-black text-slate-900 dark:text-slate-100 bg-slate-50/60 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-xs tabular-nums shadow-2xs"
                    value={pesoKg}
                    onChange={(e) => handleKgChange(e.target.value)}
                  />
                </div>

                {/* Peso Lb */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Peso en Lb
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-center font-bold text-slate-700 dark:text-slate-200 bg-slate-50/60 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-xs tabular-nums shadow-2xs"
                    value={pesoLb}
                    onChange={(e) => setPesoLb(e.target.value)}
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleAddTalCual}
                  className="w-full sm:w-auto bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-800 dark:text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Añadir Tal Cual ("{productItem.producto}")</span>
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar con Nombre Modificado</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
