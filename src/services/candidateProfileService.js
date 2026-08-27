import * as api from '../apis/CandidateProfileApi.jsx';
import { isValidAvatarUrl } from '../utils/profileFormat.js';

// ---------------------------------------------------------------------------
// Adapter DUY NHẤT dịch giữa shape backend THẬT (flat: CandidateProfileResponseDTO /
// UpdateCandidateProfileRequestDTO) <-> shape UI (nested) mà các component
// (JobPreferenceCard, PersonalInfoCard, EducationCard...) đang dùng — để KHÔNG
// phải sửa lại toàn bộ component UI đã viết.
//
// Các gap cấu trúc thật sự giữa BE/FE (đã note rõ từng chỗ bên dưới):
//   - preferredJobTypeCodes: mã lĩnh vực (FNB_SERVICE,...) — FE dùng cho multi-select
//     + PUT. preferredJobType là label hiển thị từ BE (chỉ đọc, không gửi lại).
//   - address (text) vs lat/lng: cùng profile nhưng FE tách UI —
//     "Địa chỉ" cá nhân → chỉ PUT address; "Địa điểm tìm việc" → chỉ PUT lat/lng (+ radius).
//     Apply vẫn cần đủ cả 3. Không có 2 cột address trên BE.
//   - educations[]: BE chỉ lưu ĐÚNG 1 học vấn (schoolName/studentCode/educationLevel,
//     không có major/năm học) -> chỉ phần tử đầu tiên trong mảng được lưu.
//   - experiences[] (Work History): CRUD riêng /api/v1/candidate/work-histories,
//     không gửi qua PUT profile (xem useCandidateWorkHistories).
//   - status: BE chỉ có openToWork (boolean) -> quy về 2 trạng thái SEEKING/NOT_SEEKING.
// ---------------------------------------------------------------------------

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;
const toArray = (value) => (Array.isArray(value) ? value : []);

const JOB_TYPES_SEPARATOR = ',';

/** Tách chuỗi code/label lĩnh vực từ BE (có thể "A,B" hoặc 1 phần tử). */
const splitJobTypeValues = (raw) =>
    String(raw || '')
        .split(JOB_TYPES_SEPARATOR)
        .map((s) => s.trim())
        .filter(Boolean);

/**
 * GET: ưu tiên preferredJobTypeCodes (mã). Fallback preferredJobType chỉ khi
 * giá trị trông giống code (UPPER_SNAKE), tránh nhét label vào form.
 */
const resolveJobTypeCodesFromProfile = (data) => {
    const fromCodes = splitJobTypeValues(data?.preferredJobTypeCodes);
    if (fromCodes.length > 0) return fromCodes;

    const fromLegacy = splitJobTypeValues(data?.preferredJobType);
    const looksLikeCode = (v) => /^[A-Z][A-Z0-9_]*$/.test(v);
    if (fromLegacy.length > 0 && fromLegacy.every(looksLikeCode)) {
        return fromLegacy;
    }
    return [];
};

const normalizeSkill = (raw) => {
    if (raw == null) return null;
    if (typeof raw === 'string') return { id: raw, name: raw, active: true };
    const active =
        raw.active == null && raw.isActive == null
            ? true
            : Boolean(raw.active ?? raw.isActive);
    return { id: raw.id, name: raw.name, active };
};

// ---- GET: backend (flat) -> UI (nested) ----
export const normalizeProfile = (raw) => {
    const data = raw || {};

    return {
        id: data.profileId ?? null,
        fullName: data.fullName || '',
        email: data.email || '',
        avatarUrl: isValidAvatarUrl(data.profilePicture) ? data.profilePicture : '',
        cvLink: data.cvLink || '',
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
            jobTypes: resolveJobTypeCodesFromProfile(data),
            salaryMin: data.expectedSalaryMin ?? null,
            salaryMax: data.expectedSalaryMax ?? null,
            salaryUnit: 'giờ',
            locationRadiusKm: data.preferredRadiusKm ?? null,
            // Chỉ dùng để hiện trên UI (reverse geocode) — không map từ address BE.
            location: '',
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
        },

        personalInfo: {
            birthday: data.dateOfBirth || null,
            gender: data.gender || '',
            // Text địa chỉ cá nhân → PUT `address` (tách khỏi lat/lng tìm việc).
            address: data.address || '',
        },

        // Backend chỉ lưu ĐÚNG 1 học vấn (schoolName/studentCode/educationLevel) — không
        // phải danh sách, nên model ở đây là 1 object thay vì mảng như bản trước.
        education: {
            school: data.schoolName || '',
            studentCode: data.studentCode || '',
            educationLevel: data.educationLevel || '',
        },

        // Work History CRUD riêng — không đọc/ghi qua Profile API.
        experiences: [],

        skills: toArray(data.skills).map(normalizeSkill).filter(Boolean),
    };
};

// ---- PUT: UI (nested draft) -> backend (flat) ----
export const toUpdatePayload = (draft) => {
    const pref = draft.jobPreference || {};
    const personal = draft.personalInfo || {};
    const edu = draft.education || {};

    const toNumberOrNull = (v) => (v === '' || v == null ? null : Number(v));
    const isBlankSalary = (v) => v === '' || v == null || String(v).trim() === '';

    // Địa chỉ text chỉ từ Thông tin cá nhân. Lat/lng chỉ từ Nhu cầu tìm việc.
    // (pref.location chỉ là nhãn reverse-geocode trên UI, không PUT vào address.)
    const personalAddress =
        personal.address == null ? '' : String(personal.address).trim();

    const salaryMinBlank = isBlankSalary(pref.salaryMin);
    const salaryMaxBlank = isBlankSalary(pref.salaryMax);

    return {
        bio: draft.bio ?? null,
        openToWork: draft.status ? draft.status !== 'NOT_SEEKING' : null,

        dateOfBirth: personal.birthday || null,
        gender: personal.gender || null,

        educationLevel: edu.educationLevel || null,
        // BE: null = không đổi; "" = xóa (trim). Không dùng || null khi user cố ý clear.
        schoolName: edu.school == null ? '' : String(edu.school).trim(),
        studentCode: edu.studentCode == null ? '' : String(edu.studentCode).trim(),

        // Gửi mã lĩnh vực (FNB_SERVICE,...). Chuỗi rỗng "" = xóa hết (BE: null = không đổi).
        preferredJobType: toArray(pref.jobTypes).join(JOB_TYPES_SEPARATOR),
        // Lương: null = không đổi; xóa ô → clearExpectedSalary* = true (BE flag).
        expectedSalaryMin: salaryMinBlank ? null : toNumberOrNull(pref.salaryMin),
        expectedSalaryMax: salaryMaxBlank ? null : toNumberOrNull(pref.salaryMax),
        clearExpectedSalaryMin: salaryMinBlank ? true : undefined,
        clearExpectedSalaryMax: salaryMaxBlank ? true : undefined,
        clearCv: draft.clearCv ? true : undefined,

        address: personalAddress,
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

export const uploadCv = async (file) => {
    const res = await api.uploadCv(file);
    const data = unwrap(res);
    if (data && (data.cvLink || data.url)) {
        return { cvLink: data.cvLink || data.url, profile: data.profile ? normalizeProfile(data.profile) : null };
    }
    return { cvLink: data };
};

export const deleteCv = async () => {
    await api.deleteCv();
    return { cvLink: null };
};

export const fetchSkills = async () => {
    const data = unwrap(await api.getSkills());
    return toArray(data).map(normalizeSkill).filter(Boolean);
};