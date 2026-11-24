import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ThemeProvider } from "./context/ThemeContext";
import { LoadingProvider } from "./context/LoadingContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { CompanyProvider } from "./context/CompanyContext";
import { applyDemoSeed } from "./utils/devDemoSeeder";

if (typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  if (params.get("dev_auto_auth") === "1") {
    applyDemoSeed();
  }
  const themeParam = params.get("theme");
  if (themeParam === "dark" || themeParam === "light") {
    localStorage.setItem("fruver_orders_theme", themeParam);
    localStorage.setItem("fruver_theme", themeParam);
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ThemeProvider>
        <LoadingProvider>
          <ToastProvider>
            <AuthProvider>
              <CompanyProvider>
                <ErrorBoundary title="Error en Sistema Fruver">
                  <App />
                </ErrorBoundary>
              </CompanyProvider>
            </AuthProvider>
          </ToastProvider>
        </LoadingProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
