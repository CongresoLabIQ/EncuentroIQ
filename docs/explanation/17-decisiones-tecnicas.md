# Decisiones técnicas

**Audiencia:** Desarrolladores  
**Propósito:** Explicar las decisiones técnicas detrás del diseño e implementación del sistema, y el contexto en el que se tomaron.

---

## ¿Por qué JavaScript vanilla (sin frameworks)?

**Decisión:** Usar JavaScript puro sin React, Vue, Angular ni otros frameworks.

**Contexto:** El sistema fue desarrollado por un equipo académico con conocimientos variados de desarrollo web. No todos los contribuidores tienen experiencia con frameworks modernos.

**Razones:**
- **Curva de aprendizaje baja:** Cualquier persona con conocimientos básicos de JS puede contribuir.
- **Cero dependencias:** No requiere `npm install`, build steps, ni configuración de tooling.
- **Despliegue trivial:** Subir archivos HTML/CSS/JS a cualquier hosting estático funciona inmediatamente.
- **Suficiente para el alcance:** La aplicación tiene ~10 páginas; un SPA con framework sería sobredimensionado.

**Consecuencia:** El código es más verboso que con un framework. No hay enrutamiento declarativo ni reactividad; las actualizaciones del DOM son manuales.

---

## ¿Por qué Bootstrap 5.1?

**Decisión:** Usar Bootstrap como framework CSS.

**Razones:**
- **Sistema de grillas:** Layout responsivo sin escribir CSS de media queries manualmente.
- **Componentes listos:** Modales, toasts, tabs, tablas responsivas sin implementación propia.
- **Documentación extensa:** Bootstrap es ampliamente conocido en la comunidad académica.
- **Versión 5.1:** No depende de jQuery (a diferencia de Bootstrap 4).

**Alternativa considerada:** Tailwind CSS. Se descartó porque requiere configuración y conocimiento de clases utilitarias que no todo el equipo domina.

---

## ¿Por qué Google Apps Script como backend?

**Decisión:** Usar Google Apps Script (GAS) en lugar de un backend tradicional como Node.js, Python o PHP.

**Razones:**
- **Costo cero:** GAS es parte de Google Workspace, sin costo adicional.
- **Integración nativa:** Acceso directo a Google Sheets, Drive y Docs sin API keys ni OAuth complejo.
- **Despliegue inmediato:** Escribir el código y desplegar como Web App en segundos.
- **Mantenimiento cero:** Google administra los servidores, actualizaciones y parches de seguridad.
- **Familiaridad:** El equipo tiene experiencia con Google Sheets y scripts de automatización.

**Consecuencias:**
- Límites de cuota de GAS (90 min de ejecución/día, 6 min por ejecución).
- Sin conexiones persistentes (WebSockets) ni ejecución en segundo plano.
- Las operaciones de base de datos son lentas comparadas con una DB tradicional.

---

## ¿Por qué Google Sheets como base de datos?

**Decisión:** Usar Google Sheets en lugar de una base de datos como PostgreSQL, MySQL o Firebase.

**Razones:**
- **Sin configuración:** Crear un libro de Sheets es inmediato; no hay schemas que definir por adelantado.
- **Transparencia:** Los administradores pueden ver y editar los datos directamente desde Sheets.
- **Exportación nativa:** Los datos se pueden exportar a CSV, conectar a Google Data Studio, etc.
- **Costo:** Sheets es gratuito dentro de Google Workspace.

**Consecuencias:**
- Sheets no es una base de datos relacional. Las uniones (joins) se hacen manualmente en JavaScript.
- Límite de 10 millones de celdas por libro.
- Sin transacciones atómicas ni llaves foráneas.
- El rendimiento se degrada con miles de filas.
- Sin tipos de datos fuertes (todo es string).

---

## ¿Por qué PWA?

**Decisión:** Hacer el sitio una Progressive Web App con service worker y manifiesto.

**Razones:**
- **Instalable:** Los usuarios pueden agregar la app a la pantalla de inicio de su móvil.
- **Offline parcial:** El service worker cachea assets estáticos; la app funciona aunque la red sea lenta.
- **Sin tienda de aplicaciones:** No requiere pasar por Google Play ni App Store.
- **Experiencia nativa:** La app se abre sin la barra de direcciones del navegador.

**Implementación:**
- Service worker con estrategia cache-first para assets, network-first para API.
- Cache de 22 iconos para múltiples plataformas.
- Tema UNAM (`#003D79`) en colores de la app.

---

## ¿Por qué no usar una base de datos en tiempo real?

**Decisión:** No usar Firebase, Supabase u otras soluciones en tiempo real.

**Razón:** El evento es un congreso académico con ~100–200 trabajos. No se requiere sincronización en tiempo real entre usuarios. El modelo de petición-respuesta (el usuario recarga o hace clic para actualizar) es suficiente para el caso de uso.

---

## ¿Por qué esta estructura de archivos?

**Decisión:** Páginas HTML separadas (una por vista) en lugar de una SPA.

**Razón:** Coincide con la decisión de no usar frameworks JS. Cada página es autocontenida, lo que facilita el desarrollo en paralelo y el despliegue incremental. El enrutamiento es directo (navegación entre archivos `.html`).

**Trade-off:** La sesión se pierde si el usuario recarga la página (se recupera de `localStorage`). Hay cierta duplicación lógica entre páginas.

---

## Resumen de decisiones

| Decisión | Alternativa | Razón principal |
|----------|-------------|-----------------|
| Vanilla JS | React, Vue, Angular | Curva de aprendizaje y simplicidad |
| Bootstrap 5.1 | Tailwind, Material UI | Familiaridad y cero configuración |
| Google Apps Script | Node.js, Python, PHP | Costo cero e integración Google |
| Google Sheets | PostgreSQL, MySQL, Firebase | Sin configuración y transparencia |
| PWA | App nativa | Sin tienda, instalable, offline parcial |
| Páginas HTML separadas | SPA | Simplicidad y despliegue trivial |

---

## Lecciones aprendidas

1. **Sheets como DB funciona para prototipos, pero escala mal.** Para eventos con >500 trabajos, considerar migrar a Firestore o una base de datos tradicional.
2. **El desarrollo en vanilla JS es más lento de mantener.** Si el proyecto crece, migrar a un framework (idealmente uno liviano como Svelte o Preact).
3. **Google Apps Script es ideal para el alcance actual.** Si se requieren features más complejos (webhooks, colas de trabajo, streaming), migrar a Cloud Functions o Cloud Run.
4. **El diseño responsivo con Bootstrap funciona bien.** Los usuarios acceden principalmente desde móvil durante el evento.

---

## Temas relacionados

- [Arquitectura general del sistema](14-arquitectura-general.md)
- [Arquitectura del frontend](../reference/11-frontend-architecture.md)
- [Guía de contribución](../../CONTRIBUTING.md)
