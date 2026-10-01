# Pruebas — EncuentroIQ

Plan de prueba para la lógica de Fase 2 (asignación de carteles/orales) y ganadores.
Diseñado para ser **silencioso con los usuarios reales**: las notificaciones solo se
prueban contra las cuentas de prueba.

| Rol | ID |
|-----|----|
| Estudiante | `TestE1` |
| Evaluador | `MiguelF` |
| Admin | `admin-001` |

---

## Fase A — Sandbox local (automatizado, sin red ni Google)

Carga el `Code.gs` **real** en un entorno falso de Apps Script:
- Hojas en memoria (no toca Google Sheets).
- `MailApp`/`GmailApp`/`UrlFetchApp` solo *registran* la llamada.
- `DriveApp`/`SlidesApp` lanzan error si se invocan.
- Al final se verifica que **no hubo ninguna notificación**.

Cubre: rotación de carteles (FQ→FC→FZ→FQ), 1 evaluador por cartel, límite de 5,
fallback, balance, orales (3 por ponencia, una por facultad, anti-asesor),
idempotencia, conflictos por modalidad (`assignManualLive`/`reassignLiveEvaluator`),
`esAutoEvaluacion`/`getAsesores`, `formatearAsesores` y `getWinners`
(oral top 3 general; cartel top 3 por facultad). Incluye una suite **E2E** que
encadena asignar → evaluar en vivo → ganadores.

Ejecutar (desde la raíz del repo):

```powershell
node tests/run.js
```

Salida esperada: `✅ TODO OK`. No requiere `npm install`.

### Simulación del workflow

Para ver el ciclo completo con datos ficticios y un reporte legible:

```powershell
node tests/simulacion.js   # o: npm run simular
```

Encadena 60 trabajos (20 por facultad) → asignación Fase 1 → 180 evaluaciones →
dictamen → Fase 2 (45 carteles + 6 ponencias) → evaluaciones en vivo → ganadores,
y verifica cada etapa sin enviar notificaciones.

### Simulación de Fase 2 por etapas

Si solo se evalúa la Fase 2, en el clon hay un flujo por etapas (13 carteles +
2 ponencias por facultad) que se ejecuta desde el menú **🔬 Simulacro Fase 2** de la
hoja o llamando cada función desde el editor. Cada paso es idempotente, no toca
Google Drive y es seguro repetirlo:

| Paso | Función | Qué hace |
|------|---------|----------|
| — | `PRUEBA_f2_estado()` | Cuenta usuarios, trabajos, asignaciones y evaluaciones |
| 1 | `PRUEBA_f2_paso1_usuarios()` | Crea 19 cuentas demo (admin, 3 alumnos, 5 evaluadores por facultad) |
| 2 | `PRUEBA_f2_paso2_trabajos()` | Crea 45 trabajos ya aceptados: 13 carteles + 2 ponencias por facultad |
| 3 | `PRUEBA_f2_paso3_asignar()` | Asigna carteles por rotación (1 evaluador) y ponencias (1 por facultad) |
| 4 | `PRUEBA_f2_paso4_pendientes()` | Lista las asignaciones sin evaluar, para hacerlo a mano en la UI |
| 5 | `PRUEBA_f2_paso5_autoevaluar()` | Completa las evaluaciones pendientes y recalcula el puntaje |
| 6 | `PRUEBA_f2_paso6_ganadores()` | Muestra el top 3 oral general y el top 3 cartel por facultad |

Atajos: `PRUEBA_f2_preparar()` corre los pasos 1–4 (queda listo para evaluar a
mano); `PRUEBA_f2_finalizar()` corre 5–6; `PRUEBA_f2_reiniciarEvaluaciones()`
borra las evaluaciones demo para repetir la dinámica; `PRUEBA_limpiar()` elimina
todo al final. Cubierto por `tests/fase2-simulacro.test.js`.

---

## Fase B — Render del admin (manual, sin escrituras)

1. Abre `admin-dashboard.html` con una sesión admin.
2. Abre la consola del navegador y ejecuta (pegando el contenido de
   `tests/fixtures/winners.json` como objeto):

```js
const fixture = /* pegar aquí el JSON de tests/fixtures/winners.json */;
window.apiClient.getWinners = async () => fixture;
loadWinners();
```

3. Verifica en la pestaña **Fase 2**:
   - Tarjeta **"Top 3 Ponencia Oral (General)"**.
   - Una tarjeta **"Top 3 Cartel — \<facultad\>"** por cada facultad (3 en total).

No dispara notificaciones ni escrituras.

---

## Fase C — Pruebas reales en un clon (notificaciones + constancias)

**Requisito:** duplicar la hoja de cálculo y desplegar un `Code.gs` de prueba.
Nunca ejecutar estas funciones contra la hoja de producción.

1. Duplica la Google Sheet y abre **Extensiones → Apps Script** del clon.
2. Pega `Code.gs` (actualizado) y añade `tests/Code.pruebas.gs` como archivo nuevo.
3. Opcional, solo si vas a probar carga de archivos o constancias: crea carpetas
   exclusivas y una copia de la plantilla de Slides; configura `DRIVE_FOLDER_ID`,
   `TEMPLATE_ID`, `CERTIFICATES_FOLDER_ID` y `PRUEBA_CERT_FOLDER_ID` con sus IDs de
   prueba y ejecuta `PRUEBA_validarDrive()`. El sembrado de datos **no usa Drive**
   y funciona aunque esas constantes todavía no existan.
4. Vacía/anónimiza en el clon los registros reales de usuarios, trabajos,
   asignaciones, evaluaciones, actividad, solicitudes de ayuda, suscripciones
   push y datos de reinicio. Conserva encabezados/configuración y, si se usarán las pruebas de
   notificaciones dirigidas, solo las cuentas `TestE1`, `MiguelF`, `admin-001`.
5. Despliega el Web App del clon (Implementar → Nueva implementación → Aplicación web).
6. Ejecuta las funciones desde el editor (menú Ejecutar):

| Función | Verifica |
|---------|----------|
| `PRUEBA_poblarDatos()` | crea 81 trabajos, 19 cuentas demo y evaluaciones ficticias en el clon limpio (no usa Drive) |
| `PRUEBA_validarDrive()` | comprueba IDs de Drive de prueba y rechaza los de producción (antes de subir/constancias) |
| `PRUEBA_estado()` | que existen `TestE1`, `MiguelF`, `admin-001` |
| `PRUEBA_todo()` | flujo completo tolerante a fallos |
| `PRUEBA_notifDictamen()` | correo de dictamen **solo** a `TestE1` |
| `PRUEBA_notifAgenda()` | correo de agenda **solo** a `MiguelF` |
| `PRUEBA_pushAdmin()` | push **solo** a la suscripción de `admin-001` |
| `PRUEBA_crearTrabajo()` | crea un trabajo temp `PRUEBA-WORK-001` |
| `PRUEBA_constancia()` | genera un slide en la carpeta de prueba y valida placeholders |
| `PRUEBA_asignarFase2()` | llama al endpoint real del clon (asignación) |

7. **Al terminar, ejecuta `PRUEBA_limpiar()`**: borra trabajos, evaluaciones,
   asignaciones y cuentas creadas por el simulacro; manda a la papelera las
   constancias de prueba identificadas por su trabajo demo.

### Qué NO debe ejecutarse nunca sobre producción
- `notifyFinalResults` / `notifyJudgesAgenda` sin el modo dirigido (notifican a todos).
- `assignLiveWorks`, `assignAllPending`, `batchFinalize`, `setConfig` (escriben datos).
- `generarPremiacionMasiva()` sin filtrar (genera constancias de ganadores reales).
- `submitWork` / `submitPresentation` con datos reales.

### Simulacro de la interfaz desde celulares

Para abrir los dashboards en celulares conectados a la misma Wi-Fi, consulta
[`GUIA-SIMULACRO-LOCAL.md`](GUIA-SIMULACRO-LOCAL.md). El servidor local requiere
la URL del Web App del clon y rechaza la URL de producción configurada en el proyecto.

---

## Criterios de aceptación

- `node tests/run.js` termina con `✅ TODO OK` (380 aserciones).
- El sensor de notificaciones queda en **0** en la Fase A.
- En Fase C, los correos/push llegan **únicamente** a `TestE1`, `MiguelF` y `admin-001`.
- `PRUEBA_limpiar()` elimina las filas demo marcadas y conserva las filas ajenas.
