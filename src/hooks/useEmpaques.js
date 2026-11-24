import { useState, useEffect, useCallback, useRef } from "react";
import { empaqueApi, DEFAULT_TIPOS } from "../api/empaqueApi";
import { productApi } from "../api/productApi";
import { useToast } from "../context/ToastContext";
import {
  esUnidadClasica,
  coincideUnidadConEmpaque,
} from "../utils/unitMatcher";
import { normalizeText } from "../utils/productMatcher";

export { DEFAULT_TIPOS };

const CACHE_KEY_TIPOS = "app_tipos_empaque_cache";
const CACHE_KEY_PRODUCTOS = "app_productos_catalogo_cache";

export function useEmpaques() {
  const { showToast } = useToast();

  const [tiposEmpaque, setTiposEmpaque] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_TIPOS);
      return cached ? JSON.parse(cached) : DEFAULT_TIPOS;
    } catch {
      return DEFAULT_TIPOS;
    }
  });

  const [productosCatalogo, setProductosCatalogo] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_PRODUCTOS);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [cargando, setCargando] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const isFetchingRef = useRef(false);

  // Carga de datos con stale-while-revalidate
  const cargarDatos = useCallback(
    async (isSilent = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      if (!isSilent) setCargando(true);

      try {
        const [dataTipos, dataProds] = await Promise.all([
          empaqueApi.getAll(),
          productApi.getAll().catch(() => []),
        ]);

        if (Array.isArray(dataTipos) && dataTipos.length > 0) {
          setTiposEmpaque(dataTipos);
          try {
            localStorage.setItem(CACHE_KEY_TIPOS, JSON.stringify(dataTipos));
          } catch {
            // ignore cache error
          }
        }

        if (Array.isArray(dataProds) && dataProds.length > 0) {
          setProductosCatalogo(dataProds);
          try {
            localStorage.setItem(
              CACHE_KEY_PRODUCTOS,
              JSON.stringify(dataProds),
            );
          } catch {
            // ignore cache error
          }
        }
      } catch {
        if (!isSilent) {
          showToast("Error al sincronizar catálogo de empaques.", "error");
        }
      } finally {
        isFetchingRef.current = false;
        if (!isSilent) setCargando(false);
        setIsInitialized(true);
      }
    },
    [showToast],
  );

  useEffect(() => {
    Promise.resolve().then(() => {
      cargarDatos(true);
    });

    const handleProductsUpdated = () => {
      isFetchingRef.current = false;
      cargarDatos(true);
    };
    window.addEventListener("catalog_products_updated", handleProductsUpdated);
    window.addEventListener("storage", handleProductsUpdated);
    return () => {
      window.removeEventListener("catalog_products_updated", handleProductsUpdated);
      window.removeEventListener("storage", handleProductsUpdated);
    };
  }, [cargarDatos]);

  // =========================================================================
  // OPERACIONES DE TIPOS DE EMPAQUE ESTANDARIZADOS (3NF)
  // =========================================================================

  const guardarTipo = async (id, payload) => {
    try {
      let resultado;
      if (id) {
        resultado = await empaqueApi.update(id, payload);
        setTiposEmpaque((prev) =>
          prev.map((t) => (t.id === id ? resultado : t)),
        );
      } else {
        resultado = await empaqueApi.create(payload);
        setTiposEmpaque((prev) => [...prev, resultado]);
      }
      return resultado;
    } catch (err) {
      showToast("Error al guardar tipo de empaque.", "error");
      throw err;
    }
  };

  const eliminarTipo = async (id) => {
    try {
      await empaqueApi.delete(id);
      setTiposEmpaque((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      showToast("Error al eliminar tipo de empaque.", "error");
      throw err;
    }
  };

  // =========================================================================
  // BÚSQUEDA Y EMPAQUES ASIGNADOS A UN PRODUCTO
  // =========================================================================

  const buscarProductoEnCatalogo = useCallback(
    (nombre) => {
      if (!nombre || !productosCatalogo.length) return null;
      const norm = normalizeText(nombre);
      if (!norm) return null;

      // 1. Coincidencia exacta
      let found = productosCatalogo.find(
        (p) => normalizeText(p.nombre) === norm,
      );
      if (found) return found;

      // 2. Coincidencia por inclusión
      found = productosCatalogo.find((p) => {
        const pNorm = normalizeText(p.nombre);
        return (
          pNorm &&
          (pNorm === norm ||
            pNorm.startsWith(norm) ||
            norm.startsWith(pNorm) ||
            pNorm.includes(norm) ||
            norm.includes(pNorm))
        );
      });

      return found || null;
    },
    [productosCatalogo],
  );

  const obtenerEmpaquesDeProducto = useCallback(
    (productoNombreOObjeto) => {
      const prod =
        typeof productoNombreOObjeto === "object" &&
        productoNombreOObjeto !== null
          ? productoNombreOObjeto
          : buscarProductoEnCatalogo(productoNombreOObjeto);

      if (!prod) return [];

      const list = [];
      const seenIds = new Set();
      const seenNames = new Set();

      // 1. Empaques permitidos con sus pesos específicos/personalizados
      if (Array.isArray(prod.empaques_permitidos)) {
        for (const emp of prod.empaques_permitidos) {
          if (emp.activo === false) continue;
          const pkg = parseFloat(emp.peso_kg) || 0;
          const plb =
            parseFloat(emp.peso_lb) ||
            (pkg > 0 ? parseFloat((pkg * 2).toFixed(2)) : 0);
          const pkgDefault = parseFloat(
            emp.peso_kg_default !== undefined && emp.peso_kg_default !== null
              ? emp.peso_kg_default
              : pkg,
          );
          const presName = (emp.nombre || emp.presentacion || "").trim();
          const nameKey = presName.toUpperCase();

          if (!seenNames.has(nameKey) && !seenIds.has(emp.id)) {
            seenNames.add(nameKey);
            seenIds.add(emp.id);
            list.push({
              id: emp.id,
              tipo_empaque_id: emp.id,
              nombre: presName,
              presentacion: presName,
              peso_kg: pkg,
              peso_lb: plb,
              peso_kg_default: pkgDefault,
              descripcion: emp.descripcion || "",
              esPersonalizado: Math.abs(pkg - pkgDefault) > 0.001,
              activo: true,
              origen: "producto_empaques_permitidos",
            });
          }
        }
      }

      // 2. Tipo de empaque asignado por defecto al producto si no estaba ya listado por ID ni nombre
      if (
        prod.tipo_empaque &&
        prod.tipo_empaque.activo !== false &&
        !seenIds.has(prod.tipo_empaque.id) &&
        !seenNames.has((prod.tipo_empaque.nombre || "").trim().toUpperCase())
      ) {
        const pkg = parseFloat(prod.tipo_empaque.peso_kg) || 0;
        const plb =
          parseFloat(prod.tipo_empaque.peso_lb) ||
          (pkg > 0 ? parseFloat((pkg * 2).toFixed(2)) : 0);
        const presName = (prod.tipo_empaque.nombre || "").trim();

        seenIds.add(prod.tipo_empaque.id);
        seenNames.add(presName.toUpperCase());
        list.push({
          id: prod.tipo_empaque.id,
          tipo_empaque_id: prod.tipo_empaque.id,
          nombre: presName,
          presentacion: presName,
          peso_kg: pkg,
          peso_lb: plb,
          peso_kg_default: pkg,
          descripcion: prod.tipo_empaque.descripcion || "",
          esPersonalizado: false,
          activo: true,
          origen: "producto_tipo_empaque",
        });
      }

      return list;
    },
    [buscarProductoEnCatalogo],
  );

  // =========================================================================
  // RESOLVER EMPAQUE PARA ÍTEMS DE PEDIDO
  // =========================================================================

  const resolverTipoEmpaque = useCallback(
    (item) => {
      if (!item) return null;
      const unidad = (item.unidad || "").trim();

      // Si es una medida directa por peso o conteo, no es empaque masivo
      if (esUnidadClasica(unidad)) {
        return null;
      }

      // Prioridad 1: El ítem ya trae empaque_info estructurado con peso válido
      if (
        item.empaque_info &&
        parseFloat(item.empaque_info.peso_kg) > 0 &&
        coincideUnidadConEmpaque(
          unidad,
          item.empaque_info.presentacion || item.empaque_info.nombre,
        )
      ) {
        const pesoKg = parseFloat(item.empaque_info.peso_kg);
        const pesoLb =
          parseFloat(item.empaque_info.peso_lb) ||
          parseFloat((pesoKg * 2).toFixed(2));
        return {
          id: item.empaque_info.id || null,
          nombre: item.empaque_info.presentacion || item.unidad,
          presentacion: item.empaque_info.presentacion || item.unidad,
          peso_kg: pesoKg,
          peso_lb: pesoLb,
          descripcion: item.empaque_info.descripcion || "",
          esPersonalizado: Boolean(item.empaque_info.esPersonalizado),
          origen: "empaque_info",
        };
      }

      // Prioridad 2: Buscar empaques asignados con peso personalizado para este producto
      const nombreProd = (item.producto || item.nombre || "").trim();
      if (nombreProd) {
        const empaquesProd = obtenerEmpaquesDeProducto(nombreProd);
        const matchingProdEmp = empaquesProd.find((e) =>
          coincideUnidadConEmpaque(unidad, e.nombre || e.presentacion),
        );
        if (matchingProdEmp && parseFloat(matchingProdEmp.peso_kg) > 0) {
          return {
            ...matchingProdEmp,
            origen: "producto_personalizado",
          };
        }
      }

      // Prioridad 3: Si el ítem ya trae tipo_empaque asociado desde el producto
      if (
        item.tipo_empaque &&
        parseFloat(item.tipo_empaque.peso_kg) > 0 &&
        coincideUnidadConEmpaque(unidad, item.tipo_empaque.nombre)
      ) {
        const pesoKg = parseFloat(item.tipo_empaque.peso_kg);
        const pesoLb =
          parseFloat(item.tipo_empaque.peso_lb) ||
          parseFloat((pesoKg * 2).toFixed(2));
        return {
          id: item.tipo_empaque.id,
          nombre: item.tipo_empaque.nombre,
          presentacion: item.tipo_empaque.nombre,
          peso_kg: pesoKg,
          peso_lb: pesoLb,
          descripcion: item.tipo_empaque.descripcion || "",
          esPersonalizado: false,
          origen: "producto_tipo_empaque",
        };
      }

      // Prioridad 4: Catálogo general de Tipos de Empaque Estandarizados
      const tipoPorUnidad = tiposEmpaque.find((t) =>
        coincideUnidadConEmpaque(unidad, t.nombre),
      );

      if (tipoPorUnidad && parseFloat(tipoPorUnidad.peso_kg) > 0) {
        const pesoKg = parseFloat(tipoPorUnidad.peso_kg);
        const pesoLb =
          parseFloat(tipoPorUnidad.peso_lb) ||
          parseFloat((pesoKg * 2).toFixed(2));
        return {
          id: tipoPorUnidad.id,
          nombre: tipoPorUnidad.nombre,
          presentacion: tipoPorUnidad.nombre,
          peso_kg: pesoKg,
          peso_lb: pesoLb,
          descripcion: tipoPorUnidad.descripcion || "",
          esPersonalizado: false,
          origen: "tipo_estandarizado",
        };
      }

      return null;
    },
    [tiposEmpaque, obtenerEmpaquesDeProducto],
  );

  return {
    tiposEmpaque,
    empaques: tiposEmpaque, // Compatibilidad limpia: empaques es el catálogo de tipos
    productosCatalogo,
    cargando,
    isInitialized,
    cargarDatos,
    guardarTipo,
    eliminarTipo,
    guardarEmpaque: guardarTipo,
    eliminarEmpaque: eliminarTipo,
    buscarProductoEnCatalogo,
    obtenerEmpaquesDeProducto,
    resolverTipoEmpaque,
  };
}
