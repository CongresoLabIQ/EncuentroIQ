# Paleta visual y componentes

**Audiencia:** Desarrolladores y diseñadores  
**Propósito:** Referencia del sistema de diseño visual del frontend.

---

## Paleta de colores

Variables CSS definidas en `:root` dentro de `css/style.css`:

| Variable | Color | Uso |
|----------|-------|-----|
| `--primary` | `#003D79` | Fondo de top bar, botones primarios, encabezados |
| `--primary-dark` | `#002A55` | Hover de elementos primarios, footer |
| `--primary-mid` | `#004D99` | Bordes, elementos secundarios |
| `--accent` | `#D59F0F` | Texto destacado, hover de enlaces, acentos |
| `--accent-light` | `#E8B830` | Versión más clara del acento, badges |
| `--accent-bg` | `rgba(213, 159, 15, 0.08)` | Fondos sutiles con tono dorado |
| `--bg` | `#FFFFFF` | Fondo general de páginas |
| `--bg-light` | `#F5F5F5` | Fondo de breadcrumb, encabezados de tabla |
| `--bg-card` | `#EEEEEE` | Fondo de tarjetas secundarias |
| `--border` | `#DDDDDD` | Bordes de componentes |
| `--text` | `#444444` | Texto principal |
| `--text-light` | `#666666` | Texto secundario |
| `--success` | `#056835` | Estados exitosos, aceptado |
| `--danger` | `#BC3A4C` | Errores, rechazado |
| `--info` | `#2682A8` | Información |
| `--shadow` | `0 2px 8px rgba(0,0,0,0.08)` | Sombra de tarjetas |

---

## Tipografía

| Propiedad | Valor |
|-----------|-------|
| Títulos | `'Roboto Slab', serif` (pesos: 400, 600, 700, 800) |
| Cuerpo | `'Roboto', sans-serif` (pesos: 300, 400, 500, 600, 700) |
| Tamaño base | `16px` |
| Radio de bordes | `30px` (tarjetas), `12px` (botones, inputs) |

---

## Componentes principales

### Top bar

```
┌─────────────────────────────────────────────────────┐
│  [U] UNAM · Encuentro IQ          Inicio │ Ingresar │
└─────────────────────────────────────────────────────┘
```

- Fijo en la parte superior (`position: sticky; top: 0`)
- Fondo: `--primary`
- Altura: `60px`
- En modo responsive: el menú de navegación se oculta y solo muestra botón "Ingresar"

### Hero banner

```
┌─────────────────────────────────────────────────────┐
│  ┌─────────┐                                        │
│  │ Escudo  │  Encuentro Estudiantil de              │
│  │  UNAM   │  Ingeniería Química                    │
│  └─────────┘  9° Edición                            │
│              Octubre 2026 · Ciudad de México        │
│                                                     │
│  [Regístrate] [Más información]                     │
└─────────────────────────────────────────────────────┘
```

- Banner image con overlay de gradiente (`--primary` a `--primary-dark`)
- Título en color blanco, tag de edición en `--accent`
- Escudo UNAM con borde dorado y fondo semitransparente
- Animación de entrada `fadeUp` al cargar

### Cards

```
┌─────────────────────┐
│                     │
│  Título             │
│  Descripción breve  │
│                     │
│  [Acción]           │
└─────────────────────┘
```

- `background: --card-bg`
- `border-radius: 12px`
- `box-shadow: --shadow`
- `padding: 24px`

### Stats grid

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│  42     │  │  18     │  │  5      │
│ Trabajos│  │ Orales  │  │ Carteles│
└─────────┘  └─────────┘  └─────────┘
```

- Cuadrícula responsiva (3–4 columnas en desktop, 2 en tablet, 1 en móvil)
- Número grande en `--primary`
- Etiqueta en `--text-light`

### Rubric sliders

```
Claridad y redacción
├─────────────────────●──────────┤  22/25

Contenido científico
├───────────────────────────●────┤  25/30
```

- Input tipo `range` estilizado
- Color del track: `--primary`
- Color del thumb: `--accent`
- Muestra puntaje parcial en tiempo real

### Star ratings

```
★ ★ ★ ★ ☆  4/5
```

- Estrellas interactivas para encuestas
- `★` llena: `--accent`
- `☆` vacía: `--border`
- Click para seleccionar puntuación

### File upload (drag-and-drop)

```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                             │
│   📄 Arrastra tu PDF aquí  │
│   o haz clic para buscar   │
│                             │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

- Borde punteado (`dashed`)
- Cambia a sólido al arrastrar un archivo encima
- Solo acepta `.pdf`
- Máximo 10 MB

### Data tables

```
┌──────────┬──────────┬──────────┬──────────┐
│ Título   │ Estado   │ Puntaje  │ Acción   │
├──────────┼──────────┼──────────┼──────────┤
│ Trabajo  │ Aceptado │ 85       │ [Ver]    │
│ ...      │ ...      │ ...      │ ...      │
└──────────┴──────────┴──────────┴──────────┘
```

- Responsivas (scroll horizontal en móvil)
- Encabezado con fondo `--primary`
- Filas alternadas (zebra striping)
- Badges de estado con colores semánticos

### Bottom nav (admin)

```
┌──────────┬──────────┬──────────┐
│ Dashboard│ Horarios │  Fase 2  │
│   [▣]    │   [📅]   │   [🏆]   │
└──────────┴──────────┴──────────┘
```

- Fija en la parte inferior (`position: fixed; bottom: 0`)
- Fondo blanco con sombra superior
- 3 items: Dashboard, Horarios, Fase 2
- Icono SVG + label de texto
- Item activo con color `--primary`
- Badge de notificación (ej. número de trabajos listos para dictaminar)
- Solo visible en el panel del administrador

### Upload toggle

```
Subida activa  [●───]
```

- Switch CSS personalizado (sin dependencias)
- Persiste en `localStorage` con key `encuentroIQ_uploadsEnabled`
- Label dinámico: "Subida activa" / "Subida desactivada"

### Eval progress dots

```
✓ ✓ 2/3    │  ✓ - -  │  - - -
```

- Puntos circulares que indican progreso de evaluación
- `done`: fondo verde, ✓ | `active`: fondo primario, número | `pending`: fondo gris claro, número
- Acompañado de label `completed/total`

### Avg score ring

```
┌───┐
│85 │  (fondo verde si ≥80, amarillo si ≥60, rojo si <60)
└───┘
```

- Badge circular con color semántico según puntaje
- `high`: verde | `mid`: amarillo | `low`: rojo

---

## Responsive design

| Breakpoint | Objetivo |
|-----------|----------|
| < 576px | Móviles pequeños |
| 576–768px | Móviles grandes |
| 768–992px | Tablets |
| 992–1200px | Desktop |
| > 1200px | Desktop grande |

Comportamiento responsive:
- Tablas se desplazan horizontalmente
- Stats grid se apila verticalmente
- Top bar simplifica navegación

### Mobile PWA (≤767px)

- **Top bar + breadcrumb ocultos** para vista inmersiva
- **Footer oculto** para maximizar espacio
- **Viewport:** `height: 100dvh` con `overflow: hidden`
- **Standalone detection:** `window.matchMedia('(display-mode: standalone)')` aplica estilos adicionales
  - `overflow: hidden`, `position: fixed`, `user-select: none`
- **Touch feedback:** `:active` con `transform: scale(0.97)` en botones/cards
- **Sección transitions:** Animación `fadeUp` al cambiar de pestaña
- **Safe area insets:** `env(safe-area-inset-bottom)` para dispositivos con notch
- **Overscroll:** `overscroll-behavior: contain` para prevenir pull-to-refresh

### Split-view evaluador (≥992px)

- Layout dividido: iframe PDF a la izquierda (50%) + rúbrica a la derecha (50%)
- Modal de evaluación se expande a `90vw` y `90vh`
- En móvil: mantiene modal tradicional
