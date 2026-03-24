const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/softwareSEDCAUCA/elecciones2026-2/backend/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function verifyAll() {
    try {
        const data = {};

        const eleccion = await pool.query('SELECT * FROM eleccion');
        data.eleccion = eleccion.rows;

        const countMuni = await pool.query('SELECT COUNT(*) FROM municipios');
        data.municipiosCount = countMuni.rows[0].count;

        const candidatos = await pool.query(`
            SELECT c.id, c.nombre, c.institucion, m.nombre AS municipio, c.fecha_registro 
            FROM candidatos c 
            JOIN municipios m ON c.municipio_id = m.id
        `);
        data.candidatos = candidatos.rows;

        const admins = await pool.query('SELECT id, usuario, nombre, estado, rol FROM administradores');
        data.administradores = admins.rows;

        const countDirectivos = await pool.query('SELECT estado, COUNT(*) as cantidad FROM directivos_docentes GROUP BY estado');
        data.directivosResumen = countDirectivos.rows;

        const sampleDirectivos = await pool.query('SELECT id, cedula, nombre, apellido, estado FROM directivos_docentes LIMIT 5');
        data.directivosSample = sampleDirectivos.rows;

        const votos = await pool.query(`
            SELECT v.id, d.cedula as votante, c.nombre as candidato, v.fecha_voto, v.ip_votante 
            FROM votos v
            JOIN directivos_docentes d ON v.id_directivo = d.id
            JOIN candidatos c ON v.id_candidato = c.id
        `);
        data.votos = votos.rows;

        console.log(JSON.stringify(data, null, 2));

    } catch (err) {
        console.error('Error during verification:', err);
    } finally {
        await pool.end();
    }
}

verifyAll();
