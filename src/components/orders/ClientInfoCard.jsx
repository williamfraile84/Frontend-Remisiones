import React from "react";
import {
  Building2,
  Edit3,
  UserPlus,
  MapPin,
  Phone,
  Mail,
  Hash,
  Users,
  ChevronDown,
  Lock,
} from "lucide-react";

export default function ClientInfoCard({
  clients = [],
  clientes = [],
  selectedClient,
  onSelectClient,
  onOpenEditClientModal,
  onOpenNewClientModal,
  disabled = false,
  isPedidoBloqueado = false,
  canManageClients = true,
  esTemporal = false,
}) {
  if (esTemporal) return null;

  const clientList = clients && clients.length > 0 ? clients : clientes || [];

  if (!selectedClient) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900/80 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
              No hay cliente seleccionado
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Seleccione un cliente registrado para asociar el pedido o cree uno
              nuevo.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {clientList.length > 0 && (
            <div className="relative flex-1 sm:w-60 md:w-72">
              <select
                aria-label="Seleccionar cliente"
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-900 dark:text-slate-100 rounded-xl py-2 px-3 pr-8 outline-none shadow-xs cursor-pointer transition focus:ring-2 focus:ring-emerald-500 appearance-none"
                value=""
                onChange={(e) => {
                  const client = clientList.find(
                    (c) => c.id === parseInt(e.target.value, 10),
                  );
                  if (client) onSelectClient(client);
                }}
              >
                <option value="" disabled>
                  Seleccionar cliente de la lista...
                </option>
                {clientList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razon_social} ({c.nit || "S/N"})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          )}

          {canManageClients && (
            <button
              type="button"
              onClick={onOpenNewClientModal}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition hover:border-slate-300 dark:hover:border-slate-700">
      {/* Barra superior de la tarjeta */}
      <div className="bg-slate-50/90 dark:bg-slate-800/80 px-3.5 sm:px-5 py-3 border-b border-slate-200/80 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Identidad del cliente */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                Cliente Activo
              </span>
              <h2
                className="font-black text-slate-900 dark:text-white text-xs sm:text-sm md:text-base uppercase tracking-tight truncate max-w-[200px] xs:max-w-[280px] sm:max-w-md"
                title={selectedClient.razon_social}
              >
                {selectedClient.razon_social}
              </h2>
              <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                NIT: {selectedClient.nit || "S/N"}
              </span>
            </div>
          </div>
        </div>

        {/* Botones de acción del cliente */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Selector para cambiar de cliente rápidamente */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              disabled={disabled || isPedidoBloqueado}
              aria-label="Cambiar de cliente"
              className="w-full sm:w-auto bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl py-1.5 pl-2.5 pr-7 outline-none cursor-pointer transition focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed appearance-none max-w-full sm:max-w-[200px] md:max-w-[240px] truncate shadow-2xs"
              value={selectedClient.id || ""}
              onChange={(e) => {
                const client = clientList.find(
                  (c) => c.id === parseInt(e.target.value, 10),
                );
                if (client) onSelectClient(client);
              }}
            >
              {clientList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razon_social}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>

          {/* Botón Destacado: Modificar Cliente */}
          {canManageClients && (
            <button
              type="button"
              onClick={onOpenEditClientModal}
              disabled={disabled || isPedidoBloqueado}
              className="bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              title="Modificar datos, dirección, teléfono y consecutivo del cliente"
            >
              <Edit3 className="w-3.5 h-3.5 shrink-0" />
              <span>Modificar Cliente</span>
            </button>
          )}

          {/* Botón: Nuevo Cliente */}
          {canManageClients && !isPedidoBloqueado && (
            <button
              type="button"
              onClick={onOpenNewClientModal}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shrink-0 border border-slate-200/60 dark:border-slate-700"
              title="Registrar nuevo cliente"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo</span>
            </button>
          )}
        </div>
      </div>

      {/* Fila de detalles del cliente */}
      <div className="px-3.5 sm:px-5 py-2.5 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs bg-white dark:bg-slate-900">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span
            className="text-[11px] truncate"
            title={selectedClient.direccion || "Sin dirección registrada"}
          >
            {selectedClient.direccion || "Sin dirección"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span
            className="text-[11px] truncate"
            title={selectedClient.telefono || "Sin teléfono registrado"}
          >
            {selectedClient.telefono || "Sin teléfono"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span
            className="text-[11px] truncate"
            title={selectedClient.email || "Sin email registrado"}
          >
            {selectedClient.email || "Sin email"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold min-w-0 justify-start lg:justify-end">
          <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-[11px] truncate">
            Consecutivo Actual:{" "}
            <strong className="text-emerald-700 dark:text-emerald-400 font-mono">
              #{selectedClient.consecutivo_remision_actual || 1}
            </strong>
          </span>
        </div>
      </div>

      {isPedidoBloqueado && (
        <div className="bg-amber-50/80 dark:bg-amber-950/40 px-4 py-1.5 border-t border-amber-200/70 dark:border-amber-800 text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Este pedido está cerrado. Para modificar datos del cliente o
            productos cree un nuevo pedido o desbloquee.
          </span>
        </div>
      )}
    </div>
  );
}
