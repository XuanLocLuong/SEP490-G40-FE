# JOBLINK AI DEVELOPER HANDBOOK

# PART 4

# SOFTWARE REQUIREMENT SPECIFICATION (SRS) ANALYSIS

Version 1.0

---

# 1. Purpose

Chương này không copy SRS.

Mục tiêu của chương này là chuyển toàn bộ SRS thành dạng AI Context.

Sau khi AI đọc xong chương này phải hiểu:

• Business của JobLink

• Toàn bộ Use Case

• Screen

• Workflow

• Validation

• Business Rule

• Entity

• Permission

để sinh code đúng.

---

# 2. Business Domain

JobLink là nền tảng kết nối:

Candidate

↓

Recruiter

thông qua AI.

Khác với website tuyển dụng truyền thống.

JobLink tập trung vào

- tuyển dụng nhanh

- việc làm gần vị trí

- việc bán thời gian

- AI Recommendation

- Trust Score

- Verification

---

# 3. Business Objectives

Project phải giải quyết:

Candidate

✔ tìm việc nhanh

✔ đúng lịch

✔ gần vị trí

✔ an toàn

✔ uy tín

Recruiter

✔ tuyển nhanh

✔ giảm chi phí

✔ tìm đúng người

✔ chống ứng viên giả

System

✔ AI Matching

✔ AI Recommendation

✔ AI Validation

✔ Fraud Detection

✔ Trust Platform

---

# 4. Functional Modules

Theo SRS.

Project chia thành:

01 Authentication

02 Account

03 Candidate Profile

04 Recruiter Profile

05 Business

06 Job

07 Recommendation

08 Verification

09 Trust Score

10 Notification

11 Chat

12 Review

13 Report

14 Analytics

15 Administration

16 Moderation

---

# 5. Screen Groups

SRS không nên hiểu là nhiều màn hình rời.

AI phải gom thành nhóm.

Authentication

Landing

Login

Register

Forgot Password

Candidate

Dashboard

Profile

Availability

Work History

Recommendation

Saved Job

Application

Review

Trust Score

Recruiter

Dashboard

Business

Job

Applicant

Interview

Invitation

Review

Analytics

Admin

Dashboard

Manage User

Manage Job

Manage Business

Trust Rule

Audit

Manual Verify

Verification Queue

Verification Detail

Approve

Reject

Escalate

---

# 6. Use Case Mapping

AI không được đọc Use Case riêng lẻ.

Mà phải hiểu theo Flow.

Ví dụ

Authentication

UC

↓

Login

↓

JWT

↓

Permission

↓

Dashboard

Candidate

UC

↓

Profile

↓

Availability

↓

Recommendation

↓

Apply

↓

Interview

↓

Review

↓

Trust

Recruiter

UC

↓

Business

↓

Verification

↓

Job

↓

Applicant

↓

Interview

↓

Hire

↓

Review

---

# 7. Candidate Journey

Guest

↓

Register

↓

Verify Email

↓

Login

↓

Create Profile

↓

Upload Skill

↓

Upload Schedule

↓

Verify Identity

↓

AI Recommendation

↓

Apply

↓

Interview

↓

Hired

↓

Review Recruiter

↓

Increase Trust Score

Đây là Journey chuẩn.

AI không được bỏ qua bước Verify.

---

# 8. Recruiter Journey

Register

↓

Business

↓

Identity Verification

↓

Business Verification

↓

Create Job

↓

AI Validation

↓

Publish

↓

Receive Applicant

↓

Interview

↓

Hire

↓

Review Candidate

↓

Trust Score

---

# 9. Candidate Profile

Candidate Profile KHÔNG chỉ là thông tin cá nhân.

Bao gồm

Basic Information

Education

Experience

Skills

Expected Salary

Preferred Job

Preferred Location

Working Radius

Availability

Summary

Profile Completion

AI phải xem đây là trung tâm Recommendation.

---

# 10. Work History

Một Candidate

↓

có nhiều

↓

Work History

Mỗi Work History

Company

Position

Employment Type

Start Date

End Date

Description

Status

Không giới hạn số lượng.

---

# 11. Availability

Đây là module rất quan trọng.

Candidate khai báo

Ngày

Giờ

Ca làm

Khoảng thời gian

Project dùng để

Recommendation

Matching

Scheduling

---

# 12. Skill System

Skill không phải String.

Skill là Entity.

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

AI phải dùng Many-to-Many.

---

# 13. Recommendation

Recommendation dựa trên

Skill

Distance

Availability

Trust Score

History

Review

Salary

Job Type

Không random.

---

# 14. Verification

Candidate

CCCD

↓

Face ID

↓

Manual Review (nếu cần)

↓

Verified

Recruiter

CCCD

↓

FaceID

↓

Business Document

↓

Manual Review

↓

Verified

---

# 15. Trust Score

Trust Score mặc định

100 điểm.

Các Event

↓

Increase

hoặc

Decrease

Ví dụ

Verified

+ điểm

Spam

- điểm

Fake Job

- điểm

Good Review

+ điểm

Late Interview

- điểm

AI không cho Frontend chỉnh điểm.

---

# 16. Review

Review luôn xảy ra

Sau Recruitment.

Candidate

↓

Recruiter

Recruiter

↓

Candidate

Review ảnh hưởng

Trust Score.

---

# 17. Notification

Nguồn Notification

Application

Interview

Message

Review

Verification

Trust

Admin

System

Notification không tạo từ Frontend.

---

# 18. Chat

Chat gồm

Conversation

↓

Message

↓

Notification

↓

Read Status

Chat phải realtime.

---

# 19. Business Verification

Recruiter phải

Verify Identity

↓

Verify Business

↓

Create Job

Không cho Recruiter chưa Verify đăng Job.

---

# 20. Job Lifecycle

Draft

↓

Pending AI

↓

Pending Moderator

↓

Published

↓

Closed

↓

Archived

AI không được bỏ qua trạng thái.

---

# 21. Application Lifecycle

Applied

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

↓

Completed

Frontend hiển thị theo Status.

---

# 22. Permission Matrix

Guest

Login

Register

Browse Job

Candidate

Apply

Review

Chat

Recruiter

Create Job

Manage Applicant

Interview

Manual Verify

Approve Verification

Reject

Escalate

Admin

Everything

---

# 23. Validation Rules

Email

Password

Phone

Salary

Date

Radius

Availability

Skill

Business

Verification

Tất cả validation

Frontend

+

Backend

Đều phải có.

---

# 24. Business Rules

AI phải đọc toàn bộ BR trong SRS trước khi code.

Không được

Hardcode

Permission

Status

Trust Score

Workflow

Các Rule phải nằm ở Service.

---

# 25. AI Development Rule

Mỗi khi AI code một màn hình.

Phải xác định:

Role

↓

Use Case

↓

Screen

↓

API

↓

Entity

↓

Validation

↓

Business Rule

↓

Permission

↓

UI

↓

Test

Nếu thiếu một bước

Không được sinh code.

---

# 26. Feature Mapping Matrix (NEW)

Đây là quy tắc quan trọng nhất khi phát triển JobLink.

| Feature | Role | Entity | API | Screen |
|----------|------|--------|-----|--------|
| Login | Guest | User | /auth/login | Login |
| Register | Guest | User | /auth/register | Register |
| Candidate Profile | Candidate | CandidateProfile | /candidate/profile | Candidate Profile |
| Work History | Candidate | WorkHistory | /candidate/work-history | Work History |
| Availability | Candidate | CandidateAvailability | /candidate/availability | Availability |
| Job Recommendation | Candidate | Job | /recommendation/jobs | Recommendation |
| Apply Job | Candidate | Application | /applications | Job Detail |
| Business | Recruiter | Business | /business | Business |
| Job Management | Recruiter | Job | /jobs | Recruiter Jobs |
| Applicant | Recruiter | Application | /applications | Applicant List |
| Verification | Candidate/Recruiter | VerificationRequest | /verification | Verification |
| Trust Score | User | TrustEvent | /trust-score | Trust History |
| Review | Candidate/Recruiter | Review | /reviews | Review |

---

# 27. AI Checklist Before Coding

□ Đã đọc Use Case

□ Đã đọc Business Rule

□ Đã biết Role

□ Đã biết Entity

□ Đã biết API

□ Đã biết Validation

□ Đã biết Permission

□ Đã biết Status Flow

□ Đã biết UI Flow

□ Đã biết Response Format

Nếu còn thiếu bất kỳ mục nào ở trên thì AI phải dừng và phân tích tiếp, không được tự suy diễn.

---

# END OF PART 4