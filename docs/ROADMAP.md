# KidsGarden Roadmap

Last updated: 2026-06-16

This roadmap lists remaining work in priority order. It does not claim manual QA unless it has been performed.

## Priority Order

1. Desktop homepage lower-section visual rhythm polish.
   - Scope: Popular Kindergartens, Communication Roadmap, KidsGarden Store, Parent Community Highlights, Final CTA, and Footer.
   - Desktop only.
   - Reduce excessive empty spacing.
   - Increase section and card visual weight.
   - Keep one consistent 1180px container.
   - Normalize section heading alignment.
   - Improve Communication Roadmap UI only while keeping its content/status meaning.
   - Keep KidsGarden Store as `Coming Soon`.
   - Replace the giant community blank area with a balanced layout or compact polished empty state.
   - Do not change business logic.
   - Do not change the hero or upper homepage sections.
   - Do not change backend, auth, maps, GraphQL, chats, realtime, uploads, or notifications.

2. Continue page-by-page desktop visual QA.
   - Homepage desktop hero and dynamic showcase/roadmap status have been browser-checked at 1280px.
   - Homepage now uses one database-backed `Popular Kindergartens` showcase selected by active kindergarten records sorted by `kindergartenViews DESC` with `limit: 3`.
   - Communication Roadmap remains visible: Private Chat is `Available`; Auto Translation, In-app Calls, and Daily Reports & Albums remain planned.
   - Next visual review should start with `/kindergartens`.

3. Review each page individually with browser screenshots.
   - `/kindergartens`.
   - Kindergarten detail.
   - Login/register.
   - My Page.
   - KAdmin dashboard.
   - Parent dashboard.
   - Teacher dashboard.
   - Chats.
   - Super Admin.

4. Manual functional QA.
   - Google login.
   - Kakao login.
   - Telegram login.
   - Role safety.
   - Applications.
   - Chats.
   - Uploads.
   - Notifications.
   - Maps.

5. Fix confirmed QA bugs.
   - Only fix issues reproduced in browser or runtime QA.
   - Keep bug fixes scoped to the affected feature.

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
