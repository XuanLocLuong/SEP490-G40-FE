import axiosClient, { API_PREFIX } from './AxiosClient.jsx';

// Toàn bộ endpoint của feature Candidate Profile.
// Backend chạy dưới prefix /api/v1 (đã cấu hình trong AxiosClient).
const PROFILE_BASE = `${API_PREFIX}/candidate/profile`;

// GET /api/v1/candidate/profile — load khi page mount.
export const getProfile = () => axiosClient.get(PROFILE_BASE);

// PUT /api/v1/candidate/profile — cập nhật hồ sơ. Backend là PARTIAL UPDATE
// (field null = giữ nguyên), payload phải đúng shape flat của
// UpdateCandidateProfileRequestDTO — xem candidateProfileService.js.
export const updateProfile = (data) => axiosClient.put(PROFILE_BASE, data);

// POST /api/v1/candidate/profile/avatar — multipart/form-data.
export const uploadAvatar = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post(`${PROFILE_BASE}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// GET /api/v1/candidate/profile/skills — ĐÚNG path thật (KHÔNG phải /api/v1/skills).
export const getSkills = () => axiosClient.get(`${PROFILE_BASE}/skills`);