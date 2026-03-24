-- Script to update the list of municipalities in the database
-- This script will clear the existing list and re-populate it with the official 42 municipalities of Cauca.

-- CAUTION: If there are existing voters or candidates, this TRUNCATE may fail due to foreign key constraints.
-- In that case, we would need to manually map or update existing records.

BEGIN;

-- Temporarily disable foreign key checks if necessary (PostgreSQL specific)
-- SET CONSTRAINTS ALL DEFERRED;

-- Delete municipalities that are not in the new list or have different names
DELETE FROM municipios;

-- Restart ID sequence
ALTER SEQUENCE municipios_id_seq RESTART WITH 1;

-- Insert the 42 official municipalities
INSERT INTO municipios (nombre, departamento) VALUES
('Almaguer', 'Cauca'),
('Argelia', 'Cauca'),
('Balboa', 'Cauca'),
('Bolívar', 'Cauca'),
('Buenos Aires', 'Cauca'),
('Cajibío', 'Cauca'),
('Caldono', 'Cauca'),
('Caloto', 'Cauca'),
('Corinto', 'Cauca'),
('El Tambo', 'Cauca'),
('Florencia', 'Cauca'),
('Guachené', 'Cauca'),
('Guapi', 'Cauca'),
('Inzá', 'Cauca'),
('Jambaló', 'Cauca'),
('La Sierra', 'Cauca'),
('La Vega', 'Cauca'),
('López de Micay', 'Cauca'),
('Mercaderes', 'Cauca'),
('Miranda', 'Cauca'),
('Morales', 'Cauca'),
('Padilla', 'Cauca'),
('Páez', 'Cauca'),
('Patía', 'Cauca'),
('Piamonte', 'Cauca'),
('Piendamó – Tunía', 'Cauca'),
('Popayán (capital del departamento)', 'Cauca'),
('Puerto Tejada', 'Cauca'),
('Puracé (Coconuco)', 'Cauca'),
('Rosas', 'Cauca'),
('San Sebastián', 'Cauca'),
('Santander de Quilichao', 'Cauca'),
('Santa Rosa', 'Cauca'),
('Silvia', 'Cauca'),
('Sotará', 'Cauca'),
('Suárez', 'Cauca'),
('Sucre', 'Cauca'),
('Timbío', 'Cauca'),
('Timbiquí', 'Cauca'),
('Toribío', 'Cauca'),
('Totoró', 'Cauca'),
('Villa Rica', 'Cauca');

COMMIT;
