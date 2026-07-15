import '../../assets/styles/TimeInput24h.css';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const parseTimeValue = (value) => {
    if (!value) return { hour: '08', minute: '00' };
    const [hour = '08', minute = '00'] = String(value).split(':');
    const normalizedHour = Number.parseInt(hour, 10);
    const normalizedMinute = Number.parseInt(minute, 10);
    return {
        hour: Number.isNaN(normalizedHour)
            ? '08'
            : String(Math.min(23, Math.max(0, normalizedHour))).padStart(2, '0'),
        minute: Number.isNaN(normalizedMinute)
            ? '00'
            : String(Math.min(59, Math.max(0, normalizedMinute))).padStart(2, '0'),
    };
};

const buildTimeValue = (hour, minute) => `${hour}:${minute}`;

/**
 * Chọn giờ 24h (00:00–23:59). Giá trị luôn "HH:mm" — không dùng SA/CH.
 */
const TimeInput24h = ({ value, onChange, id, disabled = false, className = '' }) => {
    const { hour, minute } = parseTimeValue(value);

    const emitChange = (nextHour, nextMinute) => {
        onChange?.(buildTimeValue(nextHour, nextMinute));
    };

    const rootClass = ['time-input-24h', className].filter(Boolean).join(' ');

    return (
        <div className={rootClass} id={id}>
            <select
                className="time-input-24h__part"
                value={hour}
                disabled={disabled}
                aria-label="Giờ"
                onChange={(e) => emitChange(e.target.value, minute)}
            >
                {HOURS.map((h) => (
                    <option key={h} value={h}>
                        {h}
                    </option>
                ))}
            </select>
            <span className="time-input-24h__sep" aria-hidden="true">
                :
            </span>
            <select
                className="time-input-24h__part"
                value={minute}
                disabled={disabled}
                aria-label="Phút"
                onChange={(e) => emitChange(hour, e.target.value)}
            >
                {MINUTES.map((m) => (
                    <option key={m} value={m}>
                        {m}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default TimeInput24h;
