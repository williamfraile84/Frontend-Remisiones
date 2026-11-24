import React from "react";
import {
  FileUp,
  Plus,
  Lock,
  Upload,
  CheckCircle,
  FileCheck2,
  RefreshCw,
  CheckCircle2,
  Shield,
} from "lucide-react";
import ClientInfoCard from "../components/orders/ClientInfoCard";
import OrderMetadataForm from "../components/orders/OrderMetadataForm";
import OrderItemsTable from "../components/orders/OrderItemsTable";
import { useAuth } from "../context/AuthContext";

export default function OrdersView({
  activeOrder,
  clienteSeleccionado,
  clientes = [],
  isOnline = true,
  onSelectClient,
  onOpenEditClientModal,
  onOpenNewClientModal,
  empaquesManager,
}) {

  const {
    esTemporal,
    pedidoId,
    facturaCargada,
    remisionFirmadaCargada,
    isPedidoBloqueado,
    cargando,
    isSaving,
    saveStatus,
    numeroRemision,
    setNumeroRemision,
    numeroOC,
    setNumeroOC,
    fechaEntrega,
    setFechaEntrega,
    numeroCanastas,
    setNumeroCanastas,
    observaciones,
    setObservaciones,
    productos,
    setProductos,
    gastos,
    utilidadGlobal,
    draggedIndex,
    triggerAutoSave,
    ejecutarRecalculo,
    nuevoPedidoEnBlanco,
    _cargarPedidoTemporalDesdeTexto,
    handleUploadDocumento,
    handleSubirArchivoCierre,
    handleDragStart,
    handleDragOver,
    handleDrop,
  } = activeOrder;

  const { hasPermission } = useAuth();

  const canUploadDocs = hasPermission("puede_cargar_documentos");
  const canCreateOrders = hasPermission("puede_crear_pedidos");
  const canEditOrders = hasPermission("puede_editar_pedidos");
  const canUploadFacturas = hasPermission("puede_cargar_facturas");
  const canUploadFirmadas = hasPermission("puede_cargar_remisiones_firmadas");
  const canManageClients = hasPermission("puede_gestionar_clientes");

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Banner Prominente de Pedido Cerrado */}
      {isPedidoBloqueado && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-amber-950">
                🔒 PEDIDO CERRADO Y BLOQUEADO
              </h3>
              <p className="text-xs text-amber-800">
                Este pedido cuenta con factura o remisión firmada adjunta. Sus
                datos no pueden ser alterados.
              </p>
            </div>
          </div>
          <button
            onClick={() => nuevoPedidoEnBlanco()}
            className="bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> <span>Crear Nuevo Pedido</span>
          </button>
        </div>
      )}

      {/* 1. Selección y Tarjeta de Datos del Cliente (Oculto en Modo Surtido) */}
      {!esTemporal && (
        <ClientInfoCard
          clientes={clientes}
          selectedClient={clienteSeleccionado}
          onSelectClient={onSelectClient}
          onOpenEditClientModal={onOpenEditClientModal}
          onOpenNewClientModal={onOpenNewClientModal}
          disabled={isPedidoBloqueado}
          isPedidoBloqueado={isPedidoBloqueado}
          canManageClients={canManageClients}
          esTemporal={esTemporal}
        />
      )}

      {/* 2. Barra Superior de Acciones del Pedido */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Acciones Principales */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {!isPedidoBloqueado && canUploadDocs && isOnline && (
            <label className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition flex items-center justify-center gap-2 shadow-xs flex-1 sm:flex-initial">
              <FileUp className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {cargando
                  ? "Analizando Documento..."
                  : "Cargar Pedido (PDF / Excel / Imagen)"}
              </span>
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                disabled={cargando}
                onChange={(e) => {
                  handleUploadDocumento(e.target.files[0]);
                  e.target.value = null;
                }}
              />
            </label>
          )}

          {canCreateOrders && (
            <button
              onClick={() => {
                nuevoPedidoEnBlanco(clienteSeleccionado);
              }}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" /> <span>Nuevo Pedido</span>
            </button>
          )}

          {/* Indicador de Autoguardado inteligente en tiempo real */}
          {isSaving ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />{" "}
              Guardando...
            </span>
          ) : pedidoId ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Autoguardado
              #{numeroRemision}
            </span>
          ) : saveStatus === "local_draft" ? (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200"
              title="Sus cambios se están guardando localmente en el navegador de forma segura"
            >
              <Shield className="w-3 h-3 text-blue-600" /> Borrador Protegido
            </span>
          ) : null}
        </div>

        {/* Estados y Acciones de Cierre */}
        <div className="flex flex-wrap items-center gap-2">
          {isPedidoBloqueado && (
            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
              <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600" /> Pedido
              Bloqueado (Cerrado)
            </span>
          )}

          {!esTemporal && pedidoId && (
            <div className="flex flex-wrap items-center gap-2">
              {!facturaCargada ? (
                canUploadFacturas &&
                isOnline && (
                  <label className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs transition">
                    <Upload className="w-3.5 h-3.5 shrink-0" />{" "}
                    <span>Factura</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        handleSubirArchivoCierre(
                          pedidoId,
                          "factura",
                          e.target.files[0],
                        )
                      }
                    />
                  </label>
                )
              ) : (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1 shadow-2xs">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />{" "}
                  Factura Lista
                </span>
              )}

              {!remisionFirmadaCargada ? (
                canUploadFirmadas &&
                isOnline && (
                  <label className="bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs transition">
                    <Upload className="w-3.5 h-3.5 shrink-0" />{" "}
                    <span>Rem. Firmada</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        handleSubirArchivoCierre(
                          pedidoId,
                          "remision-firmada",
                          e.target.files[0],
                        )
                      }
                    />
                  </label>
                )
              ) : (
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-xl border border-purple-200 flex items-center gap-1 shadow-2xs">
                  <FileCheck2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />{" "}
                  Rem. Firmada
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Formulario de Metadatos */}
      <OrderMetadataForm
        numeroRemision={numeroRemision}
        setNumeroRemision={setNumeroRemision}
        numeroOC={numeroOC}
        setNumeroOC={setNumeroOC}
        fechaEntrega={fechaEntrega}
        setFechaEntrega={setFechaEntrega}
        numeroCanastas={numeroCanastas}
        setNumeroCanastas={setNumeroCanastas}
        observaciones={observaciones}
        setObservaciones={setObservaciones}
        isPedidoBloqueado={isPedidoBloqueado || !canEditOrders}
        triggerAutoSave={triggerAutoSave}
      />

      {/* 4. Tabla de Productos con Drag & Drop y Tarjetas Móviles */}
      <OrderItemsTable
        productos={productos}
        setProductos={setProductos}
        isPedidoBloqueado={isPedidoBloqueado || !canEditOrders}
        draggedIndex={draggedIndex}
        handleDragStart={handleDragStart}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        ejecutarRecalculo={ejecutarRecalculo}
        triggerAutoSave={triggerAutoSave}
        utilidadGlobal={utilidadGlobal}
        gastos={gastos}
        empaquesManager={empaquesManager}
      />
    </div>
  );
}
