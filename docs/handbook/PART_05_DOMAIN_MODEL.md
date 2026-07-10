# JOBLINK AI DEVELOPER HANDBOOK

# PART 5

# DOMAIN MODEL & ENTITY ARCHITECTURE

Version 1.0

---

# 1. Mục đích

Đây là chương quan trọng nhất của Handbook.

Mục tiêu của chương này là giúp AI hiểu **Domain Model** của JobLink thay vì chỉ biết từng bảng Database.

Sau khi đọc xong chương này AI phải hiểu:

- Entity nào là trung tâm.
- Entity nào phụ thuộc.
- Luồng dữ liệu.
- Quan hệ giữa các module.
- CRUD của từng Entity.
- Entity nào Frontend cần cache.
- Entity nào chỉ đọc.
- Entity nào sinh ra từ Event.

---

# 2. Domain Overview

```
                    User
                      │
      ┌───────────────┴───────────────┐
      │                               │
Candidate                     Recruiter
      │                               │
CandidateProfile             Business
      │                               │
      ├────────────┐                  │
      │            │                  │
 WorkHistory   Availability           │
      │            │                  │
      └────────────┘                  │
             │                        │
             └──── Recommendation ────┘
                      │
                     Job
                      │
                Application
                      │
          ┌───────────┴────────────┐
          │                        │
      Review                Notification
```

---

# 3. Aggregate Root

AI phải coi các Entity sau là Aggregate Root.

User

CandidateProfile

Business

Job

Application

Conversation

Notification

VerificationRequest

TrustEvent

Các Entity khác chỉ là Child Entity.

---

# 4. User

Đây là Entity quan trọng nhất.

```
User

id

email

password

role

status

avatar

createdAt

updatedAt
```

Quan hệ

```
User

↓

CandidateProfile

User

↓

Business

User

↓

Notification

User

↓

Conversation

User

↓

Verification

User

↓

TrustEvent
```

Một User chỉ có một Role chính.

---

# 5. CandidateProfile

```
CandidateProfile

id

summary

education

major

expectedSalary

preferredLocation

workingRadius

completion

status
```

Relationship

```
CandidateProfile

↓

Skills

↓

Availability

↓

WorkHistory

↓

Application

↓

Review
```

Candidate Profile là trung tâm của AI Matching.

---

# 6. Business

Business không phải Recruiter.

Một Recruiter có thể quản lý nhiều Business trong tương lai.

```
Business

id

name

logo

taxCode

address

verification

status
```

Business sở hữu nhiều Job.

---

# 7. Job

```
Job

id

title

description

salary

location

status

deadline
```

Relationship

```
Business

↓

Job

↓

JobShift

↓

JobSkill

↓

Application
```

Job là Aggregate Root.

---

# 8. Application

Application là cầu nối.

```
Candidate

↓

Application

↓

Job
```

Không liên kết Candidate trực tiếp với Job.

Application chứa

```
Status

ApplyDate

InterviewDate

Decision

ReviewState
```

---

# 9. Skill

Skill là Master Data.

Không hardcode.

```
Skill

id

name

category
```

Many To Many

```
Candidate

↓

CandidateSkill

↓

Skill

Job

↓

JobRequiredSkill

↓

Skill
```

---

# 10. WorkHistory

Một Candidate có nhiều WorkHistory.

```
Company

Position

Description

EmploymentType

StartDate

EndDate
```

WorkHistory không được lưu trong CandidateProfile.

---

# 11. Availability

Availability quyết định AI Matching.

```
Day

Start

End

Repeat

Status
```

Một Candidate có nhiều Availability.

---

# 12. Review

Review luôn thuộc về

Application.

Không Review trực tiếp.

```
Application

↓

Review
```

Review gồm

Rating

Comment

CreatedDate

---

# 13. VerificationRequest

Verification độc lập.

```
Verification

Status

Reviewer

Reason

Type

CreatedDate
```

Có thể là

Candidate

Recruiter

Business

---

# 14. TrustEvent

Không sửa trực tiếp TrustScore.

Mỗi thay đổi đều sinh TrustEvent.

```
TrustEvent

↓

+5

↓

Verified

TrustEvent

↓

-10

↓

Spam

TrustEvent

↓

+2

↓

Good Review
```

Current Trust Score

=

SUM(TrustEvent)

---

# 15. Notification

Notification là Event.

Không tạo bằng tay.

Nguồn

Application

Interview

Review

Verification

System

Admin

Message

---

# 16. Conversation

```
Conversation

↓

Message

↓

Attachment

↓

ReadStatus
```

Không gắn Message trực tiếp User.

---

# 17. AuditLog

Audit Log ghi

Login

Logout

Delete

Approve

Reject

Ban

Update

Không sửa.

Chỉ thêm.

---

# 18. Report

Report

↓

Job

↓

Business

↓

Candidate

↓

System

Không xóa Report.

Chỉ đổi Status.

---

# 19. Entity Life Cycle

Job

```
Draft

↓

Pending

↓

Published

↓

Closed

↓

Archived
```

Application

```
Applied

↓

Reviewed

↓

Interview

↓

Accepted

↓

Completed
```

Verification

```
Pending

↓

Review

↓

Approved

↓

Rejected
```

Business

```
Pending

↓

Verified

↓

Active

↓

Suspended
```

---

# 20. Cache Strategy

Frontend nên cache

Skill

Province

District

JobCategory

JobType

BusinessType

Không cache

Application

Notification

Message

TrustScore

Verification

---

# 21. CRUD Matrix

| Entity | Create | Read | Update | Delete |
|---------|--------|------|---------|--------|
| User | ✔ | ✔ | ✔ | Admin |
| CandidateProfile | ✔ | ✔ | ✔ | ✖ |
| Business | ✔ | ✔ | ✔ | Admin |
| Job | ✔ | ✔ | ✔ | Soft Delete |
| Application | ✔ | ✔ | Status | ✖ |
| Review | ✔ | ✔ | ✖ | ✖ |
| Notification | System | ✔ | Read | ✖ |
| Verification | ✔ | ✔ | Reviewer | ✖ |
| TrustEvent | System | ✔ | ✖ | ✖ |

---

# 22. Entity Dependency

```
User
│
├── CandidateProfile
│     ├── WorkHistory
│     ├── Skill
│     ├── Availability
│     └── Application
│
├── Recruiter
│     └── Business
│            └── Job
│                  ├── Shift
│                  ├── RequiredSkill
│                  └── Application
│
├── Verification
├── Notification
├── TrustEvent
├── Conversation
└── AuditLog
```

---

# 23. AI Entity Rules

AI không được

❌ thêm field vào Entity khi chưa kiểm tra SRS

❌ merge nhiều Entity thành một

❌ lưu List JSON thay vì tạo bảng

❌ bỏ bảng trung gian Many-to-Many

❌ sửa Lifecycle

---

# 24. Frontend Mapping

Candidate Profile

↓

CandidateProfile Entity

↓

Profile API

↓

Profile Page

↓

Profile Components

↓

Profile Form

Job Detail

↓

Job Entity

↓

Job API

↓

Job Detail Page

↓

Apply Component

Application

↓

Application Entity

↓

Application API

↓

Application Page

↓

Timeline Component

---

# 25. Backend Mapping

Controller

↓

DTO

↓

Service

↓

Entity

↓

Repository

↓

Database

Frontend tuyệt đối không làm việc trực tiếp với Entity.

---

# 26. AI MUST KNOW

JobLink không phải CRUD Project.

Đây là Domain Driven Project.

Mỗi Entity đều có

Business Meaning

Lifecycle

Permission

Relationship

Validation

AI phải hiểu Domain trước khi viết code.

---

END OF PART 5