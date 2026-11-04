const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const USERNAME = process.env.APP_USERNAME || "Juaquin";
const PASSWORD_HASH = process.env.APP_PASSWORD_HASH;
const SESSION_SECRET = process.env.SESSION_SECRET;
const UPLOAD_DIR = path.join(__dirname, "private_uploads");

if (!PASSWORD_HASH || !SESSION_SECRET) {
  console.error("Configura APP_PASSWORD_HASH y SESSION_SECRET antes de iniciar.");
  process.exit(1);
}
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(helmet({ contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "blob:"],
    mediaSrc: ["'self'", "blob:"],
    connectSrc: ["'self'"]
  }
}}));
app.use(express.json({ limit: "1mb" }));
app.use(session({
  name: "mi_estudio_session",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 }
}));
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase())
  }),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return cb(new Error("Usa JPG, PNG o WEBP."));
    cb(null, true);
  }
});

function auth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: "Inicia sesión para continuar." });
}

app.post("/api/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  const validUser = typeof username === "string" && username.toLowerCase() === USERNAME.toLowerCase();
  const validPass = typeof password === "string" && await bcrypt.compare(password, PASSWORD_HASH);
  if (!validUser || !validPass) return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: "No se pudo iniciar sesión." });
    req.session.authenticated = true;
    res.json({ ok: true });
  });
});
app.post("/api/logout", auth, (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get("/api/me", (req, res) => res.json({ authenticated: !!(req.session && req.session.authenticated), username: USERNAME }));

app.post("/api/upload", auth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Selecciona una imagen." });
  // El archivo queda en una carpeta privada y no se sirve como archivo público.
  res.json({ ok: true, fileId: req.file.filename, message: "Imagen cargada de forma privada." });
});

app.post("/api/generate", auth, async (req, res) => {
  const { fileId, prompt, duration, quality } = req.body || {};
  if (!fileId || !fs.existsSync(path.join(UPLOAD_DIR, path.basename(fileId)))) {
    return res.status(400).json({ error: "Primero carga una imagen válida." });
  }
  if (typeof prompt !== "string" || !prompt.trim()) return res.status(400).json({ error: "Escribe una descripción para el video." });

  // Punto de integración: conecta aquí un proveedor de imagen-a-video con una API key
  // guardada exclusivamente en el servidor. No se envían claves al navegador.
  if (!process.env.VIDEO_API_URL || !process.env.VIDEO_API_KEY) {
    return res.status(503).json({
      error: "La interfaz está lista, pero falta conectar un proveedor de generación de video. Configura VIDEO_API_URL y VIDEO_API_KEY en el servidor."
    });
  }
  return res.status(501).json({
    error: "El proveedor está configurado, pero falta adaptar su formato de solicitud y respuesta en server.js."
  });
});

app.use(express.static(path.join(__dirname, "public")));
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: "La imagen supera el límite de 12 MB o no se pudo cargar." });
  if (err) return res.status(400).json({ error: err.message || "Error en la solicitud." });
  next();
});
app.listen(PORT, () => console.log(`Mi Estudio IA disponible en el puerto ${PORT}`));
