import { CalendarIcon } from './profileIcons.jsx';

// SECTION 8 — Availability. Module RIÊNG (CandidateScheduleController),
// KHÔNG dùng Candidate Profile API. Ở đây render empty-state theo thiết kế;
// khi có endpoint schedule thì nối vào onSetup.
const AvailabilityCard = ({ hasSchedule, onSetup }) => {
    return (
        <section className="cp-card">
            <div className="cp-card__head">
                <h2 className="cp-card__title">Lịch rảnh &amp; Thời khóa biểu</h2>
                <button type="button" className="cp-text-btn" onClick={onSetup}>
                    + Cập nhật
                </button>
            </div>

            {hasSchedule ? (
                <p className="cp-empty-text">Đã thiết lập lịch rảnh.</p>
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
