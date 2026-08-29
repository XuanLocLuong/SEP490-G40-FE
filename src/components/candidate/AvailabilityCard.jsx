import { CalendarIcon, PencilIcon } from './profileIcons.jsx';
import { ClockIcon } from '../common/icons.jsx';
import { WEEKDAYS, getWeekdayShort } from './availabilityConstants.js';

export const formatTimeDisplay = (time) => {
    if (!time) return '';
    const [hour = '00', minute = '00'] = String(time).split(':');
    return `${hour.padStart(2, '0')}:${minute.slice(0, 2).padStart(2, '0')}`;
};

export const formatDateDisplay = (value) => {
    if (!value) return '';
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toLocaleDateString('vi-VN');
};

export const formatDateRange = (startDate, endDate) => {
    const start = formatDateDisplay(startDate);
    const end = formatDateDisplay(endDate);
    if (start && end) return `${start} – ${end}`;
    if (start) return `Từ ${start}`;
    if (end) return `Đến ${end}`;
    return '';
};

export const AvailabilitySummaryRow = ({ slot }) => {
    const selected = new Set(slot.days || []);

    return (
        <div className="cp-availability-summary__row">
            <div className="cp-availability-summary__days" aria-label="Các ngày trong tuần">
                {WEEKDAYS.map((day) => (
                    <span
                        key={day.value}
                        className={
                            'cp-availability-summary__day' +
                            (selected.has(day.value) ? ' cp-availability-summary__day--active' : '')
                        }
                    >
                        {getWeekdayShort(day.value)}
                    </span>
                ))}
            </div>
            <div className="cp-availability-summary__time">
                <ClockIcon width={16} height={16} />
                <span>
                    {formatTimeDisplay(slot.start)} - {formatTimeDisplay(slot.end)}
                </span>
            </div>
        </div>
    );
};

// SECTION 8 — Availability entry point trên Candidate Profile.
// Khi đã có lịch: hiển thị summary (ảnh thiết kế). Khi chưa có: empty state.
const AvailabilityCard = ({
    slots = [],
    startDate = '',
    endDate = '',
    scheduleMode = null,
    loading = false,
    onSetup,
}) => {
    const hasSchedule = slots.length > 0;
    const dateRangeLabel = formatDateRange(startDate, endDate);
    const modeLabel =
        scheduleMode === 'MANUAL'
            ? 'Tự nhập'
            : scheduleMode === 'CALCULATED' || !scheduleMode
              ? 'Tự động'
              : null;

    return (
        <section className="cp-card cp-availability-card">
            <div className="cp-card__head">
                <div>
                    <h2 className="cp-card__title">Thời gian có thể đi làm</h2>
                    <p className="cp-availability-card__subtitle">
                        Các khung giờ bạn có thể nhận việc (tính tự động từ lịch bận hoặc tự thiết lập)
                    </p>
                </div>
                <div className="cp-availability-card__head-actions">
                    {modeLabel && hasSchedule ? (
                        <span className="cp-availability-card__mode">{modeLabel}</span>
                    ) : null}
                    {hasSchedule && (
                        <button type="button" className="cp-text-btn" onClick={onSetup}>
                            <PencilIcon width={15} height={15} />
                            Chỉnh sửa
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="cp-availability-summary cp-availability-summary--loading">
                    <div className="cp-skeleton cp-skeleton--line cp-skeleton--w80" />
                    <div className="cp-skeleton cp-skeleton--line cp-skeleton--w60" />
                </div>
            ) : hasSchedule ? (
                <div className="cp-availability-summary">
                    {dateRangeLabel ? (
                        <p className="cp-availability-summary__range">
                            Áp dụng: {dateRangeLabel}
                        </p>
                    ) : null}
                    {slots.map((slot, index) => (
                        <AvailabilitySummaryRow key={slot.clientId || slot.id || index} slot={slot} />
                    ))}
                </div>
            ) : (
                <div className="cp-availability-empty">
                    <CalendarIcon width={26} height={26} className="cp-availability-empty__icon" />
                    <p className="cp-availability-empty__text">
                        Bạn chưa cập nhật thời gian có thể đi làm. Cập nhật thời khóa biểu hoặc điền lịch để hệ thống đề xuất công việc phù hợp với bạn.
                    </p>
                    <button type="button" className="cp-btn cp-btn--primary" onClick={onSetup}>
                        Thiết lập thời gian đi làm
                    </button>
                </div>
            )}
        </section>
    );
};

export default AvailabilityCard;
