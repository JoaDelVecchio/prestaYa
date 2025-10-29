# PrestaYa – Gestor de Préstamos Cash-Only

MVP end-to-end para administrar préstamos en efectivo con multi-organización, auditoría diaria y workflows automatizados.

## Arquitectura

- **Backend**: NestJS v10 + Prisma (PostgreSQL). CRUD de préstamos, cobros, webhooks y actividad con hash SHA-256 diario. Generación de recibos PDF con subida a Supabase Storage.
- **Frontend**: Next.js 14 (App Router) + Tailwind + componentes `@prestaya/ui`. Flujo completo: login magic-link, dashboard, alta de préstamo, cobrar, arqueo y gestión de usuarios.
- **Automations**: Paquete de blueprints n8n para recordatorios, recepción de pagos, enrutamiento inbound, resumen diario y alertas.
- **Infra**: `docker-compose` con servicios api, web, n8n y Supabase (DB + REST). CI con GitHub Actions, pnpm/turborepo, Husky + Commitlint.

## Requisitos

- Node.js 20+
- pnpm 8 (`corepack enable`)
- Docker Desktop (para entorno contenerizado)

## Instalación

```bash
pnpm install
pnpm --filter @prestaya/prisma build # genera el cliente Prisma
```

### Variables de entorno

Crea archivos `.env` según el contexto:

`apps/api/.env`

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/prestaya
SUPABASE_URL=http://127.0.0.1:3003
SUPABASE_SERVICE_ROLE_KEY=dev-service-role
SUPABASE_BUCKET=receipts
SUPABASE_JWT_SECRET=dev-super-secret
WEBHOOK_SECRET=dev-hook
N8N_WEBHOOK_SECRET=dev-n8n
```

`apps/web/.env`

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:3131/api
SUPABASE_JWT_SECRET=dev-super-secret
```

> `SUPABASE_JWT_SECRET` debe coincidir en backend, frontend y middleware para validar el token.

## Comandos útiles

| Objetivo                    | Comando                            |
| --------------------------- | ---------------------------------- |
| Dev (api + web)             | `pnpm dev`                         |
| Lint                        | `pnpm lint`                        |
| Tests backend               | `pnpm --filter @prestaya/api test` |
| Tests frontend (Playwright) | `pnpm --filter @prestaya/web test` |
| Build general               | `pnpm build`                       |
| Formateo                    | `pnpm format:write`                |

## Ejecutar en Docker

```bash
docker-compose up --build
```

Servicios expuestos:

- API Nest: http://localhost:3131/api
- Web Next: http://localhost:3000
- Supabase REST: http://localhost:3003
- n8n: http://localhost:5678 (usuario/clave `admin`)

## n8n Blueprints

Archivos en `n8n/blueprints/*.json`. Importar via **Import Workflow** en n8n:

1. `create-reminders.json` – recordatorios diarios vía WhatsApp Cloud.
2. `payment-received.json` – webhook de pago → API `charge` → confirmación.
3. `inbound-router.json` – clasifica mensajes (OpenAI gpt-4o-mini) y enruta a Slack.
4. `daily-summary.json` – resumen nocturno con email a finanzas.
5. `error-alert.json` – alertas y escalamiento ante fallos.

## Testing y Cobertura

- Backend usa Jest + Supertest (`pnpm --filter @prestaya/api test`). Cobertura ≥ 90 % obligatoria (enforced via CI summary).
- Frontend ejecuta flujo e2e Playwright (`pnpm --filter @prestaya/web test`) levantando `next start` automáticamente.
- Husky ejecuta `pnpm lint-staged`; Commitlint exige Conventional Commits.

## Despliegue a Producción

1. **API (Railway)**
   - Crear servicio PostgreSQL y Node en Railway.
   - Configurar variables: `DATABASE_URL`, `SUPABASE_*`, `SUPABASE_JWT_SECRET`, `WEBHOOK_SECRET`.
   - Build command: `pnpm install --frozen-lockfile && pnpm --filter @prestaya/prisma build && pnpm --filter @prestaya/api build`.
   - Start command: `node apps/api/dist/main.js`.
2. **Web (Vercel)**
   - Importar repo, definir variables `NEXT_PUBLIC_API_URL` (apuntar a Railway) y `SUPABASE_JWT_SECRET`.
   - Habilitar instalador pnpm en settings (`pnpm install --frozen-lockfile`).
3. **n8n (Fly.io)**
   - `fly launch` con imagen `n8nio/n8n`.
   - Setear `N8N_BASIC_AUTH_*`, `N8N_ENCRYPTION_KEY`, `WEBHOOK_URL` público.
   - Importar blueprints desde `fly ssh` o UI.
4. **Supabase**
   - Crear proyecto, buckets (`receipts`) y policies RLS (ejecutar SQL `packages/prisma/prisma/migrations/0001_init/migration.sql`).
   - Configurar claves en Railway/Vercel.

## Flujo de Trabajo Recomendado

1. **Crear préstamo** desde `/dashboard/loans/create`.
2. **Cobrar** desde `/charge` (genera PDF y ActivityLog).
3. **Historial** revisa totales y pagos.
4. **Usuarios** administra roles (owner/supervisor/caja/readonly).

## Estructura del repo

```
/
├─ apps/
│  ├─ api/           # NestJS + Prisma + Jest
│  └─ web/           # Next.js 14 + Tailwind + Playwright
├─ packages/
│  ├─ prisma/        # Schema y cliente Prisma
│  └─ ui/            # Design system ligero (shadcn-inspired)
├─ n8n/blueprints/   # Workflows JSON
├─ docker-compose.yaml
└─ .github/workflows/ci.yml
```

## Troubleshooting

- **PDF fonts**: `pdfmake` usa las fuentes Roboto incluidas. Si falla, reinstalar dependencias (`pnpm install`).
- **Playwright**: ejecutar una vez `pnpm exec playwright install --with-deps` en entornos CI/local limpios.
- **Supabase Storage**: sin credenciales, el backend cae en modo `local` guardando PDFs en `./storage/receipts` con URL simulada.

## Próximos pasos sugeridos

- Conectar `lib/api.ts` del frontend al backend real (reemplazar mockDb).
- Añadir métricas Prometheus + Grafana.
- Automatizar recordatorios vía Twilio/WhatsApp Business API en producción.

# prestaYa
