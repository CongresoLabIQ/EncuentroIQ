# Documentación de EncuentroIQ

Bienvenido a la documentación completa del **Sistema de Gestión y Evaluación del Encuentro Estudiantil de Ingeniería Química**.

Esta documentación está organizada siguiendo el framework **Diátaxis**, que divide el contenido en cuatro cuadrantes según la necesidad del lector.

---

## 📘 Tutorials — Aprendizaje práctico

Guías paso a paso para que un nuevo usuario logre un resultado concreto.

| Documento | Audiencia | Tiempo |
|-----------|-----------|--------|
| [Primeros pasos: participa en el Encuentro](tutorials/01-primeros-pasos-participante.md) | Estudiantes | 10 min |
| [Primeros pasos: evalúa trabajos](tutorials/02-primeros-pasos-evaluador.md) | Evaluadores | 15 min |
| [Configura el evento desde cero](tutorials/03-configurar-evento.md) | Administradores | 30 min |

---

## 🔧 How-to Guides — Solución de problemas

Recetas para resolver tareas específicas.

| Documento | Audiencia |
|-----------|-----------|
| [Cómo desplegar el frontend](how-to/04-desplegar-frontend.md) | Desarrolladores |
| [Cómo desplegar el backend](how-to/05-desplegar-backend.md) | Desarrolladores |
| [Cómo generar certificados](how-to/06-generar-certificados.md) | Administradores |
| [Cómo gestionar usuarios y roles](how-to/07-gestionar-usuarios.md) | Administradores |
| [Cómo interpretar los resultados](how-to/08-interpretar-resultados.md) | Admins / Evaluadores |

---

## 📖 Reference — Información técnica

Descripción precisa del sistema y sus componentes.

| Documento | Audiencia |
|-----------|-----------|
| [API Reference](reference/09-api-reference.md) | Desarrolladores |
| [Estructura de Google Sheets](reference/10-google-sheets-schema.md) | Desarrolladores |
| [Arquitectura del frontend](reference/11-frontend-architecture.md) | Desarrolladores |
| [Paleta visual y componentes](reference/12-paleta-componentes.md) | Diseñadores / Devs |
| [Glosario de términos](reference/13-glosario.md) | Todos |

---

## 💡 Explanation — Entendimiento profundo

Discusiones que clarifican el diseño y las decisiones del proyecto.

| Documento | Audiencia |
|-----------|-----------|
| [Arquitectura general del sistema](explanation/14-arquitectura-general.md) | Desarrolladores / Admins |
| [Flujo de evaluación en dos fases](explanation/15-flujo-evaluacion.md) | Todos |
| [Modelo de seguridad y autenticación](explanation/16-seguridad-autenticacion.md) | Desarrolladores / Admins |
| [Decisiones técnicas](explanation/17-decisiones-tecnicas.md) | Desarrolladores |

---

## Estructura de archivos

```
docs/
├── README.md                           ← Este archivo (índice general)
├── tutorials/
│   ├── 01-primeros-pasos-participante.md
│   ├── 02-primeros-pasos-evaluador.md
│   └── 03-configurar-evento.md
├── how-to/
│   ├── 04-desplegar-frontend.md
│   ├── 05-desplegar-backend.md
│   ├── 06-generar-certificados.md
│   ├── 07-gestionar-usuarios.md
│   └── 08-interpretar-resultados.md
├── reference/
│   ├── 09-api-reference.md
│   ├── 10-google-sheets-schema.md
│   ├── 11-frontend-architecture.md
│   ├── 12-paleta-componentes.md
│   └── 13-glosario.md
└── explanation/
    ├── 14-arquitectura-general.md
    ├── 15-flujo-evaluacion.md
    ├── 16-seguridad-autenticacion.md
    └── 17-decisiones-tecnicas.md
```

---

## Convenciones utilizadas

- **Código:** Fragmentos de JavaScript, JSON, CSS en bloques con resaltado de sintaxis.
- **Tablas:** Para parámetros, configuraciones y comparaciones.
- **Notas:** Información adicional o advertencias en bloques `> `.
- **Enlaces cruzados:** Referencias a otros documentos de la documentación para navegación contextual.
