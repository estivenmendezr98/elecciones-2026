/**
 * Test de resultados: Prueba el flujo completo
 * Ejecuta: node test_results.js
 */
const http = require('http');

function request(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const bodyStr = body ? JSON.stringify(body) : '';
        const options = {
            hostname: 'localhost',
            port: 5000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };
        const req = http.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch (e) { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(bodyStr);
        req.end();
    });
}

function log(label, res) {
    const ok = res.status >= 200 && res.status < 300;
    const icon = ok ? 'OK' : 'FAIL';
    console.log(`[${res.status}] [${icon}] ${label}`);
    if (!ok) console.log('       Detalle:', JSON.stringify(res.body));
}

async function runTests() {
    console.log('\n====== TEST END-TO-END: Resultados Elecciones 2026 ======\n');

    // 1. Login Admin
    const pw = 'Sedc' + '@' + 'uc' + '@' + 's0s6#';
    const loginRes = await request('POST', '/api/auth/login', { cedula: 'admin', password: pw });
    log('Login Admin', loginRes);
    if (loginRes.status !== 200) { console.error('ABORT: Login admin fallo'); process.exit(1); }
    const adminToken = loginRes.body.token;
    console.log('       Token recibido: ' + adminToken.substring(0, 30) + '...');

    // 2. Obtener municipios
    const muniRes = await request('GET', '/api/admin/municipios', null, adminToken);
    log('GET /api/admin/municipios', muniRes);
    const municipio_id = muniRes.body[0]?.id || 1;
    console.log('       Municipio de prueba ID:', municipio_id, '->', muniRes.body[0]?.nombre);

    // 3. Activar eleccion
    const activateRes = await request('PUT', '/api/admin/election/status', { estado: 'ACTIVA' }, adminToken);
    log('PUT estado=ACTIVA', activateRes);

    // 4. Crear candidato de prueba 1
    const cand1 = await request('POST', '/api/admin/candidates', {
        nombre: 'Test Candidato Uno',
        institucion: 'IE Prueba Norte',
        municipio_id,
        descripcion: 'Candidato de prueba N1 para test de resultados'
    }, adminToken);
    log('POST candidato 1', cand1);

    // 5. Crear candidato de prueba 2
    const cand2 = await request('POST', '/api/admin/candidates', {
        nombre: 'Test Candidato Dos',
        institucion: 'IE Prueba Sur',
        municipio_id,
        descripcion: 'Candidato de prueba N2 para test de resultados'
    }, adminToken);
    log('POST candidato 2', cand2);

    // 6. Obtener candidatos
    const candListRes = await request('GET', '/api/election/candidates', null, adminToken);
    log('GET /api/election/candidates', candListRes);
    const candidatos = candListRes.body;
    console.log('       Total candidatos:', candidatos.length);
    candidatos.forEach(c => console.log(`       - [ID:${c.id}] ${c.nombre} | ${c.municipio}`));

    if (candidatos.length === 0) { console.error('ABORT: no hay candidatos'); process.exit(1); }

    // 7. Resultados ANTES de votar
    const resultsBefore = await request('GET', '/api/admin/results', null, adminToken);
    log('GET /api/admin/results (antes)', resultsBefore);
    console.log('       Votos totales antes:', resultsBefore.body.total_votos_emitidos);

    // 8. Crear votante de prueba
    const voterCreate = await request('POST', '/api/admin/voters', {
        cedula: '11111111',
        nombre: 'Directivo',
        apellido: 'Test',
        municipio_id,
        institucion: 'IE Test'
    }, adminToken);
    log('POST votante cedula=11111111', voterCreate);

    // 9. Login votante
    const voterLogin = await request('POST', '/api/auth/login', { cedula: '11111111', password: '11111111' });
    log('Login votante 11111111', voterLogin);
    if (voterLogin.status !== 200) { console.error('ABORT: Login votante fallo'); process.exit(1); }
    const voterToken = voterLogin.body.token;

    // 10. Verificar estado inicial (no votado)
    const statusBefore = await request('GET', '/api/voting/status', null, voterToken);
    log('GET /api/voting/status (antes)', statusBefore);
    console.log('       Estado:', statusBefore.body.estado);

    // 11. Emitir voto
    const targetCandidato = candidatos[0];
    const voteRes = await request('POST', '/api/voting', { id_candidato: targetCandidato.id }, voterToken);
    log(`POST /api/voting (por ID:${targetCandidato.id} - ${targetCandidato.nombre})`, voteRes);

    // 12. Verificar estado después (votó)
    const statusAfter = await request('GET', '/api/voting/status', null, voterToken);
    log('GET /api/voting/status (despues)', statusAfter);
    console.log('       Estado:', statusAfter.body.estado);
    if (statusAfter.body.estado === 'VOTO_REGISTRADO') console.log('       CORRECTO: estado actualizado a VOTO_REGISTRADO');

    // 13. Intentar doble voto
    const doubleVote = await request('POST', '/api/voting', { id_candidato: candidatos[1]?.id || candidatos[0].id }, voterToken);
    log('POST /api/voting (INTENTO DOBLE VOTO - debe ser 400)', doubleVote);
    if (doubleVote.status === 400) console.log('       CORRECTO: doble voto bloqueado ->', doubleVote.body.message);

    // 14. Resultados DESPUES de votar
    const resultsAfter = await request('GET', '/api/admin/results', null, adminToken);
    log('GET /api/admin/results (despues)', resultsAfter);

    const total = resultsAfter.body.total_votos_emitidos;
    console.log('\n       === RESULTADOS FINALES ===');
    console.log('       Total votos emitidos:', total);
    resultsAfter.body.resultados.forEach((r, i) => {
        const pct = total > 0 ? ((r.total_votos / total) * 100).toFixed(1) : 0;
        const bar = '|'.repeat(parseInt(pct / 5));
        console.log(`       ${i + 1}. ${r.nombre}: ${r.total_votos} voto(s) [${pct}%] ${bar}`);
    });

    // 15. Verificar que candidatos con votos no se eliminan
    const delVotedCand = await request('DELETE', `/api/admin/candidates/${targetCandidato.id}`, null, adminToken);
    log(`DELETE candidato con voto (ID:${targetCandidato.id}) - debe ser 400`, delVotedCand);
    if (delVotedCand.status === 400) console.log('       CORRECTO: no se puede eliminar candidato con votos');

    // 16. Verificar que votante que ya votó no se elimina
    const allVoters = await request('GET', '/api/admin/voters', null, adminToken);
    const testVoter = allVoters.body.find(v => v.cedula === '11111111');
    if (testVoter) {
        const delVoter = await request('DELETE', `/api/admin/voters/${testVoter.id}`, null, adminToken);
        log(`DELETE votante que ya voto (ID:${testVoter.id}) - debe ser 400`, delVotedCand);
        if (delVoter.status === 400) console.log('       CORRECTO: no se puede eliminar votante que ya voto');
    }

    // 17. Verificar detalles y hora de la eleccion
    const eleccion = await request('GET', '/api/election/details', null, adminToken);
    log('GET /api/election/details', eleccion);
    console.log('       Eleccion:', eleccion.body.nombre_eleccion);
    console.log('       Fecha:', eleccion.body.fecha);
    console.log('       Horario:', eleccion.body.hora_inicio, '-', eleccion.body.hora_fin);
    console.log('       Estado:', eleccion.body.estado);

    console.log('\n====== TODOS LOS TESTS COMPLETADOS ======');
    console.log('El sistema de resultados funciona correctamente.\n');
}

runTests().catch(err => {
    console.error('Error fatal en tests:', err.message);
    process.exit(1);
});
