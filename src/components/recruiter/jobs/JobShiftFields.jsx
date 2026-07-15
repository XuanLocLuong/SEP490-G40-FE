import { DAY_OF_WEEK_OPTIONS } from '../../../constants/jobPost.js';
import { emptyShiftBlock } from '../../../services/jobPostService.js';
import RequiredMark from '../../common/RequiredMark.jsx';

/**
 * UI "Cách 2": mỗi block = nhiều ngày + 1 khung giờ.
 * Parent giữ state shiftBlocks[], component này chỉ render + emit onChange.
 */
const JobShiftFields = ({ shiftBlocks, onChange, error }) => {
    const blocks = shiftBlocks?.length ? shiftBlocks : [emptyShiftBlock()];

    const updateBlock = (index, patch) => {
        const next = blocks.map((block, i) => (i === index ? { ...block, ...patch } : block));
        onChange(next);
    };

    const toggleDay = (index, dayValue) => {
        const block = blocks[index];
        const days = block.days.includes(dayValue)
            ? block.days.filter((d) => d !== dayValue)
            : [...block.days, dayValue];
        updateBlock(index, { days });
    };

    const addBlock = () => {
        onChange([...blocks, emptyShiftBlock()]);
    };

    const removeBlock = (index) => {
        if (blocks.length <= 1) {
            onChange([emptyShiftBlock()]);
            return;
        }
        onChange(blocks.filter((_, i) => i !== index));
    };

    return (
        <div className="job-shift-fields">
            <div className="job-shift-fields__header">
                <label className="job-post-form__label">
                    Khung giờ làm việc
                    <RequiredMark />
                </label>
            </div>

            {blocks.map((block, index) => (
                <div key={block.id || index} className="job-shift-fields__block">
                    <div className="job-shift-fields__days">
                        {DAY_OF_WEEK_OPTIONS.map((day) => {
                            const active = block.days.includes(day.value);
                            return (
                                <button
                                    key={day.value}
                                    type="button"
                                    className={`job-shift-fields__day-chip${
                                        active ? ' job-shift-fields__day-chip--active' : ''
                                    }`}
                                    onClick={() => toggleDay(index, day.value)}
                                >
                                    {day.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="job-shift-fields__times">
                        <div className="job-post-form__field">
                            <label>Bắt đầu</label>
                            <input
                                type="time"
                                value={block.startTime || ''}
                                onChange={(e) => updateBlock(index, { startTime: e.target.value })}
                            />
                        </div>
                        <span className="job-shift-fields__sep">—</span>
                        <div className="job-post-form__field">
                            <label>Kết thúc</label>
                            <input
                                type="time"
                                value={block.endTime || ''}
                                onChange={(e) => updateBlock(index, { endTime: e.target.value })}
                            />
                        </div>
                        <button
                            type="button"
                            className="job-shift-fields__remove"
                            onClick={() => removeBlock(index)}
                            aria-label="Xóa khung giờ"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}

            <button type="button" className="job-shift-fields__add" onClick={addBlock}>
                + Thêm khung giờ
            </button>

            {error && <p className="job-post-form__error">{error}</p>}
        </div>
    );
};

export default JobShiftFields;
