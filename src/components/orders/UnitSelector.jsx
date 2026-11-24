import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDown,
  Search,
  Check,
  Scale,
  Package,
  Settings,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  getAllAvailableUnits,
  matchUnitWithCatalog,
  normalizeUnitText,
} from "../../utils/unitMatcher";

export default function UnitSelector({
  value = "Kg",
  onChange,
  tiposEmpaque = [],
  disabled = false,
  compact = false,
  className = "",
  placeholder = "Unidad",
  ariaLabel = "Seleccionar unidad de medida",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Estados de medida personalizada
  const [customNombre, setCustomNombre] = useState("");
  const [customPesoKg, setCustomPesoKg] = useState("");
  const [customPesoLb, setCustomPesoLb] = useState("");

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const allUnits = useMemo(() => {
    return getAllAvailableUnits(tiposEmpaque);
  }, [tiposEmpaque]);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setIsCustomMode(false);
        setSearchTerm("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Auto-focus en el input de búsqueda al abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Coincidencia actual de la unidad
  const currentMatch = useMemo(() => {
    return matchUnitWithCatalog(value, allUnits);
  }, [value, allUnits]);

  // Sugerencia de similitud para lo que el usuario está buscando
  const searchSimilarity = useMemo(() => {
    if (!searchTerm.trim()) return null;
    return matchUnitWithCatalog(searchTerm, allUnits);
  }, [searchTerm, allUnits]);

  // Filtrado de opciones en tiempo real
  const filteredUnits = useMemo(() => {
    if (!searchTerm.trim()) return allUnits;
    const term = normalizeUnitText(searchTerm);
    return allUnits.filter((u) => {
      const nom = normalizeUnitText(u.nombre);
      const abr = normalizeUnitText(u.abreviatura);
      const desc = normalizeUnitText(u.descripcion || "");
      return nom.includes(term) || abr.includes(term) || desc.includes(term);
    });
  }, [searchTerm, allUnits]);

  // Separar en Clásicas y Empaques
  const clasicas = useMemo(
    () => filteredUnits.filter((u) => u.tipo === "clasica"),
    [filteredUnits],
  );
  const empaques = useMemo(
    () => filteredUnits.filter((u) => u.tipo === "empaque"),
    [filteredUnits],
  );

  const handleSelectUnit = (unit) => {
    if (onChange) {
      onChange(unit.abreviatura || unit.nombre, {
        peso_kg: unit.peso_kg || 1.0,
        peso_lb: unit.peso_lb || (unit.peso_kg ? unit.peso_kg * 2 : 2.0),
        isEmpaque: unit.tipo === "empaque",
        descripcion: unit.descripcion,
        nombre: unit.nombre,
      });
    }
    setIsOpen(false);
    setIsCustomMode(false);
    setSearchTerm("");
  };

  const handleApplyCustom = (e) => {
    e?.preventDefault();
    if (!customNombre.trim()) return;
    const kg = parseFloat(customPesoKg) || 1.0;
    const lb = parseFloat(customPesoLb) || kg * 2;
    if (onChange) {
      onChange(customNombre.trim(), {
        peso_kg: kg,
        peso_lb: lb,
        isEmpaque: true,
        descripcion: `Medida personalizada (${kg} Kg / ${lb} Lb)`,
        nombre: customNombre.trim(),
        isCustom: true,
      });
    }
    setIsOpen(false);
    setIsCustomMode(false);
    setCustomNombre("");
    setCustomPesoKg("");
    setCustomPesoLb("");
    setSearchTerm("");
  };

  // Sincronizar kilos a libras en personalizado
  const handleCustomKgChange = (kgVal) => {
    setCustomPesoKg(kgVal);
    const num = parseFloat(kgVal);
    if (!isNaN(num) && num > 0) {
      setCustomPesoLb((num * 2).toFixed(1));
    } else {
      setCustomPesoLb("");
    }
  };

  // Etiqueta visual amigable
  const displayLabel = useMemo(() => {
    if (!value) return placeholder;
    if (currentMatch.exactMatch) {
      return (
        currentMatch.exactMatch.abreviatura || currentMatch.exactMatch.nombre
      );
    }
    return value;
  }, [value, currentMatch, placeholder]);

  const isCurrentEmpaque =
    currentMatch.exactMatch?.tipo === "empaque" ||
    ["BULTO", "PONY", "CANASTILLA", "CAJA", "SACO", "HUACAL", "MALLA"].includes(
      normalizeUnitText(value),
    );

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Botón Disparador del Selector */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        className={`w-full flex items-center justify-between gap-1 border border-slate-200 dark:border-slate-700 rounded-xl transition shadow-2xs font-bold text-slate-800 dark:text-slate-200 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer ${
          compact
            ? "px-2 py-1 text-xs bg-white dark:bg-slate-900 hover:border-emerald-400"
            : "p-2.5 text-xs sm:text-sm bg-slate-50/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
        } ${isOpen ? "ring-2 ring-emerald-500 border-emerald-500 bg-white dark:bg-slate-900" : ""}`}
      >
        <span className="truncate flex items-center gap-1">
          {isCurrentEmpaque ? (
            <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <Scale className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          )}
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
          }`}
        />
      </button>

      {/* Popover Desplegable (Con contención estricta para evitar salirse de márgenes) */}
      {isOpen && (
        <>
          {/* Backdrop para cerrar al hacer tap fuera (en móvil) */}
          <div
            className="fixed inset-0 z-40 sm:hidden bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => {
              setIsOpen(false);
              setIsCustomMode(false);
            }}
          />

          {/* Contenedor Popover: Centrado en Móvil (sin scroll horizontal) y anclado a la derecha en Desktop */}
          <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-1/2 sm:top-full -translate-y-1/2 sm:translate-y-0 z-50 sm:mt-1.5 w-auto sm:w-80 max-w-sm sm:max-w-xs max-h-[85vh] sm:max-h-[480px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl sm:shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header con Buscador y botón cerrar en móvil */}
            <div className="p-2.5 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar unidad o empaque..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsCustomMode(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (filteredUnits.length > 0) {
                        handleSelectUnit(filteredUnits[0]);
                      } else if (
                        searchSimilarity &&
                        searchSimilarity.status === "SIMILAR" &&
                        searchSimilarity.similarMatches.length > 0
                      ) {
                        handleSelectUnit(searchSimilarity.similarMatches[0]);
                      } else if (searchTerm.trim()) {
                        setIsCustomMode(true);
                        setCustomNombre(searchTerm.trim());
                      }
                    } else if (e.key === "Escape") {
                      setIsOpen(false);
                      setIsCustomMode(false);
                    }
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsCustomMode(false);
                }}
                className="sm:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                title="Cerrar selector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alerta de Similitud si lo que busca coincide aproximadamente */}
            {searchSimilarity &&
              searchSimilarity.status === "SIMILAR" &&
              searchSimilarity.similarMatches.length > 0 && (
                <div className="mt-2 p-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between gap-1 text-[10px]">
                  <div className="flex items-center gap-1 text-amber-900 dark:text-amber-200 font-bold truncate">
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate">¿Quiso decir:</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {searchSimilarity.similarMatches.slice(0, 2).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectUnit(s)}
                        className="bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-amber-300 dark:border-amber-700 hover:border-emerald-400 text-amber-950 dark:text-amber-200 font-black px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition shadow-2xs"
                      >
                        {s.abreviatura || s.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

          {/* Sub-formulario de Medida Personalizada */}
          {isCustomMode ? (
            <div className="p-3 bg-amber-50/40 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800/80 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>Otra Medida Personalizada</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                  Nombre de la medida / empaque *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Canastilla 10kg, Caja Madera, Huacalito..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                  value={customNombre}
                  onChange={(e) => setCustomNombre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyCustom(e);
                    } else if (e.key === "Escape") {
                      setIsCustomMode(false);
                    }
                  }}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                    Peso en Kg (opcional)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="Ej: 10"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={customPesoKg}
                    onChange={(e) => handleCustomKgChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCustom(e);
                      } else if (e.key === "Escape") {
                        setIsCustomMode(false);
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                    Peso en Lb (aprox)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="Ej: 20"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
                    value={customPesoLb}
                    onChange={(e) => setCustomPesoLb(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!customNombre.trim()}
                  onClick={handleApplyCustom}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Usar Medida</span>
                </button>
              </div>
            </div>
          ) : (
            /* Lista Desplazable de Opciones */
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs custom-scrollbar">
              {/* Sección 1: Unidades Clásicas */}
              {clasicas.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-slate-400" />
                    <span>Unidades de Medida Clásicas</span>
                  </div>
                  <div className="space-y-0.5">
                    {clasicas.map((u) => {
                      const isSelected =
                        normalizeUnitText(value) ===
                          normalizeUnitText(u.abreviatura) ||
                        normalizeUnitText(value) ===
                          normalizeUnitText(u.nombre);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectUnit(u)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2 transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 font-black border border-emerald-200 dark:border-emerald-800"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="block truncate">
                              {u.nombre}{" "}
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({u.abreviatura})
                              </span>
                            </span>
                            {u.descripcion && (
                              <span className="block text-[9px] text-slate-400 truncate">
                                {u.descripcion}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sección 2: Tipos de Empaque Estandarizados */}
              {empaques.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Package className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Tipos de Empaque Fruver</span>
                  </div>
                  <div className="space-y-0.5">
                    {empaques.map((u) => {
                      const isSelected =
                        normalizeUnitText(value) ===
                          normalizeUnitText(u.abreviatura) ||
                        normalizeUnitText(value) ===
                          normalizeUnitText(u.nombre);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectUnit(u)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2 transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 font-black border border-emerald-200 dark:border-emerald-800"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="block truncate">
                              {u.nombre}{" "}
                              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-1 py-0.2 rounded">
                                {u.peso_kg} Kg
                              </span>
                            </span>
                            <span className="block text-[9px] text-slate-400 truncate">
                              {u.descripcion ||
                                `${u.peso_kg} Kg / ${u.peso_lb} Lb`}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredUnits.length === 0 && (
                <div className="p-4 text-center text-slate-400 text-xs italic">
                  No se encontró "{searchTerm}".
                </div>
              )}
            </div>
          )}

          {/* Opción Permanente: Otra Medida Personalizada */}
          {!isCustomMode && (
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsCustomMode(true);
                  if (searchTerm) setCustomNombre(searchTerm);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 flex items-center gap-2 transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                <span className="truncate">
                  ⚙️ Otra medida personalizada...
                </span>
              </button>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}
