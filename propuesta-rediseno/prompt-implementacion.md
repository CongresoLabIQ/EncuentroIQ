# Prompt para implementar el rediseño institucional UNAM

## Contexto

El sistema actual "SistemaCongresoLabIQ" (Google Apps Script + HTML/JS/CSS) usaba Bootstrap por defecto con color primario `#0d6efd`. Ahora el evento se transforma en un **Encuentro de Ingeniería Química** que involucra a **Facultad de Química**, **FES Cuautitlán** y **FES Zaragoza**, todas pertenecientes a la **UNAM**. Se requiere un rediseño completo con los colores institucionales y un estilo más formal.

## Paleta de colores

| Elemento | Código | Uso |
|---|---|---|
| Azul UNAM | `#002147` | Navbars, botones primarios, headers, fondos oscuros |
| Azul oscuro | `#001530` | Gradientes, footer |
| Azul medio | `#003366` | Hovers, variantes |
| Oro UNAM | `#C6930C` | Acentos, detalles, hover states, badges |
| Oro claro | `#D4A817` | Textos destacados, hover brillo |
| Fondo claro | `#F5F0E8` | Fondo de página, reemplaza `#f8f9fa` |
| Blanco | `#FFFFFF` | Tarjetas, contenedores |

## Tipografía

```css
--font-heading: 'Playfair Display', Georgia, 'Times New Roman', serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

- Títulos con `Playfair Display` (serif formal)
- Cuerpo con `Inter` (sans-serif legible)
- Importar desde Google Fonts

## Archivos a modificar

### 1. `css/style.css`
Reemplazar completamente con las variables UNAM. El archivo `propuesta-rediseno/unam-theme.css` contiene las clases listas para copiar. Mantener la estructura responsive existente pero con los nuevos colores.

### 2. `index.html`
- **Navbar**: Cambiar `bg-primary` por clase personalizada con fondo `#002147` y borde inferior `3px solid #C6930C`
- **Hero/banner**: Reemplazar el `banner-container` con imagen por el nuevo `banner-encuentro.svg` (que ya incluye logos de UNAM, FQ, FES Cuautitlán y FES Zaragoza)
- **Título**: Cambiar de "🧪 31° Congreso Estudiantil de Laboratorios de Ingeniería Química ⚗️" a "Encuentro de Ingeniería Química" (sin emojis)
- **Subtítulo**: Agregar "Facultad de Química · FES Cuautitlán · FES Zaragoza · UNAM"
- **Botones**: Usar `.btn-unam` y `.btn-unam-outline` en lugar de `btn-primary` y `btn-outline-dark`
- **Tarjetas de pasos**: Reemplazar emojis por SVG icons con stroke `#C6930C`, borde superior `#002147`
- **Footer**: Cambiar `bg-light` por fondo `#001530`, texto dorado, agregar escudo UNAM estilizado

### 3. `login.html`
- Navbar con fondo UNAM + borde oro
- Reemplazar emojis 👋 👁️ con SVGs dorados
- Header del card con gradiente azul UNAM
- Botón "Ingresar" con `.btn-unam`
- Tema-color del manifest: `#002147`

### 4. `register.html`
- Mismos cambios que login.html
- Header del card con gradiente azul UNAM

### 5. `admin-dashboard.html`
- Navbar con fondo UNAM + borde oro
- Sidebar: header con fondo UNAM, ítems con hover azul
- Stats cards: usar los colores UNAM (azul, oro, azul medio, verde institucional)
- Títulos: aplicar `section-title` con línea dorada inferior
- Tabla de horarios: header con fondo UNAM
- Badges con `badge-unam` / `badge-unam-gold`
- Modal header con fondo UNAM

### 6. `student-dashboard.html`
- Navbar UNAM
- Work cards: borde izquierdo con `#002147` o `#C6930C` según estado
- Badges de estado con colores UNAM
- Modal header UNAM

### 7. `evaluator-dashboard.html`
- Navbar UNAM
- Pestañas: active con borde superior `#C6930C`
- Modal Fase 1: header con fondo UNAM
- Modal Fase 2: header con fondo `#002147`
- Sliders de rúbrica con acento `#C6930C`

### 8. Otras páginas
- `submit-work.html`
- `download.html`
- `encuesta-satisfaccion.html`
- `admin-dashboard-kindle.html`
- Aplicar misma paleta UNAM en navbars, footers, botones y cards

## Reglas globales

1. **Sin emojis**: Todos los emojis (🎓🧪📄👋👨‍🎓 etc.) deben reemplazarse por iconos SVG inline con `stroke="#C6930C"` y `stroke-width="2"`, preferentemente usando Feather Icons o iconos inline personalizados

2. **Naming del evento**: Cambiar toda referencia a:
   - "Congreso Estudiantil" → "Encuentro de Ingeniería Química"
   - "LABIQ" → "UNAM · IQ" o eliminarlo
   - Agregar "Facultad de Química · FES Cuautitlán · FES Zaragoza" en subtítulos

3. **Footer institucional** en todas las páginas:
   ```html
   <footer class="footer-unam">
     <div class="container text-center">
       <p class="mb-1 fw-bold">Universidad Nacional Autónoma de México</p>
       <p class="mb-0"><em>Por mi raza hablará el espíritu</em></p>
       <small>Facultad de Química · FES Cuautitlán · FES Zaragoza</small>
     </div>
   </footer>
   ```

4. **Banner**: Reemplazar `banner-container` con imagen por `banner-encuentro.svg`

5. **Manifest.json**: Cambiar `theme_color` de `#0d6efd` a `#002147`

6. **Favicon**: Actualizar a versión UNAM si está disponible

## Estructura de clases CSS (del unam-theme.css)

```css
.btn-unam           /* Botón primario azul UNAM */
.btn-unam-gold      /* Botón primario dorado */
.btn-unam-outline   /* Botón outline dorado */
.card-unam          /* Tarjeta con sombra UNAM */
.card-unam .card-gold-accent  /* Borde superior dorado */
.card-unam .card-blue-accent  /* Borde superior azul */
.stat-unam.blue     /* Stat card azul */
.stat-unam.gold     /* Stat card dorado */
.stat-unam.light    /* Stat card azul medio */
.stat-unam.green    /* Stat card verde */
.badge-unam         /* Badge azul */
.badge-unam-gold    /* Badge dorado */
.section-title      /* Título con línea dorada */
.footer-unam        /* Footer institucional */
.unam-navbar        /* Navbar UNAM */
.unam-hero          /* Hero section */
.alert-unam         /* Alerta con acento dorado */
.table-unam         /* Tabla con header UNAM */
.modal-unam         /* Modal con header UNAM */
```

## Verificación

Después de implementar, verificar:
- [ ] Todas las páginas cargan sin errores
- [ ] Navbar azul UNAM con borde dorado en todas las páginas
- [ ] Footer institucional en todas las páginas
- [ ] Sin emojis, todos reemplazados por SVGs
- [ ] Banner nuevo visible en index.html
- [ ] Nombre del evento actualizado en todo el sistema
- [ ] Responsive funciona correctamente en móvil
- [ ] Contrastes de color cumplen accesibilidad (texto blanco sobre azul oscuro)
