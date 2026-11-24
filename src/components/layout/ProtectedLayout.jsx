import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useCompany } from "../../hooks/useCompany";
import { useClients } from "../../hooks/useClients";
import { useActiveOrder } from "../../hooks/useActiveOrder";
import { useEmpaques } from "../../hooks/useEmpaques";

import InitialSetupModal from "../modals/InitialSetupModal";
import CompanySelectorModal from "../modals/CompanySelectorModal";
import CompanyProfileModal from "../modals/CompanyProfileModal";
import ClientFormModal from "../modals/ClientFormModal";
import ClientQuickRegisterModal from "../modals/ClientQuickRegisterModal";
import ChangePasswordModal from "../modals/ChangePasswordModal";
import LoadingOverlay from "../common/LoadingOverlay";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";

import OrdersView from "../../views/OrdersView";

// Carga perezosa (Code-Splitting) para optimización de bundle
const SurtidoView = lazy(() => import("../../views/SurtidoView"));
const FinancialView = lazy(() => import("../../views/FinancialView"));
const DocumentsView = lazy(() => import("../../views/DocumentsView"));
const HistoryView = lazy(() => import("../../views/HistoryView"));
const PresentacionesView = lazy(() => import("../../views/PresentacionesView"));
const ProductsView = lazy(() => import("../../views/ProductsView"));
const ProductEmpaquesTableView = lazy(
  () => import("../../views/ProductEmpaquesTableView"),
);
const ExpenseCategoriesView = lazy(
  () => import("../../views/ExpenseCategoriesView"),
);
const AdminView = lazy(() => import("../../views/AdminView"));
const ServerDownView = lazy(() => import("../../views/ServerDownView"));

function ViewSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[350px] p-8 gap-3 text-slate-400">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-slate-500">
        Cargando módulo...
      </span>
    </div>
  );
}

export default function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    isAuthenticated,
    isAdmin,
    logout,
    hasPermission,
  } = useAuth();
  const { showToast } = useToast();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("fruver_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isServerDown, setIsServerDown] = useState(false);

  // Hook centralizado de Empaques y Tipos Estandarizados
  const empaquesManager = useEmpaques();

  // Persistir preferencia de colapso de menú en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "fruver_sidebar_collapsed",
        String(sidebarCollapsed),
      );
    } catch {
      // Ignorar restricciones en entornos aislados
    }
  }, [sidebarCollapsed]);

  // Mapeo de rutas a módulos internos para Keep-Alive
  const routeToModuleMap = {
    "/": "pedidos",
    "/pedidos": "pedidos",
    "/surtido": "surtido",
    "/liquidacion": "liquidacion",
    "/documentos": "documentos",
    "/historial": "historial",
    "/presentaciones": "presentaciones",
    "/productos": "productos",
    "/matriz-empaques": "matriz_empaques",
    "/conceptos-gasto": "conceptos_gasto",
    "/admin": "admin",
  };

  const currentModulo = routeToModuleMap[location.pathname] || "pedidos";

  // Redirigir automáticamente de "/" a "/pedidos"
  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/pedidos", { replace: true });
    }
  }, [location.pathname, navigate]);

  // Mantener vivas las pestañas visitadas (Keep-Alive sin recargas ni pérdida de estado)
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(["pedidos"]));

  if (!visitedTabs.has(currentModulo)) {
    const next = new Set(visitedTabs);
    next.add(currentModulo);
    setVisitedTabs(next);
  }

  // Modales
  const [modalEmpresa, setModalEmpresa] = useState(false);
  const [modalAutoDetect, setModalAutoDetect] = useState(false);
  const [modalChangePass, setModalChangePass] = useState(false);
  const [clienteAutoData, setClienteAutoData] = useState(null);

  // Hook de Empresa
  const {
    empresa,
    empresas,
    modalSelectorOpen,
    setModalSelectorOpen,
    modalNuevaEmpresaOpen,
    setModalNuevaEmpresaOpen,
    seleccionarEmpresa,
    crearNuevaEmpresa,
    actualizarPerfil,
    subirLogo,
    verificarEstado,
  } = useCompany();

  // Hook de Clientes
  const {
    clientes,
    clienteSeleccionado,
    clienteParaEditar,
    setClienteParaEditar,
    modalClienteOpen,
    setModalClienteOpen,
    guardarCliente,
    cambiarCliente,
    cargarClientes,
  } = useClients(false);

  // Hook de Pedido Activo (Persiste automáticamente en memoria y localStorage)
  const activeOrder = useActiveOrder(
    clienteSeleccionado,
    clientes,
    (autoData) => {
      setClienteAutoData(autoData);
      setModalAutoDetect(true);
    },
    (detectedClient) => {
      cambiarCliente(detectedClient);
    },
  );

  // Monitoreo de conectividad y sincronización automática
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Conexión restablecida. Sincronizando con el servidor...");
      verificarEstado();
      cargarClientes();
      activeOrder.triggerAutoSave();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast("Modo Offline activo. Datos protegidos en el navegador.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [verificarEstado, cargarClientes, activeOrder, showToast]);

  // Detección en tiempo real de servidor caído y recuperación
  useEffect(() => {
    const handleServerDown = () => {
      setIsServerDown(true);
    };

    const handleServerUp = () => {
      setIsServerDown(false);
      setIsOnline(true);
    };

    window.addEventListener("app_server_down", handleServerDown);
    window.addEventListener("app_server_up", handleServerUp);
    return () => {
      window.removeEventListener("app_server_down", handleServerDown);
      window.removeEventListener("app_server_up", handleServerUp);
    };
  }, []);

  const handleSelectClient = (cli) => {
    if (activeOrder.pedidoId) {
      cambiarCliente(cli, (c) => activeOrder.nuevoPedidoEnBlanco(c));
    } else {
      cambiarCliente(cli);
    }
  };

  // Atajos de teclado para navegación rápida y control de sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle de barra lateral con Ctrl+B o Cmd+B
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
        return;
      }

      if (e.altKey) {
        if (e.key === "1") {
          e.preventDefault();
          navigate("/pedidos");
        } else if (e.key === "s" || e.key === "S") {
          e.preventDefault();
          navigate("/surtido");
        } else if (e.key === "2") {
          e.preventDefault();
          navigate("/liquidacion");
        } else if (e.key === "3") {
          e.preventDefault();
          navigate("/documentos");
        } else if (e.key === "4") {
          if (!activeOrder.esTemporal) {
            e.preventDefault();
            navigate("/historial");
          }
        } else if (e.key === "5") {
          e.preventDefault();
          navigate("/presentaciones");
        } else if (e.key === "6") {
          e.preventDefault();
          navigate("/productos");
        } else if (e.key === "7") {
          e.preventDefault();
          navigate("/conceptos-gasto");
        } else if (e.key === "a" || e.key === "A") {
          if (isAdmin) {
            e.preventDefault();
            navigate("/admin");
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdmin, activeOrder.esTemporal, navigate]);

  // Si entra en modo surtido y la pestaña activa era historial, redirigir inmediatamente a pedidos
  useEffect(() => {
    if (activeOrder.esTemporal && location.pathname === "/historial") {
      navigate("/pedidos", { replace: true });
    }
  }, [activeOrder.esTemporal, location.pathname, navigate]);

  // Comprobar si hay trabajo activo en pantalla que amerite quedarse en modo offline
  const hasActiveWork = Boolean(
    (activeOrder.productos && activeOrder.productos.length > 0) ||
    activeOrder.pedidoId ||
    activeOrder.numeroOC ||
    clienteSeleccionado,
  );

  // Vista de Servidor Caído
  if (isServerDown && (!isAuthenticated || !hasActiveWork)) {
    return (
      <Suspense fallback={<ViewSkeleton />}>
        <ServerDownView
          onReconnected={() => {
            setIsServerDown(false);
            setIsOnline(true);
            if (isAuthenticated) {
              verificarEstado();
              cargarClientes();
            }
          }}
          onContinueOffline={
            isAuthenticated
              ? () => {
                  setIsServerDown(false);
                }
              : null
          }
        />
      </Suspense>
    );
  }

  // Estado de conectividad efectiva
  const effectiveIsOnline = Boolean(isOnline && !isServerDown);
  const canEditCompany = hasPermission("puede_editar_empresa");

  return (
    <div
      className={`min-h-screen min-h-[100dvh] bg-slate-100/90 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 pb-16 md:pb-8 antialiased transition-[padding] duration-200 ${
        sidebarCollapsed ? "md:pl-[68px]" : "md:pl-[240px]"
      }`}
    >
      <LoadingOverlay
        isVisible={activeOrder.cargando}
        message={activeOrder.loadingMsg}
      />

      {/* Menú Lateral Colapsable y Categorizado */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
        empresa={empresa}
        empresas={empresas}
        onOpenSelectorEmpresa={() => setModalSelectorOpen(true)}
        canEditCompany={canEditCompany}
        onOpenCompanyModal={() => setModalEmpresa(true)}
        isTemporal={activeOrder.esTemporal}
        isAdmin={isAdmin}
        effectiveIsOnline={effectiveIsOnline}
      />

      {/* Encabezado Superior Limpio y Despejado */}
      <TopBar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        currentPath={location.pathname}
        user={user}
        clienteSeleccionado={clienteSeleccionado}
        onClearClient={() => cambiarCliente(null)}
        activeOrder={activeOrder}
        effectiveIsOnline={effectiveIsOnline}
        setIsServerDown={setIsServerDown}
        canEditCompany={canEditCompany}
        onOpenCompanyModal={() => setModalEmpresa(true)}
        onOpenChangePassModal={() => setModalChangePass(true)}
        empresaActiva={empresa}
        empresas={empresas}
        onOpenSelectorEmpresa={() => setModalSelectorOpen(true)}
        onOpenNuevaEmpresa={() => setModalNuevaEmpresaOpen(true)}
        onLogout={async () => {
          activeOrder.nuevoPedidoEnBlanco(null);
          cambiarCliente(null);
          await logout();
          navigate("/login", { replace: true });
        }}
      />

      {/* Contenedor Principal de Vistas con Keep-Alive Fluido y Prevención de Desbordamiento */}
      <main className="max-w-[1700px] w-full min-w-0 mx-auto p-2.5 xs:p-3.5 sm:p-4 md:p-5 lg:p-6 xl:p-8 pb-24 md:pb-8 flex-1 space-y-4 sm:space-y-6 overflow-x-clip">
        <Suspense fallback={<ViewSkeleton />}>
          {visitedTabs.has("pedidos") && (
            <div
              className={currentModulo === "pedidos" ? "contents" : "hidden"}
            >
              <OrdersView
                activeOrder={activeOrder}
                clienteSeleccionado={clienteSeleccionado}
                clientes={clientes}
                isOnline={effectiveIsOnline}
                onSelectClient={handleSelectClient}
                onOpenEditClientModal={() => {
                  setClienteParaEditar(clienteSeleccionado);
                  setModalClienteOpen(true);
                }}
                onOpenNewClientModal={() => {
                  setClienteParaEditar(null);
                  setModalClienteOpen(true);
                }}
                empaquesManager={empaquesManager}
              />
            </div>
          )}

          {visitedTabs.has("surtido") && (
            <div
              className={currentModulo === "surtido" ? "contents" : "hidden"}
            >
              <SurtidoView
                empaquesManager={empaquesManager}
                onOpenPresentaciones={() => navigate("/presentaciones")}
              />
            </div>
          )}

          {visitedTabs.has("liquidacion") && (
            <div
              className={
                currentModulo === "liquidacion" ? "contents" : "hidden"
              }
            >
              <FinancialView
                activeOrder={activeOrder}
                onOpenPresentaciones={() => navigate("/presentaciones")}
                empaquesManager={empaquesManager}
              />
            </div>
          )}

          {visitedTabs.has("documentos") && (
            <div
              className={currentModulo === "documentos" ? "contents" : "hidden"}
            >
              <DocumentsView
                empresa={empresa}
                clienteSeleccionado={clienteSeleccionado}
                clientes={clientes}
                onSelectClient={handleSelectClient}
                activeOrder={activeOrder}
              />
            </div>
          )}

          {visitedTabs.has("historial") && !activeOrder.esTemporal && (
            <div
              className={currentModulo === "historial" ? "contents" : "hidden"}
            >
              <HistoryView
                clienteSeleccionado={clienteSeleccionado}
                clientes={clientes}
                isOnline={effectiveIsOnline}
                onSelectClient={handleSelectClient}
                activeOrder={activeOrder}
                onSelectOrder={async (p) => {
                  const clientForOrder =
                    clientes.find((c) => c.id === p.cliente_id) ||
                    clienteSeleccionado;
                  if (clientForOrder) {
                    cambiarCliente(clientForOrder);
                  }
                  await activeOrder.cargarDesdeHistorial(p);
                  navigate("/pedidos");
                }}
              />
            </div>
          )}

          {visitedTabs.has("presentaciones") && (
            <div
              className={
                currentModulo === "presentaciones" ? "contents" : "hidden"
              }
            >
              <PresentacionesView
                isOnline={effectiveIsOnline}
                empaquesManager={empaquesManager}
              />
            </div>
          )}

          {visitedTabs.has("productos") && (
            <div
              className={currentModulo === "productos" ? "contents" : "hidden"}
            >
              <ProductsView />
            </div>
          )}

          {visitedTabs.has("matriz_empaques") && (
            <div
              className={
                currentModulo === "matriz_empaques" ? "contents" : "hidden"
              }
            >
              <ProductEmpaquesTableView
                onNavigateToCatalog={() => navigate("/productos")}
              />
            </div>
          )}

          {visitedTabs.has("conceptos_gasto") && (
            <div
              className={
                currentModulo === "conceptos_gasto" ? "contents" : "hidden"
              }
            >
              <ExpenseCategoriesView />
            </div>
          )}

          {visitedTabs.has("admin") && isAdmin && (
            <div className={currentModulo === "admin" ? "contents" : "hidden"}>
              <AdminView isOnline={effectiveIsOnline} />
            </div>
          )}
        </Suspense>
      </main>

      {/* Barra de Navegación Inferior Móvil Fija y Ergonómica (Solo en Móvil) */}
      <MobileNav
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
        onOpenMenu={() => setMobileMenuOpen(true)}
      />

      {/* Modales Globales */}
      <CompanyProfileModal
        empresa={empresa}
        isOpen={modalEmpresa}
        onClose={() => setModalEmpresa(false)}
        onUpdateEmpresa={actualizarPerfil}
        onUploadLogo={subirLogo}
      />

      <ClientFormModal
        cliente={clienteParaEditar}
        isOpen={modalClienteOpen}
        onClose={() => {
          setModalClienteOpen(false);
          setClienteParaEditar(null);
        }}
        onSaveClient={guardarCliente}
      />

      <ClientQuickRegisterModal
        initialData={clienteAutoData}
        isOpen={modalAutoDetect}
        onClose={() => setModalAutoDetect(false)}
        onSaveClient={async (d) => {
          await guardarCliente(d);
          setModalAutoDetect(false);
        }}
      />

      <ChangePasswordModal
        isOpen={modalChangePass}
        onClose={() => setModalChangePass(false)}
      />

      {/* Selector de Empresa (Multi-Empresa) */}
      <CompanySelectorModal
        isOpen={modalSelectorOpen}
        onClose={() => setModalSelectorOpen(false)}
        empresas={empresas}
        empresaActiva={empresa}
        onSelectEmpresa={seleccionarEmpresa}
        onOpenNuevaEmpresa={() => {
          setModalSelectorOpen(false);
          setModalNuevaEmpresaOpen(true);
        }}
        canCreate={canEditCompany || isAdmin}
      />

      {/* Modal para Crear Nueva Empresa (Multi-Empresa) */}
      {modalNuevaEmpresaOpen && (
        <InitialSetupModal
          onSave={crearNuevaEmpresa}
          onCancel={() => setModalNuevaEmpresaOpen(false)}
          title="Registrar Nueva Empresa"
          description="Ingrese los datos de la nueva empresa o sucursal. Podrá seleccionarla para operar sobre ella."
        />
      )}
    </div>
  );
}

