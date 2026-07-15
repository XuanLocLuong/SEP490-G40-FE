import { JOB_TYPES, SKILLS_CATALOG } from '../../../constants/jobPost.js';
import { formatSalaryRange, formatLocationDisplay } from '../../../services/jobPostService.js';
import RequiredMark from '../../common/RequiredMark.jsx';
import JobShiftFields from './JobShiftFields.jsx';

const JobPostForm = ({
    form,
    onChange,
    onFieldBlur,
    businessLocation,
    errors = {},
    disabled = false,
}) => {
    const setField = (field, value) => {
        onChange({ ...form, [field]: value });
    };

    const blur = (field) => () => onFieldBlur?.(field);

    const toggleSkill = (skillId) => {
        const ids = form.skillIds || [];
        const next = ids.includes(skillId)
            ? ids.filter((id) => id !== skillId)
            : [...ids, skillId];
        setField('skillIds', next);
    };

    return (
        <form className="job-post-form" onSubmit={(e) => e.preventDefault()}>
            <section className="job-post-form__section">
                <h2 className="job-post-form__section-title">Thông tin cơ bản</h2>

                <div className="job-post-form__field">
                    <label htmlFor="job-title">
                        Tiêu đề tin tuyển dụng
                        <RequiredMark />
                    </label>
                    <input
                        id="job-title"
                        value={form.title}
                        disabled={disabled}
                        placeholder="VD: Nhân viên pha chế part-time"
                        onChange={(e) => setField('title', e.target.value)}
                        onBlur={blur('title')}
                    />
                    {errors.title && <p className="job-post-form__error">{errors.title}</p>}
                </div>

                <div className="job-post-form__row job-post-form__row--type-location">
                    <div className="job-post-form__field job-post-form__field--job-type">
                        <label htmlFor="job-type">
                            Loại công việc
                            <RequiredMark />
                        </label>
                        <select
                            id="job-type"
                            value={form.jobType}
                            disabled={disabled}
                            onChange={(e) => setField('jobType', e.target.value)}
                            onBlur={blur('jobType')}
                        >
                            {JOB_TYPES.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {errors.jobType && (
                            <p className="job-post-form__error">{errors.jobType}</p>
                        )}
                    </div>

                    <div className="job-post-form__field job-post-form__field--location">
                        <span className="job-post-form__label">
                            Địa điểm làm việc
                            <RequiredMark />
                        </span>
                        <p
                            className="job-post-form__location-readonly"
                            title={formatLocationDisplay(businessLocation)}
                        >
                            {formatLocationDisplay(businessLocation)}
                        </p>
                        {errors.locationId && (
                            <p className="job-post-form__error">{errors.locationId}</p>
                        )}
                    </div>
                </div>

                <div className="job-post-form__row">
                    <div className="job-post-form__field">
                        <label htmlFor="salary-min">Lương tối thiểu</label>
                        <input
                            id="salary-min"
                            type="number"
                            min="0"
                            value={form.salaryMin}
                            disabled={disabled}
                            placeholder="22.000 ₫"
                            onChange={(e) => setField('salaryMin', e.target.value)}
                            onBlur={blur('salaryMin')}
                        />
                    </div>
                    <div className="job-post-form__field">
                        <label htmlFor="salary-max">Lương tối đa</label>
                        <input
                            id="salary-max"
                            type="number"
                            min="0"
                            value={form.salaryMax}
                            disabled={disabled}
                            placeholder="30.000 ₫"
                            onChange={(e) => setField('salaryMax', e.target.value)}
                            onBlur={blur('salaryMax')}
                        />
                        {errors.salaryMax && (
                            <p className="job-post-form__error">{errors.salaryMax}</p>
                        )}
                    </div>
                    <div className="job-post-form__field job-post-form__field--narrow">
                        <label htmlFor="required-candidates">Số lượng tuyển</label>
                        <input
                            id="required-candidates"
                            type="number"
                            min="1"
                            value={form.requiredCandidates}
                            disabled={disabled}
                            onChange={(e) => setField('requiredCandidates', e.target.value)}
                            onBlur={blur('requiredCandidates')}
                        />
                        {errors.requiredCandidates && (
                            <p className="job-post-form__error">{errors.requiredCandidates}</p>
                        )}
                    </div>
                </div>

                <div className="job-post-form__row">
                    <div className="job-post-form__field">
                        <label htmlFor="application-deadline">Hạn nộp hồ sơ</label>
                        <input
                            id="application-deadline"
                            type="datetime-local"
                            value={form.applicationDeadline}
                            disabled={disabled}
                            onChange={(e) => setField('applicationDeadline', e.target.value)}
                        />
                    </div>
                    <div className="job-post-form__field job-post-form__field--checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={Boolean(form.isUrgent)}
                                disabled={disabled}
                                onChange={(e) => setField('isUrgent', e.target.checked)}
                            />
                            Tin tuyển gấp
                        </label>
                    </div>
                </div>
            </section>

            <section className="job-post-form__section">
                <h2 className="job-post-form__section-title">Mô tả công việc</h2>
                <div className="job-post-form__field">
                    <textarea
                        rows={6}
                        value={form.description}
                        disabled={disabled}
                        placeholder="Mô tả chi tiết công việc, yêu cầu, quyền lợi..."
                        onChange={(e) => setField('description', e.target.value)}
                    />
                </div>
            </section>

            <section className="job-post-form__section">
                <h2 className="job-post-form__section-title">Kỹ năng yêu cầu</h2>
                <div className="job-post-form__chips">
                    {SKILLS_CATALOG.map((skill) => {
                        const active = (form.skillIds || []).includes(skill.id);
                        return (
                            <button
                                key={skill.id}
                                type="button"
                                disabled={disabled}
                                className={`job-post-form__chip${
                                    active ? ' job-post-form__chip--active' : ''
                                }`}
                                onClick={() => toggleSkill(skill.id)}
                            >
                                {skill.name}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="job-post-form__section">
                <JobShiftFields
                    shiftBlocks={form.shiftBlocks}
                    error={errors.shiftBlocks}
                    onChange={(shiftBlocks) => setField('shiftBlocks', shiftBlocks)}
                />
            </section>
        </form>
    );
};

export default JobPostForm;
