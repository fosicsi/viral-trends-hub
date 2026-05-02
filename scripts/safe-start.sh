#!/bin/bash
# Script para iniciar sesión de desarrollo con backup automático
# Uso: ./scripts/safe-start.sh [descripcion-del-cambio]

set -e

PROJECT_DIR="/Users/adrianmarin/viral-trends-hub"
BACKUP_DIR="$PROJECT_DIR/.backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DESCRIPTION="${1:-antes-de-cambios}"
BACKUP_NAME="session-$TIMESTAMP-$DESCRIPTION"

echo "🚀 Iniciando sesión de desarrollo segura"
echo "========================================="
echo ""

# 1. Verificar estado de git
cd "$PROJECT_DIR"
echo "📊 Estado actual de Git:"
git status --short || echo "   (No es un repositorio git o está limpio)"
echo ""

# 2. Crear backup automático
echo "💾 Creando backup automático..."
"$PROJECT_DIR/scripts/backup.sh" "$BACKUP_NAME" || echo "⚠️  Advertencia: No se pudo crear backup automático"

# 3. Crear tag de referencia
cd "$PROJECT_DIR"
git tag -a "session-$TIMESTAMP" -m "Inicio de sesión: $DESCRIPTION" 2>/dev/null || echo "⚠️  No se pudo crear tag (puede que no haya commits)"

echo ""
echo "✅ Sesión iniciada con backup: $BACKUP_NAME"
echo ""
echo "💡 Comandos útiles:"
echo "   ./scripts/backup.sh nombre-backup    # Crear backup manual"
echo "   ./scripts/rollback.sh nombre-backup  # Restaurar backup"
echo "   git tag                              # Ver tags de sesiones"
echo ""
echo "🎉 Listo para codear. ¡Buena suerte!"
