-- Schema para elecciones 2026

-- Secuencias
CREATE SEQUENCE IF NOT EXISTS sq_municipios START 1;
CREATE SEQUENCE IF NOT EXISTS sq_directivos_docentes START 1;
CREATE SEQUENCE IF NOT EXISTS sq_candidatos START 1;
CREATE SEQUENCE IF NOT EXISTS sq_eleccion START 1;
CREATE SEQUENCE IF NOT EXISTS sq_votos START 1;
CREATE SEQUENCE IF NOT EXISTS sq_administradores START 1;

-- Tablas
CREATE TABLE IF NOT EXISTS municipios (
    id INTEGER PRIMARY KEY DEFAULT nextval('sq_municipios'),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    departamento VARCHAR(100) NOT NULL DEFAULT 'Cauca'
);

CREATE TABLE IF NOT EXISTS directivos_docentes (
    id INTEGER PRIMARY KEY DEFAULT nextval('sq_directivos_docentes'),
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    municipio_id INTEGER REFERENCES municipios(id),
    institucion VARCHAR(255) NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    estado VARCHAR(50) DEFAULT 'ACTIVO',
    rol VARCHAR(20) DEFAULT 'VOTANTE'
);

CREATE TABLE IF NOT EXISTS candidatos (
    id INTEGER PRIMARY KEY DEFAULT nextval('sq_candidatos'),
    nombre VARCHAR(200) NOT NULL,
    institucion VARCHAR(255) NOT NULL,
    municipio_id INTEGER REFERENCES municipios(id),
    descripcion TEXT,
    foto VARCHAR(255),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS eleccion (
    id INTEGER PRIMARY KEY DEFAULT nextval('sq_eleccion'),
    nombre_eleccion VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado VARCHAR(50) DEFAULT 'PROGRAMADA' 
);

CREATE TABLE IF NOT EXISTS votos (
    id INTEGER PRIMARY KEY DEFAULT nextval('sq_votos'),
    id_directivo INTEGER REFERENCES directivos_docentes(id),
    id_candidato INTEGER REFERENCES candidatos(id),
    fecha_voto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_votante VARCHAR(45),
    UNIQUE(id_directivo) -- Restricción de un solo voto por directivo
);

-- 42 municipios del Cauca
-- Limpiar tabla para evitar duplicados
TRUNCATE municipios CASCADE;
-- Reiniciar secuencia de municipios
ALTER SEQUENCE sq_municipios RESTART WITH 1;

INSERT INTO municipios (nombre, departamento) VALUES
('Almaguer', 'Cauca'), ('Argelia', 'Cauca'), ('Balboa', 'Cauca'), ('Bolívar', 'Cauca'),
('Buenos Aires', 'Cauca'), ('Cajibío', 'Cauca'), ('Caldono', 'Cauca'), ('Caloto', 'Cauca'),
('Corinto', 'Cauca'), ('El Tambo', 'Cauca'), ('Florencia', 'Cauca'), ('Guachené', 'Cauca'),
('Guapi', 'Cauca'), ('Inzá', 'Cauca'), ('Jambaló', 'Cauca'), ('La Sierra', 'Cauca'),
('La Vega', 'Cauca'), ('López de Micay', 'Cauca'), ('Mercaderes', 'Cauca'), ('Miranda', 'Cauca'),
('Morales', 'Cauca'), ('Padilla', 'Cauca'), ('Páez', 'Cauca'), ('Patía', 'Cauca'),
('Piamonte', 'Cauca'), ('Piendamó – Tunía', 'Cauca'), ('Popayán (capital del departamento)', 'Cauca'),
('Puerto Tejada', 'Cauca'), ('Puracé (Coconuco)', 'Cauca'), ('Rosas', 'Cauca'),
('San Sebastián', 'Cauca'), ('Santander de Quilichao', 'Cauca'), ('Santa Rosa', 'Cauca'),
('Silvia', 'Cauca'), ('Sotará', 'Cauca'), ('Suárez', 'Cauca'), ('Sucre', 'Cauca'),
('Timbío', 'Cauca'), ('Timbiquí', 'Cauca'), ('Toribío', 'Cauca'), ('Totoró', 'Cauca'),
('Villa Rica', 'Cauca');

-- Configuración de la elección
INSERT INTO eleccion (nombre_eleccion, fecha, hora_inicio, hora_fin, estado)
VALUES ('Elección del directivo docente representante ante el Comité Regional de Prestaciones Sociales', '2026-03-30', '08:00:00', '16:00:00', 'PROGRAMADA')
ON CONFLICT DO NOTHING;

-- Administrador del sistema
-- La contraseña solicitada es "Sedc@uc@s0s6#", que debe ir hasheada.
-- Usaremos un hash bcrypt generado para "Sedc@uc@s0s6#": $2b$10$vO/H10.QG/pXyT1X2SxwMek.o7D9F8kL/a7A9mC9rQoH7uJ09x54K

CREATE TABLE IF NOT EXISTS administradores (
    id INTEGER PRIMARY KEY DEFAULT nextval('sq_administradores'),
    usuario VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    estado VARCHAR(50) DEFAULT 'ACTIVO',
    rol VARCHAR(20) DEFAULT 'ADMIN'
);

INSERT INTO administradores (usuario, nombre, contraseña, estado, rol)
VALUES ('admin', 'Administrador Sistema', '$2b$10$vO/H10.QG/pXyT1X2SxwMek.o7D9F8kL/a7A9mC9rQoH7uJ09x54K', 'ACTIVO', 'ADMIN')
ON CONFLICT (usuario) DO NOTHING;

-- =========================================================================
-- TRIGGERS DE SINCRONIZACION ESTADO DE VOTACION (Directivos <-> Votos)
-- =========================================================================

-- Function and Trigger for DELETE
CREATE OR REPLACE FUNCTION update_voter_status_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE directivos_docentes
    SET estado = 'ACTIVO'
    WHERE id = OLD.id_directivo;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_voter_status_on_delete ON votos;
CREATE TRIGGER trigger_voter_status_on_delete
AFTER DELETE ON votos
FOR EACH ROW
EXECUTE FUNCTION update_voter_status_on_delete();

-- Function and Trigger for INSERT
CREATE OR REPLACE FUNCTION update_voter_status_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE directivos_docentes
    SET estado = 'VOTO_REGISTRADO'
    WHERE id = NEW.id_directivo;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_voter_status_on_insert ON votos;
CREATE TRIGGER trigger_voter_status_on_insert
AFTER INSERT ON votos
FOR EACH ROW
EXECUTE FUNCTION update_voter_status_on_insert();
