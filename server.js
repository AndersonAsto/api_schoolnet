require('dotenv').config({ quiet: true });
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const sequelize = require('./config/db.config');
const app = express();

const PORT = process.env.PORT || 3000;

const authRoutes = require('./routes/auth.routes');

const appRoutes = require('./routes/index');

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (
            origin.startsWith("http://localhost") ||
            origin.startsWith("http://127.0.0.1") ||
            origin === "https://schoolnet.site"
        ) {
            return callback(null, true);
        }

        return callback(new Error('No autorizado por CORS.'));
    },
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
};

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Demasiados intentos de ingreso, espera unos minutos." },
});

// Middlewares globales
app.use(helmet());
app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan('combined'));

// Rutas de auth + limitador
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);

// Rutas del resto de módulos
app.use('/api', appRoutes.AnnualAverageRoutes);
app.use('/api', appRoutes.AttendancesRoutes);
app.use('/api', appRoutes.CoursesRoutes);
app.use('/api', appRoutes.EvaluationsRoutes);
app.use('/api', appRoutes.GradeRoutes);
app.use('/api', appRoutes.HolidaysRoutes);
app.use('/api', appRoutes.IncidentsRoutes);
app.use('/api', appRoutes.OverallCoursesRoutes);
app.use('/api', appRoutes.ParentAssignmentsRoutes);
app.use('/api', appRoutes.PersonsRoutes);
app.use('/api', appRoutes.QualificationsRoutes);
app.use('/api', appRoutes.ReportsRoutes);
app.use('/api', appRoutes.SchedulesRoutes);
app.use('/api', appRoutes.SchoolDaysRoutes);
app.use('/api', appRoutes.SchoolDaysByScheduleRoutes);
app.use('/api', appRoutes.SectionsRoutes);
app.use('/api', appRoutes.StudentEnrollmentsRoutes);
app.use('/api', appRoutes.TeacherAssignmentsRoutes);
app.use('/api', appRoutes.TeacherGroupsRoutes);
app.use('/api', appRoutes.TeachingBlockAverageRoutes);
app.use('/api', appRoutes.TeachingBlocks);
app.use('/api', appRoutes.TutorsRoutes);
app.use('/api', appRoutes.UsersRoutes);
app.use('/api', appRoutes.YearsRoutes);

app.get('/', (req, res) => {
    res.send('Bienvenido');
});

const errorHandler = require('./middlewares/error.middleware');

// Conexión a la base de datos y levantado del servidor
sequelize
    .authenticate()
    .then(() => {
        console.log('Conexión a la base de datos exitosa.');
        console.log('Base de datos sincronizada.');

        if (process.env.NODE_ENV !== 'test') {
            app.listen(PORT, () => {
                console.log(`Servidor corriendo en http://localhost:${PORT}`);
            });
        }
    })
    .catch(err => {
        console.error('Error al conectar con la base de datos: ', err.message);
    });

module.exports = app;
