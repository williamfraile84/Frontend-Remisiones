import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Scale,
  Package,
  Calculator,
  Check,
  Info,
  ExternalLink,
} from "lucide-react";
import { formatMoney, parseMoney } from "../../utils/currency";
import { redondearCentena } from "../../utils/math";
import { empaqueApi } from "../../api/empaqueApi";
import { productApi } from "../../api/productApi";
import { DEFAULT_TIPOS } from "../../hooks/useEmpaques";
import {
  esUnidadClasica,
  coincideUnidadConEmpaque,
} from "../../utils/unitMatcher";
import { normalizeText } from "../../utils/productMatcher";

export default function PackageCostCalculatorModal({
  isOpen,
  onClose,
  item,
  onApply,
  onOpenPresentaciones,
  tiposEmpaqueProp = null,
  empaquesProp = null,
  productosCatalogoProp = null,
  obtenerEmpaquesDeProductoProp = null,
}) {
  const [presentaciones, setPresentaciones] = useState([]);
  const [tiposEmpaque, setTiposEmpaque] = useState(
    Array.isArray(tiposEmpaqueProp) && tiposEmpaqueProp.length > 0
      ? tiposEmpaqueProp
      : DEFAULT_TIPOS,
  );
  const [cargando, setCargando] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState("");
  const [esPersonalizado, setEsPersonalizado] = useState(false);

  // Modo de base de cálculo: "kilos" (por defecto según requerimiento comercial) | "libras"
  const [baseCalculo, setBaseCalculo] = useState("kilos");

  // Valores de medida (Kg y Lb)
  const [nombrePresentacion, setNombrePresentacion] = useState("Bulto");
  const [pesoKg, setPesoKg] = useState(50);
  const [pesoLb, setPesoLb] = useState(100);

  // Valores de compra
  const [cantidadEmpaques, setCantidadEmpaques] = useState(1);
  const [modoIngreso, setModoIngreso] = useState("total"); // "total" | "unitario" | "kilo" | "libra"
  const [valorTotal, setValorTotal] = useState(0);
  const [valorUnitario, setValorUnitario] = useState(0);
  const [valorPorKilo, setValorPorKilo] = useState(0);
  const [valorPorLibra, setValorPorLibra] = useState(0);

  // Sincronizar tipos si vienen de props mediante ajuste directo durante el render
  const [prevTiposProp, setPrevTiposProp] = useState(tiposEmpaqueProp);
  if (tiposEmpaqueProp !== prevTiposProp) {
    setPrevTiposProp(tiposEmpaqueProp);
    if (Array.isArray(tiposEmpaqueProp) && tiposEmpaqueProp.length > 0) {
      setTiposEmpaque(tiposEmpaqueProp);
    }
  }

  // Cargar catálogo completo y empaques asignados al producto cuando se abre el modal
  useEffect(() => {
    if (!isOpen || !item) return;

    let isMounted = true;

    const cargar = async () => {
      setCargando(true);
      try {
        let tipos = tiposEmpaqueProp;
        let prods = productosCatalogoProp;

        if (!tipos?.length || !prods?.length) {
          const [dataTipos, dataProds] = await Promise.all([
            tipos && tipos.length > 0 ? Promise.resolve(tipos) : empaqueApi.getTipos(),
            prods && prods.length > 0
              ? Promise.resolve(prods)
              : productApi.getAll().catch(() => []),
          ]);
          tipos = dataTipos && dataTipos.length > 0 ? dataTipos : DEFAULT_TIPOS;
          prods = dataProds && dataProds.length > 0 ? dataProds : [];
        }

        if (!isMounted) return;

        // Deduplicar tipos de empaque estandarizados
        const tiposUnicos = [];
        const tiposSeen = new Set();
        for (const t of tipos || []) {
          const tName = (t.nombre || "").trim();
          const tKg = parseFloat(t.peso_kg) || 0;
          const key = `${tName.toLowerCase()}_${tKg}`;
          if (!tiposSeen.has(key)) {
            tiposSeen.add(key);
            tiposUnicos.push(t);
          }
        }

        // Obtener empaques asignados a este producto específico
        let unicos = [];
        const nombreProd = (item.producto || item.nombre || "").trim();

        if (obtenerEmpaquesDeProductoProp && nombreProd) {
          unicos = obtenerEmpaquesDeProductoProp(nombreProd) || [];
        }

        const extraerEmpaquesDeProducto = (matchingProd) => {
          const res = [];
          if (!matchingProd) return res;
          const seenIds = new Set();
          const seenNames = new Set();
          if (Array.isArray(matchingProd.empaques_permitidos)) {
            for (const emp of matchingProd.empaques_permitidos) {
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
                res.push({
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

          if (
            matchingProd.tipo_empaque &&
            matchingProd.tipo_empaque.activo !== false &&
            !seenIds.has(matchingProd.tipo_empaque.id) &&
            !seenNames.has(
              (matchingProd.tipo_empaque.nombre || "").trim().toUpperCase(),
            )
          ) {
            const pkg = parseFloat(matchingProd.tipo_empaque.peso_kg) || 0;
            const plb =
              parseFloat(matchingProd.tipo_empaque.peso_lb) ||
              (pkg > 0 ? parseFloat((pkg * 2).toFixed(2)) : 0);
            const presName = (matchingProd.tipo_empaque.nombre || "").trim();

            seenIds.add(matchingProd.tipo_empaque.id);
            seenNames.add(presName.toUpperCase());
            res.push({
              id: matchingProd.tipo_empaque.id,
              tipo_empaque_id: matchingProd.tipo_empaque.id,
              nombre: presName,
              presentacion: presName,
              peso_kg: pkg,
              peso_lb: plb,
              peso_kg_default: pkg,
              descripcion: matchingProd.tipo_empaque.descripcion || "",
              esPersonalizado: false,
              activo: true,
              origen: "producto_tipo_empaque",
            });
          }
          return res;
        };

        if ((!unicos || unicos.length === 0) && nombreProd) {
          const normProd = normalizeText(nombreProd);
          let matchingProd = (prods || []).find((p) => {
            const pNorm = normalizeText(p.nombre || "");
            return (
              pNorm === normProd ||
              (pNorm &&
                normProd &&
                (pNorm.startsWith(normProd) || normProd.startsWith(pNorm) || pNorm.includes(normProd) || normProd.includes(pNorm)))
            );
          });

          // Si aún no se encuentra o no tiene empaques en prods, recargar directo de la API en vivo
          if (!matchingProd || (!matchingProd.empaques_permitidos?.length && !matchingProd.tipo_empaque)) {
            try {
              const freshProds = await productApi.getAll();
              if (Array.isArray(freshProds) && freshProds.length > 0) {
                prods = freshProds;
                matchingProd = freshProds.find((p) => {
                  const pNorm = normalizeText(p.nombre || "");
                  return (
                    pNorm === normProd ||
                    (pNorm &&
                      normProd &&
                      (pNorm.startsWith(normProd) || normProd.startsWith(pNorm) || pNorm.includes(normProd) || normProd.includes(pNorm)))
                  );
                });
              }
            } catch {
              // fallback silencioso
            }
          }

          if (matchingProd) {
            unicos = extraerEmpaquesDeProducto(matchingProd);
          }
        }

        setTiposEmpaque(tiposUnicos);
        setPresentaciones(unicos);

        const uNorm = (item.unidad || "").trim();

        // 1. Prioridad: ¿Ya tenía empaque_info registrado previamente este ítem?
        if (
          item.empaque_info?.presentacion &&
          parseFloat(item.empaque_info.peso_kg) > 0
        ) {
          const infoPres = (item.empaque_info.presentacion || "").trim();
          const matchingPres = unicos.find(
            (p) =>
              coincideUnidadConEmpaque(infoPres, p.presentacion || p.nombre) ||
              (p.presentacion || "").trim().toLowerCase() ===
                infoPres.toLowerCase(),
          );
          const matchingTipo = tiposUnicos.find(
            (t) =>
              coincideUnidadConEmpaque(infoPres, t.nombre) ||
              (t.nombre || "").trim().toLowerCase() === infoPres.toLowerCase(),
          );

          if (matchingPres) {
            setSeleccionadoId(`pres_${matchingPres.id}`);
            setNombrePresentacion(matchingPres.presentacion);
            const pKg = parseFloat(matchingPres.peso_kg) || 25;
            const pLb =
              parseFloat(matchingPres.peso_lb) ||
              parseFloat((pKg * 2).toFixed(2));
            setPesoKg(pKg);
            setPesoLb(pLb);
            setEsPersonalizado(false);
          } else if (matchingTipo) {
            setSeleccionadoId(`tipo_${matchingTipo.id}`);
            setNombrePresentacion(matchingTipo.nombre);
            const pKg =
              parseFloat(item.empaque_info.peso_kg) ||
              parseFloat(matchingTipo.peso_kg) ||
              50;
            const pLb =
              parseFloat(item.empaque_info.peso_lb) ||
              parseFloat(matchingTipo.peso_lb) ||
              parseFloat((pKg * 2).toFixed(2));
            setPesoKg(pKg);
            setPesoLb(pLb);
            setEsPersonalizado(false);
          } else {
            setSeleccionadoId("custom");
            setNombrePresentacion(infoPres);
            const pKg = parseFloat(item.empaque_info.peso_kg) || 50;
            const pLb =
              parseFloat(item.empaque_info.peso_lb) ||
              parseFloat((pKg * 2).toFixed(2));
            setPesoKg(pKg);
            setPesoLb(pLb);
            setEsPersonalizado(true);
          }

          const cantEmp =
            parseFloat(item.empaque_info.cantidad_empaques) ||
            parseFloat(item.cantidad) ||
            1;
          setCantidadEmpaques(cantEmp);

          const vTot =
            parseFloat(item.empaque_info.valor_total_compra) ||
            parseFloat(item.valor_compra_total) ||
            0;
          setValorTotal(vTot);
          const vUnit = cantEmp > 0 ? Math.round(vTot / cantEmp) : 0;
          setValorUnitario(vUnit);
          const pK = parseFloat(item.empaque_info.peso_kg) || 50;
          const pL = parseFloat(item.empaque_info.peso_lb) || pK * 2;
          const totKg = cantEmp * pK;
          setValorPorKilo(totKg > 0 ? redondearCentena(vTot / totKg) : 0);
          const totLb = cantEmp * pL;
          setValorPorLibra(totLb > 0 ? Math.round(vTot / totLb) : 0);
        }
        // 2. Prioridad: ¿La unidad coincide con un empaque asignado al producto?
        else if (
          uNorm &&
          !esUnidadClasica(uNorm) &&
          unicos.some((p) =>
            coincideUnidadConEmpaque(uNorm, p.presentacion || p.nombre),
          )
        ) {
          const matchingPres = unicos.find((p) =>
            coincideUnidadConEmpaque(uNorm, p.presentacion || p.nombre),
          );
          setSeleccionadoId(`pres_${matchingPres.id}`);
          setNombrePresentacion(matchingPres.presentacion);
          const pKg = parseFloat(matchingPres.peso_kg) || 25;
          const pLb =
            parseFloat(matchingPres.peso_lb) ||
            parseFloat((pKg * 2).toFixed(2));
          setPesoKg(pKg);
          setPesoLb(pLb);
          setEsPersonalizado(false);

          const itemCant = parseFloat(item.cantidad) || 1;
          setCantidadEmpaques(itemCant);
          const vTot = parseFloat(item.valor_compra_total) || 0;
          setValorTotal(vTot);
          const vUnit = itemCant > 0 ? Math.round(vTot / itemCant) : 0;
          setValorUnitario(vUnit);
          const totKg = itemCant * pKg;
          setValorPorKilo(totKg > 0 ? redondearCentena(vTot / totKg) : 0);
          const totLb = itemCant * pLb;
          setValorPorLibra(totLb > 0 ? Math.round(vTot / totLb) : 0);
        }
        // 3. Prioridad: Si tiene empaques asignados al producto, usar el primero de ellos
        else if (unicos.length > 0) {
          const primeraPres = unicos[0];
          setSeleccionadoId(`pres_${primeraPres.id}`);
          setNombrePresentacion(primeraPres.presentacion);
          const pKg = parseFloat(primeraPres.peso_kg) || 25;
          const pLb =
            parseFloat(primeraPres.peso_lb) || parseFloat((pKg * 2).toFixed(2));
          setPesoKg(pKg);
          setPesoLb(pLb);
          setEsPersonalizado(false);

          const itemCant = parseFloat(item.cantidad) || 1;
          setCantidadEmpaques(itemCant);

          const vTot = parseFloat(item.valor_compra_total) || 0;
          setValorTotal(vTot);
          const vUnit = itemCant > 0 ? Math.round(vTot / itemCant) : 0;
          setValorUnitario(vUnit);
          const totKg = itemCant * pKg;
          setValorPorKilo(totKg > 0 ? redondearCentena(vTot / totKg) : 0);
          const totLb = itemCant * pLb;
          setValorPorLibra(totLb > 0 ? Math.round(vTot / totLb) : 0);
        }
        // 4. Prioridad: ¿La unidad coincide con un Tipo de Empaque Estandarizado (no clásica)?
        else if (uNorm && !esUnidadClasica(uNorm)) {
          const matchingTipo = tiposUnicos.find((t) =>
            coincideUnidadConEmpaque(uNorm, t.nombre),
          );

          const selectedTipo =
            matchingTipo || tiposUnicos[0] || DEFAULT_TIPOS[0];
          setSeleccionadoId(`tipo_${selectedTipo.id}`);
          setNombrePresentacion(selectedTipo.nombre);
          const pKg = parseFloat(selectedTipo.peso_kg) || 50;
          const pLb =
            parseFloat(selectedTipo.peso_lb) ||
            parseFloat((pKg * 2).toFixed(2));
          setPesoKg(pKg);
          setPesoLb(pLb);
          setEsPersonalizado(false);

          const cantEmp = parseFloat(item.cantidad) || 1;
          setCantidadEmpaques(cantEmp);

          const vTot = parseFloat(item.valor_compra_total) || 0;
          setValorTotal(vTot);
          const vUnit = cantEmp > 0 ? Math.round(vTot / cantEmp) : 0;
          setValorUnitario(vUnit);
          const totKg = cantEmp * pKg;
          setValorPorKilo(totKg > 0 ? redondearCentena(vTot / totKg) : 0);
          const totLb = cantEmp * pLb;
          setValorPorLibra(totLb > 0 ? Math.round(vTot / totLb) : 0);
        }
        // 5. Si el ítem es en Kg o no tiene empaques específicos: Catálogo Estandarizado (por defecto Bulto)
        else {
          const primerTipo = tiposUnicos[0] || DEFAULT_TIPOS[0];
          setSeleccionadoId(`tipo_${primerTipo.id}`);
          setNombrePresentacion(primerTipo.nombre);
          const pKg = parseFloat(primerTipo.peso_kg) || 50;
          const pLb =
            parseFloat(primerTipo.peso_lb) || parseFloat((pKg * 2).toFixed(2));
          setPesoKg(pKg);
          setPesoLb(pLb);
          setEsPersonalizado(false);

          const itemKilos = parseFloat(item.kilos || item.cantidad) || pKg;
          const cantSugerida = Math.max(
            1,
            parseFloat((itemKilos / pKg).toFixed(1)),
          );
          setCantidadEmpaques(cantSugerida);

          const vTot = parseFloat(item.valor_compra_total) || 0;
          setValorTotal(vTot);
          setValorUnitario(
            cantSugerida > 0 ? Math.round(vTot / cantSugerida) : 0,
          );
          setValorPorKilo(
            itemKilos > 0 ? redondearCentena(vTot / itemKilos) : 0,
          );
        }
      } catch (err) {
        console.warn(
          "Error cargando catálogo de empaques en calculadora:",
          err,
        );
      } finally {
        if (isMounted) setCargando(false);
      }
    };

    cargar();

    return () => {
      isMounted = false;
    };
  }, [
    isOpen,
    item,
    tiposEmpaqueProp,
    empaquesProp,
    productosCatalogoProp,
    obtenerEmpaquesDeProductoProp,
  ]);

  // Manejo de cambio de presentación en el selector
  const handleSelectPresentacion = (e) => {
    const val = e.target.value;
    setSeleccionadoId(val);

    if (val === "custom") {
      setEsPersonalizado(true);
      return;
    }

    setEsPersonalizado(false);

    if (val.startsWith("tipo_")) {
      const tipoId = parseInt(val.replace("tipo_", ""), 10);
      const tipo = tiposEmpaque.find((t) => t.id === tipoId);
      if (tipo) {
        setNombrePresentacion(tipo.nombre);
        const k = parseFloat(tipo.peso_kg) || 50;
        const lb = parseFloat(tipo.peso_lb) || k * 2;
        setPesoKg(k);
        setPesoLb(lb);
        recalcularValoresDerivados(valorTotal, cantidadEmpaques, k, lb);
      }
    } else if (val.startsWith("pres_")) {
      const presId = parseInt(val.replace("pres_", ""), 10);
      const pres = presentaciones.find((p) => p.id === presId);
      if (pres) {
        setNombrePresentacion(pres.presentacion);
        const k = parseFloat(pres.peso_kg) || 25;
        const lb = parseFloat(pres.peso_lb) || k * 2;
        setPesoKg(k);
        setPesoLb(lb);
        recalcularValoresDerivados(valorTotal, cantidadEmpaques, k, lb);
      }
    }
  };

  // Recalcular valores derivados cuando cambian los pesos o cantidades
  const recalcularValoresDerivados = (total, cant, k, lb) => {
    const numCant = parseFloat(cant) || 1;
    const numTotal = parseFloat(total) || 0;
    const totKg = numCant * (parseFloat(k) || 1);
    const totLb = numCant * (parseFloat(lb) || 2);

    setValorUnitario(numCant > 0 ? Math.round(numTotal / numCant) : 0);
    setValorPorKilo(totKg > 0 ? redondearCentena(numTotal / totKg) : 0);
    setValorPorLibra(totLb > 0 ? Math.round(numTotal / totLb) : 0);
  };

  // Sincronizaciones bidireccionales según el campo editado
  const handleTotalChange = (valStr) => {
    const num = parseMoney(valStr);
    setValorTotal(num);
    const cant = parseFloat(cantidadEmpaques) || 1;
    const totKg = cant * (parseFloat(pesoKg) || 1);
    const totLb = cant * (parseFloat(pesoLb) || 2);

    setValorUnitario(cant > 0 ? Math.round(num / cant) : 0);
    setValorPorKilo(totKg > 0 ? redondearCentena(num / totKg) : 0);
    setValorPorLibra(totLb > 0 ? Math.round(num / totLb) : 0);
  };

  const handleTotalBlur = () => {
    const rounded = redondearCentena(valorTotal);
    if (rounded !== valorTotal) {
      handleTotalChange(rounded.toString());
    }
  };

  const handleUnitarioChange = (valStr) => {
    const num = parseMoney(valStr);
    setValorUnitario(num);
    const cant = parseFloat(cantidadEmpaques) || 1;
    const total = redondearCentena(num * cant);
    setValorTotal(total);

    const totKg = cant * (parseFloat(pesoKg) || 1);
    const totLb = cant * (parseFloat(pesoLb) || 2);
    setValorPorKilo(totKg > 0 ? redondearCentena(total / totKg) : 0);
    setValorPorLibra(totLb > 0 ? Math.round(total / totLb) : 0);
  };

  const handleUnitarioBlur = () => {
    const rounded = redondearCentena(valorUnitario);
    if (rounded !== valorUnitario) {
      handleUnitarioChange(rounded.toString());
    }
  };

  const handlePorKiloChange = (valStr) => {
    const num = parseMoney(valStr);
    setValorPorKilo(num);
    const cant = parseFloat(cantidadEmpaques) || 1;
    const k = parseFloat(pesoKg) || 1;
    const totKg = cant * k;
    const total = redondearCentena(num * totKg);
    setValorTotal(total);
    setValorUnitario(cant > 0 ? Math.round(total / cant) : 0);
    const totLb = cant * (parseFloat(pesoLb) || k * 2);
    setValorPorLibra(totLb > 0 ? Math.round(total / totLb) : 0);
  };

  const handlePorKiloBlur = () => {
    const rounded = redondearCentena(valorPorKilo);
    if (rounded !== valorPorKilo) {
      handlePorKiloChange(rounded.toString());
    }
  };

  const handlePorLibraChange = (valStr) => {
    const num = parseMoney(valStr);
    setValorPorLibra(num);
    const cant = parseFloat(cantidadEmpaques) || 1;
    const lb = parseFloat(pesoLb) || (parseFloat(pesoKg) || 1) * 2;
    const totLb = cant * lb;
    const total = redondearCentena(num * totLb);
    setValorTotal(total);
    setValorUnitario(cant > 0 ? Math.round(total / cant) : 0);
    const totKg = cant * (parseFloat(pesoKg) || 1);
    setValorPorKilo(totKg > 0 ? redondearCentena(total / totKg) : 0);
  };

  const handleCantidadChange = (cantVal) => {
    const cant = parseFloat(cantVal) || 0;
    setCantidadEmpaques(cant);

    if (modoIngreso === "unitario") {
      const total = redondearCentena(valorUnitario * cant);
      setValorTotal(total);
      const totKg = cant * (parseFloat(pesoKg) || 1);
      const totLb = cant * (parseFloat(pesoLb) || 2);
      setValorPorKilo(totKg > 0 ? redondearCentena(total / totKg) : 0);
      setValorPorLibra(totLb > 0 ? Math.round(total / totLb) : 0);
    } else if (modoIngreso === "kilo") {
      const totKg = cant * (parseFloat(pesoKg) || 1);
      const total = redondearCentena(valorPorKilo * totKg);
      setValorTotal(total);
      setValorUnitario(cant > 0 ? Math.round(total / cant) : 0);
      const totLb = cant * (parseFloat(pesoLb) || 2);
      setValorPorLibra(totLb > 0 ? Math.round(total / totLb) : 0);
    } else if (modoIngreso === "libra") {
      const totLb = cant * (parseFloat(pesoLb) || 2);
      const total = redondearCentena(valorPorLibra * totLb);
      setValorTotal(total);
      setValorUnitario(cant > 0 ? Math.round(total / cant) : 0);
      const totKg = cant * (parseFloat(pesoKg) || 1);
      setValorPorKilo(totKg > 0 ? redondearCentena(total / totKg) : 0);
    } else {
      // Modo total
      setValorUnitario(cant > 0 ? Math.round(valorTotal / cant) : 0);
      const totKg = cant * (parseFloat(pesoKg) || 1);
      const totLb = cant * (parseFloat(pesoLb) || 2);
      setValorPorKilo(totKg > 0 ? redondearCentena(valorTotal / totKg) : 0);
      setValorPorLibra(totLb > 0 ? Math.round(valorTotal / totLb) : 0);
    }
  };

  // Cálculos matemáticos en tiempo real
  const calculos = useMemo(() => {
    const cant = parseFloat(cantidadEmpaques) || 0;
    const kgUnidad = parseFloat(pesoKg) || 0;
    const lbUnidad = parseFloat(pesoLb) || kgUnidad * 2;
    const vTotal = parseFloat(valorTotal) || 0;

    const totalKilosComprados = parseFloat((cant * kgUnidad).toFixed(2));
    const totalLibrasCompradas = parseFloat((cant * lbUnidad).toFixed(2));

    // Costo por Kilo (Regla: redondeo comercial a centenas $100)
    const costoKilo =
      totalKilosComprados > 0
        ? redondearCentena(vTotal / totalKilosComprados)
        : 0;

    // Costo por Libra (Exacto a pesos enteros)
    const costoLibra =
      totalLibrasCompradas > 0 ? Math.round(vTotal / totalLibrasCompradas) : 0;

    // Kilos reales para liquidar en el ítem del pedido
    // Si la unidad es empaque, los kilos del pedido son (cantidad_pedido * peso_kg)
    const itemCant = parseFloat(item?.cantidad) || 1;
    const itemKilos =
      item?.unidad && item.unidad.toUpperCase() !== "KG"
        ? parseFloat((itemCant * kgUnidad).toFixed(2))
        : parseFloat(item?.kilos || item?.cantidad) || totalKilosComprados;

    const totalCompraPedido = redondearCentena(costoKilo * itemKilos);

    return {
      totalKilosComprados,
      totalLibrasCompradas,
      costoKilo,
      costoLibra,
      totalCompraPedido,
      itemKilos,
      itemCant,
    };
  }, [cantidadEmpaques, pesoKg, pesoLb, valorTotal, item]);

  if (!isOpen || !item) return null;

  const handleAplicar = () => {
    if (onApply) {
      onApply({
        costo_kilo: calculos.costoKilo,
        costo_libra: calculos.costoLibra,
        total_compra: calculos.totalCompraPedido,
        kilos: calculos.itemKilos,
        base_calculo: baseCalculo,
        empaque_info: {
          presentacion: nombrePresentacion,
          peso_kg: parseFloat(pesoKg) || 50,
          peso_lb: parseFloat(pesoLb) || 100,
          cantidad_empaques: parseFloat(cantidadEmpaques) || 1,
          valor_total_compra: valorTotal,
          valor_unitario: valorUnitario,
          costo_kilo: calculos.costoKilo,
          costo_libra: calculos.costoLibra,
          base_calculo: baseCalculo,
        },
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del Asistente */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm uppercase tracking-wider truncate">
                Calculadora de Empaque / Bulto
              </h3>
              <p className="text-[11px] text-slate-300 truncate">
                Costeo físico comercial: {item.producto}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Desplazable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs font-semibold">
          {/* Ficha Resumen del Producto y Unidad en Pedido */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block">
                Producto a liquidar:
              </span>
              <strong className="text-sm font-black text-slate-900 dark:text-white uppercase block truncate">
                {item.producto}
              </strong>
              {item.descripcion && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 italic truncate block">
                  📝 {item.descripcion}
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block">
                Pedido actual:
              </span>
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 block">
                {item.cantidad} {item.unidad || "Kg"}
              </span>
            </div>
          </div>

          {/* 1. Selección de Presentación / Tipo de Empaque Estandarizado */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-slate-700 dark:text-slate-200 text-[11px] font-black uppercase flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Tipo de Empaque Estandarizado:</span>
              </label>
              {onOpenPresentaciones && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPresentaciones();
                  }}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Configurar Catálogo</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div
                className={esPersonalizado ? "sm:col-span-7" : "sm:col-span-12"}
              >
                <select
                  aria-label="Seleccionar tipo de empaque"
                  className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl p-2.5 font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer shadow-2xs text-xs"
                  value={esPersonalizado ? "custom" : seleccionadoId}
                  onChange={handleSelectPresentacion}
                >
                  {presentaciones.length > 0 && (
                    <optgroup
                      label={`Medidas registradas para ${item.producto} (${presentaciones.length})`}
                    >
                      {presentaciones.map((p) => (
                        <option key={`pres_${p.id}`} value={`pres_${p.id}`}>
                          🏷️ {p.presentacion} — {p.peso_kg} Kg ({p.peso_lb} Lb)
                          {p.esPersonalizado ? " [Personalizado]" : ""}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <optgroup label="Tipos de Empaque Estandarizados (Catálogo)">
                    {tiposEmpaque.map((t) => (
                      <option key={`tipo_${t.id}`} value={`tipo_${t.id}`}>
                        📦 {t.nombre} — {t.peso_kg} Kg / {t.peso_lb} Lb
                      </option>
                    ))}
                  </optgroup>

                  <option value="custom">
                    ⚙️ Otra medida personalizada...
                  </option>
                </select>
              </div>

              {/* Si es personalizado, permitir escribir nombre */}
              {esPersonalizado && (
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Nombre (ej: Canastilla)"
                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl p-2.5 font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs text-xs"
                    value={nombrePresentacion}
                    onChange={(e) => setNombrePresentacion(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Mensaje informativo según empaques específicos registrados para este producto */}
            {presentaciones.length === 0 && !cargando && (
              <div className="p-2.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800 rounded-xl flex items-start sm:items-center gap-2 text-amber-900 dark:text-amber-300 text-[11px] animate-in fade-in">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0">
                  <span>
                    No hay medidas registradas para{" "}
                    <strong>{item.producto}</strong>. Se procede a utilizar{" "}
                    <strong>Tipos de Empaque Estandarizados (Catálogo)</strong>.
                  </span>
                </div>
              </div>
            )}
            {presentaciones.length > 0 && !cargando && (
              <div className="p-2 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-900 dark:text-emerald-300 text-[11px] animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {presentaciones.length === 1
                    ? `1 medida registrada para ${item.producto} (mostrada de primera)`
                    : `${presentaciones.length} medidas registradas para ${item.producto} (mostradas de primero)`}
                </span>
              </div>
            )}

            {/* Pesos en Kg y Lb si es personalizado */}
            {esPersonalizado && (
              <div className="grid grid-cols-2 gap-2 p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800 animate-in fade-in">
                <div>
                  <label className="block text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 mb-1">
                    Peso en Kilogramos (Kg) *
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="w-full border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 rounded-lg p-2 font-black text-slate-900 dark:text-white text-center outline-none text-xs"
                    value={pesoKg}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setPesoKg(v);
                      const lb = parseFloat((v * 2).toFixed(2));
                      setPesoLb(lb);
                      recalcularValoresDerivados(
                        valorTotal,
                        cantidadEmpaques,
                        v,
                        lb,
                      );
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 mb-1">
                    Peso en Libras (Lb) *
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="w-full border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 rounded-lg p-2 font-black text-slate-900 dark:text-white text-center outline-none text-xs"
                    value={pesoLb}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setPesoLb(v);
                      recalcularValoresDerivados(
                        valorTotal,
                        cantidadEmpaques,
                        pesoKg,
                        v,
                      );
                    }}
                  />
                </div>
              </div>
            )}

            {/* Badge Informativo de Medida */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-2.5 text-emerald-900 dark:text-emerald-300 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <p className="text-[11px] leading-tight truncate">
                  <strong className="font-black uppercase">
                    {nombrePresentacion}
                  </strong>
                  :{" "}
                  <span className="font-black underline decoration-emerald-500">
                    {pesoKg} Kg
                  </span>{" "}
                  /{" "}
                  <span className="font-black underline decoration-emerald-500">
                    {pesoLb} Lb
                  </span>
                </p>
              </div>

              {/* Selector de Base de Cálculo: Kilos (por defecto) vs Libras */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-emerald-300 dark:border-emerald-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setBaseCalculo("kilos")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                    baseCalculo === "kilos"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Calcular costo base por Kilo (Kg) - Por Defecto"
                >
                  ⚖️ Kilos (Defecto)
                </button>
                <button
                  type="button"
                  onClick={() => setBaseCalculo("libras")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                    baseCalculo === "libras"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Calcular costo base por Libra (Lb)"
                >
                  ⚖️ Libras (Lb)
                </button>
              </div>
            </div>
          </div>

          {/* 2. Datos de la Compra Realizada */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-200 block">
              Datos de la Compra Comercial
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cantidad de Empaques Comprados */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Cantidad de {nombrePresentacion}s Comprados *
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="any"
                  placeholder="Ej: 2"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-black text-sm text-center text-slate-900 dark:text-white outline-none bg-slate-50/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 transition shadow-2xs tabular-nums"
                  value={cantidadEmpaques}
                  onChange={(e) => handleCantidadChange(e.target.value)}
                />
              </div>

              {/* Selector de modo de ingreso: Total, Unitario, Kilo o Libra */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Modo de Ingreso de Precio
                </label>
                <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-center">
                  <button
                    type="button"
                    onClick={() => setModoIngreso("total")}
                    className={`py-1.5 rounded-lg text-[9px] font-black transition cursor-pointer truncate ${
                      modoIngreso === "total"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="Ingresar valor total de la compra"
                  >
                    Total ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoIngreso("unitario")}
                    className={`py-1.5 rounded-lg text-[9px] font-black transition cursor-pointer truncate ${
                      modoIngreso === "unitario"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title={`Ingresar valor por cada ${nombrePresentacion}`}
                  >
                    X Empaque
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoIngreso("kilo")}
                    className={`py-1.5 rounded-lg text-[9px] font-black transition cursor-pointer truncate ${
                      modoIngreso === "kilo"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="Ingresar valor por Kilo"
                  >
                    X Kilo
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoIngreso("libra")}
                    className={`py-1.5 rounded-lg text-[9px] font-black transition cursor-pointer truncate ${
                      modoIngreso === "libra"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="Ingresar valor por Libra"
                  >
                    X Libra
                  </button>
                </div>
              </div>
            </div>

            {/* Inputs de Precios Dinámicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Valor Total Comprado */}
              <div
                className={`p-3 rounded-2xl border transition ${
                  modoIngreso === "total"
                    ? "bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-90"
                }`}
              >
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Valor Total Comprado ($)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 dark:text-slate-500 font-black">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej: 160.000"
                    className="w-full font-black text-slate-900 dark:text-white text-sm outline-none bg-transparent tabular-nums"
                    value={formatMoney(valorTotal)}
                    onChange={(e) => handleTotalChange(e.target.value)}
                    onBlur={handleTotalBlur}
                  />
                </div>
              </div>

              {/* Valor por cada Empaque */}
              <div
                className={`p-3 rounded-2xl border transition ${
                  modoIngreso === "unitario"
                    ? "bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-90"
                }`}
              >
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1 truncate">
                  Por Cada {nombrePresentacion} ($)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 dark:text-slate-500 font-black">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej: 80.000"
                    className="w-full font-black text-slate-900 dark:text-white text-sm outline-none bg-transparent tabular-nums"
                    value={formatMoney(valorUnitario)}
                    onChange={(e) => handleUnitarioChange(e.target.value)}
                    onBlur={handleUnitarioBlur}
                  />
                </div>
              </div>

              {/* Valor por Kilo */}
              <div
                className={`p-3 rounded-2xl border transition ${
                  modoIngreso === "kilo"
                    ? "bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-90"
                }`}
              >
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Costo por Kilo (Kg) ($)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 dark:text-slate-500 font-black">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej: 1.600"
                    className="w-full font-black text-slate-900 dark:text-white text-sm outline-none bg-transparent tabular-nums"
                    value={formatMoney(valorPorKilo)}
                    onChange={(e) => handlePorKiloChange(e.target.value)}
                    onBlur={handlePorKiloBlur}
                  />
                </div>
              </div>

              {/* Valor por Libra */}
              <div
                className={`p-3 rounded-2xl border transition ${
                  modoIngreso === "libra"
                    ? "bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-90"
                }`}
              >
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Costo por Libra (Lb) ($)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 dark:text-slate-500 font-black">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej: 800"
                    className="w-full font-black text-slate-900 dark:text-white text-sm outline-none bg-transparent tabular-nums"
                    value={formatMoney(valorPorLibra)}
                    onChange={(e) => handlePorLibraChange(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Panel de Resultados y Desglose Matemático en Vivo */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-md border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-300 pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1 font-bold">
                <Scale className="w-3.5 h-3.5 text-emerald-400" /> Peso Total
                Comprado:
              </span>
              <span className="font-mono font-bold text-white">
                {calculos.totalKilosComprados} Kg (
                {calculos.totalLibrasCompradas} Lb)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              {/* Costo por Kilo (Destacado por Defecto) */}
              <div
                className={`p-2.5 rounded-xl border transition ${
                  baseCalculo === "kilos"
                    ? "bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-400"
                    : "bg-slate-800/80 border-slate-700"
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">
                    Costo Compra / Kg
                  </span>
                  {baseCalculo === "kilos" && (
                    <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                      Defecto
                    </span>
                  )}
                </div>
                <strong className="text-xl font-black text-emerald-400 font-mono tabular-nums block mt-0.5">
                  ${calculos.costoKilo.toLocaleString("es-CO")}
                </strong>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  Redondeo comercial ($100)
                </span>
              </div>

              {/* Costo por Libra */}
              <div
                className={`p-2.5 rounded-xl border transition ${
                  baseCalculo === "libras"
                    ? "bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-400"
                    : "bg-slate-800/80 border-slate-700"
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase">
                    Costo por Libra (Lb)
                  </span>
                  {baseCalculo === "libras" && (
                    <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                      Base
                    </span>
                  )}
                </div>
                <strong className="text-xl font-black text-emerald-300 font-mono tabular-nums block mt-0.5">
                  ${calculos.costoLibra.toLocaleString("es-CO")}
                </strong>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  Equivalente por Lb
                </span>
              </div>
            </div>

            <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30 flex items-center justify-between text-xs">
              <span className="text-emerald-200">
                Total Compra para el Pedido ({calculos.itemKilos} Kg):
              </span>
              <strong className="text-emerald-300 font-black text-sm tabular-nums font-mono">
                ${calculos.totalCompraPedido.toLocaleString("es-CO")}
              </strong>
            </div>
          </div>
        </div>

        {/* Barra de Acciones Inferior */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAplicar}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>
              Aplicar al Pedido (${calculos.costoKilo.toLocaleString("es-CO")}
              /Kg)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
