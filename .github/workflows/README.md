# GitHub Actions Workflows

Este directorio contiene los workflows de CI/CD para el proyecto.

## Workflows configurados:

### 1. `deploy-supabase-functions.yml`
**Trigger**: Push a `main` que modifique archivos en `supabase/functions/`

**Acciones**:
- Deploya Edge Functions automáticamente a Supabase
- Configura variables de entorno (secrets)
- Se ejecuta solo cuando hay cambios en las funciones

### 2. `youtube-cache-refresh.yml`
**Trigger**: Cron schedule (cada 15/30 min)

**Acciones**:
- `refresh-stats`: Cada 15 minutos, actualiza stats del canal
- `refresh-reports`: Cada 30 minutos, actualiza reports (tráfico, audiencia)
- Manual trigger disponible en GitHub Actions tab

## Configuración requerida

En GitHub Settings → Secrets → Actions, agregar:

```
SUPABASE_PROJECT_REF=fxopuxtsvlgpzzicuyao
SUPABASE_ACCESS_TOKEN=<generar_desde_supabase>
SUPABASE_SERVICE_ROLE_KEY=<desde_supabase_api_settings>
GOOGLE_CLIENT_ID=<tu_google_client_id>
GOOGLE_CLIENT_SECRET=<tu_google_client_secret>
OAUTH_ENCRYPTION_KEY=<32_chars_key>
```

## Monitoreo

Ver logs en: https://github.com/fosicsi/viral-trends-hub/actions
