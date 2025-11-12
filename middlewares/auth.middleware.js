const jwt = require('jsonwebtoken');
const tokenBlacklist = require('../services/tokenBlacklist');

module.exports = function auth(required = true) {
    return (req, res, next) => {
        const header = req.headers["authorization"];
        if (!header) return required ? res.status(401).json({error: "Token requerido"}) : next();

        const [scheme, token] = header.split(" ");
        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({error: "Formato de autorización inválido"});
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET, {issuer: process.env.JWT_ISS});
            if (payload.jti && tokenBlacklist.has(payload.jti)) {
                return res.status(401).json({error: "Token revocado"});
            }
            req.user = payload;
            next();
        } catch (err) {
            return res.status(401).json({error: "Token inválido o expirado"});
        }
    };
};
