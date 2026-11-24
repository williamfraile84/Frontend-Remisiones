/**
 * Motor de cálculo financiero del lado del cliente para reactividad inmediata.
 * Implementa las reglas comerciales colombianas:
 * - Redondeo estricto a centenas ($100): 251 -> 300, 249 -> 200, 250 -> 300, 1120 -> 1100, 1150 -> 1200.
 * - Prorrateo de gastos por kilo redondeado a centenas ($100).
 * - Sincronización automática de costo real, utilidades y precios de venta a múltiplos de $100.
 */

const DEFAULT_PROFIT_MARGIN =
  Number(import.meta?.env?.VITE_DEFAULT_PROFIT_MARGIN) || 30;

export const redondearCentenaEstricta = (valor) => {
  if (!valor || isNaN(valor)) return 0;
  const num = parseFloat(valor);
  if (num <= 0) return 0;
  return Math.round(num / 100) * 100;
};

export const redondearCentenaCercana = redondearCentenaEstricta;
export const redondearCentena = redondearCentenaEstricta;

export const calcularLiquidacion = (
  productos = [],
  gastos = [],
  utilDefecto = DEFAULT_PROFIT_MARGIN,
) => {
  const totalKilos =
    productos.reduce(
      (acc, p) =>
        acc +
        (parseFloat(p.kilos || p.cantidad) > 0
          ? parseFloat(p.kilos || p.cantidad)
          : 0),
      0,
    ) || 1;

  const totalGastos = gastos
    .filter((g) => g.aplicado !== false)
    .reduce((acc, g) => acc + (parseFloat(g.valor) || 0), 0);

  // 4. (+$/Kg gastos): suma de gastos dividida en kg totales y redondeada a centenas ($100)
  const gastoPorKiloExacto = totalKilos > 0 ? totalGastos / totalKilos : 0;
  const gastoPorKilo = redondearCentenaEstricta(gastoPorKiloExacto);

  let totalCompras = 0;
  let totalVentas = 0;

  const items = productos.map((p) => {
    const k = parseFloat(p.kilos || p.cantidad) || 0;

    // 1. Costo Compra / Kg y Total Compra ($)
    let costoKilo = 0;
    let vCompra =
      p.valor_compra_total !== undefined &&
      p.valor_compra_total !== null &&
      p.valor_compra_total !== ""
        ? parseFloat(p.valor_compra_total) || 0
        : 0;

    if (
      p.costo_compra_kilo !== undefined &&
      p.costo_compra_kilo !== null &&
      p.costo_compra_kilo !== "" &&
      parseFloat(p.costo_compra_kilo) > 0
    ) {
      costoKilo = parseFloat(p.costo_compra_kilo) || 0;
      if (!vCompra && k > 0) {
        vCompra = costoKilo * k;
      }
    } else if (vCompra > 0 && k > 0) {
      costoKilo = vCompra / k;
    }

    // 3. Costo Real / Kg:
    let costoReal = 0;
    if (
      p.costo_real_kilo !== undefined &&
      p.costo_real_kilo !== null &&
      p.costo_real_kilo !== "" &&
      parseFloat(p.costo_real_kilo) > 0
    ) {
      costoReal = parseFloat(p.costo_real_kilo) || 0;
    } else if (costoKilo > 0) {
      costoReal = costoKilo + gastoPorKilo;
    }

    let utilItem =
      p.porcentaje_utilidad !== undefined &&
      p.porcentaje_utilidad !== null &&
      p.porcentaje_utilidad !== ""
        ? Math.round(parseFloat(p.porcentaje_utilidad))
        : Math.round(utilDefecto);

    // 5. P. Venta / Kg:
    let pVenta = 0;
    if (
      p.precio_venta_manual &&
      p.precio_venta_kilo !== undefined &&
      p.precio_venta_kilo !== null &&
      p.precio_venta_kilo !== ""
    ) {
      pVenta = parseFloat(p.precio_venta_kilo) || 0;
      if (costoReal > 0 && pVenta > 0) {
        utilItem = Math.round(((pVenta - costoReal) / costoReal) * 100);
      }
    } else if (
      p.precio_venta_kilo !== undefined &&
      p.precio_venta_kilo !== null &&
      p.precio_venta_kilo !== "" &&
      parseFloat(p.precio_venta_kilo) > 0
    ) {
      pVenta = parseFloat(p.precio_venta_kilo) || 0;
    } else if (costoReal > 0) {
      pVenta = costoReal * (1 + utilItem / 100);
    }

    // 6. Total Venta ($):
    const totalLinea =
      p.valor_total_venta !== undefined &&
      p.valor_total_venta !== null &&
      p.valor_total_venta !== "" &&
      parseFloat(p.valor_total_venta) > 0
        ? parseFloat(p.valor_total_venta) || 0
        : pVenta * k;

    totalCompras += vCompra;
    totalVentas += totalLinea;

    return {
      ...p,
      kilos: k,
      valor_compra_total: vCompra,
      costo_compra_kilo: costoKilo,
      gasto_asignado_kilo: gastoPorKilo,
      gasto_exacto_kilo: gastoPorKiloExacto,
      costo_real_kilo: costoReal,
      precio_venta_kilo: pVenta,
      valor_total_venta: totalLinea,
      porcentaje_utilidad: utilItem,
    };
  });

  const ganancia = redondearCentenaEstricta(
    totalVentas - (totalCompras + totalGastos),
  );
  const margenGlobal =
    totalVentas > 0 ? ((ganancia / totalVentas) * 100).toFixed(2) : 0;

  return {
    items,
    resumen: {
      total_kilos: parseFloat(totalKilos.toFixed(2)),
      total_compras: redondearCentenaEstricta(totalCompras),
      total_gastos: redondearCentenaEstricta(totalGastos),
      gasto_por_kilo: gastoPorKilo,
      gasto_por_kilo_exacto: parseFloat(gastoPorKiloExacto.toFixed(2)),
      total_ventas: redondearCentenaEstricta(totalVentas),
      ganancia: ganancia,
      margen_global_porcentaje: parseFloat(margenGlobal),
    },
  };
};
