# KidsGarden Project Overview

## Product

KidsGarden is an early learning platform for families, teachers, kindergartens, and platform administrators.

The product combines public kindergarten discovery with private role-based dashboards for applications, children, groups, attendance, staff operations, community content, support, and platform administration.

## Current Active Naming

| Area | Active KidsGarden Name |
| --- | --- |
| Public listing route | `/kindergartens` |
| Public detail route | `/kindergartens/detail` |
| Admin kindergarten route | `/_admin/kindergartens` |
| Backend API app | `apps/kidsgarden-api` |
| Backend batch app | `apps/kidsgarden-batch` |
| Public entity | Kindergarten |
| Parent-to-kindergarten workflow | Application / Inquiry |

New code should use KidsGarden and kindergarten-oriented naming. Older route/API/enum/asset names may still exist only as a temporary compatibility layer and should not be treated as active architecture.

## Main Product Areas

| Area | Purpose | Current Status |
| --- | --- | --- |
| Public homepage | Platform positioning, featured kindergartens, community/news, future roadmap | Implemented |
| Kindergartens listing | Search, filter, like, and browse public kindergarten profiles | Implemented at `/kindergartens` |
| Kindergarten detail | Public center profile, gallery, likes, comments/reviews, parent application form, teacher application entry | Implemented at `/kindergartens/detail` |
| Parent community | Articles, Q&A-style content, parent tips, platform news | Implemented |
| Help center | Static support page for parents, teachers, kindergartens, account, privacy, applications | Implemented |
| Auth | Login/register with browser password-manager friendly form and canonical `/login`/`/register` redirects | Implemented |
| In-app notifications | Unified notification model/API, header bell, unread count, read actions, core workflow events, and realtime delivery | Implemented |
| Parent dashboard | Children, attendance, staff application, kindergarten admin application, Parent Board write, My Applications | Implemented |
| Teacher dashboard | Assigned groups and attendance | Implemented |
| Kindergarten admin dashboard | My kindergarten, staff, staff applications, groups, children, attendance, incoming parent applications | Implemented |
| Super Admin | Members, kindergartens, parent applications, role applications, community moderation, read-only operations | Implemented |

## Roles

| Role | Access Model |
| --- | --- |
| Parent | Public signup role. Can manage own children, own parent-to-kindergarten applications, and community workflows. |
| Teacher | Requires approval through staff application flow. Can access assigned groups and attendance. Does not manage parent applications in MVP. |
| Kindergarten Admin | Requires approval through kindergarten admin application flow. Can manage own kindergarten operational data and incoming parent applications for owned kindergartens. |
| Super Admin | Internal platform role only. Can review all platform data and all parent applications through `/_admin`. |

## Terminology

| Term | Meaning |
| --- | --- |
| Kindergarten | Public center profile and operational entity. |
| Application / Inquiry | Parent request to apply to or contact a kindergarten. |
| Staff Application | Approval workflow for Teacher access. |
| Kindergarten Admin Application | Approval workflow for Kindergarten Admin access. |
| Parent Board | Parent-facing community/article area. |
| Staff | Internal kindergarten staff record. |
| Group | Classroom/group under a kindergarten. |
| Attendance | Child attendance record scoped by kindergarten/group/child. |

## Product Rules

- Public signup creates Parent accounts by default.
- Social login must create or log in Parent accounts only by default.
- Teacher access requires approval.
- Kindergarten Admin access requires approval.
- Super Admin is internal only.
- Teacher must not manage parent applications unless explicitly added in a later feature phase.
- Public UI must not expose children, parents, teachers, staff, admins, or member profile directories.

## Current Priorities

1. Run manual browser QA for the Application / Inquiry MVP using real Parent, Kindergarten Admin, and Super Admin accounts.
2. Run manual browser QA for notification and application chat realtime delivery with real Parent and Kindergarten Admin accounts.
3. Finish approval-flow polish for Teacher and Kindergarten Admin access.
4. Add chat image attachments after persisted and realtime application chat are stable.
5. Prepare social login without granting privileged roles automatically.
6. Replace map placeholders with geocoded kindergarten location support.
7. Continue dashboard and production polish after core workflows are stable.
