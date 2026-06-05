# Backend Status

## Infrastructure

| Item | Status | Notes |
| --- | --- | --- |
| API app | Implemented | Active app path is `apps/kidsgarden-api`. |
| Batch app | Implemented | Active app path is `apps/kidsgarden-batch`. |
| Redis foundation | Implemented | Uses `REDIS_URL`; local development should set `REDIS_URL=redis://localhost:6379`. Redis is for realtime/pub-sub only, not persistence. |
| Private realtime gateway | Implemented | WebSocket path is `/realtime`; JWT is required and authenticated users are hydrated from the database before connection. |
| Compatibility naming | Temporary | Some old route/API fields, enum values, upload targets, and migration mappings remain only for backward compatibility. Do not remove unless a task explicitly scopes compatibility cleanup. |

## Auth And Session

| Item | Status | Notes |
| --- | --- | --- |
| JWT validation | Implemented | Protected guards hydrate the current member from the database before authorization. |
| Blocked/deleted users | Implemented | Non-active members are rejected by protected guards. |
| Optional public auth | Implemented | Public optional auth treats invalid/stale tokens as anonymous. |
| Role authorization | Implemented | Role guard checks current database `memberType`. |
| Token payload size | Needs verification | Token still appears broad. Future cleanup can reduce payload once frontend dependencies are known. |

## Role Approval Rules

| Rule | Status |
| --- | --- |
| Public signup defaults to Parent | Implemented |
| Teacher access requires staff application approval | Implemented |
| Kindergarten Admin access requires approval | Implemented |
| Super Admin remains separate platform role | Implemented |
| OAuth/Telegram must not grant privileged roles automatically | Planned |

## Application / Inquiry MVP

| Area | Status | Notes |
| --- | --- | --- |
| `ApplicationStatus` enum | Implemented | `PENDING`, `REVIEWING`, `APPROVED`, `REJECTED`, `CANCELED`, `NEED_MORE_INFO`. |
| Application schema/model | Implemented | Stores parent, kindergarten, owner, child info, parent message, admin note, status, review/cancel timestamps. |
| DTOs | Implemented | Application output, inquiry input, create input, and status update input exist. |
| `ApplicationModule` | Implemented | Registered in backend components module. |
| `ApplicationResolver` | Implemented | Exposes parent, kindergarten admin, and super admin queries/mutations. |
| `ApplicationService` | Implemented | Handles scoping, duplicate prevention, valid status transitions, and cancellation. |
| `createApplication` | Implemented | Parent only. Creates a `PENDING` application and prevents duplicate open applications for the same parent/kindergarten. |
| `getMyApplications` | Implemented | Parent only. Returns only the authenticated parent's applications. |
| `getKindergartenApplications` | Implemented | Kindergarten Admin only. Returns applications for kindergartens managed by the authenticated admin. |
| `getAllApplicationsForAdmin` | Implemented | Super Admin only. Returns all parent applications. |
| `updateApplicationStatus` | Implemented | Kindergarten Admin for owned kindergartens or Super Admin. Supports `REVIEWING`, `APPROVED`, `REJECTED`, `NEED_MORE_INFO`, and `CANCELED` where transitions are allowed. |
| `cancelApplication` | Implemented | Parent owner only. Blocks cancellation of final statuses. |
| Integration QA/bugfix pass | Completed | Schema/operation consistency and build checks passed. Authenticated browser QA with real accounts remains. |

## Kindergarten Backend

| Area | Status | Notes |
| --- | --- | --- |
| Public list/detail | Implemented | Public list caps and escaped text search are in place. |
| Likes/favorites | Implemented | Kindergarten likes are active. |
| Recently visited | Fixed | `getVisited` uses view/visited data instead of favorite data. |
| Owner kindergarten dashboard data | Implemented | Kindergarten Admin can list/manage own kindergarten data. |
| Create kindergarten transaction | Implemented | Create flow creates kindergarten, owner staff, and member counter in a transaction. |
| Admin status updates | Implemented | Super Admin kindergarten update is status-only. |

## Upload Status

| Area | Current State | Required Verification |
| --- | --- | --- |
| Upload mutations | Present | `imageUploader` and `imagesUploader` exist and require auth. |
| Static serving | Present | Uploads are served from backend `/uploads`. |
| Target allowlist | Needs manual verification | Expected active targets are `member`, `kindergarten`, and `article`; compatibility target may remain temporarily. |
| MIME validation | Needs manual verification | Expected image types are PNG/JPG/JPEG/WEBP. |
| Member/profile images | Needs manual verification | Verify upload, save-to-DB, and render through `/uploads`. |
| Kindergarten images | Needs manual verification | Verify main image/gallery upload, save-to-DB, and render through `/uploads`. |
| Staff/teacher participant images | Needs verification | Current staff UI appears to use member images, not separate staff image upload. |

## Notifications And Chat

| Area | Status | Notes |
| --- | --- | --- |
| Simple socket gateway | Present | Current global socket flow is not used for private application chat or notifications. |
| Persisted application chat | Implemented | `APPLICATION_CHAT` uses `Conversation` and `Message` persistence through GraphQL. |
| Relationship-based chat permissions | Implemented | Parent, Kindergarten Admin, and Super Admin access is scoped to the linked Kindergarten Application; Teacher is excluded. |
| Realtime application chat | Implemented | After Mongo message persistence, `application_chat.message.created` is published to conversation participants except the sender. |
| Notification model/API | Implemented | Unified in-app notifications include recipient, sender, audience, type, target, metadata, read state, and guarded list/read mutations. |
| Notification access control | Implemented | Authenticated users can list and mark only their own notifications. |
| NotificationBell | Frontend implemented | Header bell supports unread count, recent list, mark one read, mark all read, and safe target navigation. |
| Connected notification events | Implemented | Kindergarten Application created/status/canceled, application chat message, Teacher Application created/status, Kindergarten Admin Application created/status, and kindergarten comment created. |
| Skipped notification events | Intentional | Comment replies, comment likes, and broad article/news notifications are deferred until thread/comment-like/audience rules are clear. |
| Realtime notifications | Implemented | After Mongo notification persistence, `notification.created` is published to the recipient's private realtime channel. |
| Realtime source of truth | Implemented | Mongo and GraphQL remain authoritative; Redis/WebSocket only delivers realtime hints that trigger frontend refetches. |
| Later realtime features | Deferred | Typing indicators, online presence, chat files/images, advanced unread cache, and production Redis/TLS setup are later phases. |

## Notification Privacy Rules

| Rule | Status | Notes |
| --- | --- | --- |
| No sensitive child/document text in notifications | Implemented | Application notifications use generic titles/messages and status metadata only. |
| No chat message text in notifications | Implemented | Chat notifications say a new message exists and link to the application chat target. |
| No comment body in notifications | Implemented | Kindergarten comment notifications do not include comment content. |
| Sender excluded | Implemented | Event hooks exclude the actor from recipient lists. |
| Duplicate recipients deduped | Implemented | Recipient helper methods dedupe active recipient IDs before notification creation. |
| Notification creation is best-effort | Implemented | Workflow operations catch notification creation failures so core operations continue. |

## Compatibility Layer

| Item | Status | Rule |
| --- | --- | --- |
| Old public route names | Temporary frontend compatibility | Do not add new links to them. |
| Old API fields such as fee/filter compatibility aliases | Temporary backend compatibility | Keep until frontend/API migration is complete and old data has been handled. |
| Old enum fallback values | Temporary DB compatibility | Keep until migration has been run and verified. |
| Upload compatibility target | Temporary upload compatibility | Keep only while old stored references or client code might still depend on it. |

## Known Backend Risks

| Risk | Severity | Recommended Fix |
| --- | --- | --- |
| Realtime browser QA still pending | High | Verify `/realtime` auth, notification events, and application chat events with real accounts. |
| Application / Inquiry needs authenticated browser QA | High | Test Parent create/cancel, Kindergarten Admin update, and Super Admin update with real accounts. |
| Notifications need authenticated browser QA | High | Test delivery, unread count, mark read, mark all read, and target navigation with real role accounts. |
| Upload flow needs manual verification | High | Verify profile, kindergarten, and article image upload end to end. |
| Token payload broadness | Medium | Reduce after frontend dependency audit. |
| Remaining hard-delete admin mutations may exist | Medium | Keep UI unwired; audit before exposing. |
| Production Redis/TLS configuration | Medium | Add deployment-specific Redis URL/TLS and connection monitoring before production. |
| Counter drift on non-transactional areas | Low | Audit after MVP unless user-visible drift appears. |
