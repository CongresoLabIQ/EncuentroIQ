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
3. Crea una **carpeta de prueba** en Drive y pon su ID en
   `PRUEBA_CERT_FOLDER_ID` (dentro de `Code.pruebas.gs`).
4. Despliega el Web App del clon (Implementar → Nueva implementación → Aplicación web).
5. Ejecuta las funciones desde el editor (menú Ejecutar):

| Función | Verifica |
|---------|----------|
| `PRUEBA_estado()` | que existen `TestE1`, `MiguelF`, `admin-001` |
| `PRUEBA_todo()` | flujo completo tolerante a fallos |
| `PRUEBA_notifDictamen()` | correo de dictamen **solo** a `TestE1` |
| `PRUEBA_notifAgenda()` | correo de agenda **solo** a `MiguelF` |
| `PRUEBA_pushAdmin()` | push **solo** a la suscripción de `admin-001` |
| `PRUEBA_crearTrabajo()` | crea un trabajo temp `PRUEBA-WORK-001` |
| `PRUEBA_constancia()` | genera un slide en la carpeta de prueba y valida placeholders |
| `PRUEBA_asignarFase2()` | llama al endpoint real del clon (asignación) |

6. **Al terminar, ejecuta `PRUEBA_limpiar()`**: borra el trabajo de prueba, sus
   asignaciones de Fase 2 y manda a la papelera las constancias de prueba.

### Qué NO debe ejecutarse nunca sobre producción
- `notifyFinalResults` / `notifyJudgesAgenda` sin el modo dirigido (notifican a todos).
- `assignLiveWorks`, `assignAllPending`, `batchFinalize`, `setConfig` (escriben datos).
- `generarPremiacionMasiva()` sin filtrar (genera constancias de ganadores reales).
- `submitWork` / `submitPresentation` con datos reales.

---

## Criterios de aceptación

- `node tests/run.js` termina con `✅ TODO OK` (270 aserciones).
- El sensor de notificaciones queda en **0** en la Fase A.
- En Fase C, los correos/push llegan **únicamente** a `TestE1`, `MiguelF` y `admin-001`.
- `PRUEBA_limpiar()` deja la hoja clon sin rastros de la prueba.
