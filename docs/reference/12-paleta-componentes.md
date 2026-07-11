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
- Sidebar se colapsa a menú hamburguesa
- Tablas se desplazan horizontalmente
- Stats grid se apila verticalmente
- Top bar simplifica navegación
