// SECTION 5 — Consent: checkbox đồng ý chia sẻ thông tin.
// Bind vào profile.consentShareInfo, đổi -> cập nhật draft (lưu qua nút "Lưu hồ sơ").
const ConsentCard = ({ checked, onChange }) => {
    return (
        <section className="cp-card cp-consent">
            <label className="cp-consent__label">
                <input
                    type="checkbox"
                    className="cp-consent__checkbox"
                    checked={!!checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className="cp-consent__text">
                    Tôi đồng ý cho phép JobLink thu thập và sử dụng thông tin cá nhân của tôi theo{' '}
                    <a href="#" className="cp-link">
                        Chính sách Bảo mật
                    </a>{' '}
                    nhằm mục đích kết nối việc làm và cải thiện trải nghiệm người dùng.
                </span>
            </label>
        </section>
    );
};

export default ConsentCard;
