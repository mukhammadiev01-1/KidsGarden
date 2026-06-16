# KidsGarden Deployment Checklist

This checklist covers the KidsGarden backend and KidsGarden-client frontend. Use placeholder values in committed files and real secrets only in local or deployment environment managers.

## Local Setup

- Install backend dependencies in `KidsGarden`.
- Install frontend dependencies in `KidsGarden-client`.
- Create backend `.env` from backend `.env.example`.
- Create frontend `.env.local` from frontend `.env.example`.
- Start MongoDB.
- Start Redis or configure `REDIS_URL`.
- Start backend API on `http://127.0.0.1:3000`.
- Start frontend on `http://127.0.0.1:7007`.
- Confirm GraphQL responds at `http://127.0.0.1:3000/graphql`.
- Confirm uploaded files render from `http://127.0.0.1:3000/uploads/...`.

## Backend Deployment

- Set `NODE_ENV=production`.
- Set `PORT_API` for the deployed API process.
- Set `PORT_BATCH` if the batch app is deployed.
- Set `MONGO_PROD` to the production MongoDB URI.
- Set a strong `SECRET_TOKEN`.
- Set `REDIS_URL` for Redis Cloud or the production Redis service.
- Set provider credentials only in the deployment secret manager.
- Run `yarn build`.
- Start the API with `yarn start:prod`.
- Start the batch app with `yarn start:prod:batch` if needed.

## Frontend Deployment

- Set `NEXT_PUBLIC_API_URL` to the deployed backend API base URL.
- Set `NEXT_PUBLIC_API_GRAPHQL_URL` to the deployed GraphQL endpoint.
- Set `NEXT_PUBLIC_SITE_URL` to the deployed frontend origin.
- Set public social provider values required by the frontend.
- Set `NEXT_PUBLIC_REALTIME_WS_URL` only if realtime cannot be derived from `NEXT_PUBLIC_API_URL`.
- Run `yarn build`.
- Start with `yarn start` or the hosting platform's Next.js runtime.

## Google OAuth

- Configure the Google OAuth client in Google Cloud.
- Add the local frontend origin for development.
- Add the production frontend origin for deployment.
- Use the same client ID in backend `GOOGLE_CLIENT_ID` and frontend `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- Do not expose client secrets in frontend code.

## Kakao Login

- Enable Kakao Login in Kakao Developers.
- Register the exact redirect URI:
  - Local: `http://127.0.0.1:7007/account/kakao/callback`
  - Production: `https://YOUR_FRONTEND_DOMAIN/account/kakao/callback`
- Frontend uses `NEXT_PUBLIC_KAKAO_REST_API_KEY` only to start the OAuth authorize flow.
- Backend uses `KAKAO_REST_API_KEY` and optional `KAKAO_CLIENT_SECRET` for token exchange.
- If Kakao IP restrictions are enabled, include the deployed backend outbound IPs.
- Never use Kakao Admin key in frontend code.

## Telegram Login

- Create or configure the Telegram bot in BotFather.
- Set the Web Login domain with BotFather `/setdomain`.
- Local ngrok testing should use the current ngrok host as the BotFather domain.
- Frontend uses `NEXT_PUBLIC_TELEGRAM_BOT_NAME`, for example `kidsgarden_login_bot`.
- Backend verifies the classic login widget payload with `TELEGRAM_BOT_TOKEN`.
- Do not expose the bot token in frontend code.

## Kakao Map

- Enable Kakao Map in Kakao Developers.
- Register JavaScript SDK domains:
  - Local/ngrok testing domain as needed.
  - Production frontend domain.
- Frontend uses `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`.
- Do not put Kakao REST API keys or Admin keys into map frontend code.
- If the map SDK fails or coordinates are missing, public pages should show fallback address/location text.

## Redis

- Local development can use `REDIS_URL=redis://localhost:6379`.
- Production should use a managed Redis URL when available.
- Redis is used for realtime pub/sub hints and does not store canonical chat or notification data.
- MongoDB remains the persistence source of truth.
- Redis pub/sub may not show persistent keys in Redis inspection tools.

## Role Safety Rules

- Public signup creates `PARENT` by default.
- Social signup creates `PARENT` only.
- Existing social login preserves the database `memberType`.
- Teacher access requires approval.
- Kindergarten Admin access requires approval.
- Super Admin is internal only.
- Frontend must never send privileged roles or `memberType` in social login payloads.

## Manual QA Checklist

- Normal signup/login.
- Google login.
- Kakao login in login and signup modes.
- Telegram login in login and signup modes.
- Parent-to-kindergarten Application / Inquiry flow.
- Duplicate application handling.
- Application documents upload and rendering.
- Application Chat.
- Teacher to Parent Chat.
- Chat image upload and preview.
- Notification bell and realtime updates.
- Redis stopped fallback.
- Profile, kindergarten, and article image uploads.
- Kakao detail map marker.
- Kakao listing map markers.
- My Kindergarten coordinate editor and address search.
- Public pages at mobile width around 390px.
- Public pages at desktop width around 1300px.

## Files And Secrets To Exclude From Commits

- Backend `.env`.
- Frontend `.env.local`.
- MongoDB credentials.
- Redis credentials.
- JWT secrets.
- OAuth client secrets.
- Telegram bot tokens.
- Kakao Admin keys.
- Screenshots or logs containing secrets.
- Redis dump files such as `dump.rdb`.
- Local upload files unless explicitly intended as fixtures.

Rotate any key or token that was exposed in a screenshot, terminal output, chat message, or committed file.
