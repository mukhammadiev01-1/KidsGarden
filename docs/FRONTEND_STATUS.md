# Frontend Status

## Public Pages

| Page | Status | Notes |
| --- | --- | --- |
| `/` | Implemented | Premium platform homepage with live kindergarten/community sections. |
| `/kindergartens` | Implemented | Native kindergarten listing with filters, map placeholder, cards, likes, pagination. |
| `/kindergartens/detail` | Implemented | Native kindergarten detail with gallery, info, facts, comments/reviews, parent apply form, and staff application entry. |
| `/property`, `/property/detail` | Compatibility redirects | Kept temporarily for old links while native kindergarten routes are active. |
| `/community` | Implemented | Parent Community / articles / Q&A-style page. |
| `/community/detail` | Implemented | Article detail and comments. |
| `/cs` | Implemented | Static KidsGarden Help Center. |
| `/agent`, `/agent/detail`, `/member` | Neutralized | These routes should redirect safely. Needs verification if modified later. |

## Auth Page

| Item | Status |
| --- | --- |
| `/account/join` real form | Implemented |
| Password input type | Implemented |
| `name`, `id`, `autocomplete` attributes | Implemented |
| Enter submit behavior | Implemented through form submit |
| `/login` route | Implemented as redirect to `/account/join?mode=login` |
| `/register` route | Implemented as redirect to `/account/join?mode=register` |
| Mobile placeholder removed | Implemented |
| Final runtime/build verification | Build passed after recent auth changes; manual browser QA still recommended |

## Dashboards

| Dashboard | Status | Notes |
| --- | --- | --- |
| Parent | Implemented | Children, attendance, staff/admin role applications, Parent Board write, My Applications. |
| Teacher | Implemented | Assigned groups and attendance only. |
| Kindergarten Admin | Implemented | My kindergarten, staff, staff applications, groups, children, attendance, Incoming Applications. |
| Super Admin | Implemented | Overview, users, kindergartens, parent applications, role applications, community moderation, read-only operations. |

## Application / Inquiry UI

| Area | Status | Notes |
| --- | --- | --- |
| Apply button/form | Implemented | Shows on kindergarten detail for authenticated Parent users. |
| Duplicate/open application error | Implemented | Parent sees a clear message when backend rejects a duplicate open application. |
| Parent My Applications | Implemented | Lists child name, age, status, message, kindergarten, and created date; allows cancel for non-final statuses. |
| Kindergarten Admin Incoming Applications | Implemented | Lists scoped applications and supports status updates/admin notes. |
| Super Admin applications | Implemented | `/_admin/applications` loads all parent applications and supports status updates. |
| Manual browser QA | Pending | Needs real Parent, Kindergarten Admin, and Super Admin account testing. |

## Mobile QA Targets

| Target | Standard |
| --- | --- |
| Desktop | 1300px minimum laptop target |
| Mobile | 390px target |
| Tablet | Not a default required check unless explicitly requested |

## Remaining Frontend Cleanup

| Item | Priority | Notes |
| --- | --- | --- |
| Application / Inquiry manual QA | High | Verify create, duplicate error, cancel, admin status update, parent refresh, and unauthorized states. |
| Upload UI completion | High | Member/profile save and kindergarten image/gallery upload need verification and completion. |
| Favorites/recently visited UI | Medium | Backend support exists; frontend components need safe KidsGarden cleanup before enabling. |
| Chat widget | Medium | Current global chat is not final product behavior. |
| Mobile regression pass | Medium | Run after current feature changes settle. |
| Visual polish | Low | Public pages are implemented; final manual polish can be staged separately. |
