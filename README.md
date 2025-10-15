
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

### On-chain demo flow
1. Create a listing in the web UI (stored off-chain).
2. Click **"Commit on-chain"** on the listing detail page.
3. Your wallet extension (Polkadot{.js}) will ask to sign a `system.remark`.
4. The app stores the resulting hash/tx in the listing.

> NOTE: This is a demo. Real escrow/disputes/etc. need custom pallets or contracts.

## Workspaces
- `apps/web` – front-end UI
- `apps/server` – REST API and SQLite DB
- `packages/chain` – Polkadot connection utilities

## License
MIT
