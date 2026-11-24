# Política de Seguridad y Divulgación Responsable

La seguridad de **Sistema Fruver (Gestión de Pedidos, Remisiones y Logística)** y la protección de los datos comerciales, clientes y transacciones operativas es una prioridad crítica.

---

## 🛡️ Versiones Compatibles

Actualmente se proporciona soporte de seguridad y parches para las siguientes versiones:

| Versión | Soporte de Seguridad |
| :--- | :---: |
| 2.0.x (Actual) | ✅ Activo |
| 1.x | ⚠️ Solo parches críticos |
| < 1.0.0 | ❌ No soportado |

---

## 🚨 Notificación de Vulnerabilidades

Si descubres una posible vulnerabilidad de seguridad en este proyecto:

1. **NO abras un Issue público en GitHub** con detalles técnicos o vectores de ataque explotables.
2. Envía un reporte privado detallado a través de **GitHub Security Advisories** en la pestaña *Security > Report a vulnerability* del repositorio.
3. Incluye:
   - Descripción detallada del hallazgo.
   - Pasos exactos o prueba de concepto (PoC) para reproducir el escenario.
   - Componente afectado (backend, frontend, base de datos, almacenamiento).
   - Impacto estimado (elevación de privilegios, fuga de datos, omisión de controles RBAC).

---

## 🔒 Prácticas de Hardening y Defensas Implementadas

Este sistema implementa defensas en profundidad por diseño arquitectónico:

- **Autenticación Criptográfica & JWT**:
  - Hashing de credenciales mediante `bcrypt` con factores de coste recomendados por la industria.
  - Firma de tokens JWT criptográficamente válidos con verificación de expiración estricta.
- **Control de Acceso Basado en Roles (RBAC)**:
  - Verificación granular de permisos en el backend en cada ruta protegida mediante dependencias FastAPI.
  - Principio de mínimo privilegio para operaciones de creación, edición, auditoría y borrado lógico.
- **Validación de Esquema e Inyección**:
  - Validación tipada exhaustiva de toda entrada mediante modelos Pydantic v2.
  - Consultas parametrizadas mediante SQLAlchemy 2.0 ORM para prevenir inyección SQL.
- **Cabeceras de Seguridad HTTP**:
  - Middleware activo inyectando `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, y `Permissions-Policy`.
- **Protección de Almacenamiento & Path Traversal**:
  - Sanitización de identificadores de archivo y nombres de adjuntos.
  - Aislamiento de carpetas de almacenamiento local (`storage_data/`).
- **Aislamiento Estricto de Secretos**:
  - Ninguna credencial real, contraseña de base de datos o API key se incluye en el control de versiones.
  - Plantilla segura `.env.example` provista con valores de demostración y base de datos local SQLite predeterminada.
