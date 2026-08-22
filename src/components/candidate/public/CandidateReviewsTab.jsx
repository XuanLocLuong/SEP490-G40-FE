import CandidateReceivedReviewsPanel from '../CandidateReceivedReviewsPanel.jsx';

const CandidateReviewsTab = ({ userId }) => (
    <div className="cpp-tab-panel">
        <CandidateReceivedReviewsPanel
            userId={userId}
            title="Đánh giá nhận được"
            emptyText="Ứng viên chưa có đánh giá công khai."
            missingUserIdText="Không tải được đánh giá. Hãy mở hồ sơ từ danh sách ứng viên hoặc lời mời để truyền đủ thông tin."
        />
    </div>
);

export default CandidateReviewsTab;
