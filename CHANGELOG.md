# Changelog

## [1.3.0] — 2026-07-13

### Added
- **Dark mode completo:** Toggle fijo (sol/luna) en esquina superior derecha. Persiste en localStorage (`encuentroIQ_theme`). Sobreescribe variables CSS `--primary` a `#4d9de0` y `--accent` a `#f0b830` para contraste en fondo oscuro. Overrides para Bootstrap `.table`, `.btn-outline-*`, `.form-*`, `.modal`, `.alert`, `.nav-tabs`, `.badge`, `.dropdown`, `.card`, `.text-*` utilities.
- **Página 404 personalizada:** `404.html` con icono SVG ilustrado, título, descripción y botón "Volver al Inicio".
- **Skip link (accesibilidad):** Enlace "Saltar al contenido principal" en todas las páginas. Visible al hacer Tab. Apunta a `<main id="mainContent">`.
- **Empty state mejorado (student-dashboard):** Icono SVG en círculo, título descriptivo, texto explicativo y botón CTA "Enviar mi primer trabajo" (solo si las subidas están activas).
- **Animaciones de entrada:** Clases `.animate-fadeUp` + `.animate-delay-1..4` para tarjetas de trabajo con animación escalonada.
- **Meta descriptions SEO:** `<meta name="description">` en las 13 páginas HTML del proyecto.
- **Toast accesible:** `role="status"` + `aria-live="polite"` en el contenedor `#toastContainer`. Los toasts ahora son anunciados por lectores de pantalla.

### Changed
- **Skeleton loading:** Ya existía en los 3 dashboards (student, evaluator, admin) — verificado consistente.
- **Manifest JSON:** Ya tenía iconos `icon-192.png` y `icon-512.png` correctos en `assets/` — sin cambios necesarios.
- **Lazy loading de imágenes:** N/A — no hay tags `<img>` en el proyecto (el banner usa CSS `background-image`).

### Fixed
- **Contraste dark mode mejorado:** `--primary` se sobreescribe a `#4d9de0` en dark mode (antes `#003D79` se perdía en fondo oscuro). Colores `text-success/danger/warning/info/muted` con `!important` y valores bright.
- **Tabla admin dashboard bordes blancos:** Overrides agresivos con `!important` en `--bs-table-bg`, `--bs-table-border-color`, `thead th`, `tbody tr/td`. El wrapper `.card.border-0` ahora tiene fondo dark.
- **Botón "Subir trabajo" invisible en dark mode:** `btn-outline-accent` ahora tiene `color: var(--accent)` bright con borde visible.
- **Toggle dark mode en index.html no funcionaba:** `index.html` ahora carga `app.js` que inicializa `initDarkMode()` (antes no lo cargaba, el botón estaba vacío sin funcionalidad).
- **SVG icono del toggle no visible:** Añadido `.theme-toggle svg { display: block }` para asegurar rendering del icono.

## [1.2.0] — 2026-07-11

### Added
- **Botón "Subir trabajo" en panel del estudiante:** Aparece dinámicamente según el toggle del admin. Si las subidas están desactivadas, muestra el badge "La recepción de trabajos terminó".
- **Bloqueo de acceso a `submit-work.html`:** Si las subidas están desactivadas, redirige al dashboard del estudiante.
- **Campo Facultad en formulario de envío:** Select con FES Cuautitlán, FES Zaragoza y Facultad de Química (reemplaza al campo Grupo).
- **Campo Profesor a cargo como texto libre:** Input de texto con placeholder de ejemplo (reemplaza al dropdown dinámico de profesores).

### Changed
- **Formulario de envío simplificado:** Se eliminó la lógica de dropdown dinámico de profesores (ya no consulta la hoja `Profesores` al cambiar semestre). El campo profesor es un input de texto libre.
- **Backend `submitWork`:** Envía `facultad` en lugar de `grupo`. Ya no hace lookup de facultad desde la hoja `users`; usa el valor enviado directamente por el estudiante.
- **Hero del index mobile:** Texto del hero con `position: absolute` sobre el banner (antes dependía de `margin-top` negativo que fallaba en dispositivos reales).
- **Altura del hero:** 260px en mobile (antes 220px) para evitar que el título se corte en resoluciones pequeñas.

### Fixed
- **CSS roto por `}` sobrante:** Un corchete de cierre extra en `.ml-hero-content` rompía los estilos del tag, título y subtítulo del hero.

## [1.1.0] — 2026-07-11

### Added
- **Split-view del evaluador:** Panel dividido PDF (50%) + rúbrica (50%) en desktop (≥992px); modal en móvil.
- **Bottom nav del administrador:** Navegación inferior fija con iconos SVG. Reemplaza el sidebar.
- **Dashboard unificado (admin):** Pendientes, Dictaminar y Asignaciones fusionados en una sola vista.
  - Toggle de subida activa + botón "Asignar Fase 1" + botón "Dictaminar (N)".
  - Tabla de seguimiento con filtro por estatus/modalidad/orden.
  - Botón "Ver evaluadores" por trabajo (modal con nombres, puntajes y estatus).
  - Sección "Listos para Dictaminar" integrada al final.
- **Fase 2 en Horarios:** Asignar evaluadores Fase 2, Caso de Emergencia y Enviar Agendas ahora en la pestaña Horarios.
- **Reconocimientos (Fase 2):** Pestaña dedicada solo para Top 3 ganadores y generación de constancias.
- **Mobile PWA nativo:** Viewport `100dvh`, `overscroll-behavior: contain`, detección de standalone, touch feedback, transiciones de sección, sin user-select en standalone.
- **Top bar + breadcrumb ocultos en móvil** (≤767px) para vista inmersiva.
- **Footer oculto en móvil** para maximizar espacio.
- **Upload toggle:** Switch persistente en `localStorage` (`encuentroIQ_uploadsEnabled`).
- **Google Drive embed fix:** `getEmbeddablePdfUrl()` convierte URLs de Drive al formato `/preview` para iframe.
- **Iconos PWA actualizados:** Todos los tamaños de apple-touch-icon, favicon e icon-192/512 regenerados.

### Changed
- **Bottom nav admin reducido a 3 items:** Dashboard, Horarios, Fase 2.
- **Sidebar admin eliminado** completamente (HTML, CSS, JS).
- **Secciones eliminadas:** `assignmentsSection`, `worksSection`, `readySection` (fusionadas en Dashboard).
- **Funciones JS eliminadas:** `renderAssignmentsList()`, `renderPendingList()`.
- **Tabla de evaluaciones** ahora incluye columna "Evaluadores" con botón "Ver evaluadores".
- **Horarios** ahora muestra primero "Fase 2: Evaluación Presencial" y luego la tabla del horario general.
- **CSS refinado:** Variables CSS limpias (sin duplicados), skeleton loading, badge de estatus con colores semánticos.

### Fixed
- Error `Cannot set properties of null (setting 'textContent')` al eliminar el sidebar (referencia a `readyBadge`).
- Iframe de Google Drive mostrando "You need access" — ahora usa formato `/preview`.

## [1.0.0] — 2026-07-06

### Added
- README con documentación completa del proyecto
- LICENSE (MIT)
- .gitignore
- .editorconfig
- CHANGELOG.md
- CONTRIBUTING.md
- CODE_OF_CONDUCT.md
- SECURITY.md
- GitHub Actions CI (lint + link check)
- Templates de Issues (bug report y feature request)
- Badges de estado en el README
