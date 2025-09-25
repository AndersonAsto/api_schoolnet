const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function generateAccessToken(user) {
  const jti = crypto.randomUUID();
  return jwt.sign(
    { sub: String(user.id), username: user.userName, role: user.role, jti },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
      issuer: process.env.JWT_ISS || "schoolnet-api"
    }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: String(user.id) },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      issuer: process.env.JWT_ISS || "schoolnet-api"
    }
  );
}

module.exports = { generateAccessToken, generateRefreshToken };
