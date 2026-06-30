# Truth or Dare Discord Bot

A Bun + discord.js bot for playing Truth or Dare with automatic scoring and server leaderboards.

## Features

- `/truth` and `/dare` — solo prompts anytime
- **Scoring:** reply to the bot's message with text (truth = 1 pt) or an image/video/audio attachment (dare = 5 pts base, community voting adjusts)
- One scoring reply per user per prompt message
- Built-in prompt bank (~500 truths, ~500 dares) + server custom prompts (mod-approved)
- `/leaderboard` — all-time and weekly (resets Monday 00:00 UTC)
- `/submit-truth`, `/submit-dare`, `/review-prompts` for custom content

## Prerequisites

- [Bun](https://bun.sh) 1.x
- [Docker](https://www.docker.com/) (optional, for Postgres)
- A [Discord application](https://discord.com/developers/applications) with a bot token

## Discord setup

1. Create an application at the [Discord Developer Portal](https://discord.com/developers/applications).
2. Go to **Bot** → create a bot and copy the **token**.
3. Copy the **Application ID** (Client ID) from General Information.
4. Enable **Message Content Intent** under Bot → Privileged Gateway Intents.
5. Invite the bot with these permissions:
   - Send Messages, Embed Links, Attach Files, Read Message History, Use Slash Commands, Add Reactions

Invite URL template (replace `CLIENT_ID`):

```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=277025508416&scope=bot%20applications.commands
```

## Local development

1. Copy env file and fill in values:

```bash
cp .env.example .env
```

2. Start Postgres:

```bash
docker compose up postgres -d
```

Postgres listens on **localhost:5434** (not 5432) to avoid conflicting with a local Postgres install.

3. Install dependencies, migrate, and seed:

```bash
bun install
bun run db:migrate
bun run db:seed
```

4. Register slash commands (use `GUILD_ID` in `.env` for instant dev registration):

```bash
bun run register-commands
```

5. Start the bot:

```bash
bun run dev
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Bot token from Discord Developer Portal |
| `CLIENT_ID` | Yes | Application / client ID |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GUILD_ID` | No | Register commands to one guild (faster for dev) |
| `MOD_LOG_CHANNEL_ID` | No | Channel for notifications on new prompt submissions |

## Docker (full stack)

```bash
cp .env.example .env
# Set DISCORD_TOKEN, CLIENT_ID; DATABASE_URL defaults work with compose
docker compose up --build
```

The bot container runs migrations and seeds default prompts on startup. New built-in prompts are added automatically on deploy (existing prompts and their IDs are preserved).

### Prompt bank

The default bank lives in [`src/data/prompts/`](src/data/prompts/) (~500 adult-themed truths, ~500 Discord-verifiable dares). Truths may include sex/kink topics; dares require voice, screenshot, object photo, or clothed performance video — no body-focused or explicit media. See [`src/data/prompts/PROMPT_GUIDELINES.md`](src/data/prompts/PROMPT_GUIDELINES.md).

Validate before committing prompt changes:

```bash
bun run validate-prompts
```

Regenerate category JSON from the generator script (optional):

```bash
bun run generate-prompt-bank
bun run validate-prompts
```

After first boot, register commands from your host (once):

```bash
bun run register-commands
```

## Commands

| Command | Description |
|---------|-------------|
| `/truth` | Post a random truth prompt |
| `/dare` | Post a random dare prompt |
| `/leaderboard [period] [limit]` | Show all-time or weekly rankings |
| `/submit-truth text:` | Submit a custom truth for mod approval |
| `/submit-dare text:` | Submit a custom dare for mod approval |
| `/review-prompts` | Mods: paginated review of all pending prompts |
| `/list-prompts [type] [status] [source] [page]` | Mods: browse all prompts with filters |
| `/remove-prompt id:` | Mods: remove a built-in (block) or custom (reject) prompt |
| `/post-instructions` | Mods: post game instructions with Truth / Dare / Leaderboard buttons |

## Mod prompt management

Requires **Manage Messages** permission.

- **`/list-prompts`** — Browse built-in and custom prompts. Filter by type (truth/dare), status (approved/pending/rejected/blocked), and source (built-in/custom). Use pagination buttons to navigate.
- **`/remove-prompt id:`** — Remove a prompt by ID (shown in `/list-prompts`). Built-in prompts are blocked for your server only; custom prompts are marked rejected.
- **`/review-prompts`** — Review every pending submission one at a time with Approve, Reject, Edit, and pagination.

After pulling these changes, run:

```bash
bun run db:migrate
bun run register-commands
```

## Scoring rules

- **Truth:** reply to the bot's prompt message with non-empty text → 1 point
- **Dare:** reply with media → **5 pts** if no votes or tied; **+5 pts** for each extra 👍 over 👎; **0 pts** if more 👎 than 👍.
- Only the first valid reply per user per prompt message counts
- Valid replies get a ✅ reaction

## Project structure

```
src/
├── index.ts              # Bot entry point
├── start.ts              # Production entry (migrate + seed + start)
├── commands/handlers.ts  # Slash command logic
├── commands/promptAdmin.ts # Mod prompt list/review/remove UI
├── data/prompts/         # Default truth/dare bank (JSON + manifest + validator)
├── handlers/             # Discord event handlers
├── services/             # Prompts, scoring, leaderboard
└── db/                   # Schema, migrations, seed
```
