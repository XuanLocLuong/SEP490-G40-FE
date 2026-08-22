import { useAuth } from '../../contexts/authContext.js';
import CandidateReceivedReviewsPanel from '../../components/candidate/CandidateReceivedReviewsPanel.jsx';
import '../../assets/styles/CandidatePublicProfile.css';

/**
 * Candidate — xem đánh giá NTD viết về mình.
 * API: GET /candidates/{userId}/reviews với userId từ auth.
 */
const CandidateReceivedReviewsPage = () => {
    const { auth } = useAuth();
    const userId = auth?.userId ?? auth?.id ?? null;

    return (
        <div className="cpp-page">
            <header className="cpp-page-header">
                <h1 className="cpp-page-header__title">Đánh giá nhận được</h1>
                <p className="cpp-page-header__desc">
                    Các đánh giá từ nhà tuyển dụng sau khi bạn hoàn thành công việc.
                </p>
            </header>
            <CandidateReceivedReviewsPanel
                userId={userId}
                emptyText="Bạn chưa nhận được đánh giá nào."
                missingUserIdText="Không xác định được tài khoản. Vui lòng đăng nhập lại."
            />
        </div>
    );
};

export default CandidateReceivedReviewsPage;
