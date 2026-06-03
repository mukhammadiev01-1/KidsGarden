# KidsGarden Decisions

## Product And Routing Decisions

| Decision | Reason | Risk / Alternative |
| --- | --- | --- |
| Use `/kindergartens` as the native public listing route | KidsGarden-native route names now match the product language | `/property` remains as a compatibility redirect until old links are no longer needed |
| Use `/kindergartens/detail` as the native public detail route | Keeps public URLs aligned with kindergarten domain language | `/property/detail` remains as a compatibility redirect until old links are no longer needed |
| Use `/_admin/kindergartens` as the native admin kindergarten route | Admin routes should use product language | `/_admin/properties` remains as a compatibility route for now |
| Use `apps/kidsgarden-api` and `apps/kidsgarden-batch` as backend app names | Active infrastructure should match the product | Old app paths should not be used for new code |
| Public member/staff/admin profile pages are not part of MVP | Prevent public exposure of private roles and account data | Private profile previews remain guarded/admin-scoped |
| Super Admin uses `/_admin` | Clear separation from normal role dashboards | Needs continued guard verification |

## Security Decisions

| Decision | Reason | Risk / Alternative |
| --- | --- | --- |
| Protected auth hydrates current member from DB | Prevent stale token role/status abuse | More DB reads per request; acceptable for MVP |
| Public optional auth treats invalid tokens as anonymous | Public pages should not break for stale/invalid tokens | Auth side effects must still avoid private data exposure |
| Public signup creates Parent only | Teacher/Admin roles require approval | Social login must follow the same rule |
| Social login must create/login Parent only by default | Prevent accidental privileged access | Teacher/Admin account linking requires explicit approval rules |
| Teachers do not manage parent applications in MVP | Application management belongs to Parents, Kindergarten Admins, and Super Admins | Teacher application handling can be added later only with explicit product scope |
| Admin updates are status-only where possible | Reduces accidental broad writes | Future richer admin actions need explicit safe mutations |
| Upload target allowlist remains strict | Prevent path traversal and unintended folder writes | New targets must be reviewed before adding |

## Backend Decisions

| Decision | Reason | Risk / Alternative |
| --- | --- | --- |
| Kindergarten creation is transactional | Avoid center without owner staff or counter drift | Requires Mongo transaction support in deployment |
| Staff/admin application approvals are transactional | Avoid partial role/application state | Requires replica-set-compatible Mongo configuration |
| Recently visited uses view records | Correct behavior for visited list | Frontend UI still needs safe enablement |
| Parent-to-kindergarten Application / Inquiry is a dedicated model | Separates enrollment/contact workflow from role approval workflows | Needs notifications and chat linkage later |
| Full chat is a later dedicated system | Current requirements need relationship permissions and persistence | Simple global chat should not be treated as final |

## Frontend Decisions

| Decision | Reason | Risk / Alternative |
| --- | --- | --- |
| Public pages use KidsGarden-safe wording only | User-facing product should be consistent | Old internal names may still exist in code until cleanup |
| Header/footer avoid public member/staff directory links | Privacy boundary | Admin/private dashboards can still show safe internal IDs |
| Login/register redirect to one auth page | Keeps auth implementation minimal | Separate screens can be added later if needed |
| 1300px and 390px are primary QA widths | Matches requested manual QA targets | Wider/tablet checks are optional unless requested |

## Compatibility Decisions

| Decision | Reason | Rule |
| --- | --- | --- |
| Keep old public route names as redirects temporarily | Avoid breaking old links while native routes are active | Do not add new links to compatibility routes |
| Keep old API fields/enums/assets temporarily | Protect old data and clients during staged cleanup | Do not remove unless the task explicitly scopes compatibility cleanup |
| Avoid using old domain/project names in new code | KidsGarden is the active product/domain | Mention old names only as temporary compatibility details when necessary |

## Codex Working Rules

| Rule | Reason |
| --- | --- |
| Read relevant docs before coding | Keeps future tasks aligned with current product state. |
| Do not redesign while implementing backend/product logic | Prevents visual churn during functional work. |
| Use minimal technical UI for feature behavior tests | Allows MVP workflows to be validated before final design. |
| Avoid touching compatibility fields/routes unless explicitly requested | Prevents accidental runtime/API breakage. |
| Run `git diff --check` and relevant `yarn build` commands after implementation | Maintains build hygiene. |
