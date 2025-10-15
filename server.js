require('dotenv').config({ quiet: true });

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const sequelize = require('./config/db.config');
const app = express();

const PORT = process.env.PORT || 3000;

const yearsRoutes = require('./routes/years.route');
const teachingBlocksRoutes = require('./routes/teachingBlocks.route');
const holidaysRoutes = require('./routes/holidays.routes');
const teachingDaysRoutes = require('./routes/teachingDays.routes');
const coursesRoutes = require('./routes/courses.routes');
const gradesRoutes = require('./routes/grades.routes');
const sectionsRoutes = require('./routes/sections.routes');
const personsRoutes = require('./routes/persons.routes');
const usersRoutes = require('./routes/users.routes');
const teachersAssignmentsRoutes = require('./routes/teachersAssignments.routes');
const studentEnrollmentsRoutes = require('./routes/studentEnrollments.routes');
const representativeAssignments = require('./routes/representativesAssignments.routes');
const schedulesRoutes = require('./routes/schedules.routes');
const assistanceRoutes = require('./routes/assistances.routes');
const authRoutes = require('./routes/auth.routes');
const qualificationRoutes = require('./routes/qualifications.routes');
const examsRoutes = require('./routes/exams.routes');
const tBAvaragesRoutes = require('./routes/teachingBlockAverage.route');
const generalAverage = require('./routes/generalAverage.routes');
const incidentsRoutes = require('./routes/incidents.route');
const errorHandler = require('./middlewares/error.middleware');

const corsOptions = {
    origin: (origin, callback) => {
        // console.log("Origin recibido:", origin);
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

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Demasiados intentos de login, espera unos minutos" },
});

app.use(helmet());
app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan('combined'));

app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);
app.use(errorHandler);

app.use('/api', yearsRoutes);
app.use('/api', teachingBlocksRoutes);
app.use('/api', holidaysRoutes);
app.use('/api', teachingDaysRoutes);
app.use('/api', coursesRoutes);
app.use('/api', gradesRoutes);
app.use('/api', sectionsRoutes);
app.use('/api', personsRoutes);
app.use('/api', usersRoutes);
app.use('/api', teachersAssignmentsRoutes);
app.use('/api', studentEnrollmentsRoutes);
app.use('/api', representativeAssignments);
app.use('/api', schedulesRoutes);
app.use('/api', assistanceRoutes);
app.use('/api', qualificationRoutes);
app.use('/api', examsRoutes);
app.use('/api', tBAvaragesRoutes);
app.use('/api', generalAverage);
app.use('/api', incidentsRoutes);

app.get('/', (req, res) => {
    res.send('Bienvenido')
});

sequelize.authenticate().then(() => {

    console.log('Conexión a la base de datos exitosa.');
    return Promise.resolve();

}).then(() => {

    console.log('Base de datos sincronizada.');
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });

}).catch(err => {
    console.error('Error al conectar con la base de datos:', err.message);
});