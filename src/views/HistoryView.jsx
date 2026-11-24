import React, { useState, useMemo } from "react";
import {
  Eye,
  Upload,
  Trash2,
  Lock,
  Search,
  FileText,
  CheckCircle2,
  DollarSign,
  History as HistoryIcon,
  Users,
  ChevronDown,
} from "lucide-react";
import { API_BASE_URL } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

export default function HistoryView({
  clienteSeleccionado,
  clientes = [],
  isOnline = true,
  onSelectClient,
  activeOrder,
  onSelectOrder,
}) {
  const {
    historialCliente = [],
    handleSubirArchivoCierre,
    eliminarPedido,
  } = activeOrder;
  const { hasPermission } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all | abiertos | facturados | firmados | cerrados

  const canDelete = hasPermission("puede_desactivar_pedidos");
  const canUploadFacturas = hasPermission("puede_cargar_facturas");
  const canUploadFirmadas = hasPermission("puede_cargar_remisiones_firmadas");
  const activeToken =
    localStorage.getItem("app_token") ||
    localStorage.getItem("fruver_token") ||
    "";

  // Métricas del Historial del Cliente
  const stats = useMemo(() => {
    const total = historialCliente.length;
    let facturados = 0;
    let firmados = 0;
    let cerrados = 0;
    let totalVentas = 0;

    historialCliente.forEach((p) => {
      if (p.factura_cargada) facturados += 1;
      if (p.remision_firmada_cargada) firmados += 1;
      if (p.factura_cargada || p.remision_firmada_cargada || p.completado)
        cerrados += 1;
      totalVentas += p.liquidacion?.resumen?.total_ventas || 0;
    });

    return { total, facturados, firmados, cerrados, totalVentas };
  }, [historialCliente]);

  // Filtrado reactivo en tiempo real
  const pedidosFiltrados = useMemo(() => {
    return historialCliente.filter((p) => {
      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        !term ||
        (p.numero_remision && p.numero_remision.toLowerCase().includes(term)) ||
        (p.numero_oc && p.numero_oc.toLowerCase().includes(term)) ||
        (p.fecha_entrega && p.fecha_entrega.toLowerCase().includes(term));

      if (!matchSearch) return false;

      const isCerrado = Boolean(
        p.factura_cargada || p.remision_firmada_cargada || p.completado,
      );
      if (filterStatus === "abiertos") return !isCerrado;
      if (filterStatus === "facturados") return Boolean(p.factura_cargada);
      if (filterStatus === "firmados")
        return Boolean(p.remision_firmada_cargada);
      if (filterStatus === "cerrados") return isCerrado;
      return true;
    });
  }, [historialCliente, searchTerm, filterStatus]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Selección de Cliente Inicial si no hay ninguno activo */}
      {!clienteSeleccionado && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              Seleccione un Cliente para ver su Historial
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Consulte remisiones emitidas, estados de facturación y métricas
              contables por cliente.
            </p>
          </div>

          {clientes.length > 0 && (
            <div className="max-w-xs mx-auto relative">
              <select
                aria-label="Seleccionar cliente para consultar historial"
                className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-900 dark:text-white rounded-xl py-2 px-3 pr-8 outline-none shadow-xs cursor-pointer transition focus:ring-2 focus:ring-emerald-500 appearance-none"
                value=""
                onChange={(e) => {
                  const client = clientes.find(
                    (c) => c.id === parseInt(e.target.value, 10),
                  );
                  if (client && onSelectClient) onSelectClient(client);
                }}
              >
                <option value="" disabled>
                  Seleccionar cliente de la lista...
                </option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razon_social} ({c.nit || "S/N"})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          )}
        </div>
      )}

      {/* 2. Tarjetas de Métricas del Historial */}
      {clienteSeleccionado && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                Total Remisiones
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {stats.total}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
                Para {clienteSeleccionado.razon_social}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                Facturadas
              </span>
              <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 tabular-nums">
                {stats.facturados}
              </span>
              <span className="text-[10px] text-blue-400 dark:text-blue-400/80 block mt-0.5 truncate">
                Con soporte de factura
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                Firmadas
              </span>
              <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-400 tabular-nums">
                {stats.firmados}
              </span>
              <span className="text-[10px] text-purple-400 dark:text-purple-400/80 block mt-0.5 truncate">
                Con remisión física
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                Ventas Acumuladas
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <span
                className="text-lg sm:text-xl font-black text-emerald-800 dark:text-emerald-400 truncate tabular-nums block"
                title={`$${stats.totalVentas.toLocaleString("es-CO")}`}
              >
                ${stats.totalVentas.toLocaleString("es-CO")}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold block mt-0.5 truncate">
                Total histórico cliente
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Barra de Filtros y Tabla de Historial */}
      {clienteSeleccionado && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="min-w-0">
              <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Historial de Pedidos:{" "}
                {clienteSeleccionado?.razon_social || "Sin Cliente"}
              </h3>
              <p className="text-[11px] text-slate-400">
                Gestión de remisiones emitidas, estados de facturación y
                trazabilidad contable.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Selector para cambiar de cliente en historial */}
              {clientes.length > 0 && (
                <div className="relative">
                  <select
                    aria-label="Cambiar cliente para historial"
                    className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl py-1.5 pl-2.5 pr-7 outline-none cursor-pointer transition focus:ring-2 focus:ring-emerald-500 max-w-full sm:max-w-[200px] truncate shadow-2xs appearance-none"
                    value={clienteSeleccionado?.id || ""}
                    onChange={(e) => {
                      const client = clientes.find(
                        (c) => c.id === parseInt(e.target.value, 10),
                      );
                      if (client && onSelectClient) onSelectClient(client);
                    }}
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.razon_social}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>
              )}

              {/* Buscador */}
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="text"
                  placeholder="Buscar por Remisión, OC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-56 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 pl-8 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Filtro por Estado */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto custom-scrollbar">
                {[
                  { id: "all", label: "Todos" },
                  { id: "abiertos", label: "Abiertos" },
                  { id: "facturados", label: "Facturados" },
                  { id: "firmados", label: "Firmados" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterStatus(f.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                      filterStatus === f.id
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Listado / Tabla de Pedidos */}
          {pedidosFiltrados.length === 0 ? (
            <p className="text-center py-10 sm:py-12 text-xs text-slate-400 dark:text-slate-500 italic">
              {historialCliente.length === 0
                ? "No hay remisiones guardadas para este cliente."
                : "No se encontraron remisiones que coincidan con los filtros aplicados."}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pedidosFiltrados.map((p) => {
                const isPedidoCerrado = Boolean(
                  p.factura_cargada ||
                  p.remision_firmada_cargada ||
                  p.completado,
                );
                const puedeDarDeBaja =
                  canDelete &&
                  !p.factura_cargada &&
                  !p.remision_firmada_cargada &&
                  !p.completado;

                return (
                  <div
                    key={p.id}
                    className="py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 p-3 rounded-2xl transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    {/* Información Principal del Pedido */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white font-mono">
                          Remisión #{p.numero_remision}
                        </span>
                        {p.numero_oc && (
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            OC: {p.numero_oc}
                          </span>
                        )}
                        {p.factura_cargada && (
                          <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                            Facturado
                          </span>
                        )}
                        {p.remision_firmada_cargada && (
                          <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                            Firmado
                          </span>
                        )}
                        {isPedidoCerrado && (
                          <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Cerrado
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Fecha:{" "}
                        <strong className="text-slate-800 dark:text-slate-200 font-bold">
                          {p.fecha_entrega || "S/F"}
                        </strong>{" "}
                        | Total Venta:{" "}
                        <strong className="text-emerald-700 dark:text-emerald-400 font-black tabular-nums">
                          $
                          {(
                            p.liquidacion?.resumen?.total_ventas || 0
                          ).toLocaleString("es-CO")}
                        </strong>{" "}
                        | Ítems: {(p.productos || []).length}
                      </p>
                    </div>

                    {/* Barra de Acciones del Pedido */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                      {p.factura_cargada
                        ? isOnline && (
                            <a
                              href={`${API_BASE_URL}/pedidos/${p.id}/factura/preview${activeToken ? `?token=${encodeURIComponent(activeToken)}` : ""}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition shadow-2xs border border-blue-200 dark:border-blue-800"
                            >
                              <Eye className="w-3.5 h-3.5" />{" "}
                              <span>Factura</span>
                            </a>
                          )
                        : canUploadFacturas &&
                          isOnline && (
                            <label className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 shadow-xs transition">
                              <Upload className="w-3.5 h-3.5" />{" "}
                              <span>Factura</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) =>
                                  handleSubirArchivoCierre(
                                    p.id,
                                    "factura",
                                    e.target.files[0],
                                  )
                                }
                              />
                            </label>
                          )}

                      {p.remision_firmada_cargada
                        ? isOnline && (
                            <a
                              href={`${API_BASE_URL}/pedidos/${p.id}/remision-firmada/preview${activeToken ? `?token=${encodeURIComponent(activeToken)}` : ""}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition shadow-2xs border border-purple-200 dark:border-purple-800"
                            >
                              <Eye className="w-3.5 h-3.5" />{" "}
                              <span>Rem. Firmada</span>
                            </a>
                          )
                        : canUploadFirmadas &&
                          isOnline && (
                            <label className="bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 shadow-xs transition">
                              <Upload className="w-3.5 h-3.5" />{" "}
                              <span>Rem. Firmada</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) =>
                                  handleSubirArchivoCierre(
                                    p.id,
                                    "remision-firmada",
                                    e.target.files[0],
                                  )
                                }
                              />
                            </label>
                          )}

                      <button
                        type="button"
                        onClick={() => onSelectOrder(p)}
                        className="bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 active:scale-[0.98] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition shadow-xs"
                      >
                        Cargar en Pantalla
                      </button>

                      {/* Desactivar pedido (Baja lógica) */}
                      {puedeDarDeBaja && isOnline && (
                        <button
                          type="button"
                          onClick={() => eliminarPedido(p.id)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition cursor-pointer"
                          title="Desactivar pedido (Baja lógica)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
