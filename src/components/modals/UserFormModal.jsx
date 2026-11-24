import React, { useState, useMemo } from "react";
import {
  X,
  UserPlus,
  UserCheck,
  ShieldCheck,
  Check,
  ShoppingCart,
  FileText,
  Users,
  Package,
  ShieldAlert,
  Truck,
  Calculator,
  Search,
  RotateCcw,
} from "lucide-react";
import { userApi } from "../../api/userApi";
import { useToast } from "../../context/ToastContext";

const MODULE_ICONS = {
  "Operación & Pedidos": ShoppingCart,
  "Surtido & Compras": Truck,
  "Liquidación & Gastos": Calculator,
  "Documentación & Soportes": FileText,
  "Clientes & Terceros": Users,
  "Catálogos Maestros": Package,
  "Sistema & Administración": ShieldAlert,
};

const PERMISSION_MODULES = [
  {
    module: "Operación & Pedidos",
    permissions: [
      {
        key: "puede_crear_pedidos",
        label: "Crear Nuevos Pedidos",
        desc: "Permite registrar y aperturar pedidos en el sistema",
      },
      {
        key: "puede_editar_pedidos",
        label: "Modificar Pedidos Abiertos",
        desc: "Permite editar cantidades, productos y notas de pedidos activos",
      },
      {
        key: "puede_desactivar_pedidos",
        label: "Anular Pedidos (Baja Lógica)",
        desc: "Permite dar de baja pedidos del historial si no están facturados",
      },
      {
        key: "puede_cerrar_pedidos",
        label: "Cerrar / Bloquear Pedidos",
        desc: "Permite liquidar y congelar pedidos completados",
      },
      {
        key: "puede_ver_historial",
        label: "Consultar Historial de Pedidos",
        desc: "Permite buscar, reimprimir y auditar pedidos históricos anteriores",
      },
    ],
  },
  {
    module: "Surtido & Compras",
    permissions: [
      {
        key: "puede_ver_surtido",
        label: "Acceso a Surtido & Compras",
        desc: "Permite ingresar al módulo de abastecimiento y compras de plaza",
      },
      {
        key: "puede_crear_surtido",
        label: "Armar Pedido de Surtido",
        desc: "Permite listar y editar requerimientos de compra (Pestaña 1)",
      },
      {
        key: "puede_verificar_checklist",
        label: "Checklist de Llegada",
        desc: "Permite registrar peso físico, novedades y verificación de calidad (Pestaña 2)",
      },
      {
        key: "puede_liquidar_surtido",
        label: "Fijar Precios y Costeo",
        desc: "Permite liquidar compras, editar costos por kilo y fijar precios (Pestaña 3)",
      },
      {
        key: "puede_conciliar_pos",
        label: "Conciliación de Precios POS",
        desc: "Permite comparar tarifas calculadas contra POS y sincronizar precios",
      },
      {
        key: "puede_aplicar_precios_catalogo",
        label: "Aplicar Precios al Catálogo",
        desc: "Permite trasladar precios calculados masivamente al catálogo oficial",
      },
    ],
  },
  {
    module: "Liquidación & Gastos",
    permissions: [
      {
        key: "puede_ver_financiero",
        label: "Visualización Financiera",
        desc: "Acceso a la pestaña financiera, costeo, márgenes y utilidad",
      },
      {
        key: "puede_editar_costos",
        label: "Modificar Costos de Compra",
        desc: "Permite alterar costos unitarios de compra por kilo o empaque",
      },
      {
        key: "puede_modificar_margenes",
        label: "Ajustar Márgenes de Utilidad",
        desc: "Permite cambiar porcentaje de ganancia comercial global o individual",
      },
      {
        key: "puede_gestionar_gastos",
        label: "Gestionar Gastos Comerciales",
        desc: "Permite agregar, prorratear y activar fletes o gastos operativos",
      },
      {
        key: "puede_exportar",
        label: "Exportación de Archivos",
        desc: "Permite descargar remisiones e informes financieros en PDF y Excel",
      },
    ],
  },
  {
    module: "Documentación & Soportes",
    permissions: [
      {
        key: "puede_ver_documentos",
        label: "Acceso a Salidas & Documentos",
        desc: "Permite ingresar al repositorio y módulo de soportes documentales",
      },
      {
        key: "puede_cargar_documentos",
        label: "Importación Inteligente (OCR)",
        desc: "Permite importar pedidos por Excel, PDF e imágenes con Gemini Vision",
      },
      {
        key: "puede_cargar_facturas",
        label: "Cargar Facturas de Venta",
        desc: "Permite adjuntar la factura soporte para el cierre del pedido",
      },
      {
        key: "puede_cargar_remisiones_firmadas",
        label: "Cargar Remisiones Firmadas",
        desc: "Permite adjuntar el soporte físico con firma y sello del cliente",
      },
      {
        key: "puede_descargar_documentos",
        label: "Descargar Soportes & Archivos",
        desc: "Permite descargar copias digitales de remisiones y facturas archivadas",
      },
    ],
  },
  {
    module: "Clientes & Terceros",
    permissions: [
      {
        key: "puede_gestionar_clientes",
        label: "Gestión de Clientes",
        desc: "Permite crear, editar información fiscal, direcciones y desactivar clientes",
      },
      {
        key: "puede_cambiar_cliente",
        label: "Asignar / Cambiar Cliente",
        desc: "Permite cambiar el cliente al que se factura el pedido activo",
      },
    ],
  },
  {
    module: "Catálogos Maestros",
    permissions: [
      {
        key: "puede_gestionar_catalogos",
        label: "Catálogo de Productos",
        desc: "Permite crear y editar productos, unidades físicas, UPC/EAN y POS Item ID",
      },
      {
        key: "puede_gestionar_empaques",
        label: "Empaques & Medidas",
        desc: "Permite configurar pesos y taras de ponys, canastillas, bultos y cajas",
      },
      {
        key: "puede_gestionar_conceptos_gasto",
        label: "Conceptos de Gasto Operativo",
        desc: "Permite administrar los conceptos para fletes y gastos operativos",
      },
    ],
  },
  {
    module: "Sistema & Administración",
    permissions: [
      {
        key: "puede_editar_empresa",
        label: "Configuración de Empresa",
        desc: "Permite modificar datos fiscales, teléfono, razón social y logo institucional",
      },
      {
        key: "puede_administrar_usuarios",
        label: "Gestión de Usuarios & Seguridad",
        desc: "Permite crear operadores, cambiar contraseñas y configurar la Matriz de Permisos",
      },
      {
        key: "puede_ver_auditoria",
        label: "Bitácora de Auditoría Inmutable",
        desc: "Permite consultar registros de auditoría y trazabilidad del sistema",
      },
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_MODULES.flatMap((m) => m.permissions);

// Configuración recomendada estándar para operadores comerciales
const DEFAULT_OPERATOR_CONFIG = {
  puede_crear_pedidos: true,
  puede_editar_pedidos: true,
  puede_desactivar_pedidos: false,
  puede_cerrar_pedidos: true,
  puede_ver_historial: true,
  puede_ver_surtido: true,
  puede_crear_surtido: true,
  puede_verificar_checklist: true,
  puede_liquidar_surtido: true,
  puede_conciliar_pos: false,
  puede_aplicar_precios_catalogo: false,
  puede_ver_financiero: true,
  puede_editar_costos: true,
  puede_modificar_margenes: false,
  puede_gestionar_gastos: true,
  puede_exportar: true,
  puede_ver_documentos: true,
  puede_cargar_documentos: true,
  puede_cargar_facturas: true,
  puede_cargar_remisiones_firmadas: true,
  puede_descargar_documentos: true,
  puede_gestionar_clientes: true,
  puede_cambiar_cliente: true,
  puede_gestionar_catalogos: true,
  puede_gestionar_empaques: true,
  puede_gestionar_conceptos_gasto: true,
  puede_editar_empresa: false,
  puede_administrar_usuarios: false,
  puede_ver_auditoria: false,
};

export default function UserFormModal({
  userToEdit,
  isOpen,
  onClose,
  onUserSaved,
}) {
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("operador");
  const [permisos, setPermisos] = useState({});
  const [searchPermiso, setSearchPermiso] = useState("");
  const [loading, setLoading] = useState(false);

  const [prevUserToEdit, setPrevUserToEdit] = useState(userToEdit);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (userToEdit !== prevUserToEdit || isOpen !== prevIsOpen) {
    setPrevUserToEdit(userToEdit);
    setPrevIsOpen(isOpen);
    if (userToEdit) {
      setUsername(userToEdit.username || "");
      setNombreCompleto(userToEdit.nombre_completo || "");
      setEmail(userToEdit.email || "");
      setRol(userToEdit.rol || "operador");
      setPassword("");
      setPermisos(userToEdit.permisos || {});
      setSearchPermiso("");
    } else {
      setUsername("");
      setNombreCompleto("");
      setEmail("");
      setPassword("");
      setRol("operador");
      setSearchPermiso("");
      setPermisos({ ...DEFAULT_OPERATOR_CONFIG });
    }
  }

  const activePermsCount = useMemo(() => {
    if (rol === "admin") return ALL_PERMISSIONS.length;
    return Object.values(permisos || {}).filter(Boolean).length;
  }, [rol, permisos]);

  const filteredModules = useMemo(() => {
    const q = searchPermiso.trim().toLowerCase();
    if (!q) return PERMISSION_MODULES;

    return PERMISSION_MODULES.map((mod) => {
      const modMatch = mod.module.toLowerCase().includes(q);
      const matchedPerms = mod.permissions.filter(
        (p) =>
          modMatch ||
          p.label.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q),
      );
      return {
        ...mod,
        permissions: matchedPerms,
      };
    }).filter((mod) => mod.permissions.length > 0);
  }, [searchPermiso]);

  if (!isOpen) return null;

  const handleTogglePermission = (key) => {
    setPermisos((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleModule = (modulePermissions, enableAll) => {
    setPermisos((prev) => {
      const updated = { ...prev };
      modulePermissions.forEach((p) => {
        updated[p.key] = enableAll;
      });
      return updated;
    });
  };

  const handleSelectAll = (enableAll) => {
    const updated = {};
    ALL_PERMISSIONS.forEach((p) => {
      updated[p.key] = enableAll;
    });
    setPermisos(updated);
  };

  const handleApplyDefaultOperator = () => {
    setPermisos({ ...DEFAULT_OPERATOR_CONFIG });
    showToast("Aplicada configuración estándar recomendada para Operador.", "info");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !nombreCompleto.trim()) {
      showToast("Nombre completo y usuario son obligatorios.", "error");
      return;
    }

    if (!userToEdit && password.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres.", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: username.trim().toLowerCase(),
        nombre_completo: nombreCompleto.trim(),
        email: email.trim() || null,
        rol,
        permisos:
          rol === "admin"
            ? ALL_PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.key]: true }), {})
            : permisos,
      };

      if (!userToEdit) {
        payload.password = password;
        await userApi.createUser(payload);
        showToast("Usuario creado exitosamente.", "success");
      } else {
        await userApi.updateUser(userToEdit.id, payload);
        showToast("Usuario actualizado exitosamente.", "success");
      }

      if (onUserSaved) onUserSaved();
      onClose();
    } catch (err) {
      // Modo offline: actualizar caché local
      try {
        const cachedRaw = localStorage.getItem("app_usuarios_cache");
        let cached = cachedRaw ? JSON.parse(cachedRaw) : [];
        if (userToEdit) {
          cached = cached.map((u) =>
            u.id === userToEdit.id
              ? {
                  ...u,
                  nombre_completo: nombreCompleto.trim(),
                  email: email.trim() || null,
                  rol,
                  permisos,
                }
              : u,
          );
        } else {
          cached.push({
            id: Date.now(),
            username: username.trim().toLowerCase(),
            nombre_completo: nombreCompleto.trim(),
            email: email.trim() || null,
            rol,
            activo: true,
            permisos,
          });
        }
        localStorage.setItem("app_usuarios_cache", JSON.stringify(cached));
        showToast("Usuario guardado en caché local (Modo Offline).", "info");
        if (onUserSaved) onUserSaved();
        onClose();
      } catch {
        showToast("Error al guardar el usuario en caché local.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Fijo */}
        <div className="bg-slate-900 p-4 sm:p-5 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
              {userToEdit ? (
                <UserCheck className="w-5 h-5" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base font-bold truncate">
                {userToEdit
                  ? `Editar Usuario: ${userToEdit.username}`
                  : "Crear Nuevo Usuario"}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {userToEdit
                  ? "Modifique datos y permisos de acceso"
                  : "Defina credenciales y asignación de permisos granulares"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario con Scroll Interno */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs font-bold text-slate-700 dark:text-slate-200">
            {/* Datos Básicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Usuario / Login *
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(userToEdit)}
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase().replace(/\s+/g, ""),
                    )
                  }
                  placeholder="ej: maria.operaciones"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400 dark:disabled:text-slate-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="ej: María Gómez"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Correo Electrónico (Opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej: usuario@empresa.com"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Rol en el Sistema *
                </label>
                <select
                  value={rol}
                  onChange={(e) => {
                    const newRol = e.target.value;
                    setRol(newRol);
                    if (newRol === "admin") {
                      handleSelectAll(true);
                    }
                  }}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer transition"
                >
                  <option value="operador">
                    Operador (Permisos Granulares)
                  </option>
                  <option value="admin">Administrador (Control Total)</option>
                </select>
              </div>

              {!userToEdit && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Contraseña Inicial *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition"
                  />
                </div>
              )}
            </div>

            {/* Permisos Granulares - Matriz de Permisos */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />{" "}
                      Matriz de Permisos
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {activePermsCount} de {ALL_PERMISSIONS.length} activos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 font-normal mt-0.5">
                    {rol === "admin"
                      ? "Los administradores cuentan con acceso irrestricto a todos los módulos."
                      : "Configure específicamente cada módulo y permiso para este operador."}
                  </p>
                </div>

                {rol !== "admin" && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleApplyDefaultOperator}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      title="Restablecer a la configuración recomendada para operador"
                    >
                      <RotateCcw className="w-3 h-3 text-emerald-600" />
                      <span>Estándar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAll(true)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline cursor-pointer"
                    >
                      Marcar todos
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAll(false)}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
                    >
                      Desmarcar todos
                    </button>
                  </div>
                )}
              </div>

              {/* Buscador de permisos en la matriz */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filtrar permisos específicos (ej: surtido, pos, flete, catálogo, exportar)..."
                  value={searchPermiso}
                  onChange={(e) => setSearchPermiso(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 pl-8 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                {searchPermiso && (
                  <button
                    type="button"
                    onClick={() => setSearchPermiso("")}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[44vh] sm:max-h-[48vh] overflow-y-auto pr-1 custom-scrollbar">
                {filteredModules.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-400 italic">
                    No se encontraron permisos coincidentes con "{searchPermiso}".
                  </p>
                ) : (
                  filteredModules.map((mod) => {
                    const ModIcon = MODULE_ICONS[mod.module] || ShieldCheck;
                    const allModSelected = mod.permissions.every(
                      (p) => rol === "admin" || Boolean(permisos[p.key]),
                    );
                    const selectedCount = mod.permissions.filter(
                      (p) => rol === "admin" || Boolean(permisos[p.key]),
                    ).length;

                    return (
                      <div
                        key={mod.module}
                        className="bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                              <ModIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                              {mod.module}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 ml-1">
                              ({selectedCount}/{mod.permissions.length})
                            </span>
                          </div>
                          {rol !== "admin" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleModule(
                                  mod.permissions,
                                  !allModSelected,
                                )
                              }
                              className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 cursor-pointer select-none"
                            >
                              {allModSelected
                                ? "Desmarcar módulo"
                                : "Marcar módulo"}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {mod.permissions.map((p) => {
                            const isChecked =
                              rol === "admin" ? true : Boolean(permisos[p.key]);
                            return (
                              <label
                                key={p.key}
                                className={`flex items-start gap-2.5 p-2 rounded-xl border transition cursor-pointer select-none ${
                                  isChecked
                                    ? "bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-800 shadow-2xs"
                                    : "bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={rol === "admin"}
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(p.key)}
                                  className="mt-0.5 w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 dark:border-slate-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 block leading-tight">
                                    {p.label}
                                  </span>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-normal mt-0.5">
                                    {p.desc}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer Fijo */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900 p-3.5 sm:p-4 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {loading
                  ? "Guardando..."
                  : userToEdit
                    ? "Guardar Cambios"
                    : "Crear Usuario"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
