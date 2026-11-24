/**
 * Parser inteligente de pedidos de abastecimiento / surtido en texto libre
 * adaptado a la jerga y abreviaturas comunes del mercado fruver colombiano.
 *
 * Ejemplos soportados:
 * - "1 bulto mazorca" -> Cant: 1, Unidad: Bulto, Producto: MAZORCA
 * - "1/2 guatila" -> Cant: 0.5, Unidad: Kg, Producto: GUATILA
 * - "1/4 repollo morado" -> Cant: 0.25, Unidad: Kg, Producto: REPOLLO MORADO
 * - "1 a arracacha 70" -> Cant: 1, Unidad: Arroba, Producto: ARRACACHA, Valor: 70000
 * - "2 larga 160000" -> Cant: 2, Unidad: Atado, Producto: CEBOLLA LARGA, Valor: 160000
 * - "1/2 caja de jengibre 90000" -> Cant: 0.5, Unidad: Caja, Producto: JENGIBRE, Valor: 90000
 * - "5. Bultos de papa pastosa 600000" -> Cant: 5, Unidad: Bulto, Producto: PAPA PASTUSA, Valor: 600000
 * - "1 criolla 260" -> Cant: 1, Unidad: Bulto, Producto: PAPA CRIOLLA, Valor: 260000
 * - "Perejil10" -> Cant: 1, Unidad: Atado, Producto: PEREJIL, Valor: 10000
 */

import { calcularKilosItem } from "./unitMatcher";

const KNOWN_UNITS = [
  { match: /\b(bultos?|blts?)\b/i, unit: "Bulto" },
  { match: /\b(canastillas?|cll|cst)\b/i, unit: "Canastilla" },
  { match: /\b(cajas?)\b/i, unit: "Caja" },
  { match: /\b(bolsas?)\b/i, unit: "Bolsa" },
  { match: /\b(paquetes?|pqts?)\b/i, unit: "Paquete" },
  { match: /\b(kilos?|kgs?)\b/i, unit: "Kg" },
  { match: /\b(libras?|lbs?)\b/i, unit: "Libra" },
  { match: /\b(docenas?|doc)\b/i, unit: "Docena" },
  { match: /\b(arrobas?|@|\ba\b)\b/i, unit: "Arroba" },
  { match: /\b(rollos?|atados?|manojos?)\b/i, unit: "Atado" },
  { match: /\b(pastillas?|panelas?|panelin)\b/i, unit: "Und" },
  { match: /\b(cubetas?)\b/i, unit: "Cubeta" },
  { match: /\b(mallas?)\b/i, unit: "Malla" },
  { match: /\b(huacales?)\b/i, unit: "Huacal" },
];

const KNOWN_SYNONYMS = {
  LARGA: "CEBOLLA LARGA",
  CABEZONA: "CEBOLLA CABEZONA",
  CRIOLLA: "PAPA CRIOLLA",
  PASTOSA: "PAPA PASTUSA",
  PASTUSA: "PAPA PASTUSA",
  ARVERJON: "ARVEJA",
  ABAS: "HABAS",
  ZUKINY: "CALABACÍN / ZUCCHINI",
  CLL: "",
};

export function parseTextOrder(rawText, defaultProfitMargin = 30) {
  if (!rawText || typeof rawText !== "string") return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items = [];
  let itemIndex = 1;

  for (let line of lines) {
    // Ignorar líneas vacías o de comentarios
    if (!line || line.startsWith("//") || line.startsWith("#")) continue;

    let text = line.trim();
    let descripcionExtra = "";

    // 1. Extraer notas al final tipo "si" / "no"
    if (/\s+(si|no)$/i.test(text)) {
      const match = text.match(/\s+(si|no)$/i);
      descripcionExtra = `Confirmado: ${match[1].toUpperCase()}`;
      text = text.replace(/\s+(si|no)$/i, "").trim();
    }

    // 2. Extraer precio de compra al final de la línea
    // Ej: "160000", "90000", "260", "15", "Tomillo 10" -> 10, "Perejil10" -> 10
    let valorCompra = 0;
    // Si la palabra está pegada como Perejil10
    text = text.replace(/([a-zA-ZáéíóúÁÉÍÓÚñÑ])(\d{2,})$/, "$1 $2");

    const priceMatch = text.match(/\s+(\d+)\s*$/);
    if (priceMatch) {
      const numRaw = parseInt(priceMatch[1], 10);
      // En la jerga fruver:
      // Si colocan "160000", "25000" es el valor completo.
      // Si colocan "260", "650", "75", "15", "10" son miles de pesos (260.000, 15.000).
      if (numRaw >= 1000) {
        valorCompra = numRaw;
      } else if (numRaw > 0) {
        valorCompra = numRaw * 1000;
      }
      text = text.substring(0, priceMatch.index).trim();
    }

    // 3. Extraer cantidad al inicio de la línea
    let cantidad = 1;
    let cantMatch;

    // Caso A: Fracciones como "1/2", "1/4", "3/4", "1/3"
    if (/^(\d+\s+)?(\d+)\/(\d+)\s*/i.test(text)) {
      cantMatch = text.match(/^(\d+\s+)?(\d+)\/(\d+)\s*/i);
      const entero = cantMatch[1] ? parseFloat(cantMatch[1]) : 0;
      const numerador = parseFloat(cantMatch[2]);
      const denominador = parseFloat(cantMatch[3]) || 1;
      cantidad = entero + numerador / denominador;
      text = text.substring(cantMatch[0].length).trim();
    }
    // Caso B: Decimales o enteros con punto ej "5." o "1.5" o "12"
    else if (/^(\d+(?:\.\d+)?|\d+\.)\s*/.test(text)) {
      cantMatch = text.match(/^(\d+(?:\.\d+)?|\d+\.)\s*/);
      let rawVal = cantMatch[1];
      if (rawVal.endsWith(".")) rawVal = rawVal.slice(0, -1);
      cantidad = parseFloat(rawVal) || 1;
      text = text.substring(cantMatch[0].length).trim();
    }

    // 4. Extraer unidad o tipo de empaque
    let unidad = "Kg";
    for (const u of KNOWN_UNITS) {
      if (u.match.test(text)) {
        unidad = u.unit;
        text = text.replace(u.match, " ").trim();
        break;
      }
    }

    // 5. Limpieza del nombre de producto
    // Remover palabras conectoras superfluas como "de", "x 3", puntos o comas
    text = text
      .replace(/^[.\-•*–]+\s*/, "")
      .replace(/\bde\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Detectar notas adicionales de proveedor/calidad (ej: "fredi", "jhonatan", "grueso", "lavada")
    const proveedoresMatch = text.match(
      /\b(fredi|jhonatan|jonatan|don\s+\w+)\b/i,
    );
    if (proveedoresMatch) {
      const notaProv = `Prov: ${proveedoresMatch[1]}`;
      descripcionExtra = descripcionExtra
        ? `${descripcionExtra} - ${notaProv}`
        : notaProv;
      text = text.replace(proveedoresMatch[0], "").trim();
    }

    // Homogeneizar mayúsculas
    let productoNombre = text.toUpperCase().trim();

    // Aplicar sinónimos rápidos fruver si es una sola palabra
    if (KNOWN_SYNONYMS[productoNombre]) {
      productoNombre = KNOWN_SYNONYMS[productoNombre];
    }

    if (!productoNombre) {
      productoNombre = "PRODUCTO SURTIDO";
    }

    const cantNum = parseFloat(cantidad.toFixed(2));
    const kilosCalculados = calcularKilosItem(cantNum, unidad);

    items.push({
      id: Date.now() + itemIndex,
      producto: productoNombre,
      cantidad: cantNum,
      unidad: unidad,
      descripcion: descripcionExtra,
      kilos: kilosCalculados,
      valor_compra_total: valorCompra,
      porcentaje_utilidad: defaultProfitMargin,
    });

    itemIndex++;
  }

  return items;
}
