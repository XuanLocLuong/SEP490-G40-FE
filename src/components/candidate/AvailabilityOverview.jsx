import { CalendarIcon, PencilIcon, UploadCloudIcon } from './profileIcons.jsx';
import { formatDaysList } from './availabilityConstants.js';

const AvailabilityOverview = ({ slots, loading, onEdit, onUploadFocus }) => {
    if (loading) {
        return (
            <section className="availability-card availability-overview">
                <div className="availability-skeleton availability-skeleton--title" />
                <div className="availability-skeleton availability-skeleton--line" />
                <div className="availability-skeleton availability-skeleton--line" />
            </section>
        );
    }

    return (
        <section className="availability-card availability-overview">
            <div className="availability-card__header">
                <div>
                    <h2>Lịch rảnh hiện tại</h2>
                    <p>Hiển thị các khung giờ bạn có thể đi làm trong tuần.</p>
                </div>
                <div className="availability-overview__actions">
                    <button type="button" className="availability-btn availability-btn--secondary" onClick={onUploadFocus}>
                        <UploadCloudIcon width={16} height={16} />
                        Upload thời khóa biểu
                    </button>
                    <button type="button" className="availability-btn availability-btn--primary" onClick={onEdit}>
                        <PencilIcon width={16} height={16} />
                        Chỉnh sửa
                    </button>
                </div>
            </div>

            {slots.length === 0 ? (
                <div className="availability-empty-state">
                    <CalendarIcon width={34} height={34} />
                    <h3>Bạn chưa cập nhật lịch rảnh.</h3>
                    <p>Cập nhật thời khóa biểu để hệ thống đề xuất công việc phù hợp với thời gian của bạn.</p>
                    <button type="button" className="availability-btn availability-btn--primary" onClick={onEdit}>
                        Thiết lập lịch rảnh
                    </button>
                </div>
            ) : (
                <div className="availability-overview__table-wrap">
                    <table className="availability-overview__table">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Bắt đầu</th>
                                <th>Kết thúc</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map((slot, index) => (
                                <tr key={slot.clientId || slot.id || index}>
                                    <td>{formatDaysList(slot.days)}</td>
                                    <td>{slot.start}</td>
                                    <td>{slot.end}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default AvailabilityOverview;
