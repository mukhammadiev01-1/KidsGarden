# KidsGarden Project Status

Last updated: 2026-06-21

This document summarizes the current implemented state across the backend repository and the sibling `KidsGarden-client` frontend. It separates implemented code from browser-verified work and manual QA that is still pending.

## Completed

| Area | Current status |
| --- | --- |
| Google login | Implemented. Frontend sends the Google ID token to the backend, and backend verifies it server-side. |
| Kakao login with LOGIN/SIGNUP intent | Implemented. Kakao OAuth callback supports login/signup intent handling without exposing privileged role selection. |
| Telegram classic widget login with LOGIN/SIGNUP intent | Implemented. Backend verifies Telegram widget payload hashes server-side, and frontend uses the classic widget flow. |
| Social role safety | Implemented. Social signup creates `PARENT` only, existing social users preserve database `memberType`, and social payloads do not grant Teacher, Kindergarten Admin, or Super Admin. |
| Parent kindergarten applications/inquiries | Implemented. Parents can create, list, and cancel their own kindergarten applications where status rules allow it. |
| Application Chat | Implemented. Application-scoped conversations and messages persist through GraphQL, with participant-based access control. |
| Parent-Teacher Chat | Implemented in the current chat UI work. Manual role-to-role browser QA remains pending. |
| Chat image uploads | Implemented in the current upload/chat pass. Manual upload rendering QA remains pending. |
| Redis realtime/pub-sub | Implemented. Redis delivers realtime hints for private notification and chat updates; MongoDB and GraphQL remain the source of truth. |
| Kindergarten groups | Implemented for Kindergarten Admin and Teacher workflows. |
| Children | Implemented for parent and kindergarten operations. |
| Attendance | Implemented for Teacher and Kindergarten Admin workflows. |
| Staff | Implemented for Kindergarten Admin staff management and Teacher approval workflow. |
| Kakao Maps detail marker | Implemented in `KidsGarden-client` detail map component. |
| Kakao Maps listing markers | Implemented in `KidsGarden-client` listing map component. |
| MyKindergarten coordinate editor | Implemented for Kindergarten Admin map coordinate management. |
| Kakao address search | Implemented as part of the MyKindergarten map/coordinate workflow. |
| SEO/PageSeo | Implemented in `KidsGarden-client` and wired into public pages including the homepage. |
| README/env/deployment documentation | Implemented. Backend and frontend README/env examples exist, and backend `docs/DEPLOYMENT.md` documents local, deployment, auth, maps, Redis, and role safety setup. |
| UI repair passes | Implemented for auth, dashboards, chats, notifications, and responsive layout. Some browser regression QA remains pending. |
| Homepage hero video work | Implemented. Desktop homepage hero uses `/videos/kidsgarden-hero.mp4`, removes the homepage search/filter bar, disables legacy hero media layers, and keeps four feature cards in a clean row. |
| Homepage dynamic kindergarten showcase | Implemented in `KidsGarden-client`. Homepage renders one `Popular Kindergartens` showcase from database records using `getKindergartens` with active-kindergarten backend filtering, `limit: 3`, and `kindergartenViews DESC`. The title matches the popularity-based selection logic. |
| Homepage Communication Roadmap | Implemented in `KidsGarden-client`. The roadmap remains visible with Private Chat marked `Available`; Auto Translation, In-app Calls, and Daily Reports & Albums remain `Coming Soon`. |
| Homepage lower-section visual rhythm | Implemented in `KidsGarden-client` for desktop. Popular Kindergartens, Communication Roadmap, KidsGarden Store, Parent Community Highlights, Final CTA, and Footer now share the 1180px desktop rhythm, stronger card scale, aligned headings, and cleaner lower-section spacing without changing homepage hero or business logic. |
| `/kindergartens` discovery controls | Implemented in `KidsGarden-client`. Desktop grid/list view toggle now uses real buttons and local view state, list mode renders the same real kindergarten records in full-width rows, map preset tabs apply real sort behavior, `Top Rated` was renamed to `Top Rank` because `kindergartenRank` is rank-based rather than review-rating data, and `New` now sorts by `createdAt DESC`. |
| Kindergarten detail controls | Implemented in `KidsGarden-client`. `See all photos` scrolls to the real gallery when `kindergartenImages` exist and is hidden when no gallery images exist. Hero and sidebar `Contact Center` use the existing parent application/contact flow, preserving login and parent-role requirements. `Request a Visit` uses the same real application flow with visit-intent helper text for eligible parents and does not create a fake booking. |
| Login/register desktop QA | Browser-checked in `KidsGarden-client` at 1280x1000. `/account/login` now resolves through the existing login-mode auth page, `/account/join?mode=register` renders the parent-only public registration flow, the old auth logo/background treatment was removed from the auth surface, the dead forgot-password link is marked as coming soon, local Telegram provider mismatch renders as a disabled explanatory control, and form validation remains native HTML required-field validation. |
| My Page first fix pass | Implemented in `KidsGarden-client`. Unauthenticated `/mypage` now redirects to the existing login flow, stored JWT sessions are allowed to hydrate before the page redirects, Super Admin redirect to `/_admin` is preserved, the desktop My Page shell was moved toward the KidsGarden 1180px green/cream style, the profile form no longer requires a custom image before saving text fields, role request copy now says access/request rather than implying instant role grants, and fallback dummy sections/controls are marked Coming Soon or disabled instead of acting live. |

## Implemented But Awaiting Manual QA

| Area | Pending verification |
| --- | --- |
| Google login | Real provider login and account linking behavior in browser. |
| Kakao login | Login and signup intent flows against configured Kakao app settings. |
| Telegram login | Login and signup intent flows against configured BotFather Web Login domain. |
| Social role safety | Confirm no social flow can create or elevate Teacher, Kindergarten Admin, or Super Admin access. |
| Parent applications/inquiries | Parent create, duplicate rejection, cancel, Kindergarten Admin review, and Super Admin review with real accounts. |
| Application Chat | Parent and Kindergarten Admin messaging in two browser sessions. |
| Parent-Teacher Chat | Role-scoped access and message delivery with real Parent and Teacher accounts. |
| Chat image uploads | Upload, preview, persistence, and render from backend `/uploads`. |
| Redis realtime/pub-sub | Notification and chat realtime events, plus Redis-stopped fallback. |
| Kindergarten groups, children, attendance, staff | End-to-end dashboard QA for Kindergarten Admin and Teacher roles. |
| Kakao Maps | Listing markers, detail marker, coordinate editor, and address search with real Kakao SDK configuration. |
| Notifications | Unread count, recent list, mark one read, mark all read, navigation targets, and realtime updates. |
| Responsive UI repairs | Page-by-page screenshot pass is still needed outside the latest desktop homepage hero check. |
| My Page authenticated role views | Browser QA with real Parent, Teacher, Kindergarten Admin, and Super Admin sessions. Current My Page first pass was browser-checked only for unauthenticated redirect because no valid local session was available in the QA browser profile. Source-level role QA confirms the top-level My Page route still whitelists dashboard categories by role, and a stored-JWT hydration race was fixed. |

## Known Warnings

- Frontend build may print Apollo Client warning URLs during static generation. These are warnings observed during build output, not build failures.
- Frontend build may print `react-i18next:: You will need to pass in an i18next instance...` during static generation. This is currently a known warning and should be investigated separately if it affects runtime localization.
- Desktop homepage browser QA still reports the existing local realtime warning `WebSocket connection to 'ws://127.0.0.1:3007/?token=' failed`. Realtime configuration is outside the homepage visual polish scope.
- Compatibility naming remains in some routes, DTO fields, upload targets, and CSS comments for old `/property` compatibility. New work should use KidsGarden kindergarten terminology.
- Manual provider QA requires real configured Google, Kakao, Telegram, Kakao Maps, Redis, and upload environments.

## Future Planned Features

| Feature | Planned scope |
| --- | --- |
| Messages Inbox / MessageBell | Planned future feature. This must not replace existing contextual chats in child detail / teacher context, parent dashboard, teacher dashboard, application detail, kindergarten admin context, Parent-Teacher Chat, or Application Chat. The goal is to add a header message icon next to the notification bell, show an unread message count that is separate from general notifications, and open a unified `/messages` inbox. `/messages` should aggregate existing Application chats, Parent-Teacher chats, and future chat types without duplicating message storage. Conversation items should show participant name, kindergarten context, child context, conversation type label, last message preview, last message time, unread count, and avatar/image where available. Clicking a conversation should open the existing chat flow. Realtime unread badges should update when WebSocket/realtime is available, while API load/refetch should still provide unread counts when realtime is unavailable. MongoDB remains the source of truth; Redis/realtime is only for live updates. |
| KAdmin Kindergarten Creation Approval + Map Address UX | Planned future backend + frontend task. Kindergarten create/edit should move the normal KAdmin flow away from raw latitude/longitude and toward address search plus map selection, preferably Kakao map/address search. The UI should show a human-readable address, selected map marker, and optional map preview, while latitude/longitude are saved internally. Manual coordinate fields, if still needed, should be hidden under Advanced options. KAdmin-created kindergartens should be pending review/approval first, not public/ACTIVE immediately. Super Admin should approve or reject new centers, and public listing should show only approved/ACTIVE kindergartens. Anti-abuse rules need investigation and backend enforcement, including whether one KAdmin can create unlimited kindergartens, whether to limit active centers per KAdmin, whether pending requests should be limited, or whether every new center requires Super Admin approval. Current role policy remains unchanged: public signup creates Parent/default users, Teacher/KAdmin access requires approval/invite/request, and Super Admin remains internal only. |

### Messages Inbox / MessageBell Investigation Notes

- Audit ApplicationChat model/query.
- Audit ParentTeacherChat model/query.
- Check if unread/read tracking exists through fields such as `readBy`, `seenAt`, `isRead`, or equivalent.
- Design a unified conversation summary query if missing.
- Create a `MessageBell` component.
- Create a `/messages` page.
- Avoid duplicating message storage.
- Keep the known realtime warning `ws://127.0.0.1:3007/?token=` tracked separately from this feature.

### KAdmin Kindergarten Creation Approval + Map Address UX Notes

- Future backend + frontend task only; not implemented in the current codebase.
- Normal KAdmin kindergarten create/edit should be address/map based, not raw coordinate based.
- Prefer Kakao address search and map marker selection for the primary UX.
- Save latitude/longitude internally after address/map selection.
- Hide manual latitude/longitude fields under Advanced options if they remain necessary.
- New KAdmin-created kindergartens should use a pending review status such as `PENDING_REVIEW` or `PENDING_APPROVAL`.
- Super Admin should review and approve/reject new centers.
- Only approved/ACTIVE kindergartens should be public and appear in public listing.
- Investigate anti-abuse limits and enforce them in the backend, not UI only.

## Current Visual QA Status

| Surface | Status |
| --- | --- |
| Homepage desktop hero at 1280x1000 | Browser screenshot inspected at `/tmp/kg-home-polish-1280.png`. Current result: video visible, old property/building imagery not visible, no homepage search/filter bar, headline/subtitle visible, CTA buttons aligned, four cards equal/readable on a clean surface, and "Built for every role" starts on clean cream background. |
| Homepage dynamic showcase and roadmap at 1280px desktop | Browser screenshot inspected at `/tmp/kg-home-dynamic-full-1280.png`. Current completed result: desktop hero video is preserved, old Nestar/property background layers are removed, homepage search bar is removed, one dynamic `Popular Kindergartens` section renders real `ACTIVE` database records through `kindergartenViews DESC` with `limit: 3`, Communication Roadmap is retained, Private Chat is marked `Available`, and Auto Translation, In-app Calls, and Daily Reports & Albums are marked `Coming Soon`. |
| Homepage lower-section visual rhythm at 1280x1000 | Browser screenshots captured at `/tmp/kg-home-lower-pre-1280.png` and `/tmp/kg-home-lower-post-1280.png`. Current completed result: Popular Kindergartens remains one dynamic section with three active database records, Communication Roadmap keeps Private Chat `Available` and the other items `Coming Soon`, KidsGarden Store remains `Coming Soon`, Parent Community Highlights uses a compact empty-news state plus larger board cards, Final CTA and Footer align to the same desktop container, and no horizontal overflow was detected. |
| `/kindergartens` at 1280x1000 | Browser QA completed for the discovery controls. Screenshots captured at `/tmp/kg-kindergartens-grid-1280.png` and `/tmp/kg-kindergartens-list-1280.png`. Current result: three real kindergarten records render in grid and list modes, grid/list buttons are real buttons with correct `aria-pressed`, preset tabs update active state and query sort values, `View Details` navigates from both grid and list cards, search still submits, pagination renders a disabled next button for the current three-record dataset, map fallback remains visible, and no horizontal overflow was detected. Existing realtime `ws://127.0.0.1:3007/?token=` warning remains separate. |
| Kindergarten detail at 1280x1000 | Browser QA completed for `/kindergartens/detail?id=6a17819994028bb86d02b496`. Screenshots captured at `/tmp/kg-detail-after-1280.png`, `/tmp/kg-detail-gallery-1280.png`, `/tmp/kg-detail-hero-contact-1280.png`, `/tmp/kg-detail-visit-1280.png`, and `/tmp/kg-detail-sidebar-contact-1280.png`. Current result: real `KidsNest` data loads, the current record has no `kindergartenImages` so `See all photos` is hidden rather than inert, hero `Contact Center`, sidebar `Contact Center`, and `Request a Visit` show the existing login-required flow for unauthenticated users, no horizontal overflow was detected, and no new page errors were reported. Existing Apollo request logging and realtime warnings remain separate. |
| Login/register at 1280x1000 | Browser QA completed. Screenshots captured at `/tmp/kg-auth-login-post-1280.png`, `/tmp/kg-auth-register-post-1280.png`, and `/tmp/kg-auth-validation-post-1280.png`. Current result: `/account/login` redirects to login mode, `/account/join?mode=register` renders the parent-only registration flow, login/register cards are centered with KidsGarden branding, required fields accept input and expose native validation, Google and Kakao controls remain wired to existing handlers, Telegram is disabled with a local-domain explanation in this local environment, password reset is marked coming soon instead of acting like a dead link, no old property/agent wording is visible, and no horizontal overflow was detected. Existing realtime `ws://127.0.0.1:3007/?token=` warning and Google Identity Services repeated-initialize warning remain separate. |
| My Page unauthenticated at 1280x1000 | Browser QA completed for the unauthenticated route. Latest screenshot captured at `/tmp/kg-mypage-role-qa-1280.png`. Current result: `/mypage` redirects to the existing login-mode auth page, the route does not crash, no valid local `accessToken` was present in the QA browser profile, and no horizontal overflow was detected. Authenticated My Page visual QA remains pending. |
| Role dashboards | Pending browser screenshot review with authenticated Parent, Teacher, Kindergarten Admin, and Super Admin accounts. My Page source-level first pass is implemented, and the stored-JWT hydration guard is fixed, but authenticated role views still need real-session QA. |

## Current Project Rules

- Public signup creates `PARENT` only.
- Social signup creates `PARENT` only.
- Existing social users preserve the database `memberType`.
- Teacher access requires approval.
- Kindergarten Admin access requires approval.
- Super Admin is internal only.
- Kindergarten Admin update remains status-only where that workflow is constrained.
- Do not change auth, maps, chats, uploads, notifications, permissions, or GraphQL during isolated homepage hero tasks.
- Current KidsGarden green/cream design is the source of truth.
- Nestar/property terminology is legacy compatibility only and should not be used for new product language.
