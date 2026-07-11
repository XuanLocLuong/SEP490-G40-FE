# JOBLINK AI DEVELOPER HANDBOOK

# PART 8

# FEATURE DEVELOPMENT HANDBOOK

Version 1.0

---

# 1. Purpose

Đây là chương quan trọng nhất của toàn bộ Handbook.

Nếu Part 5 giúp AI hiểu Domain.

Nếu Part 6 giúp AI hiểu API.

Nếu Part 7 giúp AI hiểu UI.

Thì Part 8 sẽ giúp AI biết chính xác:

Feature này phải code những gì.

Feature này gồm bao nhiêu Page.

Feature này dùng API nào.

Feature này dùng Component nào.

Feature này dùng Hook nào.

Feature này dùng Entity nào.

Feature này dùng Permission nào.

Feature này có Workflow gì.

Đây là checklist bắt buộc trước khi AI sinh code.

---

# 2. Authentication Module

Business Goal

Cho phép người dùng truy cập hệ thống.

Pages

Landing

Login

Register

Forgot Password

Reset Password

Verify Email

Google Login

Components

AuthCard

LoginForm

RegisterForm

PasswordInput

GoogleButton

OTPInput

Hooks

useLogin()

useRegister()

useForgotPassword()

useGoogleLogin()

APIs

POST /auth/login

POST /auth/register

POST /auth/google

POST /auth/forgot-password

POST /auth/reset-password

States

Loading

Success

Invalid Password

Email Not Found

Account Suspended

Account Banned

Permission

Guest

---

# 3. Candidate Dashboard

Pages

Dashboard

Components

SummaryCard

RecommendationCard

LatestApplication

NotificationPanel

QuickAction

Statistics

APIs

GET /candidate/dashboard

GET /recommendations/jobs

GET /notifications

GET /applications/recent

---

# 4. Candidate Profile

Pages

Profile

Edit Profile

Components

ProfileHeader

ProfileForm

SkillSelector

AvatarUploader

SummaryEditor

ExpectedSalary

PreferredLocation

PreferredJob

WorkingRadius

CompletionProgress

Hooks

useCandidateProfile()

useUpdateProfile()

APIs

GET /candidate/profile

PUT /candidate/profile

Business Rules

Không được Apply Job nếu Profile chưa hoàn thiện.

---

# 5. Work History

Pages

Work History

Components

HistoryCard

HistoryForm

HistoryTimeline

APIs

GET /work-history

POST /work-history

PUT /work-history

DELETE /work-history

---

# 6. Availability

Pages

Availability

Components

Calendar

WeekSchedule

ShiftPicker

TimePicker

APIs

GET /availability

PUT /availability

Business Rule

Availability là dữ liệu đầu vào của AI Recommendation.

---

# 7. Verification

Pages

Candidate Verification

Recruiter Verification

Verification Status

Components

UploadCCCD

UploadFace

ProgressTimeline

VerificationResult

Hooks

useVerification()

APIs

POST /verification

GET /verification/status

Business Rule

Candidate phải Verify trước khi Apply.

Recruiter phải Verify trước khi Create Job.

---

# 8. Recruiter Dashboard

Components

Recruitment Summary

Recent Jobs

Applicants

Analytics

Quick Actions

APIs

GET /recruiter/dashboard

GET /analytics

---

# 9. Business Module

Pages

Business Profile

Edit Business

Business Verification

Components

BusinessForm

BusinessLogo

BusinessDocumentUploader

BusinessAddress

BusinessInformation

APIs

GET /business

PUT /business

POST /business/document

---

# 10. Job Module

Pages

Job List

Create Job

Edit Job

Job Detail

Job Analytics

Components

JobForm

SalaryInput

LocationSelector

ShiftSelector

SkillSelector

JobCard

JobStatusBadge

Hooks

useJobs()

useJobDetail()

useCreateJob()

useUpdateJob()

APIs

GET /jobs

GET /jobs/{id}

POST /jobs

PUT /jobs

DELETE /jobs

---

# 11. Job Detail

Components

JobHeader

BusinessInfo

SalaryCard

ShiftList

RequirementCard

ApplyButton

RecommendedJobs

Business Rule

Không hiển thị Apply nếu

Guest

Suspended

Banned

Chưa Verify

---

# 12. Application Module

Pages

Applied Jobs

Application Detail

Application Timeline

Components

ApplicationCard

StatusTimeline

InterviewCard

WithdrawButton

APIs

POST /applications

GET /applications

PUT /applications/status

---

# 13. Recommendation Module

Pages

Recommended Jobs

Recommended Candidates

Components

RecommendationCard

MatchingScore

SkillMatch

DistanceMatch

AvailabilityMatch

Business Rule

Recommendation chỉ đọc.

Frontend không được tự tính Matching Score.

---

# 14. Chat Module

Pages

Conversation

Message

Components

ChatSidebar

ChatWindow

MessageBubble

Attachment

Emoji

Typing

Hooks

useConversation()

useMessages()

APIs

GET /conversation

GET /messages

POST /messages

---

# 15. Notification Module

Components

Notification Bell

Notification Drawer

Notification Item

Notification Badge

APIs

GET /notifications

PUT /notifications/read

---

# 16. Review Module

Pages

Write Review

Review Detail

Components

Rating

Comment

ReviewCard

APIs

POST /reviews

GET /reviews

Business Rule

Review chỉ được tạo sau khi Job hoàn thành.

---

# 17. Trust Score Module

Pages

Trust History

Components

TrustCard

TrustTimeline

TrustEvent

CurrentScore

APIs

GET /trust-score

GET /trust-history

Frontend chỉ hiển thị.

---

# 18. Admin Module

Pages

Dashboard

Manage User

Manage Job

Manage Business

Manage Report

Audit Log

Configuration

Components

DataTable

FilterPanel

StatusBadge

ActionMenu

Pagination

SearchBar

---

# 19. Manual Verification Module

Pages

Verification Queue

Verification Detail

Components

VerificationCard

ApproveButton

RejectButton

EscalateButton

DocumentViewer

FaceCompare

APIs

GET /verification/pending

PUT /verification/approve

PUT /verification/reject

PUT /verification/escalate

---

# 20. Common Hooks

Project nên có

useAuth()

useApi()

usePagination()

useDebounce()

useSearch()

useModal()

useToast()

usePermission()

useLoading()

useInfiniteScroll()

---

# 21. Common Services

AuthService

CandidateService

RecruiterService

BusinessService

JobService

ApplicationService

ReviewService

VerificationService

NotificationService

TrustService

RecommendationService

AnalyticsService

---

# 22. Common Components

Button

Input

Textarea

Card

Modal

Drawer

Loading

Skeleton

Avatar

Pagination

Table

Dropdown

SearchBox

Filter

Badge

Timeline

Không được duplicate.

---

# 23. Feature Development Flow

SRS

↓

Use Case

↓

Business Rule

↓

Entity

↓

API

↓

Hook

↓

Service

↓

Component

↓

Page

↓

Route

↓

Permission

↓

Testing

AI luôn phải đi theo flow này.

---

# 24. Feature Checklist

Trước khi hoàn thành một Feature.

AI phải kiểm tra.

□ Route

□ Layout

□ Permission

□ API

□ DTO

□ Validation

□ Loading

□ Error

□ Empty State

□ Responsive

□ Accessibility

□ Skeleton

□ Toast

□ Unit Test

□ Integration Test

---

# 25. Code Generation Rules

AI không được

❌ Hardcode URL

❌ Hardcode Role

❌ Hardcode Status

❌ Duplicate Component

❌ Duplicate Hook

❌ Duplicate API

❌ Gọi axios trong JSX

❌ Business Logic trong Component

AI phải

✔ Reuse

✔ Clean Code

✔ SOLID

✔ Responsive

✔ Accessible

✔ Type-safe

✔ Theo đúng Handbook

---

# 26. AI Development Priority

Khi phát triển project.

Thứ tự ưu tiên.

Authentication

↓

Candidate Profile

↓

Recruiter Profile

↓

Business

↓

Job

↓

Recommendation

↓

Application

↓

Verification

↓

Notification

↓

Review

↓

Trust Score

↓

Administration

Không nên code ngẫu nhiên.

---

# END OF PART 8