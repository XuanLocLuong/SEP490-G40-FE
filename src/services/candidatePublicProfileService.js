const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeSkill = (skill = {}) => ({
    id: skill.id,
    name: skill.name || '',
    description: skill.description || '',
});

const normalizeExperience = (exp = {}) => ({
    id: exp.id,
    jobTitle: exp.jobTitle || exp.position || '',
    organization: exp.organization || exp.company || '',
    startDate: exp.startDate || '',
    endDate: exp.endDate || null,
    description: exp.description || '',
});

export const mapPublicProfileFromApi = (data = {}) => ({
    id: data.id,
    fullName: data.fullName || '',
    avatarUrl: data.avatarUrl || '',
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
    skills: toArray(data.skills).map(normalizeSkill),
    experiences: toArray(data.experiences).map(normalizeExperience),
    educations: toArray(data.educations),
    trustScore: data.trustScore != null ? Number(data.trustScore) : null,
});

export const fetchCandidatePublicProfile = async (getCandidatePublicProfile, candidateId) => {
    const res = await getCandidatePublicProfile(candidateId);
    return mapPublicProfileFromApi(res?.data?.data ?? res?.data);
};
