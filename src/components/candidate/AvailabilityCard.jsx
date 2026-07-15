import { CalendarIcon, PencilIcon } from './profileIcons.jsx';
import { ClockIcon } from '../common/icons.jsx';
import { WEEKDAYS, getWeekdayShort } from './availabilityConstants.js';

const formatTimeDisplay = (time) => {
    if (!time) return '';
    const [hourText, minute = '00'] = String(time).split(':');
    const hour = Number(hourText);
    if (Number.isNaN(hour)) return time;
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
};

const AvailabilitySummaryRow = ({ slot }) => {
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
const AvailabilityCard = ({ slots = [], loading = false, onSetup }) => {
    const hasSchedule = slots.length > 0;

    return (
        <section className="cp-card cp-availability-card">
            <div className="cp-card__head">
                <h2 className="cp-card__title">Lịch rảnh &amp; Thời khóa biểu</h2>
                {hasSchedule && (
                    <button type="button" className="cp-text-btn" onClick={onSetup}>
                        <PencilIcon width={15} height={15} />
                        Chỉnh sửa
                    </button>
                )}
            </div>

            {loading ? (
                <div className="cp-availability-summary cp-availability-summary--loading">
                    <div className="cp-skeleton cp-skeleton--line cp-skeleton--w80" />
                    <div className="cp-skeleton cp-skeleton--line cp-skeleton--w60" />
                </div>
            ) : hasSchedule ? (
                <div className="cp-availability-summary">
                    {slots.map((slot, index) => (
                        <AvailabilitySummaryRow key={slot.clientId || slot.id || index} slot={slot} />
                    ))}
                </div>
            ) : (
                <div className="cp-availability-empty">
                    <CalendarIcon width={26} height={26} className="cp-availability-empty__icon" />
                    <p className="cp-availability-empty__text">
                        Bạn chưa cập nhật lịch rảnh. Cập nhật thời khóa biểu để hệ thống đề xuất công việc
                        phù hợp với thời gian của bạn.
                    </p>
                    <button type="button" className="cp-btn cp-btn--primary" onClick={onSetup}>
                        Thiết lập lịch rảnh
                    </button>
                </div>
            )}
        </section>
    );
};

export default AvailabilityCard;
