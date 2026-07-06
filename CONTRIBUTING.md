# Contributing

Gracias por tu interés en contribuir a **EncuentroIQ**.

## Cómo contribuir

1. Haz fork del repositorio.
2. Crea una rama descriptiva: `git checkout -b feat/mi-cambio`.
3. Realiza tus cambios.
4. Verifica que no haya errores abriendo los HTML en el navegador o sirviéndolos localmente:
   ```bash
   python -m http.server 8000
   ```
5. Asegúrate de que el service worker esté actualizado si agregas nuevos archivos.
6. Envía un Pull Request a la rama `main`.

## Estilo

- HTML semántico, sin divs innecesarios.
- CSS: usar las variables definidas en `:root` (`--primary`, `--accent`, etc.).
- JS: ES6+, `async/await`, funciones descriptivas.
- Sin comentarios inline en el código.

## Pull Requests

- Describe qué cambia y por qué.
- Si resuelve un issue, menciónalo: `Closes #123`.
- Mantén los PRs pequeños y enfocados.

## Reportar bugs

Usa la plantilla de Bug Report en Issues. Incluye:
- Navegador y sistema operativo
- Pasos para reproducir
- Comportamiento esperado vs real
- Captura de consola (F12) si aplica
