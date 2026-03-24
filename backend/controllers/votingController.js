const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Emitir voto
// @route   POST /api/voting
// @access  Private Voter
const castVote = asyncHandler(async (req, res) => {
    const { id_candidato } = req.body;
    const id_directivo = req.user.id;

    if (req.user.rol === 'ADMIN') {
        return res.status(403).json({ message: 'Los administradores no pueden votar' });
    }

    // Capturar IP
    const ip_votante = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Validar horario de elección (Asumiendo que hay una sola eleccion activa)
        const electionQuery = await client.query('SELECT * FROM eleccion ORDER BY id DESC LIMIT 1');
        if (electionQuery.rows.length === 0) {
            throw new Error('Elección no encontrada');
        }
        const eleccion = electionQuery.rows[0];

        if (eleccion.estado !== 'PROGRAMADA' && eleccion.estado !== 'ACTIVA') {
            res.status(400);
            throw new Error('La elección no está activa');
        }

        // 2. Verificar si ya votó
        const verifyVote = await client.query('SELECT id FROM votos WHERE id_directivo = $1', [id_directivo]);
        if (verifyVote.rows.length > 0) {
            res.status(400);
            throw new Error('Ya has emitido tu voto');
        }

        // 3. Registrar el voto
        await client.query(
            'INSERT INTO votos (id_directivo, id_candidato, ip_votante) VALUES ($1, $2, $3)',
            [id_directivo, id_candidato, ip_votante]
        );

        // Actualizar estado del usuario a 'VOTÓ'
        await client.query('UPDATE directivos_docentes SET estado = $1 WHERE id = $2', ['VOTO_REGISTRADO', id_directivo]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Voto registrado exitosamente' });

    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            res.status(400).json({ message: 'Ya has emitido tu voto (Error DB)' });
        } else {
            throw error; // Let global handler handle it
        }
    } finally {
        client.release();
    }
});

// @desc    Obtener estado de mi voto
// @route   GET /api/voting/status
// @access  Private Voter
const getMyVoteStatus = asyncHandler(async (req, res) => {
    const { rows } = await db.query(`
        SELECT d.estado, c.nombre as candidato_nombre, c.foto as candidato_foto
        FROM directivos_docentes d
        LEFT JOIN votos v ON d.id = v.id_directivo
        LEFT JOIN candidatos c ON v.id_candidato = c.id
        WHERE d.id = $1
    `, [req.user.id]);
    res.json(rows[0]);
});

module.exports = {
    castVote,
    getMyVoteStatus
};
