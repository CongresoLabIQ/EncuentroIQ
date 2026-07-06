# Cómo gestionar usuarios y roles

**Audiencia:** Administradores  
**Objetivo:** Administrar cuentas de estudiantes, evaluadores y administradores en la plataforma.

---

## Acceder a la gestión de usuarios

1. Inicia sesión como administrador.
2. Ve a **Usuarios** en el panel lateral.
3. Verás una tabla con todos los usuarios registrados.

---

## Agregar un usuario manualmente

1. Haz clic en **Agregar usuario**.
2. Completa:
   - **Nombre completo** — Tal como aparecerá en certificados.
   - **Correo electrónico** — Será su identificador de inicio de sesión.
   - **Facultad** — Facultad de Química, FES Cuautitlán o FES Zaragoza.
   - **Tipo de usuario** — Estudiante, Evaluador o Administrador.
3. Haz clic en **Guardar**.
4. El sistema genera una contraseña temporal. Cópiala y entrégala al usuario.

---

## Importar usuarios por lote

1. Prepara un archivo CSV con el formato:
   ```csv
   nombre,email,facultad,tipo
   Juan Pérez,juan@ejemplo.com,Facultad de Química,estudiante
   María López,maria@ejemplo.com,FES Cuautitlán,evaluador
   ```
2. Haz clic en **Importar CSV**.
3. Selecciona el archivo.
4. El sistema procesa el lote y muestra un resumen: creados, duplicados omitidos, errores.

---

## Editar un usuario

1. Busca al usuario en la tabla.
2. Haz clic en el ícono de **Editar** (lápiz).
3. Modifica los campos necesarios:
   - Nombre
   - Facultad
   - Tipo de usuario
4. Haz clic en **Guardar cambios**.

> No puedes cambiar el correo electrónico. Si es necesario, elimina y vuelve a crear el usuario.

---

## Restablecer contraseña

1. Busca al usuario en la tabla.
2. Haz clic en **Restablecer contraseña**.
3. El sistema genera una nueva contraseña temporal. Cópiala y entrégala al usuario.
4. El usuario deberá cambiarla al iniciar sesión.

También puedes indicar al usuario que use la página `reset-password.html` para restablecer su contraseña por correo electrónico.

---

## Cambiar el rol de un usuario

1. Edita al usuario.
2. En **Tipo de usuario**, selecciona el nuevo rol.
3. Guarda los cambios. El nuevo rol aplica inmediatamente.

**Consideraciones al cambiar roles:**
- Estudiante → Evaluador: El usuario perderá acceso al envío de trabajos pero ganará acceso al panel de evaluación.
- Evaluador → Administrador: Obtendrá acceso completo al panel de administración.

---

## Eliminar un usuario

1. Busca al usuario en la tabla.
2. Haz clic en el ícono de **Eliminar** (papelera).
3. Confirma la eliminación.

> **Advertencia:** Eliminar un usuario elimina también sus trabajos y evaluaciones asociadas. Es recomendable desactivar la cuenta en lugar de eliminarla si el usuario ya participó.

---

## Referencias

- [Tutorial de configuración del evento](../tutorials/03-configurar-evento.md)
- [Modelo de seguridad y autenticación](../explanation/16-seguridad-autenticacion.md)
