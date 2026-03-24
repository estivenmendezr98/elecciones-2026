const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/softwareSEDCAUCA/elecciones2026-2/backend/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function check() {
    try {
        console.log('--- Candidatos ---');
        const candidates = await pool.query('SELECT * FROM candidatos');
        console.table(candidates.rows);

        console.log('\n--- Resumen de Votos ---');
        const results = await pool.query(`
            SELECT c.nombre, COUNT(v.id) as total_votos
            FROM candidatos c
            LEFT JOIN votos v ON c.id = v.id_candidato
            GROUP BY c.id, c.nombre
            ORDER BY total_votos DESC
        `);
        console.table(results.rows);

        console.log('\n--- Total Votos en tabla votos ---');
        const totalVotes = await pool.query('SELECT COUNT(*) FROM votos');
        console.log('Total:', totalVotes.rows[0].count);

        console.log('\n--- Usuarios que ya votaron (estado VOTO_REGISTRADO) ---');
        const usersVoted = await pool.query("SELECT COUNT(*) FROM directivos_docentes WHERE estado = 'VOTO_REGISTRADO'");
        console.log('Total:', usersVoted.rows[0].count);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
