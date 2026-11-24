import React from "react";
import { API_BASE_URL } from "../../api/apiClient";

export default function RemisionPreview({ empresa, cliente, pedido }) {
  const productos = pedido?.productos || [];
  const numeroRemision = pedido?.numero_remision || "1";
  const fechaEntrega = pedido?.fecha_entrega || "";
  const numeroCanastas = pedido?.numero_canastas || "";
  const observaciones = pedido?.observaciones || "";
  const esSurtido = pedido?.esTemporal || numeroRemision === "SURTIDO";

  const clienteFinal =
    cliente ||
    (esSurtido
      ? {
          razon_social: "SURTIDO / INVENTARIO INTERNO",
          nit: "USO INTERNO",
          direccion: "SEDE PRINCIPAL",
          telefono: "-",
          email: "-",
        }
      : null);

  const logoUrl = empresa?.logo_path
    ? `${API_BASE_URL.replace("/api", "")}/storage_data/${empresa.logo_path}`
    : null;

  return (
    <div
      id="remision-printable"
      className="bg-white border-2 border-slate-900 text-slate-950 font-sans text-xs leading-tight w-full max-w-3xl mx-auto shadow-lg rounded-sm overflow-hidden"
    >
      {/* Encabezado */}
      <div className="border-b-2 border-slate-900 text-center py-3 bg-slate-100/80 flex items-center justify-between px-4 relative">
        <div className="w-24 flex items-center justify-start">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo Empresa"
              className="h-10 w-auto object-contain max-w-[100px]"
            />
          ) : (
            <div className="w-9 h-9 bg-slate-900 text-emerald-400 font-black text-xs flex items-center justify-center rounded">
              {(empresa?.nombre || "EM").slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 text-center">
          <h1 className="font-black text-base sm:text-lg tracking-widest uppercase text-slate-950">
            NOTA DE REMISIÓN
          </h1>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            {empresa?.nombre || "Empresa"}
          </span>
        </div>

        <div className="w-24 text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase block">
            Nº REMISIÓN
          </span>
          <span className="font-mono font-black text-sm text-emerald-800">
            #{numeroRemision}
          </span>
        </div>
      </div>

      {/* Metadatos de la Remisión */}
      <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900 bg-slate-50/50">
        <div className="p-2 sm:p-2.5 flex items-center justify-between">
          <span className="font-black uppercase text-[10px] text-slate-600">
            Nº PEDIDO / REMISIÓN:
          </span>
          <span className="font-mono font-bold text-xs sm:text-sm text-slate-950">
            {numeroRemision}
          </span>
        </div>
        <div className="p-2 sm:p-2.5 flex items-center justify-between">
          <span className="font-black uppercase text-[10px] text-slate-600">
            FECHA DE ENTREGA:
          </span>
          <span className="font-bold text-xs text-slate-950">
            {fechaEntrega || "___/___/______"}
          </span>
        </div>
      </div>

      {/* Datos del Negocio Emisor */}
      <div className="border-b-2 border-slate-900">
        <div className="bg-slate-200/80 border-b border-slate-900 text-center py-1 font-black text-[10px] uppercase tracking-wider text-slate-800">
          DATOS DEL NEGOCIO (EMISOR)
        </div>
        <div className="p-2.5 space-y-1 text-[11px] bg-white">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-black text-slate-700">NOMBRE:</span>{" "}
              {empresa?.nombre || "N/A"}
            </div>
            <div>
              <span className="font-black text-slate-700">NIT:</span>{" "}
              {empresa?.nit || "N/A"}
            </div>
          </div>
          <div>
            <span className="font-black text-slate-700">DIRECCIÓN:</span>{" "}
            {empresa?.direccion || "N/A"}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-black text-slate-700">TELÉFONO:</span>{" "}
              {empresa?.telefono || "N/A"}
            </div>
            <div>
              <span className="font-black text-slate-700">EMAIL:</span>{" "}
              {empresa?.email || "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Datos del Cliente Receptor */}
      <div className="border-b-2 border-slate-900">
        <div className="bg-slate-200/80 border-b border-slate-900 text-center py-1 font-black text-[10px] uppercase tracking-wider text-slate-800">
          DATOS DEL CLIENTE (RECEPTOR)
        </div>
        <div className="p-2.5 space-y-1 text-[11px] bg-white">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-black text-slate-700">RAZÓN SOCIAL:</span>{" "}
              <strong>{clienteFinal?.razon_social || "N/A"}</strong>
            </div>
            <div>
              <span className="font-black text-slate-700">NIT / CÉDULA:</span>{" "}
              {clienteFinal?.nit || "N/A"}
            </div>
          </div>
          <div>
            <span className="font-black text-slate-700">DIRECCIÓN:</span>{" "}
            {clienteFinal?.direccion || "N/A"}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-black text-slate-700">TELÉFONO:</span>{" "}
              {clienteFinal?.telefono || "N/A"}
            </div>
            <div>
              <span className="font-black text-slate-700">EMAIL:</span>{" "}
              {clienteFinal?.email || "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de 4 Columnas: PRODUCTO (45%), CANTIDAD (15%), UNIDAD (15%), DESCRIPCIÓN (25%) */}
      <table className="w-full text-left border-collapse table-fixed text-[10px] sm:text-xs">
        <thead>
          <tr className="border-b-2 border-slate-900 bg-slate-100 font-black text-slate-900">
            <th className="p-1.5 sm:p-2 border-r-2 border-slate-900 w-5/12 uppercase">
              PRODUCTO
            </th>
            <th className="p-1.5 sm:p-2 border-r-2 border-slate-900 text-center w-2/12 uppercase">
              CANTIDAD
            </th>
            <th className="p-1.5 sm:p-2 border-r-2 border-slate-900 text-center w-2/12 uppercase">
              UNIDAD
            </th>
            <th className="p-1.5 sm:p-2 w-3/12 uppercase">DESCRIPCIÓN</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {productos.length === 0 ? (
            <tr>
              <td colSpan="4" className="p-4 text-center text-slate-400 italic">
                No hay productos agregados a esta remisión.
              </td>
            </tr>
          ) : (
            productos.map((p, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-1.5 sm:p-2 border-r-2 border-slate-900 font-bold uppercase break-words">
                  {p.producto}
                </td>
                <td className="p-1.5 sm:p-2 border-r-2 border-slate-900 text-center font-bold tabular-nums">
                  {p.cantidad}
                </td>
                <td className="p-1.5 sm:p-2 border-r-2 border-slate-900 text-center font-semibold">
                  {p.unidad || "Kg"}
                </td>
                <td className="p-1.5 sm:p-2 break-words text-slate-700">
                  {p.descripcion || "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Sección Inferior: Observaciones (74%) y Nº CANASTAS (26%) */}
      <div className="flex border-t-2 border-slate-900 divide-x-2 divide-slate-900">
        <div className="w-[74%] p-3.5 min-h-[175px] flex flex-col justify-between bg-white">
          <div className="space-y-1.5">
            <span className="font-black text-[10px] uppercase block text-slate-800 tracking-wider">
              Observaciones / Términos de entrega
            </span>
            <p className="text-[11px] text-slate-700 italic leading-relaxed whitespace-pre-wrap">
              {observaciones?.trim() ||
                "Recibido a satisfacción por el responsable designado en el punto de entrega."}
            </p>
          </div>
          <div className="pt-10 border-b border-slate-400 w-4/5 flex justify-between text-[9px] font-bold text-slate-600">
            <span>Firma / Sello Responsable</span>
            <span>C.C.</span>
          </div>
        </div>

        <div className="w-[26%] p-3 flex flex-col items-center justify-center text-center bg-slate-50/80">
          <span className="font-black text-[10px] uppercase text-slate-600">
            Nº CANASTILLAS
          </span>
          <span className="font-black text-2xl text-slate-950 mt-1 tabular-nums">
            {numeroCanastas || "_____"}
          </span>
        </div>
      </div>
    </div>
  );
}
