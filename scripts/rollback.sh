#!/bin/bash
# Script de Rollback para Viral Trends Hub
# Uso: ./scripts/rollback.sh [nombre-del-backup]

set -e

PROJECT_DIR="/Users/adrianmarin/viral-trends-hub"
BACKUP_DIR="$PROJECT_DIR/.backups"

# Función para mostrar backups disponibles
show_backups() {
    echo "📦 Backups disponibles:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -1td "$BACKUP_DIR"/* 2>/dev/null | head -10 | while read backup; do
            name=$(basename "$backup")
            size=$(du -sh "$backup" 2>/dev/null | cut -f1)
            date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
            echo "   - $name ($size, $date)"
        done
    else
        echo "   No hay backups disponibles"
    fi
    echo ""
}

# Si no hay argumento, mostrar lista
if [ -z "$1" ]; then
    echo "❌ Error: Debes especificar el nombre del backup"
    echo ""
    show_backups
    echo "Uso: ./scripts/rollback.sh <nombre-del-backup>"
    exit 1
fi

BACKUP_NAME="$1"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Verificar que el backup existe
if [ ! -d "$BACKUP_PATH" ]; then
    echo "❌ Error: Backup no encontrado: $BACKUP_NAME"
    echo ""
    show_backups
    exit 1
fi

# Confirmación
read -p "⚠️  Esto SOBRESCRIBIRÁ tus archivos actuales. ¿Continuar? (s/N): " confirm
if [[ ! $confirm =~ ^[Ss]$ ]]; then
    echo "❌ Rollback cancelado"
    exit 0
fi

# Crear backup de seguridad del estado actual
SAFETY_BACKUP="pre-rollback-$(date +%Y%m%d_%H%M%S)"
echo "🔒 Creando backup de seguridad: $SAFETY_BACKUP"
mkdir -p "$BACKUP_DIR/$SAFETY_BACKUP"
cp -r "$PROJECT_DIR/src" "$BACKUP_DIR/$SAFETY_BACKUP/" 2>/dev/null || true
cp "$PROJECT_DIR/package.json" "$BACKUP_DIR/$SAFETY_BACKUP/" 2>/dev/null || true

# Restaurar archivos
echo "♻️  Restaurando desde: $BACKUP_NAME"

# Limpiar src actual
rm -rf "$PROJECT_DIR/src"

# Copiar backup
if [ -d "$BACKUP_PATH/src" ]; then
    cp -r "$BACKUP_PATH/src" "$PROJECT_DIR/"
    echo "✅ src/ restaurado"
fi

# Restaurar archivos de configuración
for file in package.json package-lock.json bun.lockb tsconfig.json vite.config.ts tailwind.config.ts; do
    if [ -f "$BACKUP_PATH/$file" ]; then
        cp "$BACKUP_PATH/$file" "$PROJECT_DIR/"
        echo "✅ $file restaurado"
    fi
done

# Restaurar supabase
if [ -d "$BACKUP_PATH/supabase" ]; then
    rm -rf "$PROJECT_DIR/supabase"
    cp -r "$BACKUP_PATH/supabase" "$PROJECT_DIR/"
    echo "✅ supabase/ restaurado"
fi

echo ""
echo "✅ Rollback completado"
echo "💾 Estado anterior guardado en: $SAFETY_BACKUP"
echo ""
echo "🔄 Recordá reinstalar dependencias si cambió package.json:"
echo "   npm install"
