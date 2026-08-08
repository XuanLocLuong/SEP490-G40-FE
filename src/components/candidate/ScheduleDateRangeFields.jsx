const ScheduleDateRangeFields = ({ startDate, endDate, onChange, error = '', disabled = false }) => (
    <div className="availability-range__fields">
        <label className="availability-range__field">
            <span>Ngày bắt đầu</span>
            <input
                type="date"
                value={startDate}
                disabled={disabled}
                onChange={(e) => onChange?.({ startDate: e.target.value, endDate })}
            />
        </label>
        <label className="availability-range__field">
            <span>Ngày kết thúc</span>
            <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                disabled={disabled}
                onChange={(e) => onChange?.({ startDate, endDate: e.target.value })}
            />
        </label>
        {error ? <p className="availability-range__error">{error}</p> : null}
    </div>
);

export default ScheduleDateRangeFields;
