// app.js
require('dotenv').config({ quiet: true });

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middlewares/error.middleware');
const registerRoutes = require('./utils/app.routes');

const app = express();

// --- CORS ---
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.startsWith("http://localhost") ||
      origin.startsWith("http://127.0.0.1") ||
      origin === "https://tudominio.com"
    ) {
      return callback(null, true);
    }
    return callback(new Error('No autorizado por CORS'));
  },
  credentials: true,
};

// --- Limitador de login ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Demasiados intentos de login, espera unos minutos" },
});

// --- Middlewares globales ---
app.use(helmet());
app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan('combined'));

// --- Autenticación ---
const authRoutes = require('./routes/auth.routes');
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);

// --- Rutas de la aplicación ---
registerRoutes(app);

// --- Manejador de errores ---
app.use(errorHandler);

// --- Ruta raíz ---
app.get('/', (req, res) => {
  res.send('Bienvenido');
});

module.exports = app;
