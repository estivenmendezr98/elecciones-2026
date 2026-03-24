const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/softwareSEDCAUCA/elecciones2026-2/backend/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function apiRequest(endpoint, method, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`http://localhost:5000${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API Error: ' + JSON.stringify(data));
    return data;
}

async function testVoteProcess() {
    try {
        console.log('--- STARTING VOTE TEST ---');

        // 1. Authenticate as admin to get token
        const adminData = await apiRequest('/api/auth/login', 'POST', {
            cedula: 'admin',
            password: 'Sedc@uc@s0s6#'
        });
        const adminToken = adminData.token;

        // 2. Create a new Voter
        const testCedula = '9000' + Math.floor(Math.random() * 9000);
        await apiRequest('/api/admin/voters', 'POST', {
            cedula: testCedula,
            nombre: 'Test',
            apellido: 'Voter',
            municipio_id: 1,
            institucion: 'Test Institucion'
        }, adminToken);

        console.log('✅ Created test voter:', testCedula);

        // 3. Login as Voter
        const voterData = await apiRequest('/api/auth/login', 'POST', {
            cedula: testCedula,
            password: testCedula
        });
        const voterToken = voterData.token;
        const voterId = voterData.id;
        console.log('✅ Logged in as test voter');

        // 4. Get a candidate
        const candidates = await apiRequest('/api/election/candidates', 'GET', null, voterToken);
        const candidateId = candidates[0].id;

        // 5. Cast vote
        await apiRequest('/api/voting', 'POST', {
            id_candidato: candidateId
        }, voterToken);
        console.log('✅ Vote successfully cast');

        // 6. Verify in DB
        const voteQuery = await pool.query('SELECT * FROM votos WHERE id_directivo = $1', [voterId]);
        if (voteQuery.rows.length === 1) {
            console.log('✅ VOTE FOUND IN DB: Synchronized properly!');
            console.log(voteQuery.rows[0]);
        } else {
            console.error('❌ VOTE NOT FOUND IN DB!');
        }

        const userQuery = await pool.query('SELECT estado FROM directivos_docentes WHERE id = $1', [voterId]);
        if (userQuery.rows[0].estado === 'VOTO_REGISTRADO') {
            console.log('✅ USER STATUS UPDATED CORRECTLY IN DB!');
        } else {
            console.error('❌ USER STATUS NOT UPDATED!');
        }

        // 7. Delete vote from DB
        await pool.query('DELETE FROM votos WHERE id_directivo = $1', [voterId]);
        console.log('✅ VOTE DELETED FROM DB');

        // 8. Verify User Status Reverted
        const userQuery2 = await pool.query('SELECT estado FROM directivos_docentes WHERE id = $1', [voterId]);
        if (userQuery2.rows[0].estado === 'ACTIVO') {
            console.log('✅ USER STATUS REVERTED CORRECTLY TO ACTIVO!');
        } else {
            console.error('❌ USER STATUS NOT REVERTED!', userQuery2.rows[0].estado);
        }

    } catch (err) {
        console.error('Error during test:', err.message);
    } finally {
        await pool.end();
    }
}

testVoteProcess();
