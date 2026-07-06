# EncuentroIQ — Sistema de Gestión y Evaluación

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/congresolabiq/EncuentroIQ/actions/workflows/ci.yml/badge.svg)](https://github.com/congresolabiq/EncuentroIQ/actions/workflows/ci.yml)
[![PWA](https://img.shields.io/badge/PWA-ready-5C0D34.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![GitHub last commit](https://img.shields.io/github/last-commit/congresolabiq/EncuentroIQ)](https://github.com/congresolabiq/EncuentroIQ/commits/main)
[![GitHub release](https://img.shields.io/github/v/release/congresolabiq/EncuentroIQ)](https://github.com/congresolabiq/EncuentroIQ/releases)

</div>

Plataforma web para el **Encuentro Estudiantil de Ingeniería Química**, evento académico que reúne a tres entidades de la UNAM: **Facultad de Química**, **FES Cuautitlán** y **FES Zaragoza**. Permite la publicación, evaluación y administración de trabajos académicos (modalidad oral y cartel) en un entorno tipo congreso.

---

## Arquitectura

```
┌─────────────────────────────────┐
│   Frontend (HTML/CSS/JS)        │
│   GitHub Pages / hosting estático│
│         │                       │
│         ▼ POST/GET              │
│   Google Apps Script (Code.gs)  │
│   Web App — doPost() / doGet()  │
│         │                       │
│         ▼                       │
│   Google Sheets (base de datos) │
│   Google Drive (archivos PDF)   │
│   Google Docs (certificados)    │
└─────────────────────────────────┘
```

### Frontend
- HTML semántico + Bootstrap 5.1 + CSS personalizado
- JavaScript vanilla (sin frameworks) modular en `js/`
- Progressive Web App con service worker para caché offline
- Diseño responsivo con tema institucional UNAM

### Backend
- **Google Apps Script** (`Code.gs`) desplegado como Web App
- Almacenamiento en Google Sheets (usuarios, trabajos, evaluaciones, horarios)
- Archivos PDF subidos a Google Drive codificados en base64
- Generación de certificados desde plantilla Google Docs
- Autenticación por sesión con tokens de acceso

---

## Stack técnico

| Componente | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Framework CSS | Bootstrap 5.1 |
| Tipografía | Roboto + Roboto Slab (Google Fonts) |
| Backend | Google Apps Script (GAS) |
| Base de datos | Google Sheets |
| Almacenamiento | Google Drive |
| Plantillas | Google Docs (certificados) |
| PWA | Service Worker + Manifest |
| Iconos | SVGs inline |
| Hosting | GitHub Pages / hosting estático |

---

## Páginas del sitio

| Página | Archivo | Propósito | Autenticación |
|---|---|---|---|
| Inicio | `index.html` | Landing page con banner, CTA, guía de participación | No |
| Iniciar sesión | `login.html` | Formulario de inicio de sesión | No |
| Registro | `register.html` | Registro de nuevos usuarios | No |
| Recuperar contraseña | `reset-password.html` | Solicitar restablecimiento de contraseña | No |
| Nueva contraseña | `set-new-password.html` | Establecer nueva contraseña con token | No |
| Panel estudiante | `student-dashboard.html` | Ver trabajos enviados y retroalimentación | Sí (estudiante) |
| Panel evaluador | `evaluator-dashboard.html` | Evaluar trabajos (fase 1 y 2), agenda, ganadores | Sí (evaluador) |
| Panel admin | `admin-dashboard.html` | Administración completa del evento | Sí (admin) |
| Enviar trabajo | `submit-work.html` | Formulario de envío de trabajos | Sí (estudiante) |
| Encuesta | `encuesta-satisfaccion.html` | Encuesta de satisfacción del evento | No |
| Descargas | `download.html` | Página placeholder para descargas | No |

---

## Roles de usuario

### Estudiante
- Registrar cuenta y enviar trabajos (título, resumen, modalidad, PDF)
- Visualizar estado de sus trabajos y retroalimentación del comité
- Participar en modalidad **oral** o **cartel**

### Evaluador
- Evaluar trabajos en **fase 1** (revisión de resúmenes) con rúbrica (0–100)
- Evaluar en **fase 2** (presentaciones orales/cartel) con rúbricas específicas
- Consultar agenda y asignaciones en vivo
- Visualizar resultados y ganadores

### Administrador
- Gestionar usuarios, trabajos y evaluadores
- Asignar trabajos a evaluadores (manual o aleatorio)
- Configurar horarios y sedes
- Publicar resultados y ganadores
- Generar certificados
- Ver encuestas de satisfacción
- Acceso a panel de configuración del evento

---

## API Backend (Google Apps Script)

El backend expone un solo endpoint (`GOOGLE_SCRIPT_URL`) que recibe peticiones POST con un objeto JSON con la estructura `{ action, ...datos }`.

### Acciones disponibles

| Action | Descripción | Parámetros |
|---|---|---|
| `register` | Registrar usuario | `nombre, facultad, email, tipo, password` |
| `login` | Iniciar sesión | `email, password` |
| `checkAuth` | Validar sesión | `token` |
| `submitWork` | Enviar trabajo | `token, titulo, semestre, grupo, resumen, ...` |
| `getStudentWorks` | Trabajos del estudiante | `token` |
| `getAllWorks` | Todos los trabajos (admin) | `token` |
| `submitEvaluation` | Evaluar trabajo | `token, workId, score, rubrica, ...` |
| `updateWorkStatus` | Cambiar estado de trabajo | `token, workId, status` |
| `finalizeAndNotify` | Finalizar evaluaciones | `token, workId` |
| `getEvaluators` | Lista de evaluadores | `token` |
| `assignWork` | Asignar trabajo a evaluador | `token, workId, evaluatorId` |
| `assignAllPending` | Asignar todos los pendientes | `token` |
| `assignLiveWorks` | Asignaciones en vivo | `token, phase` |
| `getLiveAssignments` | Obtener asignaciones en vivo | `token, evaluatorId` |
| `submitLiveEvaluation` | Evaluación en vivo | `token, assignmentId, score` |
| `getWinners` | Obtener ganadores | `token` |
| `generateCertificate` | Generar certificado | `token, userId, type` |
| `getProfessors` | Catálogo de profesores | `token` |
| `forgotPassword` | Recuperar contraseña | `email` |
| `resetPassword` | Restablecer contraseña | `token, newPassword` |

### Hojas de Google Sheets

El backend opera sobre las siguientes hojas dentro del libro de Google Sheets:

| Hoja | Propósito |
|---|---|
| `Usuarios` | Registro de usuarios con datos, rol y token de sesión |
| `Trabajos` | Trabajos enviados con metadatos y ruta de archivo |
| `Evaluaciones` | Evaluaciones realizadas por los evaluadores |
| `Asignaciones` | Asignaciones de trabajos a evaluadores |
| `Horarios` | Agenda del evento |
| `Ganadores` | Resultados y ganadores por categoría |
| `Encuestas` | Respuestas de encuestas de satisfacción |
| `Configuracion` | Configuración general del evento |
| `Profesores` | Catálogo de profesores responsables |
| `Certificados` | Registro de certificados generados |

---

## Tema Visual

### Paleta de colores (variables CSS)

```css
--primary:       #003D79   /* Azul UNAM principal */
--primary-dark:  #002A55   /* Azul UNAM oscuro */
--primary-mid:   #004D99   /* Azul UNAM medio */
--accent:        #D59F0F   /* Oro UNAM */
--accent-light:  #E8B830   /* Oro UNAM claro */
--accent-bg:     rgba(213, 159, 15, 0.08)  /* Fondo dorado tenue */
```

### Tipografía
- **Títulos:** Roboto Slab (400, 600, 700, 800)
- **Cuerpo:** Roboto (300, 400, 500, 600, 700)

### Componentes principales
- **Top bar:** Información del evento con navegación de usuario
- **Sidebar:** Navegación secundaria en paneles de admin
- **Hero banner:** Gradient azul con título dorado, escudo UNAM
- **Cards:** Contenido en tarjetas con bordes redondeados
- **Stats grid:** Cuadrícula de indicadores (dashboard)
- **Rubric sliders:** Evaluación con sliders por criterio
- **Star ratings:** Valoración visual con estrellas (encuestas)
- **File upload:** Área de arrastrar y soltar para PDFs
- **Data tables:** Tablas de datos responsivas

---

---

## Progressive Web App (PWA)

- **Service Worker:** `service-worker.js` — cachea todos los assets estáticos en la instalación
- **Manifiesto:** `manifest.json` — nombre "Encuentro IQ - Sistema de Evaluación", tema `#003D79`
- **Iconos:** 22 archivos en `assets/` para todas las plataformas (Apple, Microsoft, Android)
- **Estrategia de caché:** cache-first para assets, cache-then-network para API, stale-while-revalidate para navegación

---

## Despliegue

### Frontend
1. Subir todos los archivos a GitHub Pages, Netlify o cualquier hosting estático
2. Configurar `js/config.js` con la URL del Web App de Apps Script
3. No requiere build step — es HTML/CSS/JS vanilla

### Backend (Google Apps Script)
1. Abrir `Code.gs` en el editor de Apps Script
2. Configurar el libro de Google Sheets como base de datos
3. Desplegar como Web App (ejecutándose como usuario que accede, acceso cualquiera)
4. Copiar la URL desplegada a `js/config.js`

---

## Archivos del proyecto

```
EncuentroIQ/
├── index.html                 # Landing page
├── login.html                 # Inicio de sesión
├── register.html              # Registro de usuarios
├── student-dashboard.html     # Panel de estudiante
├── evaluator-dashboard.html   # Panel de evaluador
├── admin-dashboard.html       # Panel de administrador
├── submit-work.html           # Envío de trabajos
├── encuesta-satisfaccion.html # Encuesta de satisfacción
├── reset-password.html        # Recuperar contraseña
├── set-new-password.html      # Nueva contraseña
├── download.html              # Descargas (placeholder)
├── css/
│   └── style.css              # Estilos principales (778 líneas)
├── js/
│   ├── config.js              # URL del backend
│   ├── api-client.js          # Cliente API (217 líneas)
│   ├── app.js                 # Lógica de aplicación (103 líneas)
│   └── evaluation-assignment.js # Asignación de evaluaciones (62 líneas)
├── Code.gs                    # Backend Google Apps Script (613 líneas)
├── service-worker.js          # Service Worker PWA
├── manifest.json              # Manifiesto PWA
├── assets/                    # Iconos PWA (22 archivos)
├── banner.jpg                 # Banner principal
├── bannerprev.jpg             # Vista previa del banner
├── ...
└── README.md                  # Este archivo
```
