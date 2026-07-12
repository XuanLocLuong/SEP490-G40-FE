# JOBLINK AI DEVELOPER HANDBOOK

# PART 6

# FRONTEND ↔ BACKEND INTEGRATION ARCHITECTURE

Version 1.0

---

# 1. Purpose

Chương này mô tả cách Frontend và Backend của JobLink giao tiếp với nhau.

Mục tiêu là giúp AI hiểu:

- Luồng dữ liệu.
- API Layer.
- DTO.
- State Management.
- Request Lifecycle.
- Authentication Flow.
- Error Handling.
- Cache Strategy.

AI phải hiểu chương này trước khi viết bất kỳ API nào.

---

# 2. Overall Architecture

```
React UI

↓

Page

↓

Component

↓

Hook

↓

Service

↓

API Layer

↓

Axios Client

↓

REST API

↓

Spring Boot

↓

Service

↓

Repository

↓

Database
```

Frontend không giao tiếp trực tiếp với Database.

---

# 3. Request Flow

Ví dụ khi xem danh sách Job.

```
User Click

↓

JobPage

↓

useJobs()

↓

JobService

↓

JobApi

↓

AxiosClient

↓

GET /jobs

↓

Spring Controller

↓

Service

↓

Repository

↓

MySQL

↓

Response DTO

↓

Axios

↓

Hook

↓

Component

↓

Render
```

---

# 4. Layer Responsibility

## UI Layer

Chỉ hiển thị dữ liệu.

Không chứa Business Logic.

Không gọi API trực tiếp.

---

## Hook Layer

Quản lý

Loading

Error

State

Pagination

Search

Filter

Lifecycle

---

## Service Layer

Chứa Business Logic phía Frontend.

Ví dụ

- Chuẩn hóa dữ liệu.
- Kết hợp nhiều API.
- Mapping dữ liệu.
- Xử lý retry.

---

## API Layer

Chỉ gọi HTTP.

Ví dụ

```javascript
JobApi.getJobs()

JobApi.createJob()

JobApi.updateJob()
```

Không xử lý UI.

---

## Axios Client

Chịu trách nhiệm

- Base URL
- JWT
- Refresh Token
- Interceptor
- Timeout
- Retry
- Error Mapping

---

# 5. Folder Mapping

```
src

↓

pages

↓

hooks

↓

services

↓

apis

↓

utils
```

Backend

```
controller

↓

service

↓

repository

↓

entity
```

---

# 6. API Calling Convention

Không được

```
axios.get(...)
```

trong Component.

Đúng

```
Component

↓

Hook

↓

Service

↓

Api

↓

Axios
```

---

# 7. Authentication Flow

```
Login

↓

POST /auth/login

↓

Access Token

↓

Refresh Token

↓

Save Auth

↓

AuthContext

↓

Protected Route

↓

Dashboard
```

---

# 8. Refresh Token Flow

```
Access Token hết hạn

↓

Axios Interceptor

↓

POST /auth/refresh

↓

Access Token mới

↓

Retry Request

↓

Render UI
```

Nếu Refresh thất bại

↓

Logout.

---

# 9. Authorization Flow

```
Login

↓

Role

↓

Permission

↓

Protected Route

↓

Page

↓

Action
```

Ví dụ

Recruiter

↓

Create Job

Candidate

↓

Apply Job

---

# 10. Protected Route

AI phải kiểm tra

Authentication

↓

Role

↓

Permission

↓

Render

Không kiểm tra trong từng Component.

---

# 11. Request Lifecycle

```
Button Click

↓

Loading=true

↓

Call API

↓

Success

↓

Update State

↓

Render

↓

Loading=false
```

Nếu lỗi

↓

Toast

↓

Loading=false

---

# 12. Response Lifecycle

```
Backend DTO

↓

Axios

↓

Service

↓

Hook

↓

Component

↓

Screen
```

Frontend chỉ làm việc với DTO.

Không làm việc với Entity.

---

# 13. DTO Mapping

```
Entity

↓

Mapper

↓

ResponseDTO

↓

JSON

↓

Axios

↓

Hook

↓

Component
```

Không trả Entity trực tiếp.

---

# 14. Form Submission Flow

```
React Hook Form

↓

Validation

↓

Submit

↓

Service

↓

API

↓

Backend

↓

Validation

↓

Response

↓

Toast

↓

Navigate
```

---

# 15. Error Handling Flow

```
API Error

↓

Axios Interceptor

↓

Map Error

↓

Toast

↓

Hook

↓

Component
```

Không try/catch ở mọi Component.

---

# 16. Loading Strategy

Ưu tiên

Skeleton

↓

Success

↓

Render

Không Spinner toàn màn hình.

---

# 17. Pagination Flow

```
Page

↓

Pagination Component

↓

Hook

↓

API

↓

Backend

↓

Response

↓

Update UI
```

---

# 18. Search Flow

```
Search Input

↓

Debounce

↓

Hook

↓

API

↓

Response

↓

Render
```

Không gọi API mỗi lần gõ.

---

# 19. Filter Flow

```
Filter

↓

State

↓

API Query

↓

Backend Filter

↓

Result
```

Frontend không tự filter toàn bộ dữ liệu nếu Backend hỗ trợ.

---

# 20. File Upload Flow

```
Select File

↓

Preview

↓

Validation

↓

Multipart FormData

↓

Upload API

↓

Response

↓

Render
```

Không dùng Base64 nếu không cần.

---

# 21. Cache Strategy

Cache

```
Skills

Job Categories

Cities

Districts

Provinces

Employment Types
```

Không cache

```
Application

Notification

Chat

Verification

Trust Score
```

---

# 22. State Synchronization

Một Request thành công.

↓

Cập nhật

Local State

↓

Context (nếu cần)

↓

UI

Không reload toàn bộ trang.

---

# 23. Data Fetching Strategy

Page mở.

↓

Hook chạy.

↓

Loading.

↓

API.

↓

Success.

↓

Cache.

↓

Render.

---

# 24. Optimistic Update

Áp dụng cho

Save Job

Like

Bookmark

Read Notification

Không áp dụng cho

Verification

Payment

Trust Score

---

# 25. Retry Strategy

Retry tự động

Network Error

Timeout

Không Retry

401

403

404

Validation Error

---

# 26. API Timeout

Mỗi request nên có timeout.

Ví dụ

10–30 giây.

Timeout phải hiển thị thông báo thân thiện.

---

# 27. Notification Flow

```
Backend Event

↓

Notification API/WebSocket

↓

Context

↓

Bell Icon

↓

Notification Drawer
```

---

# 28. Chat Flow

```
Conversation

↓

Messages

↓

Realtime Update

↓

Render

↓

Read Status
```

Frontend ưu tiên WebSocket nếu Backend hỗ trợ.

---

# 29. Integration Checklist

□ API tồn tại

□ DTO đúng

□ Validation đúng

□ Loading

□ Error

□ Empty State

□ Pagination

□ Permission

□ Authentication

□ Responsive

---

# 30. AI Integration Rules

Trước khi tích hợp một Feature.

AI phải xác định:

- API nào sẽ dùng?
- DTO nào sẽ nhận?
- Hook nào sẽ gọi?
- Service nào sẽ xử lý?
- Component nào sẽ render?
- Có cache không?
- Có loading không?
- Có error state không?
- Có permission không?

Nếu chưa xác định được đầy đủ các mục trên, AI không được bắt đầu code.

---

# END OF PART 6