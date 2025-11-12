// middlewares/error.middleware.js
module.exports = (err, req, res, next) => {
    console.error("Error:", err.message || err);
    res.status(500).json({
        error: "Error interno del servidor",
        detalle: err.message,
    });
};
