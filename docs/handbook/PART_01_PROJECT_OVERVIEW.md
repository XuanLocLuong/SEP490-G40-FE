# JOBLINK AI DEVELOPER HANDBOOK

Version: 1.0

Status: In Progress

---

# PART 1 — PROJECT OVERVIEW

---

# 1. Introduction

JobLink là nền tảng kết nối việc làm bán thời gian, việc làm thời vụ và lao động tức thì.

Hệ thống không đơn thuần là website tuyển dụng mà là một nền tảng Matching giữa Candidate và Recruiter thông qua AI Recommendation Engine.

Khác với các website tuyển dụng truyền thống, JobLink tập trung vào:

- Part-time Job
- Freelancer
- Student Job
- Nearby Job
- Instant Hiring
- Trust & Verification
- AI Matching

Mục tiêu cuối cùng của hệ thống là giảm thời gian tuyển dụng và tăng độ chính xác giữa ứng viên và công việc.

---

# 2. Vision

JobLink hướng tới việc trở thành nền tảng tuyển dụng Part-time lớn nhất dành cho:

- Sinh viên
- Lao động phổ thông
- Freelancer
- Chủ cửa hàng
- SME

Thay vì để người dùng tự tìm kiếm công việc, hệ thống chủ động đề xuất công việc phù hợp dựa trên AI.

---

# 3. Product Goals

Project được xây dựng nhằm giải quyết các vấn đề:

Candidate

• Không biết công việc nào phù hợp

• Tốn thời gian tìm kiếm

• Không biết công ty uy tín

• Không biết khoảng cách

• Không biết lịch làm có phù hợp hay không

Recruiter

• Không tìm được ứng viên

• Mất nhiều thời gian đọc CV

• Không biết ứng viên có uy tín hay không

• Đăng bài tuyển dụng mất thời gian

System

• AI Recommendation

• AI Validation

• Trust Score

• Identity Verification

---

# 4. Core Features

Account Management

Authentication

Google Login

OTP Verification

Candidate Profile

Recruiter Profile

Business Profile

Identity Verification

Nearby Job

Job Recommendation

Candidate Recommendation

Apply Job

Job Invitation

Review

Trust Score

Notification

Chat

Analytics

Administration

Moderation

---

# 5. Actors

Project gồm 6 Role chính.

## Guest

Có thể

- xem Landing Page

- xem Job

- tìm Job

- đăng ký

- đăng nhập

Không thể

- Apply

- Review

- Chat

---

## Candidate

Có thể

- tạo profile

- upload CV

- upload timetable

- verify CCCD

- xem AI Recommendation

- Apply Job

- Chat Recruiter

- Review Recruiter

- xem Trust Score

---

## Recruiter

Có thể

- tạo Business

- Verify

- tạo Job

- quản lý Job

- xem Applicant

- gửi Interview

- Review Candidate

- Analytics

---

## Manual Verification Team

Có nhiệm vụ

- Review CCCD

- Review FaceID

- Approve

- Reject

- Escalate

---

## Post Manager

Có nhiệm vụ

- Review Job

- Review AI Flag

- Approve Job

- Reject Job

- Moderate Content

---

## Admin

Quản trị toàn bộ hệ thống

Quản lý

User

Business

Job

Verification

Moderation

Analytics

Configuration

Audit Log

Trust Rule

---

# 6. High Level Architecture

                +----------------------+
                |      Frontend        |
                | React + Vite         |
                +----------+-----------+
                           |
                           |
                      REST API
                           |
                           |
                +----------v-----------+
                | Spring Boot Backend  |
                +----------+-----------+
                           |
        +------------------+------------------+
        |                  |                  |
        |                  |                  |
   MySQL Database      AI Service      Google OAuth
        |                  |                  |
        |                  |                  |
    Notification      AI Matching       Gmail OAuth

---

# 7. Main Modules

Project chia thành nhiều module.

Account

Authentication

Candidate

Recruiter

Business

Job

Application

Recommendation

Verification

Review

Trust Score

Notification

Chat

Analytics

Moderation

Administration

Mỗi module hoạt động độc lập nhưng liên kết thông qua REST API.

---

# 8. Candidate Flow

Guest

↓

Register

↓

Verify OTP

↓

Login

↓

Create Profile

↓

Upload Skills

↓

Upload Timetable

↓

Verify Identity

↓

Receive AI Recommendation

↓

Apply Job

↓

Interview

↓

Hired

↓

Review Recruiter

↓

Trust Score Update

---

# 9. Recruiter Flow

Register

↓

Login

↓

Create Business

↓

Verify Identity

↓

Upload Business Document

↓

Create Job

↓

AI Validation

↓

Publish Job

↓

Receive Applicants

↓

Interview

↓

Hire Candidate

↓

Review Candidate

↓

Analytics

---

# 10. AI Services

Project sử dụng AI tại nhiều vị trí.

Recommendation Engine

- Candidate Recommendation

- Job Recommendation

Validation Engine

- Scam Detection

- Fake Job Detection

- Dangerous Content

Matching Engine

- Skill Matching

- Distance Matching

- Schedule Matching

OCR

- Timetable OCR

Identity

- Face Verification

- CCCD Verification

---

# 11. Trust System

Mỗi User đều có Trust Score.

Trust Score thay đổi bởi

Review

Violation

Verification

Restriction

Report

Moderation

Trust Score được sử dụng để:

- Ranking Candidate

- Ranking Recruiter

- AI Recommendation

- Fraud Detection

---

# 12. Development Principles

Project phải tuân thủ các nguyên tắc sau.

1. Không duplicate component.

2. Reusable component trước.

3. API tách riêng.

4. UI không chứa business logic.

5. Business logic không nằm trong Component.

6. Không hardcode.

7. Role-based Permission.

8. Responsive.

9. Type-safe.

10. Component nhỏ.

11. Clean Architecture.

12. SOLID.

---

# 13. AI Development Rules

Bất kỳ AI nào tham gia project đều PHẢI:

1. Đọc AI Handbook.

2. Đọc Frontend Structure.

3. Đọc Backend Structure.

4. Đọc API Mapping.

5. Đọc Entity.

6. Đọc SRS.

7. Không tự ý đổi folder.

8. Không đổi convention.

9. Không rename component.

10. Không đổi route nếu chưa kiểm tra dependency.

11. Không sinh duplicate component.

12. Luôn ưu tiên tái sử dụng component hiện có.

---

# 14. Reading Order

AI phải đọc theo thứ tự.

AI Handbook

↓

Frontend

↓

Backend

↓

Entities

↓

API

↓

SRS

↓

Feature Mapping

↓

Business Rules

↓

Coding

Sau khi hoàn thành mới được sinh code.

---

End of Part 1