-- Crear base de datos (opcional, si no la creaste)
CREATE DATABASE IF NOT EXISTS management_database;

-- Crear usuario y darle acceso desde cualquier host (para contenedores)
CREATE USER IF NOT EXISTS 'management_user'@'%' IDENTIFIED BY 'management_password';

-- Dar permisos sobre la base
GRANT ALL PRIVILEGES ON management_database.* TO 'management_user'@'%';

-- Aplicar cambios
FLUSH PRIVILEGES;

USE management_database;