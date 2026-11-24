import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Users,
  History,
  UserPlus,
  Edit2,
  UserX,
  UserCheck,
  Key,
  Shield,
  Search,
  RefreshCw,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  Download,
  Activity,
  UserCog,
  X,
  FileCode,
} from "lucide-react";
import { userApi } from "../api/userApi";
import { auditApi } from "../api/auditApi";
import { useToast } from "../context/ToastContext";
import UserFormModal from "../components/modals/UserFormModal";
import ResetUserPasswordModal from "../components/modals/ResetUserPasswordModal";

export default function AdminView({ isOnline = true }) {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState(
    () =>
      (typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("subtab")) ||
      "usuarios",
  ); // "usuarios" | "auditoria"

  // Estado Usuarios con caché local
  const [usuarios, setUsuarios] = useState(() => {
    try {
      const cached = localStorage.getItem("app_usuarios_cache");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [modalUserOpen, setModalUserOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("open_modal") ===
        "nuevo_usuario",
  );
  const [userParaEditar, setUserParaEditar] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);

  // Estado Auditoría y Paginación con caché local
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const cached = localStorage.getItem("app_audit_cache");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [totalLogs, setTotalLogs] = useState(() => {
    try {
      const cached = localStorage.getItem("app_audit_total_cache");
      return cached ? Number(cached) : 0;
    } catch {
      return 0;
    }
  });
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [filtroModulo, setFiltroModulo] = useState("");
  const [filtroAccion] = useState("");
  const [filtroSearch, setFiltroSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [logSeleccionado, setLogSeleccionado] = useState(null);

  // Controles de Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalLogs / pageSize));
  }, [totalLogs, pageSize]);

  // Debounce para búsqueda libre
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filtroSearch);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [filtroSearch]);

  // Métricas de usuarios
  const userStats = useMemo(() => {
    const total = usuarios.length;
    const activos = usuarios.filter((u) => u.activo).length;
    const inactivos = total - activos;
    const admins = usuarios.filter((u) => u.rol === "admin" && u.activo).length;
    const operadores = usuarios.filter(
      (u) => u.rol === "operador" && u.activo,
    ).length;
    return { total, activos, inactivos, admins, operadores };
  }, [usuarios]);

  const cargarUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const data = await userApi.getAllUsers();
      setUsuarios(data);
      localStorage.setItem("app_usuarios_cache", JSON.stringify(data));
    } catch {
      // Modo offline: usar datos guardados en caché sin error invasivo
      const cached = localStorage.getItem("app_usuarios_cache");
      if (cached) {
        try {
          setUsuarios(JSON.parse(cached));
        } catch {
          // ignore
        }
      }
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const cargarTotalCount = async () => {
    try {
      const data = await auditApi.getTotalCount();
      setTotalLogs(data.total || 0);
      localStorage.setItem("app_audit_total_cache", String(data.total || 0));
    } catch {
      // Modo offline: mantener total en caché
    }
  };

  const lastFetchedParamsRef = useRef("");

  const cargarAuditoria = useCallback(
    async (force = false) => {
      const currentKey = `${filtroModulo}|${filtroAccion}|${debouncedSearch}|${page}|${pageSize}`;
      if (
        !force &&
        lastFetchedParamsRef.current === currentKey &&
        auditLogs.length > 0
      ) {
        return;
      }
      setLoadingAudit(true);
      try {
        const params = {
          limit: pageSize,
          offset: (page - 1) * pageSize,
        };
        if (filtroModulo) params.modulo = filtroModulo;
        if (filtroAccion) params.accion = filtroAccion;
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

        const data = await auditApi.getLogs(params);
        setAuditLogs(data.items || []);
        setTotalLogs(data.total || 0);
        lastFetchedParamsRef.current = currentKey;
        localStorage.setItem("app_audit_cache", JSON.stringify(data.items || []));
        localStorage.setItem("app_audit_total_cache", String(data.total || 0));
      } catch {
        // Modo offline: cargar logs desde caché
        const cached = localStorage.getItem("app_audit_cache");
        if (cached) {
          try {
            setAuditLogs(JSON.parse(cached));
          } catch {
            // ignore
          }
        }
      } finally {
        setLoadingAudit(false);
      }
    },
    [filtroModulo, filtroAccion, debouncedSearch, page, pageSize, auditLogs.length],
  );

  // Carga inicial inmediata de métricas generales
  useEffect(() => {
    Promise.resolve().then(() => {
      cargarUsuarios();
      cargarTotalCount();
    });
  }, []);

  // Recarga según pestaña y filtros de auditoría
  useEffect(() => {
    if (subTab === "auditoria") {
      Promise.resolve().then(() => {
        cargarAuditoria();
      });
    }
  }, [subTab, cargarAuditoria]);

  const handleToggleStatus = async (user) => {
    const accionTexto = user.activo ? "desactivar (baja lógica)" : "reactivar";
    if (
      !window.confirm(
        `¿Seguro que desea ${accionTexto} la cuenta de "${user.username}"?`,
      )
    ) {
      return;
    }
    try {
      await userApi.toggleUserStatus(user.id, !user.activo);
      showToast(
        `Usuario ${user.username} ${user.activo ? "desactivado" : "reactivado"} con éxito.`,
      );
      cargarUsuarios();
    } catch {
      // Fallback offline
      const updated = usuarios.map((u) =>
        u.id === user.id ? { ...u, activo: !u.activo } : u,
      );
      setUsuarios(updated);
      localStorage.setItem("app_usuarios_cache", JSON.stringify(updated));
      showToast(
        `Estado de ${user.username} actualizado localmente (Modo Offline).`,
      );
    }
  };

  const handleResetPassword = (user) => {
    setResetPasswordUser(user);
  };

  const exportCsvHref = auditApi.exportCsvUrl({
    modulo: filtroModulo,
    accion: filtroAccion,
    search: filtroSearch,
  });

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Tarjetas de Métricas de Administración */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              Usuarios Totales
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {userStats.total}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
              {userStats.activos} activos | {userStats.inactivos} inactivos
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              Administradores
            </span>
            <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-400 tabular-nums">
              {userStats.admins}
            </span>
            <span className="text-[10px] text-purple-400 dark:text-purple-400/80 block mt-0.5 truncate">
              Control total del sistema
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              Operadores Activos
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <UserCog className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 tabular-nums">
              {userStats.operadores}
            </span>
            <span className="text-[10px] text-blue-400 dark:text-blue-400/80 block mt-0.5 truncate">
              Permisos granulares
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              Logs Registrados
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {totalLogs}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
              Trazabilidad inmutable
            </span>
          </div>
        </div>
      </div>

      {/* 2. Selector de Subpestañas */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm truncate">
            Panel de Seguridad y Administración
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-400">
            Control de usuarios, asignación de permisos y registro de auditoría.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setSubTab("usuarios")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              subTab === "usuarios"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" /> <span>Usuarios</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab("auditoria")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              subTab === "auditoria"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <History className="w-4 h-4" /> <span>Auditoría</span>
          </button>
        </div>
      </div>

      {/* Banner de Modo Offline para Administración */}
      {!isOnline && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-3.5 flex items-center gap-2.5 text-amber-900 dark:text-amber-200 text-xs font-medium shadow-2xs">
          <Shield className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Modo Offline Activo:</strong> El panel de administración se
            encuentra en modo de <strong>Solo Consulta</strong>. Para crear
            usuarios, cambiar contraseñas o modificar permisos, conecte el
            sistema al servidor.
          </span>
        </div>
      )}

      {/* SUBTAB 1: GESTIÓN DE USUARIOS */}
      {subTab === "usuarios" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="min-w-0">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-white">
                Usuarios Registrados ({usuarios.length})
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {isOnline
                  ? "Cree, edite o asigne permisos a los operadores del sistema."
                  : "Listado de operadores y administradores disponibles en caché local."}
              </p>
            </div>
            {isOnline && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={cargarUsuarios}
                  disabled={loadingUsuarios}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="Recargar usuarios"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loadingUsuarios ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserParaEditar(null);
                    setModalUserOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" /> <span>Nuevo Usuario</span>
                </button>
              </div>
            )}
          </div>

          {/* VISTA MÓVIL Y TABLET DE USUARIOS (< 1024px) */}
          <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
            {usuarios.map((u) => {
              const totalPermisos = 29;
              const activePermsCount =
                u.rol === "admin"
                  ? totalPermisos
                  : Object.values(u.permisos || {}).filter(Boolean).length;

              return (
                <div
                  key={u.id}
                  className={`bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3.5 space-y-2.5 transition ${
                    !u.activo ? "bg-red-50/20 dark:bg-red-950/20 opacity-75" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-black text-xs text-slate-900 dark:text-white truncate">
                        {u.nombre_completo}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        @{u.username}
                      </p>
                      {u.email && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {u.email}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                          u.rol === "admin"
                            ? "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        }`}
                      >
                        <Shield className="w-3 h-3" /> {u.rol}
                      </span>
                      {u.activo ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                          <XCircle className="w-2.5 h-2.5" /> Inactivo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700 text-xs">
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                      {u.rol === "admin"
                        ? "Todos (29 - Control Total)"
                        : `${activePermsCount} de ${totalPermisos} activos`}
                    </span>

                    {isOnline && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserParaEditar(u);
                            setModalUserOpen(true);
                          }}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(u)}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                          title="Restablecer Contraseña"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            u.activo
                              ? "text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                              : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          }`}
                          title={u.activo ? "Desactivar" : "Reactivar"}
                        >
                          {u.activo ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISTA ESCRITORIO (>= 1024px) */}
          <div
            className="hidden lg:block overflow-x-auto custom-scrollbar"
            tabIndex={0}
            role="region"
            aria-label="Tabla de usuarios del sistema"
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-black uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Nombre Completo</th>
                  <th className="p-3">Email</th>
                  <th className="p-3 text-center">Rol</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3">Permisos Habilitados</th>
                  {isOnline && <th className="p-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 font-medium">
                {usuarios.map((u) => {
                  const totalPermisos = 29;
                  const activePermsCount =
                    u.rol === "admin"
                      ? totalPermisos
                      : Object.values(u.permisos || {}).filter(Boolean).length;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                        !u.activo ? "bg-red-50/30 dark:bg-red-950/20 opacity-75" : ""
                      }`}
                    >
                      <td className="p-3 font-bold text-slate-900 dark:text-white font-mono">
                        @{u.username}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {u.nombre_completo}
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">{u.email || "-"}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                            u.rol === "admin"
                              ? "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              : "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          }`}
                        >
                          <Shield className="w-3 h-3" /> {u.rol}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {u.activo ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                            <XCircle className="w-3 h-3" /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                          {u.rol === "admin"
                            ? "Todos (29 - Control Total)"
                            : `${activePermsCount} de ${totalPermisos} activos`}
                        </span>
                      </td>
                      {isOnline && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setUserParaEditar(u);
                                setModalUserOpen(true);
                              }}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                              title="Editar Datos y Permisos"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetPassword(u)}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition cursor-pointer"
                              title="Restablecer Contraseña"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                u.activo
                                  ? "text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              }`}
                              title={
                                u.activo
                                  ? "Desactivar (Baja Lógica)"
                                  : "Reactivar Cuenta"
                              }
                            >
                              {u.activo ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: REGISTRO DE AUDITORÍA INMUTABLE */}
      {subTab === "auditoria" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="min-w-0">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-white">
                Pistas de Auditoría Inmutables ({totalLogs} eventos)
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Registro histórico cronológico de todas las operaciones
                realizadas.
              </p>
            </div>

            {/* Filtros y Exportación */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="text"
                  placeholder="Buscar en auditoría..."
                  value={filtroSearch}
                  onChange={(e) => setFiltroSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && cargarAuditoria(true)}
                  className="w-full sm:w-48 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 pl-8 text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-bold bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={filtroModulo}
                aria-label="Filtrar por módulo"
                onChange={(e) => setFiltroModulo(e.target.value)}
                className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
              >
                <option value="">Todos los Módulos</option>
                <option value="AUTENTICACION">Autenticación</option>
                <option value="PEDIDOS">Pedidos</option>
                <option value="USUARIOS">Usuarios</option>
                <option value="CLIENTES">Clientes</option>
                <option value="EMPRESA">Empresa</option>
                <option value="EXPORTACIONES">Exportaciones</option>
              </select>

              {isOnline && (
                <button
                  type="button"
                  onClick={() => cargarAuditoria(true)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
                  title="Refrescar auditoría"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loadingAudit ? "animate-spin" : ""}`}
                  />
                </button>
              )}

              {isOnline && (
                <a
                  href={exportCsvHref}
                  download
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition shrink-0"
                  title="Descargar reporte CSV de auditoría"
                >
                  <Download className="w-3.5 h-3.5" /> <span>CSV</span>
                </a>
              )}
            </div>
          </div>

          {loadingAudit && auditLogs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Cargando registros de auditoría...
              </span>
            </div>
          ) : (
            <>
              {/* VISTA MÓVIL Y TABLET DE AUDITORÍA (< 1024px) */}
              <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800 space-y-2.5">
                {auditLogs.length === 0 ? (
                  <p className="p-8 text-center text-slate-400 dark:text-slate-500 italic text-xs">
                    No se encontraron registros de auditoría con los filtros
                    aplicados.
                  </p>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3.5 space-y-2 transition hover:bg-slate-100/60 dark:hover:bg-slate-800 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {log.usuario_nombre || "Sistema"}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">
                              ({log.usuario_rol})
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 inline text-slate-400 shrink-0" />
                            {new Date(log.creado_en).toLocaleString("es-CO")}
                          </p>
                        </div>

                        <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                          {log.accion}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            {log.modulo}
                          </span>
                          {log.entidad && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                              {log.entidad} #{log.entidad_id || ""}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setLogSeleccionado(log)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1 font-bold text-[11px] shrink-0"
                          title="Ver detalles completos"
                        >
                          <Eye className="w-3.5 h-3.5" /> <span>Detalle</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* VISTA ESCRITORIO (>= 1024px) */}
              <div
                className="hidden lg:block overflow-x-auto custom-scrollbar"
                tabIndex={0}
                role="region"
                aria-label="Tabla de registros de auditoría y sesiones"
              >
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-black uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 w-40">Fecha y Hora</th>
                      <th className="p-3">Usuario</th>
                      <th className="p-3">Acción</th>
                      <th className="p-3">Módulo</th>
                      <th className="p-3">Entidad / ID</th>
                      <th className="p-3">IP Origen</th>
                      <th className="p-3 text-center">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 font-medium">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="p-8 text-center text-slate-400 dark:text-slate-500 italic"
                        >
                          No se encontraron registros de auditoría con los
                          filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                            {new Date(log.creado_en).toLocaleString("es-CO")}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[140px]">
                              {log.usuario_nombre || "Sistema"}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">
                              {log.usuario_rol}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                            <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-slate-700 dark:text-slate-300">
                              {log.accion}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                            {log.modulo}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                            {log.entidad
                              ? `${log.entidad} #${log.entidad_id || ""}`
                              : "-"}
                          </td>
                          <td className="p-3 text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                            {log.ip_address || "local"}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setLogSeleccionado(log)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition cursor-pointer"
                              title="Ver detalles completos"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Controles de Paginación */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                  <span>
                    Mostrando página{" "}
                    <strong className="text-slate-900 dark:text-white">{page}</strong> de{" "}
                    <strong className="text-slate-900 dark:text-white">{totalPages}</strong> (
                    {totalLogs} eventos totales)
                  </span>
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-slate-400 dark:text-slate-500">Filas:</span>
                    <select
                      value={pageSize}
                      aria-label="Registros por página"
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 outline-none"
                    >
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(1)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-xs"
                  >
                    « Primera
                  </button>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-xs"
                  >
                    ‹ Anterior
                  </button>
                  <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-slate-800 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-xs"
                  >
                    Siguiente ›
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(totalPages)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-xs"
                  >
                    Última »
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal Crear / Editar Usuario */}
      <UserFormModal
        isOpen={modalUserOpen}
        userToEdit={userParaEditar}
        onClose={() => setModalUserOpen(false)}
        onUserSaved={cargarUsuarios}
      />

      {/* Modal Restablecer Contraseña */}
      <ResetUserPasswordModal
        isOpen={Boolean(resetPasswordUser)}
        user={resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
        onPasswordReset={cargarUsuarios}
      />

      {/* Modal Visor de Detalles de Auditoría */}
      {logSeleccionado && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92dvh] animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <FileCode className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold truncate">
                    Registro de Auditoría #{logSeleccionado.id}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    {logSeleccionado.accion} en {logSeleccionado.modulo}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLogSeleccionado(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-3 text-xs overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-black block text-[10px] uppercase">
                    Usuario
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {logSeleccionado.usuario_nombre} (
                    {logSeleccionado.usuario_rol})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-black block text-[10px] uppercase">
                    Fecha y Hora
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {new Date(logSeleccionado.creado_en).toLocaleString(
                      "es-CO",
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-black block text-[10px] uppercase">
                    Entidad Afectada
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {logSeleccionado.entidad || "N/A"} #
                    {logSeleccionado.entidad_id || ""}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-black block text-[10px] uppercase">
                    IP Origen
                  </span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {logSeleccionado.ip_address || "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-700 dark:text-slate-300 font-black block text-xs uppercase mb-1.5">
                  Carga de Datos / Cambios (JSON):
                </span>
                <pre className="bg-slate-950 text-emerald-400 p-3 rounded-xl overflow-x-auto text-[11px] font-mono max-h-52 custom-scrollbar border border-slate-800">
                  {JSON.stringify(logSeleccionado.detalles, null, 2)}
                </pre>
              </div>
            </div>
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setLogSeleccionado(null)}
                className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition shadow-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
