const { body, validationResult } = require('express-validator');

/**
 * Middleware para capturar y responder errores de validación.
 */
const validateResults = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

/**
 * Reglas de validación para crear/editar votante.
 */
const voterValidationRules = [
    body('cedula').notEmpty().withMessage('La cédula es obligatoria').isNumeric().withMessage('La cédula debe ser numérica'),
    body('nombre').notEmpty().withMessage('El nombre es obligatorio').trim(),
    body('apellido').notEmpty().withMessage('El apellido es obligatorio').trim(),
    body('municipio_id').notEmpty().withMessage('El municipio es obligatorio'),
    body('institucion').notEmpty().withMessage('La institución es obligatoria').trim(),
    validateResults
];

/**
 * Reglas de validación para crear/editar candidato.
 */
const candidateValidationRules = [
    body('nombre').notEmpty().withMessage('El nombre del candidato es obligatorio').trim(),
    body('institucion').notEmpty().withMessage('La institución es obligatoria').trim(),
    body('municipio_id').notEmpty().withMessage('El municipio es obligatorio'),
    validateResults
];

module.exports = {
    voterValidationRules,
    candidateValidationRules
};
