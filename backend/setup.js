/**
 * Script de inicialización de base de datos.
 * Ejecuta: node setup.js
 * 
 * 1. Crea la base de datos 'elecciones_2026' si no existe.
 * 2. Ejecuta el schema SQL.
 * 3. Inserta el usuario admin con contraseña hasheada correctamente con bcrypt.
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const BASE_CONFIG = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
};

const DB_NAME = process.env.DB_NAME || 'elecciones_2026';

async function createDatabaseIfNotExists() {
    // Conectar a la BD 'postgres' que siempre existe para crear la BD objetivo
    const adminPool = new Pool({ ...BASE_CONFIG, database: 'postgres' });
    const client = await adminPool.connect();
    try {
        const result = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [DB_NAME]
        );
        if (result.rows.length === 0) {
            // No existe, crearla
            await client.query(`CREATE DATABASE ${DB_NAME}`);
            console.log(`✅ Base de datos '${DB_NAME}' creada.`);
        } else {
            console.log(`ℹ️  Base de datos '${DB_NAME}' ya existe.`);
        }
    } finally {
        client.release();
        await adminPool.end();
    }
}

async function initializeSchema() {
    const appPool = new Pool({ ...BASE_CONFIG, database: DB_NAME });
    const client = await appPool.connect();
    try {
        console.log('🚀 Iniciando configuración del schema...');

        // Ejecutar schema SQL
        const sqlPath = path.join(__dirname, '..', 'db', 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);
        console.log('✅ Schema SQL ejecutado exitosamente.');

        // Contraseña del admin: Sedc@uc@s0s6#  (usando concat para evitar problemas de escape)
        const adminPassword = ['Sedc', '@', 'uc', '@', 's0s6#'].join('');
        const adminHash = await bcrypt.hash(adminPassword, 10);

        // Insertar o actualizar el admin en la nueva tabla administradores
        const existing = await client.query(
            `SELECT id FROM administradores WHERE usuario = 'admin'`
        );

        if (existing.rows.length > 0) {
            await client.query(
                `UPDATE administradores SET contraseña = $1 WHERE usuario = 'admin'`,
                [adminHash]
            );
            console.log('✅ Contraseña del administrador actualizada con bcrypt.');
        } else {
            await client.query(
                `INSERT INTO administradores (usuario, nombre, contraseña, estado, rol)
         VALUES ('admin', 'Administrador Sistema', $1, 'ACTIVO', 'ADMIN')`,
                [adminHash]
            );
            console.log('✅ Usuario administrador creado en la tabla administradores.');
        }

        // Eliminar el admin de la tabla directivos_docentes si previamente existía allí por error
        await client.query(
            `DELETE FROM directivos_docentes WHERE cedula = 'admin'`
        );
        console.log('✅ Limpieza de admin en directivos_docentes completada.');

        console.log('\n======================================');
        console.log('🎉 Base de datos configurada con éxito!');
        console.log('======================================');
        console.log('Credenciales de acceso:');
        console.log('  Admin   -> usuario: admin     | contraseña: Sedc@uc@s0s6#');
        console.log('  Votante -> usuario: (cédula)  | contraseña: (misma cédula)');
        console.log('======================================\n');

    } finally {
        client.release();
        await appPool.end();
    }
}

async function setup() {
    try {
        await createDatabaseIfNotExists();
        await initializeSchema();
    } catch (err) {
        if (err.code === '28P01') {
            console.error('❌ Error de autenticación: verifica DB_USER y DB_PASSWORD en el archivo .env');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('❌ No se puede conectar a PostgreSQL. Asegúrate de que el servicio esté corriendo en el puerto', BASE_CONFIG.port);
        } else {
            console.error('❌ Error:', err.message);
        }
        process.exit(1);
    }
}

setup();
