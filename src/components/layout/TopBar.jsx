import React from "react";
import {
  Menu,
  PanelLeftClose,
  PanelLeft,
  KeyRound,
  LogOut,
  Settings,
  WifiOff,
  Package,
  Building2,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import PwaInstallButton from "../common/PwaInstallButton";

export default function TopBar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  currentPath,
  user,
  clienteSeleccionado,
  onClearClient,
  activeOrder,
  effectiveIsOnline,
  setIsServerDown,
  canEditCompany,
  onOpenCompanyModal,
  onOpenChangePassModal,
  onLogout,
  empresaActiva,
  empresas = [],
  onOpenSelectorEmpresa,
  _onOpenNuevaEmpresa,
}) {
  const { isDark, toggleTheme } = useTheme();
  const getPageInfo = (path) => {
    switch (path) {
      case "/surtido":
        return {
          title: "Surtido & Compras",
          category: "Operación",
        };
      case "/liquidacion":
        return {
          title: "Liquidación & Gastos",
          category: "Operación",
        };
      case "/documentos":
        return {
          title: "Salidas & Documentos",
          category: "Operación",
        };
      case "/historial":
        return {
          title: "Historial de Pedidos",
          category: "Operación",
        };
      case "/presentaciones":
        return {
          title: "Empaques & Medidas",
          category: "Catálogos Maestros",
        };
      case "/productos":
        return {
          title: "Catálogo de Productos",
          category: "Catálogos Maestros",
        };
      case "/matriz-empaques":
        return {
          title: "Matriz Empaques & Kilos",
          category: "Catálogos Maestros",
        };
      case "/conceptos-gasto":
        return {
          title: "Conceptos de Gasto",
          category: "Catálogos Maestros",
        };
      case "/admin":
        return {
          title: "Administración & Logs",
          category: "Sistema",
        };
      case "/pedidos":
      case "/":
      default:
        return {
          title: "Operación & Pedido",
          category: "Operación",
        };
    }
  };

  const pageInfo = getPageInfo(currentPath);

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-20 shadow-2xs h-14 sm:h-16 flex items-center justify-between px-3 sm:px-5 md:px-6 gap-3 select-none transition-colors duration-200">
      {/* Zona Izquierda: Toggles + Breadcrumb / Título */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Toggle Móvil (Hamburger) */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
          title="Abrir menú"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Toggle Desktop (Panel Icon) */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
          title={collapsed ? "Expandir menú (Ctrl+B)" : "Colapsar menú (Ctrl+B)"}
        >
          {collapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Título de la Sección y Categoría */}
        <div className="min-w-0 flex-1">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <span>{pageInfo.category}</span>
            <span>/</span>
          </div>
          <h1 className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-white truncate leading-tight">
            {pageInfo.title}
          </h1>
        </div>

        {/* Indicador de Cliente Seleccionado Global (Si existe) */}
        {clienteSeleccionado && (
          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold max-w-[200px] truncate"
            title={`Cliente activo: ${clienteSeleccionado.razon_social}`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{clienteSeleccionado.razon_social}</span>
            {onClearClient && (
              <button
                type="button"
                onClick={onClearClient}
                className="text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer shrink-0 ml-0.5"
                title="Quitar cliente seleccionado"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Zona Derecha: Badges de Estado + Perfil de Usuario */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
        {/* Badge Modo Surtido */}
        {activeOrder.esTemporal && (
          <div
            className="hidden sm:inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-[11px] font-bold shadow-2xs shrink-0"
            title="Modo Surtido / Inventario Interno activo"
          >
            <Package className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Modo Surtido</span>
          </div>
        )}

        {/* Badge Modo Offline */}
        {!effectiveIsOnline && (
          <button
            type="button"
            onClick={() => setIsServerDown(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-black shadow-2xs animate-pulse cursor-pointer transition shrink-0"
            title="Servidor o red no disponible. Clic para comprobar estado y diagnóstico."
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
            <span className="hidden xs:inline">Modo Offline</span>
          </button>
        )}

        {/* Selector de Empresa Activa (Multi-Empresa) - Visible en Desktop / Tablet */}
        {empresaActiva && (
          <button
            type="button"
            onClick={onOpenSelectorEmpresa}
            className="hidden md:flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:border-emerald-300 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer max-w-[150px] lg:max-w-[200px] shrink-0"
            title={`Empresa activa: ${empresaActiva.nombre}. Clic para cambiar de empresa o crear una nueva.`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{empresaActiva.nombre}</span>
            {empresas.length > 1 && (
              <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-black shrink-0 hidden xs:inline">
                {empresas.length}
              </span>
            )}
          </button>
        )}

        {/* Datos de Usuario */}
        <div className="text-right hidden sm:block shrink-0">
          <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight truncate max-w-[140px]">
            {user?.nombre_completo || user?.username}
          </span>
          <span
            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${
              user?.rol === "admin"
                ? "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            }`}
          >
            {user?.rol}
          </span>
        </div>

        {/* Acciones de Cuenta */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Botón de Instalación PWA Directo */}
          <PwaInstallButton />

          {/* Botón Selector de Tema Claro / Oscuro */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title={isDark ? "Cambiar a Modo Claro (☀️)" : "Cambiar a Modo Oscuro (🌙)"}
            aria-label={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 transition-transform hover:-rotate-12" />
            )}
          </button>

          {canEditCompany && effectiveIsOnline && (
            <button
              type="button"
              onClick={onOpenCompanyModal}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Configuración de la Empresa"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenChangePassModal}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Cambiar mi contraseña"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
