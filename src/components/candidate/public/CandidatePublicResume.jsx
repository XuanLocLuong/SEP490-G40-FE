import { useEffect, useState } from 'react';
import {
    formatDate,
    formatExperiencePeriod,
    formatSalaryRange,
    getEducationLevelLabel,
    getGenderLabel,
} from '../../../utils/profileFormat.js';
import { getJobTypeLabels } from '../../../utils/jobTypeDisplay.js';
import { reverseGeocodeLatLng } from '../../../utils/reverseGeocode.js';
import { useEducationLevelOptions } from '../../../hooks/useEducationLevelOptions.js';
import { useJobTypeOptions } from '../../../hooks/useJobTypeOptions.js';
import { PhoneIcon } from '../../common/icons.jsx';
import {
    CalendarIcon,
    HomeAddressIcon,
    MapPinIcon,
    WalletIcon,
} from '../profileIcons.jsx';

/**
 * Public candidate "Hồ sơ" — CV-style view (personal + work history merged).
 * Header (avatar/name/trust) stays outside; this is body content only.
 */
const CandidatePublicResume = ({ profile }) => {
    const educationLevelOptions = useEducationLevelOptions();
    const jobTypeOptions = useJobTypeOptions();
    const preferredJobLabels = getJobTypeLabels(profile?.preferredJobType, jobTypeOptions);
    const educationLevelLabel = getEducationLevelLabel(
        profile?.educationLevel,
        educationLevelOptions,
    );

    const [jobLocationLabel, setJobLocationLabel] = useState('');

    useEffect(() => {
        let cancelled = false;
        const lat = profile?.latitude;
        const lng = profile?.longitude;
        if (lat == null || lng == null) {
            setJobLocationLabel('');
            return undefined;
        }
        (async () => {
            const label = await reverseGeocodeLatLng(lat, lng);
            if (!cancelled) setJobLocationLabel(label);
        })();
        return () => {
            cancelled = true;
        };
    }, [profile?.latitude, profile?.longitude]);

    const hasAbout = Boolean(profile.about?.trim());
    const hasHeadline = Boolean(profile.headline?.trim());
    const experiences = profile.experiences || [];
    const skills = profile.skills || [];

    const hasEducation = Boolean(
        profile?.university ||
            educationLevelLabel ||
            profile?.studentCode ||
            profile?.major ||
            profile?.academicYear ||
            profile?.gpa ||
            profile?.city,
    );

    const genderText = getGenderLabel(profile?.gender);
    const birthDateText = formatDate(profile?.dateOfBirth);
    const salaryText = formatSalaryRange({
        salaryMin: profile?.expectedSalaryMin,
        salaryMax: profile?.expectedSalaryMax,
    });

    const hasJobCoords = profile?.latitude != null && profile?.longitude != null;
    const locationDisplay =
        jobLocationLabel ||
        (hasJobCoords
            ? `${Number(profile.latitude).toFixed(4)}, ${Number(profile.longitude).toFixed(4)}`
            : '');

    return (
        <section className="cpp-resume" aria-label="Hồ sơ">
            <div className="cpp-resume__sheet">
                <div className="cpp-resume__grid">
                    <div className="cpp-resume__main">
                        {(hasAbout || hasHeadline) && (
                            <div className="cpp-resume__block">
                                <h3 className="cpp-resume__capsule">Giới thiệu bản thân</h3>
                                <div className="cpp-resume__about">
                                    {hasHeadline && (
                                        <p className="cpp-resume__headline">{profile.headline}</p>
                                    )}
                                    {hasAbout && (
                                        <p className="cpp-resume__about-text">{profile.about}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="cpp-resume__block">
                            <h3 className="cpp-resume__capsule">Kinh nghiệm làm việc</h3>
                            {experiences.length === 0 ? (
                                <p className="cpp-empty-text">
                                    Ứng viên chưa cập nhật lịch sử làm việc.
                                </p>
                            ) : (
                                <ul className="cpp-resume-exp">
                                    {experiences.map((exp, index) => (
                                        <li
                                            key={exp.id ?? index}
                                            className="cpp-resume-exp__item"
                                        >
                                            {exp.organization && (
                                                <div className="cpp-resume-exp__org-wrap">
                                                    <p className="cpp-resume-exp__org">
                                                        {exp.organization}
                                                    </p>
                                                    {exp.source === 'JOB_LINK' && (
                                                        <span
                                                            className="cpp-resume-exp__badge"
                                                            title="Kinh nghiệm được xác thực từ JobLink"
                                                        >
                                                            JobLink
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="cpp-resume-exp__meta">
                                                <strong>{exp.jobTitle || 'Vị trí'}</strong>
                                                {formatExperiencePeriod(exp) && (
                                                    <span>{formatExperiencePeriod(exp)}</span>
                                                )}
                                            </div>
                                            {exp.description && (
                                                <p className="cpp-resume-exp__desc">
                                                    {exp.description}
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <aside className="cpp-resume__side">
                        <div className="cpp-resume__block">
                            <h3 className="cpp-resume__capsule">Thông tin cá nhân</h3>
                            <div className="cpp-resume-info-card">
                                <div className="cpp-resume-info__row">
                                    <PhoneIcon className="cpp-resume-info__icon" />
                                    <div className="cpp-resume-info__content">
                                        <span className="cpp-resume-info__label">Số điện thoại</span>
                                        {profile?.phone ? (
                                            <a
                                                href={`tel:${profile.phone}`}
                                                className="cpp-resume-info__value cpp-resume-info__link"
                                            >
                                                {profile.phone}
                                            </a>
                                        ) : (
                                            <span className="cpp-resume-info__value cpp-resume-info__value--empty">
                                                Chưa cập nhật
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="cpp-resume-info__row">
                                    <CalendarIcon className="cpp-resume-info__icon" />
                                    <div className="cpp-resume-info__content">
                                        <span className="cpp-resume-info__label">Ngày sinh & Giới tính</span>
                                        <span className="cpp-resume-info__value">
                                            {[birthDateText, genderText].filter(Boolean).join(' · ') || (
                                                <span className="cpp-resume-info__value--empty">
                                                    Chưa cập nhật
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="cpp-resume-info__row">
                                    <HomeAddressIcon className="cpp-resume-info__icon" />
                                    <div className="cpp-resume-info__content">
                                        <span className="cpp-resume-info__label">Địa chỉ nơi ở</span>
                                        <span className="cpp-resume-info__value">
                                            {profile?.address || (
                                                <span className="cpp-resume-info__value--empty">
                                                    Chưa cập nhật
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="cpp-resume__block">
                            <h3 className="cpp-resume__capsule">Nhu cầu tìm việc</h3>
                            <div className="cpp-resume-info-card">
                                <div className="cpp-resume-info__row">
                                    <WalletIcon className="cpp-resume-info__icon" />
                                    <div className="cpp-resume-info__content">
                                        <span className="cpp-resume-info__label">Lương mong đợi</span>
                                        <span className="cpp-resume-info__value">
                                            {salaryText || (
                                                <span className="cpp-resume-info__value--empty">
                                                    Chưa cập nhật
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="cpp-resume-info__row">
                                    <MapPinIcon className="cpp-resume-info__icon" />
                                    <div className="cpp-resume-info__content">
                                        <span className="cpp-resume-info__label">Địa điểm tìm việc</span>
                                        <span className="cpp-resume-info__value">
                                            {locationDisplay || (
                                                <span className="cpp-resume-info__value--empty">
                                                    Chưa chọn vị trí
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="cpp-resume__block">
                            <h3 className="cpp-resume__capsule">Trình độ học vấn</h3>
                            {!hasEducation ? (
                                <p className="cpp-empty-text">Chưa cập nhật trình độ học vấn.</p>
                            ) : (
                                <div className="cpp-resume-edu-card">
                                    {educationLevelLabel ? (
                                        <div className="cpp-resume-edu__level-row">
                                            <span className="cpp-resume-edu__level">
                                                {educationLevelLabel}
                                            </span>
                                        </div>
                                    ) : null}
                                    {profile?.university && (
                                        <p className="cpp-resume-edu__school">
                                            {profile.university}
                                        </p>
                                    )}
                                    {profile?.studentCode && (
                                        <p className="cpp-resume-edu__line">
                                            <span className="cpp-resume-edu__label">MSSV:</span> {profile.studentCode}
                                        </p>
                                    )}
                                    {profile?.major && (
                                        <p className="cpp-resume-edu__line">
                                            <span className="cpp-resume-edu__label">Chuyên ngành:</span> {profile.major}
                                        </p>
                                    )}
                                    {profile?.academicYear && (
                                        <p className="cpp-resume-edu__line">
                                            <span className="cpp-resume-edu__label">Năm học:</span> {profile.academicYear}
                                        </p>
                                    )}
                                    {profile?.gpa != null && profile?.gpa !== '' && (
                                        <p className="cpp-resume-edu__line">
                                            <span className="cpp-resume-edu__label">GPA:</span> {profile.gpa}
                                        </p>
                                    )}
                                    {profile?.city && (
                                        <p className="cpp-resume-edu__line">
                                            <span className="cpp-resume-edu__label">Khu vực:</span> {profile.city}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="cpp-resume__block">
                            <h3 className="cpp-resume__capsule">Kỹ năng</h3>
                            {skills.length === 0 ? (
                                <p className="cpp-empty-text">Chưa cập nhật kỹ năng.</p>
                            ) : (
                                <div className="cpp-skill-tags">
                                    {skills.map((skill) => (
                                        <span
                                            key={skill.id ?? skill.name}
                                            className="cpp-skill-tag"
                                        >
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {preferredJobLabels.length > 0 && (
                            <div className="cpp-resume__block">
                                <h3 className="cpp-resume__capsule">Loại việc mong muốn</h3>
                                <div className="cpp-skill-tags">
                                    {preferredJobLabels.map((label) => (
                                        <span
                                            key={label}
                                            className="cpp-skill-tag cpp-skill-tag--job-type"
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </section>
    );
};

export default CandidatePublicResume;
