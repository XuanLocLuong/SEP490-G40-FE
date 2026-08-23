import { formatDate, getEducationLevelLabel } from '../../../utils/profileFormat.js';
import { getJobTypeLabels } from '../../../utils/jobTypeDisplay.js';
import { useEducationLevelOptions } from '../../../hooks/useEducationLevelOptions.js';
import { useJobTypeOptions } from '../../../hooks/useJobTypeOptions.js';

const renderPeriod = (exp) => {
    const start = formatDate(exp.startDate);
    const end = exp.endDate ? formatDate(exp.endDate) : 'Hiện tại';
    if (!start && !exp.endDate) return '';
    return `${start || '?'} - ${end}`;
};

/**
 * Public candidate "Hồ sơ" — CV-style view (personal + work history merged).
 * Header (avatar/name/trust) stays outside; this is body content only.
 */
const CandidatePublicResume = ({ profile }) => {
    const educationLevelOptions = useEducationLevelOptions();
    const jobTypeOptions = useJobTypeOptions();
    const preferredJobLabels = getJobTypeLabels(profile.preferredJobType, jobTypeOptions);
    const educationLevelLabel = getEducationLevelLabel(
        profile.educationLevel,
        educationLevelOptions,
    );

    const hasAbout = Boolean(profile.about?.trim());
    const hasHeadline = Boolean(profile.headline?.trim());
    const experiences = profile.experiences || [];
    const skills = profile.skills || [];

    const hasEducation = Boolean(
        profile.university ||
            educationLevelLabel ||
            profile.major ||
            profile.academicYear ||
            profile.gpa ||
            profile.city,
    );

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
                                                <p className="cpp-resume-exp__org">
                                                    {exp.organization}
                                                </p>
                                            )}
                                            <div className="cpp-resume-exp__meta">
                                                <strong>{exp.jobTitle || 'Vị trí'}</strong>
                                                {renderPeriod(exp) && (
                                                    <span>{renderPeriod(exp)}</span>
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
                            <h3 className="cpp-resume__capsule">Học vấn</h3>
                            {!hasEducation ? (
                                <p className="cpp-empty-text">Chưa cập nhật học vấn.</p>
                            ) : (
                                <div className="cpp-resume-edu">
                                    {profile.university && (
                                        <p className="cpp-resume-edu__school">
                                            {profile.university}
                                        </p>
                                    )}
                                    {educationLevelLabel && (
                                        <p className="cpp-resume-edu__line">
                                            {educationLevelLabel}
                                        </p>
                                    )}
                                    {profile.major && (
                                        <p className="cpp-resume-edu__line">{profile.major}</p>
                                    )}
                                    {profile.academicYear && (
                                        <p className="cpp-resume-edu__line">
                                            Năm học: {profile.academicYear}
                                        </p>
                                    )}
                                    {profile.gpa != null && profile.gpa !== '' && (
                                        <p className="cpp-resume-edu__line">GPA: {profile.gpa}</p>
                                    )}
                                    {profile.city && (
                                        <p className="cpp-resume-edu__line">{profile.city}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="cpp-resume__block">
                            <h3 className="cpp-resume__capsule">Kỹ năng</h3>
                            {skills.length === 0 ? (
                                <p className="cpp-empty-text">Chưa cập nhật kỹ năng.</p>
                            ) : (
                                <ul className="cpp-resume-skills">
                                    {skills.map((skill) => (
                                        <li
                                            key={skill.id ?? skill.name}
                                            className="cpp-resume-skills__item"
                                            title={skill.description || undefined}
                                        >
                                            <span className="cpp-resume-skills__name">
                                                {skill.name}
                                            </span>
                                            {skill.description ? (
                                                <span className="cpp-resume-skills__desc">
                                                    {skill.description}
                                                </span>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {preferredJobLabels.length > 0 && (
                            <div className="cpp-resume__block">
                                <h3 className="cpp-resume__capsule">Loại việc mong muốn</h3>
                                <div className="cpp-skill-tags">
                                    {preferredJobLabels.map((label) => (
                                        <span key={label} className="cpp-skill-tag">
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
