import apiClient from "./apiClient";

const CACHE_KEY = "app_tipos_empaque_cache";

export const DEFAULT_TIPOS = [
  { id: 1, nombre: "Bulto", peso_kg: 50.0, peso_lb: 100.0, descripcion: "Bulto completo estándar tradicional (50 kg / 100 lb)", activo: true },
  { id: 2, nombre: "Pony", peso_kg: 25.0, peso_lb: 50.0, descripcion: "Medio bulto estándar seleccionado (25 kg / 50 lb)", activo: true },
  { id: 3, nombre: "Canastilla", peso_kg: 22.0, peso_lb: 44.0, descripcion: "Canastilla plástica fruver (22 kg / 44 lb)", activo: true },
  { id: 4, nombre: "Caja", peso_kg: 15.0, peso_lb: 30.0, descripcion: "Caja de cartón o madera (15 kg / 30 lb)", activo: true },
  { id: 5, nombre: "Saco", peso_kg: 30.0, peso_lb: 60.0, descripcion: "Saco ventilado o parafinado (30 kg / 60 lb)", activo: true },
  { id: 6, nombre: "Bolsa", peso_kg: 5.0, peso_lb: 10.0, descripcion: "Bolsa plástica o paquete (5 kg / 10 lb)", activo: true },
  { id: 7, nombre: "Rollo / Atado", peso_kg: 12.0, peso_lb: 24.0, descripcion: "Atado de hierbas u hortalizas (12 kg / 24 lb)", activo: true },
  { id: 8, nombre: "Arroba", peso_kg: 12.5, peso_lb: 25.0, descripcion: "Arroba tradicional de 25 lb (12.5 kg / 25 lb)", activo: true },
  { id: 9, nombre: "Malla", peso_kg: 3.0, peso_lb: 6.0, descripcion: "Malla transpirable (3 kg / 6 lb)", activo: true },
  { id: 10, nombre: "Cubeta", peso_kg: 2.0, peso_lb: 4.0, descripcion: "Cubeta rígida para huevos o frutas (2 kg / 4 lb)", activo: true },
  { id: 11, nombre: "Huacal", peso_kg: 20.0, peso_lb: 40.0, descripcion: "Huacal de madera tradicional (20 kg / 40 lb)", activo: true },
];

export const empaqueApi = {
  getAll: async (search = "") => {
    try {
      const res = await apiClient.get("/empaques", {
        params: search ? { search } : {},
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(res.data));
        } catch {
          // ignore quota
        }
        return res.data;
      }
    } catch {
      // Fallback offline
    }

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const list = JSON.parse(cached);
        if (Array.isArray(list) && list.length > 0) {
          if (search) {
            const s = search.toUpperCase();
            return list.filter(
              (e) =>
                (e.nombre && e.nombre.toUpperCase().includes(s)) ||
                (e.descripcion && e.descripcion.toUpperCase().includes(s)),
            );
          }
          return list;
        }
      }
    } catch {
      // ignore
    }

    return DEFAULT_TIPOS;
  },

  getTipos: async (search = "") => {
    return empaqueApi.getAll(search);
  },

  getById: async (id) => {
    const res = await apiClient.get(`/empaques/${id}`);
    return res.data;
  },

  create: async (tipoData) => {
    const payload = {
      nombre: tipoData.nombre.trim(),
      peso_kg: parseFloat(tipoData.peso_kg) || 0,
      peso_lb:
        tipoData.peso_lb !== undefined && tipoData.peso_lb !== ""
          ? parseFloat(tipoData.peso_lb)
          : (parseFloat(tipoData.peso_kg) || 0) * 2,
      descripcion: tipoData.descripcion || "",
      activo: tipoData.activo !== undefined ? tipoData.activo : true,
    };
    const res = await apiClient.post("/empaques", payload);
    return res.data;
  },

  createTipo: async (tipoData) => {
    return empaqueApi.create(tipoData);
  },

  update: async (id, tipoData) => {
    const payload = {};
    if (tipoData.nombre !== undefined) payload.nombre = tipoData.nombre.trim();
    if (tipoData.peso_kg !== undefined) payload.peso_kg = parseFloat(tipoData.peso_kg);
    if (tipoData.peso_lb !== undefined) payload.peso_lb = parseFloat(tipoData.peso_lb);
    if (tipoData.descripcion !== undefined) payload.descripcion = tipoData.descripcion;
    if (tipoData.activo !== undefined) payload.activo = tipoData.activo;

    const res = await apiClient.put(`/empaques/${id}`, payload);
    return res.data;
  },

  updateTipo: async (id, tipoData) => {
    return empaqueApi.update(id, tipoData);
  },

  delete: async (id) => {
    const res = await apiClient.delete(`/empaques/${id}`);
    return res.data;
  },

  deleteTipo: async (id) => {
    return empaqueApi.delete(id);
  },
};

export const tipoEmpaqueApi = empaqueApi;
export default empaqueApi;
