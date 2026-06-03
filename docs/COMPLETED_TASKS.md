# Completed Tasks

## Backend

| Task | Status | Validation |
| --- | --- | --- |
| DB-hydrated auth guards | Completed | Needs current build verification |
| Optional public auth hardening | Completed | Needs current build verification |
| Public member projection/privacy cleanup | Completed | Needs regression verification |
| Admin/member/kindergarten status-only hardening | Completed | Needs regression verification |
| Owner staff immutability | Completed | Needs regression verification |
| Upload target allowlist | Partially completed / in progress | Current dirty upload files need verification |
| ObjectId validation | Completed | Needs regression verification |
| Pagination caps and regex escaping | Completed | Needs regression verification |
| Disabled member-like compatibility mutation | Completed | Needs regression verification |
| Community/comment moderation hardening | Completed | Needs regression verification |
| Application/create-kindergarten transactions | Completed | Needs deployment transaction support verification |
| Recently visited backend fix | Completed | `getVisited` now uses view-service visited records |
| Backend infrastructure app rename | Completed | Active app paths are `apps/kidsgarden-api` and `apps/kidsgarden-batch`; compatibility names remain only where explicitly documented |
| Application / Inquiry backend MVP | Completed | Build passed after integration QA/bugfix pass |
| Application duplicate open prevention | Completed | Backend blocks duplicate open parent/kindergarten applications |
| Application role access rules | Completed | Parent, Kindergarten Admin, and Super Admin access rules implemented in resolver/service |

## Frontend

| Task | Status | Validation |
| --- | --- | --- |
| Homepage premium platform redesign | Completed | Needs final visual QA after dirty changes |
| KidsGarden logo assets/header/footer branding | Completed | Needs current visual QA |
| Kindergarten listing redesign | Completed | Needs current visual QA |
| Kindergarten detail redesign | Completed | Needs current visual QA |
| Parent Community redesign | Completed | Needs current visual QA |
| Help Center redesign | Completed | Dirty state present; needs build/runtime verification |
| Auth UX/password-manager form fix | Completed | Dirty state present; needs build/runtime verification |
| `/login` and `/register` redirects | Completed | Needs runtime verification |
| Role menus and Parent Board write route | Completed | Needs regression verification |
| Super Admin overview and operations pages | Completed | Needs regression verification |
| Admin public member links cleanup | Completed | Needs regression verification |
| Apollo auth/session error handling | Completed | Needs regression verification |
| Native `/kindergartens` and `/kindergartens/detail` routes | Completed | `/property` routes kept as compatibility redirects |
| Native `/_admin/kindergartens` route | Completed | `/_admin/properties` kept as compatibility route |
| Frontend naming cleanup for active public routes/assets/styles | Completed | Compatibility names remain only where documented |
| Application / Inquiry frontend MVP | Completed | Build passed after integration QA/bugfix pass |
| Parent apply form on kindergarten detail | Completed | Manual browser QA with real Parent account remains |
| Parent My Applications UI | Completed | Manual browser QA remains |
| Kindergarten Admin Incoming Applications UI | Completed | Manual browser QA remains |
| Super Admin applications UI | Completed | Manual browser QA remains |

## Current Snapshot Notes

| Area | Status |
| --- | --- |
| Backend app paths | Active paths use `apps/kidsgarden-api` and `apps/kidsgarden-batch`. |
| Frontend native public routes | Active public routes use `/kindergartens` and `/kindergartens/detail`. |
| Compatibility layer | Some old routes/API fields/enums/assets remain temporarily. Do not remove unless explicitly scoped. |
| Application / Inquiry | Implemented; authenticated manual QA remains. |
| Uploads | Needs manual verification for profile, kindergarten, and article images. |

## Check Status

| Check | Status |
| --- | --- |
| Backend `git diff --check` after Application QA | Passed |
| Frontend `git diff --check` after Application QA | Passed |
| Backend build after Application QA | Passed |
| Frontend build after Application QA | Passed with existing Apollo static-generation warnings |
