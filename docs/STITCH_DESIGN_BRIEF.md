# KidsGarden Stitch Design Brief

## 1. Product Summary

KidsGarden is an early learning platform for families, teachers, kindergartens, and platform administrators. It combines public kindergarten discovery with private role-based dashboards for applications, children, groups, attendance, staff operations, community content, notifications, chat, and platform administration.

KidsGarden should feel like a trusted bridge between families and early education centers: warm enough for parents, practical enough for teachers and kindergarten teams, and structured enough for internal administration.

Primary users:

- Parents looking for trusted kindergartens, enrollment guidance, child attendance visibility, community support, and safe communication with approved kindergarten relationships.
- Teachers managing assigned class groups and daily attendance after approval.
- Kindergarten Admins managing their own kindergarten profile, staff, staff applications, groups, children, and attendance.
- Super Admins operating the internal platform review, moderation, and oversight tools.

Main product value:

- Help parents discover, compare, and connect with kindergartens.
- Give kindergartens a clean operating dashboard for center information, staff, groups, children, and attendance.
- Keep access private and role-based so child, parent, teacher, staff, and admin information is never exposed publicly.
- Centralize applications, approvals, community content, notifications, and private relationship-scoped chat.

## 2. User Roles

### Parent

Parents are the only public self-signup role.

What parents can do:

- Browse and search public kindergarten profiles.
- Like/save kindergartens.
- Read and write Parent Community articles.
- Comment on community articles and kindergarten profiles.
- View children linked to their account.
- View child attendance history.
- Submit teacher applications from kindergarten detail pages.
- Submit a Kindergarten Admin application if they need to manage a kindergarten.
- Update private profile information and profile image.
- Receive notifications about applications, attendance, community activity, and chat.
- Use private chat only with approved kindergarten relationships.

Parent dashboard should show:

- Dashboard header with parent name, role, quick notification count, and profile image.
- Stat cards for linked children, recent attendance updates, active applications, unread notifications, and unread chats.
- My Children section with child cards/table, kindergarten, group, status, and safe limited details.
- Attendance section with child selector and attendance history.
- Teacher Applications section with status timeline and cancel action while pending.
- Kindergarten Admin Application section with application form, status, review feedback, and relogin instruction after approval.
- Parent Community writing entry.
- Empty states that guide parents to contact a kindergarten or start discovery.

### Teacher

Teacher access requires approval through the staff application flow. Teachers should never receive teacher access from public signup alone.

What teachers can do:

- View assigned active groups.
- Mark or update attendance for children in assigned groups.
- Add attendance notes.
- View private profile information.
- Receive notifications related to assigned groups, attendance, and chat.
- Use private chat only with approved relationships.

Teacher dashboard should show:

- Dashboard header with teacher name, role, assigned kindergarten context, notifications, and profile image.
- Stat cards for active groups, children in selected group, today marked attendance, pending attendance, and unread messages.
- My Groups section with group name, kindergarten reference, age range, capacity, and status.
- Attendance section with group selector, date picker, child rows, saved status, new status, optional note, and mark/update action.
- Empty states for no assigned groups, no children in group, or no attendance records.

### Kindergarten Admin

Kindergarten Admin access requires approval. Kindergarten Admins manage only their own kindergarten data.

What Kindergarten Admins can do:

- Create and edit their kindergarten profile.
- Upload and manage kindergarten gallery images.
- Manage staff records for their center.
- Review teacher/staff applications submitted to their center.
- Create and edit groups.
- Assign active teacher staff to groups.
- Create and manage child records linked to verified parent accounts.
- Mark and update attendance by kindergarten, group, and date.
- Receive notifications for applications, staff changes, attendance, comments, and chat.
- Use private chat with approved center relationships.

Kindergarten Admin dashboard should show:

- Dashboard header with center/admin identity, active kindergarten selector if needed, notification count, and profile image.
- Stat cards for owned centers, active staff, pending staff applications, active groups, enrolled children, today attendance completion, and unread chats.
- My Kindergarten section with owned center cards and create/edit form.
- Staff section with kindergarten selector, staff search, selected candidate preview, role/status controls, and protected owner badge.
- Staff Applications section with filters, applicant details, approve/reject actions, and required rejection reason.
- Groups section with group create/edit form, active teacher assignment, group list, archive action, and empty state guiding staff setup.
- Children section with child create/edit form, parent preview, group filter, child list, status chips, and set inactive action.
- Attendance section with kindergarten/group/date selectors, daily child rows, saved status, new status, notes, mark/update/remove actions.

### Super Admin

Super Admin is internal only. This role should be visually separate from normal user dashboards.

What Super Admins can do:

- Review platform overview.
- Review and update member account status.
- Review and update kindergarten profile status.
- Review Kindergarten Admin applications.
- Review staff/teacher applications across the platform.
- Moderate Parent Community articles and comments.
- Inspect staff, group, child, and attendance records across the platform in read-only operations views.
- Use status-only or clearly constrained actions.

Super Admin dashboard should show:

- Internal admin shell with strong visual separation from public KidsGarden UI.
- Overview cards for members, kindergartens, applications, community moderation, and operations.
- Tables with filters, status chips, safe preview data, and audit-friendly actions.
- Application review queues with approve/reject/status handling.
- Community moderation lists for articles and comments.
- Operations views clearly marked read-only.
- Empty, loading, and error states designed for operational confidence.

## 3. Main Page Requirements

Every important page needs both a 1300px desktop design and a 390px mobile design. Desktop should use a centered 1300px content target. Mobile should be true mobile-first, with stacked sections, sticky primary actions where useful, and no horizontal overflow.

### Homepage

Purpose:

- Introduce KidsGarden as the trusted early learning platform.
- Route parents to kindergarten discovery, community, help, and authentication.
- Explain role-based value for parents, teachers, and kindergartens.

Main sections:

- Header with KidsGarden logo, navigation, auth/profile entry, notifications entry when signed in.
- Warm hero with a real early-education/classroom visual, headline, short value proposition, search entry, and primary CTA to find kindergartens.
- Role cards for Parents, Teachers, and Kindergartens.
- Feature grid: online applications, child profiles, groups, attendance, staff management, Parent Community.
- Featured kindergartens carousel/grid.
- Popular/trending/top kindergarten sections.
- Community preview with latest parent articles and platform news.
- Privacy/safety section emphasizing role-based dashboards and private data.
- Final CTA.
- Footer with help, privacy, and product navigation.

Key actions:

- Search or browse kindergartens.
- Open kindergarten detail.
- Read community articles.
- Sign in/register.
- Open Help Center.

Empty states:

- Featured kindergarten section: "Featured kindergartens will appear here soon."
- Community preview: "Parent articles and KidsGarden updates will appear here soon."

Loading/error states:

- Skeleton cards for kindergarten and article sections.
- Inline retry state if homepage data fails.

Mobile behavior:

- Hero stacks with search below copy.
- Role cards become horizontal swipe or stacked cards.
- Featured kindergarten cards use one-card-per-row.
- Header collapses to menu.

Desktop behavior:

- Hero uses generous two-column or layered image composition.
- Kindergarten previews use carousel/grid.
- Keep next section partially visible below hero.

### Kindergarten Listing Page

Purpose:

- Let families find and compare kindergartens by location, type, age, programs, monthly fee, and popularity.

Main sections:

- Search hero with trust chips: verified centers, safe care, parent reviews.
- Search summary panel with location, center type, age range, programs, monthly fee.
- Filter panel.
- Map preview placeholder with pins and "Live map coming soon."
- Listing toolbar with result count, sorting, and grid/list toggle.
- Kindergarten card grid.
- Pagination.
- Top Kindergartens strip.

Key actions:

- Search.
- Change filters.
- Sort by newest, lowest fee, highest fee, top rated.
- Like/save kindergarten.
- Open detail page.
- Change page.

Empty states:

- No results: friendly icon, "No kindergartens found yet", and suggestion to adjust filters.
- No top kindergartens: hide top strip.

Loading/error states:

- Skeleton cards and disabled filters while loading.
- Error banner with retry.

Mobile behavior:

- Filters collapse into bottom sheet or drawer.
- Search summary becomes compact chips.
- Map preview collapses or becomes a small expandable panel.
- Cards stack full width.

Desktop behavior:

- Left filter rail, main grid, and map preview above or beside listing.
- Use 3-column cards when space allows.

### Kindergarten Detail Page

Purpose:

- Present one kindergarten profile in enough detail for parents to evaluate and for approved applicants to begin teacher application flow.

Main sections:

- Breadcrumb.
- Photo gallery with main image, thumbnail strip, photo count, verified badge.
- Info card with title, rating, reviews, views, like button, location, short description.
- Facts grid: ages, capacity, groups, programs, languages, center type.
- Primary actions: Contact Center, Request a Visit.
- Quick facts: hours, programs, languages, meals, safety.
- About, why parents choose us, programs, safety and facilities, gallery.
- Parent Reviews list and review form.
- Nearby kindergartens.
- Sidebar with contact/location, monthly fee, map preview, apply as teacher card.

Key actions:

- Like kindergarten.
- Switch gallery image.
- Submit review.
- Contact center.
- Request visit.
- Apply as Teacher if signed in as Parent and no active approved/pending application.

Empty states:

- No images: show warm kindergarten placeholder.
- No reviews: prompt parents to share feedback.
- No nearby kindergartens: hide related section.
- Not signed in teacher application: prompt login.

Loading/error states:

- Page skeleton with gallery and info blocks.
- Not found state with link back to kindergarten listing.
- Review submit disabled during submit.

Mobile behavior:

- Gallery first, then sticky summary/action bar.
- Sidebar content becomes stacked sections.
- Teacher application form uses full-width controls.

Desktop behavior:

- Gallery and info card side by side.
- Main content and sticky sidebar layout.

### Community Page

Purpose:

- Provide a safe Parent Community for parenting tips, learning ideas, health/nutrition, activities, Q&A, and platform news.

Main sections:

- Hero title "Parent Community" and write article button.
- Search input.
- Topic tabs.
- Featured Articles grid.
- Recent Questions & Answers list.
- Community Highlights with safety, sharing, and child-focus guidance.
- Sidebar for popular topics, platform updates, community guidelines.
- Subscribe/support prompt.
- Pagination.

Key actions:

- Search articles/questions.
- Filter by topic.
- Open article.
- Write Article for Parent role.
- View platform updates.

Empty states:

- No articles: topic-specific message.
- No questions: "Questions from parents will appear here soon."
- Non-parent write attempt: show disabled state or explanation.

Loading/error states:

- Skeleton article cards.
- Inline loading copy.
- Error state with retry.

Mobile behavior:

- Topic tabs become horizontally scrollable chips.
- Sidebar sections move below main content.
- Write Article button remains visible near hero.

Desktop behavior:

- Main content and sidebar layout.
- Featured grid plus lower two-column section.

### Article Detail Page

Purpose:

- Let users read a Parent Community article, like it, and participate in comments safely.

Main sections:

- Community navigation/sidebar with visible categories.
- Page header with Parent Community title and write/join-to-write action.
- Article card with title, author nickname, date, likes, views, comments.
- Rich article content area.
- Like action.
- Comment composer with character count.
- Comment list with author nickname, date, content, edit/delete only for own comments.
- Pagination for comments.

Key actions:

- Like article.
- Add comment.
- Edit/delete own comment.
- Navigate back to community category.
- Write article if Parent.

Empty states:

- Article not found.
- No comments yet.

Loading/error states:

- Loading article.
- Article could not be loaded.
- Loading comments.
- Comment submit disabled for blank input or while submitting.

Mobile behavior:

- Category sidebar becomes top tabs.
- Article metadata wraps cleanly.
- Comment composer sticks below content only if it does not block reading.

Desktop behavior:

- Sidebar plus content layout.
- Comment list in readable centered column.

### Help Center

Purpose:

- Offer support for parents, teachers, kindergartens, account access, applications/enrollment, and safety/privacy.

Main sections:

- Help Center hero with search prompt.
- Common starting points card.
- Support category cards: For Parents, For Kindergartens, For Teachers, Account & Login, Applications & Enrollment, Safety & Privacy.
- FAQ accordion.
- Contact support card.

Key actions:

- Search help topics.
- Open category.
- Expand FAQ.
- Email support.

Empty states:

- No search results: suggest categories and support email.

Loading/error states:

- Static page can show no loading for categories.
- If search becomes dynamic, show small inline spinner and retry.

Mobile behavior:

- Hero and card stack vertically.
- Category grid becomes single column.
- FAQ accordion full width.

Desktop behavior:

- Hero uses two-column composition.
- Category grid uses 2-3 columns.
- FAQ and contact card side by side.

### Login/Register Page

Purpose:

- Let users access KidsGarden or create a Parent account.

Main sections:

- KidsGarden logo and brand panel.
- Toggle between login and signup.
- Login form: nickname, password, remember me, lost password link.
- Signup form: nickname, password, phone, disabled/confirmed role selector showing Parent only.
- Helper text: teachers and kindergarten admins must be invited or approved by a center.
- Submit button.
- Switch link between login and signup.
- Warm visual panel with early education imagery.

Key actions:

- Login.
- Signup as Parent.
- Switch mode.
- Lost password entry.

Empty states:

- None needed beyond validation.

Loading/error states:

- Field-level validation for required fields.
- Auth error alert area.
- Button loading state during submit.

Mobile behavior:

- Single-column form.
- Visual panel can become a small banner or be removed to preserve focus.
- Inputs at least 44px high.

Desktop behavior:

- Form and visual panel side by side inside a clean auth surface.

### Parent Dashboard

Purpose:

- Give parents a private overview of children, attendance, applications, community writing, notifications, and chat.

Main sections:

- Private dashboard shell with profile menu and role navigation.
- Overview stat cards.
- My Children.
- Attendance.
- Teacher Applications.
- Kindergarten Admin Application.
- Parent Community writing entry.
- Notifications preview.
- Chat preview.
- Profile shortcut.

Key actions:

- Select child.
- View attendance history.
- Cancel pending teacher application.
- Submit/cancel Kindergarten Admin application.
- Open community article editor.
- Open notification or chat.

Empty states:

- No linked children: "No children are linked to your parent account yet. Please contact your kindergarten center."
- No attendance: "No attendance records found for this child yet."
- No applications: guide parent to kindergarten detail page or application form.

Loading/error states:

- Table/card skeletons.
- Error alert with retry.
- Disabled action buttons while submitting.

Mobile behavior:

- Left menu becomes top segmented navigation or drawer.
- Tables become stacked cards.
- Stat cards use two-column grid or horizontal scroll.

Desktop behavior:

- Sidebar navigation plus main content panel.
- Tables remain dense but readable.

### Teacher Dashboard

Purpose:

- Let approved teachers manage assigned groups and daily attendance.

Main sections:

- Private dashboard shell.
- Overview stat cards.
- My Groups table/cards.
- Attendance scope controls: group selector and date picker.
- Daily attendance table: child, status, note, saved record, action.
- Notifications and chat previews.

Key actions:

- Select group.
- Select date.
- Mark attendance.
- Update attendance.
- Add note.
- Open chat/notifications.

Empty states:

- No groups assigned.
- No active children in selected group.
- No attendance records yet.

Loading/error states:

- Loading groups.
- Loading children/attendance.
- Save success/error feedback.

Mobile behavior:

- Group/date controls stack.
- Child attendance rows become compact cards with status dropdown and note field.

Desktop behavior:

- Dashboard sidebar plus table-based workflows.

### Kindergarten Admin Dashboard

Purpose:

- Give approved kindergarten operators a complete private management surface.

Main sections:

- Private dashboard shell.
- Overview stat cards.
- My Kindergarten profile editor.
- Staff management.
- Staff Applications review.
- Groups.
- Children.
- Attendance.
- Notifications and chat previews.

Key actions:

- Create/edit kindergarten profile.
- Upload/remove kindergarten photos.
- Search/select staff candidates.
- Create/update/remove staff records.
- Approve/reject staff applications.
- Create/edit/archive groups.
- Assign teachers to groups.
- Create/edit/deactivate child records.
- Preview parent account before linking.
- Mark/update/remove attendance.

Empty states:

- No kindergarten profile: prompt to create one.
- No staff: prompt to search/add staff.
- No active teachers: prompt to add teachers before assigning groups.
- No groups: prompt to create group.
- No children: prompt to create child records.
- No applications: show no applications for current filter.

Loading/error states:

- Loading owned kindergartens, staff, applications, groups, children, attendance.
- Save/update/remove actions show loading and disabled states.
- Destructive actions require confirmation.

Mobile behavior:

- Dashboard navigation becomes drawer or sticky top tabs.
- Multi-column forms stack.
- Wide tables become cards with row-level actions.

Desktop behavior:

- Sidebar navigation and full-width content panels.
- Tables can be dense, with sticky headers for long lists.

### Super Admin Dashboard

Purpose:

- Internal-only platform operations, approval review, moderation, and read-only oversight.

Main sections:

- Internal admin shell with left menu grouped by Platform, Applications, Operations, Community, Help later.
- Overview cards linking to key admin sections.
- Members table with account status controls.
- Kindergartens table with status controls.
- Kindergarten Admin Applications queue.
- Staff Applications queue.
- Community Articles moderation.
- Community Comments moderation.
- Operations tables for staff, groups, children, attendance marked read-only.

Key actions:

- Navigate admin modules.
- Update member status.
- Update kindergarten status.
- Review applications.
- Moderate articles/comments.
- Inspect operations records.

Empty states:

- No records found per table.
- No pending applications.
- No moderation items.

Loading/error states:

- Table loading rows.
- Error banner with retry.
- Disabled state for read-only operations.

Mobile behavior:

- Admin is desktop-priority but still needs 390px design.
- Menu collapses into drawer.
- Tables become searchable cards with key fields first.

Desktop behavior:

- 1300px admin layout with left navigation, top context bar, and dense tables.

### Notifications Page / Dropdown

Purpose:

- Give users a private, role-scoped inbox for important KidsGarden events.

Main sections:

- Header bell/dropdown with unread count.
- Dropdown preview: latest 5 notifications, unread markers, quick "Mark all read", "View all".
- Full Notifications page with tabs/filters: All, Applications, Attendance, Community, Chat, System.
- Notification cards grouped by Today, This week, Older.

Key actions:

- Open notification target.
- Mark one as read/unread.
- Mark all read.
- Filter by type.
- Clear archived/read items if supported.

Empty states:

- No notifications: friendly message with role-specific next step.

Loading/error states:

- Skeleton notification cards.
- Retry state.

Mobile behavior:

- Bell opens full-screen sheet or page.
- Notification cards stack with large touch targets.

Desktop behavior:

- Dropdown from header plus full page table/card view.

### Chat Page / Interface

Purpose:

- Provide private, persistent, relationship-scoped communication. Chat must never feel like a public global room.

Main sections:

- Chat inbox with conversation list.
- Conversation item showing kindergarten/teacher/parent context, last message, unread badge, timestamp, and relationship label.
- Active conversation header with participant/context, privacy note, and optional kindergarten/group reference.
- Message timeline with date separators.
- Composer with text input, send button, attachment/image option if enabled, and disabled state when relationship is not active.
- Empty right panel when no conversation selected.

Key actions:

- Open conversation.
- Send message.
- Search conversations.
- Filter unread.
- Start chat only from approved relationship surfaces such as kindergarten contact, teacher/parent relationship, or admin-approved center relationship.

Empty states:

- No conversations yet.
- No messages in selected conversation.
- Chat disabled because relationship is not approved.

Loading/error states:

- Loading conversation list.
- Sending state per message.
- Failed message with retry.
- Disconnected state with reconnect indicator.

Mobile behavior:

- Inbox and thread are separate screens.
- Composer fixed at bottom with safe area spacing.

Desktop behavior:

- Two-pane layout: conversation list left, active thread right.

### Profile Page

Purpose:

- Let signed-in users privately manage account basics and profile image.

Main sections:

- Profile header with avatar, name, role, phone.
- Profile photo upload card.
- Form fields: username/nickname, phone, address.
- Save/update button.
- Role and approval context card.
- Account safety and privacy note.

Key actions:

- Upload profile image.
- Edit profile fields.
- Save profile.

Empty states:

- Missing profile image uses default avatar.
- Missing address prompts "Add your address."

Loading/error states:

- Uploading image state.
- Save loading state.
- Validation for required nickname, phone, address, image if required.

Mobile behavior:

- Avatar and upload action centered.
- Form fields stacked.

Desktop behavior:

- Photo card and form sections in a clean two-column or panel layout.

### My Kindergarten Page

Purpose:

- Let Kindergarten Admins create and maintain public-facing center profiles.

Main sections:

- Owned centers list with selected state, photo, status, location, type, capacity, age range, programs, edit action.
- Create/edit profile form.
- Basic information: name, monthly fee, center type, location, address.
- Center details: capacity, age range, programs, description.
- Photo upload gallery.
- Save action.

Key actions:

- Select center.
- Create new center profile.
- Edit profile.
- Upload photos.
- Remove photo.
- Save changes.

Empty states:

- No owned centers: "No kindergarten profile yet. Create the first center below."
- No photos: upload prompt.

Loading/error states:

- Loading owned centers.
- Upload error for unsupported formats.
- Save error for missing name, address, description, or photos.

Mobile behavior:

- Center selector cards stack.
- Form groups stack.
- Gallery thumbnails use two columns.

Desktop behavior:

- Owned centers panel above or beside editor.
- Form uses two/three-column groups where appropriate.

### Applications / Enrollment Flow

Purpose:

- Make role and enrollment approval flows transparent while protecting privileged access.

Main flows:

- Teacher application from kindergarten detail page.
- Parent dashboard Teacher Applications tracking.
- Kindergarten Admin dashboard Staff Applications review.
- Parent dashboard Kindergarten Admin Application form.
- Super Admin Kindergarten Admin Applications review.
- Child enrollment/linking in Kindergarten Admin dashboard.

Teacher application UI:

- Kindergarten context card.
- Optional message field.
- Submit button.
- Status card: Pending, Approved, Rejected, Canceled.
- Cancel pending action from parent dashboard.
- Approved state instructs user to sign out and sign in again for teacher dashboard.

Kindergarten Admin application UI:

- Form for kindergarten title, address, phone, business info, message.
- Pending lockout state if already pending.
- Application history with status and review feedback.
- Approved state instructs user to sign out and sign in again for Kindergarten Admin dashboard.

Enrollment/child linking UI:

- Kindergarten Admin creates child record.
- Child full name, birth date, gender, status, group, parent member preview.
- Parent preview confirms account is Parent before linking.
- Parent sees linked child and attendance in dashboard.

Key actions:

- Submit application.
- Cancel pending application.
- Approve/reject application in correct private dashboard.
- Add rejection reason.
- Link child to verified parent.

Empty states:

- No applications.
- No pending applications for selected filter.
- No linked children.

Loading/error states:

- Application submit loading.
- Review action loading.
- Error if privileged role is not approved.

Mobile behavior:

- Status history uses timeline cards.
- Forms stack with clear helper text.

Desktop behavior:

- Forms and history tables/cards can sit in panels.

### Image Upload UI

Purpose:

- Provide clear, safe upload experiences for profile images, kindergarten photos, article images, and future message attachments.

Main sections:

- Upload drop zone or button.
- File format helper: JPG, JPEG, PNG, WEBP.
- Size/count guidance.
- Preview gallery.
- Main image badge for kindergarten gallery first image.
- Remove action per image.
- Upload progress.
- Error state for unsupported format, too many images, failed upload, or missing required image.

Key actions:

- Select file.
- Drag and drop where suitable.
- Remove image.
- Reorder kindergarten gallery if designed.
- Save uploaded images with form.

Empty states:

- No image selected: show neutral placeholder and upload CTA.

Loading/error states:

- Per-image uploading shimmer/progress.
- Retry upload action.
- Clear validation messages.

Mobile behavior:

- Full-width upload button.
- Gallery thumbnails in two columns.
- Bottom-sheet image picker if needed.

Desktop behavior:

- Drop zone and gallery grid.
- Inline progress and validation.

## 4. Data / UI Objects

### Kindergarten Card

Use on listing, homepage, related kindergartens, favorites, and recently viewed.

Content:

- Main photo.
- Badge: Verified, Popular, Trending, Top Rated.
- Like/save button.
- Kindergarten name.
- Location/address.
- Short description.
- Age range.
- Capacity.
- Program count.
- Center type.
- Rating/rank.
- Views.
- View Details action.

States:

- Default, hover, liked, loading skeleton, no image fallback, disabled/unavailable.

### Article Card

Content:

- Article image.
- Category badge.
- Title.
- Short excerpt.
- Author display name or KidsGarden Team.
- Date.
- Views.
- Comment count.

States:

- Default, hover, loading skeleton, no image fallback, no articles empty state.

### Application Card

Content:

- Application type: Teacher Application or Kindergarten Admin Application.
- Target kindergarten or draft kindergarten details.
- Applicant name/phone where private and allowed.
- Status chip.
- Message.
- Review feedback/reject reason.
- Created date.
- Reviewed date.
- Actions: Cancel, Approve, Reject, Closed.

States:

- Pending, Approved, Rejected, Canceled, loading, disabled action, requires rejection reason.

### Notification Card

Content:

- Icon by type.
- Title.
- Short body.
- Timestamp.
- Unread marker.
- Related object label: application, attendance, community, chat, system.
- Primary action target.

States:

- Unread, read, hover, loading skeleton, empty inbox.

### Chat Conversation Item

Content:

- Avatar or kindergarten icon.
- Conversation title.
- Relationship label: Parent - Teacher, Parent - Kindergarten, Staff, Admin Review.
- Last message preview.
- Timestamp.
- Unread badge.
- Privacy/approved relationship indicator.

States:

- Selected, unread, muted/disabled, loading, no messages.

### Message Bubble

Content:

- Message text.
- Sender identity visible only inside private relationship.
- Time.
- Delivery/sent/read state.
- Failed retry state.
- Optional attachment thumbnail.

States:

- Own message, other participant message, sending, sent, read, failed, deleted if supported.

### Dashboard Stat Card

Content:

- Icon.
- Label.
- Number/status.
- Supporting text.
- Optional trend or due indicator.
- Link to relevant dashboard section.

States:

- Default, loading skeleton, alert state, zero state.

### Profile Card

Content:

- Avatar.
- Name/nickname.
- Role chip.
- Phone.
- Approval status when relevant.
- Private profile note.
- Edit action.

States:

- Default, missing image, uploading image, role pending/approved.

### Upload Gallery

Content:

- Upload CTA.
- Accepted formats helper.
- Thumbnail grid.
- Main image badge.
- Remove action.
- Progress/error indicators.

States:

- Empty, uploading, uploaded, error, too many files, unsupported file.

### Review / Comment Card

Content:

- Avatar or safe default.
- Nickname.
- Date.
- Comment text.
- Edit/delete actions only for author in private session.

States:

- Default, author-owned, loading, deleted/removed, empty comments.

## 5. Design Style

Overall direction:

- Warm, clean, trustworthy.
- Early education feeling without becoming childish.
- Friendly but professional SaaS.
- Mobile-first.
- No clutter.
- Accessible typography and generous touch targets.

Visual language:

- Use soft green, ivory, white, beige, and honey accents.
- Use rounded cards and panels, but keep dashboard surfaces disciplined.
- Use real or high-quality generated early education imagery: classrooms, learning spaces, playful materials, safe outdoor spaces, teachers guiding children without exposing identifiable children publicly.
- Avoid stocky generic business visuals.
- Avoid overdecorated dashboards.
- Avoid public-facing imagery that implies children are personally identifiable KidsGarden users.
- Public pages can be warmer and more editorial.
- Dashboards should be quieter, denser, and operations-focused.

## 6. Design System

### Color Palette Suggestion

- Garden Green: `#4F7C5B` for primary buttons, active tabs, links, and success emphasis.
- Deep Pine: `#24332D` for headings and primary text.
- Leaf Green: `#86B88C` for secondary accents and hover states.
- Soft Mint: `#E8F4E8` for gentle panels and selected states.
- Ivory: `#FFF9ED` for warm page backgrounds.
- Warm White: `#FFFFFF` for cards and panels.
- Soft Beige: `#F3E7D3` for background bands and calm dividers.
- Honey: `#F6B84B` for attention accents, pending status, and positive highlights.
- Clay: `#B86A4B` for warm secondary accents.
- Slate Text: `#526255` for secondary copy.
- Border Green: `#DDE8D8` for card borders.
- Error Red: `#B42318` with pale red background `#FEE4E2`.
- Warning Amber: `#92400E` with pale honey background `#FEF3C7`.
- Info Blue: `#1D4ED8` with pale blue background `#DBEAFE`.

### Typography Suggestion

- Primary UI font: Poppins or Inter.
- Headings: 600-800 weight, clear hierarchy, no negative letter spacing.
- Body: 15-16px desktop, 14-16px mobile with line height around 1.5.
- Dashboard tables: compact but readable, 13-14px for metadata.
- Avoid tiny text below 12px except helper metadata.

### Spacing, Radius, Shadow

- Base spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 56.
- Cards: 12-16px radius for public pages; 12-16px for dashboard panels.
- Buttons/inputs: 10-12px radius.
- Pills/badges: full pill radius.
- Shadows: subtle, green-tinted or neutral; avoid heavy drop shadows.
- Borders: light green/beige borders to define panels.

### Buttons

- Primary: Garden Green background, white text, 44-48px height, clear hover/pressed/disabled states.
- Secondary: white or ivory background, Garden Green text, light green border.
- Tertiary/text: Deep Pine or Garden Green text only.
- Destructive: red outline or red text; require confirmation for destructive admin actions.
- Icon buttons: use clear icons for like, notifications, chat, upload, remove, search, filters, edit, delete.

### Inputs

- Height at least 44px.
- Rounded 10-12px.
- Light border with focused Garden Green outline.
- Labels above or floating consistently.
- Helper/error text below fields.
- Selects and date pickers should match text input style.
- Mobile inputs full width.

### Cards

- Public cards: image-led, warm, inviting, with meaningful badges.
- Dashboard cards: information-first, compact, clear labels, status chips.
- Avoid cards inside cards unless a repeated item truly needs framing.

### Badges

- Status chips:
  - Active/Approved/Present: green.
  - Pending/Late: honey.
  - Full/Excused/Info: blue.
  - Inactive/Archived/Canceled: neutral gray.
  - Absent/Blocked/Rejected/Error: red.
- Role chips: Parent, Teacher, Kindergarten Admin, Super Admin.
- Privacy chips: Private, Approved relationship, Internal only.

### Tabs and Filters

- Public topic tabs: pill-style, horizontally scrollable on mobile.
- Dashboard navigation: sidebar on desktop, top tabs or drawer on mobile.
- Filters: collapsible drawer/bottom sheet on mobile, left rail or panel on desktop.
- Active tab should be clear with green fill or green underline.

### Empty States

- Use warm illustration/icon, short title, one helpful sentence, and one clear action.
- Empty states should never expose private data or suggest privileged access without approval.

### Icons and Illustration Direction

- Use friendly rounded icons: family, school, building, shield, lock, chat, calendar, child care, groups, assignment, upload, bell.
- Illustrations should be simple, soft, and education-themed.
- Prefer real/generated kindergarten environment visuals for public hero and center cards.
- Avoid showing identifiable children in public UI as real user records.

## 7. Responsive Requirements

Desktop target:

- 1300px primary design width.
- Center content with stable max width.
- Public pages can use rich multi-column layouts.
- Dashboards should use left navigation plus main content panels.
- Tables can appear on desktop but must be readable and not overcrowded.

Mobile target:

- 390px primary mobile design width.
- Mobile-first stack order.
- No horizontal overflow.
- All important actions reachable with one hand when possible.
- Tables become cards or simplified rows.
- Filters become drawer/bottom sheet.
- Chat uses inbox screen and conversation screen.
- Dashboard sidebar becomes drawer or segmented top navigation.
- Buttons and inputs should be at least 44px high.
- Text must wrap cleanly and never overlap.

Every important page should include desktop and mobile frames:

- Homepage.
- Kindergarten listing.
- Kindergarten detail.
- Community.
- Article detail.
- Help Center.
- Login/Register.
- Parent dashboard.
- Teacher dashboard.
- Kindergarten Admin dashboard.
- Super Admin dashboard.
- Notifications.
- Chat.
- Profile.
- My Kindergarten.
- Applications/enrollment.
- Image upload.

## 8. Safety / Privacy UI Rules

- Do not expose children publicly.
- Do not expose parents publicly.
- Do not expose teachers, staff, kindergarten admins, or super admins publicly.
- Public kindergarten pages can show kindergarten profile information, but not private staff directories or private family data.
- Public community pages should show safe display names only.
- Teacher access requires approval.
- Kindergarten Admin access requires approval.
- Super Admin is internal only and should not appear as a public product role.
- Public signup creates Parent access only.
- Social login, if represented, must also create Parent access only by default.
- Chat must feel private, persistent, and relationship-scoped.
- Do not design chat as a public global room.
- Chat participants should be clear, and conversation context should show why the participants can communicate.
- Application review screens may show applicant details only inside guarded private dashboards.
- Child records are private and should be visible only to linked parents, assigned/authorized teachers, the owning kindergarten admin, and internal Super Admin operations where appropriate.
- Image upload UI must make it clear that public kindergarten photos are public, while profile images and child-related images are private unless explicitly used in private dashboards.
- Empty states and error messages should not leak whether a private user, child, or staff record exists.

## 9. Ready-to-Copy Stitch Prompt

Create a complete Figma-style product design for KidsGarden, an early learning platform for parents, teachers, kindergartens, and internal platform administrators.

Design both desktop at 1300px and mobile at 390px for every important page. Use a warm, clean, trustworthy early-education style: soft garden green, ivory, white, beige, and honey accents; rounded cards; friendly but professional SaaS structure; accessible typography; no clutter.

KidsGarden includes public kindergarten discovery and private role-based dashboards. Public pages include the homepage, kindergarten listing, kindergarten detail, Parent Community, article detail, Help Center, and Login/Register. Private pages include Parent dashboard, Teacher dashboard, Kindergarten Admin dashboard, Super Admin dashboard, Notifications, Chat, Profile, My Kindergarten, Applications/enrollment, and Image Upload UI.

Roles:

- Parent: public signup role. Parents browse kindergartens, like/save centers, read/write community articles, comment, view linked children, view attendance, submit teacher applications, submit Kindergarten Admin applications, update profile, receive notifications, and use private relationship-scoped chat.
- Teacher: requires approval. Teachers view assigned groups and mark/update attendance for assigned groups.
- Kindergarten Admin: requires approval. Kindergarten Admins manage their own kindergarten profile, photos, staff, staff applications, groups, children, attendance, notifications, and private chat.
- Super Admin: internal only. Super Admins review members, kindergartens, Kindergarten Admin applications, staff applications, community articles/comments, and read-only operations records.

Design the main pages:

- Homepage: hero with kindergarten/early-learning imagery, search entry, role cards, feature grid, featured/trending/top kindergartens, community preview, privacy section, final CTA.
- Kindergarten listing: search hero, trust chips, search summary, filters, map preview placeholder, sorting, grid/list toggle, kindergarten card grid, pagination, top kindergartens strip.
- Kindergarten detail: gallery, verified badge, info card, facts grid, contact/request visit actions, quick facts, about/programs/safety/gallery sections, parent reviews, nearby kindergartens, teacher application sidebar.
- Community: search, topic tabs, featured articles, Q&A list, highlights, sidebar topics, platform updates, guidelines, subscribe/support prompt.
- Article detail: category navigation, article header, author display, content, like action, comment composer, comments list, edit/delete own comments.
- Help Center: help search, support categories, FAQ accordion, contact support.
- Login/Register: KidsGarden auth form with login/signup toggle, Parent-only signup, helper text that teachers and kindergarten admins require approval.
- Parent dashboard: overview stats, My Children, Attendance, Teacher Applications, Kindergarten Admin Application, community writing entry, notifications/chat previews.
- Teacher dashboard: overview stats, My Groups, Attendance with group/date controls and child attendance rows.
- Kindergarten Admin dashboard: overview stats, My Kindergarten, Staff, Staff Applications, Groups, Children, Attendance.
- Super Admin dashboard: internal admin shell, overview cards, members, kindergartens, applications, community moderation, read-only operations.
- Notifications: bell dropdown plus full page, unread count, filters, grouped notification cards.
- Chat: private relationship-scoped inbox and thread UI, conversation list, message bubbles, composer, unread badges, disabled state when relationship is not approved.
- Profile: avatar upload, account fields, role chip, private profile note, save action.
- My Kindergarten: owned center cards, create/edit form, basic info, center details, photo upload gallery.
- Applications/enrollment: teacher application status, Kindergarten Admin application form/history, child linking/enrollment with parent preview.
- Image upload: drag/drop or upload button, JPG/JPEG/PNG/WEBP helper, previews, main image badge, remove action, progress, validation errors.

For each page include purpose, main sections, key actions, empty states, loading/error states, mobile behavior, and desktop behavior. Design reusable components for kindergarten cards, article cards, application cards, notification cards, chat conversation items, message bubbles, dashboard stat cards, profile cards, upload galleries, and review/comment cards.

Safety and privacy are core: do not expose children publicly; do not expose parents, teachers, staff, kindergarten admins, or super admins publicly; Teacher and Kindergarten Admin access require approval; Super Admin is internal only; chat must feel private and relationship-scoped, never like a public global room.
