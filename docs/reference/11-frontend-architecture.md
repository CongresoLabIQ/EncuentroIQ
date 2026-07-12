# Arquitectura del frontend

**Audiencia:** Desarrolladores  
**Propósito:** Documentar la estructura, el flujo de navegación y los módulos del frontend.

---

## Estructura de archivos

```
├── index.html                 # Landing page con banner e información
├── login.html                 # Inicio de sesión
├── register.html              # Registro de nuevos usuarios
├── reset-password.html        # Solicitar restablecimiento de contraseña
├── set-new-password.html      # Establecer nueva contraseña con token
├── student-dashboard.html     # Panel del estudiante
├── evaluator-dashboard.html   # Panel del evaluador
├── admin-dashboard.html       # Panel del administrador
├── submit-work.html           # Formulario de envío de trabajos
├── encuesta-satisfaccion.html # Encuesta de satisfacción
├── download.html              # Página de descargas (placeholder)
├── css/
│   └── style.css              # Estilos principales del sistema
├── js/
│   ├── config.js              # URL del backend
│   ├── api-client.js          # Cliente API (217 líneas)
│   ├── app.js                 # Lógica común de aplicación (103 líneas)
│   └── evaluation-assignment.js # Lógica de asignación de evaluaciones (62 líneas)
├── service-worker.js          # Service Worker para PWA
└── manifest.json              # Manifiesto de PWA
```

---

## Flujo de navegación

```
                   ┌──────────────┐
                   │   index.html │
                   └──────┬───────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
       ┌──────────────┐      ┌──────────────┐
       │  login.html  │      │ register.html│
       └──────┬───────┘      └──────────────┘
              │
    ┌─────────┴─────────┬─────────────────┐
    ▼                   ▼                 ▼
┌──────────┐   ┌──────────────┐   ┌─────────────┐
│ student- │   │ evaluator-   │   │ admin-      │
│dashboard │   │ dashboard    │   │ dashboard   │
└────┬─────┘   └──────┬───────┘   └──────┬──────┘
     │                │                  │
     ▼                ▼                  ▼
┌──────────┐   ┌──────────────┐   ┌─────────────┐
│ submit-  │   │ Split-view   │   │ Bottom nav  │
│ work.html│   │ PDF + Rúbrica│   │ 3 pestañas  │
└──────────┘   └──────────────┘   └─────────────┘
```

---

## Paneles de usuario

### Panel del estudiante (`student-dashboard.html`)

- Barra superior con datos del usuario
- Botón "Subir trabajo" dinámico (controlado por toggle del admin en `localStorage.encuentroIQ_uploadsEnabled`)
- Lista de trabajos enviados y su estado
- Acceso a encuesta de satisfacción

### Panel del evaluador (`evaluator-dashboard.html`)

- **Split-view en desktop (≥992px):** Panel dividido con iframe del PDF a la izquierda (50%) y rúbrica de evaluación a la derecha (50%).
- **Modal en móvil:** Rúbrica en modal con fondo oscurecido.
- El PDF se carga automáticamente al abrir el modal de evaluación.
- Las URLs de Google Drive se convierten al formato `/preview` para embedding correcto.

### Panel del administrador (`admin-dashboard.html`)

Navegación por **bottom nav fija** con 3 pestañas:

| Pestaña | Contenido |
|---------|-----------|
| **Dashboard** | Toggle subida activa · Botón Asignar Fase 1 · Botón Dictaminar (N) · Tabla de seguimiento de evaluaciones con filtros · Botón "Ver evaluadores" por trabajo · Sección "Listos para Dictaminar" |
| **Horarios** | Asignar evaluadores Fase 2 · Caso de Emergencia · Enviar Agendas por correo · Tabla de horario general de ponencias |
| **Fase 2** | Reconocimientos por ciclo académico (Top 3 Oral + Top 3 Cartel) · Generación de constancias |

---

## Módulos JavaScript

### `config.js` (1 línea)

Contiene la constante `GOOGLE_SCRIPT_URL` con la URL del Web App de Apps Script. Es el único punto de configuración del backend.

### `api-client.js` (217 líneas)

Cliente HTTP que encapsula todas las llamadas al backend. Expone un objeto global `apiClient` con métodos:

| Método | Descripción |
|--------|-------------|
| `loginUser(email, password)` | Iniciar sesión |
| `registerUser(email, password, name, userType, adminCode, facultad)` | Registrar usuario |
| `getUserProfile(id)` | Obtener perfil local |
| `checkAuth()` | Verificar sesión local |
| `submitWork(workData, file, onProgress)` | Enviar trabajo con PDF (incluye upload progresivo) |
| `getStudentWorks()` | Trabajos del estudiante |
| `submitEvaluation(data)` | Enviar evaluación |
| `getEvaluators()` | Lista de evaluadores |
| `assignWork(workId, evaluatorId)` | Asignar trabajo |
| `assignAllPending()` | Asignación automática |
| `getWinners()` | Obtener ganadores |
| `generateCertificate(userId, type)` | Generar certificado |
| `forgotPassword(email)` | Solicitar recuperación |
| `resetPassword(token, newPassword)` | Restablecer contraseña |

**Funciones auxiliares:**
- `saveSession(user)` / `getSession()` / `logoutUser()` — Gestión de sesión en `localStorage`
- `toBase64(file)` — Convierte archivo a base64 para envío
- `postData(data)` — Envío POST al backend

### `app.js` (103 líneas)

Lógica común compartida entre páginas:

- `renderTopBar(user)` — Renderiza la barra superior con datos del usuario
- `renderSidebar(activeSection)` — Renderiza la navegación lateral
- `showToast(message, type)` — Muestra notificaciones toast
- `formatDate(dateStr)` — Formateo de fechas
- Redirección por tipo de usuario tras login

### `evaluation-assignment.js` (62 líneas)

Lógica específica para la asignación de evaluaciones:

- `renderEvaluationTable(assignments)` — Tabla de asignaciones
- `handleBulkAssign()` — Asignación masiva
- Filtros por estado y evaluador

---

## Estilos (CSS)

El archivo `css/style.css` contiene:

- **Variables CSS:** Paleta de colores UNAM, tipografía, sombras
- **Top bar:** Barra superior fija con logo institucional
- **Bottom nav (admin):** Navegación inferior fija con iconos SVG + labels + badge. Solo 3 items en desktop.
- **Hero banner:** Gradiente azul con texto dorado
- **Cards:** Componentes de tarjeta reutilizables
- **Stats grid:** Cuadrícula de indicadores numéricos
- **Rubric sliders:** Sliders para evaluación por criterio
- **Star ratings:** Estrellas interactivas para encuestas
- **File upload:** Área drag-and-drop para PDFs
- **Data tables:** Tablas responsivas
- **Upload toggle:** Switch para activar/desactivar subida de trabajos
- **Eval progress dots:** Puntos de progreso de evaluación (done/active/pending)
- **Avg score ring:** Anillo de puntaje promedio con colores semánticos
- **Split-view evaluador:** Layout dividido PDF+rúbrica en desktop
- **Mobile PWA:** Estilos para viewport `100dvh`, standalone detection, touch feedback, sección transitions
- **Formularios:** Inputs, botones, selects estilizados
- **Responsive:** Media queries para móvil, tablet y desktop

---

## Referencias

- [API Reference](09-api-reference.md)
- [Paleta y componentes visuales](12-paleta-componentes.md)
- [Guía de despliegue del frontend](../how-to/04-desplegar-frontend.md)
