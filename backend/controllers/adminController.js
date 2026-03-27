const db = require('../config/db');
const bcrypt = require('bcrypt');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Obtener resultados de la elección
// @route   GET /api/admin/results
const getResults = asyncHandler(async (req, res) => {
    // Forzar que no haya caché para resultados en tiempo real
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    const { rows } = await db.query(`
      SELECT c.id, c.nombre, c.foto, c.descripcion, c.institucion, m.nombre as municipio, COUNT(v.id) as total_votos
      FROM candidatos c
      LEFT JOIN votos v ON c.id = v.id_candidato
      LEFT JOIN municipios m ON c.municipio_id = m.id
      GROUP BY c.id, m.nombre
      ORDER BY total_votos DESC
    `);

    // Obtener total de votos
    const totalVotesQuery = await db.query('SELECT COUNT(id) as total FROM votos');
    const totalVotes = parseInt(totalVotesQuery.rows[0].total, 10);

    // Obtener total del censo (votantes activos)
    const censusQuery = await db.query("SELECT COUNT(id) as total FROM directivos_docentes WHERE rol = 'VOTANTE'");
    const totalCensus = parseInt(censusQuery.rows[0].total, 10);

    // Castear total_votos de cada candidato a entero
    const resultados = rows.map(r => ({ ...r, total_votos: parseInt(r.total_votos, 10) }));

    res.json({
        resultados,
        total_votos_emitidos: totalVotes,
        total_censo: totalCensus
    });
});

// @desc    Obtener todos los directivos (Censo, excluye admin)
// @route   GET /api/admin/voters
const getVoters = asyncHandler(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = "d.rol = 'VOTANTE'";
    const queryParams = [];

    if (search) {
        whereClause += " AND (d.cedula ILIKE $1 OR d.nombre ILIKE $1 OR d.apellido ILIKE $1)";
        queryParams.push(`%${search}%`);
    }

    // Contar el total para la paginación
    const countQuery = `SELECT COUNT(d.id) FROM directivos_docentes d WHERE ${whereClause}`;
    const { rows: countRows } = await db.query(countQuery, queryParams);
    const total = parseInt(countRows[0].count, 10);

    // Obtener los datos de la página
    // Añadimos limit y offset al final de queryParams
    queryParams.push(limit, offset);
    const dataQuery = `
       SELECT d.id, d.cedula, d.nombre, d.apellido, m.nombre as municipio, d.institucion, d.estado
       FROM directivos_docentes d
       LEFT JOIN municipios m ON d.municipio_id = m.id
       WHERE ${whereClause}
       ORDER BY d.apellido, d.nombre
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const { rows } = await db.query(dataQuery, queryParams);
    
    res.json({
        data: rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    });
});

// @desc    Registrar un nuevo directivo votante
// @route   POST /api/admin/voters
const createVoter = asyncHandler(async (req, res) => {
    const { cedula, nombre, apellido, municipio_id, institucion } = req.body;

    // El middleware validator se encarga de los campos obligatorios

    try {
        // La contraseña inicial es la misma cédula, hasheada con bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(cedula, salt);
        await db.query(
            `INSERT INTO directivos_docentes (cedula, nombre, apellido, municipio_id, institucion, contraseña, estado, rol)
             VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVO', 'VOTANTE')`,
            [cedula, nombre, apellido, municipio_id, institucion, hashed]
        );
        res.status(201).json({ message: 'Directivo registrado exitosamente' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: `La cédula ${cedula} ya está registrada` });
        }
        throw error; // El errorHandler global lo captura
    }
});

// @desc    Eliminar un directivo del censo
// @route   DELETE /api/admin/voters/:id
const deleteVoter = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar que no haya votado aún
    const voteCheck = await db.query('SELECT id FROM votos WHERE id_directivo = $1', [id]);
    if (voteCheck.rows.length > 0) {
        return res.status(400).json({ message: 'No se puede eliminar un directivo que ya emitió su voto' });
    }

    await db.query('DELETE FROM directivos_docentes WHERE id = $1 AND rol = $2', [id, 'VOTANTE']);
    res.json({ message: 'Directivo eliminado' });
});

// @desc    Importar masivamente directivos desde TXT/CSV
// @route   POST /api/admin/voters/import
const importVoters = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }

    // Leemos como latin1 para tratar correctamente las tildes del archivo Windows TXT
    const fileContent = req.file.buffer.toString('latin1');
    const lines = fileContent.replace(/\r\n/g, '\n').split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
        return res.status(400).json({ message: 'El archivo está vacío o no tiene el formato correcto' });
    }

    const headers = lines[0].split(';');
    const idxCedula = headers.findIndex(h => h.trim() === 'CODEMPLEADO');
    const idxNombre = headers.findIndex(h => h.trim() === 'EMPLEADO');
    const idxMunicipio = headers.findIndex(h => h.trim() === 'CIUDADLABORAL');
    const idxInstitucion = headers.findIndex(h => h.trim() === 'CENTROCOSTO');

    if (idxCedula === -1 || idxNombre === -1 || idxMunicipio === -1 || idxInstitucion === -1) {
        return res.status(400).json({ message: 'El archivo no contiene las cabeceras requeridas (CODEMPLEADO, EMPLEADO, CIUDADLABORAL, CENTROCOSTO)' });
    }

    const { rows: dbMunicipios } = await db.query('SELECT id, nombre FROM municipios');
    
    const normalize = (str) => {
        if (!str) return '';
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    };

    const municipioMap = {};
    dbMunicipios.forEach(m => {
        municipioMap[normalize(m.nombre)] = m.id;
    });

    const { rows: existingRows } = await db.query('SELECT cedula FROM directivos_docentes');
    const existingCedulas = new Set(existingRows.map(r => r.cedula));

    const toInsert = [];
    
    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(';');
        if (columns.length <= Math.max(idxCedula, idxNombre, idxMunicipio, idxInstitucion)) continue;
        
        const cedula = columns[idxCedula]?.trim();
        if (!cedula || existingCedulas.has(cedula)) continue;
        
        const nombreCompleto = columns[idxNombre]?.trim();
        if (!nombreCompleto) continue;

        let ciudad = columns[idxMunicipio]?.trim() || '';
        ciudad = ciudad.split('(')[0].trim();
        
        const institucion = columns[idxInstitucion]?.trim() || '-';
        
        const parts = nombreCompleto.split(' ').filter(Boolean);
        let apellido = '-';
        let nombre = nombreCompleto;
        
        if (parts.length >= 3) {
            apellido = parts.slice(0, 2).join(' ');
            nombre = parts.slice(2).join(' ');
        } else if (parts.length === 2) {
            apellido = parts[0];
            nombre = parts[1];
        }

        const munId = municipioMap[normalize(ciudad)] || null;

        toInsert.push({ cedula, nombre, apellido, municipio_id: munId, institucion });
        existingCedulas.add(cedula);
    }

    if (toInsert.length === 0) {
        return res.json({ message: 'Todos los directivos ya se encuentran registrados o el archivo no tiene datos nuevos.', importados: 0 });
    }

    let imported = 0;
    let errors = 0;
    const batchSize = 100;

    for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const salt = await bcrypt.genSalt(10);
        
        let values = [];
        let queryParams = [];
        let counter = 1;

        for (const item of batch) {
            const hashed = await bcrypt.hash(item.cedula, salt);
            values.push(`($${counter++}, $${counter++}, $${counter++}, $${counter++}, $${counter++}, $${counter++}, 'ACTIVO', 'VOTANTE')`);
            queryParams.push(item.cedula, item.nombre, item.apellido, item.municipio_id, item.institucion, hashed);
        }

        const insertQuery = `
            INSERT INTO directivos_docentes (cedula, nombre, apellido, municipio_id, institucion, contraseña, estado, rol)
            VALUES ${values.join(', ')}
            ON CONFLICT (cedula) DO NOTHING
        `;
        
        try {
            await db.query(insertQuery, queryParams);
            imported += batch.length;
        } catch(error) {
            console.error("Error importando lote:", error);
            errors += batch.length;
        }
    }

    res.json({ message: `Importación finalizada. ${imported} nuevos directivos registrados.`, importados: imported, errores: errors });
});

// @desc    Crear candidato
// @route   POST /api/admin/candidates
const createCandidate = asyncHandler(async (req, res) => {
    const { nombre, institucion, municipio_id, descripcion } = req.body;
    const foto = req.file ? `/uploads/candidates/${req.file.filename}` : null;

    // Validación ya realizada por middleware

    await db.query(
        `INSERT INTO candidatos (nombre, institucion, municipio_id, descripcion, foto) VALUES ($1, $2, $3, $4, $5)`,
        [nombre, institucion, municipio_id, descripcion, foto]
    );
    res.status(201).json({ message: 'Candidato creado exitosamente' });
});

// @desc    Actualizar candidato
// @route   PUT /api/admin/candidates/:id
const updateCandidate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nombre, institucion, municipio_id, descripcion } = req.body;

    let updateQuery;
    let queryParams;

    if (req.file) {
        const foto = `/uploads/candidates/${req.file.filename}`;
        updateQuery = `UPDATE candidatos SET nombre = $1, institucion = $2, municipio_id = $3, descripcion = $4, foto = $5 WHERE id = $6`;
        queryParams = [nombre, institucion, municipio_id, descripcion, foto, id];
    } else {
        updateQuery = `UPDATE candidatos SET nombre = $1, institucion = $2, municipio_id = $3, descripcion = $4 WHERE id = $5`;
        queryParams = [nombre, institucion, municipio_id, descripcion, id];
    }

    const result = await db.query(updateQuery, queryParams);

    if (result.rowCount === 0) {
        res.status(404);
        throw new Error('Candidato no encontrado');
    }

    res.json({ message: 'Candidato actualizado exitosamente' });
});

// @desc    Eliminar candidato
// @route   DELETE /api/admin/candidates/:id
const deleteCandidate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const voteCheck = await db.query('SELECT id FROM votos WHERE id_candidato = $1', [id]);
    if (voteCheck.rows.length > 0) {
        return res.status(400).json({ message: 'No se puede eliminar un candidato que ya recibió votos' });
    }
    await db.query('DELETE FROM candidatos WHERE id = $1', [id]);
    res.json({ message: 'Candidato eliminado' });
});

// @desc    Obtener municipios
// @route   GET /api/admin/municipios
const getMunicipios = asyncHandler(async (req, res) => {
    const { rows } = await db.query('SELECT id, nombre, departamento FROM municipios ORDER BY nombre');
    res.json(rows);
});

// @desc    Cambiar estado de la elección
// @route   PUT /api/admin/election/status
const changeElectionStatus = asyncHandler(async (req, res) => {
    const { estado } = req.body;
    await db.query(`UPDATE eleccion SET estado = $1 WHERE id = (SELECT id FROM eleccion ORDER BY id DESC LIMIT 1)`, [estado]);
    res.json({ message: 'Estado actualizado correctamente' });
});

module.exports = {
    getResults,
    getVoters,
    createVoter,
    deleteVoter,
    importVoters,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    getMunicipios,
    changeElectionStatus
};
