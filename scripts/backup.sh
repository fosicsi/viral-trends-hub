#!/bin/bash
# Script de Backup para Viral Trends Hub
# Uso: ./scripts/backup.sh [nombre-del-backup]

set -e

PROJECT_DIR="/Users/adrianmarin/viral-trends-hub"
BACKUP_DIR="$PROJECT_DIR/.backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${1:-backup_$TIMESTAMP}"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

echo "🔄 Creando backup: $BACKUP_NAME"

# Crear directorio de backup
mkdir -p "$BACKUP_PATH"

# Copiar archivos importantes
echo "📁 Copiando src/..."
cp -r "$PROJECT_DIR/src" "$BACKUP_PATH/"

echo "📄 Copiando configuración..."
cp "$PROJECT_DIR/package.json" "$BACKUP_PATH/" 2>/dev/null || true
cp "$PROJECT_DIR/package-lock.json" "$BACKUP_PATH/" 2>/dev/null || true
cp "$PROJECT_DIR/bun.lockb" "$BACKUP_PATH/" 2>/dev/null || true
cp "$PROJECT_DIR/tsconfig.json" "$BACKUP_PATH/" 2>/dev/null || true
cp "$PROJECT_DIR/vite.config.ts" "$BACKUP_PATH/" 2>/dev/null || true
cp "$PROJECT_DIR/tailwind.config.ts" "$BACKUP_PATH/" 2>/dev/null || true
cp -r "$PROJECT_DIR/supabase" "$BACKUP_PATH/" 2>/dev/null || true

# Guardar estado de git
echo "💾 Guardando estado Git..."
cd "$PROJECT_DIR"
git log --oneline -5 > "$BACKUP_PATH/GIT_STATUS.txt" 2>/dev/null || echo "No hay commits recientes" > "$BACKUP_PATH/GIT_STATUS.txt"
git status --short >> "$BACKUP_PATH/GIT_STATUS.txt" 2>/dev/null || true
git diff --stat >> "$BACKUP_PATH/GIT_STATUS.txt" 2>/dev/null || true

# Crear tag en Git (opcional pero recomendado)
cd "$PROJECT_DIR"
git tag -a "backup-$BACKUP_NAME" -m "Backup automático: $BACKUP_NAME" 2>/dev/null || echo "⚠️ No se pudo crear tag (puede que no haya commits)"

echo "✅ Backup creado en: $BACKUP_PATH"
echo "🏷️  Tag creado: backup-$BACKUP_NAME"
echo ""
echo "📊 Tamaño del backup:"
du -sh "$BACKUP_PATH" 2>/dev/null || echo "No se pudo calcular tamaño"
echo ""
echo "💡 Para restaurar este backup, ejecutá:"
echo "   ./scripts/rollback.sh $BACKUP_NAME"
