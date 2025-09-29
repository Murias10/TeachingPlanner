-- Crear base de datos (opcional, si no la creaste)
CREATE DATABASE IF NOT EXISTS management_db;

-- Crear usuario y darle acceso desde cualquier host (para contenedores)
CREATE USER IF NOT EXISTS 'management_user'@'%' IDENTIFIED BY 'management_password';

-- Dar permisos sobre la base
GRANT ALL PRIVILEGES ON management_db.* TO 'management_user'@'%';

-- Aplicar cambios
FLUSH PRIVILEGES;

USE management_db;