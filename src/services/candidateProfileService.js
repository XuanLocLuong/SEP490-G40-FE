import * as api from '../apis/CandidateProfileApi.jsx';

// ---------------------------------------------------------------------------
// Adapter DUY NHẤT dịch giữa shape backend THẬT (flat: CandidateProfileResponseDTO /
// UpdateCandidateProfileRequestDTO) <-> shape UI (nested) mà các component
// (JobPreferenceCard, PersonalInfoCard, EducationCard...) đang dùng — để KHÔNG
// phải sửa lại toàn bộ component UI đã viết.
//
// Các gap cấu trúc thật sự giữa BE/FE (đã note rõ từng chỗ bên dưới):
//   - preferredJobType: BE chỉ 1 string, FE cho multi-select -> join bằng dấu phẩy
//     (quy ước riêng của FE, BE coi là 1 chuỗi tự do, không phải enum thật).
//   - address: BE chỉ 1 cột, dùng chung cho "địa chỉ cá nhân" & "địa điểm tìm việc".
//   - educations[]: BE chỉ lưu ĐÚNG 1 học vấn (schoolName/studentCode/educationLevel,
//     không có major/năm học) -> chỉ phần tử đầu tiên trong mảng được lưu.
//   - experiences[] (Work History): BE CHƯA có API -> KHÔNG gọi save thật (xử lý ở
//     CandidateProfilePage.jsx, không phải ở đây).
//   - status: BE chỉ có openToWork (boolean) -> quy về 2 trạng thái SEEKING/NOT_SEEKING.
// ---------------------------------------------------------------------------

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;
const toArray = (value) => (Array.isArray(value) ? value : []);

const JOB_TYPES_SEPARATOR = ',';

const normalizeSkill = (raw) => {
    if (raw == null) return null;
    if (typeof raw === 'string') return { id: raw, name: raw };
    return { id: raw.id, name: raw.name };
};

// ---- GET: backend (flat) -> UI (nested) ----
export const normalizeProfile = (raw) => {
    const data = raw || {};

    return {
        id: data.profileId ?? null,
        fullName: data.fullName || '',
        email: data.email || '',
        avatarUrl: data.profilePicture || '',
        bio: data.bio || '',
        trustScore: data.trustScore ?? null,
        status: data.openToWork ? 'SEEKING' : 'NOT_SEEKING',
        completionPercent: data.completionRate ?? 0,

        // Backend đã tính sẵn — trước đây FE không đọc field nào trong 4 dòng này cả.
        eligibleToApply: Boolean(data.eligibleToApply),
        missingFields: toArray(data.missingFields),
        identityLocked: Boolean(data.identityLocked),
        hasAvailability: Boolean(data.hasAvailability),

        jobPreference: {
            jobTypes: data.preferredJobType ? data.preferredJobType.split(JOB_TYPES_SEPARATOR) : [],
            salaryMin: data.expectedSalaryMin ?? null,
            salaryMax: data.expectedSalaryMax ?? null,
            salaryUnit: 'giờ',
            locationRadiusKm: data.preferredRadiusKm ?? null,
            location: data.address || '',
            // Toạ độ đã có sẵn cột trên BE (latitude/longitude) — trước đây FE luôn gửi null.
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
        },

        personalInfo: {
            birthday: data.dateOfBirth || null,
            gender: data.gender || '',
            address: data.address || '', // Dùng chung cột address với jobPreference.location.
        },

        // Backend chỉ lưu ĐÚNG 1 học vấn (schoolName/studentCode/educationLevel) — không
        // phải danh sách, nên model ở đây là 1 object thay vì mảng như bản trước.
        education: {
            school: data.schoolName || '',
            studentCode: data.studentCode || '',
            educationLevel: data.educationLevel || '',
        },

        // Work History: BE chưa có Controller/Repository — không đọc qua Profile API.
        experiences: [],

        skills: toArray(data.skills).map(normalizeSkill).filter(Boolean),
    };
};

// ---- PUT: UI (nested draft) -> backend (flat) ----
export const toUpdatePayload = (draft) => {
    const pref = draft.jobPreference || {};
    const personal = draft.personalInfo || {};
    const edu = draft.education || {};

    if (personal.address && pref.location && personal.address !== pref.location) {
        // eslint-disable-next-line no-console
        console.warn(
            '[CandidateProfile] "Địa chỉ" và "Địa điểm tìm việc" đang khác nhau nhưng backend chỉ có 1 cột address — giá trị "Thông tin cá nhân" sẽ được ưu tiên lưu.'
        );
    }
    const address = pref.location || personal.address || '';

    const toNumberOrNull = (v) => (v === '' || v == null ? null : Number(v));

    return {
        bio: draft.bio ?? null,
        openToWork: draft.status ? draft.status !== 'NOT_SEEKING' : null,

        dateOfBirth: personal.birthday || null,
        gender: personal.gender || null,

        educationLevel: edu.educationLevel || null,
        schoolName: edu.school || null,
        studentCode: edu.studentCode || null,

        preferredJobType: toArray(pref.jobTypes).join(JOB_TYPES_SEPARATOR) || null,
        expectedSalaryMin: toNumberOrNull(pref.salaryMin),
        expectedSalaryMax: toNumberOrNull(pref.salaryMax),

        address: address || null,
        latitude: pref.latitude ?? null,
        longitude: pref.longitude ?? null,
        preferredRadiusKm: toNumberOrNull(pref.locationRadiusKm),

        // Chỉ giữ id dạng số thật (loại bỏ skill "tự gõ" mà SkillCard trước đây tạo ra
        // với id = chuỗi text — backend skillIds là List<Long>, gửi string sẽ lỗi parse
        // và hỏng CẢ request PUT). Xem thêm sửa ở SkillCard.jsx.
        skillIds: toArray(draft.skills)
            .map((s) => s.id)
            .filter((id) => /^\d+$/.test(String(id)))
            .map(Number),
    };
};

export const fetchProfile = async () => normalizeProfile(unwrap(await api.getProfile()));

export const saveProfile = async (draft) => {
    const res = await api.updateProfile(toUpdatePayload(draft));
    const data = unwrap(res);
    return data ? normalizeProfile(data) : null;
};

export const uploadAvatar = async (file) => {
    const data = unwrap(await api.uploadAvatar(file));
    if (data && data.url) {
        return { avatarUrl: data.url };
    }
    return {};
};

export const fetchSkills = async () => {
    const data = unwrap(await api.getSkills());
    return toArray(data).map(normalizeSkill).filter(Boolean);
};