# V2RayBot

A Telegram bot that sells and manages V2Ray (VMess) accounts on a remote server.
Users pick a plan, pay, and receive a ready-to-use config; the bot then tracks their
traffic and expiry and removes the account when either runs out. The bot is no
longer in production.

## What it does

- **Plans and purchases:** users choose a plan (duration and traffic quota). An admin
  confirms each payment from inside Telegram before the account is created.
- **Account provisioning over SSH:** the bot connects to the V2Ray server, adds a
  client to the VMess inbound in `config.json`, restarts the service and sends the
  user a `vmess://` link. Configs can be regenerated on request.
- **Usage tracking:** a scheduled job reads per-user traffic from the V2Ray stats API
  every hour and stores it in PostgreSQL.
- **Scheduled jobs (node-cron):** disable accounts that hit their traffic limit, remove
  expired accounts, warn users before expiry, keep the server config in sync with
  the database, and back up the database.
- **Free trial and gift accounts**, an active-service overview, a support chat and a
  short setup guide for users.

## Stack

| Area | Tools |
| --- | --- |
| Language | TypeScript (Bun / Node.js) |
| Bot framework | GramIO with scenes, sessions, pagination and auto-retry plugins |
| Data | PostgreSQL with Prisma ORM, Redis for sessions |
| Concurrency | Verrou locks (memory or Redis) around account changes |
| Server automation | node-ssh, V2Ray stats API |
| Webhook | Fastify |
| Tooling | Docker Compose, ESLint, Husky |

## Run

```bash
cp .env.example .env                          # fill in the values
docker compose -f docker-compose.dev.yml up   # PostgreSQL and Redis
bunx prisma migrate deploy
bun dev
```

Production: `docker compose up -d`.
