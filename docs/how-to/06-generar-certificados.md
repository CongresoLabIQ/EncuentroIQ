# Cómo generar certificados

**Audiencia:** Administradores  
**Objetivo:** Generar certificados personalizados para participantes, evaluadores y ganadores del evento.

---

## Requisitos previos

- Panel de administración con resultados publicados
- Plantilla de Google Docs configurada en `Code.gs`
- Carpeta en Google Drive para almacenar los certificados

---

## Paso 1: Preparar la plantilla

1. Crea un documento en Google Docs con el diseño del certificado.
2. Usa marcadores de posición con doble llave:
   - `{{nombre}}` — Nombre del participante
   - `{{evento}}` — Nombre del evento
   - `{{tipo}}` — Tipo de certificado (participante, evaluador, ganador)
   - `{{fecha}}` — Fecha de emisión
   - `{{trabajo}}` — Título del trabajo (opcional)
3. Copia el ID de la plantilla desde la URL.
4. Configura `TEMPLATE_ID` en `Code.gs`.

---

## Paso 2: Generar certificados desde el panel

1. Inicia sesión como administrador.
2. Ve a la sección **Certificados**.
3. Selecciona el tipo de certificado a generar:
   - **Participantes:** Todos los estudiantes con trabajo aceptado.
   - **Evaluadores:** Todos los evaluadores registrados.
   - **Ganadores:** Primeros lugares por categoría.
4. Haz clic en **Generar certificados**.
5. El sistema creará un documento por persona basado en la plantilla.

---

## Paso 3: Descargar certificados

Una vez generados:

- **Individual:** Haz clic en el nombre del participante para abrir o descargar el PDF.
- **Masivo:** Haz clic en **Descargar todo como ZIP** para obtener un archivo comprimido con todos los certificados.

Los certificados se almacenan en la carpeta configurada en `CERTIFICATES_FOLDER_ID`.

---

## Tipos de certificados disponibles

| Tipo | Descripción | Incluye |
|------|-------------|---------|
| Participante | Por haber enviado un trabajo | Nombre, evento, título del trabajo |
| Evaluador | Por haber participado en el comité | Nombre, evento, rol |
| Ganador (1er lugar) | Primer lugar en modalidad oral o cartel | Nombre, evento, categoría |
| Ganador (2do lugar) | Segundo lugar | Nombre, evento, categoría |
| Mención honorífica | Reconocimiento especial | Nombre, evento, mención |

---

## Solución de problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| El certificado tiene `{{nombre}}` literal | Marcador no coincide con la plantilla | Verifica que los `{{marcadores}}` en Docs coincidan con los del script |
| Error "Plantilla no encontrada" | `TEMPLATE_ID` incorrecto | Verifica el ID en `Code.gs` |
| El PDF no se genera | Permisos insuficientes | Verifica que el script tenga acceso a Drive |
| El certificado dice "undefined" | Dato faltante en Sheets | Verifica que el usuario tenga nombre registrado |

---

## Referencias

- [Tutorial de configuración del evento](../tutorials/03-configurar-evento.md)
- [API Reference: generateCertificate](../reference/09-api-reference.md)
