# Cómo interpretar los resultados de evaluación

**Audiencia:** Administradores y evaluadores  
**Objetivo:** Comprender cómo se calculan los puntajes, cómo se determinan los ganadores y cómo exportar los datos.

---

## El proceso de evaluación en dos fases

EncuentroIQ utiliza un proceso de evaluación en dos fases:

1. **Fase 1 — Revisión de resúmenes:** Los evaluadores califican los resúmenes usando una rúbrica de 0–100. Los trabajos que superan el puntaje mínimo (configurable, por defecto 60) pasan a fase 2.
2. **Fase 2 — Evaluación en vivo:** Durante las presentaciones, los evaluadores asignan un nuevo puntaje (0–100) basado en la exposición oral o el cartel.

---

## Cálculo del puntaje final

El puntaje final de cada trabajo se calcula así:

- **Fase 1:** Promedio de todos los evaluadores asignados.
- **Fase 2:** Promedio de evaluaciones en vivo.
- **Puntaje total:** `(Fase 1 × 0.4) + (Fase 2 × 0.6)`

Los pesos (40% / 60%) son configurables desde el panel de administración.

---

## Visualizar resultados

### Para administradores

1. Ve a **Resultados** en el panel.
2. La tabla muestra:
   - **Ranking:** Posición basada en el puntaje total descendente.
   - **Trabajo:** Título y modalidad.
   - **Estudiante:** Nombre y facultad.
   - **Fase 1:** Puntaje promedio de la revisión de resúmenes.
   - **Fase 2:** Puntaje promedio de la evaluación en vivo.
   - **Total:** Puntaje ponderado final.

### Para evaluadores

En la sección **Resultados** del panel de evaluador puedes ver:
- Los puntajes de los trabajos que evaluaste.
- Los ganadores una vez publicados por el administrador.

---

## Publicar ganadores

El administrador debe:

1. Revisar los puntajes en la sección **Resultados**.
2. Seleccionar manualmente los ganadores por categoría (oral / cartel) o usar la opción **Seleccionar automáticamente**.
3. Hacer clic en **Publicar resultados**.
4. Los resultados se vuelven visibles para todos los participantes.

---

## Exportar datos

### Exportar a CSV

1. En **Resultados**, haz clic en **Exportar CSV**.
2. Se descarga un archivo con todas las evaluaciones, puntajes y estados.

### Exportar a Google Sheets

Los datos ya están en Google Sheets. Puedes:
- Hacer una copia del libro original.
- Usar Google Sheets Query para filtrar y analizar.
- Crear dashboards con Google Data Studio.

---

## Interpretación de estados

| Estado | Significado |
|--------|-------------|
| Pendiente | Trabajo registrado, aún no evaluado |
| En fase 1 | Siendo evaluado por el comité |
| Aprobado | Superó la fase 1, pasa a presentación |
| Rechazado | No superó la fase 1 |
| En fase 2 | Evaluación en vivo en curso |
| Completado | Evaluación finalizada, puntaje asignado |
| Ganador | Seleccionado como ganador por el admin |

---

## Solución de problemas

| Situación | Causa | Acción |
|-----------|-------|--------|
| Un trabajo no tiene puntaje | Ningún evaluador lo ha evaluado | Asigna evaluadores o envía recordatorios |
| Dos evaluadores dan puntajes muy dispares | Discrepancia natural | Revisa los comentarios, asigna un tercer evaluador |
| Un ganador no aparece en la lista | Resultados no publicados | Publica los resultados desde el panel |
| El puntaje total no se calcula | Faltan datos de fase 1 o fase 2 | Espera a que todas las evaluaciones estén completas |

---

## Referencias

- [Explicación del flujo de evaluación](../explanation/15-flujo-evaluacion.md)
- [API Reference: getWinners](../reference/09-api-reference.md)
