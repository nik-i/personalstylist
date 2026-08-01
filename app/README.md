# Personal Stylist

A Next.js wardrobe app with a voice styling agent powered by OpenAI Realtime API and a dedicated MCP tool server.

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in all values.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `NEXTAUTH_URL` | ✓ | Full URL of the app (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | ✓ | Random secret — generate with `openssl rand -base64 32` |
| `OPENAI_API_KEY` | ✓ | OpenAI API key — used for garment classification (GPT-4o) and Realtime voice sessions |
| `MCP_USER_ID` | ✓ | `User.id` from the DB that the MCP server queries on behalf of |
| `MCP_SERVER_URL` | ✓ | URL of the MCP server (default: `http://localhost:3001/mcp`) |
| `MCP_BEARER_TOKEN` | ✓ | Shared secret for MCP bearer-token auth — generate with `openssl rand -hex 32` |
| `MCP_PORT` | optional | Port for the MCP server (default: `3001`) |
| `EMAIL_SERVER` | optional | SMTP URL for magic-link auth |
| `EMAIL_FROM` | optional | From address for auth emails |
| `REMOVE_BG_API_KEY` | optional | remove.bg API key for background removal |

## Development

### Start everything

```bash
npm run dev:all
```

This runs Next.js (port 3000) and the MCP server (port 3001) in parallel via `concurrently`.

### Start individually

```bash
# Next.js only
npm run dev

# MCP server only
npm run mcp:dev
```

### Validate MCP tools (requires MCP server running)

```bash
npm run test:mcp
```

Runs 12 tests covering: auth rejection, enum validation, non-whitelisted patch keys, and happy-path tool calls.

## Architecture

### MCP server (`app/mcp-server/`)

A standalone Express + `@modelcontextprotocol/sdk` server on port 3001. It is the **only** way the voice agent accesses the database.

Five tools:

| Tool | Access | Description |
|---|---|---|
| `search_garments` | read | Filter garments by category, formality, season_weight, pattern, fabric, color, undertone, fit |
| `get_garment` | read | Single garment by ID |
| `get_groupings` | read | Garments grouped by color, formality, or weather |
| `update_garment_attributes` | write | Patch fit, undertone, formality, color_primary, color_secondary, season_weight (only) |
| `save_feedback` | write | INSERT into Feedback table: liked / disliked / too_formal / too_casual / wrong_fit / wrong_weather / other |

All tool calls are logged to `app/mcp-server/logs/tool-calls.jsonl`.

### Voice agent (`/voice`)

WebRTC session with OpenAI Realtime API (`gpt-4o-realtime-preview`):

1. Browser POSTs to `/api/realtime/session` — Next.js mints an ephemeral token using `OPENAI_API_KEY` and injects the MCP server as the agent's tool source. The real API key never reaches the browser.
2. Browser exchanges SDP with OpenAI's Realtime endpoint.
3. Agent audio plays in the browser; mic input is streamed to OpenAI.
4. When the agent calls a read tool (search/get/groupings), garment thumbnails appear in the UI panel.

### Styling instructions (`app/styling-instructions.md`)

Editable Markdown file at the app root. The `/api/realtime/session` route reads it on every session creation and injects it as the agent's system instructions. **No code changes needed** to update agent behavior — just edit the file.

## Database migrations

```bash
npx prisma migrate dev --name <description>
npx prisma generate
```

The `Feedback` table was added in migration `20260801163122_add_feedback_table`.
