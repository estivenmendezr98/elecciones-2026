const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Obtener detalles de la elección
// @route   GET /api/election/details
// @access  Private
const getElectionDetails = asyncHandler(async (req, res) => {
    const { rows } = await db.query('SELECT * FROM eleccion ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) {
        res.status(404);
        throw new Error('No hay elecciones configuradas');
    }
    res.json(rows[0]);
});

// @desc    Obtener lista de candidatos
// @route   GET /api/election/candidates
// @access  Private
const getCandidates = asyncHandler(async (req, res) => {
    const { rows } = await db.query(`
      SELECT c.id, c.nombre, c.descripcion, c.institucion, c.foto, m.nombre as municipio 
      FROM candidatos c
      LEFT JOIN municipios m ON c.municipio_id = m.id
      ORDER BY c.nombre ASC
    `);
    res.json(rows);
});

module.exports = {
    getElectionDetails,
    getCandidates
};
