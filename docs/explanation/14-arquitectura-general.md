# Arquitectura general del sistema

**Audiencia:** Desarrolladores y administradores  
**Propósito:** Explicar cómo se comunican los componentes del sistema y entender el flujo de datos completo.

---

## Visión general

EncuentroIQ es una aplicación web de **arquitectura serverless** que opera sin un servidor backend tradicional. En lugar de eso, combina:

1. **Frontend estático** — HTML, CSS y JavaScript servidos desde GitHub Pages (o cualquier hosting estático).
2. **Backend como Web App** — Google Apps Script desplegado como Web App que procesa peticiones HTTP.
3. **Base de datos en Google Sheets** — El libro de Sheets funciona como base de datos relacional.
4. **Almacenamiento de archivos en Google Drive** — Los PDFs de trabajos y certificados se guardan en carpetas de Drive.

---

## Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                   NAVEGADOR (Cliente)                    │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ index.html   │  │ login.html   │  │ student-     │  │
│  │ landing page │  │ auth         │  │ dashboard    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                                                │
│         │ POST / GET                                     │
│         ▼                                                │
│  ┌──────────────────────────────────────────────────┐    │
│  │           api-client.js (fetch)                  │    │
│  │   { action, token, ...datos } → JSON            │    │
│  └──────────────────────┬───────────────────────────┘    │
│                         │                                │
└─────────────────────────┼────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Google Apps Script  │
              │   Web App Endpoint    │
              │   Code.gs             │
              │                       │
              │   doPost(e)           │
              │   doGet(e)            │
              └────┬──────────┬───────┘
                   │          │
          ┌────────┤          ├────────┐
          ▼        ▼          ▼        ▼
   ┌──────────┐ ┌──────┐ ┌──────┐ ┌────────┐
   │ Google   │ │Google│ │Google│ │Gmail   │
   │ Sheets   │ │Drive │ │ Docs │ │(email) │
   │ (DB)     │ │(PDFs)│ │(cert)│ │(notif) │
   └──────────┘ └──────┘ └──────┘ └────────┘
```

---

## Flujo de datos paso a paso

### 1. El usuario realiza una acción

El usuario interactúa con una página HTML (ej. envía un trabajo desde `submit-work.html`).

### 2. JavaScript procesa la acción

`api-client.js` construye un objeto JSON con la acción y los datos, y lo envía como `POST` al Web App de Google Apps Script.

```javascript
const result = await postData({
    action: 'submitWork',
    student_id: 'user_abc',
    titulo: '...',
    file_base64: '...'
});
```

### 3. Google Apps Script procesa la petición

La función `doPost(e)` recibe la petición, extrae `action` y enruta a la función correspondiente:

```javascript
function doPost(e) {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    // Enruta según action...
}
```

### 4. El backend interactúa con los servicios de Google

- **Google Sheets:** Lee o escribe datos usando `SpreadsheetApp`.
- **Google Drive:** Guarda archivos PDF usando `DriveApp`.
- **Google Docs:** Genera certificados desde plantillas.
- **Gmail:** Envía correos de notificación y recuperación de contraseña.

### 5. El backend responde

El Web App devuelve un objeto JSON con `{ success, data, message }`.

### 6. El frontend actualiza la interfaz

`api-client.js` recibe la respuesta y actualiza el DOM (tablas, mensajes, estados).

---

## Características clave de la arquitectura

### Serverless
No hay servidores que administrar. El backend se ejecuta en los servidores de Google sin necesidad de aprovisionamiento ni mantenimiento.

### Sin estado (stateless)
Cada petición al backend es independiente. La sesión se mantiene mediante tokens almacenados en `localStorage` del navegador.

### Escalabilidad
Google Apps Script escala automáticamente. El límite práctico es de ~20,000 peticiones por día para una cuenta gratuita de Google.

### Costo cero
No hay costos de infraestructura. El proyecto usa servicios gratuitos de Google (Sheets, Drive, Apps Script) y GitHub Pages.

---

## Limitaciones conocidas

| Limitación | Impacto | Mitigación |
|------------|---------|------------|
| Cuota de Apps Script: 90 min/día de ejecución | No apto para uso continuo intensivo | Optimizar consultas, reducir llamadas |
| Google Sheets: 10M celdas máx. | Límite de almacenamiento | Archivar eventos anteriores |
| Sin WebSockets | No hay actualizaciones en tiempo real | El usuario debe recargar o usar polling |
| Sin base de datos relacional real | Joins manuales en JavaScript | Las funciones de `Code.gs` enriquecen los datos |
| Sin autenticación OAuth propia | La seguridad depende del token en localStorage | El token expira, uso de HTTPS obligatorio |

---

## ¿Por qué esta arquitectura?

Esta arquitectura fue elegida por:

1. **Cero costo operativo** — Ideal para un evento académico sin presupuesto de infraestructura.
2. **Facilidad de mantenimiento** — Sin servidores, sin bases de datos que configurar.
3. **Familiaridad del equipo** — Google Sheets y Apps Script son herramientas conocidas en el ámbito académico.
4. **Rápido despliegue** — El sistema puede estar operativo en minutos.

---

## Temas relacionados

- [Flujo de evaluación en dos fases](15-flujo-evaluacion.md)
- [Decisiones técnicas](17-decisiones-tecnicas.md)
- [API Reference](../reference/09-api-reference.md)
