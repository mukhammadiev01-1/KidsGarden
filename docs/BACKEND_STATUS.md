# Backend Status

## Infrastructure

| Item | Status | Notes |
| --- | --- | --- |
| API app | Implemented | Active app path is `apps/kidsgarden-api`. |
| Batch app | Implemented | Active app path is `apps/kidsgarden-batch`. |
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
| Simple socket gateway | Present | Current socket flow is not production-grade. |
| Persistent conversations | Missing | Needs `Conversation`, `Message`, and read-state model design. |
| Relationship-based permissions | Missing | Chat must be scoped by parent/teacher/kindergarten relationships. |
| Notifications | Missing | Needs event model and delivery plan. |

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
| Socket auth may not match GraphQL hydrated guard behavior | High | Rework socket auth during full chat phase. |
| Application / Inquiry needs authenticated browser QA | High | Test Parent create/cancel, Kindergarten Admin update, and Super Admin update with real accounts. |
| Upload flow needs manual verification | High | Verify profile, kindergarten, and article image upload end to end. |
| Token payload broadness | Medium | Reduce after frontend dependency audit. |
| Remaining hard-delete admin mutations may exist | Medium | Keep UI unwired; audit before exposing. |
| Counter drift on non-transactional areas | Low | Audit after MVP unless user-visible drift appears. |
