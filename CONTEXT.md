# Contexto del Proyecto — EncuentroIQ

> Archivo de contexto para sesiones de desarrollo. Última actualización: 2026-07-11.

---

## 1. Qué es EncuentroIQ

PWA para el **9no Encuentro Estudiantil de Ingeniería Química (UNAM)**. Permite a alumnos subir trabajos académicos, evaluadores calificar con rúbricas, y administradores gestionar todo el ciclo de vida del evento.

**Stack:** HTML/CSS/JS vanilla + Bootstrap 5.1.3 (CDN) + Google Fonts (Roboto Slab + Roboto). Sin frameworks JS. Backend: Google Apps Script + Google Sheets. Hosting: GitHub Pages.

---

## 2. Convenciones del proyecto

- **Idioma:** Todo el UI es en español.
- **Branding:** UNAM — escudo, colores institucionales.
- **Design system:** `--primary: #003D79`, `--accent: #D59F0F`, `--radius: 30px`, `--radius-sm: 12px`.
- **Commits:** Formato `feat(design): descripción` con body en español con bullet points.
- **Push:** Siempre a `main`. Repo: `https://github.com/CongresoLabIQ/EncuentroIQ.git`
- **Skills instalados:** `progressive-web-app`, `design-taste-frontend` (en `.agents/skills/`). No push notifications.
- **PWA:** manifest.json + service-worker.js. Sin push notifications (descartado por el usuario).

---

## 3. Arquitectura de archivos clave

```
index.html                  # Landing page (mobile-app style)
login.html                  # Login con opción alumno/evaluador
register.html               # Registro con select de facultad
student-dashboard.html      # Panel del alumno — botón subir trabajo (dinámico)
evaluator-dashboard.html    # Split-view PDF+rúbrica (desktop), modal (mobile)
admin-dashboard.html        # 3 tabs: Dashboard, Horarios, Fase 2
submit-work.html            # Formulario de envío de trabajos
tutorial-estudiante.html    # Tutorial interactivo 9 pasos
tutorial-evaluador.html     # Tutorial interactivo 7 pasos
encuesta-satisfaccion.html  # Encuesta post-evento
css/style.css               # ~1460 líneas, todo el estilo del proyecto
js/api-client.js            # Capa API (fetch a Google Apps Script)
js/config.js                # URL del Google Apps Script
js/app.js                   # Utilidades generales
Code.gs                     # Backend completo en Google Apps Script
manifest.json               # PWA manifest
service-worker.js           # Cache-first SW
```

---

## 4. Estado actual de las funcionalidades

### ✅ Completado
- **Admin dashboard** reestructurado con 3 tabs (Dashboard, Horarios, Fase 2)
- **Upload toggle** funcional: admin activa/desactiva → localStorage → student-dashboard lee → muestra botón o badge
- **Botón "Subir trabajo"** dinámico en student-dashboard.html (outline accent)
- **Formulario de envío simplificado:** Facultad (select), Profesor (texto libre), sin dropdown dinámico
- **Backend submitWork** envía `facultad` directamente (sin lookup desde users)
- **Split-view evaluador** en desktop, modal en mobile
- **Hero del index** con texto sobre banner (position absolute), 260px mobile / 300px desktop
- **Tutorial guides** con breadcrumbs centrados, footer reestructurado (Anterior | dots | Siguiente)
- **PWA** con manifest, service worker, icons actualizados
- **Google Drive embed** con formato `/preview`
- **Documentación** actualizada (CHANGELOG v1.2.0, API reference, sheets schema, frontend architecture, tutorial)

### ⚠️ Conocimiento importante
- **localStorage `encuentroIQ_uploadsEnabled`:** `'1'` = activo, `'0'` = inactivo. Default: activo si es null.
- **localStorage `congreso_user`:** Sesión del usuario logueado (JSON con id, name, email, type, facultad).
- **Google Sheets `config` sheet:** `event_date` y `evaluator_code` se leen desde ahí.
- **submit-work.html** redirige a student-dashboard si uploads desactivados (seguridad).
- **Chrome DevTools mobile emulation** no es igual a un dispositivo real — siempre probar en celular físico.

---

## 5. CSS del landing (ml-* classes)

El index usa clases `ml-*` para el layout mobile-app:

- `.ml-hero` — Banner 260px (mobile) / 300px (desktop) con position relative
- `.ml-hero-bg` — Imagen de banner con opacity 0.18
- `.ml-hero-content` — Texto del hero con `position: absolute; bottom: 0` dentro del hero
- `.ml-tag` — Badge "9° Edición" con fondo accent inline-block
- `.ml-section-title` — Títulos de sección dentro de `.container`
- `.ml-resources` — Scroll horizontal de pills en mobile, grid en desktop (≥768px)
- `.ml-pill` — Cards de recursos clickeables
- `.ml-timeline` — Timeline vertical (mobile) / horizontal (desktop)
- `.ml-sticky-bar` — Bottom bar fija en mobile (oculta en desktop)
- **Desktop (≥768px):** Top bar, CTA hero y footer se ocultan con `d-none d-md-block`

---

## 6. Admin Dashboard — Estructura

3 tabs con bottom nav fija (iconos SVG):

| Tab | Contenido |
|-----|-----------|
| **Dashboard** | Stats · Toggle subida · Asignar Fase 1 · Dictaminar (N) · Tabla de evaluaciones con filtros · Botón "Ver evaluadores" · Listos para Dictaminar |
| **Horarios** | Asignar Fase 2 · Caso de Emergencia · Enviar Agendas · Tabla horario general |
| **Fase 2** | Top 3 Oral + Top 3 Cartel · Generar constancias |

Funciones JS clave:
- `toggleUploads()` — setea `localStorage.encuentroIQ_uploadsEnabled`
- `assignAllPendingWorks()` — asigna trabajos pendientes a 3 evaluadores
- `finalizeAllReadyWorks()` — dictamina trabajos con 3 evaluaciones completas
- `assignLiveJudges()` — asigna evaluadores Fase 2
- `generateCertificates()` — genera constancias en Google Slides

---

## 7. Backend (Code.gs) — Endpoints principales

| Action | Descripción |
|--------|-------------|
| `submitWork` | Subir trabajo con PDF (base64 → Google Drive) |
| `getStudentWorks` | Obtener trabajos de un alumno |
| `getWorks` | Obtener todos los trabajos (admin) |
| `assignWork` | Asignar trabajo a evaluador (con validación de facultad) |
| `submitEvaluation` | Enviar evaluación fase 1 |
| `finalizeWorks` | Dictaminar trabajos con 3+ evaluaciones |
| `checkAuth` | Verificar sesión |
| `register` | Registrar usuario |
| `getProfessorsBySemester` | Catálogo de profesores (aún existe pero no se usa en submit) |

**Cambio reciente:** `submitWork` ahora recibe `facultad` directamente del formulario (antes hacía lookup desde la hoja `users`). El campo `grupo` ya no se envía.

---

## 8. Google Sheets Schema (hojas relevantes)

### Hoja `Trabajos`
`id`, `short_id`, `student_id`, `title`, `abstract`, `semester`, `facultad`, `profesor_cargo`, `team_members`, `modality`, `file_url`, `file_id`, `status`, `submitted_at`

### Hoja `Users`
`id`, `name`, `email`, `facultad`, `type`, `password_hash`

### Hoja `Evaluaciones`
`id`, `work_id`, `evaluator_id`, `score`, `rubrica`, `status`, `completed_at`

### Hoja `config`
`event_date`, `evaluator_code`

---

## 9. Errores conocidos / areas de mejora

- La hoja `Profesores` y el endpoint `getProfessorsBySemester` aún existen en el backend pero ya no se usan desde el frontend (se eliminó el dropdown dinámico).
- El campo `grupo` en la hoja `Trabajos` puede quedar vacío si no se migran datos existentes.
- No hay validación server-side de que `facultad` sea uno de los 3 valores válidos.

---

## 10. Cómo probar localmente

1. Abrir `index.html` en navegador (sin servidor, funciona directo).
2. Login: usar credenciales registradas en la hoja `Users` de Google Sheets.
3. Admin: `admin-dashboard.html` (requiere `user_type: 'admin'`).
4. Toggle de subidas: activar/desactivar en admin → recargar student-dashboard para ver efecto.
5. Mobile: probar en dispositivo real, no solo Chrome DevTools (diferencias reales en viewport).
