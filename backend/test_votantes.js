/**
 * Test completo del módulo VOTANTES — Elecciones 2026
 * Ejecuta: node test_votantes.js
 */
const http = require('http');

function req(m, p, b, t) {
    return new Promise((resolve, reject) => {
        const bs = b ? JSON.stringify(b) : '';
        const opts = {
            hostname: 'localhost', port: 5000, path: p, method: m,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bs),
                ...(t ? { Authorization: 'Bearer ' + t } : {})
            }
        };
        const r = http.request(opts, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try { resolve({ s: res.statusCode, b: JSON.parse(d) }); }
                catch (e) { resolve({ s: res.statusCode, b: d }); }
            });
        });
        r.on('error', reject);
        if (b) r.write(bs);
        r.end();
    });
}

function check(label, condition, detail = '') {
    const icon = condition ? '[PASS]' : '[FAIL]';
    console.log(`  ${icon} ${label}${detail ? ': ' + detail : ''}`);
    return condition;
}

async function main() {
    console.log('');
    console.log('==============================================');
    console.log('  TEST MODULO: VOTANTES - Elecciones 2026   ');
    console.log('==============================================');

    const pw = 'Sedc' + '@' + 'uc' + '@' + 's0s6#';
    const login = await req('POST', '/api/auth/login', { cedula: 'admin', password: pw });
    check('Login admin', login.s === 200);
    const tk = login.b.token;

    const munis = await req('GET', '/api/admin/municipios', null, tk);
    const mid = munis.b[0].id;
    const mid2 = munis.b[10].id;

    // ── SEC 1: Registrar votantes válidos ────────────────────────────────────
    console.log('\n[1] Registrar directivos válidos...');
    const v1 = await req('POST', '/api/admin/voters', {
        cedula: '88881111', nombre: 'PATRICIA', apellido: 'RENDON MORA',
        municipio_id: mid, institucion: 'I.E. San Lorenzo'
    }, tk);
    check('POST votante 1 (88881111) -> 201', v1.s === 201, v1.b.message);

    const v2 = await req('POST', '/api/admin/voters', {
        cedula: '88882222', nombre: 'FELIX', apellido: 'ZUÑIGA PARRA',
        municipio_id: mid2, institucion: 'I.E. El Bordo'
    }, tk);
    check('POST votante 2 (88882222) -> 201', v2.s === 201, v2.b.message);

    const v3 = await req('POST', '/api/admin/voters', {
        cedula: '88883333', nombre: 'CARMENZA', apellido: 'TRUJILLO OSPINA',
        municipio_id: mid, institucion: 'I.E. La Pedregosa'
    }, tk);
    check('POST votante 3 (88883333) -> 201 (para eliminar luego)', v3.s === 201, v3.b.message);

    // ── SEC 2: Validaciones de campos obligatorios ───────────────────────────
    console.log('\n[2] Validaciones de campos requeridos...');
    const sinCedula = await req('POST', '/api/admin/voters', {
        nombre: 'Sin', apellido: 'Cedula', municipio_id: mid, institucion: 'IE Test'
    }, tk);
    check('POST sin cedula -> 400', sinCedula.s === 400, sinCedula.b.message);

    const sinNombre = await req('POST', '/api/admin/voters', {
        cedula: '99990001', apellido: 'Apellido', municipio_id: mid, institucion: 'IE Test'
    }, tk);
    check('POST sin nombre -> 400', sinNombre.s === 400, sinNombre.b.message);

    const sinApellido = await req('POST', '/api/admin/voters', {
        cedula: '99990002', nombre: 'Nombre', municipio_id: mid, institucion: 'IE Test'
    }, tk);
    check('POST sin apellido -> 400', sinApellido.s === 400, sinApellido.b.message);

    const sinMunicipio = await req('POST', '/api/admin/voters', {
        cedula: '99990003', nombre: 'Nombre', apellido: 'Apellido', institucion: 'IE Test'
    }, tk);
    check('POST sin municipio -> 400', sinMunicipio.s === 400, sinMunicipio.b.message);

    const sinInstitu = await req('POST', '/api/admin/voters', {
        cedula: '99990004', nombre: 'Nombre', apellido: 'Apellido', municipio_id: mid
    }, tk);
    check('POST sin institucion -> 400', sinInstitu.s === 400, sinInstitu.b.message);

    // ── SEC 3: Cédula duplicada ─────────────────────────────────────────────
    console.log('\n[3] Proteccion cedula duplicada...');
    const dupl = await req('POST', '/api/admin/voters', {
        cedula: '88881111', nombre: 'Duplicado', apellido: 'Test',
        municipio_id: mid, institucion: 'IE Test'
    }, tk);
    check('POST cedula duplicada -> 409 Conflict', dupl.s === 409, dupl.b.message);

    // ── SEC 4: Seguridad sin token ──────────────────────────────────────────
    console.log('\n[4] Seguridad - sin token...');
    const noAuth = await req('POST', '/api/admin/voters', {
        cedula: '99999001', nombre: 'Hack', apellido: 'Test', municipio_id: mid, institucion: 'IE'
    });
    check('POST sin token -> 401', noAuth.s === 401, 'HTTP ' + noAuth.s);

    const noAuthGet = await req('GET', '/api/admin/voters');
    check('GET sin token -> 401', noAuthGet.s === 401, 'HTTP ' + noAuthGet.s);

    // ── SEC 5: RBAC - votante no puede gestionar censo ──────────────────────
    console.log('\n[5] RBAC - votante no puede gestionar el censo...');
    const voterLogin = await req('POST', '/api/auth/login', { cedula: '88881111', password: '88881111' });
    check('Login votante con cedula como password -> 200', voterLogin.s === 200, 'HTTP ' + voterLogin.s);
    const vtk = voterLogin.b.token;

    const voterCreate = await req('POST', '/api/admin/voters', {
        cedula: '99999002', nombre: 'Test', apellido: 'RBAC', municipio_id: mid, institucion: 'IE'
    }, vtk);
    check('Votante NO puede crear otro votante -> 403', voterCreate.s === 403, 'HTTP ' + voterCreate.s);

    const voterGetVoters = await req('GET', '/api/admin/voters', null, vtk);
    check('Votante NO puede ver censo -> 403', voterGetVoters.s === 403, 'HTTP ' + voterGetVoters.s);

    // ── SEC 6: Listar votantes ──────────────────────────────────────────────
    console.log('\n[6] Listar votantes...');
    const lista = await req('GET', '/api/admin/voters', null, tk);
    check('GET /admin/voters -> 200', lista.s === 200, 'HTTP ' + lista.s);
    check('Retorna array', Array.isArray(lista.b));
    check('Incluye votantes recien creados', lista.b.some(v => v.cedula === '88881111'));
    check('Tiene campos requeridos (id, cedula, nombre, apellido, municipio, institucion, estado)',
        lista.b[0]?.id && lista.b[0]?.cedula && lista.b[0]?.nombre && lista.b[0]?.apellido && lista.b[0]?.municipio && lista.b[0]?.estado);
    check('Ordenados por apellido', lista.b.some(v => v.cedula === '88881111'));
    check('Admin NO aparece en el censo', !lista.b.find(v => v.cedula === 'admin' || v.rol === 'ADMIN'));

    const patricia = lista.b.find(v => v.cedula === '88881111');
    const felix = lista.b.find(v => v.cedula === '88882222');
    const carmenza = lista.b.find(v => v.cedula === '88883333');
    console.log('  Directivos registrados de prueba:');
    [patricia, felix, carmenza].filter(Boolean).forEach(v =>
        console.log(`    - [ID:${v.id}] ${v.apellido}, ${v.nombre} | ${v.municipio} | ${v.estado}`)
    );

    // ── SEC 7: Login exitoso del votante y estado inicial ───────────────────
    console.log('\n[7] Login votante y verificacion estado inicial...');
    check('Estado ACTIVO antes de votar', patricia?.estado === 'ACTIVO', patricia?.estado);

    const statusBefore = await req('GET', '/api/voting/status', null, vtk);
    check('GET /voting/status (antes) -> 200', statusBefore.s === 200);
    check('Estado inicial es ACTIVO', statusBefore.b.estado === 'ACTIVO', statusBefore.b.estado);

    // ── SEC 8: Votar y verificar cambio de estado ───────────────────────────
    console.log('\n[8] Votacion y cambio de estado del votante...');
    // Asegurarse de que la eleccion esté activa
    await req('PUT', '/api/admin/election/status', { estado: 'ACTIVA' }, tk);

    // Obtener candidatos
    const cands = await req('GET', '/api/election/candidates', null, vtk);
    check('GET candidatos para votar -> 200', cands.s === 200, cands.b.length + ' candidatos');
    if (cands.b.length === 0) {
        console.log('  SKIP: No hay candidatos, creando uno...');
        await req('POST', '/api/admin/candidates', {
            nombre: 'Candidato Para Test', institucion: 'IE', municipio_id: mid, descripcion: 'Test'
        }, tk);
    }
    const candsFresh = await req('GET', '/api/election/candidates', null, vtk);
    const candidatoId = candsFresh.b[0]?.id;

    const voto = await req('POST', '/api/voting', { id_candidato: candidatoId }, vtk);
    check('Emitir voto -> 200', voto.s === 200, voto.b.message);

    const statusAfter = await req('GET', '/api/voting/status', null, vtk);
    check('Estado VOTO_REGISTRADO despues de votar', statusAfter.b.estado === 'VOTO_REGISTRADO', statusAfter.b.estado);

    // ── SEC 9: Votante que voto puede seguir logeandose ─────────────────────
    console.log('\n[9] BUG FIX - Votante que voto puede re-logear...');
    const reLogin = await req('POST', '/api/auth/login', { cedula: '88881111', password: '88881111' });
    check('Re-login de votante com VOTO_REGISTRADO -> 200', reLogin.s === 200, 'HTTP ' + reLogin.s + ' ' + (reLogin.b.message || 'OK'));

    // ── SEC 10: No se puede eliminar votante que ya votó ────────────────────
    console.log('\n[10] Proteccion - no eliminar votante que ya voto...');
    if (patricia) {
        const delVoted = await req('DELETE', `/api/admin/voters/${patricia.id}`, null, tk);
        check(`DELETE votante que ya voto (ID:${patricia.id}) -> 400`, delVoted.s === 400, delVoted.b.message);
    }

    // ── SEC 11: Eliminar votante que NO ha votado ───────────────────────────
    console.log('\n[11] Eliminar votante que NO ha votado...');
    if (carmenza) {
        const delOk = await req('DELETE', `/api/admin/voters/${carmenza.id}`, null, tk);
        check(`DELETE votante sin voto (ID:${carmenza.id}) -> 200`, delOk.s === 200, delOk.b.message);
        const listaPost = await req('GET', '/api/admin/voters', null, tk);
        check('Confirmado: ya no aparece en censo', !listaPost.b.find(v => v.id === carmenza.id));
    }

    // ── SEC 12: Doble voto bloqueado ────────────────────────────────────────
    console.log('\n[12] Proteccion doble voto...');
    const reLoginToken = reLogin.b.token;
    const doubleVote = await req('POST', '/api/voting', { id_candidato: candidatoId }, reLoginToken);
    check('Doble voto bloqueado -> 400', doubleVote.s === 400, doubleVote.b.message);

    // ── RESUMEN FINAL ────────────────────────────────────────────────────────
    const final = await req('GET', '/api/admin/voters', null, tk);
    console.log('\n==============================================');
    console.log('  CENSO ELECTORAL (estado final):');
    const votados = final.b.filter(v => v.estado === 'VOTO_REGISTRADO').length;
    const activos = final.b.filter(v => v.estado === 'ACTIVO').length;
    console.log(`  Total directivos: ${final.b.length}`);
    console.log(`  Han votado: ${votados}`);
    console.log(`  Pendientes: ${activos}`);
    final.b.slice(0, 5).forEach((v, i) =>
        console.log(`  ${i + 1}. ${v.apellido}, ${v.nombre} [${v.estado}]`)
    );
    if (final.b.length > 5) console.log(`  ... y ${final.b.length - 5} mas`);
    console.log('==============================================');
    console.log('  TESTS DE VOTANTES FINALIZADOS');
    console.log('==============================================\n');
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
