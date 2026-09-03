@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set SRC=K:\Mi unidad\EncuentroIQ\EncuentroIQ
set DEST=C:\EncuentroBuild
set EXCL=%SRC%\build\exclusions.txt

echo ============================================================
echo  EncuentroIQ - Build de APK (Capacitor + Android)
echo  Copia a ruta sin espacios para evitar errores de npm/EBADF
echo ============================================================
echo.

REM 1) Limpiar destinos
echo [1/7] Limpiando C:\EncuentroBuild ...
if exist "%DEST%\node_modules" rmdir /s /q "%DEST%\node_modules"
if exist "%DEST%\www" rmdir /s /q "%DEST%\www"
if exist "%DEST%\android" rmdir /s /q "%DEST%\android"
if exist "%DEST%\package-lock.json" del /q "%DEST%\package-lock.json"
if not exist "%DEST%" mkdir "%DEST%"

REM 2) Copiar el sitio (excluyendo node_modules/www/android)
echo [2/7] Copiando proyecto a %DEST% ...
xcopy "%SRC%" "%DEST%" /E /I /Y /Q /EXCLUDE:%EXCL% >nul
if errorlevel 1 (
  echo ERROR: fallo al copiar el proyecto.
  pause
  exit /b 1
)

REM 3) Limpiar caché de npm y forzarla a ruta limpia
echo [3/7] Limpiando caché de npm ...
set npm_config_cache=C:\EncuentroNpmCache
if exist "%npm_config_cache%" rmdir /s /q "%npm_config_cache%"
mkdir "%npm_config_cache%"
call npm cache clean --force >nul 2>&1

REM 4) npm install (con Defender desactivado si es posible)
echo [4/7] Instalando dependencias de Capacitor ...
cd /d "%DEST%"
call npm install
if errorlevel 1 (
  echo.
  echo ERROR en npm install. Causa mas probable: antivirus/Defender.
  echo Si vuelve a fallar, desactiva momentaneamente:
  echo   Windows Security ^> Proteccion contra virus ^> Proteccion en tiempo real
  echo y vuelve a ejecutar este script.
  pause
  exit /b 1
)

REM 5) Build de la carpeta www
echo [5/7] Generando carpeta www/ ...
call npm run build:www
if errorlevel 1 ( echo ERROR en build:www & pause & exit /b 1 )

REM 6) Añadir plataforma Android (una sola vez)
if not exist "%DEST%\android\app\build.gradle" (
  echo [6/7] Añadiendo plataforma Android ...
  call npx cap add android
  if errorlevel 1 ( echo ERROR en cap add android & pause & exit /b 1 )
) else (
  echo [6/7] Plataforma Android ya existe, sincronizando ...
)

REM 7) Sync
echo [7/7] Sincronizando con Capacitor ...
call npx cap sync android
if errorlevel 1 ( echo ERROR en cap sync & pause & exit /b 1 )

echo.
echo ============================================================
echo  LISTO! Proyecto en: %DEST%
echo  Para compilar la APK:
echo    1) cd /d %DEST%
echo    2) npx cap open android   (abre Android Studio)
echo    3) Build ^> Build Bundle(s)/APK(s) ^> Build APK(s)
echo ============================================================
pause
