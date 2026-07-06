# Cómo desplegar el backend (Google Apps Script)

**Audiencia:** Desarrolladores  
**Objetivo:** Publicar el backend de Apps Script como Web App y conectarlo con el frontend.  
**Tiempo estimado:** 20 minutos.

---

## Requisitos

- Cuenta de Google (Gmail / Google Workspace)
- Archivo `Code.gs` del proyecto
- Libro de Google Sheets para la base de datos
- Carpeta en Google Drive para almacenar PDFs

---

## Paso 1: Crear el libro de Google Sheets

1. Ve a [sheets.google.com](https://sheets.google.com) y crea un nuevo libro.
2. Crea las siguientes hojas con los nombres exactos:

| Hoja | Descripción |
|------|-------------|
| `Usuarios` | Registro de usuarios |
| `Trabajos` | Trabajos enviados |
| `Evaluaciones` | Evaluaciones realizadas |
| `Asignaciones` | Asignaciones trabajo-evaluador |
| `Horarios` | Agenda del evento |
| `Ganadores` | Resultados publicados |
| `Encuestas` | Respuestas de encuestas |
| `Configuracion` | Configuración del evento |
| `Profesores` | Catálogo de profesores |
| `Certificados` | Registro de certificados |

3. Copia el **ID del libro** de la URL: `https://docs.google.com/spreadsheets/d/<ID>/edit`.

---

## Paso 2: Configurar Google Drive

1. Crea una carpeta en Google Drive para los PDFs de trabajos.
2. Copia el **ID de la carpeta** de la URL: `https://drive.google.com/drive/folders/<ID>`.
3. (Opcional) Crea una carpeta para certificados generados.
4. (Opcional) Crea un documento Google Docs como plantilla de certificado y copia su ID.

---

## Paso 3: Configurar el script

1. Ve a [script.google.com](https://script.google.com) y crea un nuevo proyecto.
2. Copia el contenido de `Code.gs` en el editor.
3. Configura las constantes al inicio del archivo:

```javascript
const DRIVE_FOLDER_ID = 'ID_DE_TU_CARPETA_DE_PDFS';
const TEMPLATE_ID = 'ID_DE_TU_PLANTILLA_DE_CERTIFICADO';  // Opcional
const CERTIFICATES_FOLDER_ID = 'ID_DE_CARPETA_DE_CERTIFICADOS';  // Opcional
const FRONTEND_URL = 'https://<tu-dominio>/EncuentroIQ';
const RESET_TOKEN_EXPIRY_HOURS = 1;
```

4. Agrega el libro de Sheets al script:
   - En el editor, haz clic en **Project Settings**.
   - En **Script Properties**, agrega `SPREADSHEET_ID` con el ID del libro.

---

## Paso 4: Desplegar como Web App

1. En el editor de Apps Script, haz clic en **Deploy > New deployment**.
2. Selecciona **Web app** como tipo.
3. Configura:
   - **Description:** "EncuentroIQ Backend"
   - **Execute as:** "User accessing the web app"
   - **Who has access:** "Anyone"
4. Haz clic en **Deploy**.
5. Autoriza los permisos solicitados:
   - Acceso a Google Sheets
   - Acceso a Google Drive
   - Envío de correos (si usas notificaciones)
6. Copia la **URL del Web App** generada.

---

## Paso 5: Conectar frontend con backend

1. Abre `js/config.js` en el frontend.
2. Reemplaza la URL:

```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/<TU_ID>/exec';
```

---

## Verificación

1. Abre el frontend en tu navegador.
2. Regístrate como nuevo usuario.
3. Verifica que el usuario aparezca en la hoja `Usuarios` de Sheets.
4. Envía un trabajo de prueba.
5. Verifica que el PDF esté en Google Drive y el registro en `Trabajos`.

---

## Solución de problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| Error 401 | Token inválido o expirado | Vuelve a iniciar sesión |
| Error 500 en Web App | Error en el script | Revisa la ejecución en Apps Script > Executions |
| CORS / No response | Web App no desplegado | Verifica que el despliegue sea "Anyone" |
| PDF no sube | Carpeta de Drive incorrecta | Verifica `DRIVE_FOLDER_ID` |
| Sheets no se llena | `SPREADSHEET_ID` incorrecto | Verifica Script Properties |

---

## Referencias

- [Guía de despliegue del frontend](04-desplegar-frontend.md)
- [API Reference](../reference/09-api-reference.md)
- [Estructura de Google Sheets](../reference/10-google-sheets-schema.md)
