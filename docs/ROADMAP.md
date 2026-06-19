# KidsGarden Roadmap

Last updated: 2026-06-20

This roadmap lists remaining work in priority order. It does not claim manual QA unless it has been performed.

## Priority Order

1. Continue page-by-page desktop visual QA.
   - Homepage desktop hero and dynamic showcase/roadmap status have been browser-checked at 1280px.
   - Homepage lower-section visual rhythm polish has been browser-checked at 1280x1000.
   - Homepage now uses one database-backed `Popular Kindergartens` showcase selected by active kindergarten records sorted by `kindergartenViews DESC` with `limit: 3`.
   - Communication Roadmap remains visible: Private Chat is `Available`; Auto Translation, In-app Calls, and Daily Reports & Albums remain planned.
   - `/kindergartens` desktop discovery controls have been browser-checked at 1280x1000: grid/list toggle works, preset tabs sort by real fields, `Top Rated` is now `Top Rank`, and `New` uses newest-first sorting.
   - Kindergarten detail controls have been browser-checked at 1280x1000: real detail data loads, gallery control is hidden when no gallery images exist, Contact Center uses the existing auth-required parent application/contact flow, and Request a Visit does not create a fake booking.
   - Login/register desktop QA has been browser-checked at 1280x1000: `/account/login` resolves to the login flow, `/account/join?mode=register` keeps public registration parent-only, old auth visuals and dead controls were cleaned up, provider controls are either wired or clearly unavailable, and no horizontal overflow was detected.
   - My Page first implementation pass is complete at source level, and unauthenticated `/mypage` has been browser-checked at 1280x1000: it redirects to the existing login-mode auth page without crashing or horizontal overflow. Authenticated My Page role views remain pending because no valid local session was available in the QA browser profile.
   - Next visual review should continue with authenticated My Page role views and role dashboards.

2. Review each page individually with browser screenshots.
   - My Page with real Parent, Teacher, Kindergarten Admin, and Super Admin sessions.
   - KAdmin dashboard.
   - Parent dashboard.
   - Teacher dashboard.
   - Chats.
   - Super Admin.

3. Manual functional QA.
   - Google login.
   - Kakao login.
   - Telegram login.
   - Role safety.
   - Applications.
   - Chats.
   - Uploads.
   - Notifications.
   - Maps.

4. Fix confirmed QA bugs.
   - Only fix issues reproduced in browser or runtime QA.
   - Keep bug fixes scoped to the affected feature.

5. Messages Inbox / MessageBell.
   - Priority: after current visual and dummy-control QA tasks, before production deployment polish.
   - Add a message icon/button in the header next to the existing notification bell.
   - Show unread message count separately from general notifications.
   - Clicking the message icon should open `/messages`.
   - `/messages` should aggregate existing user conversations from Application chats, Parent-Teacher chats, and future chat types if added later.
   - Existing contextual chats remain in place: child detail / teacher context, parent dashboard, teacher dashboard, application detail, kindergarten admin context, Parent-Teacher Chat, and Application Chat.
   - Conversation items should show participant name, kindergarten context if available, child context if available, conversation type label, last message preview, last message time, unread count, and avatar/image if available.
   - Clicking a conversation should open the existing chat flow, not a duplicated new chat system.
   - Realtime unread badges should update when WebSocket/realtime is available.
   - If realtime is unavailable, unread counts should still load from API on page load/refetch.
   - Architecture investigation: audit ApplicationChat model/query, audit ParentTeacherChat model/query, check whether unread/read tracking exists through `readBy`, `seenAt`, `isRead`, or similar fields, design a unified conversation summary query if missing, create `MessageBell`, create `/messages`, and avoid duplicating message storage.
   - MongoDB remains the source of truth; Redis/realtime is only for live updates.
   - Keep the known realtime warning `ws://127.0.0.1:3007/?token=` tracked separately.

6. Production realtime `wss://` configuration.
   - Configure production WebSocket origin.
   - Confirm Redis URL/TLS settings.
   - Verify realtime fallback behavior when Redis or WebSocket delivery is unavailable.

7. Deployment.
   - Finalize backend and frontend environment values in the deployment secret managers.
   - Run production builds.
   - Confirm uploads, GraphQL, realtime, social redirects, and Kakao Maps in the deployed environment.

8. Portfolio screenshots/demo.
   - Capture clean desktop screenshots after visual QA.
   - Prepare demo flow covering public discovery, applications, dashboards, chat, notifications, maps, and social login.

9. Future feature: About Us page.

## About Us Future Scope

| Item | Scope |
| --- | --- |
| Route | Add `/about-us` or `/about`. |
| Mission and story | Explain KidsGarden's platform mission and early-learning workflow story. |
| Audiences | Cover parents, teachers, and kindergartens. |
| Safety and trust | Explain role approval, private child data, relationship-scoped chat, and secure social login. |
| Values | Communicate clarity, safety, communication, and growth. |
| CTAs | Include `Find Kindergartens`, `Join as Parent`, and `For Centers`. |
| Navigation | Add a navigation link after route and content are approved. |
| SEO metadata | Add title, description, canonical metadata, and share metadata. |
| Design | Match the current KidsGarden green/cream visual system. |

## Documentation Rules

- Do not include real secrets.
- Do not copy values from `.env` or `.env.local`.
- Keep placeholder values in committed examples only.
- Clearly distinguish implemented code, browser-verified behavior, and pending manual QA.
- Use KidsGarden kindergarten terminology for new documentation.
- Treat old Nestar/property language as legacy compatibility only.
