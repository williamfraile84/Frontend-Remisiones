import React from "react";
import { FileUp, Truck, Calculator, FileText, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function MobileNav({
  currentPath,
  onNavigate,
  onOpenMenu,
}) {
  const { hasPermission } = useAuth();

  const allTabs = [
    {
      id: "pedidos",
      label: "Pedidos",
      path: "/pedidos",
      icon: FileUp,
      visible:
        hasPermission("puede_crear_pedidos") ||
        hasPermission("puede_editar_pedidos") ||
        hasPermission("puede_ver_historial"),
    },
    {
      id: "surtido",
      label: "Surtido",
      path: "/surtido",
      icon: Truck,
      visible: hasPermission("puede_ver_surtido"),
    },
    {
      id: "liquidacion",
      label: "Liquidación",
      path: "/liquidacion",
      icon: Calculator,
      visible: hasPermission("puede_ver_financiero"),
    },
    {
      id: "documentos",
      label: "Salidas",
      path: "/documentos",
      icon: FileText,
      visible:
        hasPermission("puede_ver_documentos") ||
        hasPermission("puede_cargar_documentos"),
    },
  ];

  const mainTabs = allTabs.filter((t) => t.visible !== false);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg px-2 py-1.5 pb-safe flex justify-around items-center select-none">
      {mainTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          currentPath === tab.path ||
          (tab.path === "/pedidos" && currentPath === "/");

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onNavigate(tab.path)}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition cursor-pointer ${
              isActive
                ? "text-emerald-600 dark:text-emerald-400 font-black scale-105"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 font-medium"
            }`}
          >
            <Icon
              className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`}
            />
            <span className="text-[10px] mt-0.5 tracking-tight font-bold">
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Botón de Menú Completo (Abre Drawer con todos los 8 módulos) */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
      >
        <div className="relative">
          <Menu className="w-5 h-5 stroke-[1.75]" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-bold">
          Más...
        </span>
      </button>
    </nav>
  );
}
