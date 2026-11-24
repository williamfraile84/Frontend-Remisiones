import { useState, useEffect } from "react";
import { clientApi } from "../api/clientApi";
import { useToast } from "../context/ToastContext";

export function useClients(isPedidoBloqueado = false) {
  const [clientes, setClientes] = useState(() => {
    try {
      const cached = localStorage.getItem("app_clientes_cache");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Restaurar cliente activo de la sesión actual (F5 / recargas / offline)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(() => {
    try {
      const activeId =
        localStorage.getItem("app_active_client_id") ||
        (() => {
          const raw = localStorage.getItem("app_order_draft");
          return raw ? JSON.parse(raw)?.clienteId : null;
        })();
      const cached = localStorage.getItem("app_clientes_cache");
      if (activeId && cached) {
        const parsed = JSON.parse(cached);
        return parsed.find((c) => String(c.id) === String(activeId)) || null;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [clienteParaEditar, setClienteParaEditar] = useState(null);
  const [modalClienteOpen, setModalClienteOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("open_modal") ===
        "cliente",
  );
  const { showToast } = useToast();

  const cargarClientes = async () => {
    const token =
      localStorage.getItem("app_token") || localStorage.getItem("fruver_token");
    if (!token) {
      // Si el usuario no ha iniciado sesión, no disparar peticiones no autorizadas
      return [];
    }

    try {
      const data = await clientApi.getAll();
      setClientes(data);
      localStorage.setItem("app_clientes_cache", JSON.stringify(data));

      try {
        const activeId =
          localStorage.getItem("app_active_client_id") ||
          (() => {
            const raw = localStorage.getItem("app_order_draft");
            return raw ? JSON.parse(raw)?.clienteId : null;
          })();
        if (activeId) {
          const found = data.find((c) => String(c.id) === String(activeId));
          if (found) {
            setClienteSeleccionado(found);
          }
        }
      } catch {
        // ignore
      }
      return data;
    } catch {
      // Modo offline / backend caído: cargar desde localStorage
      const cached = localStorage.getItem("app_clientes_cache");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setClientes(parsed);

          const activeId =
            localStorage.getItem("app_active_client_id") ||
            (() => {
              const raw = localStorage.getItem("app_order_draft");
              return raw ? JSON.parse(raw)?.clienteId : null;
            })();
          if (activeId) {
            const found = parsed.find((c) => String(c.id) === String(activeId));
            if (found) {
              setClienteSeleccionado(found);
            }
          }
          return parsed;
        } catch {
          // ignore
        }
      }
      return [];
    }
  };

  const guardarCliente = async (datos) => {
    try {
      const guardado = await clientApi.save(datos);
      const listaActualizada = [
        ...clientes.filter((c) => c.id !== guardado.id),
        guardado,
      ].sort((a, b) => a.razon_social.localeCompare(b.razon_social));

      setClientes(listaActualizada);
      localStorage.setItem(
        "app_clientes_cache",
        JSON.stringify(listaActualizada),
      );
      setClienteSeleccionado(guardado);
      try {
        localStorage.setItem("app_active_client_id", String(guardado.id));
      } catch {
        // ignore
      }
      setModalClienteOpen(false);
      setClienteParaEditar(null);
      showToast(`Cliente ${guardado.razon_social} guardado.`);
      return guardado;
    } catch {
      // Fallback offline: guardar cliente localmente
      const localClient = {
        id: datos.id || Date.now(),
        ...datos,
        consecutivo_remision_actual: datos.consecutivo_remision_actual || 1,
        _offline: true,
      };
      const listaActualizada = [
        ...clientes.filter((c) => c.id !== localClient.id),
        localClient,
      ].sort((a, b) => a.razon_social.localeCompare(b.razon_social));

      setClientes(listaActualizada);
      localStorage.setItem(
        "app_clientes_cache",
        JSON.stringify(listaActualizada),
      );
      setClienteSeleccionado(localClient);
      try {
        localStorage.setItem("app_active_client_id", String(localClient.id));
      } catch {
        // ignore
      }
      setModalClienteOpen(false);
      setClienteParaEditar(null);
      showToast(`Cliente ${localClient.razon_social} guardado (Modo local).`);
      return localClient;
    }
  };

  const cambiarCliente = (cliente, callbackLimpiarPedido) => {
    if (isPedidoBloqueado) {
      showToast(
        "El pedido activo está bloqueado con factura o remisión firmada. Cree uno nuevo o desbloquee.",
        "error",
      );
      return false;
    }
    setClienteSeleccionado(cliente || null);
    try {
      if (cliente?.id) {
        localStorage.setItem("app_active_client_id", String(cliente.id));
      } else {
        localStorage.removeItem("app_active_client_id");
      }
    } catch {
      // ignore
    }
    if (callbackLimpiarPedido) callbackLimpiarPedido(cliente);
    if (cliente) {
      showToast(`Cliente activo: ${cliente.razon_social}`);
    }
    return true;
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      cargarClientes();
    });
  }, []);

  return {
    clientes,
    clienteSeleccionado,
    setClienteSeleccionado,
    clienteParaEditar,
    setClienteParaEditar,
    modalClienteOpen,
    setModalClienteOpen,
    cargarClientes,
    guardarCliente,
    cambiarCliente,
  };
}
