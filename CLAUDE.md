# CLAUDE.md — Project Conventions for new-api

@AGENTS.md

## Claude Code

- Follow the shared project instructions imported from `AGENTS.md`.

## Advanced Architecture

**HTTP Router Layers** (`router/`)

The Gin engine serves four distinct route groups:
- `/api/*` — Dashboard/admin REST API (setup, auth, models, users, channels, billing). Uses `middleware.UserAuth()` / `middleware.AdminAuth()`.
- `/v1/*` — Relay/proxy endpoints (OpenAI-compatible chat completions, embeddings, images, audio, rerank, responses, realtime). Uses `middleware.TokenAuth()`.
- `/dashboard/*` — Web dashboard pages (legacy server-side rendering routes).
- Web static assets — Default frontend (`/`) and Classic frontend (`/classic/`) served via `//go:embed` from compiled `web/*/dist`.

If `FRONTEND_BASE_URL` is set (and not master node), `SetWebRouter` is replaced by a redirect handler — useful for serving the SPA from a CDN while the Go backend handles only the API.

**Relay Channel Adapter Pattern** (`relay/channel/adapter.go`)

The core abstraction for upstream providers is the `channel.Adaptor` interface. Each provider (openai, claude, gemini, aws, etc.) implements this interface. The relay layer:
1. Identifies the channel from the request token.
2. Calls `Init()` with `RelayInfo` (channel config, model, billing context).
3. Transforms the incoming request via the appropriate `Convert*Request()` method.
4. Forwards to upstream via `DoRequest()`.
5. Parses the upstream response via `DoResponse()` and normalizes usage into a standard `dto.Usage`.

For async tasks (Suno, Kling, Jimeng, Sora, Vidu, Hailuo, etc.), the `channel.TaskAdaptor` interface adds `EstimateBilling`, `AdjustBillingOnSubmit`, `AdjustBillingOnComplete`, `FetchTask`, and `ParseTaskResult`. The factory `relay.GetTaskAdaptor(platform)` resolves per-platform adaptors.

**Import cycle break**: `service/` cannot import `relay/` directly. In `main.go`, `service.GetTaskAdaptorFunc` is set to `func(platform) { return relay.GetTaskAdaptor(platform) }` to lazily obtain task adaptors.

**Relay request lifecycle**: `Distribute()` middleware → `SetupContextForSelectedChannel` (writes channel metadata to gin context) → `controller.Relay` → format-specific handler → `RelayInfo` built → `GetAdaptor(channelType).Init(info)` → `ConvertXxxRequest` → `DoRequest` → `DoResponse` (returns normalized `dto.Usage`). Pre-consume quota via `relay/helper/price.go::ModelPriceHelper`; settlement runs after `DoResponse` produces actual usage.

**Frontend Architecture** (`web/default/`)

- **Routing**: TanStack Router with file-based route generation (`src/routes/` → `routeTree.gen.ts`). Run `bun run dev` to regenerate routes on file changes.
- **State**: Zustand for local state, TanStack Query for server state.
- **Features**: Code is organized by feature (`src/features/auth/`, `src/features/channels/`, etc.) rather than by type.
- **API proxy**: Rsbuild dev server proxies `/api`, `/mj`, `/pg` to `VITE_REACT_APP_SERVER_URL` (default `http://localhost:3000`).

**Go Embed & Static Assets**

`main.go` embeds `web/default/dist` and `web/classic/dist` into the binary:
```go
//go:embed web/default/dist
//go:embed web/default/dist/index.html
//go:embed web/classic/dist
//go:embed web/classic/dist/index.html
```
Because of this, `go build` / `go run` requires these directories to exist at compile time, even if empty. The `Dockerfile.dev` creates placeholder HTML files for backend-only development builds.

Runtime theme switching works through `common.NewThemeAwareFS` reading `common.GetTheme()` per request, enabling theme swap without restart. `main.go` also performs in-place byte replacement on the embedded `index.html` to inject Umami/Google Analytics via `<!--umami-->` and `<!--Google Analytics-->` placeholders.

**Database Compatibility Initialization** (`model/main.go`)

At startup `model/main.go` initializes per-DB quoting and boolean literals:
```go
commonGroupCol = "`group`" // or `"group"` for PostgreSQL
commonTrueVal  = "1"       // or "true" for PostgreSQL
commonFalseVal = "0"       // or "false" for PostgreSQL
```

Use these variables and the `common.UsingPostgreSQL` / `common.UsingSQLite` / `common.UsingMySQL` flags when raw SQL is unavoidable.

`LOG_DB` can be a separate database (set `LOG_SQL_DSN`) — falls back to `DB` if empty.

**Configuration System** (`setting/config/`)

`config.GlobalConfig` is a global `ConfigManager` that exposes `Register(name, config)` from package `init()` functions. Each module declares a struct with `json:"…"` tags; `LoadFromDB(options)` flattens the registered config struct back into `prefix.field` DB keys (e.g., `general_setting.docs_link`, `group_ratio_setting.group_ratio`, `billing_setting.billing_expr`). `SaveToDB` does the reverse via reflection.

**Bootstrap Order** (`main.go::InitResources`)

```
godotenv.Load → common.InitEnv → logger.SetupLogger →
ratio_setting.InitRatioSettings → service.InitHttpClient →
service.InitTokenEncoders → model.InitDB → model.CheckSetup →
model.InitOptionMap → common.CleanupOldCacheFiles →
model.GetPricing → model.InitLogDB → common.InitRedisClient →
perfmetrics.Init → common.StartSystemMonitor → i18n.Init →
i18n.SetUserLangLoader(model.GetUserLanguage) → oauth.LoadCustomProviders
```

## Development Commands

### Prerequisites
- Go 1.25+
- Bun (for frontend)
- Docker & Docker Compose (for local PostgreSQL/Redis)

### Backend
```bash
# Run backend directly (requires web/*/dist directories to exist)
# If dist dirs are missing, create placeholders first:
mkdir -p web/default/dist web/classic/dist

# Run with SQLite (default)
go run main.go

# Run with PostgreSQL/Redis
SQL_DSN="postgresql://postgres:123456@localhost:5432/new-api" \
  REDIS_CONN_STRING="redis://localhost:6379" \
  go run main.go
```

### Frontend (Default)
```bash
cd web/default
bun install
bun run dev        # Rsbuild dev server, auto-proxies API to localhost:3000
```

### Frontend (Classic)
```bash
cd web/classic
bun install
bun run dev        # Vite dev server
```

### Full Development Stack
```bash
# Start backend services (PostgreSQL + Redis via Docker) + frontend dev server
make dev

# Or start only backend services
make dev-api

# Start only default frontend dev server
make dev-web

# Start only classic frontend dev server
make dev-web-classic

# Reset setup wizard state (removes setups table + root users)
make reset-setup
```

### Build
```bash
# Build both frontends (embeds into Go binary)
make build-all-frontends

# Build only default frontend
make build-frontend

# Build only classic frontend
make build-frontend-classic

# Build production binary (requires frontend dist directories to exist)
go build -ldflags "-s -w -X 'github.com/QuantumNous/new-api/common.Version=$(cat VERSION)'" -o new-api
```

### Tests
```bash
# Run all Go tests
go test ./...

# Run tests in a specific package with verbose output
go test ./dto/ -v

# Run a specific test
go test ./dto/ -run TestZeroValue -v
```

### Docker
```bash
# Production-like local deployment
docker compose up -d

# Frontend development with backend in Docker
docker compose -f docker-compose.dev.yml up -d
# Then: cd web/default && bun run dev
# Access frontend at http://localhost:3001 (Rsbuild dev server)
```