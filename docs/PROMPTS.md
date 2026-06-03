# Reusable Prompts

## Application / Inquiry Integration QA

```text
KidsGarden Application / Inquiry QA and bugfix pass.

Work only in KidsGarden and KidsGarden-client.
Do not redesign UI.
Do not add chat, notifications, maps, or social login.
Do not touch package files or compatibility fields/routes unless directly required by the bug.

Verify:
- Parent can apply from /kindergartens/detail.
- Duplicate open application shows an understandable error.
- Parent My Applications loads, displays status/details, and cancel works only for non-final statuses.
- Kindergarten Admin Incoming Applications shows only managed-kindergarten applications and can update REVIEWING, APPROVED, REJECTED, NEED_MORE_INFO.
- Super Admin /_admin/applications loads all applications and can update status.
- Teacher and unauthenticated users do not see privileged application UI.
- Backend rejects unauthorized GraphQL calls.

Run:
- backend git diff --check
- frontend git diff --check
- backend yarn build
- frontend yarn build

Report bugs found, fixes made, flows verified, manual QA still needed, and build results.
```

## Upload Image Audit/Fix

```text
KidsGarden Upload Fix.

Work only in KidsGarden and KidsGarden-client.
Do not touch package files, chat, maps, social login, or public redesigns.

Audit and fix member/profile and kindergarten image uploads end to end:
- backend upload targets and MIME validation
- GraphQL upload mutations
- static `/uploads` serving
- frontend upload target names
- save uploaded URL to member/kindergarten DB fields
- render uploaded URL in UI

Run:
- backend git diff --check
- frontend git diff --check
- backend yarn build if backend changed
- frontend yarn build if frontend changed

Report root cause, changed files, targets, validation rules, build results, and manual test steps.
```

## Naming Cleanup Audit

```text
KidsGarden Naming Cleanup Audit only.

Do not edit files.
Search user-facing frontend text for old product/domain wording.
Classify findings:
- public blocker
- private dashboard cleanup
- hidden/deferred cleanup

Do not change routes or backend.
Report exact files, visible risk, and minimal fix order.
```

## Notifications Planning

```text
KidsGarden Notifications Planning only.

Do not edit files.
Inspect current backend events/workflows:
- applications
- attendance
- comments/community
- chat

Design notification model, permissions, unread counts, delivery points, frontend UI entry points, and MVP scope.
Report backend files, frontend files, risks, and implementation order.
```

## Chat Implementation Audit

```text
KidsGarden Full Chat Audit only.

Do not edit files.
Inspect current socket gateway/client and auth.
Design production chat:
- Conversation
- Message
- MessageRead
- relationship permissions
- persistence
- unread counts
- notification integration

Do not implement global public chat.
Report what to replace, what to keep, files to edit later, and security risks.
```

## Social Login Audit

```text
KidsGarden Social Login Audit only.

Do not edit files.
Inspect backend auth/member schema, frontend auth page, Apollo client, auth store.
Plan Google login first.
Rules:
- social login creates Parent only by default
- no automatic Teacher/Admin/Super Admin grants
- blocked/deleted accounts must remain blocked
- normal login/register must keep working
- Teacher and Kindergarten Admin approval flows remain separate from social login

Report backend files, frontend files, env vars, account linking risks, and implementation order.
```

## Route Cleanup

```text
KidsGarden Route Cleanup Audit only.

Do not edit files.
Inspect public routes and redirects:
- /
- /kindergartens
- /kindergartens/detail
- /property compatibility redirect
- /property/detail compatibility redirect
- /_admin/kindergartens
- /_admin/properties compatibility route
- /community
- /cs
- /login
- /register
- /member
- /agent

Report which routes are canonical, which are compatibility routes, which should redirect, and which should not be exposed.
```

## Compatibility Cleanup Guardrail

```text
KidsGarden compatibility cleanup audit only.

Do not edit files.
Identify temporary compatibility routes/API fields/enums/assets.
Classify each as:
- keep temporarily
- safe to remove after redirect/API migration
- requires data migration
- should not change yet

Rules:
- Do not remove compatibility unless explicitly requested.
- Do not present compatibility names as active product architecture.
- New code must use KidsGarden/kindergarten naming.

Run git diff --check and report exact files and cleanup order.
```

## Mobile QA

```text
KidsGarden Mobile QA.

Do not edit first.
Check only:
- 1300px desktop
- 390px mobile

Pages:
- /
- /kindergartens
- /kindergartens/detail
- /community
- /cs
- /account/join

Report overflow yes/no, broken layout yes/no, and exact minimal fixes if needed.
```

## Build/Check Report

```text
KidsGarden Build/Check Report.

Do not edit files.
Run:
- backend git diff --check
- frontend git diff --check
- backend yarn build if requested
- frontend yarn build if requested

Report pass/fail, exact errors, changed files, and whether failures are app-code or environment/cache related.
```
