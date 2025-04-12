# Usar la imagen oficial de MariaDB
FROM mariadb:10.6

# Copiar el esquema SQL al directorio donde MariaDB lo ejecutará automáticamente
COPY schema.sql /docker-entrypoint-initdb.d/
