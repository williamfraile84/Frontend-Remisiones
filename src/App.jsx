import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useCompanyContext } from "./context/CompanyContext";
import LoginView from "./views/LoginView";
import InitialSetupView from "./views/InitialSetupView";
import CompanySelectorView from "./views/CompanySelectorView";
import ProtectedLayout from "./components/layout/ProtectedLayout";

/**
 * Guardián de Rutas Autenticadas (ProtectedRoute)
 * Impide el acceso si el usuario no ha iniciado sesión,
 * redirigiéndolo de manera atómica a la ruta /login.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-emerald-400">
          <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-300">
            Iniciando Sistema de Gestión...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * Guardián de Rutas Operativas (CompanyRouteGuard)
 * Garantiza de forma atómica que antes de montar el layout operativo:
 * 1. Exista una empresa configurada (de lo contrario redirige a /setup-empresa).
 * 2. Si existen múltiples empresas y ninguna está seleccionada, redirige a /seleccionar-empresa.
 */
function CompanyRouteGuard({ children }) {
  const { empresa, empresaConfigurada, loading, empresas } = useCompanyContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-emerald-400">
          <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-300">
            Verificando configuración de empresa...
          </span>
        </div>
      </div>
    );
  }

  // Si no hay ninguna empresa en el sistema: ruta atómica /setup-empresa
  if (!empresaConfigurada) {
    return <Navigate to="/setup-empresa" state={{ from: location }} replace />;
  }

  // Si hay múltiples empresas y ninguna está seleccionada: ruta atómica /seleccionar-empresa
  if (!empresa && empresas.length > 1) {
    return (
      <Navigate to="/seleccionar-empresa" state={{ from: location }} replace />
    );
  }

  return children;
}

/**
 * Enrutador Principal Atómico de la Aplicación
 */
export default function App() {
  return (
    <Routes>
      {/* Ruta atómica para Login y Creación de Administrador Inicial */}
      <Route path="/login" element={<LoginView />} />

      {/* Ruta atómica para Configuración Inicial de Empresa */}
      <Route
        path="/setup-empresa"
        element={
          <ProtectedRoute>
            <InitialSetupView />
          </ProtectedRoute>
        }
      />

      {/* Ruta atómica para Selección de Empresa Multi-Sucursal */}
      <Route
        path="/seleccionar-empresa"
        element={
          <ProtectedRoute>
            <CompanySelectorView />
          </ProtectedRoute>
        }
      />

      {/* Rutas operativas protegidas con Layout autenticado y Empresa activa */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <CompanyRouteGuard>
              <ProtectedLayout />
            </CompanyRouteGuard>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
