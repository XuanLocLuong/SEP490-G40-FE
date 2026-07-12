import { useRef } from 'react';
import { UploadCloudIcon } from './profileIcons.jsx';

// Card Portfolio (theo ảnh thiết kế). Nếu đã có link portfolio thì hiển thị nút xem,
// chưa có thì cho tải lên. Việc upload thực tế phụ thuộc endpoint BE nên chỉ bắn callback.
const PortfolioCard = ({ portfolioUrl, onUpload, disabled }) => {
    const inputRef = useRef(null);

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) onUpload?.(file);
    };

    return (
        <section className="cp-card cp-portfolio">
            <h3 className="cp-portfolio__title">Portfolio của bạn</h3>
            <p className="cp-portfolio__desc">
                Tải lên các dự án của bạn để gây ấn tượng với nhà tuyển dụng.
            </p>

            {portfolioUrl ? (
                <a className="cp-btn cp-btn--light" href={portfolioUrl} target="_blank" rel="noreferrer">
                    Xem portfolio
                </a>
            ) : (
                <button
                    type="button"
                    className="cp-btn cp-btn--light"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled}
                >
                    <UploadCloudIcon width={16} height={16} /> Tải lên ngay
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                hidden
                onChange={handleChange}
            />
        </section>
    );
};

export default PortfolioCard;
