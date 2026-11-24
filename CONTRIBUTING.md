# Guía de Contribución al Sistema Fruver

¡Gracias por tu interés en colaborar con el **Sistema Fruver (Pedidos, Remisiones y Logística)**! Este proyecto sigue estándares profesionales de ingeniería de software, arquitectura limpia y código abierto.

---

## 📋 Principios Innegociables

1. **Preservación Funcional**: Toda modificación o refactorización debe preservar el 100% de los flujos de negocio existentes (ciclo de vida de pedidos, cálculo de empaques y taras, remisiones y catálogo maestro).
2. **Aislamiento de Puertos**: El backend de `sistema_fruver` opera en el puerto **8001** y su frontend de desarrollo en el **5174**, permitiendo coexistencia simultánea con `inventario_fruver` (8000/5173). No alteres estas asignaciones predeterminadas.
3. **Pruebas Automatizadas**: Todo cambio o nueva característica debe incluir pruebas en `backend/tests/` y mantener el 100% de la suite pasando exitosamente.
4. **Clean Code & Tipado**: Se aplican principios SOLID, DRY, validación Pydantic estricta y modelos ORM en 3NF (Tercera Forma Normal).

---

## 🛠️ Flujo de Trabajo (Git Workflow)

1. Haz un Fork del repositorio en GitHub.
2. Crea una rama descriptiva para tu trabajo:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   # o
   git checkout -b fix/correccion-logistica
   ```
3. Utiliza la convención de **Conventional Commits**:
   - `feat: agregar exportación de remisión en formato Factura Electrónica`
   - `fix: corregir cálculo de tara en presentaciones de canastilla plástica`
   - `docs: actualizar diagrama de ciclo de vida de pedidos`
   - `test: agregar casos de prueba para eliminación lógica en catálogo`
   - `refactor: optimizar consultas de liquidación de fletes`

---

## 💻 Entorno de Desarrollo Local

### 1. Backend (Python 3.10+ / FastAPI)

```bash
cd backend

# Activar entorno virtual
venvCasa\Scripts\activate   # Windows
# o: source venv/bin/activate  # Linux/macOS

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar suite de pruebas completa
pytest -v
```

### 2. Frontend (React 19 / Vite / Tailwind CSS)

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en puerto 5174 (con proxy a 8001)
npm run dev

# Validar compilación de producción
npm run build
```

---

## 🚀 Envío de Pull Requests

1. Sincroniza tu rama con el repositorio principal:
   ```bash
   git fetch origin
   git rebase origin/master
   ```
2. Ejecuta la suite de pruebas completa y la compilación de frontend antes de subir tus cambios.
3. Envía tu Pull Request describiendo con claridad la motivación, la solución técnica adoptada y las verificaciones ejecutadas.
