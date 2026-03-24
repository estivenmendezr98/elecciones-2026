/**
 * Wrapper para eliminar la necesidad de bloques try-catch repetitivos en controladores express.
 * Pasa cualquier error al middleware de error global.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
