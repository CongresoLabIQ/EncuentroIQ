# Modelo de seguridad y autenticación

**Audiencia:** Desarrolladores y administradores  
**Propósito:** Explicar cómo se maneja la autenticación, autorización y protección de datos en el sistema.

---

## Principios de seguridad

1. **Autenticación basada en tokens** — Cada sesión se identifica mediante un token único.
2. **Autorización por rol** — El acceso a cada funcionalidad depende del tipo de usuario (estudiante, evaluador, admin).
3. **HTTPS obligatorio** — Todo el tráfico entre frontend y backend viaja cifrado.
4. **Mínimo privilegio** — Cada usuario solo puede acceder a sus propios datos y acciones permitidas.

---

## Flujo de autenticación

### Registro

1. El usuario completa el formulario de registro.
2. El frontend envía `{ action: 'register', email, password, name, user_type }` al backend.
3. Google Apps Script:
   - Verifica que el email no esté duplicado.
   - Almacena la contraseña sin cifrado adicional (limitación de Sheets; se recomienda hash si es posible).
   - Genera un `id` único para el usuario.
4. Devuelve `{ success: true, data: { id, email, name } }`.

### Inicio de sesión

1. El usuario ingresa email y contraseña.
2. El frontend envía `{ action: 'login', email, password }`.
3. El backend:
   - Busca el email en la hoja `Usuarios`.
   - Compara la contraseña.
   - Genera un token de sesión único.
   - Almacena el token en la fila del usuario.
4. Devuelve `{ success: true, data: { profile, token } }`.
5. El frontend guarda el perfil y token en `localStorage`.

### Verificación de sesión

En cada petición que requiere autenticación:

1. El frontend lee el token de `localStorage`.
2. Lo incluye en el payload: `{ action: '...', token }`.
3. El backend:
   - Busca el token en la hoja `Usuarios`.
   - Si no existe o expiró → respuesta con error `AUTH_FAILED`.
   - Si es válido → ejecuta la acción solicitada.
4. El frontend redirige al login si recibe `AUTH_FAILED`.

### Cierre de sesión

1. El frontend elimina el token de `localStorage`.
2. Opcionalmente, notifica al backend para limpiar el token.

---

## Control de acceso por roles

Cada acción del backend verifica que el tipo de usuario tenga permiso:

| Acción | Estudiante | Evaluador | Admin |
|--------|:----------:|:---------:|:-----:|
| `register` | ✓ | ✓ | ✓ |
| `login` | ✓ | ✓ | ✓ |
| `checkAuth` | ✓ | ✓ | ✓ |
| `submitWork` | ✓ | ✗ | ✗ |
| `getStudentWorks` | ✓ | ✗ | ✗ |
| `getAllWorks` | ✗ | ✗ | ✓ |
| `submitEvaluation` | ✗ | ✓ | ✗ |
| `submitLiveEvaluation` | ✗ | ✓ | ✗ |
| `assignWork` | ✗ | ✗ | ✓ |
| `assignAllPending` | ✗ | ✗ | ✓ |
| `getWinners` | ✓ | ✓ | ✓ |
| `generateCertificate` | ✗ | ✗ | ✓ |
| `forgotPassword` | ✓ | ✓ | ✓ |
| `resetPassword` | ✓ | ✓ | ✓ |

---

## Token de sesión

- **Formato:** Cadena alfanumérica de 32 caracteres generada aleatoriamente.
- **Almacenamiento:** `localStorage` del navegador (clave: `congreso_user`).
- **Persistencia:** El token no tiene expiración explícita; permanece válido hasta que el usuario cierra sesión o el administrador lo invalida.
- **Riesgo:** `localStorage` es accesible desde JavaScript en el mismo dominio. Esto lo hace vulnerable a XSS si el sitio tuviera vulnerabilidades de script injection.

---

## Recuperación de contraseña

1. El usuario solicita recuperación desde `reset-password.html`.
2. El backend genera un token de recuperación con expiración (`RESET_TOKEN_EXPIRY_HOURS` = 1 hora por defecto).
3. Envía un correo con un enlace a `set-new-password.html?token=<reset_token>`.
4. El usuario establece una nueva contraseña.
5. El token de recuperación se invalida después de usarlo o al expirar.

---

## Consideraciones de seguridad

### Fortalezas

- **Sin servidor backend expuesto:** Solo hay un endpoint de Apps Script; no hay puertos abiertos, SSH, ni bases de datos tradicionales.
- **HTTPS forzado:** Google Apps Script y GitHub Pages usan HTTPS.
- **Tokens únicos:** Cada sesión tiene un token generado aleatoriamente.
- **Control de acceso server-side:** Aunque un usuario malicioso modificara el frontend, las validaciones de rol están en el backend.

### Limitaciones

| Limitación | Riesgo | Mitigación recomendada |
|------------|--------|------------------------|
| Contraseñas sin hash | Exposición si alguien accede a Sheets | Migrar a hash con `Utilities.computeDigest()` |
| Token en localStorage | Vulnerable a XSS | Sanitizar entradas de usuario; implementar Content Security Policy |
| Apps Script "Anyone" | El endpoint es público (conocido el ID) | El token impide acceso no autorizado a datos |
| Sin rate limiting | Ataques de fuerza bruta | Google Apps Script tiene cuotas por usuario que mitigan parcialmente |

---

## Buenas prácticas para administradores

- **No compartir credenciales:** Cada administrador debe tener su propia cuenta.
- **Contraseñas seguras:** Usar combinaciones de mayúsculas, minúsculas, números y símbolos.
- **Sesiones activas:** Revisar periódicamente los usuarios conectados desde el panel.
- **Respaldos:** Hacer copias periódicas del libro de Google Sheets.

---

## Temas relacionados

- [Arquitectura general del sistema](14-arquitectura-general.md)
- [API Reference: Autenticación](../reference/09-api-reference.md#acciones-de-autenticación)
- [Guía para gestionar usuarios](../how-to/07-gestionar-usuarios.md)
