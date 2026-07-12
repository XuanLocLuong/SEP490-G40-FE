# JOBLINK AI DEVELOPER HANDBOOK

# PART 3

# BACKEND ARCHITECTURE

Version 1.0

---

# 1. Backend Overview

Backend của JobLink được xây dựng bằng Spring Boot theo kiến trúc nhiều tầng (Layered Architecture).

Frontend KHÔNG giao tiếp trực tiếp với Database.

Toàn bộ dữ liệu đi theo luồng:

React

↓

REST API

↓

Controller

↓

Service

↓

Repository

↓

MySQL

Đây là kiến trúc chuẩn của Spring Boot và AI phải tuyệt đối tuân theo.

---

# 2. High Level Architecture

```
React Frontend
        │
        ▼
 REST Controller
        │
        ▼
    Service Layer
        │
        ▼
 Repository Layer
        │
        ▼
      MySQL
```

Service là nơi xử lý toàn bộ business logic.

Controller chỉ nhận request.

Repository chỉ truy vấn database.

---

# 3. Package Structure

Backend được chia thành các package chính.

```
controller/

service/

repository/

entity/

dto/

mapper/

security/

config/

exception/

util/

constant/

```

Không được đặt tất cả class chung một package.

---

# 4. Controller Layer

Controller là điểm đầu tiên nhận request từ Frontend.

Ví dụ

```
POST /auth/login

GET /candidate/profile

PUT /candidate/profile

GET /jobs

POST /jobs

DELETE /jobs/{id}
```

Controller KHÔNG được

❌ validate business

❌ tính Trust Score

❌ tính Recommendation

❌ gọi Database trực tiếp

Controller chỉ

Receive Request

↓

Validate DTO

↓

Call Service

↓

Return Response

---

# 5. Service Layer

Đây là nơi quan trọng nhất.

Service xử lý

Authentication

Authorization

Business Rules

Recommendation

Matching

Verification

Notification

Logging

Audit

Trust Score

AI muốn sửa nghiệp vụ

↓

luôn sửa tại Service.

Không sửa Controller.

---

# 6. Repository Layer

Repository chỉ làm việc với Database.

Ví dụ

```
findById()

findAll()

save()

delete()

exists()

findByEmail()

findByStatus()

findByRole()
```

Không viết business trong Repository.

---

# 7. Entity Layer

Entity phản ánh Database.

Ví dụ

User

↓

CandidateProfile

↓

Application

↓

Job

↓

Business

↓

Review

↓

Notification

Entity KHÔNG được chứa business logic.

---

# 8. DTO

DTO dùng để trao đổi dữ liệu.

Ví dụ

LoginRequest

RegisterRequest

UpdateProfileRequest

CreateJobRequest

ApplyJobRequest

...

Frontend luôn làm việc với DTO.

Không trả Entity trực tiếp.

---

# 9. Mapper

Mapper chuyển đổi

Entity

↓

DTO

DTO

↓

Entity

AI không nên copy field bằng tay.

---

# 10. Authentication

Project sử dụng

JWT Authentication

Flow

Login

↓

JWT

↓

Frontend lưu Access Token

↓

Authorization Header

↓

Backend Verify

↓

Return User

Không lưu Password ở Frontend.

---

# 11. Authorization

Role được kiểm tra tại Backend.

Ví dụ

Candidate

↓

Apply Job

Recruiter

↓

Create Job

Admin

↓

Manage User

Manual Verify

↓

Approve Verification

Role không được kiểm tra ở React để đảm bảo bảo mật.

Frontend chỉ dùng để ẩn/hiện UI.

---

# 12. User Module

Đây là module trung tâm.

User

↓

Role

↓

Permission

↓

Profile

↓

Verification

↓

Trust Score

Mọi module đều liên kết với User.

---

# 13. Candidate Module

Quản lý

Candidate Profile

Skill

Availability

Work History

Saved Job

Applied Job

Recommendation

Review

Trust Score

---

# 14. Recruiter Module

Quản lý

Business

Recruiter Profile

Jobs

Applicants

Interview

Invitation

Review

Analytics

---

# 15. Business Module

Business gồm

Thông tin doanh nghiệp

Địa chỉ

Logo

Verification

Business Document

Owner

Business Status

---

# 16. Job Module

Job gồm

Title

Description

Salary

Shift

Location

Skill

Business

Status

Recommendation

Analytics

Một Job có nhiều Shift.

Một Recruiter có nhiều Job.

---

# 17. Application Module

Flow

Candidate

↓

Apply

↓

Pending

↓

Reviewed

↓

Interview

↓

Accepted

↓

Rejected

Application liên kết

Candidate

Job

Recruiter

Review

---

# 18. Verification Module

Đây là module đặc biệt.

Có

CCCD

FaceID

Business Document

Manual Review

Verification Status

Verification History

Manual Team chỉ làm việc với module này.

---

# 19. Recommendation Module

Backend chịu trách nhiệm Recommendation.

Không để Frontend tính.

Input

Skill

Location

Availability

Trust Score

History

Output

Recommended Jobs

Recommended Candidates

---

# 20. Trust Score Module

Trust Score luôn được Backend tính.

Không gửi điểm từ Frontend.

Event

↓

Rule

↓

Trust Event

↓

Current Score

Frontend chỉ hiển thị.

---

# 21. Notification Module

Notification có thể sinh từ

Apply

Review

Verification

Message

Invitation

System

Admin

Frontend chỉ subscribe và hiển thị.

---

# 22. Chat Module

Flow

Candidate

↓

Conversation

↓

Message

↓

Notification

↓

Read Status

Chat không phụ thuộc Job.

Một Conversation có nhiều Message.

---

# 23. Audit Log

Mọi hành động quan trọng đều ghi log.

Login

Logout

Create Job

Delete Job

Approve Verification

Reject Verification

Ban User

Đây là module chỉ dành cho Admin.

---

# 24. AI Coding Rules (Backend)

AI phải tuân thủ

Không query Database trong Controller.

Không viết SQL trong Controller.

Không gọi Repository từ Controller.

Không trả Entity trực tiếp.

Không bỏ qua DTO.

Không bỏ qua Mapper.

Không hardcode Role.

Không hardcode Permission.

Không viết business trong Repository.

Không viết business trong Entity.

---

# 25. API Flow

Frontend

↓

Axios

↓

Controller

↓

DTO

↓

Service

↓

Repository

↓

Database

↓

Entity

↓

Mapper

↓

DTO

↓

JSON Response

↓

Frontend

Đây là flow chuẩn mà mọi API trong JobLink phải tuân theo.

---

# 26. Dependency Rule

Controller

↓

Service

↓

Repository

↓

Database

Không được gọi ngược.

Repository không gọi Service.

Entity không gọi Controller.

DTO không gọi Repository.

---

# 27. Backend Principles

✔ Single Responsibility

✔ SOLID

✔ RESTful

✔ JWT

✔ DTO

✔ Mapper

✔ Layered Architecture

✔ Exception Handling

✔ Validation

✔ Logging

✔ Audit

✔ Security

---

# 28. AI MUST FOLLOW

Khi AI tạo API mới.

Bắt buộc tạo đầy đủ

DTO

↓

Controller

↓

Service

↓

Repository

↓

Entity (nếu cần)

↓

Mapper

↓

Validation

↓

Exception

↓

Response

Không được bỏ qua bất kỳ tầng nào.

---

END OF PART 3