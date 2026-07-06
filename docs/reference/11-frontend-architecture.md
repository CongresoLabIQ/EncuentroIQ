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
│ submit-  │   │ Evaluación   │   │ Gestión     │
│ work.html│   │ en vivo      │   │ completa    │
└──────────┘   └──────────────┘   └─────────────┘
```

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
| `submitWork(workData, file, onProgress)` | Enviar trabajo con PDF |
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

El archivo `css/style.css` (~778 líneas) contiene:

- **Variables CSS:** Paleta de colores UNAM, tipografía, sombras
- **Top bar:** Barra superior fija con logo institucional
- **Sidebar:** Navegación lateral para paneles
- **Hero banner:** Gradiente azul con texto dorado
- **Cards:** Componentes de tarjeta reutilizables
- **Stats grid:** Cuadrícula de indicadores numéricos
- **Rubric sliders:** Sliders para evaluación por criterio
- **Star ratings:** Estrellas interactivas para encuestas
- **File upload:** Área drag-and-drop para PDFs
- **Data tables:** Tablas responsivas
- **Formularios:** Inputs, botones, selects estilizados
- **Responsive:** Media queries para móvil y tablet

---

## Referencias

- [API Reference](09-api-reference.md)
- [Paleta y componentes visuales](12-paleta-componentes.md)
- [Guía de despliegue del frontend](../how-to/04-desplegar-frontend.md)
