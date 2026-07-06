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

El panel tiene las siguientes secciones:

| Sección | Propósito |
|---------|-----------|
| Dashboard | Resumen de usuarios, trabajos y evaluaciones |
| Usuarios | Gestionar cuentas de estudiantes, evaluadores y admins |
| Trabajos | Ver todos los trabajos enviados y su estado |
| Asignaciones | Asignar trabajos a evaluadores |
| Horarios | Configurar agenda del evento |
| Evaluaciones | Monitorear el progreso de las evaluaciones |
| Resultados | Publicar ganadores |
| Certificados | Generar certificados para participantes |
| Encuestas | Ver respuestas de la encuesta de satisfacción |
| Configuración | Ajustes generales del evento |

---

## Paso 2: Registrar usuarios

1. Ve a la sección **Usuarios**.
2. Puedes registrar usuarios de dos formas:

   **Manual:**
   - Haz clic en **Agregar usuario**.
   - Completa: nombre, correo, facultad, tipo (estudiante/evaluador/admin).
   - Se generará una contraseña temporal que el usuario debe cambiar.

   **Masivo (carga por CSV):**
   - Prepara un archivo CSV con las columnas: `nombre, email, facultad, tipo`.
   - Haz clic en **Importar CSV** y selecciona el archivo.
   - El sistema creará los usuarios y te mostrará un resumen.

---

## Paso 3: Configurar horarios y sedes

1. Ve a **Horarios** > **Agregar sesión**.
2. Completa:
   - **Fecha:** Día de la presentación.
   - **Hora de inicio y fin:** Bloque de tiempo.
   - **Modalidad:** Oral o Cartel.
   - **Sede / Sala:** Ubicación física.
   - **Capacidad máxima:** Número de trabajos en esa sesión.
3. Repite para cada bloque del evento.

> Los horarios son visibles para evaluadores en su sección "Mi agenda".

---

## Paso 4: Revisar trabajos enviados

1. Ve a **Trabajos** para ver todos los envíos.
2. Cada trabajo muestra:
   - Título, modalidad, estudiante, facultad
   - Estado: Pendiente, Aceptado, Rechazado, En revisión
   - Archivo PDF (enlace a Google Drive)
3. Puedes **aceptar o rechazar** trabajos manualmente si es necesario.
4. Puedes **asignar trabajos** a evaluadores directamente desde aquí.

---

## Paso 5: Asignar trabajos a evaluadores

Tienes dos métodos:

**Asignación manual:**
1. Ve a **Asignaciones**.
2. Selecciona un trabajo y un evaluador.
3. Haz clic en **Asignar**.

**Asignación aleatoria:**
1. En **Asignaciones**, haz clic en **Asignar todos los pendientes**.
2. El sistema distribuye equitativamente los trabajos entre los evaluadores disponibles.
3. Puedes reasignar trabajos individualmente después.

> Cada trabajo debe tener al menos 2 evaluadores para garantizar una evaluación justa.

---

## Paso 6: Monitorear evaluaciones

1. Ve a **Evaluaciones** para ver el progreso.
2. La tabla muestra:
   - Trabajo y evaluador asignado
   - Estado: Pendiente, En progreso, Completada
   - Puntaje (si ya fue evaluado)
   - Fecha de evaluación
3. Puedes enviar recordatorios a evaluadores que no hayan completado sus evaluaciones.

---

## Paso 7: Publicar resultados

1. Ve a **Resultados**.
2. Revisa los puntajes consolidados de cada trabajo.
3. Selecciona los ganadores por categoría (oral / cartel).
4. Haz clic en **Publicar resultados**.
5. Los resultados serán visibles para estudiantes y evaluadores.

---

## Paso 8: Generar certificados

1. Ve a **Certificados**.
2. Selecciona el tipo de certificado:
   - **Participante:** Para estudiantes que enviaron trabajo.
   - **Evaluador:** Para miembros del comité.
   - **Ganador:** Para los primeros lugares.
3. Haz clic en **Generar certificados**.
4. El sistema crea los documentos desde la plantilla de Google Docs y los guarda en Google Drive.
5. Puedes descargarlos individualmente o en lote (ZIP).

---

## Configuración general

En la sección **Configuración** puedes ajustar:

| Parámetro | Descripción | Valor por defecto |
|-----------|-------------|-------------------|
| Nombre del evento | Título mostrado en la plataforma | Encuentro Estudiantil de Ingeniería Química |
| Fechas del evento | Inicio y fin del congreso | Configurable |
| Fecha límite de envíos | Último día para registrar trabajos | Configurable |
| Fecha límite de evaluaciones | Último día para evaluar | Configurable |
| Puntaje mínimo para aceptar | Umbral de fase 1 | 60 |
| Número de evaluadores por trabajo | Cantidad de revisiones | 2 |

---

## Siguientes pasos

- [Cómo desplegar el frontend](../how-to/04-desplegar-frontend.md)
- [Cómo desplegar el backend](../how-to/05-desplegar-backend.md)
- [Arquitectura general del sistema](../explanation/14-arquitectura-general.md)
