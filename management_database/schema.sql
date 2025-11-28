-- Crear base de datos (opcional, si no la creaste)
CREATE DATABASE IF NOT EXISTS management_db;

-- Crear usuario y darle acceso desde cualquier host (para contenedores)
CREATE USER IF NOT EXISTS 'management_user'@'%' IDENTIFIED BY 'management_password';

-- Dar permisos sobre la base
GRANT ALL PRIVILEGES ON management_db.* TO 'management_user'@'%';

-- Aplicar cambios
FLUSH PRIVILEGES;

USE management_db;

-- Insertar usuario por defecto
-- Contraseña: 123456 (hasheada con bcrypt, 10 salt rounds)
INSERT INTO USERS (ID, NAME, FIRST_SURNAME, SECOND_SURNAME, ROLE, EMAIL, PASSWORD)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Diego', 'Murias', 'Suárez', 'ADMIN', 'uo290009@uniovi.es', '$2b$10$ZXn7KSmOPPns0cdhN6c2ZeNVCDFXTvYadGW2iw5oz61M3HkrROg9O')
ON DUPLICATE KEY UPDATE EMAIL=EMAIL;

INSERT INTO USERS (ID, NAME, FIRST_SURNAME, SECOND_SURNAME, ROLE, EMAIL, PASSWORD)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Juan Ramón', 'Perez', 'Perez', 'ADMIN', 'jrpp@uniovi.es', '$2b$10$ZXn7KSmOPPns0cdhN6c2ZeNVCDFXTvYadGW2iw5oz61M3HkrROg9O')
ON DUPLICATE KEY UPDATE EMAIL=EMAIL;

INSERT INTO USERS (ID, NAME, FIRST_SURNAME, SECOND_SURNAME, ROLE, EMAIL, PASSWORD)
VALUES ('550e8400-e29b-41d4-a716-446655440002', 'Fernando', 'Álvarez', 'García', 'ADMIN', 'falvarez@uniovi.es', '$2b$10$ZXn7KSmOPPns0cdhN6c2ZeNVCDFXTvYadGW2iw5oz61M3HkrROg9O')
ON DUPLICATE KEY UPDATE EMAIL=EMAIL;

INSERT INTO USERS (ID, NAME, FIRST_SURNAME, SECOND_SURNAME, ROLE, EMAIL, PASSWORD)
VALUES ('550e8400-e29b-41d4-a716-446655440003', 'Diego', 'Murias', 'Suárez', 'TEACHER', 'teacher@uniovi.es', '$2b$10$ZXn7KSmOPPns0cdhN6c2ZeNVCDFXTvYadGW2iw5oz61M3HkrROg9O')
ON DUPLICATE KEY UPDATE EMAIL=EMAIL;