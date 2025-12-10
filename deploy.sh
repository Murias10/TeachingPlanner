#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 Deploy TeachingPlanner${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# Directorio del proyecto (ajusta esta ruta según tu configuración)
PROJECT_DIR="$HOME/TeachingPlanner"

# Navegar al directorio del proyecto
cd "$PROJECT_DIR" || {
    echo -e "${RED}❌ Error: No se encuentra el directorio del proyecto${NC}"
    echo -e "${RED}   Ruta esperada: $PROJECT_DIR${NC}"
    exit 1
}

# 1. Verificar rama actual
echo -e "\n${YELLOW}📍 Rama actual:${NC}"
git branch --show-current

# 2. Obtener cambios del repositorio
echo -e "\n${YELLOW}📥 Descargando cambios de GitHub...${NC}"
git fetch origin main || {
    echo -e "${RED}❌ Error al conectar con GitHub${NC}"
    exit 1
}

# 3. Mostrar diferencias
echo -e "\n${YELLOW}📊 Cambios pendientes:${NC}"
CHANGES=$(git log HEAD..origin/main --oneline --no-decorate)
if [ -z "$CHANGES" ]; then
    echo -e "${GREEN}✓ No hay cambios nuevos${NC}"
    read -p "¿Deseas hacer rebuild de todas formas? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${YELLOW}⚠️  Deploy cancelado${NC}"
        exit 0
    fi
else
    echo "$CHANGES"
fi

# 4. Preguntar si continuar
echo ""
read -p "¿Continuar con el deploy? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Deploy cancelado${NC}"
    exit 0
fi

# 5. Hacer pull
echo -e "\n${YELLOW}⬇️  Aplicando cambios...${NC}"
git pull origin main || {
    echo -e "${RED}❌ Error al hacer pull${NC}"
    echo -e "${YELLOW}💡 Intenta: git stash && git pull origin main${NC}"
    exit 1
}

# 6. Detener containers actuales
echo -e "\n${YELLOW}🛑 Deteniendo containers...${NC}"
docker-compose down

# 7. Limpiar imágenes antiguas (opcional)
echo -e "\n${YELLOW}🧹 Limpiando imágenes antiguas...${NC}"
docker image prune -f

# 8. Build y deploy
echo -e "\n${YELLOW}🔨 Building y desplegando containers...${NC}"
docker-compose up -d --build || {
    echo -e "${RED}❌ Error al hacer build/deploy${NC}"
    exit 1
}

# 9. Esperar a que los containers estén listos
echo -e "\n${YELLOW}⏳ Esperando a que los servicios estén listos...${NC}"
sleep 5

# 10. Verificar estado
echo -e "\n${YELLOW}✅ Estado de containers:${NC}"
docker-compose ps

# 11. Verificar que los servicios están corriendo
RUNNING=$(docker-compose ps | grep "Up" | wc -l)
TOTAL=$(docker-compose ps -a | tail -n +3 | wc -l)

if [ "$RUNNING" -eq "$TOTAL" ]; then
    echo -e "\n${GREEN}✅ Todos los servicios están corriendo correctamente ($RUNNING/$TOTAL)${NC}"
else
    echo -e "\n${YELLOW}⚠️  Algunos servicios pueden tener problemas ($RUNNING/$TOTAL corriendo)${NC}"
fi

# 12. Mostrar logs recientes
echo -e "\n${YELLOW}📋 Últimos logs:${NC}"
docker-compose logs --tail=20

echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  ✨ Deploy completado${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"

# Mostrar información útil
echo -e "\n${BLUE}ℹ️  Información útil:${NC}"
echo -e "   Ver logs en vivo:    ${YELLOW}docker-compose logs -f${NC}"
echo -e "   Ver estado:          ${YELLOW}docker-compose ps${NC}"
echo -e "   Reiniciar servicio:  ${YELLOW}docker-compose restart [servicio]${NC}"
echo -e "   Detener todo:        ${YELLOW}docker-compose down${NC}"
