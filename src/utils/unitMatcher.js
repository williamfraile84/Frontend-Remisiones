/**
 * Utilidad inteligente para catálogo, comparación, sugerencias y conversión
 * de Unidades de Medida Clásicas y Tipos de Empaque Estandarizados fruver.
 */

export const UNIDADES_CLASICAS = [
  {
    id: "kg",
    nombre: "Kilogramos",
    abreviatura: "Kg",
    peso_kg: 1.0,
    peso_lb: 2.0,
    tipo: "clasica",
    descripcion: "Kilogramo estándar (1 Kg / 2 Lb)",
  },
  {
    id: "libra",
    nombre: "Libras",
    abreviatura: "Libra",
    peso_kg: 0.5,
    peso_lb: 1.0,
    tipo: "clasica",
    descripcion: "Libra colombiana (500 g / 0.5 Kg)",
  },
  {
    id: "arroba_u",
    nombre: "Arroba",
    abreviatura: "Arroba",
    peso_kg: 12.5,
    peso_lb: 25.0,
    tipo: "clasica",
    descripcion: "Arroba tradicional de 25 Lb (12.5 Kg)",
  },
  {
    id: "gramos",
    nombre: "Gramos",
    abreviatura: "Gr",
    peso_kg: 0.001,
    peso_lb: 0.002,
    tipo: "clasica",
    descripcion: "Gramo fraccionario (1/1000 Kg)",
  },
  {
    id: "unidad",
    nombre: "Unidad",
    abreviatura: "Und",
    peso_kg: 1.0,
    peso_lb: 2.0,
    tipo: "clasica",
    descripcion: "Unidad / Pieza individual",
  },
  {
    id: "paquete",
    nombre: "Paquete",
    abreviatura: "Paquete",
    peso_kg: 1.0,
    peso_lb: 2.0,
    tipo: "clasica",
    descripcion: "Paquete o empaque minorista",
  },
  {
    id: "litro",
    nombre: "Litro",
    abreviatura: "Litro",
    peso_kg: 1.0,
    peso_lb: 2.0,
    tipo: "clasica",
    descripcion: "Litro de líquido o pulpa (1 L)",
  },
  {
    id: "mililitro",
    nombre: "MiliLitro",
    abreviatura: "MiliLitro",
    peso_kg: 0.001,
    peso_lb: 0.002,
    tipo: "clasica",
    descripcion: "Mililitro fraccionario (ml)",
  },
  {
    id: "bloque",
    nombre: "Bloque",
    abreviatura: "Bloque",
    peso_kg: 1.0,
    peso_lb: 2.0,
    tipo: "clasica",
    descripcion: "Bloque o pieza sólida",
  },
  {
    id: "cubeta_u",
    nombre: "Cubeta",
    abreviatura: "Cubeta",
    peso_kg: 2.0,
    peso_lb: 4.0,
    tipo: "clasica",
    descripcion: "Cubeta rígida para huevos o frutas (2 Kg)",
  },
];

export const DEFAULT_TIPOS_EMPAQUE = [
  {
    id: "empaque_bulto",
    nombre: "Bulto",
    abreviatura: "Bulto",
    peso_kg: 50.0,
    peso_lb: 100.0,
    tipo: "empaque",
    descripcion: "Bulto completo estándar tradicional (50 kg / 100 lb)",
  },
  {
    id: "empaque_pony",
    nombre: "Pony",
    abreviatura: "Pony",
    peso_kg: 25.0,
    peso_lb: 50.0,
    tipo: "empaque",
    descripcion: "Medio bulto estándar seleccionado (25 kg / 50 lb)",
  },
  {
    id: "empaque_canastilla",
    nombre: "Canastilla",
    abreviatura: "Canastilla",
    peso_kg: 22.0,
    peso_lb: 44.0,
    tipo: "empaque",
    descripcion: "Canastilla plástica fruver (22 kg / 44 lb)",
  },
  {
    id: "empaque_caja",
    nombre: "Caja",
    abreviatura: "Caja",
    peso_kg: 15.0,
    peso_lb: 30.0,
    tipo: "empaque",
    descripcion: "Caja de cartón o madera (15 kg / 30 lb)",
  },
  {
    id: "empaque_saco",
    nombre: "Saco",
    abreviatura: "Saco",
    peso_kg: 30.0,
    peso_lb: 60.0,
    tipo: "empaque",
    descripcion: "Saco ventilado o parafinado (30 kg / 60 lb)",
  },
  {
    id: "empaque_bolsa",
    nombre: "Bolsa",
    abreviatura: "Bolsa",
    peso_kg: 5.0,
    peso_lb: 10.0,
    tipo: "empaque",
    descripcion: "Bolsa plástica o paquete (5 kg / 10 lb)",
  },
  {
    id: "empaque_rollo",
    nombre: "Rollo / Atado",
    abreviatura: "Rollo / Atado",
    peso_kg: 12.0,
    peso_lb: 24.0,
    tipo: "empaque",
    descripcion: "Atado de hierbas u hortalizas (12 kg / 24 lb)",
  },
  {
    id: "empaque_arroba",
    nombre: "Arroba",
    abreviatura: "Arroba",
    peso_kg: 12.5,
    peso_lb: 25.0,
    tipo: "empaque",
    descripcion: "Arroba tradicional de 25 lb (12.5 kg / 25 lb)",
  },
  {
    id: "empaque_malla",
    nombre: "Malla",
    abreviatura: "Malla",
    peso_kg: 3.0,
    peso_lb: 6.0,
    tipo: "empaque",
    descripcion: "Malla transpirable (3 kg / 6 lb)",
  },
  {
    id: "empaque_cubeta",
    nombre: "Cubeta",
    abreviatura: "Cubeta",
    peso_kg: 2.0,
    peso_lb: 4.0,
    tipo: "empaque",
    descripcion: "Cubeta rígida para huevos o frutas (2 kg / 4 lb)",
  },
  {
    id: "empaque_huacal",
    nombre: "Huacal",
    abreviatura: "Huacal",
    peso_kg: 20.0,
    peso_lb: 40.0,
    tipo: "empaque",
    descripcion: "Huacal de madera tradicional (20 kg / 40 lb)",
  },
];

export function getAllAvailableUnits(tiposEmpaqueBackend = []) {
  const empaques =
    Array.isArray(tiposEmpaqueBackend) && tiposEmpaqueBackend.length > 0
      ? tiposEmpaqueBackend.map((t) => ({
          id: `empaque_${t.id || t.nombre}`,
          nombre: t.nombre,
          abreviatura: t.nombre,
          peso_kg: parseFloat(t.peso_kg) || 1.0,
          peso_lb: parseFloat(t.peso_lb) || (parseFloat(t.peso_kg) || 1.0) * 2,
          tipo: "empaque",
          descripcion: t.descripcion || `${t.nombre} (${t.peso_kg} Kg)`,
        }))
      : DEFAULT_TIPOS_EMPAQUE;

  const vistos = new Set();
  const res = [];
  for (const u of [...UNIDADES_CLASICAS, ...empaques]) {
    const key = (u.abreviatura || u.nombre).toUpperCase().trim();
    if (!vistos.has(key)) {
      vistos.add(key);
      res.push(u);
    }
  }
  return res;
}

export function normalizeUnitText(str) {
  if (!str) return "";
  return str
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1,
        );
      }
    }
  }
  return dp[m][n];
}

export function matchUnitWithCatalog(rawUnit, availableUnits = []) {
  if (!rawUnit || !rawUnit.trim()) {
    return { status: "EMPTY", exactMatch: null, similarMatches: [] };
  }

  const normRaw = normalizeUnitText(rawUnit);
  if (!normRaw) {
    return { status: "EMPTY", exactMatch: null, similarMatches: [] };
  }

  for (const u of availableUnits) {
    const normNombre = normalizeUnitText(u.nombre);
    const normAbrev = normalizeUnitText(u.abreviatura);
    if (normRaw === normNombre || normRaw === normAbrev) {
      return { status: "EXACT", exactMatch: u, similarMatches: [] };
    }
  }

  const ALIAS_MAP = {
    KILO: "Kg",
    KILOS: "Kg",
    KILOGRAMO: "Kg",
    KILOGRAMOS: "Kg",
    KG: "Kg",
    KGS: "Kg",
    LIBRA: "Libra",
    LIBRAS: "Libra",
    LB: "Libra",
    LBS: "Libra",
    ARROBA: "Arroba",
    ARROBAS: "Arroba",
    ARR: "Arroba",
    BULT: "Bulto",
    BULTO: "Bulto",
    BULTOS: "Bulto",
    PONY: "Pony",
    PONYS: "Pony",
    CANASTA: "Canastilla",
    CANASTAS: "Canastilla",
    CANASTILLA: "Canastilla",
    CANASTILLAS: "Canastilla",
    CAJA: "Caja",
    CAJAS: "Caja",
    SACO: "Saco",
    SACOS: "Saco",
    BOLSA: "Bolsa",
    BOLSAS: "Bolsa",
    PAQUETE: "Paquete",
    PAQUETES: "Paquete",
    PQT: "Paquete",
    UND: "Und",
    UNID: "Und",
    UNIDAD: "Und",
    UNIDADES: "Und",
    GRAMO: "Gr",
    GRAMOS: "Gr",
    GR: "Gr",
    GRS: "Gr",
    G: "Gr",
    LITRO: "Litro",
    LITROS: "Litro",
    LT: "Litro",
    LTS: "Litro",
    L: "Litro",
    ML: "MiliLitro",
    MILILITRO: "MiliLitro",
    MILILITROS: "MiliLitro",
    BLOQUE: "Bloque",
    BLOQUES: "Bloque",
    CUBETA: "Cubeta",
    CUBETAS: "Cubeta",
    HUACAL: "Huacal",
    HUACALES: "Huacal",
    MALLA: "Malla",
    MALLAS: "Malla",
    ATADO: "Rollo / Atado",
    ROLLO: "Rollo / Atado",
  };

  if (ALIAS_MAP[normRaw]) {
    const targetAbrev = ALIAS_MAP[normRaw];
    const match = availableUnits.find(
      (u) =>
        normalizeUnitText(u.abreviatura) === normalizeUnitText(targetAbrev) ||
        normalizeUnitText(u.nombre) === normalizeUnitText(targetAbrev),
    );
    if (match) {
      return { status: "EXACT", exactMatch: match, similarMatches: [] };
    }
  }

  const candidates = [];
  for (const u of availableUnits) {
    const normNombre = normalizeUnitText(u.nombre);
    const normAbrev = normalizeUnitText(u.abreviatura);

    let score = 0;
    if (normNombre.includes(normRaw) || normRaw.includes(normNombre)) {
      score += 50;
    } else if (normAbrev.includes(normRaw) || normRaw.includes(normAbrev)) {
      score += 45;
    } else {
      const distNom = levenshteinDistance(normRaw, normNombre);
      const distAbr = levenshteinDistance(normRaw, normAbrev);
      const minDist = Math.min(distNom, distAbr);
      if (minDist <= 2) {
        score += 30 - minDist * 10;
      }
    }

    if (score > 0) {
      candidates.push({ unit: u, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    return {
      status: "SIMILAR",
      exactMatch: null,
      similarMatches: candidates.map((c) => c.unit),
    };
  }

  return { status: "NEW", exactMatch: null, similarMatches: [] };
}

/**
 * Determina si una unidad es una medida estándar/clásica (Kg, Lb, Bloque, Paquete, Und, Gr, Litro)
 * y NO un tipo de embalaje masivo (Bulto, Arroba, Pony, Canastilla, etc.).
 */
export function esUnidadClasica(unidadStr) {
  if (!unidadStr) return true;
  const norm = normalizeUnitText(unidadStr);
  const CLASICAS = [
    "KG",
    "KGS",
    "KILO",
    "KILOS",
    "KILOGRAMO",
    "KILOGRAMOS",
    "LB",
    "LBS",
    "LIBRA",
    "LIBRAS",
    "GR",
    "GRS",
    "GRAMO",
    "GRAMOS",
    "G",
    "BLOQUE",
    "BLOQUES",
    "PAQUETE",
    "PAQUETES",
    "PQT",
    "UND",
    "UNID",
    "UNIDAD",
    "UNIDADES",
    "LITRO",
    "LITROS",
    "LT",
    "LTS",
    "L",
    "ML",
    "MILILITRO",
    "MILILITROS",
  ];
  return CLASICAS.includes(norm);
}

/**
 * Compara inteligentemente si la unidad de un ítem coincide con el nombre o presentación
 * de un empaque o embalaje (manejando mayúsculas, tildes, singulares y plurales).
 */
export function coincideUnidadConEmpaque(unidadStr, empaqueNombre) {
  if (!unidadStr || !empaqueNombre) return false;
  const uNorm = normalizeUnitText(unidadStr);
  const eNorm = normalizeUnitText(empaqueNombre);
  if (uNorm === eNorm) return true;

  const uSing = uNorm.endsWith("S") ? uNorm.slice(0, -1) : uNorm;
  const eSing = eNorm.endsWith("S") ? eNorm.slice(0, -1) : eNorm;
  if (uSing === eSing) return true;

  if (uNorm.includes(eSing) || eNorm.includes(uSing)) return true;
  return false;
}

/**
 * Calcula los kilos de un ítem.
 * Si la unidad es Kilogramos, Libras, Gramos, Bloques, Paquetes, etc., hace el cálculo normal
 * con esa unidad de medida y cantidad.
 * Si la unidad es o coincide con un tipo de embalaje (Bulto, Arroba, etc.), aplica la relación
 * de empaque Cantidad x Kilos del empaque.
 */
export function calcularKilosItem(
  cantidad = 0,
  unidadStr = "Kg",
  customPesoKg = null,
  empaqueInfo = null,
  availableUnits = null,
) {
  const cant = parseFloat(cantidad) || 0;
  if (cant <= 0) return 0;

  const norm = normalizeUnitText(unidadStr);

  // 1. Kilogramos estándar -> 1 Kg por unidad (la cantidad ya son kilos directos)
  if (
    norm === "KG" ||
    norm === "KGS" ||
    norm === "KILO" ||
    norm === "KILOS" ||
    norm === "KILOGRAMO" ||
    norm === "KILOGRAMOS"
  ) {
    return cant;
  }

  // 2. Libras estándar -> 1 Libra = 0.5 Kg
  if (
    norm === "LIBRA" ||
    norm === "LIBRAS" ||
    norm === "LB" ||
    norm === "LBS"
  ) {
    return parseFloat((cant * 0.5).toFixed(2));
  }

  // 3. Gramos estándar -> 1 Gr = 0.001 Kg
  if (
    norm === "GR" ||
    norm === "GRS" ||
    norm === "GRAMO" ||
    norm === "GRAMOS" ||
    norm === "G"
  ) {
    return parseFloat((cant * 0.001).toFixed(3));
  }

  // 4. Bloques, Paquetes, Unidades, Litros -> cálculo normal con esa unidad y cantidad
  if (
    norm === "BLOQUE" ||
    norm === "BLOQUES" ||
    norm === "PAQUETE" ||
    norm === "PAQUETES" ||
    norm === "PQT" ||
    norm === "UND" ||
    norm === "UNID" ||
    norm === "UNIDAD" ||
    norm === "UNIDADES" ||
    norm === "LITRO" ||
    norm === "LITROS" ||
    norm === "LT" ||
    norm === "LTS" ||
    norm === "L" ||
    norm === "ML" ||
    norm === "MILILITRO"
  ) {
    const pesoUnit =
      customPesoKg &&
      parseFloat(customPesoKg) > 0 &&
      parseFloat(customPesoKg) <= 10
        ? parseFloat(customPesoKg)
        : 1.0;
    return parseFloat((cant * pesoUnit).toFixed(2));
  }

  // 5. Si se envió customPesoKg explícito para un empaque o medida no clásica
  if (
    customPesoKg &&
    parseFloat(customPesoKg) > 0 &&
    !esUnidadClasica(unidadStr)
  ) {
    return parseFloat((cant * parseFloat(customPesoKg)).toFixed(2));
  }

  // 6. Si hay empaque_info estructurado y la unidad coincide con la presentación del empaque
  if (
    empaqueInfo &&
    parseFloat(empaqueInfo.peso_kg) > 0 &&
    coincideUnidadConEmpaque(
      unidadStr,
      empaqueInfo.presentacion || empaqueInfo.nombre,
    )
  ) {
    return parseFloat((cant * parseFloat(empaqueInfo.peso_kg)).toFixed(2));
  }

  // 7. Tipos de Embalaje Estandarizados conocidos por defecto (Bulto, Arroba, Pony, Canastilla, etc.)
  if (norm === "BULTO" || norm === "BULTOS" || norm === "BULT")
    return parseFloat((cant * 50.0).toFixed(2));
  if (norm === "ARROBA" || norm === "ARROBAS" || norm === "ARR")
    return parseFloat((cant * 12.5).toFixed(2));
  if (norm === "PONY" || norm === "PONYS")
    return parseFloat((cant * 25.0).toFixed(2));
  if (
    norm === "CANASTILLA" ||
    norm === "CANASTILLAS" ||
    norm === "CANASTA" ||
    norm === "CANASTAS"
  )
    return parseFloat((cant * 22.0).toFixed(2));
  if (norm === "CAJA" || norm === "CAJAS")
    return parseFloat((cant * 15.0).toFixed(2));
  if (norm === "SACO" || norm === "SACOS")
    return parseFloat((cant * 30.0).toFixed(2));
  if (norm === "HUACAL" || norm === "HUACALES")
    return parseFloat((cant * 20.0).toFixed(2));
  if (norm === "CUBETA" || norm === "CUBETAS")
    return parseFloat((cant * 2.0).toFixed(2));
  if (norm === "MALLA" || norm === "MALLAS")
    return parseFloat((cant * 2.0).toFixed(2));

  // 7. Si se proporcionó un catálogo de unidades, buscar coincidencia
  const catalog = availableUnits || getAllAvailableUnits();
  const matched = matchUnitWithCatalog(unidadStr, catalog);
  if (matched.exactMatch) {
    const pesoKg = parseFloat(matched.exactMatch.peso_kg) || 1.0;
    return parseFloat((cant * pesoKg).toFixed(2));
  }

  return cant;
}
