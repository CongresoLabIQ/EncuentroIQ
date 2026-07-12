# Tutorial: Configura el evento desde cero

**Audiencia:** Administradores del evento  
**Objetivo:** Configurar la plataforma para un nuevo Encuentro Estudiantil de Ingeniería Química.  
**Tiempo estimado:** 30 minutos.

---

## Lo que aprenderás

- Acceder al panel de administración
- Configurar las hojas de cálculo del evento
- Registrar evaluadores y administradores
- Configurar horarios y sedes
- Asignar trabajos a evaluadores
- Publicar resultados

---

## Requisitos previos

- Cuenta de administrador activa
- Acceso al libro de Google Sheets del backend
- Acceso al editor de Google Apps Script
- Lista de participantes, evaluadores y horarios

---

## Paso 1: Acceder al panel de administración

1. Inicia sesión con tu cuenta de administrador en `login.html`.
2. Serás redirigido al **Panel de Administración** (`admin-dashboard.html`).

El panel tiene 3 pestañas accesibles desde la barra de navegación inferior:

| Pestaña | Contenido |
|---------|-----------|
| **Dashboard** | Toggle subida activa · Asignar evaluadores Fase 1 · Dictaminar trabajos listos · Tabla de seguimiento de evaluaciones con filtros · Ver evaluadores asignados por trabajo |
| **Horarios** | Asignar evaluadores Fase 2 · Caso de emergencia (juez sustituto) · Enviar agendas por correo · Tabla de horario general de ponencias |
| **Fase 2** | Reconocimientos por ciclo académico · Top 3 Oral y Top 3 Cartel · Generación de constancias (PDF) |

---

## Paso 2: Asignar trabajos a evaluadores

1. En la pestaña **Dashboard**, haz clic en **Asignar Fase 1**.
2. El sistema asigna automáticamente **3 evaluadores distintos** a cada trabajo pendiente.
3. Los evaluadores recibirán notificación en su panel.
4. Puedes monitorear el progreso en la tabla de seguimiento con filtros por estatus, modalidad y orden.

> La barra de **subida activa** permite controlar si los estudiantes pueden seguir enviando trabajos.

---

## Paso 3: Monitorear evaluaciones

1. En **Dashboard**, la tabla muestra el progreso de cada trabajo.
2. Usa los filtros: **Todos · Pendiente · En Revisión · Dictaminados** (por estatus) y **Oral + Cartel · Solo Oral · Solo Cartel** (por modalidad).
3. Haz clic en **Ver evaluadores** de cada trabajo para ver quiénes están asignados y su puntaje.
4. Cuando un trabajo tenga **3 evaluaciones completadas**, aparecerá en la sección "Listos para Dictaminar".

---

## Paso 4: Configurar Fase 2 (evento presencial)

1. Ve a la pestaña **Horarios**.
2. En **Fase 2: Evaluación Presencial**, haz clic en **Asignar evaluadores Fase 2** para asignar 3 evaluadores presenciales a todos los trabajos aceptados.
3. Configura los horarios de presentación en la tabla de horario general.
4. Si un juez no asistió, usa el botón **Asignar Juez de Emergencia** para sustituirlo.
5. Cuando todo esté listo, haz clic en **Enviar Agendas por Correo a todos los Jueces**.

---

## Paso 5: Dictaminar trabajos

1. Cuando todos los trabajos en revisión tengan 3 evaluaciones completadas, haz clic en **Dictaminar (N)** en el Dashboard.
2. El sistema aplica la regla **Top 2 por semestre** para ponencias orales.
3. Se envían correos de notificación a los alumnos con el resultado.

---

## Paso 6: Ver reconocimientos

1. Ve a la pestaña **Fase 2**.
2. Revisa el Top 3 de Ponencia Oral y Top 3 de Cartel con sus puntajes.
3. Haz clic en **Constancia** para generar el PDF del reconocimiento del equipo.

---

## Configuración general

Los parámetros del evento se configuran en el backend (Google Apps Script):

| Parámetro | Descripción | Valor por defecto |
|-----------|-------------|-------------------|
| Nombre del evento | Título mostrado en la plataforma | Encuentro Estudiantil de Ingeniería Química |
| Fechas del evento | Inicio y fin del congreso | Configurable |
| Evaluadores por trabajo (Fase 1) | Número de revisiones por trabajo | 3 |
| Evaluadores por trabajo (Fase 2) | Número de evaluadores presenciales | 3 |
| Regla Top 2 por semestre | Solo 2 orales por semestre avanzan | Activada |
| Subida de trabajos | Controlado desde el Dashboard (toggle) | Activada |

---

## Siguientes pasos

- [Cómo desplegar el frontend](../how-to/04-desplegar-frontend.md)
- [Cómo desplegar el backend](../how-to/05-desplegar-backend.md)
- [Arquitectura general del sistema](../explanation/14-arquitectura-general.md)
