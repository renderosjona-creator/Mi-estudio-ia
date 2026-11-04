# Mi Estudio IA

Web móvil privada para Android/Chrome. Incluye interfaz negra y morada, inicio de sesión de usuario/contraseña, carga privada de imágenes y un punto de integración para un proveedor de imagen-a-video.

## Requisitos
- Node.js 20 o superior
- Un servidor con HTTPS para publicar la aplicación
- Un proveedor de generación de imagen-a-video y su API, si quieres generar videos reales

## Preparar la cuenta
1. Descomprime el proyecto en tu servidor.
2. Ejecuta `npm install`.
3. Crea un hash para tu contraseña:
   `node -e "require('bcryptjs').hash('TU_CONTRASENA',12).then(console.log)"`
4. Genera un secreto:
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
5. Configura `APP_USERNAME=Juaquin`, `APP_PASSWORD_HASH` y `SESSION_SECRET` como variables de entorno del servidor. No pongas la contraseña real en archivos públicos.
6. Configura `NODE_ENV=production` y publica detrás de HTTPS.
7. Ejecuta `npm start`.

## Estado actual
La interfaz y el backend de acceso/carga están implementados. La generación de video NO está conectada todavía: requiere elegir un proveedor y adaptar su API en la ruta `/api/generate` de `server.js`. No introduzcas claves API en el navegador.

## Privacidad y seguridad
- Usa HTTPS.
- Mantén `public_uploads/` fuera del directorio público y limita el acceso al servidor.
- Configura almacenamiento persistente y copias de seguridad privadas.
- Añade una política de borrado automático de imágenes si no quieres conservarlas.
- Utiliza solo imágenes propias o con consentimiento de la persona representada. No uses el sistema para crear contenido íntimo no consentido ni contenido sexual de menores.
