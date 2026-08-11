import { PlusIcon, TrashIcon } from './profileIcons.jsx';
import {
    WEEKDAYS,
    createEmptyAvailabilitySlot,
    getWeekdayShort,
} from './availabilityConstants.js';

const AvailabilityEditor = ({
    slots,
    onChange,
    errors = {},
    readOnly = false,
    embedded = false,
    title = 'Khung giờ rảnh của bạn (Có thể chỉnh sửa)',
    emptyText = 'Chưa có khung giờ. Hãy thêm thủ công hoặc tải lịch bận để AI gợi ý.',
    addButtonLabel = 'Thêm khung giờ rảnh thủ công',
}) => {
    const updateSlot = (index, patch) => {
        onChange(slots.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...patch } : slot)));
    };

    const toggleDay = (index, dayValue) => {
        const currentDays = slots[index]?.days || [];
        const nextDays = currentDays.includes(dayValue)
            ? currentDays.filter((day) => day !== dayValue)
            : [...currentDays, dayValue];
        updateSlot(index, { days: nextDays });
    };

    const removeSlot = (index) => {
        onChange(slots.filter((_, slotIndex) => slotIndex !== index));
    };

    const addSlot = () => {
        onChange([...slots, createEmptyAvailabilitySlot()]);
    };

    const body = (
        <>
            <div className="availability-card__header">
                <h2>{title}</h2>
            </div>

            <div className="availability-editor__list">
                {slots.length === 0 ? (
                    <div className="availability-editor__empty">{emptyText}</div>
                ) : (
                    slots.map((slot, index) => (
                        <div key={slot.clientId || slot.id || index} className="availability-slot">
                            <div className="availability-slot__days" aria-label="Chọn thứ trong tuần">
                                {WEEKDAYS.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        className={
                                            'availability-day' +
                                            ((slot.days || []).includes(day.value)
                                                ? ' availability-day--active'
                                                : '')
                                        }
                                        onClick={() => !readOnly && toggleDay(index, day.value)}
                                        aria-label={day.label}
                                        aria-pressed={(slot.days || []).includes(day.value)}
                                        disabled={readOnly}
                                    >
                                        {getWeekdayShort(day.value)}
                                    </button>
                                ))}
                            </div>

                            <div className="availability-slot__time">
                                <label>
                                    <span>Từ</span>
                                    <input
                                        type="time"
                                        value={slot.start || ''}
                                        onChange={(e) => updateSlot(index, { start: e.target.value })}
                                        readOnly={readOnly}
                                        disabled={readOnly}
                                    />
                                </label>
                                <label>
                                    <span>Đến</span>
                                    <input
                                        type="time"
                                        value={slot.end || ''}
                                        onChange={(e) => updateSlot(index, { end: e.target.value })}
                                        readOnly={readOnly}
                                        disabled={readOnly}
                                    />
                                </label>
                                {!readOnly ? (
                                    <button
                                        type="button"
                                        className="availability-slot__delete"
                                        onClick={() => removeSlot(index)}
                                        aria-label="Xóa khung giờ"
                                    >
                                        <TrashIcon width={18} height={18} />
                                    </button>
                                ) : null}
                            </div>

                            {errors[index] && <p className="availability-slot__error">{errors[index]}</p>}
                        </div>
                    ))
                )}
            </div>

            {!readOnly ? (
                <button type="button" className="availability-add-btn" onClick={addSlot}>
                    <PlusIcon width={18} height={18} />
                    {addButtonLabel}
                </button>
            ) : null}
        </>
    );

    return embedded ? (
        <div className="availability-editor availability-editor--embedded">{body}</div>
    ) : (
        <section className="availability-card availability-editor">{body}</section>
    );
};

export default AvailabilityEditor;
