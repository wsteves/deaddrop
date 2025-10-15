
# DeadDrop

Decentralized file and messge storing with signed messages and on-chain remarks. 

## Tech
- React + Vite + TypeScript + Tailwind (apps/web)
- Fastify + TypeScript + SQLite (apps/server)
- Polkadot.js API helpers (packages/chain)

## Quickstart
```bash
# 1) Install deps (node >= 18):
npm i

# 2) Start the server (port 4000):
npm run dev:server

# 3) Start the web app (port 5173):
npm run dev:web
```

Set your chain endpoint via env:
- Web: `VITE_WS_ENDPOINT` (defaults to wss://westend-rpc.polkadot.io)
- Server (optional, only used for planned features): `WS_ENDPOINT`

## Workspaces
- `apps/web` – front-end UI
- `apps/server` – REST API and SQLite DB
- `packages/chain` – Polkadot connection utilities

## License
MIT
