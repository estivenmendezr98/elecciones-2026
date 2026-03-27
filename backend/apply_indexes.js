const db = require('./config/db');

async function applyIndexes() {
    console.log("Aplicando índices para optimizar la base de datos...");
    try {
        await db.query(`CREATE INDEX IF NOT EXISTS idx_directivos_rol ON directivos_docentes(rol, estado);`);
        console.log("Índice de rol creado.");
        
        await db.query(`CREATE INDEX IF NOT EXISTS idx_directivos_cedula ON directivos_docentes(cedula);`);
        console.log("Índice de cédula creado.");
        
        await db.query(`CREATE INDEX IF NOT EXISTS idx_directivos_nombre ON directivos_docentes(nombre, apellido);`);
        console.log("Índice de nombre y apellido creado.");
        
        console.log("¡Todos los índices aplicados correctamente!");
    } catch (err) {
        console.error("Error aplicando índices:", err);
    } finally {
        process.exit();
    }
}

applyIndexes();
