# KidsGarden Project Status

Last updated: 2026-06-16

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

## Known Warnings

- Frontend build may print Apollo Client warning URLs during static generation. These are warnings observed during build output, not build failures.
- Frontend build may print `react-i18next:: You will need to pass in an i18next instance...` during static generation. This is currently a known warning and should be investigated separately if it affects runtime localization.
- Compatibility naming remains in some routes, DTO fields, upload targets, and CSS comments for old `/property` compatibility. New work should use KidsGarden kindergarten terminology.
- Manual provider QA requires real configured Google, Kakao, Telegram, Kakao Maps, Redis, and upload environments.

## Current Visual QA Status

| Surface | Status |
| --- | --- |
| Homepage desktop hero at 1280x1000 | Browser screenshot inspected at `/tmp/kg-home-polish-1280.png`. Current result: video visible, old property/building imagery not visible, no homepage search/filter bar, headline/subtitle visible, CTA buttons aligned, four cards equal/readable on a clean surface, and "Built for every role" starts on clean cream background. |
| Homepage dynamic showcase and roadmap at 1280px desktop | Browser screenshot inspected at `/tmp/kg-home-dynamic-full-1280.png`. Current completed result: desktop hero video is preserved, old Nestar/property background layers are removed, homepage search bar is removed, one dynamic `Popular Kindergartens` section renders real `ACTIVE` database records through `kindergartenViews DESC` with `limit: 3`, Communication Roadmap is retained, Private Chat is marked `Available`, and Auto Translation, In-app Calls, and Daily Reports & Albums are marked `Coming Soon`. |
| Homepage lower-section visual rhythm | Confirmed needs another desktop-only visual polish pass. Current issues: excessive vertical empty space between sections, lower sections are visually too small compared with hero/top sections, Communication Roadmap cards need larger dimensions and stronger hierarchy, KidsGarden Store is too compressed, Parent Community Highlights is unbalanced with a large empty news area and small board cards, section heading alignment/style is inconsistent, and lower section container width/card scale need normalization. Hero and upper homepage sections should not be changed in this next pass. |
| `/kindergartens` | Pending browser screenshot review. |
| Kindergarten detail | Pending browser screenshot review. |
| Login/register | Pending browser screenshot review after social login UI changes. |
| Role dashboards | Pending browser screenshot review for My Page, KAdmin, Parent, Teacher, chats, and Super Admin. |

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
