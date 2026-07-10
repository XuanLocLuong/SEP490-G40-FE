# JOBLINK AI DEVELOPER HANDBOOK

# PART 10

# SOURCE CODE ANALYSIS & DEVELOPMENT CONVENTION

Version 1.0

---

# 1. Purpose

Đây là chương giúp AI hiểu **source code hiện tại** của JobLink trước khi bắt đầu code.

Khác với các chương trước chỉ mô tả kiến trúc, chương này tập trung vào:

- Phân tích cấu trúc source.
- Xác định dependency.
- Hiểu cách các module giao tiếp.
- Xác định component có thể tái sử dụng.
- Xác định file được phép chỉnh sửa.
- Xác định file không nên sửa.
- Giảm việc AI tạo code trùng lặp.

AI phải đọc chương này trước khi tạo bất kỳ Feature mới nào.

---

# 2. Frontend Source Structure

```
src/
│
├── apis/
├── assets/
├── components/
├── contexts/
├── hooks/
├── layouts/
├── pages/
├── routes/
├── services/
├── styles/
├── utils/
├── constants/
├── App.jsx
└── main.jsx
```

AI không được thay đổi cấu trúc thư mục nếu chưa có yêu cầu.

---

# 3. Folder Responsibility

## apis/

Chỉ chứa

- Axios Client
- API Functions
- API Endpoint

Không chứa

Business Logic

Không chứa

Component

---

## services/

Chứa

Business Logic phía Frontend

Ví dụ

JobService

RecommendationService

NotificationService

Không gọi Service trong Service khác nếu không cần.

---

## hooks/

Chứa Custom Hook.

Ví dụ

```
useAuth()

useJobs()

useBusiness()

useApplications()

usePagination()

useToast()

useModal()
```

Không đặt Hook trong pages.

---

## pages/

Chỉ chứa

Screen.

Ví dụ

```
LoginPage

RegisterPage

DashboardPage

ProfilePage

JobDetailPage
```

Không viết component lớn trong pages.

---

## components/

Chứa toàn bộ UI.

Ví dụ

```
Button

Input

Header

Sidebar

Footer

Card

Modal

JobCard

ProfileCard

NotificationItem
```

Không gọi API trực tiếp.

---

## layouts/

Chứa

```
GuestLayout

CandidateLayout

RecruiterLayout

AdminLayout
```

Layout chỉ render

Header

Sidebar

Footer

Outlet

---

## contexts/

Chứa

Global State.

Ví dụ

```
AuthContext

ThemeContext

NotificationContext
```

Không lưu Business Logic.

---

## utils/

Helper Function.

Ví dụ

```
formatDate()

formatMoney()

calculateDistance()

generateAvatar()

truncateText()
```

---

## constants/

Chứa

```
Role

Permission

Route

Color

Theme

JobStatus

ApplicationStatus
```

Không hardcode String.

---

# 4. File Dependency

AI phải hiểu dependency.

```
main.jsx

↓

App.jsx

↓

Router

↓

Layout

↓

Page

↓

Component

↓

Hook

↓

Service

↓

API

↓

Backend
```

Không được đảo ngược.

---

# 5. Page Responsibility

Một Page chỉ nên

- gọi Hook
- render Component
- truyền Props

Không viết Business Logic.

Ví dụ

```
JobPage

↓

useJobs()

↓

JobList

↓

Pagination
```

---

# 6. Component Responsibility

Một Component chỉ có một nhiệm vụ.

Ví dụ

```
JobCard
```

Được

✔ Render UI

✔ Nhận Props

✔ Emit Event

Không được

❌ Fetch API

❌ Login

❌ Save Database

---

# 7. Hook Responsibility

Hook chịu trách nhiệm

- Fetch API
- Local State
- Cache
- Loading
- Error

Ví dụ

```
useJobs()

↓

JobService

↓

Axios

↓

Backend
```

---

# 8. Service Responsibility

Service là tầng trung gian.

```
Component

↓

Hook

↓

Service

↓

API
```

Service xử lý

- Transform Data
- Merge Request
- Mapping DTO
- Retry Logic

---

# 9. API Responsibility

API Layer chỉ gọi HTTP.

Ví dụ

```
JobApi

↓

axios.get()

↓

Return Promise
```

Không xử lý UI.

---

# 10. Component Communication

```
Parent

↓

Props

↓

Child

↓

Callback

↓

Parent
```

Không truyền State quá nhiều tầng.

Nếu cần

↓

Context.

---

# 11. State Management

Global

```
Authentication

Theme

Notification
```

Local

```
Modal

Dropdown

Form

Search

Pagination
```

Không đưa toàn bộ state vào Context.

---

# 12. Routing Convention

```
/

↓

Guest

↓

Login

↓

Candidate

↓

Recruiter

↓

Admin
```

Role kiểm tra tại Protected Route.

---

# 13. Naming Convention

Component

```
JobCard.jsx
```

Hook

```
useJobs.js
```

API

```
jobApi.js
```

Service

```
jobService.js
```

Constant

```
JOB_STATUS.js
```

---

# 14. CSS Convention

Một Component

↓

Một CSS.

Ví dụ

```
JobCard.jsx

↓

JobCard.css
```

Không dùng

```
style.css
```

cho toàn project.

---

# 15. Design Token

AI phải sử dụng

```
spacing

radius

color

shadow

font
```

từ Design Token.

Không hardcode.

---

# 16. Component Reuse Strategy

Trước khi tạo Component mới.

AI phải tìm.

```
Button

Input

Card

Modal

Pagination

Avatar

Badge

Tag

Table

Drawer
```

Nếu đã tồn tại.

↓

Reuse.

---

# 17. Development Workflow

```
Read Handbook

↓

Read Source

↓

Read API

↓

Read Entity

↓

Analyze Dependency

↓

Plan

↓

Implement

↓

Review

↓

Optimize
```

---

# 18. File Modification Rule

Nếu sửa Feature.

AI phải kiểm tra.

```
Route

↓

Page

↓

Hook

↓

Service

↓

API

↓

DTO

↓

Backend
```

Không sửa một file duy nhất.

---

# 19. Feature Expansion Rule

Ví dụ thêm

Saved Job.

AI phải tạo

```
SavedJobPage

SavedJobCard

useSavedJobs()

SavedJobApi()

SavedJobService()

Route

Permission

Loading

Error

Empty State
```

Không thêm code vào JobPage.

---

# 20. Error Handling Convention

```
Axios

↓

Interceptor

↓

Toast

↓

Retry

↓

Redirect Login (401)
```

Không

```
alert()
```

---

# 21. Loading Convention

Ưu tiên

```
Skeleton
```

Không dùng Spinner toàn màn hình.

---

# 22. Logging

Development

```
console.log()
```

Production

Không để lại log.

---

# 23. Security

Không lưu

Password

OTP

CCCD

Token trong Component.

Token chỉ quản lý tại Auth Layer.

---

# 24. Performance

AI phải

✔ Lazy Loading

✔ Code Splitting

✔ Memo khi cần

✔ Pagination

✔ Debounce Search

✔ Virtual List nếu dữ liệu lớn

---

# 25. Testing

Mỗi Feature cần có

□ Loading

□ Error

□ Empty

□ Success

□ Permission

□ Responsive

□ API Error

---

# 26. Forbidden Actions

AI KHÔNG được

❌ Hardcode API

❌ Hardcode Role

❌ Duplicate Component

❌ Duplicate Hook

❌ Duplicate Service

❌ Business Logic trong JSX

❌ Fetch API trong Component

❌ Đổi cấu trúc thư mục

❌ Đổi tên file khi chưa kiểm tra dependency

---

# 27. Development Checklist

Trước khi commit.

□ Component Reusable

□ API đúng

□ Hook đúng

□ Service đúng

□ Responsive

□ Loading

□ Error

□ Empty State

□ Toast

□ Validation

□ Permission

□ Clean Code

□ Không Duplicate

---

# 28. AI Final Rule

Mọi code được sinh ra phải:

- Tuân thủ Handbook.
- Tuân thủ SRS.
- Tuân thủ Design System.
- Tuân thủ API Contract.
- Tuân thủ Domain Model.
- Không phá vỡ kiến trúc hiện có.
- Ưu tiên mở rộng thay vì sửa đổi.
- Luôn tái sử dụng trước khi tạo mới.

Nếu AI không chắc chắn về một dependency hoặc business rule, phải dừng và phân tích source trước khi sinh code.

---

# END OF PART 10