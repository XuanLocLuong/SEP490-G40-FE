# JOBLINK AI DEVELOPER HANDBOOK

# PART 7

# UI DESIGN SYSTEM & FRONTEND DEVELOPMENT STANDARD

Version 1.0

---

# 1. Purpose

Mục tiêu của chương này là chuẩn hóa toàn bộ giao diện JobLink.

Bất kỳ AI nào sinh code đều phải tuân thủ Design System này.

AI KHÔNG được tự ý đổi màu.

AI KHÔNG được tự ý đổi spacing.

AI KHÔNG được tự ý đổi typography.

---

# 2. Design Philosophy

JobLink theo phong cách

Modern

Clean

Minimal

Professional

Trustworthy

Fast

Student Friendly

Không sử dụng giao diện quá nhiều hiệu ứng.

Ưu tiên khả năng đọc.

---

# 3. Color Palette

Primary

#2563EB

Primary Hover

#1D4ED8

Secondary

#14B8A6

Success

#22C55E

Warning

#F59E0B

Danger

#EF4444

Background

#F8FAFC

Surface

#FFFFFF

Border

#E5E7EB

Text Primary

#111827

Text Secondary

#6B7280

Disabled

#CBD5E1

---

# 4. Typography

Heading 1

36px

Heading 2

30px

Heading 3

24px

Heading 4

20px

Body Large

18px

Body

16px

Small

14px

Caption

12px

Font Weight

400

500

600

700

Không dùng quá nhiều font.

---

# 5. Border Radius

Card

16px

Button

12px

Input

10px

Avatar

999px

Chip

20px

Dialog

20px

---

# 6. Shadow

Level 1

Card

Level 2

Popup

Level 3

Modal

Không dùng shadow quá đậm.

---

# 7. Spacing System

4

8

12

16

20

24

32

40

48

64

Không sử dụng giá trị ngẫu nhiên.

Ví dụ

13px

17px

21px

là không hợp lệ.

---

# 8. Layout

Container

Max Width

1440px

Section Padding

32px

Grid

12 Columns

Gap

24px

---

# 9. Responsive Breakpoint

Mobile

<768

Tablet

768-1024

Laptop

1024-1440

Desktop

>1440

Mọi page đều phải responsive.

---

# 10. Component Hierarchy

Page

↓

Section

↓

Container

↓

Card

↓

Component

↓

Atom

AI không render tất cả trong Page.

---

# 11. Common Components

Project phải tái sử dụng

Button

Input

Textarea

Select

Checkbox

Radio

Badge

Tag

Chip

Avatar

Modal

Drawer

Toast

Loading

Skeleton

Pagination

Table

Card

SearchBox

Filter

Không duplicate.

---

# 12. Button Standard

Primary

Secondary

Danger

Success

Outline

Ghost

Icon

Loading

Disabled

Button chỉ nên có

height

40

48

56

---

# 13. Input Standard

Label

Placeholder

Required

Validation

Error Message

Support Text

Prefix

Suffix

Loading

Disabled

Readonly

---

# 14. Card Standard

Header

Content

Footer

Action

Card không chứa logic.

---

# 15. Modal Standard

Header

Body

Footer

Cancel

Confirm

Close Icon

ESC

Backdrop

---

# 16. Loading Standard

Không dùng Spinner cho toàn bộ màn hình.

Ưu tiên

Skeleton

Card Skeleton

Table Skeleton

Profile Skeleton

Job Skeleton

---

# 17. Empty State

Mỗi page phải có

Icon

Title

Description

CTA

Ví dụ

"No Jobs Found"

↓

Create Job

---

# 18. Error State

Có

Illustration

Message

Retry Button

Support Contact

---

# 19. Toast

Success

Info

Warning

Danger

Không dùng alert().

---

# 20. Form Standard

React Hook Form

Validation

Yup/Zod

Realtime Validation

Submit Validation

Không validate thủ công.

---

# 21. Page Layout

Header

↓

Breadcrumb

↓

Toolbar

↓

Content

↓

Pagination

↓

Footer

---

# 22. Dashboard Layout

Sidebar

↓

Topbar

↓

Summary Cards

↓

Charts

↓

Table

↓

Activities

---

# 23. Candidate UI

Dashboard

Recommendation

Profile

Availability

Application

Saved Job

Review

Trust Score

Notification

---

# 24. Recruiter UI

Dashboard

Business

Jobs

Applicants

Interview

Analytics

Verification

---

# 25. Admin UI

Dashboard

Manage User

Manage Job

Manage Business

Manage Verification

Manage Report

Audit Log

Configuration

---

# 26. Icon System

Sử dụng một bộ icon duy nhất.

Không trộn HeroIcon

Lucide

FontAwesome

Material

---

# 27. Image Rule

Avatar

Business Logo

Banner

Thumbnail

Placeholder

Lazy Loading

---

# 28. Accessibility

Keyboard Navigation

ARIA Label

Tab Index

Screen Reader

Focus State

Color Contrast

---

# 29. Animation

Chỉ dùng animation nhẹ.

Hover

Fade

Slide

Scale

Duration

150ms

200ms

300ms

Không dùng animation dài.

---

# 30. Frontend Folder Standard

src/

apis/

assets/

components/

constants/

contexts/

hooks/

layouts/

pages/

routes/

services/

types/

utils/

styles/

---

# 31. Naming Convention

Component

PascalCase

Hook

useCamelCase

API

camelCase

Constant

UPPER_CASE

CSS Module

Component.module.css

---

# 32. State Management

Global

Authentication

Theme

Notification

Local

Form

Modal

Dropdown

Search

Không đưa tất cả vào Context.

---

# 33. AI UI Rules

AI phải

✔ Reuse Component

✔ Reuse Layout

✔ Responsive

✔ Accessible

✔ Clean Code

✔ Design Token

✔ Không Hardcode

✔ Không Duplicate

✔ Không Inline CSS

---

# 34. UI Checklist

□ Responsive

□ Loading

□ Empty State

□ Error State

□ Validation

□ Toast

□ Skeleton

□ Accessibility

□ Reusable

□ Theme Support

Nếu thiếu một mục thì UI chưa được coi là hoàn chỉnh.

---

END OF PART 7