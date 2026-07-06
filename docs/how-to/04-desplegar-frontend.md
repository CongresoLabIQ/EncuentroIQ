# Cómo desplegar el frontend

**Audiencia:** Desarrolladores  
**Objetivo:** Publicar el frontend de EncuentroIQ en un hosting estático.  
**Tiempo estimado:** 10 minutos.

---

## Requisitos

- Repositorio clonado del proyecto
- Cuenta en GitHub (para GitHub Pages) o servicio de hosting estático
- URL del backend desplegado (Google Apps Script Web App)

---

## Opción A: GitHub Pages

1. Ve a tu repositorio en GitHub.
2. Dirígete a **Settings > Pages**.
3. En **Source**, selecciona `main` (o la rama que uses) y la carpeta `/` (raíz).
4. Haz clic en **Save**.
5. Espera 1–2 minutos. Tu sitio estará disponible en `https://<tu-usuario>.github.io/<repositorio>/`.

---

## Opción B: Netlify

1. Arrastra la carpeta del proyecto a [Netlify Drop](https://app.netlify.com/drop).
2. O conecta tu repositorio desde **New site from Git**.
3. No requiere build step (es HTML/CSS/JS vanilla).
4. Netlify asignará una URL `https://<nombre>.netlify.app`.

---

## Configuración posterior al despliegue

### 1. Conectar con el backend

Edita `js/config.js`:

```js
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/<TU_ID>/exec';
```

Reemplaza `<TU_ID>` con la URL de tu Web App desplegada.

### 2. Actualizar la URL del frontend (opcional)

En `Code.gs` (backend), actualiza:

```js
const FRONTEND_URL = 'https://<tu-dominio>/EncuentroIQ';
```

Esto permite que los enlaces en correos (recuperación de contraseña, notificaciones) apunten al sitio correcto.

### 3. Verificar PWA

- El service worker se registra automáticamente al cargar cualquier página.
- Verifica en Chrome DevTools > Application > Service Workers que esté activo.
- El manifiesto se carga desde `manifest.json`.

---

## Notas importantes

- No requiere build step: el proyecto es HTML, CSS y JavaScript vanilla.
- Los assets estáticos (CSS, JS, imágenes) se cargan desde rutas relativas.
- El service worker cachea todos los archivos al cargar por primera vez.
- Para desarrollo local, puedes usar cualquier servidor HTTP simple:

  ```bash
  npx serve .
  ```

---

## Solución de problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| Pantalla en blanco | Ruta incorrecta a CSS/JS | Verifica que los paths sean relativos |
| Error 404 en páginas | Enrutamiento incorrecto | GitHub Pages requiere navegación desde el archivo `.html` directamente |
| Service worker no registra | HTTPS requerido | GitHub Pages y Netlify ya usan HTTPS |
| API no responde | `GOOGLE_SCRIPT_URL` incorrecto | Verifica `js/config.js` |

---

## Referencias

- [Cómo desplegar el backend](05-desplegar-backend.md)
- [Arquitectura del frontend](../reference/11-frontend-architecture.md)
- [Documentación de GitHub Pages](https://docs.github.com/pages)
