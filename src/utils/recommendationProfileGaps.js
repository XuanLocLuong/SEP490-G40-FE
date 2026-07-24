import { fetchProfile } from '../services/candidateProfileService.js';
import { getAvailability } from '../apis/AvailabilityApi.jsx';
import { fetchAvailabilitySlots } from '../services/availabilityService.js';

export const EMPTY_RECOMMENDATION_GAPS = {
    location: false,
    skills: false,
    availability: false,
};

/** Kiểm tra field hồ sơ cần có để gợi ý đầy đủ (khớp cold-start BE). */
export const fetchRecommendationProfileGaps = async () => {
    const [profile, availabilitySlots] = await Promise.all([
        fetchProfile(),
        fetchAvailabilitySlots(getAvailability),
    ]);

    const latitude = profile?.jobPreference?.latitude;
    const longitude = profile?.jobPreference?.longitude;
    const hasSkills = Array.isArray(profile?.skills) && profile.skills.length > 0;
    const hasAvailability = Array.isArray(availabilitySlots) && availabilitySlots.length > 0;

    return {
        location: latitude == null || longitude == null,
        skills: !hasSkills,
        availability: !hasAvailability,
    };
};

export const hasRecommendationGaps = (gaps = EMPTY_RECOMMENDATION_GAPS) =>
    Boolean(gaps.location || gaps.skills || gaps.availability);

/** Một dòng ngắn cho homepage: thiếu gì + link ưu tiên. */
export const summarizeRecommendationGaps = (gaps = EMPTY_RECOMMENDATION_GAPS) => {
    const parts = [];
    if (gaps.availability) parts.push('lịch rảnh');
    if (gaps.location) parts.push('vị trí');
    if (gaps.skills) parts.push('kỹ năng');
    if (parts.length === 0) return null;

    const label =
        parts.length === 1
            ? `Thiếu ${parts[0]}`
            : `Thiếu ${parts.slice(0, -1).join(', ')} và ${parts[parts.length - 1]}`;

    return {
        label,
        // Ưu tiên lịch rảnh (ảnh hưởng lớn nhất tới gợi ý cá nhân hóa).
        primaryHref: gaps.availability ? 'availability' : 'profile',
    };
};
