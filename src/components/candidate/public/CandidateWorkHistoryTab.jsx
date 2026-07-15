import { formatMonthYear } from '../../../utils/profileFormat.js';

const renderPeriod = (exp) => {
    const start = formatMonthYear(exp.startDate);
    const end = exp.endDate ? formatMonthYear(exp.endDate) : 'Hiện tại';
    if (!start && !exp.endDate) return '';
    return `${start || '?'} - ${end}`;
};

const CandidateWorkHistoryTab = ({ experiences = [] }) => (
    <div className="cpp-tab-panel">
        <section className="cpp-card">
            <h2 className="cpp-card__title">Lịch sử làm việc</h2>
            {experiences.length === 0 ? (
                <p className="cpp-empty-text">Ứng viên chưa cập nhật lịch sử làm việc.</p>
            ) : (
                <ul className="cpp-work-list">
                    {experiences.map((exp, index) => (
                        <li key={exp.id ?? index} className="cpp-work-list__item">
                            <div className="cpp-work-list__head">
                                <strong>{exp.jobTitle || 'Vị trí'}</strong>
                                {exp.organization && <span>{exp.organization}</span>}
                            </div>
                            {renderPeriod(exp) && (
                                <p className="cpp-work-list__period">{renderPeriod(exp)}</p>
                            )}
                            {exp.description && (
                                <p className="cpp-card__text">{exp.description}</p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    </div>
);

export default CandidateWorkHistoryTab;
