# API Reference — Backend Google Apps Script

**Audiencia:** Desarrolladores  
**Propósito:** Referencia completa de los endpoints del backend expuestos como Web App.

---

## Endpoint único

```
POST https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
Content-Type: application/json
```

Todas las peticiones se envían como `POST` con un cuerpo JSON. La acción se especifica en el campo `action`.

---

## Formato de respuesta

```json
{
  "success": true | false,
  "data": { ... },
  "message": "Mensaje opcional",
  "error": "Descripción del error (solo si success=false)"
}
```

---

## Acciones de autenticación

### `register`

Registrar un nuevo usuario en el sistema.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"register"` |
| `email` | string | Sí | Correo electrónico del usuario |
| `password` | string | Sí | Contraseña (mín. 8 caracteres) |
| `name` | string | Sí | Nombre completo |
| `user_type` | string | Sí | `"student"`, `"evaluator"` o `"admin"` |
| `admin_code` | string | No | Código requerido para registro de admin |
| `facultad` | string | No | Facultad de procedencia |

```json
// Ejemplo de petición
{ "action": "register", "email": "alumno@ejemplo.com", "password": "miClave123", "name": "Juan Pérez", "user_type": "student", "facultad": "Facultad de Química" }
```

```json
// Ejemplo de respuesta exitosa
{ "success": true, "data": { "id": "user_abc123", "email": "alumno@ejemplo.com", "name": "Juan Pérez" }, "message": "Usuario registrado correctamente" }
```

---

### `login`

Iniciar sesión y obtener un token de acceso.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"login"` |
| `email` | string | Sí | Correo electrónico |
| `password` | string | Sí | Contraseña |

```json
{ "action": "login", "email": "alumno@ejemplo.com", "password": "miClave123" }
```

```json
{ "success": true, "data": { "profile": { "id": "user_abc123", "name": "Juan Pérez", "email": "alumno@ejemplo.com", "user_type": "student" }, "token": "tok_xyz789" } }
```

El token debe almacenarse en el cliente y enviarse en peticiones subsecuentes.

---

### `checkAuth`

Validar que un token de sesión sigue siendo válido.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"checkAuth"` |
| `token` | string | Sí | Token de sesión |

```json
{ "action": "checkAuth", "token": "tok_xyz789" }
```

```json
{ "success": true, "data": { "valid": true, "user": { "id": "user_abc123", "user_type": "student" } } }
```

---

### `forgotPassword`

Solicitar restablecimiento de contraseña. Envía un correo con un enlace que contiene un token temporal.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"forgotPassword"` |
| `email` | string | Sí | Correo registrado |

```json
{ "action": "forgotPassword", "email": "alumno@ejemplo.com" }
```

---

### `resetPassword`

Restablecer la contraseña usando un token de recuperación.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"resetPassword"` |
| `token` | string | Sí | Token de recuperación |
| `newPassword` | string | Sí | Nueva contraseña |

```json
{ "action": "resetPassword", "token": "reset_tok_abc", "newPassword": "nuevaClave456" }
```

---

## Acciones de trabajos

### `submitWork`

Enviar un nuevo trabajo académico.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"submitWork"` |
| `student_id` | string | Sí | ID del estudiante |
| `title` | string | Sí | Título del trabajo |
| `abstract` | string | Sí | Palabras clave / keywords |
| `semester` | string | Sí | Semestre actual |
| `facultad` | string | Sí | Facultad: `"FES Cuautitlán"`, `"FES Zaragoza"` o `"Facultad de Química"` |
| `professor_cargo` | string | Sí | Nombre del profesor a cargo (texto libre) |
| `team_members` | string | Sí | Integrantes del equipo separados por comas |
| `modality` | string | No | `"oral"` o `"cartel"` (default: `"Pendiente"`) |
| `fileName` | string | Sí | Nombre del archivo PDF |
| `fileBase64` | string | Sí | PDF codificado en base64 |

```json
{ "action": "submitWork", "student_id": "user_abc123", "title": "Modelado de reactores", "abstract": "reactores, modelado, cinetica", "semester": "5to Semestre", "facultad": "FES Cuautitlán", "professor_cargo": "Leonardo Lomelí Vanegas", "team_members": "Juan Pérez, María López", "fileName": "trabajo.pdf", "fileBase64": "JVBERi0xLjQK..." }
```

---

### `getStudentWorks`

Obtener los trabajos enviados por un estudiante específico.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"getStudentWorks"` |
| `token` | string | Sí | Token del estudiante |

```json
{ "action": "getStudentWorks", "token": "tok_xyz789" }
```

---

### `getAllWorks`

Obtener todos los trabajos (solo administradores).

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"getAllWorks"` |
| `token` | string | Sí | Token de administrador |

---

### `updateWorkStatus`

Cambiar el estado de un trabajo (aprobar, rechazar).

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"updateWorkStatus"` |
| `token` | string | Sí | Token de administrador |
| `workId` | string | Sí | ID del trabajo |
| `status` | string | Sí | Nuevo estado (`"accepted"`, `"rejected"`, `"pending"`) |

---

## Acciones de evaluación

### `submitEvaluation`

Enviar una evaluación de fase 1.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"submitEvaluation"` |
| `token` | string | Sí | Token del evaluador |
| `workId` | string | Sí | ID del trabajo |
| `score` | number | Sí | Puntaje total (0–100) |
| `rubrica` | object | Sí | Objeto con puntajes por criterio |
| `comments` | string | No | Comentarios para el estudiante |

```json
{ "action": "submitEvaluation", "token": "tok_abc", "workId": "work_123", "score": 85, "rubrica": { "claridad": 22, "contenido": 25, "relevancia": 20, "originalidad": 18 }, "comments": "Buen trabajo, mejorar la redacción." }
```

---

### `submitLiveEvaluation`

Enviar una evaluación en vivo (fase 2).

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"submitLiveEvaluation"` |
| `token` | string | Sí | Token del evaluador |
| `assignmentId` | string | Sí | ID de la asignación en vivo |
| `score` | number | Sí | Puntaje (0–100) |

```json
{ "action": "submitLiveEvaluation", "token": "tok_abc", "assignmentId": "assign_456", "score": 90 }
```

---

### `finalizeAndNotify`

Finalizar evaluaciones de un trabajo y notificar al estudiante.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"finalizeAndNotify"` |
| `token` | string | Sí | Token de administrador |
| `workId` | string | Sí | ID del trabajo |

---

## Acciones de asignación

### `getEvaluators`

Obtener lista de evaluadores registrados.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"getEvaluators"` |
| `token` | string | Sí | Token de administrador |

---

### `assignWork`

Asignar un trabajo a un evaluador específico.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"assignWork"` |
| `token` | string | Sí | Token de administrador |
| `workId` | string | Sí | ID del trabajo |
| `evaluatorId` | string | Sí | ID del evaluador |

---

### `assignAllPending`

Asignar automáticamente todos los trabajos pendientes a evaluadores disponibles.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"assignAllPending"` |
| `token` | string | Sí | Token de administrador |

---

### `assignLiveWorks`

Asignar trabajos para evaluación en vivo.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"assignLiveWorks"` |
| `token` | string | Sí | Token de administrador |
| `phase` | string | Sí | Número de fase o sesión |

---

### `getLiveAssignments`

Obtener asignaciones en vivo para un evaluador.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"getLiveAssignments"` |
| `token` | string | Sí | Token del evaluador |
| `evaluatorId` | string | Sí | ID del evaluador |

---

## Acciones de resultados

### `getWinners`

Obtener la lista de ganadores publicados.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"getWinners"` |
| `token` | string | Sí | Token de administrador o evaluador |

---

### `generateCertificate`

Generar un certificado para un usuario.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"generateCertificate"` |
| `token` | string | Sí | Token de administrador |
| `userId` | string | Sí | ID del usuario |
| `type` | string | Sí | Tipo de certificado (`"participant"`, `"evaluator"`, `"winner"`) |

---

## Acciones complementarias

### `getProfessors`

Obtener el catálogo de profesores asesores.

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | string | Sí | `"getProfessors"` |
| `token` | string | Sí | Token de administrador |

---

## Códigos de error comunes

| Código | Significado |
|--------|-------------|
| `AUTH_FAILED` | Token inválido o expirado |
| `INVALID_PARAMS` | Parámetros faltantes o incorrectos |
| `DUPLICATE_EMAIL` | El correo ya está registrado |
| `WORK_NOT_FOUND` | El trabajo no existe |
| `EVALUATION_EXISTS` | El trabajo ya fue evaluado por este evaluador |
| `UNAUTHORIZED` | El usuario no tiene permisos para esta acción |
| `STORAGE_ERROR` | Error al guardar en Google Sheets o Drive |
