import React from "react";
import {
  FileUp,
  Truck,
  Calculator,
  FileText,
  History,
  Scale,
  Package,
  DollarSign,
  Shield,
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
  Layers,
} from "lucide-react";
import { API_BASE_URL } from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  currentPath,
  onNavigate,
  empresa,
  empresas = [],
  onOpenSelectorEmpresa,
  canEditCompany,
  onOpenCompanyModal,
  isTemporal,
  isAdmin,
  effectiveIsOnline,
}) {
  const { hasPermission } = useAuth();
  const logoUrl = empresa?.logo_path
    ? `${API_BASE_URL.replace("/api", "")}/storage_data/${empresa.logo_path}`
    : null;

  const operacionItems = [
    {
      id: "pedidos",
      label: "Operación & Pedido",
      path: "/pedidos",
      icon: FileUp,
      shortcut: "Alt+1",
      visible:
        hasPermission("puede_crear_pedidos") ||
        hasPermission("puede_editar_pedidos") ||
        hasPermission("puede_ver_historial"),
    },
    {
      id: "surtido",
      label: "Surtido & Compras",
      path: "/surtido",
      icon: Truck,
      shortcut: "Alt+S",
      visible: hasPermission("puede_ver_surtido"),
    },
    {
      id: "liquidacion",
      label: "Liquidación & Gastos",
      path: "/liquidacion",
      icon: Calculator,
      shortcut: "Alt+2",
      visible: hasPermission("puede_ver_financiero"),
    },
    {
      id: "documentos",
      label: "Salidas & Documentos",
      path: "/documentos",
      icon: FileText,
      shortcut: "Alt+3",
      visible:
        hasPermission("puede_ver_documentos") ||
        hasPermission("puede_cargar_documentos"),
    },
    ...(!isTemporal
      ? [
          {
            id: "historial",
            label: "Historial de Pedidos",
            path: "/historial",
            icon: History,
            shortcut: "Alt+4",
            visible: hasPermission("puede_ver_historial"),
          },
        ]
      : []),
  ].filter((item) => item.visible !== false);

  const catalogosItems = [
    {
      id: "presentaciones",
      label: "Empaques & Medidas",
      path: "/presentaciones",
      icon: Scale,
      shortcut: "Alt+5",
      visible:
        hasPermission("puede_gestionar_empaques") ||
        hasPermission("puede_gestionar_catalogos"),
    },
    {
      id: "productos",
      label: "Catálogo Productos",
      path: "/productos",
      icon: Package,
      shortcut: "Alt+6",
      visible: hasPermission("puede_gestionar_catalogos"),
    },
    {
      id: "matriz_empaques",
      label: "Matriz Empaques & Kilos",
      path: "/matriz-empaques",
      icon: Layers,
      shortcut: "Alt+E",
      visible: hasPermission("puede_gestionar_catalogos"),
    },
    {
      id: "conceptos_gasto",
      label: "Conceptos de Gasto",
      path: "/conceptos-gasto",
      icon: DollarSign,
      shortcut: "Alt+7",
      visible: hasPermission("puede_gestionar_conceptos_gasto"),
    },
  ].filter((item) => item.visible !== false);

  const canAccessAdmin =
    isAdmin ||
    hasPermission("puede_administrar_usuarios") ||
    hasPermission("puede_ver_auditoria");

  const adminItems = [
    {
      id: "admin",
      label: "Administración & Logs",
      path: "/admin",
      icon: Shield,
      shortcut: "Alt+A",
      visible: canAccessAdmin,
    },
  ].filter((item) => item.visible !== false);

  const navGroups = [
    ...(operacionItems.length > 0
      ? [{ title: "Operación", items: operacionItems }]
      : []),
    ...(catalogosItems.length > 0
      ? [{ title: "Catálogos Maestros", items: catalogosItems }]
      : []),
    ...(adminItems.length > 0
      ? [{ title: "Sistema", items: adminItems }]
      : []),
  ];

  const handleItemClick = (path) => {
    onNavigate(path);
    if (mobileOpen) setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Encabezado del Menú con Identidad de Empresa */}
      <div
        className={`flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800 p-3.5 transition-all duration-200 shrink-0 ${
          collapsed ? "justify-center px-2" : "px-4"
        }`}
      >
        <button
          type="button"
          onClick={onOpenSelectorEmpresa || onOpenCompanyModal}
          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer group"
          title={empresas && empresas.length > 1 ? "Cambiar de empresa" : "Perfil de empresa"}
        >
          <div className="w-9 h-9 bg-slate-900 border border-slate-700/50 flex items-center justify-center rounded-xl overflow-hidden shadow-xs shrink-0 group-hover:border-emerald-500 transition">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <span className="text-emerald-400 font-black text-xs">
                {(empresa?.nombre || "FR").slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <h2
                  className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition"
                  title={empresa?.nombre || "Sistema Fruver"}
                >
                  {empresa?.nombre || "Sistema Fruver"}
                </h2>
                {empresas && empresas.length > 1 && (
                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-black shrink-0 border border-emerald-300 dark:border-emerald-800">
                    {empresas.length}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                NIT: {empresa?.nit || "Sin NIT"}
              </p>
            </div>
          )}
        </button>

        {!collapsed && canEditCompany && effectiveIsOnline && (
          <button
            type="button"
            onClick={onOpenCompanyModal}
            className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Configuración de Empresa"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Botón cerrar para móvil */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg ml-auto cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Lista de Navegación con Grupos */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <p className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                {group.title}
              </p>
            )}
            {collapsed && (
              <div className="w-6 h-px bg-slate-200 dark:bg-slate-800 mx-auto my-2" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentPath === item.path ||
                  (item.path === "/pedidos" && currentPath === "/");

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.path)}
                    className={`group relative w-full flex items-center gap-2.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                      collapsed ? "justify-center px-2" : "px-3"
                    } ${
                      isActive
                        ? "bg-emerald-500 text-white shadow-xs font-black shadow-emerald-500/25"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive
                          ? "text-white stroke-[2.5]"
                          : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 stroke-[2]"
                      }`}
                    />

                    {!collapsed && (
                      <span className="flex-1 text-left truncate leading-tight">
                        {item.label}
                      </span>
                    )}

                    {!collapsed && (
                      <kbd
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition ${
                          isActive
                            ? "bg-emerald-600/60 border-emerald-400/40 text-emerald-100"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-slate-300"
                        }`}
                      >
                        {item.shortcut}
                      </kbd>
                    )}

                    {/* Tooltip flotante en modo colapsado */}
                    {collapsed && (
                      <div className="pointer-events-none fixed left-18 z-50 invisible opacity-0 -translate-x-1 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2 border border-slate-800">
                        <span>{item.label}</span>
                        <kbd className="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                          {item.shortcut}
                        </kbd>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Pie del Sidebar: Botón Colapsar / Expandir (Visible en Desktop) */}
      <div className="hidden md:flex p-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-2 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xs transition cursor-pointer ${
            collapsed ? "justify-center px-1" : "px-3"
          }`}
          title={
            collapsed
              ? "Expandir menú lateral (Ctrl+B)"
              : "Colapsar menú lateral (Ctrl+B)"
          }
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="flex-1 text-left text-[11px] text-slate-500 dark:text-slate-400">
                Colapsar Menú
              </span>
              <kbd className="text-[9px] font-mono bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                Ctrl+B
              </kbd>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar fijo para escritorio (Desktop / Tablet) */}
      <aside
        className={`hidden md:block fixed top-0 bottom-0 left-0 z-30 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 transition-all duration-200 shadow-2xs ${
          collapsed ? "w-[68px]" : "w-[240px]"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Drawer deslizante para móvil */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop con fade-in */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel drawer deslizable */}
          <div className="relative w-[270px] max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
