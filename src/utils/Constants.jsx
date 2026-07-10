// Khớp 1-1 với enum UserRole bên backend (sep490g40be/constant/UserRole.java).
// Không có "GUEST" vì guest = chưa đăng nhập (không có token).
export const USER_ROLES = {
    CANDIDATE: 'CANDIDATE',
    RECRUITER: 'RECRUITER',
    ADMIN: 'ADMIN',
    POST_MANAGER: 'POST_MANAGER',
    MANUAL_CHECK_TEAM: 'MANUAL_CHECK_TEAM',
};
