import { useState } from 'react';
import { ChevronDownIcon } from '../../common/icons.jsx';
import CandidateReceivedReviewsPanel from '../CandidateReceivedReviewsPanel.jsx';

/**
 * Expandable reviews block under public CV.
 * Panel mounts only when expanded so API is not called until opened.
 */
const CandidateReviewsAccordion = ({ userId }) => {
    const [open, setOpen] = useState(false);

    return (
        <section className="cpp-reviews-acc">
            <button
                type="button"
                className={
                    'cpp-reviews-acc__toggle' + (open ? ' cpp-reviews-acc__toggle--open' : '')
                }
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className="cpp-reviews-acc__label">Đánh giá nhận được</span>
                <span className="cpp-reviews-acc__hint">
                    {open ? 'Thu gọn' : 'Xem đánh giá'}
                </span>
                <ChevronDownIcon
                    className="cpp-reviews-acc__chevron"
                    width={18}
                    height={18}
                    aria-hidden
                />
            </button>

            {open && (
                <div className="cpp-reviews-acc__body">
                    <CandidateReceivedReviewsPanel
                        userId={userId}
                        title=""
                        emptyText="Ứng viên chưa có đánh giá công khai."
                        missingUserIdText="Không tải được đánh giá. Hãy mở hồ sơ từ danh sách ứng viên hoặc lời mời để truyền đủ thông tin."
                    />
                </div>
            )}
        </section>
    );
};

export default CandidateReviewsAccordion;
