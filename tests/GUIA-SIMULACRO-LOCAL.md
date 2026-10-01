# Simulacro desde celulares en la red local

Este servidor publica la interfaz del proyecto en la red Wi-Fi y reemplaza en tiempo de ejecución el URL del backend por el indicado al arrancar. **No cambia `js/config.js` ni debe conectarse al Web App de producción.**

## Requisitos

- Node.js instalado en la computadora que alojará la página.
- Computadora y celulares conectados a la misma red Wi-Fi.
- Una copia de Google Sheets y una implementación Web App de Apps Script para pruebas, separadas de producción. La guía de preparación está en [`README.md`](README.md), sección “Fase C — Pruebas reales en un clon”.
- El proyecto de Apps Script del clon debe tener las hojas y encabezados actuales del backend.

## Qué datos tendrá

El servidor local no genera datos por sí mismo. En el Apps Script del clon, `PRUEBA_poblarDatos()` agrega a Google Sheets un escenario ficticio completo: **81 trabajos, 19 cuentas demo, 207 asignaciones y 192 evaluaciones de Fase 1, más 63 asignaciones y 48 evaluaciones de Fase 2**. Incluye trabajos pendientes, en revisión, aceptados y rechazados; los datos aparecen en los dashboards reales de la aplicación.

Las cuentas que crea son `admin@prueba.encuentroiq.test`, `alumno.fq@…`, `alumno.fc@…`, `alumno.fz@…` y `evaluador.<facultad>.<1-5>@…`. Todas usan la contraseña **`Simulacro2026!`**. Los trabajos enlazan a un PDF ficticio servido por el servidor local.

Si el evento solo evalúa la **Fase 2**, usa el flujo por etapas en lugar de `PRUEBA_poblarDatos()`. Desde el menú **🔬 Simulacro Fase 2** de la hoja (o el editor) ejecuta los pasos 1–4 con `PRUEBA_f2_preparar()`: crea las mismas 19 cuentas demo y **45 trabajos ya seleccionados (13 carteles + 2 ponencias por facultad)**, los asigna por rotación y deja una lista de pendientes. Después, tú y tus jefes evalúan a mano desde el dashboard del evaluador, y `PRUEBA_f2_finalizar()` completa lo que falte y muestra los ganadores. El detalle está en [`README.md`](README.md), sección “Simulación de Fase 2 por etapas”.

Duplicar una hoja puede copiar trabajos, evaluaciones y datos personales existentes. Antes de sembrar, deja en `users` solo las cuentas de prueba `TestE1`, `MiguelF` y `admin-001` (si se usarán las pruebas dirigidas), y vacía las filas de datos de `works`, `assignments`, `evaluations`, `live_assignments`, `live_evaluations`, `live_evaluator_status`, `help_requests`, `push_subscriptions` y `reset_tokens`. Conserva encabezados y configuración. El seeder **se detiene** si detecta usuarios ajenos al simulacro, suscripciones push previas o datos en las hojas operativas; no los borra ni los mezcla.

`PRUEBA_poblarDatos()` es idempotente: si el conjunto está completo, no lo duplica. Si quedó incompleto, ejecuta `PRUEBA_limpiar()` y vuelve a sembrar. Al final del simulacro, `PRUEBA_limpiar()` elimina las filas demo relacionadas y las constancias identificadas por el ID corto del trabajo, sin borrar datos ajenos. `npm run simular` sigue siendo una simulación aparte, solo en memoria.

### Preparar el clon antes de iniciar el servidor

1. En el Apps Script del clon, añade `tests/Code.pruebas.gs`; el `Code.gs` del proyecto puede ser el del clon, no necesitas tocar las constantes de Drive para generar los datos.
2. Limpia/anónimiza las filas de datos indicadas arriba. Mantén los encabezados y las filas de configuración.
3. Genera los datos con `PRUEBA_poblarDatos()` (escenario completo) o con `PRUEBA_f2_preparar()` (solo Fase 2, 45 trabajos) desde el editor de Apps Script. Autoriza el acceso a la hoja; ninguno usa Google Drive.
4. Confirma en el registro los conteos (81 trabajos con `PRUEBA_poblarDatos()`; 45 trabajos y 19 cuentas con `PRUEBA_f2_preparar()`). Ya puedes usar los correos y la contraseña común para entrar.
5. Solo si vas a probar subidas o constancias: crea en Drive una carpeta para PDFs, otra para constancias y una copia de la plantilla; configura `DRIVE_FOLDER_ID`, `TEMPLATE_ID`, `CERTIFICATES_FOLDER_ID` y `PRUEBA_CERT_FOLDER_ID` con sus IDs y ejecuta `PRUEBA_validarDrive()` antes.

## Arranque

Desde la raíz del repositorio, ejecuta:

```powershell
npm run servir-prueba -- https://script.google.com/macros/s/ID_DEL_CLON/exec
```

Sustituye `ID_DEL_CLON` por el ID de la implementación de prueba. El servidor se detiene si se le pasa exactamente la URL que está configurada en producción. También valida el formato de Web App de Apps Script.

Al iniciar, imprime una dirección `http://<IP-de-la-computadora>:4173/`. Comparte esa dirección con tus jefes para abrirla en el navegador del celular. Deben estar en la misma Wi-Fi; deja la terminal abierta mientras dure la sesión. Si Windows pregunta, permite Node.js únicamente en redes privadas. No configures redirección de puertos en el router.

Si el puerto 4173 ya está ocupado, en PowerShell:

```powershell
$env:PORT=4174
npm run servir-prueba -- https://script.google.com/macros/s/ID_DEL_CLON/exec
```

En ese caso, comparte la dirección que termina en `:4174/`.

## Roles y recorrido sugerido

Abre la dirección en tres dispositivos o ventanas privadas e inicia sesión con estas cuentas demo (usa la facultad en minúsculas: `fq`, `fc` o `fz`):

1. `alumno.fq@prueba.encuentroiq.test` — panel del alumno y trabajos enviados.
2. `evaluador.fq.1@prueba.encuentroiq.test` — pendientes e historial de Fase 1 y Fase 2.
3. `admin@prueba.encuentroiq.test` — dashboard, asignaciones, estados y ganadores.
4. Contraseña para todas: `Simulacro2026!`. Cambia el evaluador por `fc`/`fz` o por otro número del 1 al 5 para revisar diferentes cargas.

No ingresen credenciales reales del evento. Estas cuentas solo existen en la copia de prueba.

## Limitaciones de acceso móvil

- Esta dirección HTTP local permite probar los flujos web desde celulares; no es una dirección pública y requiere la misma Wi-Fi.
- En celulares, los navegadores solo habilitan service workers, instalación PWA y algunas funciones de notificaciones push en un contexto HTTPS seguro. Para probar esas funciones específicamente, usen la prueba dirigida del clon documentada en `tests/README.md` o publiquen una copia de prueba bajo HTTPS.
- Los archivos de prueba, documentación, Apps Script y carpetas internas no se sirven desde este servidor.

## Cierre y limpieza

Detén el servidor con `Ctrl+C`. Después, ejecuta `PRUEBA_limpiar()` desde el editor de Apps Script del clon. No ejecutes las acciones masivas contra producción; la lista está en `tests/README.md`.
