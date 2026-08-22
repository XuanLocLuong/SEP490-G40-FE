import {
    EDUCATION_REQUIREMENT_MODES,
    GENDER_REQUIREMENT_OPTIONS,
    JOB_POST_MAX_JOB_TYPES,
} from '../../../constants/jobPost.js';
import { useJobTypeOptions } from '../../../hooks/useJobTypeOptions.js';
import {
    formatLocationDisplay,
    formatSalaryInputDisplay,
    getMinApplicationDeadline,
    JOB_POST_MAX_REQUIRED_CANDIDATES,
    parseSalaryInput,
    sameSkillId,
} from '../../../services/jobPostService.js';
import RequiredMark from '../../common/RequiredMark.jsx';
import RichTextEditor from '../../common/RichTextEditor.jsx';
import DateTimeInput24h from '../../common/DateTimeInput24h.jsx';
import JobShiftFields from './JobShiftFields.jsx';

const JobPostForm = ({
    form,
    onChange,
    onFieldBlur,
    businessLocation,
    errors = {},
    disabled = false,
    onOpenAiDesc,
    skillsCatalog = [],
    skillsLoading = false,
    educationLevelOptions = [],
}) => {
    const minApplicationDeadline = getMinApplicationDeadline();
    const jobTypeOptions = useJobTypeOptions();

    const setField = (field, value) => {
        onChange({ ...form, [field]: value });
    };

    const blur = (field) => () => onFieldBlur?.(field);

    const handleSalaryChange = (field) => (e) => {
        setField(field, parseSalaryInput(e.target.value));
    };

    const toggleSkill = (skillId) => {
        const ids = form.skillIds || [];
        const exists = ids.some((id) => sameSkillId(id, skillId));
        const next = exists
            ? ids.filter((id) => !sameSkillId(id, skillId))
            : [...ids, skillId];
        setField('skillIds', next);
    };

    const toggleJobType = (value) => {
        const current = form.jobTypes || [];
        const exists = current.includes(value);
        if (!exists && current.length >= JOB_POST_MAX_JOB_TYPES) return;
        const next = exists
            ? current.filter((code) => code !== value)
            : [...current, value];
        setField('jobTypes', next);
    };

    const handleEducationModeChange = (mode) => {
        onChange({
            ...form,
            educationRequirementMode: mode,
            minEducationLevel: mode === 'MIN' ? form.minEducationLevel : '',
        });
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

                <div className="job-post-form__field">
                    <span className="job-post-form__label">
                        Ngành nghề
                        <RequiredMark />
                    </span>
                    <div className="job-post-form__chips">
                        {jobTypeOptions.map((opt) => {
                            const active = (form.jobTypes || []).includes(opt.value);
                            const atMax =
                                !active &&
                                (form.jobTypes || []).length >= JOB_POST_MAX_JOB_TYPES;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    disabled={disabled || atMax}
                                    className={`job-post-form__chip${
                                        active ? ' job-post-form__chip--active' : ''
                                    }`}
                                    onClick={() => toggleJobType(opt.value)}
                                    onBlur={blur('jobTypes')}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                    <p className="job-post-form__hint">
                        Chọn 1–{JOB_POST_MAX_JOB_TYPES} ngành nghề phù hợp với tin tuyển dụng.
                    </p>
                    {errors.jobTypes && (
                        <p className="job-post-form__error">{errors.jobTypes}</p>
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

                <div className="job-post-form__salary-quantity-block">
                    <div className="job-post-form__field">
                        <label htmlFor="salary-min">Lương tối thiểu (/giờ)</label>
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
                        <label htmlFor="salary-max">Lương tối đa (/giờ)</label>
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
                            max={JOB_POST_MAX_REQUIRED_CANDIDATES}
                            value={form.requiredCandidates}
                            disabled={disabled}
                            onChange={(e) => setField('requiredCandidates', e.target.value)}
                            onBlur={blur('requiredCandidates')}
                        />
                    </div>
                    <p className="job-post-form__hint job-post-form__hint--salary">
                        Lương theo giờ (₫/giờ). Nên nhập cả mức tối thiểu và tối đa.
                    </p>
                    <p className="job-post-form__hint job-post-form__hint--candidates">
                        Tối thiểu 1, tối đa {JOB_POST_MAX_REQUIRED_CANDIDATES} người.
                    </p>
                    {errors.salaryMax && (
                        <p className="job-post-form__error job-post-form__error--salary">
                            {errors.salaryMax}
                        </p>
                    )}
                    {errors.requiredCandidates && (
                        <p className="job-post-form__error job-post-form__error--candidates">
                            {errors.requiredCandidates}
                        </p>
                    )}
                </div>

                <div className="job-post-form__row">
                    <div className="job-post-form__field job-post-form__field--deadline">
                        <label htmlFor="application-deadline">
                            Hạn nộp hồ sơ
                            <RequiredMark />
                        </label>
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
                <h2 className="job-post-form__section-title">Yêu cầu ứng viên</h2>

                <div className="job-post-form__requirements-grid">
                    <div className="job-post-form__field">
                        <label htmlFor="min-age">Tuổi tối thiểu</label>
                        <input
                            id="min-age"
                            type="number"
                            min="15"
                            max="80"
                            value={form.minAge}
                            disabled={disabled}
                            placeholder="VD: 18"
                            onChange={(e) => setField('minAge', e.target.value)}
                            onBlur={blur('minAge')}
                        />
                    </div>
                    <div className="job-post-form__field">
                        <label htmlFor="max-age">Tuổi tối đa</label>
                        <input
                            id="max-age"
                            type="number"
                            min="15"
                            max="80"
                            value={form.maxAge}
                            disabled={disabled}
                            placeholder="VD: 45"
                            onChange={(e) => setField('maxAge', e.target.value)}
                            onBlur={blur('maxAge')}
                        />
                    </div>
                    <div className="job-post-form__field">
                        <label htmlFor="gender-requirement">Giới tính</label>
                        <select
                            id="gender-requirement"
                            value={form.genderRequirement || 'ANY'}
                            disabled={disabled}
                            onChange={(e) => setField('genderRequirement', e.target.value)}
                        >
                            {GENDER_REQUIREMENT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="job-post-form__field">
                        <label htmlFor="education-mode">Trình độ học vấn</label>
                        <select
                            id="education-mode"
                            value={form.educationRequirementMode || 'NONE'}
                            disabled={disabled}
                            onChange={(e) => handleEducationModeChange(e.target.value)}
                        >
                            {EDUCATION_REQUIREMENT_MODES.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {form.educationRequirementMode === 'MIN' ? (
                        <div className="job-post-form__field">
                            <label htmlFor="min-education-level">
                                Bậc học tối thiểu
                                <RequiredMark />
                            </label>
                            <select
                                id="min-education-level"
                                value={form.minEducationLevel || ''}
                                disabled={disabled}
                                onChange={(e) => setField('minEducationLevel', e.target.value)}
                                onBlur={blur('minEducationLevel')}
                            >
                                <option value="">— Chọn bậc học —</option>
                                {educationLevelOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}
                </div>
                {(errors.minAge || errors.maxAge) && (
                    <p className="job-post-form__error">{errors.maxAge || errors.minAge}</p>
                )}
                {errors.minEducationLevel && (
                    <p className="job-post-form__error">{errors.minEducationLevel}</p>
                )}
            </section>

            <section className="job-post-form__section">
                <h2 className="job-post-form__section-title">Kỹ năng yêu cầu</h2>
                {skillsLoading ? (
                    <p className="job-post-form__hint">Đang tải danh sách kỹ năng…</p>
                ) : skillsCatalog.length === 0 ? (
                    <p className="job-post-form__hint">
                        Chưa có kỹ năng nào trong hệ thống. Liên hệ admin để bổ sung.
                    </p>
                ) : (
                    <div className="job-post-form__chips">
                        {skillsCatalog.map((skill) => {
                            const active = (form.skillIds || []).some((id) =>
                                sameSkillId(id, skill.id)
                            );
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
                )}
            </section>

            <section className="job-post-form__section">
                <JobShiftFields
                    shiftBlocks={form.shiftBlocks}
                    error={errors.shiftBlocks}
                    onChange={(shiftBlocks) => setField('shiftBlocks', shiftBlocks)}
                />
            </section>

            <section className="job-post-form__section">
                <div className="job-post-form__field-label-row">
                    <h2 className="job-post-form__section-title job-post-form__section-title--inline">
                        Mô tả công việc
                    </h2>
                    <button
                        type="button"
                        className="job-post-form__ai-btn"
                        disabled={disabled}
                        onClick={onOpenAiDesc}
                    >
                        Gợi ý bằng AI
                    </button>
                </div>
                <p className="job-post-form__ai-hint">
                    AI dùng thông tin bạn đã nhập phía trên. Thêm ngành nghề, lương,
                    kỹ năng và yêu cầu ứng viên sẽ giúp mô tả sát hơn.
                </p>
                <div className="job-post-form__field">
                    <RichTextEditor
                        rows={8}
                        value={form.description}
                        disabled={disabled}
                        placeholder="Mô tả chi tiết công việc..."
                        onChange={(value) => setField('description', value)}
                    />
                </div>
            </section>
        </form>
    );
};

export default JobPostForm;
