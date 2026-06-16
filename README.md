# KidsGarden Backend

KidsGarden backend is a NestJS GraphQL API for kindergarten discovery, parent applications, role approval, private chat, notifications, uploads, maps data, and social authentication.

The API app lives in `apps/kidsgarden-api`. The batch app lives in `apps/kidsgarden-batch`.

## Prerequisites

- Node.js compatible with the project dependencies
- Yarn or npm
- MongoDB
- Redis for realtime pub/sub
- Provider credentials for enabled social login flows

## Install

```bash
yarn install
```

or:

```bash
npm install
```

## Environment

Create `.env` from `.env.example` and fill in local or deployment values.

```bash
cp .env.example .env
```

Required local defaults:

- API: `PORT_API=3000`
- Batch: `PORT_BATCH=3001`
- Redis: `REDIS_URL=redis://localhost:6379`
- GraphQL: `http://127.0.0.1:3000/graphql`

Do not commit `.env`. Use placeholder values in documentation and examples only.

## Local Startup

Start the API:

```bash
yarn start:dev
```

Start the batch app when needed:

```bash
yarn start:dev:batch
```

Production-style API start after build:

```bash
yarn build
yarn start:prod
```

## Build

```bash
yarn build
```

## GraphQL

Local GraphQL endpoint:

```text
http://127.0.0.1:3000/graphql
```

Apollo playground is enabled by the current backend configuration.

## Uploads

Uploaded files are stored under `uploads/` and served statically from:

```text
http://127.0.0.1:3000/uploads/...
```

Current upload areas include member images, kindergarten images, article images, kindergarten application documents, and chat images. MongoDB remains the source of truth for saved upload paths.

## Redis And Realtime

Redis is used for realtime pub/sub delivery only. It does not replace MongoDB persistence.

Local Redis example:

```env
REDIS_URL=redis://localhost:6379
```

The private realtime gateway is available at:

```text
ws://127.0.0.1:3000/realtime
```

JWT authentication is required for private realtime connections.

## Social Auth Backend Setup

Google:

- Set `GOOGLE_CLIENT_ID`.
- Backend verifies Google ID tokens server-side.

Kakao:

- Set `KAKAO_REST_API_KEY`.
- Set `KAKAO_CLIENT_SECRET` only if Kakao Client Secret is enabled.
- Backend exchanges authorization codes server-side.

Telegram:

- Set `TELEGRAM_BOT_TOKEN`.
- Backend verifies classic Telegram Login Widget hash server-side.

Social signup creates `PARENT` users only. Existing users keep their database `memberType`. Teacher and Kindergarten Admin access requires approval. Super Admin is internal only.

## Security Notes

- Never commit `.env`, provider secrets, JWT secrets, MongoDB credentials, Redis credentials, or screenshots containing secrets.
- Rotate exposed keys or tokens immediately.
- Do not put Kakao Admin keys in frontend code or public environment variables.
- Frontend social auth must never send `memberType` or role.
- Redis/WebSocket events are realtime hints; MongoDB remains the source of truth.

## Useful Commands

```bash
yarn build
yarn start:dev
yarn start:dev:batch
git diff --check
```
