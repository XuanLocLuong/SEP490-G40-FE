import TimeInput24h from './TimeInput24h.jsx';
import { joinDateTimeLocal, splitDateTimeLocal } from '../../services/jobPostService.js';
import '../../assets/styles/DateTimeInput24h.css';

const todayDateString = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/**
 * Chọn ngày + giờ 24h. Giá trị "YYYY-MM-DDTHH:mm" (tương thích datetime-local).
 */
const DateTimeInput24h = ({
    value,
    onChange,
    onBlur,
    min = '',
    disabled = false,
    id,
    className = '',
}) => {
    const { date, time } = splitDateTimeLocal(value);
    const { date: minDate } = splitDateTimeLocal(min);
    const rootClass = ['datetime-input-24h', className].filter(Boolean).join(' ');

    const emitChange = (nextDate, nextTime) => {
        onChange?.(joinDateTimeLocal(nextDate, nextTime));
    };

    const handleDateChange = (nextDate) => {
        emitChange(nextDate, time || splitDateTimeLocal(min).time || '08:00');
    };

    const handleTimeChange = (nextTime) => {
        const nextDate = date || minDate || todayDateString();
        emitChange(nextDate, nextTime);
    };

    return (
        <div className={rootClass} id={id}>
            <input
                type="date"
                className="datetime-input-24h__date"
                value={date}
                min={minDate || undefined}
                disabled={disabled}
                aria-label="Ngày"
                onChange={(e) => handleDateChange(e.target.value)}
                onBlur={onBlur}
            />
            <TimeInput24h
                className="datetime-input-24h__time"
                value={time || splitDateTimeLocal(min).time || '08:00'}
                disabled={disabled}
                onChange={handleTimeChange}
            />
        </div>
    );
};

export default DateTimeInput24h;
