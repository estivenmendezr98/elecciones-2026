const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Generar JWT
const generateToken = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { cedula, password } = req.body;

    // Primero buscar si es un administrador
    const { rows: adminRows } = await db.query('SELECT * FROM administradores WHERE usuario = $1', [cedula]);

    if (adminRows.length > 0) {
        const adminUser = adminRows[0];

        if (adminUser.estado === 'INACTIVO') {
            return res.status(401).json({ message: 'Usuario inactivo, contacte al desarrollador' });
        }

        const isMatch = await bcrypt.compare(password, adminUser.contraseña);

        if (isMatch) {
            return res.json({
                id: adminUser.id,
                usuario: adminUser.usuario,
                nombre: adminUser.nombre,
                rol: adminUser.rol,
                token: generateToken(adminUser.id, adminUser.rol)
            });
        } else {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
    }

    // Si no es admin, buscar en la tabla de votantes (directivos_docentes)
    const { rows } = await db.query(`
        SELECT d.*, m.nombre as municipio_nombre 
        FROM directivos_docentes d
        LEFT JOIN municipios m ON d.municipio_id = m.id
        WHERE d.cedula = $1
    `, [cedula]);

    if (rows.length === 0) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = rows[0];

    // Verificar si el usuario está inactivo (solo bloquear estado 'INACTIVO' explícito)
    if (user.estado === 'INACTIVO') {
        return res.status(401).json({ message: 'Usuario inactivo, contacte al administrador' });
    }

    const isMatch = await bcrypt.compare(password, user.contraseña);

    if (isMatch) {
        res.json({
            id: user.id,
            cedula: user.cedula,
            nombre: user.nombre,
            apellido: user.apellido,
            institucion: user.institucion,
            municipio: user.municipio_nombre,
            rol: user.rol,
            token: generateToken(user.id, user.rol)
        });
    } else {
        res.status(401).json({ message: 'Credenciales inválidas' });
    }
});

module.exports = {
    loginUser
};
