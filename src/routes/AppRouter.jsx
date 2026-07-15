import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext.js';
import { USER_ROLES } from '../utils/Constants.jsx';
import { ROUTES, getHomePathByRole } from './path.js';

import ProtectedRoute from './ProtectedRoute.jsx';

import GuestLayout from '../layouts/GuestLayout.jsx';
import CandidateLayout from '../layouts/CandidateLayout.jsx';
import RecruiterLayout from '../layouts/RecruiterLayout.jsx';
import InternalLayout from '../layouts/InternalLayout.jsx';

import LandingPage from '../pages/guest/LandingPage.jsx';
import JobListPage from '../pages/guest/JobListPage.jsx';
import JobDetailPage from '../pages/guest/JobDetailPage.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import CandidateHomePage from '../pages/candidate/CandidateHomePage.jsx';
import CandidateSettingsPage from '../pages/candidate/CandidateSettingsPage.jsx';
import CandidateProfilePage from '../pages/candidate/CandidateProfile/CandidateProfilePage.jsx';
import AvailabilityPage from '../pages/candidate/availability/AvailabilityPage.jsx';
import RecruiterHomePage from '../pages/recruiter/RecruiterHomePage.jsx';
import RecruiterProfilePage from '../pages/recruiter/RecruiterProfilePage.jsx';
import CreateJobPage from '../pages/recruiter/jobs/CreateJobPage.jsx';
import MyJobsPage from '../pages/recruiter/jobs/MyJobsPage.jsx';
import PostManagerDashboard from '../pages/post-manager/PostManagerDashboard.jsx';
import ManualCheckDashboard from '../pages/manual-check/ManualCheckDashboard.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import VerifyEmail from "../pages/auth/VerifyEmail.jsx";

// Cấu trúc route đi theo nhóm role (khớp bảng Screen Authorization trong SRS +
// đúng 5 role thật của backend). Mỗi nhóm bọc 1 Layout dùng chung qua
// <Route element={...}> lồng nhau, page con chỉ còn lo nội dung, không tự
// import Header/layout riêng nữa như code cũ.
const AppRouter = () => {
    const { auth } = useAuth();

    return (
        <Routes>
            {/* ---- Guest / public (có Header + Footer) ---- */}
            <Route element={<GuestLayout />}>
                <Route path={ROUTES.LANDING} element={<LandingPage />} />
                <Route path={ROUTES.JOB_LIST} element={<JobListPage />} />
                <Route path={ROUTES.JOB_DETAIL} element={<JobDetailPage />} />
            </Route>

            {/* ---- Auth (Login/Register/Verify) — KHÔNG có Header/Footer,
                 tự đứng độc lập full-page theo đúng ảnh thiết kế ---- */}
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* ---- Candidate ---- */}
            <Route
                element={
                    <ProtectedRoute allowedRoles={[USER_ROLES.CANDIDATE]}>
                        <CandidateLayout />
                    </ProtectedRoute>
                }
            >
                <Route path={ROUTES.CANDIDATE_HOME} element={<CandidateHomePage />} />
                <Route path={ROUTES.CANDIDATE_SETTINGS} element={<CandidateSettingsPage />} />
                <Route path={ROUTES.CANDIDATE_PROFILE} element={<CandidateProfilePage />} />
                <Route path={ROUTES.CANDIDATE_AVAILABILITY} element={<AvailabilityPage />} />
            </Route>

            {/* ---- Recruiter ---- */}
            <Route
                element={
                    <ProtectedRoute allowedRoles={[USER_ROLES.RECRUITER]}>
                        <RecruiterLayout />
                    </ProtectedRoute>
                }
            >
                <Route path={ROUTES.RECRUITER_HOME} element={<RecruiterHomePage />} />
                <Route path={ROUTES.RECRUITER_SETTINGS} element={<CandidateSettingsPage />} />
                <Route path={ROUTES.RECRUITER_PROFILE} element={<RecruiterProfilePage />} />
                <Route path={ROUTES.RECRUITER_CREATE_JOB} element={<CreateJobPage />} />
                <Route path={ROUTES.RECRUITER_EDIT_JOB} element={<CreateJobPage />} />
                <Route path={ROUTES.RECRUITER_MY_JOBS} element={<MyJobsPage />} />
            </Route>

            {/* ---- Post Manager ---- */}
            <Route
                element={
                    <ProtectedRoute allowedRoles={[USER_ROLES.POST_MANAGER]}>
                        <InternalLayout />
                    </ProtectedRoute>
                }
            >
                <Route path={ROUTES.POST_MANAGER_HOME} element={<PostManagerDashboard />} />
            </Route>

            {/* ---- Manual Verification Team ---- */}
            <Route
                element={
                    <ProtectedRoute allowedRoles={[USER_ROLES.MANUAL_CHECK_TEAM]}>
                        <InternalLayout />
                    </ProtectedRoute>
                }
            >
                <Route path={ROUTES.MANUAL_CHECK_HOME} element={<ManualCheckDashboard />} />
            </Route>

            {/* ---- Admin ---- */}
            <Route
                element={
                    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <InternalLayout />
                    </ProtectedRoute>
                }
            >
                <Route path={ROUTES.ADMIN_HOME} element={<AdminDashboard />} />
            </Route>

            {/* Route không tồn tại -> về trang chủ đúng role (hoặc Landing nếu chưa login) */}
            <Route
                path="*"
                element={<Navigate to={auth ? getHomePathByRole(auth.role) : ROUTES.LANDING} replace />}
            />
        </Routes>
    );
};

export default AppRouter;
