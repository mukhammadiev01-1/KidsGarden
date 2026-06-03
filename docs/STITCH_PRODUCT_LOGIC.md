# KidsGarden Product Logic Brief for Stitch

This file is product and context logic for Stitch. It is not a visual design specification.

Minimal visual direction:

- KidsGarden is a kindergarten and early education platform.
- The UI should feel warm, trustworthy, clean, modern, and parent-friendly.
- Approximate palette: soft green, ivory, warm white, beige, and honey accents.
- Stitch should create the actual UI/UX, layout, components, imagery, spacing, and visual direction.

## 1. Product Summary

KidsGarden helps families discover kindergartens and helps approved education teams manage private kindergarten operations.

The product has two major sides:

- Public product experience: parents can discover kindergartens, read community content, learn how KidsGarden works, and create a Parent account.
- Private role-based experience: Parents, Teachers, Kindergarten Admins, and Super Admins each access only the workflows and data allowed for their role.

Main value:

- Parents can compare kindergartens, follow their child's attendance, manage applications, participate in the Parent Community, and communicate privately with approved relationships.
- Teachers can see assigned groups and manage attendance after approval.
- Kindergarten Admins can manage their own kindergarten profile, staff, groups, children, attendance, and staff applications after approval.
- Super Admins can review platform records, approve access flows, moderate community content, and inspect operations internally.

## 2. Roles

### Parent

Access:

- Parent is the public signup role.
- A new public account should become Parent by default.
- Social login, when added, should also create Parent access by default.

Can do:

- Browse public kindergarten profiles.
- Search and filter kindergartens.
- Like or save kindergartens.
- Read Parent Community articles and platform news.
- Write Parent Community articles.
- Comment on articles and kindergarten profiles.
- View children linked to their own account.
- View attendance records for linked children.
- Submit teacher applications from kindergarten profiles.
- Submit a Kindergarten Admin application.
- Track application status and cancel pending applications where allowed.
- Update their private profile.
- Receive private notifications.
- Use private chat only with approved relationships.

Should not access:

- Teacher dashboard unless a teacher application is approved.
- Kindergarten Admin dashboard unless a Kindergarten Admin application is approved.
- Super Admin tools.
- Other parents' children, attendance, applications, or private profile data.
- Private staff/admin directories.

### Teacher

Access:

- Teacher access requires approval through a staff application flow.
- Teacher access should not be available through public signup alone.

Can do:

- View assigned active groups.
- View children in assigned groups where allowed.
- Mark and update attendance for assigned groups.
- Add attendance notes.
- View their private profile.
- Receive notifications related to assigned groups and attendance.
- Use private chat only with approved relationships.

Should not access:

- Kindergarten Admin management tools.
- Super Admin tools.
- Children or groups not assigned to them.
- Parent private data outside approved relationships.
- Public exposure of their staff profile.

### Kindergarten Admin

Access:

- Kindergarten Admin access requires approval through a Kindergarten Admin application flow.
- A Kindergarten Admin manages only kindergartens they own or are approved to manage.

Can do:

- Create and update their kindergarten profile.
- Upload and manage kindergarten images.
- Manage staff records for their kindergarten.
- Review teacher/staff applications for their kindergarten.
- Create and manage groups.
- Assign active teachers to groups.
- Create and manage child records.
- Link child records to verified parent accounts.
- Mark, update, and review attendance.
- Receive notifications for applications, staff, children, attendance, community activity, and chat.
- Use private chat with approved kindergarten relationships.

Should not access:

- Other kindergartens' private operations.
- Super Admin platform tools.
- Parent data unrelated to their kindergarten.
- Teacher data unrelated to their kindergarten.
- Broad account status controls outside their kindergarten scope.

### Super Admin

Access:

- Super Admin is an internal platform role only.
- Super Admin should be visually and logically separated from normal user dashboards.

Can do:

- Review platform overview.
- Review members and update member status where allowed.
- Review kindergartens and update kindergarten status where allowed.
- Review Kindergarten Admin applications.
- Review staff/teacher applications across the platform.
- Moderate Parent Community articles and comments.
- Inspect staff, group, child, and attendance operations records internally.
- Use constrained status-only or review actions where possible.

Should not access:

- Public signup flow.
- Normal Parent/Teacher/Kindergarten Admin dashboards as if they were a regular user.
- Unnecessary destructive operations.
- Public-facing exposure of internal tools.

## 3. Public Pages

### Homepage

Purpose:

- Explain what KidsGarden is.
- Help parents start kindergarten discovery.
- Introduce Parents, Teachers, and Kindergartens as supported audiences.
- Show that KidsGarden is privacy-conscious and role-based.

Main content/data:

- KidsGarden product positioning.
- Search or discovery entry for kindergartens.
- Short role/value explanation.
- Featured or popular kindergartens when available.
- Parent Community or platform news preview when available.
- Safety/privacy messaging.

Main actions:

- Start browsing kindergartens.
- Open a kindergarten profile.
- Open Parent Community.
- Open Help Center.
- Login or register.

Important states:

- Empty: no featured kindergartens or community content yet.
- Loading: kindergarten/community preview data is loading.
- Error: homepage preview data cannot load; user should still be able to navigate.

Mobile considerations:

- Keep the main discovery action easy to reach.
- Avoid hiding important public navigation behind unclear controls.

### Kindergarten Listing

Purpose:

- Let parents search, filter, compare, and open public kindergarten profiles.

Main content/data:

- Kindergarten list.
- Search criteria.
- Filters such as location, center type, age range, programs, capacity, and monthly fee.
- Sorting such as newest, fee, popularity, or rating.
- Like/save state.
- Result count.
- Map preview placeholder for future map support.

Main actions:

- Search.
- Apply filters.
- Sort results.
- Like or save a kindergarten.
- Open kindergarten detail.
- Change result page.

Important states:

- Empty: no kindergartens match the current filters.
- Loading: results are loading or refreshing.
- Error: results cannot load; user can retry or adjust search.

Mobile considerations:

- Filters should be easy to open and close.
- Kindergarten results should be easy to scan without horizontal scrolling.

### Kindergarten Detail

Purpose:

- Show one public kindergarten profile and help parents evaluate it.
- Provide a teacher application entry for eligible signed-in Parents.

Main content/data:

- Kindergarten name.
- Public images/gallery.
- Location/address.
- Description.
- Center type.
- Age range.
- Capacity.
- Program count/details.
- Monthly fee.
- Views/likes/reviews.
- Safety/facility information where available.
- Parent reviews/comments.
- Nearby or similar kindergartens when available.
- Teacher application status for the current Parent when relevant.

Main actions:

- Like or save kindergarten.
- View images.
- Submit a parent review.
- Contact or request a visit where supported.
- Apply as Teacher if signed in as Parent and eligible.
- Login if an action requires authentication.

Important states:

- Empty: no images, no reviews, no similar kindergartens.
- Loading: kindergarten profile, comments, or application status is loading.
- Error: profile cannot load or was not found.
- Restricted: teacher application unavailable because user is not signed in, is not a Parent, already has a pending application, or is already approved.

Mobile considerations:

- Keep primary kindergarten facts and actions easy to find.
- Teacher application should remain understandable without crowding the profile.

### Community Page

Purpose:

- Provide a safe Parent Community for parenting tips, learning ideas, Q&A, activities, health/nutrition, and platform news.

Main content/data:

- Article list.
- Featured articles when available.
- Recent questions or Q&A-style content.
- Topic/category filters.
- Search.
- Article metadata such as category, author display name, date, views, and comments.
- Community guidance and safety reminders.

Main actions:

- Search community content.
- Filter by topic/category.
- Open article detail.
- Write an article if signed in as Parent.
- Login when required.

Important states:

- Empty: no articles for current topic.
- Loading: articles are loading.
- Error: community content cannot load.
- Restricted: write action is unavailable for anonymous users or non-Parent roles.

Mobile considerations:

- Topic filters and search should remain simple.
- Article lists should be readable and scannable.

### Article Detail

Purpose:

- Let users read a Parent Community article and participate in comments when allowed.

Main content/data:

- Article title.
- Category.
- Author display name.
- Date.
- Article content.
- Likes.
- Views.
- Comment count.
- Comments.
- Current user's ownership of comments where relevant.

Main actions:

- Like article.
- Add comment.
- Edit own comment if supported.
- Remove own comment if supported.
- Navigate to other community categories.
- Write an article if signed in as Parent.

Important states:

- Empty: no comments yet.
- Loading: article or comments are loading.
- Error: article cannot load or was not found.
- Restricted: comment and write actions require authentication; writing requires Parent role.

Mobile considerations:

- Article content and comment writing must stay readable.
- Category navigation should not dominate the reading experience.

### Help Center

Purpose:

- Help Parents, Teachers, and Kindergartens understand KidsGarden workflows.

Main content/data:

- Help topics for Parents.
- Help topics for Teachers.
- Help topics for Kindergartens.
- Account and login help.
- Applications and enrollment help.
- Safety and privacy help.
- FAQ content.
- Support contact.

Main actions:

- Search help topics if search is included.
- Open help categories.
- Expand FAQ answers.
- Contact support.

Important states:

- Empty: no search results.
- Loading: search results are loading if search is dynamic.
- Error: support content cannot load if dynamic.

Mobile considerations:

- FAQ and category navigation should be easy to tap.

### Login/Register

Purpose:

- Let users sign in or create a Parent account.

Main content/data:

- Login mode.
- Register mode.
- Nickname.
- Password.
- Phone for registration.
- Parent-only signup explanation.
- Reminder that Teachers and Kindergarten Admins require approval.

Main actions:

- Login.
- Register as Parent.
- Switch between login and register.
- Use future social login when available.
- Recover password if supported.

Important states:

- Empty/validation: required fields missing.
- Loading: authentication request in progress.
- Error: login/signup failed.
- Restricted: privileged roles cannot be selected during public signup.

Mobile considerations:

- Forms should be easy to complete on a small screen.

## 4. Private Dashboards

### Parent Dashboard

What the user needs to see:

- Their role and private account context.
- Linked children.
- Attendance records for linked children.
- Teacher application status/history.
- Kindergarten Admin application form and status/history.
- Parent Community writing entry.
- Notifications.
- Private chat entry.
- Profile entry.

Main actions:

- Select child.
- Review attendance.
- Submit Kindergarten Admin application.
- Cancel pending applications where allowed.
- Open kindergarten profiles to apply as Teacher.
- Write Parent Community article.
- Open notifications and chat.
- Update profile.

Important tables/cards/forms:

- Children list.
- Attendance history.
- Teacher applications list.
- Kindergarten Admin application form.
- Kindergarten Admin application history.
- Notification summary.
- Chat summary.

Important states:

- Empty: no linked children, no attendance records, no applications, no notifications, no chats.
- Loading: children, attendance, applications, notifications, or chat data is loading.
- Error: dashboard data cannot load or action cannot complete.
- Approved role change: user may need to sign out and sign in again after approval.

### Teacher Dashboard

What the user needs to see:

- Assigned active groups.
- Attendance workflow for assigned groups.
- Current date or selected date.
- Children in selected group.
- Saved attendance status and editable attendance status.
- Attendance notes.
- Notifications and chat relevant to assigned relationships.

Main actions:

- Select group.
- Select date.
- Mark attendance.
- Update attendance.
- Add or edit note.
- Open notification or chat.
- Update profile.

Important tables/cards/forms:

- Assigned groups list.
- Attendance form/list for selected group and date.
- Attendance status controls.
- Notes input.

Important states:

- Empty: no assigned groups or no active children in selected group.
- Loading: groups, children, or attendance records are loading.
- Error: attendance cannot be saved or data cannot load.
- Restricted: teacher cannot access groups outside assignment.

### Kindergarten Admin Dashboard

What the user needs to see:

- Owned/managed kindergarten context.
- Kindergarten profile information.
- Kindergarten images.
- Staff records.
- Staff application queue.
- Groups.
- Children.
- Attendance by kindergarten, group, and date.
- Notifications and chat.
- Profile entry.

Main actions:

- Create or update kindergarten profile.
- Upload or remove kindergarten images.
- Select managed kindergarten when more than one exists.
- Search/select staff candidates.
- Create, update, or remove staff records.
- Review teacher/staff applications.
- Approve or reject applications with reason when rejecting.
- Create, update, or archive groups.
- Assign active teachers to groups.
- Create, update, or deactivate child records.
- Preview parent account before linking child.
- Mark, update, or remove attendance.
- Open notifications and chat.

Important tables/cards/forms:

- Owned kindergarten list.
- Kindergarten profile form.
- Image upload/gallery control.
- Staff list and staff creation form.
- Staff applications table.
- Group form and group list.
- Child form and children list.
- Attendance scope controls and attendance records.

Important states:

- Empty: no kindergarten profile, no staff, no active teachers, no groups, no children, no applications, no attendance records.
- Loading: owned kindergartens, staff, applications, groups, children, or attendance are loading.
- Error: save/update/review/upload actions fail.
- Restricted: Kindergarten Admin can manage only their own kindergarten data.

### Super Admin Dashboard

What the user needs to see:

- Internal platform overview.
- Members.
- Kindergartens.
- Kindergarten Admin applications.
- Staff applications.
- Community articles.
- Community comments.
- Staff, group, child, and attendance operations records.
- Clear distinction between review actions and read-only operations.

Main actions:

- Review platform metrics.
- Update member status where allowed.
- Update kindergarten status where allowed.
- Approve or reject Kindergarten Admin applications.
- Review staff applications across the platform.
- Moderate community articles.
- Moderate community comments.
- Inspect operations records.

Important tables/cards/forms:

- Overview summaries.
- Members table.
- Kindergartens table.
- Application review tables.
- Community moderation tables.
- Read-only operations tables.

Important states:

- Empty: no records or no pending review items.
- Loading: admin records are loading.
- Error: records cannot load or status update fails.
- Restricted: internal-only access; operations views may be read-only.

## 5. Core Features

### Image Upload

Purpose:

- Support profile images, kindergarten images, article images, and future chat attachments where appropriate.

Must support:

- Uploading JPG, JPEG, PNG, and WEBP images.
- Clear accepted file guidance.
- Previewing uploaded image(s).
- Removing selected/uploaded image(s) where allowed.
- Marking the first kindergarten image as the main public image.
- Uploading multiple kindergarten images.
- Error handling for unsupported file type, too many files, failed upload, and missing required image.

Privacy:

- Kindergarten images can be public as part of public kindergarten profiles.
- Profile images are private account data except where safely displayed in private or community contexts.
- Child images, if ever supported, must be private and carefully scoped.

### Applications / Approval Flows

Teacher application:

- A Parent can apply to teach at a kindergarten from that kindergarten profile.
- Application includes target kindergarten, requested role, optional message, status, review result, and timestamps.
- Parent can track status and cancel pending applications where allowed.
- Kindergarten Admin reviews teacher applications for their kindergarten.
- Approval grants Teacher access.
- Rejection requires or should include a reason.

Kindergarten Admin application:

- A Parent can apply to manage a kindergarten.
- Application includes draft kindergarten details, business information, message, status, review result, and timestamps.
- Super Admin reviews applications.
- Approval grants Kindergarten Admin access and creates/links appropriate kindergarten management data.
- Rejection requires or should include a reason.

General approval rules:

- Public signup does not grant Teacher or Kindergarten Admin access.
- Approved users may need to sign out and sign in again to enter their new dashboard.
- Pending and approved states should prevent duplicate active applications where appropriate.

### Notifications

Purpose:

- Inform users about important private events.

Events to support:

- Application submitted, approved, rejected, or canceled.
- Attendance created or updated.
- Child/group/staff updates relevant to the user.
- Community comments or moderation outcomes.
- Chat messages.
- System/account notices.

Must support:

- Unread/read state.
- Notification type.
- Timestamp.
- Short message.
- Link to relevant private or public destination.
- Filtering by type if useful.
- Mark one or all as read.

Privacy:

- Notifications must not leak private child, parent, staff, or admin data to unrelated users.

### Chat

Purpose:

- Provide private communication scoped to approved KidsGarden relationships.

Must support:

- Conversation list.
- Conversation details.
- Messages.
- Unread counts.
- Timestamps.
- Sending state.
- Failed message retry.
- Empty conversation state.
- Disabled state when relationship is not approved or no longer active.

Privacy:

- Chat must not be a public global room.
- Conversations must be based on approved parent, teacher, kindergarten, or admin relationships.
- Participants should understand the relationship context for each conversation.

### Profile

Purpose:

- Let signed-in users manage private account basics.

Must support:

- Display role.
- Display and update profile image.
- Update nickname/name where allowed.
- Update phone where allowed.
- Update address where allowed.
- Save changes.
- Show validation, loading, and error states.

Privacy:

- Profiles are private by default.
- Public member, staff, and admin profile pages are not part of the product logic.

### Maps Future Placeholder

Purpose:

- Prepare for future map/geocoding support without requiring a complete map now.

Must support now:

- Map preview placeholder on kindergarten listing and detail.
- Clear "map coming later" logic if live map is unavailable.

Future support:

- Kindergarten latitude/longitude.
- Search by map area.
- Kindergarten location pins.
- Geocoding workflow for kindergarten addresses.

### Social Login Future Placeholder

Purpose:

- Prepare for future Google or other social login.

Must support:

- Social login should create Parent access by default.
- Social login must not grant Teacher, Kindergarten Admin, or Super Admin access automatically.
- Account linking should be clear if the same user already has an account.

## 6. Data Objects

### Kindergarten

Represents a public center profile and an operational entity.

Key data:

- ID.
- Name.
- Description.
- Address.
- Location.
- Center type.
- Monthly fee.
- Capacity.
- Age range.
- Program count/details.
- Images.
- Status.
- Owner/admin relationship.
- Likes, views, comments/reviews.
- Created and updated timestamps.

Key actions:

- Public browse/search/view.
- Like/save by signed-in user.
- Create/update by approved Kindergarten Admin.
- Status review by Super Admin.

### User Profile

Represents a KidsGarden account.

Key data:

- ID.
- Nickname/name.
- Phone.
- Address.
- Profile image.
- Role.
- Account status.
- Approval-related role state where applicable.

Key actions:

- Signup/login.
- Update profile.
- Role-based access.
- Status review by Super Admin where allowed.

### Child

Represents a child record inside private kindergarten operations.

Key data:

- ID.
- Full name.
- Birth date.
- Gender.
- Status.
- Parent link.
- Kindergarten link.
- Group link.

Key actions:

- Create/update/deactivate by Kindergarten Admin.
- View by linked Parent.
- View by assigned Teacher where allowed.
- Internal inspection by Super Admin where appropriate.

Privacy:

- Child data is never public.

### Group

Represents a classroom/group under a kindergarten.

Key data:

- ID.
- Kindergarten link.
- Group name.
- Age range.
- Capacity.
- Teacher assignments.
- Status.

Key actions:

- Create/update/archive by Kindergarten Admin.
- View by assigned Teacher.
- Use for attendance and child organization.

### Attendance Record

Represents one child's attendance status for a kindergarten/group/date.

Key data:

- ID.
- Child link.
- Kindergarten link.
- Group link.
- Date.
- Status such as present, absent, late, or excused.
- Optional note.
- Marked by staff/admin.
- Created and updated timestamps.

Key actions:

- Mark/update by assigned Teacher or Kindergarten Admin.
- Review by linked Parent.
- Internal inspection by Super Admin where appropriate.

Privacy:

- Attendance is private and relationship-scoped.

### Staff Record

Represents a member's staff relationship to a kindergarten.

Key data:

- ID.
- Kindergarten link.
- Member link.
- Staff role.
- Staff status.
- Created timestamp.

Key actions:

- Create/update/remove by Kindergarten Admin within their kindergarten.
- Protected owner record should not be casually removed.
- Used to determine Teacher access and assignments.

### Application

Represents an approval workflow.

Types:

- Teacher/staff application.
- Kindergarten Admin application.

Key data:

- ID.
- Applicant.
- Target kindergarten or draft kindergarten details.
- Requested role.
- Message or business information.
- Status.
- Review decision.
- Reject reason.
- Created/reviewed timestamps.

Key actions:

- Submit.
- Cancel if pending and allowed.
- Approve.
- Reject.
- Track status.

### Article

Represents Parent Community or platform news content.

Key data:

- ID.
- Title.
- Content.
- Category.
- Author display data.
- Image.
- Likes.
- Views.
- Comment count.
- Status.
- Created/updated timestamps.

Key actions:

- Browse/search/read.
- Write by Parent.
- Like.
- Comment.
- Moderate by Super Admin.

### Comment

Represents feedback or conversation attached to an article or kindergarten.

Key data:

- ID.
- Author display data.
- Target type.
- Target ID.
- Content.
- Status.
- Created/updated timestamps.

Key actions:

- Create.
- Edit/remove own comment where supported.
- Moderate by Super Admin where appropriate.

### Notification

Represents a private event notice.

Key data:

- ID.
- Recipient.
- Type.
- Title/message.
- Read state.
- Related object.
- Timestamp.

Key actions:

- View.
- Open related destination.
- Mark read/unread.
- Filter by type.

### Chat Conversation

Represents a private relationship-scoped chat.

Key data:

- ID.
- Participants.
- Relationship context.
- Related kindergarten/group/application where relevant.
- Last message.
- Unread counts.
- Status.
- Created/updated timestamps.

Key actions:

- Open conversation.
- Search/filter conversations.
- Send messages if relationship is active.

### Message

Represents one chat message.

Key data:

- ID.
- Conversation link.
- Sender.
- Body.
- Attachments if supported.
- Sent/read state.
- Timestamp.

Key actions:

- Send.
- Retry failed send.
- Read.
- Display in correct conversation only.

## 7. Privacy Rules

- Child data is private.
- Child names, attendance, group membership, and parent links must never appear on public pages.
- User, staff, Kindergarten Admin, and Super Admin data is not public.
- Public pages can show kindergarten profile information and safe community author display names, but not private account details.
- Teacher access requires approval.
- Kindergarten Admin access requires approval.
- Super Admin is internal only.
- Public signup creates Parent access only.
- Social login must not grant privileged roles automatically.
- Kindergarten Admins can manage only their own kindergarten data.
- Teachers can access only assigned groups and relevant attendance workflows.
- Parents can access only their own linked children, applications, notifications, profile, and approved relationships.
- Super Admin tools should stay internal and separated from public user experiences.
- Chat must be private and relationship-scoped.
- Chat must not be presented as a global public chat.
- Notifications must not leak private records to unrelated users.
- Application review screens may show applicant details only inside the appropriate guarded dashboard.
- Public discovery should never expose children, parents, teachers, staff, or admins as directories.

## 8. Ready-to-Copy Stitch Prompt

Use the attached KidsGarden product logic brief as product/context logic only. Create a fresh UI/UX design for KidsGarden, a kindergarten and early education platform for Parents, Teachers, Kindergarten Admins, and internal Super Admins.

Do not copy the existing website layout. Do not make a generic SaaS template. Create a warm, trustworthy, clean, modern, parent-friendly product experience using the product logic in this file.

Create desktop screens at 1300px and mobile screens at 390px. Start with the public pages first: Homepage, Kindergarten Listing, Kindergarten Detail, Community, Article Detail, Help Center, and Login/Register. Then design the private dashboards and core feature screens: Parent Dashboard, Teacher Dashboard, Kindergarten Admin Dashboard, Super Admin Dashboard, Profile, Image Upload, Applications/Approvals, Notifications, and private relationship-scoped Chat.

Respect the privacy rules: child data is private, user/staff/admin data is not public, Teacher and Kindergarten Admin access require approval, Super Admin is internal only, and chat must be private and relationship-scoped.
