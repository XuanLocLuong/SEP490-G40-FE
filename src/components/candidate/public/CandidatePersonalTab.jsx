import { getEducationLevelLabel } from '../../../utils/profileFormat.js';

const DetailField = ({ label, value }) => {
    if (!value && value !== 0) return null;
    return (
        <div className="cpp-detail-field">
            <span className="cpp-detail-field__label">{label}</span>
            <p className="cpp-detail-field__value">{value}</p>
        </div>
    );
};

const CandidatePersonalTab = ({ profile }) => {
    const fields = [
        { label: 'Họ và tên', value: profile.fullName },
        { label: 'Trường học', value: profile.university },
        { label: 'Bậc học', value: getEducationLevelLabel(profile.educationLevel) },
        { label: 'Chuyên ngành', value: profile.major },
        { label: 'Thành phố', value: profile.city },
        { label: 'Năm học', value: profile.academicYear },
        { label: 'GPA', value: profile.gpa },
    ].filter((field) => field.value != null && field.value !== '');

    return (
        <div className="cpp-tab-panel">
            <section className="cpp-card">
                <h2 className="cpp-card__title">Chi tiết hồ sơ</h2>
                {fields.length === 0 ? (
                    <p className="cpp-empty-text">Chưa có thông tin cá nhân.</p>
                ) : (
                    <div className="cpp-detail-grid">
                        {fields.map((field) => (
                            <DetailField key={field.label} label={field.label} value={field.value} />
                        ))}
                    </div>
                )}
            </section>

            {profile.about?.trim() && (
                <section className="cpp-card">
                    <h2 className="cpp-card__title">Giới thiệu</h2>
                    <p className="cpp-card__text">{profile.about}</p>
                </section>
            )}

            {profile.skills.length > 0 && (
                <section className="cpp-card">
                    <h2 className="cpp-card__title">Kỹ năng</h2>
                    <div className="cpp-skill-tags">
                        {profile.skills.map((skill) => (
                            <span
                                key={skill.id ?? skill.name}
                                className="cpp-skill-tag"
                                title={skill.description || undefined}
                            >
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default CandidatePersonalTab;
