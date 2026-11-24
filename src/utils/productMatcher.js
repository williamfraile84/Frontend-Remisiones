/**
 * Utilidad inteligente para comparar nombres de productos ingresados en el pedido
 * contra el catálogo estandarizado de productos/empaques del sistema.
 *
 * Detecta:
 * 1. "EXACT": Coincide exactamente con un producto del catálogo.
 * 2. "SIMILAR": Existen opciones similares o ambiguas (ej: "PAPA" -> Papa Pastusa, Papa Criolla...).
 * 3. "NEW": Producto completamente nuevo que no existe en el catálogo.
 */

export function normalizeText(str) {
  if (!str) return "";
  return str
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remover tildes
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Distancia de Levenshtein para tolerancia a errores tipográficos leves.
 */
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
          dp[i - 1][j] + 1, // eliminación
          dp[i][j - 1] + 1, // inserción
          dp[i - 1][j - 1] + 1, // sustitución
        );
      }
    }
  }
  return dp[m][n];
}

// Caché en memoria para evitar recálculos repetitivos de Levenshtein
const matchCache = new Map();
const MAX_CACHE_SIZE = 1000;

/**
 * Evalúa un nombre de producto ingresado contra la lista de productos estandarizados.
 *
 * @param {string} rawName - Nombre ingresado en el pedido (ej. "PAPA" o "CEBOLLA")
 * @param {Array<string>} catalogNames - Lista de nombres únicos del catálogo (ej. ["PAPA PASTUSA", "PAPA CRIOLLA", ...])
 * @returns {{ status: "EXACT"|"SIMILAR"|"NEW"|"EMPTY", exactMatch: string|null, similarMatches: Array<string> }}
 */
export function matchProductWithCatalog(rawName, catalogNames = []) {
  if (!rawName || !rawName.trim()) {
    return { status: "EMPTY", exactMatch: null, similarMatches: [] };
  }

  const normRaw = normalizeText(rawName);
  if (!normRaw) {
    return { status: "EMPTY", exactMatch: null, similarMatches: [] };
  }

  const cacheKey = `${normRaw}:::${catalogNames.length}`;
  if (matchCache.has(cacheKey)) {
    return matchCache.get(cacheKey);
  }

  const saveAndReturn = (res) => {
    if (matchCache.size >= MAX_CACHE_SIZE) {
      const firstKey = matchCache.keys().next().value;
      matchCache.delete(firstKey);
    }
    matchCache.set(cacheKey, res);
    return res;
  };

  const rawWords = normRaw.split(" ").filter(Boolean);

  // 1. Verificar coincidencia exacta
  for (const cat of catalogNames) {
    const normCat = normalizeText(cat);
    if (normRaw === normCat) {
      return saveAndReturn({
        status: "EXACT",
        exactMatch: cat,
        similarMatches: [],
      });
    }
  }

  // 2. Buscar productos similares o ambiguos
  const candidates = [];

  for (const cat of catalogNames) {
    const normCat = normalizeText(cat);
    const catWords = normCat.split(" ").filter(Boolean);

    let isMatch = false;
    let score = 0;

    // Caso A: El texto ingresado está contenido dentro del nombre del catálogo
    // Ej: "PAPA" está contenido en "PAPA PASTUSA", "PAPA CRIOLLA"
    if (normCat.includes(normRaw)) {
      isMatch = true;
      score += 50;
      if (normCat.startsWith(normRaw)) score += 20;
    }

    // Caso B: El nombre del catálogo está contenido en el texto ingresado
    // Ej: "PAPA PASTUSA SELECCIONADA" contiene "PAPA PASTUSA"
    else if (normRaw.includes(normCat)) {
      isMatch = true;
      score += 40;
    }

    // Caso C: Coincidencia de palabras clave principales
    else {
      const commonWords = rawWords.filter(
        (w) => w.length > 2 && catWords.includes(w),
      );
      if (commonWords.length > 0) {
        isMatch = true;
        score += commonWords.length * 20;
      }
    }

    // Caso D: Error tipográfico leve (Levenshtein)
    if (!isMatch && rawWords[0] && rawWords[0].length >= 4) {
      for (const cw of catWords) {
        if (Math.abs(cw.length - rawWords[0].length) <= 2) {
          const dist = levenshteinDistance(rawWords[0], cw);
          if (dist <= 1 || (rawWords[0].length >= 6 && dist <= 2)) {
            isMatch = true;
            score += 15 - dist;
            break;
          }
        }
      }
    }

    if (isMatch) {
      candidates.push({ name: cat, score });
    }
  }

  if (candidates.length > 0) {
    // Ordenar por relevancia y limitar a los 6 más relevantes
    candidates.sort((a, b) => b.score - a.score);
    const uniqueMatches = Array.from(
      new Set(candidates.map((c) => c.name)),
    ).slice(0, 6);
    return saveAndReturn({
      status: "SIMILAR",
      exactMatch: null,
      similarMatches: uniqueMatches,
    });
  }

  // 3. Es un producto completamente nuevo
  return saveAndReturn({
    status: "NEW",
    exactMatch: null,
    similarMatches: [],
  });
}
