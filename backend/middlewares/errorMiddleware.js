/**
 * Middleware para el manejo global de errores.
 * Captura todos los errores lanzados en la aplicación y responde con un formato JSON consistente.
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    console.error(`[Error] ${req.method} ${req.url}:`, err.message);

    res.status(statusCode).json({
        message: err.message || 'Error interno del servidor',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorHandler;
