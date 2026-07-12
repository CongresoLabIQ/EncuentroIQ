# Changelog

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
