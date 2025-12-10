# 🚀 Guía de Deploy Manual

Esta guía describe cómo desplegar TeachingPlanner en una máquina virtual usando un script de deploy manual.

---

## 📋 Requisitos Previos

- ✅ Docker y Docker Compose instalados en la VM
- ✅ Git instalado en la VM
- ✅ Acceso SSH a la VM
- ✅ Conexión VPN configurada (si es necesario)

---

## 🖥️ Paso 1: Configuración Inicial en la VM

### 1.1. Conectarse a la VM

```bash
# Conectar VPN (si es necesario)
# Luego conectar por SSH
ssh tu_usuario@ip_de_la_vm
```

### 1.2. Clonar el Repositorio

Si aún no tienes el proyecto en la VM:

```bash
# Navegar al directorio home
cd ~

# Clonar el repositorio
git clone https://github.com/TU_USUARIO/TeachingPlanner.git

# Entrar al directorio
cd TeachingPlanner

# Configurar credenciales de git
git config user.name "Tu Nombre"
git config user.email "tu@email.com"
```

### 1.3. Copiar el Script de Deploy

```bash
# Copiar el script a tu home
cp deploy.sh ~/deploy-teaching-planner.sh

# Hacerlo ejecutable
chmod +x ~/deploy-teaching-planner.sh
```

### 1.4. Configurar Variables de Entorno

```bash
# Editar el archivo .env con tu configuración
nano ~/TeachingPlanner/.env

# Asegúrate de configurar al menos:
# - DOMAIN (tu dominio o localhost)
# - Database credentials
# - SMTP settings
```

### 1.5. Primer Deploy

```bash
# Ejecutar el script por primera vez
~/deploy-teaching-planner.sh
```

---

## 🔄 Paso 2: Flujo de Deploy Normal

### En tu Máquina Local

1. Realiza tus cambios en el código
2. Commit y push a GitHub:

```bash
git add .
git commit -m "descripción de cambios"
git push origin main
```

### En la Máquina Virtual

1. Conecta la VPN (si es necesario)
2. Conéctate por SSH:

```bash
ssh tu_usuario@ip_de_la_vm
```

3. Ejecuta el script de deploy:

```bash
~/deploy-teaching-planner.sh
```

4. El script:
   - ✅ Descarga los últimos cambios de GitHub
   - ✅ Muestra qué cambios se van a aplicar
   - ✅ Pide confirmación
   - ✅ Detiene los containers actuales
   - ✅ Hace rebuild y redeploy
   - ✅ Muestra el estado final

---

## 📝 Comandos Útiles

### Ver logs de los servicios

```bash
cd ~/TeachingPlanner

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f webapp
docker-compose logs -f gateway
docker-compose logs -f auth_service
docker-compose logs -f user_service
docker-compose logs -f planner_service
```

### Ver estado de los containers

```bash
cd ~/TeachingPlanner
docker-compose ps
```

### Reiniciar servicios

```bash
cd ~/TeachingPlanner

# Reiniciar todos los servicios
docker-compose restart

# Reiniciar un servicio específico
docker-compose restart webapp
```

### Detener la aplicación

```bash
cd ~/TeachingPlanner
docker-compose down
```

### Iniciar la aplicación

```bash
cd ~/TeachingPlanner
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Error: Permission denied en Docker

Si obtienes errores de permisos con Docker:

```bash
# Agregar tu usuario al grupo docker
sudo usermod -aG docker $USER

# Cerrar sesión y volver a entrar
exit
# ... reconectar por SSH
```

### Error: Changes would be overwritten by merge

Si hay conflictos al hacer pull:

```bash
cd ~/TeachingPlanner

# Guardar cambios locales
git stash

# Intentar el deploy nuevamente
~/deploy-teaching-planner.sh
```

### Ver logs en tiempo real

```bash
cd ~/TeachingPlanner
docker-compose logs -f --tail=100
```

### Limpiar imágenes antiguas

```bash
# Limpiar imágenes no usadas
docker image prune -f

# Limpiar todo (imágenes, volúmenes, etc.)
docker system prune -a --volumes
```

---

## 🔐 Recomendaciones de Seguridad

1. **Usar SSH Key en lugar de contraseña**
   ```bash
   # En tu máquina local
   ssh-keygen -t ed25519
   ssh-copy-id tu_usuario@ip_de_la_vm
   ```

2. **Configurar SSH Key para GitHub** (opcional)
   ```bash
   # En la VM
   ssh-keygen -t ed25519 -C "tu@email.com"
   cat ~/.ssh/id_ed25519.pub
   # Copiar y agregar en GitHub → Settings → SSH keys

   # Cambiar URL del repo a SSH
   cd ~/TeachingPlanner
   git remote set-url origin git@github.com:TU_USUARIO/TeachingPlanner.git
   ```

3. **Mantener actualizado el sistema**
   ```bash
   sudo apt update
   sudo apt upgrade
   ```

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs -f`
2. Verifica el estado: `docker-compose ps`
3. Comprueba la configuración: `cat .env`
