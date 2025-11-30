-- ========================================
-- Crear base de datos y usuario
-- ========================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS management_db;

-- Crear usuario de acceso desde cualquier host (para contenedores Docker)
CREATE USER IF NOT EXISTS 'management_user'@'%' IDENTIFIED BY 'management_password';

-- Dar permisos sobre la base de datos
GRANT ALL PRIVILEGES ON management_db.* TO 'management_user'@'%';

-- Aplicar cambios de permisos
FLUSH PRIVILEGES;

-- ========================================
-- NOTA: Los datos iniciales se insertan
-- con el script init-data.sql después de
-- que TypeORM cree las tablas
-- ========================================