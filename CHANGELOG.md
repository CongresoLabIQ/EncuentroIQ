# Changelog

## [1.12.1] — 2026-10-29

### Fixed
- **Constancia individual de ganadores:** el botón **Constancia** de las tarjetas de Fase 2 generaba un reconocimiento con el texto **"Participación"** en el lugar, aunque el trabajo fuera 1.º, 2.º o 3.er lugar. Ahora usa el lugar real (`1er/2do/3er Lugar Ponencia Oral` o `1er/2do/3er Lugar Cartel — <facultad>`) y nombra el archivo con ese lugar. Solo los trabajos fuera del Top 3 conservan "Participación".
- **Integrantes en las constancias:** se muestran todos los integrantes registrados en el trabajo y, si el autor que subió el trabajo no viene en `team_members`, se agrega para no omitirlo (sin duplicarlo por mayúsculas/acentos). Las tarjetas de ganadores del admin muestran la misma lista de integrantes que aparecerá en la constancia.
- **Valores vacíos:** la generación tolera títulos, integrantes o asesores vacíos sin escribir "undefined" en la plantilla.
- **Pruebas:** `premiacion.test.js` valida que la constancia de un ganador lleve el lugar correcto y `fase2.test.js` cubre `formatearIntegrantes` (830 aserciones en total).

## [1.12.0] — 2026-10-27

### Added
- **Asignación de Fase 2 por facultad:** el panel de admin ahora tiene tres botones independientes —**FES Zaragoza (FZ)**, **FES Cuautitlán (FC)** y **FQ**— que asignan únicamente a los evaluadores de esa facultad. Se conserva el enlace **"Asignar todas las facultades"**.
- **Envío de agendas por facultad:** el botón único "Enviar Agendas a todos los Jueces" se reemplazó por tres botones —**FES Zaragoza**, **FES Cuautitlán** y **FQ**— más el enlace **"Enviar a todos los jueces"**. `notifyJudgesAgenda` acepta `facultad` (`FQ`/`FC`/`FZ`) y ahora es admin-only; responde cuántas agendas envió, cuántos evaluadores no tenían asignaciones y los errores.
- **Fe de erratas del lugar de las ponencias:** nuevo endpoint `notifyAgendaCorrection` (admin) y tarjeta en Fase 2 con botones **FES Zaragoza**, **FES Cuautitlán**, **FQ** y "Enviar a todos los jueces". Aclara que las ponencias con horario se evalúan en el **Auditorio Principal** y los carteles en el **Área de Carteles**; solo se envía a evaluadores con asignaciones.
- **`assignLiveWorks` acepta `facultad`:** parámetro opcional (`FQ`/`FC`/`FZ`) para asignar solo los carteles que le tocan por rotación y su evaluador en cada ponencia. Es idempotente por facultad: repetir un botón no duplica ni genera asignaciones extra.
- **Recordatorio del evento a participantes:** nuevo endpoint `notifyEventReminder` (admin) y botón **"Enviar recordatorio"** en la pestaña Fase 2. Envía un correo por cada trabajo aceptado (ponencia oral o cartel) con el título, la modalidad, la fecha, la sede, el horario de registro y el enlace a la página del evento. Para ponencias orales añade el aviso de subir la presentación antes del plazo. Omite trabajos no seleccionados y alumnos sin correo.
- **Presentaciones orales de Fase 2:** nueva sección **"Presentación oral (Fase 2)"** en el panel del alumno, visible solo para trabajos `accepted_oral`, con estado de subida, botones para subir/reemplazar/ver y el plazo límite. El plazo por defecto es el **28 de octubre de 2026 a las 23:00 hrs (CDMX)** y se puede editar desde una nueva tarjeta del admin (se guarda en `config.presentation_deadline`).
- **Hoja dedicada `oral_presentations`:** las presentaciones ya no se guardan en `works`; se almacenan en su propia hoja (`id`, `work_id`, `student_id`, `file_name`, `mime_type`, `file_size`, `file_id`, `file_url`, `uploaded_at`, `updated_at`), con una fila por ponencia y actualización al reemplazar. `getStudentWorks` combina los datos para el dashboard.
- **Pruebas:** `fase2.test.js` valida la asignación por facultad (21 asignaciones por botón, 63 en total, cobertura y rotación correctas, idempotencia y facultad inválida); `recordatorio.test.js` valida permisos, envío por trabajo, modalidades, aviso de presentación oral, omisiones y escapado de HTML; `presentaciones.test.js` valida subida, plazo, reemplazo, validaciones y la hoja dedicada; `agendas.test.js` valida el envío de agendas por facultad, la fe de erratas, permisos, lugar correcto de las ponencias y validaciones.

### Changed
- El backend ya no bloquea la asignación de una ponencia completa cuando otra facultad ya tiene un evaluador: valida por par trabajo/facultad, no por trabajo.
- **Agenda de evaluadores:** el lugar de cada trabajo se deriva de su estado (`accepted_oral` → **Auditorio Principal**, `accepted_poster` → **Área de Carteles**), evitando que una ponencia muestre “Carteles” cuando el campo `auditorio` está vacío o desactualizado.
- **Service worker:** caché actualizado a `encuentroiq-v20` para servir el nuevo panel.

## [1.11.0] — 2026-10-27

### Added
- **Recursos en el index:** dos PDFs nuevos consultables en "Recursos y Plantillas":
  - **Programa General** (`Programa general EEIQ-2026.pdf`) — ahora es el programa que abre el pop-up.
  - **Conferencia Diego Angón** (`Presentación Diego Angon EEIQ-2026.pdf`).
- El programa anterior (`Programa gral EEIQ-2026.pdf`) se renombró en la UI a **Programa sintético**.

### Changed
- **Service worker:** caché actualizado a `encuentroiq-v15` e incluye los PDFs nuevos.

## [1.10.0] — 2026-10-27

### Added
- **PDF de cada reconocimiento:** `generarPremiacionMasiva` ahora genera, además de los editables (Slides), un **PDF individual** por ganador (`PDF: …`) en la carpeta de constancias.
- **PDF global:** se construye una presentación con las 12 diapositivas y se exporta a un único PDF (`GLOBAL: Reconocimientos Encuentro IQ - <fecha>.pdf`).
- **Envío automático:** el PDF global se envía por correo a `iq.cterminal@zaragoza.unam.mx` (`GLOBAL_PDF_RECIPIENT`) con `MailApp.sendEmail` (adjunto). El envío falla de forma tolerante (solo registra el error, no interrumpe la generación).
- **Botón en el panel:** nuevo botón **"Generar premiación masiva"** en la pestaña **Fase 2** del `admin-dashboard` que llama al nuevo endpoint `generatePremiacionMasiva` (admin-only) y muestra el resultado en un toast.
- **Pruebas:** `premiacion.test.js` y `simulacion.js` validan 12 editables + 12 PDF individuales + 1 PDF global, la duplicación de diapositivas (Slides `batchUpdate`), el correo al terminal y el endpoint admin (491 aserciones).

### Changed
- `crearSlideEditable` ahora delega en `crearSlideFile` (que devuelve el `File`) para poder exportar el PDF sin re-abrir el archivo.
- Sandbox de pruebas: `Drive`/`Slides` falsos ahora soportan `getAs('application/pdf')`, `folder.createFile`, `getSlides()` y el servicio avanzado `Slides.Presentations.batchUpdate`.

### Requerido
- Habilitar el **servicio avanzado "Google Slides API"** en el editor de Apps Script (Servicios → Google Slides API) para que `generarPremiacionMasiva` pueda construir el PDF global.

## [1.9.0] — 2026-10-08

### Added
- **Importación de FES Zaragoza:** nuevo endpoint `importFesZaragoza` (admin) que lee la hoja de datos de la otra plataforma (`github.com/congresolabiq/sistema`) vía URL de Google Sheets publicada como CSV. Crea/actualiza las cuentas de alumno (conservando el hash de contraseña de origen) y sus trabajos, respetando el `status` de la hoja. Idempotente (omite trabajos ya importados) y con parser CSV propio (comas/comillas).
- **`assignSchedules` (admin):** asigna horarios a todos los trabajos aceptados. Ponencias: bloques de 20 min desde las 10:00 en **Auditorio Principal**, conservando horarios ya asignados y evitando empalmes. Carteles: `Sesión Carteles` en `Área de Carteles`.
- **UI en el tab Horarios:** tarjeta "Importar trabajos de FES Zaragoza" (URLs de trabajos y usuarios) y tarjeta "Asignar Horarios (auditorio único)".
- **Pruebas `tests/import-schedule.test.js`:** auditorio único (dictamen + asignación), respeto de horarios previos, permisos de admin e importación idempotente (418 aserciones en total).

### Changed
- **Un solo auditorio:** `batchFinalize` ya no reparte las ponencias entre "Auditorio Principal" y "UMIEZ"; todas van al **Auditorio Principal** en bloques consecutivos de 20 min desde las 10:00.
- **Vistas del admin:** la tabla de Horario General y el Mapa de Salones muestran una sola columna/sala (Auditorio Principal).
- **Sandbox de pruebas:** `SpreadsheetApp.flush()` disponible en el harness.
- **Service worker:** caché actualizado a `encuentroiq-v12`.

## [1.8.0] — 2026-09-11

### Removed
- **Empaquetado APK / Capacitor:** se elimina todo lo relacionado con la app nativa (no es necesaria).
  - Archivos/carpetas: `capacitor.config.ts`, `android/`, `build/` (`build-apk.bat`, `exclusions.txt`) y `scripts/build-www.js`.
  - `package.json`: sin dependencias de Capacitor/TypeScript ni scripts `build:www`/`sync`/`open`; se conservan `test` y `simular`.
  - `.gitignore`: se quitan las entradas de `www/` y `capacitor-cordova-android-plugins/`.
  - `CONTEXT.md`: se elimina la sección "Generación de APK".
  - `admin-dashboard.html`: se quita el fallback de vibración vía Capacitor Haptics.
- **Service worker:** caché actualizado a `encuentroiq-v10`.

## [1.7.0] — 2026-09-11

### Added
- **Nuevas rúbricas de Fase 2 (cartel y ponencia):** formulario del evaluador re-hecho con **un control por sección** (Escala 0–100). Cartel y ponencia tienen 9 secciones cada una; el puntaje por sección es su peso ×10.
  - Cartel: Estructura (10), Diseño (20), Comunicación escrita (5), Expresión oral (10), Lenguaje corporal (5), Trabajo en equipo (10), Dominio (20), Defensa de preguntas (15), Innovación (5).
  - Ponencia: Estructura (10), Diseño (20), Apoyo visual (10), Expresión oral (5), Lenguaje corporal (5), Trabajo en equipo (5), Dominio (30), Defensa (10), Innovación (5).
- **Prueba `tests/rubricas.test.js`:** valida que cada rúbrica sume 100 y que los sub-criterios cuadren con el máximo de su sección (302 aserciones en total).
- **Recurso "Convocatoria":** nuevo acceso directo a la convocatoria oficial (PDF en Google Drive) en la sección "Recursos y Plantillas" del index.

### Changed
- **`submitLiveEvaluation`:** guarda `rubrica` (JSON con el puntaje por sección) y `total_score`; se dejan de usar las columnas `s1..s8`/`c1..c10`.
- **Se elimina el checklist "Material de Apoyo"** del modal en vivo; la sección **Estructura** de la nueva rúbrica lo cubre.
- **Tutorial del evaluador:** la práctica de Fase 2 usa las nuevas secciones (0–100).
- **Service worker:** caché actualizado a `encuentroiq-v8`.

## [1.6.0] — 2026-09-11

### Added
- **Nueva lógica de asignación de carteles (Fase 2):** Cada facultad aporta hasta 5 evaluadores (los de menor carga) que evalúan los carteles de otra facultad con rotación fija `FQ → FC → FZ → FQ`. Se asigna **1 evaluador por cartel**, repartido de forma balanceada (15 carteles / 5 evaluadores = 3 cada uno).
- **Fallback de evaluadores:** Si una facultad no tiene 5 evaluadores, se completan con evaluadores de otras facultades, evitando siempre la facultad del cartel.
- **Nueva lógica de ponencias (Fase 2):** Cada ponencia recibe **3 evaluadores, uno por cada facultad**. Se permite la misma facultad del trabajo; solo se evita al asesor del trabajo.
- **Ganadores por modalidad:** Ponencia = top 3 **general** (todo el pool). Cartel = top 3 **por facultad/entidad**. El admin muestra una tarjeta de carteles por facultad y `generarPremiacionMasiva` produce 12 reconocimientos (3 orales + 3 por facultad).
- **Resumen de asignación:** `assignLiveWorks` devuelve `resumen: { carteles, orales, sinEvaluador }` y el admin lo muestra al terminar.
- **Suite de pruebas silenciosa:** `npm test` (o `node tests/run.js`) carga el `Code.gs` real en un sandbox en memoria —sin red, sin Google— y valida Fase 2, ganadores y el flujo completo end-to-end (270 aserciones). Incluye `tests/Code.pruebas.gs` para pruebas dirigidas de notificaciones y constancias en un clon (cuentas `TestE1`, `MiguelF`, `admin-001`).
- **Simulación del workflow:** `npm run simular` (o `node tests/simulacion.js`) encadena 60 trabajos → asignación Fase 1 → evaluaciones → dictamen → Fase 2 → evaluaciones en vivo → ganadores, con reporte en consola y verificaciones.
- **`crearSlideEditable` acepta carpeta opcional** (`folderId`) para generar constancias en una carpeta de prueba.
- **`generateCertificates` usa los asesores** (`getAsesores`) del trabajo en lugar de `profesor_cargo` directo.
- **Constancias con varios asesores:** `formatearAsesores()` coloca cada asesor en su propia línea al reemplazar `{{PROFESOR}}`; si no hay asesor usa "No asignado".

### Changed
- **`assignLiveWorks` reescrito:** Se elimina el reparto aleatorio de 3 evaluadores por cartel y el split de ponencias por auditorio (`p1`/`p2`). Los grupos por facultad se calculan por carga y se reutilizan entre carteles y ponencias.
- **Conflicto según modalidad:** `assignManualLive` y `reassignLiveEvaluator` ahora solo aplican la restricción de facultad a carteles; en ponencias se permite la misma facultad y solo se bloquea si el evaluador es asesor del trabajo.
- **Auto-evaluación por asesores:** El helper `esAutoEvaluacion` compara contra los asesores del trabajo (`getAsesores`, con respaldo a `profesor_cargo`).
- **Textos de Fase 2 en el admin:** Se actualizan la descripción del bloque y el `confirm`/toast de `assignLiveJudges()`.
- **Service worker:** Caché actualizado a `encuentroiq-v7`.

## [1.5.0] — 2026-09-03

### Added
- **Dashboard admin en vivo:** `getLiveAdminDashboard` retorna en tiempo real la actividad de evaluadores, solicitudes de ayuda pendientes y mapa de salones. El tab Dashboard hace polling cada 20s.
- **Solicitudes de ayuda:** Botón flotante "Ayuda" en el evaluador con modal para enviar mensajes al admin. Sección dedicada en el admin con badge de pendientes, botones "Atendida"/"En camino" y sonido de alerta al recibir nuevas solicitudes.
- **Actividad de evaluadores:** Tabla con badges semánticos (Activo / Evaluando / Ausente / Sin actividad / Terminó), tiempo relativo de última actividad y acciones contextuales (Marcar ausente / Reactivar / Sustituir).
- **Mapa de salones en vivo:** Grid de salones (Auditorio Principal + UMIEZ) con tarjetas de ponencias, estado de evaluación y nombre de evaluadores asignados.
- **Sustitución de evaluador ausente:** Modal de reasignación con selección de trabajo y evaluador sustituto. Validación de conflicto de facultad y auto-evaluación en el backend.
- **Validación server-side de permisos:** `assertAdmin()` y `assertUser()` en `Code.gs` validan contra la hoja `users` en cada endpoint sensible (nunca confiar en localStorage).
- **Registro de actividad del evaluador:** `registerActivity` actualiza `live_evaluator_status` con `last_activity`. Estados manuales (`absent`/`finished`) no se sobreescriben por automatismo.
- **Bitácora de reasignación:** Hoja `reassign_log` registra cada sustitución con motivo y timestamp.
- **Generación de APK (Capacitor):** Configuración de Capacitor (`capacitor.config.ts`), `package.json` con scripts `build:www`/`sync`/`open` y script de build que copia el sitio estático a `www/`.

### Changed
- **Service worker:** Nombre de caché actualizado de `labiq-v2` a `encuentroiq-v3`. Assets expandidos con páginas faltantes (`reset-password.html`, `set-new-password.html`, `tutorial-estudiante.html`, `tutorial-evaluador.html`, `404.html`), `favicon.png` y Google Fonts.
- **Manifest PWA mejorado:** `short_name` a "EncuentroIQ", `orientation` a "any", categorías `education`/`productivity`, `lang: "es"`, `scope: "./"` y shortcuts a Panel Admin y Panel Evaluador.

### Fixed
- **Logout del admin no detenía el polling:** `handleLogout()` ahora llama `stopLivePolling()` para evitar requests al cerrar sesión.

## [1.4.0] — 2026-08-07

### Added
- **Nueva regla de dictamen:** Se aceptan los 17 mejores trabajos por facultad (sin umbral de calificación). Los 2 mejores de cada facultad van a ponencia y el resto a cartel (45 carteles + 6 ponencias en dos auditorios).
- **Etapa académica en el formulario de envío:** Radio buttons con "Proyecto escolar (estudiantes)", "Proyecto de servicio social", "Proyecto de tesis" y "Proyecto de investigación". Si se elige proyecto escolar, aparece un desplegable de semestre (1er a 9no).
- **Asesor o Asesores (máx 3):** El campo "Profesor a cargo" se convierte en una lista tipo chips de hasta 3 asesores.
- **Toggle de modo oscuro flotante (dashboards):** En student, evaluator y admin flota junto al botón de cerrar sesión (mobile y desktop), en lugar de estar dentro de la top bar.
- **Banners por dispositivo:** El hero usa `banner eiqm.png` en móvil y `banner eiq.png` en desktop.
- **Backend `assignManualLive`:** Endpoint de asignación manual de emergencia Fase 2 (antes solo existía en el frontend).

### Changed
- **Regla de dictamen `batchFinalize`:** Se elimina el rechazo por promedio y el descalificante por `cumple_extension = no`; ahora la selección es por ranking (top 17 por facultad, top 2 a ponencia).
- **Distribución de ponencias:** Las 6 ponencias se reparten 3 y 3 entre Auditorio Principal y UMIEZ (una por facultad en cada sala), con horarios de 20 min desde las 10:00.
- **Fecha del evento:** 23 de octubre de 2026 en el hero y en el fallback del backend (`obtenerFechaEvento`).
- **Orden de facultades en el hero:** FES Zaragoza primero (sede), luego Facultad de Química y FES Cuautitlán.
- **Límite de integrantes:** De 10 a máximo 5 en el formulario de envío.
- **Reorden del formulario de envío:** Título → Facultad → Etapa académica → Asesores.
- **URL del Formato de Resumen:** Actualizada al nuevo documento de Google Drive (export directo a DOCX).
- **Correo de contacto:** `contacto.encuentroestiq@gmail.com` en los 13 footers.
- **Persistencia completa en Fase 2:** `submitLiveEvaluation` guarda los 8 sliders, los 10 checklist y el comentario en `live_evaluations`.

### Fixed
- **Body del admin sin `has-bottom-nav`:** La clase faltaba en el body real (solo existía en el string de la ventana de impresión); se agregó, corrigiendo el padding inferior y la posición del botón flotante sobre el bottom nav.
- **Auto-evaluación con lista de asesores:** El chequeo "mismo profesor" ahora compara contra cada asesor separado por coma (helper `esAutoEvaluacion`) en asignaciones Fase 1 y Fase 2.
- **Conflicto de facultad en `assignManualLive`:** La asignación manual de emergencia Fase 2 ahora también bloquea evaluadores de la misma facultad que el autor.
- **`w.grupo` → `w.facultad`:** En el modal de caso de emergencia del admin.
- **Hack off-screen de la top bar en móvil:** Se revierte a `display:none` (ya no se necesita con el toggle flotante).

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
