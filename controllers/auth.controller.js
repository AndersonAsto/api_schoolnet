const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const tokenBlacklist = require('../services/tokenBlacklist');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const TeacherAssignments = require('../models/teacherAssignments.model');
const Tutors = require('../models/tutors.model');
const Users = require('../models/users.model');

// 🔐 LOGIN
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Faltan credenciales" });
    }

    // 👇 AQUI: asegúrate de traer personId
    const user = await Users.findOne({
      where: { userName: username, status: true },
      attributes: ["id", "userName", "passwordHash", "role", "personId"],
    });

    if (!user) {
      console.warn(`Intento fallido de login → usuario no encontrado: ${username}`);
      return res.status(401).json({ error: "Usuario o contraseña inválidos" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      console.warn(`Intento fallido de login → contraseña incorrecta para usuario: ${username}`);
      return res.status(401).json({ error: "Usuario o contraseña inválidos" });
    }

    // ==========================
    // Lógica docente / tutor
    // ==========================
    let isTeacher = false;
    let isTutor = false;
    let tutorId = null;

    // ⚠️ Solo buscamos si tenemos personId
    if (user.personId) {
      const teacherAssignment = await TeacherAssignments.findOne({
        where: {
          personId: user.personId,
          status: true,
        },
        attributes: ['id'],
      });

      if (teacherAssignment) {
        isTeacher = true;

        const tutorRecord = await Tutors.findOne({
          where: {
            teacherId: teacherAssignment.id,
            status: true,
          },
          attributes: ['id'],
        });

        if (tutorRecord) {
          isTutor = true;
          tutorId = tutorRecord.id;
        }
      }
    }

    // Generar tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.json({
      token: accessToken,
      refreshToken,
      id: user.id,
      username: user.userName,
      role: user.role,
      user: {
        id: user.id,
        username: user.userName,
        role: user.role,
        personId: user.personId,
        isTeacher,
        isTutor,
        tutorId,
      },
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

// 🔄 REFRESH TOKEN
exports.refresh = async (req, res) => {
    const {refreshToken} = req.body;
    if (!refreshToken) {
        return res.status(401).json({error: "Refresh token requerido"});
    }

    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
            issuer: process.env.JWT_ISS,
        });

        // Validar usuario
        const user = await Users.findByPk(payload.sub);
        if (!user) {
            return res.status(401).json({error: "Usuario no encontrado"});
        }

        const newAccessToken = generateAccessToken(user);
        return res.json({token: newAccessToken});

    } catch (err) {
        return res.status(401).json({error: "Refresh token inválido o expirado"});
    }
};

// 🚪 LOGOUT
exports.logout = (req, res) => {
    const auth = req.headers["authorization"];
    if (!auth) return res.status(200).json({ok: true});

    const [, token] = auth.split(" ");
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, {issuer: process.env.JWT_ISS});
        tokenBlacklist.add(payload.jti, payload.exp);
    } catch (_) {
        // Si ya está inválido, da igual
    }

    return res.json({ok: true});
};
