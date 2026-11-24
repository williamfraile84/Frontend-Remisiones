import React, { useState, useMemo } from "react";
import {
  FileText,
  X,
  Sparkles,
  AlertCircle,
  Check,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { parseTextOrder } from "../../utils/textOrderParser";
import { formatCurrency } from "../../utils/currency";

const SAMPLE_TEXT = `1 bulto mazorca
1/2 guatila
1 a arracacha 70
2 larga 160000
1/2 caja de jengibre 90000
5. Bultos de papa pastosa 600000
1 criolla 260
Perejil10
Tomillo 10`;

export default function TextOrderModal({
  isOpen,
  onClose,
  onConfirm,
  defaultMargin = 30,
}) {
  const [text, setText] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const parsedItems = useMemo(() => {
    if (!text.trim()) return [];
    return parseTextOrder(text, defaultMargin);
  }, [text, defaultMargin]);

  const totalCompraEstimada = useMemo(() => {
    return parsedItems.reduce(
      (acc, item) => acc + (Number(item.valor_compra_total) || 0),
      0,
    );
  }, [parsedItems]);

  if (!isOpen) return null;

  const handleCargarEjemplo = () => {
    setText(SAMPLE_TEXT);
  };

  const handleLimpiar = () => {
    setText("");
  };

  const handleConfirmar = () => {
    if (parsedItems.length === 0) return;
    onConfirm(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950/60 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                Cargar Pedido por Texto (Surtido / Inventario)
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800">
                  Temporal
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pegue su lista de compras del fruver. Cálculo inmediato sin
                afectar la base de datos de clientes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo Principal */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Botones de acción rápida sobre el texto */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCargarEjemplo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Cargar Ejemplo de Prueba</span>
              </button>
              {text && (
                <button
                  type="button"
                  onClick={handleLimpiar}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-medium transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHelp ? "Ocultar guía" : "Formatos soportados"}</span>
            </button>
          </div>

          {/* Guía colapsable de formatos */}
          {showHelp && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 animate-in fade-in">
              <p className="font-bold text-slate-800 dark:text-white">
                Formatos de entrada reconocidos:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>Fracciones:</strong>{" "}
                  <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    1/2 guatila
                  </code>
                  ,{" "}
                  <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    1/4 repollo
                  </code>
                </li>
                <li>
                  <strong>Empaques & Unidades:</strong>{" "}
                  <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    1 bulto mazorca
                  </code>
                  ,{" "}
                  <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    2 cll tomate
                  </code>
                  ,{" "}
                  <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    1 a arracacha
                  </code>{" "}
                  (arroba)
                </li>
                <li>
                  <strong>Precios en miles o completos:</strong>{" "}
                  <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    1 criolla 260
                  </code>{" "}
                  (= $260.000),{" "}
                  <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    2 larga 160000
                  </code>{" "}
                  (= $160.000),{" "}
                  <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    Perejil10
                  </code>{" "}
                  (= $10.000)
                </li>
                <li>
                  <strong>Decimales y notas:</strong>{" "}
                  <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    5. Bultos papa pastosa si
                  </code>
                  ,{" "}
                  <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    1 bulto fredi 120000
                  </code>
                </li>
              </ul>
            </div>
          )}

          {/* Área de Texto Libre */}
          <div>
            <textarea
              rows={7}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pegue aquí el texto con los productos del fruver...&#10;Ejemplo:&#10;1 bulto mazorca&#10;1/2 guatila&#10;2 larga 160000&#10;1 criolla 260"
              className="w-full font-mono text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition resize-y bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          {/* Vista previa de lo parseado */}
          {parsedItems.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                    {parsedItems.length}{" "}
                    {parsedItems.length === 1
                      ? "ítem detectado"
                      : "ítems detectados"}
                  </span>
                </div>
                {totalCompraEstimada > 0 && (
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Compra Estimada:{" "}
                    <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">
                      {formatCurrency(totalCompraEstimada)}
                    </span>
                  </div>
                )}
              </div>

              {/* Tabla compacta de vista previa */}
              <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2 w-10 text-center">#</th>
                      <th className="p-2">Producto</th>
                      <th className="p-2 text-center w-20">Cant.</th>
                      <th className="p-2 text-center w-24">Unidad</th>
                      <th className="p-2 text-right w-28">Compra ($)</th>
                      <th className="p-2">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {parsedItems.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-2 text-center text-slate-400 dark:text-slate-500 font-sans text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-2 font-bold text-slate-900 dark:text-slate-100 font-sans">
                          {item.producto}
                        </td>
                        <td className="p-2 text-center font-bold text-slate-800 dark:text-slate-200">
                          {item.cantidad}
                        </td>
                        <td className="p-2 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium font-sans border border-slate-200 dark:border-slate-700">
                            {item.unidad}
                          </span>
                        </td>
                        <td className="p-2 text-right font-semibold text-slate-800 dark:text-slate-200">
                          {item.valor_compra_total > 0
                            ? formatCurrency(item.valor_compra_total)
                            : "-"}
                        </td>
                        <td className="p-2 text-slate-500 dark:text-slate-400 font-sans text-[11px] truncate max-w-[140px]">
                          {item.descripcion || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Aviso informativo de Pedido Temporal */}
          <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 rounded-xl flex items-start gap-2.5 text-blue-900 dark:text-blue-200 text-xs">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Características de este modo:</p>
              <p className="text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed">
                Este pedido se cargará en pantalla como{" "}
                <strong>Surtido Temporal</strong>. Podrá calcular precios,
                agregar gastos, ajustar el % de utilidad y exportar a PDF o
                Excel.
                <strong>
                  {" "}
                  No se creará registro permanente en la base de datos
                </strong>{" "}
                ni se afectará el historial de ningún cliente, pero sí cuenta
                con autoguardado en su navegador para que no pierda sus
                cálculos.
              </p>
            </div>
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={parsedItems.length === 0}
            onClick={handleConfirmar}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>
              Cargar como Pedido de Surtido ({parsedItems.length} ítems)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
