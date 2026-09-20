import { isValidAvatarUrl } from '../utils/profileFormat.js';

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeSkill = (skill = {}) => ({
    id: skill.id,
    name: skill.name || '',
    description: skill.description || '',
});

const toDateOrEmpty = (value) => {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }
    return String(value);
};

const normalizeExperience = (exp = {}) => ({
    id: exp.id,
    jobTitle: exp.jobTitle || '',
    organization: exp.organization || '',
    startDate: toDateOrEmpty(exp.startDate),
    endDate: exp.endDate ? toDateOrEmpty(exp.endDate) : null,
    description: exp.description || '',
    source: exp.source || 'MANUAL',
});

export const mapPublicProfileFromApi = (data = {}) => ({
    id: data.id,
    userId: data.userId ?? null,
    fullName: data.fullName || '',
    avatarUrl: isValidAvatarUrl(data.avatarUrl)
        ? data.avatarUrl
        : isValidAvatarUrl(data.profilePicture)
          ? data.profilePicture
          : '',
    cvLink: data.cvLink || data.cvUrl || '',
    verified: Boolean(data.verified),
    headline: data.headline || '',
    about: data.about || '',
    university: data.university || '',
    major: data.major || '',
    academicYear: data.academicYear ?? null,
    gpa: data.gpa ?? null,
    city: data.city || '',
    educationLevel: data.educationLevel || '',
    preferredJobType: data.preferredJobType || '',
    openToWork: Boolean(data.openToWork),
    phone: data.phone || '',
    dateOfBirth: toDateOrEmpty(data.dateOfBirth),
    gender: data.gender || '',
    address: data.address || '',
    expectedSalaryMin: data.expectedSalaryMin != null ? Number(data.expectedSalaryMin) : null,
    expectedSalaryMax: data.expectedSalaryMax != null ? Number(data.expectedSalaryMax) : null,
    preferredRadiusKm: data.preferredRadiusKm != null ? Number(data.preferredRadiusKm) : null,
    latitude: data.latitude != null ? Number(data.latitude) : null,
    longitude: data.longitude != null ? Number(data.longitude) : null,
    skills: toArray(data.skills).map(normalizeSkill),
    experiences: toArray(data.experiences).map(normalizeExperience),
    educations: toArray(data.educations),
    trustScore: data.trustScore != null ? Number(data.trustScore) : null,
});

export const fetchCandidatePublicProfile = async (getCandidatePublicProfile, candidateId) => {
    const res = await getCandidatePublicProfile(candidateId);
    return mapPublicProfileFromApi(res?.data?.data ?? res?.data);
};
