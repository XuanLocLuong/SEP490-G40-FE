# JOBLINK AI DEVELOPER HANDBOOK

# PART 2

Frontend Architecture

---

# 1. Technology Stack

Project được xây dựng bằng:

- React
- Vite
- React Router
- Axios
- Context API
- CSS thuần (không dùng Tailwind)
- Component-based Architecture

Hiện tại project chưa đi theo Material UI hay Ant Design mà xây dựng Design System riêng.

---

# 2. Frontend Directory

src
│
├── apis
├── assets
├── components
├── contexts
├── layouts
├── pages
├── routes
├── utils
├── App.jsx
└── main.jsx

Project chia theo Feature thay vì để tất cả Component chung một nơi.

---

# 3. Entry Point

main.jsx

Có nhiệm vụ

- render React
- mount App
- import global css
- khởi tạo Context Provider

AI KHÔNG được đặt business logic trong main.jsx.

main.jsx chỉ nên bootstrap project.

---

# 4. App.jsx

App.jsx đóng vai trò

Application Root.

Nó chỉ nên

- render Router

- render Global Provider

- render Layout Root

Không chứa API.

Không fetch data.

Không xử lý Business Logic.

---

# 5. APIs Layer

src/apis

Hiện tại đã có

AuthApi.jsx

AxiosClient.jsx

Đây là dấu hiệu project đang tách API riêng.

Đây là convention đúng.

AI phải tiếp tục theo convention này.

Ví dụ

apis

UserApi.jsx

BusinessApi.jsx

CandidateApi.jsx

RecruiterApi.jsx

JobApi.jsx

ApplicationApi.jsx

ReviewApi.jsx

NotificationApi.jsx

VerificationApi.jsx

RecommendationApi.jsx

không gọi axios trực tiếp trong Component.

---

# 6. AxiosClient

AxiosClient là lớp trung gian.

Nó chịu trách nhiệm

BaseURL

Authorization

Interceptor

Refresh Token

Error Handler

Logging

Retry

Component tuyệt đối không xử lý các việc này.

---

# 7. Context

src/contexts

Hiện có

AuthContext

Đây là Global Authentication State.

Chỉ lưu

Current User

Role

Access Token

Login

Logout

Refresh Session

Không lưu dữ liệu Job.

Không lưu danh sách Candidate.

Không lưu dữ liệu Business.

Những dữ liệu đó sau này nên dùng React Query hoặc Redux nếu project mở rộng.

---

# 8. Assets

assets

Hiện tại gồm

styles

Đã có

tokens.css

Đây là dấu hiệu project đang xây dựng Design Token.

AI phải tái sử dụng token.

Không hardcode màu.

Ví dụ

Primary

Secondary

Success

Danger

Radius

Spacing

Shadow

Font Size

---

# 9. CSS Convention

Có các file

HeaderStyle

SidebarStyle

FooterStyle

AppLayoutStyle

AuthCardStyle

...

=> Component nào thì CSS tương ứng.

Không tạo file

style.css

dùng chung cho mọi component.

---

# 10. Components

components

Hiện chia thành

common

Đây là nơi chứa reusable component.

Ví dụ

Header

Sidebar

Footer

Topbar

Layout

ProfileMenu

AuthCard

Icons

Đây là convention rất tốt.

AI phải tiếp tục.

Nếu component dùng được nhiều nơi

↓

common

Nếu chỉ dùng Candidate

↓

candidate/components

Nếu chỉ dùng Recruiter

↓

recruiter/components

---

# 11. Common Components

Đã phát hiện

AppLayout

AuthCard

Header

Footer

Sidebar

InternalSidebar

InternalTopbar

ProfileMenu

Icons

Ý nghĩa

Header

Navigation trên cùng.

Sidebar

Menu ngoài.

InternalSidebar

Menu khi login.

ProfileMenu

Avatar dropdown.

AuthCard

Card Login/Register.

AppLayout

Khung chung của website.

---

# 12. Layouts

layouts

Đã có

GuestLayout

CandidateLayout

RecruiterLayout

InternalLayout

Đây là kiến trúc rất đúng.

Role nào dùng Layout riêng.

Không dùng if(role).

Ví dụ

Guest

↓

GuestLayout

Candidate

↓

CandidateLayout

Recruiter

↓

RecruiterLayout

Admin

↓

AdminLayout (nên bổ sung)

Moderator

↓

ModeratorLayout (nên bổ sung)

Manual Verify

↓

VerificationLayout (nên bổ sung)

---

# 13. Layout Responsibility

Layout chỉ chịu trách nhiệm

Header

Sidebar

Footer

Container

Outlet

Responsive

Không fetch API.

Không Login.

Không Business Logic.

---

# 14. Routing Convention

Mặc dù chưa đọc Router đầy đủ.

Project nên theo

/

/login

/register

/jobs

/job/:id

/candidate

/candidate/profile

/candidate/application

/recruiter

/recruiter/jobs

/recruiter/business

/admin

...

Role được kiểm tra tại Router.

Không kiểm tra trong từng Page.

---

# 15. Component Rules

Một Component chỉ có một nhiệm vụ.

Ví dụ

JobCard

↓

Hiển thị Job

Không fetch Job.

Không Apply.

Không gọi API.

Button Apply

↓

emit event.

Page sẽ xử lý.

---

# 16. Folder Recommendation

Sau khi project lớn hơn.

Nên mở rộng

components

candidate

recruiter

admin

moderator

verification

shared

hooks

services

apis

contexts

utils

constants

assets

pages

layouts

routes

types

---

# 17. AI Coding Rules

AI phải tuân thủ

Không gọi axios trong JSX.

Không viết CSS inline.

Không hardcode màu.

Không hardcode URL.

Không duplicate component.

Không duplicate Modal.

Không duplicate Button.

Không duplicate Input.

Không duplicate Card.

Không duplicate Layout.

---

# 18. Current Architecture Assessment

Ưu điểm

✔ API tách riêng.

✔ Layout tách riêng.

✔ Context riêng.

✔ CSS riêng.

✔ Component reusable.

✔ Folder rõ ràng.

Điểm nên cải thiện

• Bổ sung constants/

• Bổ sung hooks/

• Bổ sung services/

• Bổ sung feature-based folders khi project mở rộng.

---

# 19. Development Workflow

AI muốn tạo feature mới.

Bắt buộc

Page

↓

Component

↓

API

↓

Context (nếu cần)

↓

Style

↓

Route

↓

Permission

↓

Testing

Không được làm ngược.

---

# End of Part 2