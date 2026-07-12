# Estructura de Google Sheets

**Audiencia:** Desarrolladores y administradores  
**Propósito:** Documentar el esquema de cada hoja del libro de Google Sheets usado como base de datos.

---

## Hoja: `Usuarios`

Registro de todos los usuarios del sistema.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | string | Identificador único generado |
| `name` | string | Nombre completo |
| `email` | string | Correo electrónico (único) |
| `password` | string | Hash de la contraseña |
| `user_type` | string | `student`, `evaluator`, `admin` |
| `facultad` | string | Facultad de procedencia |
| `token` | string | Token de sesión actual (vacío si no hay sesión) |
| `reset_token` | string | Token de recuperación de contraseña |
| `reset_expires` | date | Fecha de expiración del reset token |
| `created_at` | date | Fecha de registro |

---

## Hoja: `Trabajos`

Trabajos académicos enviados por los estudiantes.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | string | Identificador único del trabajo |
| `short_id` | string | ID corto para identificación visual |
| `student_id` | string | ID del estudiante que envía |
| `title` | string | Título del trabajo |
| `abstract` | string | Palabras clave / keywords |
| `semester` | string | Semestre del estudiante |
| `facultad` | string | Facultad de procedencia |
| `profesor_cargo` | string | Nombre del profesor a cargo |
| `team_members` | string | Integrantes del equipo |
| `modality` | string | `oral`, `cartel` o `Pendiente` |
| `file_url` | string | URL del PDF en Google Drive |
| `file_id` | string | ID del archivo en Google Drive |
| `status` | string | `pending`, `under_review`, `accepted_oral`, `accepted_poster`, `rejected` |
| `submitted_at` | date | Fecha de envío |

---

## Hoja: `Evaluaciones`

Evaluaciones de fase 1 realizadas por evaluadores.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | string | Identificador único |
| `work_id` | string | ID del trabajo evaluado |
| `evaluator_id` | string | ID del evaluador |
| `score` | number | Puntaje total (0–100) |
| `rubrica` | json | Objeto JSON con puntajes por criterio |
| `comments` | string | Comentarios del evaluador |
| `created_at` | date | Fecha de evaluación |

---

## Hoja: `Asignaciones`

Asignaciones de trabajos a evaluadores (fase 1).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | string | Identificador único |
| `work_id` | string | ID del trabajo |
| `evaluator_id` | string | ID del evaluador asignado |
| `status` | string | `pending`, `in_progress`, `completed` |
| `created_at` | date | Fecha de asignación |

---

## Hoja: `AsignacionesVivo`

Asignaciones para evaluación en vivo (fase 2).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | string | Identificador único |
| `work_id` | string | ID del trabajo |
| `evaluator_id` | string | ID del evaluador |
| `session` | string | Sesión o bloque horario |
| `status` | string | `pending`, `evaluated` |

---

## Hoja: `EvaluacionesVivo`

Evaluaciones realizadas durante las presentaciones en vivo.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | string | Identificador único |
| `work_id` | string | ID del trabajo |
| `evaluator_id` | string | ID del evaluador |
| `score` | number | Puntaje (0–100) |
| `created_at` | date | Fecha de evaluación |

---

## Hoja: `Horarios`

Agenda del evento con horarios de presentación.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | string | Identificador único |
| `fecha` | date | Día de la sesión |
| `hora_inicio` | time | Hora de inicio |
| `hora_fin` | time | Hora de fin |
| `modalidad` | string | `oral` o `cartel` |
| `sede` | string | Sala o ubicación |
| `capacidad` | number | Máximo de trabajos |

---

## Hoja: `Ganadores`

Resultados y ganadores del evento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | string | Identificador único |
| `work_id` | string | ID del trabajo ganador |
| `categoria` | string | `oral` o `cartel` |
| `posicion` | string | `1er_lugar`, `2do_lugar`, `mencion_honorifica` |
| `published` | boolean | `TRUE` si está publicado |

---

## Hoja: `Encuestas`

Respuestas de la encuesta de satisfacción.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | string | Identificador único |
| `user_id` | string | ID del usuario (opcional) |
| `respuestas` | json | Objeto JSON con preguntas y respuestas |
| `created_at` | date | Fecha de envío |

---

## Hoja: `Configuracion`

Configuración general del evento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `clave` | string | Nombre del parámetro |
| `valor` | string | Valor del parámetro |
| `descripcion` | string | Descripción del parámetro |

Parámetros predefinidos:

| Clave | Valor por defecto | Descripción |
|-------|-------------------|-------------|
| `evento_nombre` | Encuentro Estudiantil de Ingeniería Química | Nombre del evento |
| `fecha_inicio` | — | Fecha de inicio del congreso |
| `fecha_fin` | — | Fecha de fin del congreso |
| `limite_envios` | — | Fecha límite para enviar trabajos |
| `limite_evaluaciones` | — | Fecha límite para evaluar |
| `puntaje_minimo` | 60 | Puntaje mínimo para aprobar fase 1 |
| `peso_fase1` | 0.4 | Peso de fase 1 en puntaje final |
| `peso_fase2` | 0.6 | Peso de fase 2 en puntaje final |

---

## Hoja: `Profesores`

Catálogo de profesores asesores.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | string | Identificador único |
| `nombre` | string | Nombre del profesor |
| `facultad` | string | Facultad |
| `semestre` | string | Semestre en el que participa |

---

## Hoja: `Certificados`

Registro de certificados generados.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | string | Identificador único |
| `user_id` | string | ID del usuario |
| `type` | string | Tipo de certificado |
| `file_url` | string | URL del PDF en Google Drive |
| `generated_at` | date | Fecha de generación |
