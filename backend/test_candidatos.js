/**
 * Test de CANDIDATOS — Revisión completa del módulo
 * Ejecuta: node test_candidatos.js
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
    console.log(`  ${condition ? '✅' : '❌'} ${label}${detail ? ': ' + detail : ''}`);
    return condition;
}

async function main() {
    console.log('\n══════════════════════════════════════════════');
    console.log('  TEST MÓDULO: CANDIDATOS — Elecciones 2026   ');
    console.log('══════════════════════════════════════════════\n');

    const pw = 'Sedc' + '@' + 'uc' + '@' + 's0s6#';
    const login = await req('POST', '/api/auth/login', { cedula: 'admin', password: pw });
    check('Login admin', login.s === 200, 'HTTP ' + login.s);
    if (login.s !== 200) { console.error('ABORT'); process.exit(1); }
    const tk = login.b.token;

    // ── SECCIÓN 1: Obtener municipios (necesarios para creación) ──────────────
    console.log('\n[1] Obtener municipios para selectores...');
    const munis = await req('GET', '/api/admin/municipios', null, tk);
    check('GET /municipios retorna 200', munis.s === 200, 'HTTP ' + munis.s);
    check('Contiene los 41 municipios del Cauca', munis.b.length === 41, munis.b.length + ' municipios');
    check('Municipios tienen id y nombre', munis.b[0]?.id && munis.b[0]?.nombre);
    check('Tiene departamento Cauca', munis.b[0]?.departamento === 'Cauca', munis.b[0]?.departamento);
    check('Municipios ordenados alfabéticamente', munis.b[0]?.nombre <= munis.b[1]?.nombre, `${munis.b[0]?.nombre} <= ${munis.b[1]?.nombre}`);
    const muni_id = munis.b.find(m => m.nombre === 'Popayán') ? munis.b.find(m => m.nombre === 'Popayán').id : munis.b[0].id;
    const muni_nombre = munis.b.find(m => m.id === muni_id)?.nombre;

    // ── SECCIÓN 2: Crear candidatos válidos ─────────────────────────────────
    console.log('\n[2] Crear candidatos (casos válidos)...');
    const cand1 = await req('POST', '/api/admin/candidates', {
        nombre: 'ANA MILENA PÉREZ QUIÑONES',
        institucion: 'I.E. La Pedregosa',
        municipio_id: muni_id,
        descripcion: 'Rectora comprometida con la convivencia y la calidad educativa del departamento del Cauca'
    }, tk);
    check('POST candidato con todos los campos → 201', cand1.s === 201, 'HTTP ' + cand1.s);

    const cand2 = await req('POST', '/api/admin/candidates', {
        nombre: 'JORGE EDUARDO HURTADO MINA',
        institucion: 'I.E. Técnica Industrial',
        municipio_id: munis.b[1].id,
        descripcion: 'Coordinador con amplia trayectoria en procesos de mejoramiento institucional'
    }, tk);
    check('POST segundo candidato → 201', cand2.s === 201, 'HTTP ' + cand2.s);

    const cand3 = await req('POST', '/api/admin/candidates', {
        nombre: 'ROSA ELENA GUTIÉRREZ CIFUENTES',
        institucion: 'I.E. Agropecuaria',
        municipio_id: munis.b[5].id,
        descripcion: undefined   // descripción vacía — debe permitirse
    }, tk);
    check('POST candidato sin descripción (opcional) → 201', cand3.s === 201, 'HTTP ' + cand3.s);

    // ── SECCIÓN 3: Validaciones de campos obligatorios ──────────────────────
    console.log('\n[3] Validaciones de campos requeridos...');
    const sinNombre = await req('POST', '/api/admin/candidates', {
        institucion: 'IE Test', municipio_id: muni_id
    }, tk);
    check('POST sin nombre → 400', sinNombre.s === 400, 'HTTP ' + sinNombre.s + ' - ' + sinNombre.b.message);

    const sinInstitu = await req('POST', '/api/admin/candidates', {
        nombre: 'Candidato Sin Institución', municipio_id: muni_id
    }, tk);
    check('POST sin institución → 400', sinInstitu.s === 400, 'HTTP ' + sinInstitu.s + ' - ' + sinInstitu.b.message);

    const sinMunicipio = await req('POST', '/api/admin/candidates', {
        nombre: 'Candidato Sin Municipio', institucion: 'IE Test'
    }, tk);
    check('POST sin municipio → 400', sinMunicipio.s === 400, 'HTTP ' + sinMunicipio.s + ' - ' + sinMunicipio.b.message);

    // ── SECCIÓN 4: Acceso sin token ──────────────────────────────────────────
    console.log('\n[4] Seguridad — acceso sin autenticación...');
    const sinToken = await req('POST', '/api/admin/candidates', {
        nombre: 'Hack', institucion: 'IE', municipio_id: 1
    });
    check('POST sin token → 401', sinToken.s === 401, 'HTTP ' + sinToken.s);

    const sinTokenGet = await req('GET', '/api/election/candidates');
    check('GET candidatos sin token → 401', sinTokenGet.s === 401, 'HTTP ' + sinTokenGet.s);

    // ── SECCIÓN 5: Listar candidatos ──────────────────────────────────────────
    console.log('\n[5] Listar candidatos...');
    const listaRes = await req('GET', '/api/election/candidates', null, tk);
    check('GET /election/candidates → 200', listaRes.s === 200, 'HTTP ' + listaRes.s);
    const lista = listaRes.b;
    check('Retorna array', Array.isArray(lista), 'tipo: ' + typeof lista);
    check('Contiene candidatos recién creados', lista.length >= 3, lista.length + ' candidatos');
    check('Datos incluyen id, nombre, institucion, municipio', lista[0]?.id && lista[0]?.nombre && lista[0]?.institucion && lista[0]?.municipio, JSON.stringify(lista[0]).substring(0, 80));
    check('Candidatos ordenados alfabéticamente (ORDER BY)', lista[0]?.nombre <= lista[1]?.nombre, `"${lista[0]?.nombre}" <= "${lista[1]?.nombre}"`);

    console.log('\n  Candidatos registrados:');
    lista.forEach((c, i) => console.log(`    ${i + 1}. [ID:${c.id}] ${c.nombre} | ${c.institucion} | ${c.municipio}`));

    // ── SECCIÓN 6: Eliminar candidato SIN votos ───────────────────────────────
    console.log('\n[6] Eliminar candidato sin votos...');
    // Buscar un candidato recién creado que no tenga votos (Rosa Elena)
    const rosaElena = lista.find(c => c.nombre.includes('ROSA ELENA'));
    if (rosaElena) {
        const delRes = await req('DELETE', `/api/admin/candidates/${rosaElena.id}`, null, tk);
        check(`DELETE candidato ID:${rosaElena.id} sin votos → 200`, delRes.s === 200, 'HTTP ' + delRes.s + ' - ' + delRes.b.message);

        const listaPost = await req('GET', '/api/election/candidates', null, tk);
        const sigueExistiendo = listaPost.b.find(c => c.id === rosaElena.id);
        check('Candidato eliminado ya NO aparece en lista', !sigueExistiendo);
    } else {
        console.log('  ⚠️  Candidato ROSA ELENA no encontrado para prueba de eliminación');
    }

    // ── SECCIÓN 7: Eliminar candidato CON votos ───────────────────────────────
    console.log('\n[7] Protección: eliminar candidato CON votos...');
    // Buscar el candidato que tiene votos en la BD
    const resultsChk = await req('GET', '/api/admin/results', null, tk);
    const conVotos = resultsChk.b.resultados.find(r => parseInt(r.total_votos) > 0);
    if (conVotos) {
        const delProtected = await req('DELETE', `/api/admin/candidates/${conVotos.id}`, null, tk);
        check(`DELETE candidato ID:${conVotos.id} con ${conVotos.total_votos} voto(s) → 400`, delProtected.s === 400, 'HTTP ' + delProtected.s + ' - ' + delProtected.b.message);
    } else {
        console.log('  ⚠️  No hay candidatos con votos para probar protección');
    }

    // ── SECCIÓN 8: Votante no puede crear candidatos ──────────────────────
    console.log('\n[8] Seguridad — votante no puede crear candidatos (RBAC)...');
    // Crear votante de prueba temporal
    const tmpVoter = await req('POST', '/api/admin/voters', {
        cedula: '77777777', nombre: 'Temp', apellido: 'RBAC', municipio_id: muni_id, institucion: 'IE Test'
    }, tk);
    const voterLogin = await req('POST', '/api/auth/login', { cedula: '77777777', password: '77777777' });
    if (voterLogin.s === 200) {
        const voterToken = voterLogin.b.token;
        const voterCreate = await req('POST', '/api/admin/candidates', {
            nombre: 'Hack Voter', institucion: 'IE', municipio_id: muni_id
        }, voterToken);
        check('Votante NO puede crear candidato → 403', voterCreate.s === 403, 'HTTP ' + voterCreate.s + ' - ' + JSON.stringify(voterCreate.b));

        const voterDel = await req('DELETE', `/api/admin/candidates/1`, null, voterToken);
        check('Votante NO puede eliminar candidato → 403', voterDel.s === 403, 'HTTP ' + voterDel.s);
    }

    // ── RESUMEN FINAL ─────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════');
    console.log('  Estado actual de candidatos en la BD:');
    const final = await req('GET', '/api/election/candidates', null, tk);
    final.b.forEach((c, i) => console.log(`  ${i + 1}. ${c.nombre} | ${c.municipio}`));
    console.log('══════════════════════════════════════════════\n');
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
