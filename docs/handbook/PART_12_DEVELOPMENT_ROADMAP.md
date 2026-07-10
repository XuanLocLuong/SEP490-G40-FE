# JOBLINK AI DEVELOPER HANDBOOK

# PART 12

# DEVELOPMENT ROADMAP & PROJECT EXECUTION PLAN

Version 1.0

---

# 1. Purpose

Đây là chương cuối cùng của Handbook.

Mục tiêu của chương này là giúp:

- AI biết phải phát triển module nào trước.
- Developer mới có thể tham gia dự án ngay.
- Team có cùng quy trình phát triển.
- Tránh phát triển ngẫu nhiên.
- Giảm Technical Debt.

Đây là tài liệu điều phối toàn bộ quá trình phát triển JobLink.

---

# 2. Development Principles

Thứ tự ưu tiên luôn là:

Business

↓

Architecture

↓

Backend

↓

API

↓

Frontend

↓

Testing

↓

Deployment

Không được phát triển giao diện trước khi chưa xác định Business Rule.

---

# 3. Project Phases

Project được chia thành 12 Phase.

```
Phase 1

Foundation

↓

Phase 2

Authentication

↓

Phase 3

Candidate

↓

Phase 4

Recruiter

↓

Phase 5

Business

↓

Phase 6

Job

↓

Phase 7

Application

↓

Phase 8

Recommendation

↓

Phase 9

Communication

↓

Phase 10

Trust & Verification

↓

Phase 11

Administration

↓

Phase 12

Deployment
```

---

# 4. Phase 1 — Foundation

Mục tiêu

Hoàn thiện kiến trúc dự án.

Bao gồm

Project Structure

Design System

Theme

Routing

Axios Client

Environment

Constants

Shared Components

Acceptance Criteria

□ Project chạy ổn định

□ Folder đúng chuẩn

□ Không có lỗi Build

□ Responsive cơ bản

---

# 5. Phase 2 — Authentication

Modules

Login

Register

Forgot Password

Reset Password

JWT

Refresh Token

Google Login

Acceptance Criteria

□ Đăng nhập

□ Đăng ký

□ Refresh Token

□ Logout

□ Protected Route

□ Role-based Routing

---

# 6. Phase 3 — Candidate

Modules

Dashboard

Profile

Skills

Availability

Work History

Saved Jobs

Acceptance Criteria

□ Hoàn thiện Profile

□ CRUD Work History

□ CRUD Availability

□ Upload Avatar

□ Profile Completion

---

# 7. Phase 4 — Recruiter

Modules

Dashboard

Recruiter Profile

Recruitment Summary

Analytics

Acceptance Criteria

□ Dashboard hoạt động

□ Hồ sơ Recruiter

□ Thống kê cơ bản

---

# 8. Phase 5 — Business

Modules

Business Profile

Business Verification

Business Documents

Acceptance Criteria

□ CRUD Business

□ Upload giấy phép

□ Trạng thái Verification

---

# 9. Phase 6 — Job

Modules

Job List

Job Detail

Create Job

Edit Job

Delete Job

Search

Filter

Acceptance Criteria

□ CRUD Job

□ Search

□ Filter

□ Pagination

□ Responsive

---

# 10. Phase 7 — Application

Modules

Apply Job

Application Timeline

Application Status

Interview

Acceptance Criteria

□ Apply

□ Withdraw

□ Timeline

□ Status Tracking

---

# 11. Phase 8 — Recommendation

Modules

Recommended Jobs

Recommended Candidates

Matching Score

Acceptance Criteria

□ AI Recommendation hiển thị

□ Matching Score

□ Skill Match

□ Distance Match

---

# 12. Phase 9 — Communication

Modules

Chat

Notification

Realtime Message

Acceptance Criteria

□ Chat

□ Notification

□ Read Status

□ Badge Counter

---

# 13. Phase 10 — Trust & Verification

Modules

Trust Score

Verification

Review

Report

Acceptance Criteria

□ Verification

□ Review

□ Trust Timeline

□ Report

---

# 14. Phase 11 — Administration

Modules

Admin Dashboard

Manage User

Manage Recruiter

Manage Business

Manage Job

Verification Queue

Audit Log

Configuration

Acceptance Criteria

□ Quản lý người dùng

□ Quản lý Job

□ Quản lý Business

□ Audit Log

---

# 15. Phase 12 — Deployment

Modules

CI/CD

Production Build

Environment

Monitoring

Logging

Acceptance Criteria

□ Production Build

□ Environment Config

□ Logging

□ Monitoring

□ Backup

---

# 16. Sprint Planning

Một Sprint gồm:

Requirement

↓

Analysis

↓

Design

↓

Implementation

↓

Code Review

↓

Testing

↓

Deployment

Không merge code chưa review.

---

# 17. Feature Priority Matrix

| Priority | Feature | Status |
|----------|---------|--------|
| P0 | Authentication | Critical |
| P0 | Candidate Profile | Critical |
| P0 | Recruiter Profile | Critical |
| P0 | Business | Critical |
| P0 | Job CRUD | Critical |
| P1 | Recommendation | High |
| P1 | Application | High |
| P1 | Verification | High |
| P1 | Notification | High |
| P2 | Chat | Medium |
| P2 | Review | Medium |
| P2 | Trust Score | Medium |
| P3 | Analytics | Low |
| P3 | Admin Enhancement | Low |

---

# 18. Dependency Matrix

Authentication

↓

Candidate

↓

Business

↓

Job

↓

Application

↓

Recommendation

↓

Review

↓

Trust Score

↓

Analytics

Không được code Feature phía sau khi Feature nền chưa hoàn thiện.

---

# 19. Feature Completion Checklist

Một Feature chỉ được đánh dấu "Done" khi:

□ UI hoàn chỉnh

□ Responsive

□ Validation

□ API Integration

□ Loading State

□ Error State

□ Empty State

□ Permission

□ Business Rule

□ Unit Test

□ Integration Test

□ Code Review

---

# 20. Code Review Checklist

Reviewer phải kiểm tra:

□ Naming

□ Clean Code

□ SOLID

□ DRY

□ Reuse Component

□ Reuse Hook

□ Reuse Service

□ Responsive

□ Accessibility

□ Security

□ Performance

---

# 21. Testing Strategy

Unit Test

↓

Component Test

↓

Integration Test

↓

API Test

↓

UAT

↓

Production

Không bỏ qua UAT.

---

# 22. Bug Priority

P0

Không đăng nhập được

Mất dữ liệu

Lỗi bảo mật

P1

Sai Business Rule

Sai Permission

Sai API

P2

UI

Responsive

Animation

P3

Typography

Spacing

Màu sắc

---

# 23. Technical Debt Rules

Không chấp nhận:

Duplicate Component

Duplicate Hook

Duplicate Service

Magic Number

Hardcode API

Hardcode Role

Inline Business Logic

Nếu phát hiện phải Refactor trước khi mở rộng.

---

# 24. Documentation Rules

Mỗi Feature mới phải cập nhật:

API

Entity

Route

Hook

Service

Component

Handbook

Không để tài liệu lỗi thời.

---

# 25. Definition of Done (DoD)

Một Feature chỉ hoàn thành khi:

Business Rule đúng.

API đúng.

Frontend đúng.

Backend đúng.

Database đúng.

Responsive.

Accessibility.

Testing.

Review.

Documentation.

Deployment Ready.

---

# 26. Long-Term Vision

JobLink hướng tới:

AI-powered Recruitment Platform

Scalable Architecture

Microservice Ready

Cloud Ready

Mobile Ready

Web Ready

Multi-language Ready

High Availability

High Performance

---

# 27. AI Collaboration Rules

Khi AI tham gia phát triển dự án:

- Đọc Handbook trước.
- Phân tích Source trước.
- Không tự ý thay đổi kiến trúc.
- Không tạo code trùng lặp.
- Ưu tiên tái sử dụng.
- Giải thích các thay đổi lớn.
- Đề xuất cải tiến nếu phát hiện vấn đề.

---

# 28. Knowledge Maintenance

Sau mỗi Sprint cần cập nhật:

□ Handbook

□ API Catalog

□ Component Catalog

□ Database Documentation

□ Change Log

□ Architecture Decision Record (ADR)

AI luôn phải sử dụng phiên bản tài liệu mới nhất.

---

# 29. Final AI Workflow

```
Read Handbook

↓

Read SRS

↓

Read Source Code

↓

Understand Business

↓

Analyze Requirement

↓

Identify Entity

↓

Identify API

↓

Identify Existing Components

↓

Design Solution

↓

Implement

↓

Review

↓

Test

↓

Update Documentation

↓

Deliver
```

Đây là quy trình chuẩn cho mọi Feature.

---

# 30. Final Statement

JobLink không chỉ là một dự án React hay Spring Boot.

Đây là một hệ thống tuyển dụng sử dụng AI với nhiều vai trò, nhiều quy trình nghiệp vụ và nhiều module liên kết chặt chẽ.

Mọi quyết định trong quá trình phát triển phải ưu tiên:

- Đúng Business.
- Đúng kiến trúc.
- Dễ mở rộng.
- Dễ bảo trì.
- Tái sử dụng tối đa.
- Hạn chế Technical Debt.
- Đồng bộ giữa Frontend, Backend và Database.

AI và Developer phải xem Handbook này là tài liệu trung tâm của dự án. Khi có sự khác biệt giữa code và tài liệu, cần phân tích nguyên nhân và cập nhật đồng bộ thay vì sửa đổi tùy ý.

---

# END OF PART 12