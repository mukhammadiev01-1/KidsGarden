# Next Steps

## Application / Inquiry

| Task | Priority | Scope |
| --- | --- | --- |
| Manual browser QA for full Application / Inquiry flow | High | Parent, Kindergarten Admin, Super Admin |
| Confirm duplicate open application error in browser | High | Parent apply flow |
| Confirm parent can cancel only non-final applications | High | Parent dashboard |
| Confirm Kindergarten Admin sees only managed-kindergarten applications | High | Backend + frontend runtime |
| Confirm Super Admin application status updates | High | Admin runtime |
| Confirm notification delivery for application created/status/canceled | High | Backend + frontend runtime |
| Confirm application chat target navigation from notifications | High | Frontend runtime |
| Confirm realtime application chat updates | High | Parent + Kindergarten Admin browsers |

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

| Task | Priority | Scope |
| --- | --- | --- |
| Manual browser QA for NotificationBell with real accounts | High | Frontend runtime |
| Verify unread count, mark one read, and mark all read | High | Backend + frontend runtime |
| Verify connected event delivery for applications, application chat, role applications, and kindergarten comments | High | Backend + frontend runtime |
| Verify realtime `notification.created` delivery | High | Backend + frontend runtime |
| Add attendance notifications after attendance workflow QA | Medium | Backend + frontend |
| Add comment reply notifications only after threaded comments exist | Medium | Backend + frontend |
| Add comment-like notifications only after comment likes are clearly supported | Medium | Backend + frontend |
| Add announcement/news notifications only after audience/follow rules are defined | Medium | Backend + frontend |
| Verify Redis-stopped fallback | High | Backend + frontend runtime |

## Full Chat

| Task | Priority |
| --- | --- |
| Manually QA scoped persisted application chat with real Parent and Kindergarten Admin accounts | High |
| Manually QA realtime application chat in two browser sessions | High |
| Add read-state UI polish for application chat | Medium |
| Support chat image attachments | Medium |
| Add typing indicators and presence | Later |

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
| Smoke test notifications with Parent, Kindergarten Admin, Teacher, and Super Admin accounts | High |
| Smoke test auth, upload, public pages, dashboards | High |
| Add targeted tests for application access rules and status transitions | Medium |
| Add targeted tests for notification ownership and event recipient rules | Medium |
| Add targeted tests for role guards and upload validation | Medium |

## Documentation

| Task | Priority |
| --- | --- |
| Keep this docs snapshot updated after Application / Inquiry manual QA | Medium |
| Add manual QA checklist | Medium |
| Add deployment/env checklist | Medium |

## Manual Realtime QA Checklist

| Test | Steps | Expected Result |
| --- | --- | --- |
| Parent to Kindergarten Admin chat realtime | Open the same Kindergarten Application chat as Parent in one browser and Kindergarten Admin in another. Parent sends a text message. | Kindergarten Admin chat panel refetches and shows the new message without page refresh. |
| Kindergarten Admin to Parent chat realtime | Keep both chats open. Kindergarten Admin sends a text message. | Parent chat panel refetches and shows the new message without page refresh. |
| Notification bell realtime update | With recipient logged in, trigger a workflow that creates a notification, such as application status update or chat message. | Recipient unread count updates; if the dropdown is open, the list refetches. |
| Refresh fallback | Reload the recipient page after messages/notifications exist. | GraphQL loads the persisted message/notification state even without relying on the realtime event. |
| Redis stopped fallback | Stop local Redis and repeat a chat send or notification-producing workflow. | Main workflow still succeeds through Mongo/GraphQL; realtime update may be skipped until Redis is restored. |

## Realtime Environment

| Variable | Local Value | Notes |
| --- | --- | --- |
| `REDIS_URL` | `redis://localhost:6379` | Backend Redis pub/sub connection for realtime delivery. |
| Frontend realtime URL | Derived from `REACT_APP_API_URL` | The browser client connects to `${REACT_APP_API_URL}/realtime` unless an explicit realtime WebSocket URL is configured. |

## Compatibility Cleanup

| Task | Priority | Scope |
| --- | --- | --- |
| Keep compatibility routes/API fields/enums/assets documented | Medium | Docs |
| Remove compatibility only through explicit cleanup tasks | Low | Frontend + backend |
| Avoid using old project/domain names in new code | High | All future tasks |
