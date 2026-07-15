import { useRef } from 'react';
import { JOB_TYPES, SKILLS_CATALOG } from '../../../constants/jobPost.js';
import {
    formatLocationDisplay,
    formatSalaryInputDisplay,
    getMinApplicationDeadline,
    parseSalaryInput,
} from '../../../services/jobPostService.js';
import RequiredMark from '../../common/RequiredMark.jsx';
import RichTextEditor from '../../common/RichTextEditor.jsx';
import DateTimeInput24h from '../../common/DateTimeInput24h.jsx';
import JobShiftFields from './JobShiftFields.jsx';

const JOB_DESCRIPTION_TEMPLATE = `<h2>Mô tả công việc</h2><ul><li>Nhiệm vụ chính hàng ngày</li><li>Ca làm việc, địa điểm</li></ul><h2>Yêu cầu</h2><ul><li>Độ tuổi, kinh nghiệm, kỹ năng mềm</li></ul><h2>Quyền lợi</h2><ul><li>Mức lương, thưởng, hỗ trợ</li></ul><h2>Lưu ý khi ứng tuyển</h2><ul><li>Hồ sơ cần chuẩn bị, thời gian phản hồi</li></ul>`;

const JobPostForm = ({
    form,
    onChange,
    onFieldBlur,
    businessLocation,
    errors = {},
    disabled = false,
}) => {
    const descriptionInsertRef = useRef(null);
    const minApplicationDeadline = getMinApplicationDeadline();

    const setField = (field, value) => {
        onChange({ ...form, [field]: value });
    };

    const blur = (field) => () => onFieldBlur?.(field);

    const handleSalaryChange = (field) => (e) => {
        setField(field, parseSalaryInput(e.target.value));
    };

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
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={formatSalaryInputDisplay(form.salaryMin)}
                            disabled={disabled}
                            placeholder="22.000"
                            onChange={handleSalaryChange('salaryMin')}
                            onBlur={blur('salaryMin')}
                        />
                    </div>
                    <div className="job-post-form__field">
                        <label htmlFor="salary-max">Lương tối đa</label>
                        <input
                            id="salary-max"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={formatSalaryInputDisplay(form.salaryMax)}
                            disabled={disabled}
                            placeholder="30.000"
                            onChange={handleSalaryChange('salaryMax')}
                            onBlur={blur('salaryMax')}
                        />
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
                <p className="job-post-form__hint job-post-form__hint--row">
                    Có thể chỉ điền một mức (VD: 22.000 ₫/giờ). Dưới 1 triệu tính theo giờ, từ 1
                    triệu tính theo tháng.
                </p>
                {errors.salaryMax && (
                    <p className="job-post-form__error">{errors.salaryMax}</p>
                )}

                <div className="job-post-form__row">
                    <div className="job-post-form__field job-post-form__field--deadline">
                        <label htmlFor="application-deadline">Hạn nộp hồ sơ</label>
                        <DateTimeInput24h
                            id="application-deadline"
                            value={form.applicationDeadline}
                            min={minApplicationDeadline}
                            disabled={disabled}
                            onChange={(next) => setField('applicationDeadline', next)}
                            onBlur={blur('applicationDeadline')}
                        />
                        {errors.applicationDeadline && (
                            <p className="job-post-form__error">{errors.applicationDeadline}</p>
                        )}
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
                <div className="job-post-form__field-label-row">
                    <h2 className="job-post-form__section-title job-post-form__section-title--inline">
                        Mô tả công việc
                    </h2>
                    <button
                        type="button"
                        className="job-post-form__insert-template-btn"
                        disabled={disabled}
                        onClick={() => descriptionInsertRef.current?.()}
                    >
                        Chèn mẫu gợi ý
                    </button>
                </div>
                <div className="job-post-form__field">
                    <RichTextEditor
                        rows={8}
                        value={form.description}
                        disabled={disabled}
                        placeholder="Mô tả chi tiết công việc..."
                        template={JOB_DESCRIPTION_TEMPLATE}
                        autoInsertTemplate={false}
                        insertTemplateRef={descriptionInsertRef}
                        onChange={(value) => setField('description', value)}
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
