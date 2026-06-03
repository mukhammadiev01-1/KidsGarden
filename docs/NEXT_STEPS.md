# Next Steps

## Application / Inquiry

| Task | Priority | Scope |
| --- | --- | --- |
| Manual browser QA for full Application / Inquiry flow | High | Parent, Kindergarten Admin, Super Admin |
| Confirm duplicate open application error in browser | High | Parent apply flow |
| Confirm parent can cancel only non-final applications | High | Parent dashboard |
| Confirm Kindergarten Admin sees only managed-kindergarten applications | High | Backend + frontend runtime |
| Confirm Super Admin application status updates | High | Admin runtime |
| Add notification events for application created/status changed | Medium | Backend + frontend |
| Connect application context to future chat | Medium | Backend + frontend |

## Approval Flows

| Task | Priority | Scope |
| --- | --- | --- |
| Verify Teacher approval flow end to end | High | Staff application backend/frontend |
| Verify Kindergarten Admin approval flow end to end | High | Kindergarten admin application backend/frontend |
| Confirm social login cannot grant Teacher/Admin/Super Admin | High | Auth |

## Upload Fixes

| Task | Priority | Scope |
| --- | --- | --- |
| Verify member/profile image upload save flow | High | Frontend + backend runtime |
| Verify kindergarten main image/gallery upload in My Kindergarten dashboard | High | Frontend + backend runtime |
| Verify article/community image upload | High | Frontend + backend runtime |
| Confirm allowed targets and MIME list | High | Backend |
| Confirm uploaded URLs render through static `/uploads` path | High | Frontend + backend runtime |
| Confirm staff/teacher images use member profile image or define separate image policy | Medium | Product + frontend |

## Notifications

| Task | Priority |
| --- | --- |
| Define notification events for applications, attendance, comments, chat | Medium |
| Add notification model and read-state design | Medium |
| Add dashboard notification UI | Medium |

## Full Chat

| Task | Priority |
| --- | --- |
| Replace simple global socket chat with scoped conversations | High |
| Add `Conversation`, `Message`, and `MessageRead` models | High |
| Enforce parent/teacher/kindergarten-admin relationship permissions | High |
| Persist messages and support unread counts | Medium |
| Support chat image attachments | Medium |
| Add Redis-backed realtime infrastructure | Medium |

## Social Login

| Task | Priority |
| --- | --- |
| Backend Google auth mutation design | Medium |
| Frontend Google login button | Medium |
| Telegram login audit | Later |
| Ensure social login creates Parent only by default | High |
| Account linking rules | High |

## Maps

| Task | Priority |
| --- | --- |
| Add location fields for latitude/longitude | Medium |
| Add admin form fields or geocoding workflow | Medium |
| Replace listing/detail map placeholders | Medium |
| Add map API env keys | Medium |

## Dashboard Polish

| Task | Priority |
| --- | --- |
| Enable or defer Favorites/Recently Visited | Medium |
| Polish MyProfile mobile/private UI | Medium |
| Verify role menus after dirty changes | Medium |
| Polish Application / Inquiry lists after manual QA | Medium |

## Design Polish

| Task | Priority |
| --- | --- |
| Manual 1300px visual check for public pages | Medium |
| Manual 390px visual check for public pages | Medium |
| SEO and production metadata polish | Medium |
| Reduce remaining old fallback visuals | Low |

## Testing

| Task | Priority |
| --- | --- |
| Smoke test Application / Inquiry with real accounts | High |
| Smoke test auth, upload, public pages, dashboards | High |
| Add targeted tests for application access rules and status transitions | Medium |
| Add targeted tests for role guards and upload validation | Medium |

## Documentation

| Task | Priority |
| --- | --- |
| Keep this docs snapshot updated after Application / Inquiry manual QA | Medium |
| Add manual QA checklist | Medium |
| Add deployment/env checklist | Medium |

## Compatibility Cleanup

| Task | Priority | Scope |
| --- | --- | --- |
| Keep compatibility routes/API fields/enums/assets documented | Medium | Docs |
| Remove compatibility only through explicit cleanup tasks | Low | Frontend + backend |
| Avoid using old project/domain names in new code | High | All future tasks |
