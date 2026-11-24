import React, { useState, useEffect } from "react";
import { Download, Check, RefreshCw } from "lucide-react";
import { useToast } from "../../context/ToastContext";

export default function PwaInstallButton({ onShowToast }) {
  let toastContext = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    toastContext = useToast();
  } catch {
    toastContext = null;
  }
  const notify = (msg, type = "success") => {
    if (onShowToast) onShowToast(msg, type);
    else if (toastContext?.showToast) toastContext.showToast(msg, type);
  };
  const notifyRef = React.useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  });

  const [deferredPrompt, setDeferredPrompt] = useState(() => {
    return (typeof window !== "undefined" && window.__pwaInstallPrompt) || null;
  });
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(
      window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true ||
        document.referrer.includes("android-app://"),
    );
  });
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // 1. Comprobar si ya está instalada en el sistema operativo
    if (navigator.getInstalledRelatedApps) {
      navigator
        .getInstalledRelatedApps()
        .then((apps) => {
          if (apps && apps.length > 0) {
            setIsStandalone(true);
          }
        })
        .catch(() => {});
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.__pwaInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handlePromptAvailable = (e) => {
      if (e.detail) {
        setDeferredPrompt(e.detail);
      }
    };

    const handleAppInstalled = () => {
      window.__pwaInstallPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
      setIsInstalling(false);
      notifyRef.current(
        "¡PWA Instalada! Sistema Fruver ya está en tu pantalla de inicio o escritorio.",
        "success",
      );
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("pwa-prompt-available", handlePromptAvailable);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("pwa-app-installed", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("pwa-prompt-available", handlePromptAvailable);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("pwa-app-installed", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    let promptEvent =
      deferredPrompt ||
      (typeof window !== "undefined" ? window.__pwaInstallPrompt : null);

    // Si el prompt nativo está listo, invocarlo de inmediato
    if (promptEvent) {
      try {
        setIsInstalling(true);
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === "accepted") {
          notify("Instalando Sistema Fruver en tu equipo...", "success");
          setIsStandalone(true);
        }
        window.__pwaInstallPrompt = null;
        setDeferredPrompt(null);
      } catch (err) {
        console.warn("Fallo al disparar prompt de instalación:", err);
      } finally {
        setIsInstalling(false);
      }
      return;
    }

    // Si ya está instalada en el sistema
    if (isStandalone) {
      notify("Sistema Fruver ya está instalado. Puedes abrirlo directamente desde tu escritorio.", "info");
      return;
    }

    // Esperar hasta 2 segundos si el evento está por llegar
    setIsInstalling(true);
    const waitForPrompt = new Promise((resolve) => {
      const onAvailable = (e) => {
        window.removeEventListener("pwa-prompt-available", onAvailable);
        resolve(e.detail || window.__pwaInstallPrompt);
      };
      window.addEventListener("pwa-prompt-available", onAvailable);

      let timer = 0;
      const interval = setInterval(() => {
        timer += 100;
        const p = window.__pwaInstallPrompt;
        if (p) {
          clearInterval(interval);
          window.removeEventListener("pwa-prompt-available", onAvailable);
          resolve(p);
        } else if (timer >= 2000) {
          clearInterval(interval);
          window.removeEventListener("pwa-prompt-available", onAvailable);
          resolve(null);
        }
      }, 100);
    });

    const readyPrompt = await waitForPrompt;
    setIsInstalling(false);

    if (readyPrompt) {
      try {
        await readyPrompt.prompt();
        const choice = await readyPrompt.userChoice;
        if (choice && choice.outcome === "accepted") {
          notify("Instalando Sistema Fruver...", "success");
          setIsStandalone(true);
        }
        window.__pwaInstallPrompt = null;
        setDeferredPrompt(null);
        return;
      } catch (e) {
        console.warn("Error en prompt esperado:", e);
      }
    }

    notify("Para confirmar, pulsa el icono de instalación (⊞ o ⬇) a la derecha en la barra de direcciones de Chrome o Edge.", "info");
  };

  if (isStandalone) {
    return (
      <span
        className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 select-none"
        title="Sistema Fruver está instalado y activo en modo App"
      >
        <Check className="w-3.5 h-3.5 text-emerald-500" />
        <span>PWA Lista</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      disabled={isInstalling}
      className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition shadow-2xs cursor-pointer shrink-0 disabled:opacity-75"
      title="Instalar Sistema Fruver directamente en tu equipo o móvil"
      aria-label="Instalar Sistema Fruver PWA"
    >
      {isInstalling ? (
        <RefreshCw className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
      )}
      <span className="hidden sm:inline text-emerald-800 dark:text-emerald-300">
        {isInstalling ? "Instalando..." : "Instalar App"}
      </span>
    </button>
  );
}
