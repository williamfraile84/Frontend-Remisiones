import React from "react";
import { Users, UserPlus, ChevronDown } from "lucide-react";

export default function ClientSelector({
  clients = [],
  selectedClient,
  onSelectClient,
  onOpenNewClientModal,
  disabled = false,
  fullWidth = false,
}) {
  return (
    <div
      className={`flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-1 sm:p-1.5 shadow-xs ${
        fullWidth ? "w-full" : "max-w-full"
      } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
    >
      <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 shrink-0">
        <div className="w-5 h-5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <Users className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 hidden lg:inline">
          Cliente:
        </span>
      </div>

      <div className="relative flex-1 min-w-0">
        <select
          disabled={disabled}
          aria-label="Seleccionar cliente"
          className={`bg-slate-50/80 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 rounded-xl py-1.5 pl-2.5 pr-7 outline-none cursor-pointer transition focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed appearance-none truncate ${
            fullWidth
              ? "w-full"
              : "w-full min-w-[120px] max-w-[150px] xs:max-w-[180px] sm:max-w-[210px] md:max-w-[250px] lg:max-w-[290px]"
          }`}
          value={selectedClient?.id || ""}
          onChange={(e) => {
            const client = clients.find(
              (c) => c.id === parseInt(e.target.value, 10),
            );
            if (client) onSelectClient(client);
          }}
        >
          {clients.length === 0 ? (
            <option value="">Sin clientes registrados</option>
          ) : (
            <>
              {!selectedClient && (
                <option value="" disabled>
                  Seleccionar cliente...
                </option>
              )}
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razon_social} ({c.nit || "S/N"})
                </option>
              ))}
            </>
          )}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2 top-2 pointer-events-none" />
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={onOpenNewClientModal}
          className="p-1.5 text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl transition cursor-pointer shrink-0"
          title="Añadir nuevo cliente"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
