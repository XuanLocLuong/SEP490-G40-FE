# JOBLINK AI DEVELOPER HANDBOOK

# PART 9

# API CONTRACT & FRONTEND ↔ BACKEND MAPPING

Version 1.0

---

# 1. Purpose

Đây là tài liệu quy định toàn bộ chuẩn giao tiếp giữa Frontend và Backend.

AI KHÔNG được tự ý tạo endpoint.

AI KHÔNG được tự ý đổi Response.

AI KHÔNG được tự ý đổi DTO.

Mọi API phải tuân theo chuẩn dưới đây.

---

# 2. API Convention

RESTful API

Method

GET

POST

PUT

PATCH

DELETE

Version

/api/v1/

Ví dụ

/api/v1/auth/login

/api/v1/jobs

/api/v1/jobs/{id}

---

# 3. Response Standard

Mọi Response đều phải theo một format.

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "timestamp": "2026-07-10T10:00:00Z"
}
```

Nếu phân trang

```json
{
  "success": true,
  "message": "Success",
  "data": [],
  "pagination": {
      "page": 1,
      "size": 10,
      "totalPages": 5,
      "totalElements": 48
  }
}
```

---

# 4. Error Response

```json
{
   "success": false,
   "message": "Email already exists",
   "errorCode": "AUTH_001",
   "timestamp": ""
}
```

Frontend không parse Exception Message.

Frontend chỉ đọc

errorCode

message

---

# 5. Authentication API

POST

/auth/login

Request

```json
{
    "email":"",
    "password":""
}
```

Response

Access Token

Refresh Token

User

Role

Permission

Frontend

↓

AuthContext

↓

Local Storage

↓

Protected Route

---

# 6. Register

POST

/auth/register

Request

Name

Email

Password

Confirm Password

Phone

Response

User

OTP Status

---

# 7. Refresh Token

POST

/auth/refresh

Response

Access Token

Refresh Token

Frontend tự động refresh qua Axios Interceptor.

---

# 8. Logout

POST

/auth/logout

Frontend

↓

Clear Context

↓

Clear Local Storage

↓

Navigate Login

---

# 9. Candidate Profile API

GET

/candidate/profile

PUT

/candidate/profile

Response

Candidate DTO

Frontend

↓

Profile Page

↓

Profile Form

---

# 10. Work History API

GET

/work-history

POST

/work-history

PUT

/work-history/{id}

DELETE

/work-history/{id}

Hook

useWorkHistory()

---

# 11. Skill API

GET

/skills

Response

List Skill

Frontend cache.

Không gọi nhiều lần.

---

# 12. Availability API

GET

/availability

PUT

/availability

Frontend

↓

Schedule Component

↓

Calendar

---

# 13. Business API

GET

/business

POST

/business

PUT

/business

DELETE

/business

---

# 14. Job API

GET

/jobs

GET

/jobs/{id}

POST

/jobs

PUT

/jobs/{id}

DELETE

/jobs/{id}

Frontend

↓

JobService

↓

useJobs()

↓

JobList

---

# 15. Job Search API

GET

/jobs

Query

page

size

keyword

salary

location

category

type

status

sort

Ví dụ

/jobs?page=1&size=10&keyword=react

---

# 16. Recommendation API

GET

/recommendations/jobs

GET

/recommendations/candidates

Response

Matching Score

Reason

Skill Match

Distance Match

Availability Match

---

# 17. Application API

POST

/applications

GET

/applications

PUT

/applications/status

DELETE

/applications/{id}

---

# 18. Review API

POST

/reviews

GET

/reviews

Không cho Update Review.

---

# 19. Verification API

POST

/verification

GET

/verification

PUT

/verification/approve

PUT

/verification/reject

---

# 20. Notification API

GET

/notifications

PUT

/notifications/read

DELETE

/notifications

---

# 21. Chat API

GET

/conversations

GET

/messages

POST

/messages

PUT

/messages/read

---

# 22. Analytics API

GET

/analytics/dashboard

GET

/analytics/job

GET

/analytics/recruiter

---

# 23. Pagination Standard

Request

?page=1&size=10

Response

page

size

totalPages

totalElements

hasNext

hasPrevious

AI không tự tạo format khác.

---

# 24. Filter Standard

keyword

status

category

salary

city

district

verified

createdDate

updatedDate

---

# 25. Sort Standard

sort=name

sort=createdDate

sort=salary

sort=trustScore

order=asc

order=desc

---

# 26. Upload API

Multipart Form Data

Ví dụ

Avatar

CV

Business Document

CCCD

Không convert Base64 nếu không cần.

---

# 27. HTTP Status

200

Success

201

Created

204

No Content

400

Bad Request

401

Unauthorized

403

Forbidden

404

Not Found

409

Conflict

422

Validation Error

500

Server Error

---

# 28. Validation Rule

Frontend

↓

Validate

↓

Backend

↓

Validate

↓

Database

Không bỏ qua Validation ở Backend.

---

# 29. DTO Standard

Request DTO

↓

Validation

↓

Controller

↓

Service

↓

Entity

↓

Mapper

↓

Response DTO

Không trả Entity trực tiếp.

---

# 30. Frontend API Layer

apis/

↓

AxiosClient

↓

JobApi

↓

JobService

↓

useJobs

↓

Job Page

↓

Job Components

Không gọi Axios trực tiếp trong Component.

---

# 31. React Hook Flow

Component

↓

Hook

↓

Service

↓

API

↓

Backend

↓

Response

↓

Hook

↓

Component

---

# 32. Error Handling

Axios

↓

Interceptor

↓

Toast

↓

Retry

↓

Logout nếu 401

Không try/catch lặp lại ở mọi Component.

---

# 33. Loading Rule

Component

↓

Skeleton

↓

API Success

↓

Render

Không Loading Spinner toàn màn hình.

---

# 34. Permission Mapping

Guest

Login

Register

Browse Job

Candidate

Apply

Save Job

Review

Recruiter

Create Job

Manage Job

Interview

Admin

Everything

---

# 35. Endpoint Naming

Đúng

/jobs

/jobs/{id}

/applications

Sai

/getAllJob

/createJob

/deleteJob

---

# 36. AI Mapping

Ví dụ

Job Detail

↓

GET /jobs/{id}

↓

JobResponseDTO

↓

JobApi

↓

useJob()

↓

JobDetailPage

↓

JobHeader

↓

ApplyButton

↓

RecommendationCard

AI luôn phải Mapping như vậy.

---

# 37. API Checklist

□ Endpoint tồn tại

□ DTO tồn tại

□ Validation tồn tại

□ Permission đúng

□ Response Wrapper đúng

□ Pagination đúng

□ Filter đúng

□ Sort đúng

□ Error Code đúng

□ Toast đúng

---

# 38. Error Code Convention

AUTH_001

AUTH_002

USER_001

USER_002

JOB_001

JOB_002

VERIFY_001

VERIFY_002

BUSINESS_001

APPLICATION_001

REVIEW_001

Không dùng message để xử lý logic.

---

# 39. Response Wrapper

```java
ApiResponse<T>
```

Bao gồm

success

message

data

timestamp

pagination (optional)

errors (optional)

---

# 40. AI MUST FOLLOW

AI sinh Feature mới.

Bắt buộc Mapping

Screen

↓

Route

↓

Component

↓

Hook

↓

Service

↓

API

↓

Controller

↓

Service

↓

Repository

↓

Entity

↓

DTO

↓

Response

Không được bỏ qua bất kỳ tầng nào.

---

# END OF PART 9