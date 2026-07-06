# Flujo de evaluación en dos fases

**Audiencia:** Todos los usuarios  
**Propósito:** Explicar cómo funciona el proceso de evaluación desde el envío del trabajo hasta la publicación de resultados.

---

## El ciclo de vida de un trabajo

Cada trabajo enviado en EncuentroIQ atraviesa las siguientes etapas:

```
Registro → Envío → Fase 1 (revisión) → Fase 2 (presentación) → Resultados
```

---

## Etapa 0: Registro y envío

El estudiante:
1. Crea una cuenta en la plataforma.
2. Inicia sesión y accede al formulario de envío.
3. Completa los datos del trabajo (título, resumen, modalidad, asesor).
4. Sube el archivo PDF.
5. El sistema registra el trabajo con estado `pending`.

En este punto, el trabajo está en una cola de espera para ser asignado a evaluadores.

---

## Etapa 1: Fase 1 — Revisión de resúmenes

### Asignación

El administrador (manual o automáticamente) asigna cada trabajo a **2 o más evaluadores**. Cada evaluador recibe una notificación en su panel con los trabajos pendientes.

### Evaluación

Cada evaluador revisa el resumen y asigna puntajes usando la rúbrica de fase 1:

| Criterio | Peso | ¿Qué mide? |
|----------|------|------------|
| Claridad y redacción | 25% | El resumen está bien escrito y es comprensible. |
| Contenido científico | 30% | El trabajo muestra rigor académico y metodología sólida. |
| Relevancia | 25% | El tema es pertinente para la ingeniería química. |
| Originalidad | 20% | El trabajo aporta una perspectiva novedosa. |

### Decisión

- El sistema calcula el **promedio** de todos los evaluadores.
- Si el promedio es **≥ puntaje mínimo** (configurable, default 60): El trabajo pasa a `accepted` y avanza a fase 2.
- Si el promedio es **< puntaje mínimo**: El trabajo se marca como `rejected`.

> Los evaluadores pueden dejar comentarios constructivos. En caso de discrepancia significativa entre evaluadores, el administrador puede asignar un tercer evaluador.

---

## Etapa 2: Fase 2 — Evaluación en vivo

### Programación

El administrador configura los horarios de presentación en la sección **Horarios**. Cada trabajo aceptado se asigna a un bloque de tiempo.

### Presentación

El estudiante presenta su trabajo de forma oral (con diapositivas) o mediante cartel, según la modalidad seleccionada.

### Evaluación en vivo

Durante la presentación, los evaluadores asignados registran su evaluación usando la rúbrica de fase 2:

| Criterio | Peso | ¿Qué mide? |
|----------|------|------------|
| Presentación | 25% | Claridad y organización de la exposición. |
| Dominio del tema | 30% | El expositor demuestra conocimiento profundo. |
| Respuesta a preguntas | 25% | Responde adecuadamente las preguntas del jurado. |
| Material visual | 20% | Calidad de diapositivas o cartel. |

### Registro

El evaluador ingresa el puntaje en la sección **Evaluación en vivo** de su panel. El puntaje se guarda inmediatamente.

---

## Cálculo del puntaje final

```
Puntaje final = (Fase 1 × 0.4) + (Fase 2 × 0.6)
```

**Ejemplo:**
- Fase 1: 85 puntos
- Fase 2: 90 puntos
- Puntaje final: (85 × 0.4) + (90 × 0.6) = 34 + 54 = **88 puntos**

Los pesos (40%/60%) son configurables por el administrador.

---

## Publicación de resultados

1. El administrador revisa los puntajes consolidados.
2. Selecciona los ganadores por categoría (oral / cartel).
3. Publica los resultados.
4. Los estudiantes ven su estado y retroalimentación en su panel.
5. Los evaluadores ven los ganadores en su sección de resultados.

---

## Diagrama de decisión

```
                    ┌──────────────┐
                    │ Trabajo      │
                    │ enviado      │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Asignación   │
                    │ a evaluador  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Fase 1       │
                    │ Evaluación   │
                    └──────┬───────┘
                           │
               ╔═══════════╧═══════════╗
               ║  Puntaje ≥ mínimo?   ║
               ╚═══════════╤═══════════╝
                           │
            ┌──────────────┼──────────────┐
            ▼              │              ▼
     ┌────────────┐        │       ┌────────────┐
     │  Aceptado  │        │       │  Rechazado │
     │  → Fase 2  │        │       │  ← Fin     │
     └──────┬─────┘        │       └────────────┘
            │              │
     ┌──────▼──────┐       │
     │ Presentación│       │
     │ en vivo     │       │
     └──────┬──────┘       │
            │              │
     ┌──────▼──────┐       │
     │ Fase 2      │       │
     │ Evaluación  │       │
     └──────┬──────┘       │
            │              │
     ┌──────▼──────┐       │
     │ Resultado   │       │
     │ final       │       │
     └─────────────┘       │
```

---

## Roles y responsabilidades en cada fase

| Rol | Antes del evento | Fase 1 | Fase 2 | Post-evento |
|-----|-----------------|--------|--------|-------------|
| Estudiante | Envía trabajo | Espera resultado | Presenta | Recibe retroalimentación |
| Evaluador | — | Evalúa resúmenes | Evalúa presentaciones | Ve ganadores |
| Admin | Configura, asigna | Monitorea progreso | Gestiona agenda | Publica resultados |

---

## Temas relacionados

- [Tutorial para evaluadores](../tutorials/02-primeros-pasos-evaluador.md)
- [Guía para interpretar resultados](../how-to/08-interpretar-resultados.md)
- [Modelo de seguridad y autenticación](16-seguridad-autenticacion.md)
