import React, { useState } from "react";
import {
  Printer,
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileCheck,
  ChevronDown,
} from "lucide-react";
import RemisionPreview from "../components/orders/RemisionPreview";
import { API_BASE_URL } from "../api/apiClient";
import { CLIENTE_SURTIDO_INTERNO } from "../hooks/useActiveOrder";
import { useAuth } from "../context/AuthContext";

export default function DocumentsView({
  empresa,
  clienteSeleccionado,
  clientes = [],
  onSelectClient,
  activeOrder,
}) {
  const { token, hasPermission } = useAuth();
  const canViewDocs = hasPermission("puede_ver_documentos");
  const canExport = hasPermission("puede_exportar");
  const canDownloadDocs = hasPermission("puede_descargar_documentos");

  const {
    pedidoId,
    numeroRemision,
    fechaEntrega,
    numeroCanastas,
    observaciones,
    productos,
    liquidacion,
    isPedidoBloqueado,
    remisionFirmadaCargada,
    remisionFirmadaNombre,
    exportarDocumento,
    esTemporal,
  } = activeOrder;

  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";

  const previewUrl = pedidoId
    ? `${API_BASE_URL}/pedidos/${pedidoId}/remision-firmada/preview${tokenParam}`
    : null;

  const downloadUrl = pedidoId
    ? `${API_BASE_URL}/pedidos/${pedidoId}/remision-firmada/descargar${tokenParam}`
    : null;

  const handleDownloadSoporte = async (e) => {
    if (e) e.preventDefault();
    if (!downloadUrl) return;
    try {
      const resp = await fetch(downloadUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error("Error al descargar archivo");
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = remisionFirmadaNombre || "remision_firmada.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(downloadUrl, "_blank");
    }
  };

  const isImageFile = Boolean(
    remisionFirmadaNombre &&
    /\.(png|jpe?g|webp|gif|bmp)$/i.test(remisionFirmadaNombre),
  );

  if (!canViewDocs) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <FileText className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Acceso Restringido a Salidas & Documentos
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Su usuario no dispone del permiso{" "}
          <code className="text-emerald-600 font-mono font-bold">
            puede_ver_documentos
          </code>
          . Solicite al administrador su asignación en la Matriz de Permisos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Banner Prominente de Pedido Cerrado */}
      {isPedidoBloqueado && (
        <div className="bg-amber-500/10 dark:bg-amber-950/30 border-2 border-amber-500/40 rounded-2xl p-4 flex items-center gap-3 text-amber-900 dark:text-amber-200 shadow-xs animate-in fade-in">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-amber-950 dark:text-amber-100">
              🔒 PEDIDO CERRADO - DOCUMENTACIÓN FINAL
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Este pedido se encuentra cerrado. Puede visualizar los soportes de
              entrega y descargar las copias oficiales.
            </p>
          </div>
        </div>
      )}

      {/* Barra Superior de Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm truncate">
              {remisionFirmadaCargada
                ? "Visor de Remisión Firmada"
                : "Nota de Remisión Oficial"}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
              {remisionFirmadaCargada
                ? `Soporte adjunto: ${remisionFirmadaNombre}`
                : esTemporal
                  ? "Modo Surtido: Documento de inventario y abastecimiento interno."
                  : clienteSeleccionado
                    ? `Documento generado para ${clienteSeleccionado.razon_social}.`
                    : "Sin cliente asignado - Seleccione un cliente para exportar."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {esTemporal && (
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-xl shrink-0">
              📦 Surtido / Inventario Interno
            </span>
          )}
          {!esTemporal &&
            !clienteSeleccionado &&
            !remisionFirmadaCargada &&
            clientes.length > 0 && (
              <div className="relative">
                <select
                  aria-label="Seleccionar cliente para remisión"
                  className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white rounded-xl py-1.5 pl-2.5 pr-7 outline-none cursor-pointer transition focus:ring-2 focus:ring-emerald-500 max-w-[200px] truncate shadow-2xs appearance-none"
                  value=""
                  onChange={(e) => {
                    const client = clientes.find(
                      (c) => c.id === parseInt(e.target.value, 10),
                    );
                    if (client && onSelectClient) onSelectClient(client);
                  }}
                >
                  <option value="" disabled>
                    Seleccionar cliente...
                  </option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razon_social}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            )}
          {!remisionFirmadaCargada && (
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition shrink-0"
              >
                <Printer className="w-4 h-4" /> <span>Imprimir</span>
              </button>
              {canExport && (
                <>
                  <button
                    type="button"
                    onClick={() => exportarDocumento("pdf", "remision")}
                    className="bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition shrink-0"
                  >
                    <FileText className="w-4 h-4" /> <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportarDocumento("excel", "remision")}
                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition shrink-0"
                  >
                    <Download className="w-4 h-4" /> <span>Excel</span>
                  </button>
                </>
              )}
            </>
          )}

          {remisionFirmadaCargada && pedidoId && (
            <div className="flex flex-wrap items-center gap-2">
              {isImageFile && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                    title="Alejar"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 px-1 tabular-nums">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                    title="Acercar"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                    title="Rotar 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Botón de descarga explícita */}
              {canDownloadDocs && (
                <a
                  href={downloadUrl}
                  download={remisionFirmadaNombre || "remision_firmada.pdf"}
                  onClick={handleDownloadSoporte}
                  className="bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> <span>Descargar Soporte</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenedor del Visor / Remisión */}
      <div className="w-full overflow-x-auto custom-scrollbar pb-4">
        {remisionFirmadaCargada && pedidoId ? (
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
            <div className="w-full h-[420px] sm:h-[560px] md:h-[700px] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-900/5 dark:bg-slate-950 flex items-center justify-center relative">
              {isImageFile ? (
                <div className="w-full h-full overflow-auto p-4 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Remisión Firmada"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transition: "transform 0.2s ease-in-out",
                    }}
                    className="max-h-[380px] sm:max-h-[520px] md:max-h-[640px] max-w-full object-contain rounded-lg shadow-md"
                  />
                </div>
              ) : (
                <iframe
                  src={`${previewUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-0"
                  title="Visor de Remisión Firmada PDF"
                />
              )}
            </div>
          </div>
        ) : (
          <div
            className="w-full p-2 sm:p-4 bg-slate-200/50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar"
            tabIndex={0}
            role="region"
            aria-label="Vista previa de documento de remisión oficial"
          >
            <RemisionPreview
              empresa={empresa}
              cliente={
                clienteSeleccionado ||
                (esTemporal || numeroRemision === "SURTIDO"
                  ? CLIENTE_SURTIDO_INTERNO
                  : null)
              }
              pedido={{
                numero_remision: numeroRemision,
                fecha_entrega: fechaEntrega,
                numero_canastas: numeroCanastas,
                observaciones: observaciones,
                productos: liquidacion?.items || productos,
                esTemporal,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
