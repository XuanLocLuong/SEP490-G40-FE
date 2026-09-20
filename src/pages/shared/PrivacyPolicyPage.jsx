import { useEffect, useState } from 'react';
import '../../assets/styles/LegalPageStyle.css';

const TABS = {
    PRIVACY: 'privacy',
    TERMS: 'terms',
};

const PrivacyPolicyPage = () => {
    const [activeTab, setActiveTab] = useState(TABS.PRIVACY);

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title =
            activeTab === TABS.PRIVACY
                ? 'Chính sách bảo mật dữ liệu — JobLink'
                : 'Điều khoản sử dụng dịch vụ — JobLink';
    }, [activeTab]);

    return (
        <div className="legal-page-wrapper">
            <div className="legal-page-container">
                <header className="legal-header">
                    <div className="legal-badge">
                        <span aria-hidden="true">{activeTab === TABS.PRIVACY ? '🛡️' : '📜'}</span>{' '}
                        {activeTab === TABS.PRIVACY
                            ? 'Nghị định 13/2023/NĐ-CP'
                            : 'Quy chế & Thỏa thuận người dùng'}
                    </div>
                    <h1 className="legal-title">
                        {activeTab === TABS.PRIVACY
                            ? 'Chính sách bảo mật dữ liệu cá nhân'
                            : 'Điều khoản sử dụng dịch vụ JobLink'}
                    </h1>
                    <div className="legal-meta">
                        <span>Nền tảng tuyển dụng thông minh <strong>JobLink</strong></span>
                    </div>
                </header>

                <nav className="legal-tabs" aria-label="Điều hướng tài liệu pháp lý">
                    <button
                        type="button"
                        className={`legal-tab-btn${activeTab === TABS.PRIVACY ? ' legal-tab-btn--active' : ''}`}
                        onClick={() => setActiveTab(TABS.PRIVACY)}
                    >
                        Chính sách bảo mật
                    </button>
                    <button
                        type="button"
                        className={`legal-tab-btn${activeTab === TABS.TERMS ? ' legal-tab-btn--active' : ''}`}
                        onClick={() => setActiveTab(TABS.TERMS)}
                    >
                        Điều khoản sử dụng
                    </button>
                </nav>

                {activeTab === TABS.PRIVACY ? (
                    <div className="legal-content">
                        <p className="legal-intro">
                            Chính sách này giải thích cách <strong>JobLink</strong> thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân khi bạn sử dụng nền tảng kết nối tuyển dụng. Việc xử lý dữ liệu được thực hiện nghiêm túc, minh bạch và hoàn toàn phù hợp với <strong>Nghị định 13/2023/NĐ-CP</strong> của Chính phủ về bảo vệ dữ liệu cá nhân.
                        </p>

                        <section className="legal-section">
                            <h2 className="legal-section-title">
                                <span className="legal-section-num">1</span>
                                Phạm vi áp dụng
                            </h2>
                            <p className="legal-text">
                                Chính sách này áp dụng cho toàn bộ người dùng của nền tảng JobLink, bao gồm <strong>Ứng viên (Candidate)</strong> và <strong>Nhà tuyển dụng (Recruiter)</strong>, khi truy cập, đăng ký và sử dụng các tính năng trên website cũng như các ứng dụng trực thuộc JobLink.
                            </p>
                        </section>

                        <section className="legal-section">
                            <h2 className="legal-section-title">
                                <span className="legal-section-num">2</span>
                                Dữ liệu chúng tôi thu thập
                            </h2>
                            <p className="legal-text">JobLink chỉ thu thập các dữ liệu cần thiết phục vụ cho quá trình kết nối việc làm và tuân thủ quy định pháp luật:</p>
                            <ul className="legal-list">
                                <li>
                                    <strong>Thông tin tài khoản:</strong> Địa chỉ email, mật khẩu (được mã hóa một chiều), số điện thoại liên lạc, thông tin xác thực tài khoản Google (khi bạn chọn đăng nhập nhanh).
                                </li>
                                <li>
                                    <strong>Thông tin hồ sơ & hoạt động:</strong>
                                    <ul style={{ marginTop: '6px', listStyleType: 'circle' }}>
                                        <li><em>Ứng viên:</em> Họ tên, thông tin học vấn, kỹ năng, kinh nghiệm, hồ sơ ứng tuyển (CV), lịch sử ứng tuyển, nhu cầu tìm việc (mức lương, lĩnh vực và địa điểm tìm việc mong muốn), thời gian có thể đi làm và các trao đổi trực tiếp với nhà tuyển dụng.</li>
                                        <li><em>Nhà tuyển dụng:</em> Hồ sơ doanh nghiệp, thông tin người đại diện, tin tuyển dụng đăng tải, lịch sử xử lý và phản hồi ứng viên.</li>
                                    </ul>
                                </li>
                                <li>
                                    <strong>Dữ liệu xác minh danh tính:</strong>
                                    <ul style={{ marginTop: '6px', listStyleType: 'circle' }}>
                                        <li><em>Nhà tuyển dụng:</em> Giấy chứng nhận đăng ký kinh doanh/hộ kinh doanh, mã số thuế, CCCD người đại diện pháp lý (khi thực hiện quy trình xác thực theo yêu cầu để được cấp huy hiệu "Đã xác minh").</li>
                                    </ul>
                                </li>
                            </ul>
                        </section>

                        <section className="legal-section">
                            <h2 className="legal-section-title">
                                <span className="legal-section-num">3</span>
                                Mục đích sử dụng dữ liệu
                            </h2>
                            <p className="legal-text">Toàn bộ dữ liệu được sử dụng cho các mục đích chính đáng sau:</p>
                            <ul className="legal-list">
                                <li><strong>Cung cấp dịch vụ kết nối việc làm:</strong> Hiển thị hồ sơ phù hợp với tin tuyển dụng, xử lý ứng tuyển, gửi lời mời phỏng vấn và gợi ý việc làm.</li>
                                <li><strong>Xác thực danh tính (Optional) & Đánh giá độ tin cậy (Trust Score):</strong> Phòng ngừa tài khoản giả mạo, tin tuyển dụng ảo, lừa đảo và xây dựng môi trường an toàn.</li>
                                <li><strong>Liên lạc & Thông báo:</strong> Cập nhật trạng thái ứng tuyển, tin nhắn trao đổi, nâng cấp dịch vụ và hỗ trợ kỹ thuật.</li>
                                <li><strong>Tuân thủ nghĩa vụ pháp luật & Bảo vệ an ninh:</strong> Thực hiện các nghĩa vụ pháp lý và bảo vệ hệ thống trước các mối đe dọa an ninh mạng.</li>
                            </ul>
                        </section>

                        <section className="legal-section">
                            <h2 className="legal-section-title">
                                <span className="legal-section-num">4</span>
                                Căn cứ đồng ý của chủ thể dữ liệu
                            </h2>
                            <p className="legal-text">
                                Bằng việc đăng ký tài khoản hoặc nộp hồ sơ xác minh trên JobLink, bạn đồng ý rõ ràng với các mục đích xử lý dữ liệu được nêu trong Chính sách này.
                            </p>
                        </section>

                        <section className="legal-section">
                            <h2 className="legal-section-title">
                                <span className="legal-section-num">5</span>
                                Lưu trữ & Bảo mật dữ liệu
                            </h2>
                            <p className="legal-text">JobLink cam kết áp dụng các biện pháp bảo vệ dữ liệu tiên tiến:</p>
                            <ul className="legal-list">
                                <li><strong>Mã hóa mật khẩu:</strong> Mật khẩu được băm một chiều bằng thuật toán an toàn tiêu chuẩn ngành.</li>
                                <li><strong>Bảo mật đường truyền:</strong> Toàn bộ kết nối truyền tải qua giao thức bảo mật.</li>
                                <li><strong>Kiểm soát tài liệu xác minh:</strong> Ảnh giấy tờ xác minh (CCCD, GPKD) được lưu trữ trên hạ tầng bảo mật riêng biệt, phân quyền truy cập nghiêm ngặt (chỉ nhân sự có thẩm quyền trong bộ phận kiểm duyệt được phép tiếp cận để xác thực).</li>
                            </ul>
                        </section>

                        <section className="legal-section">
                            <h2 className="legal-section-title">
                                <span className="legal-section-num">6</span>
                                Thời gian lưu trữ dữ liệu
                            </h2>
                            <div className="legal-table-wrap">
                                <table className="legal-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '35%' }}>Loại dữ liệu</th>
                                            <th>Thời gian lưu trữ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Dữ liệu tài khoản</strong></td>
                                            <td>Trong suốt thời gian tài khoản hoạt động trên hệ thống.</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Dữ liệu hồ sơ / CV / tin tuyển dụng</strong></td>
                                            <td>Đến khi người dùng xóa hoặc tài khoản đóng.</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Dữ liệu xác minh CCCD / GPKD</strong></td>
                                            <td>Sẽ được xoá trên hệ thống sau khi bộ phần kiểm tra xác thực thành công hoặc sau 30 ngày nếu như không có hành động kiểm duyệt nào kể từ lúc người dùng gửi các yêu cầu xác thực.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="legal-section">
                            <h2 className="legal-section-title">
                                <span className="legal-section-num">7</span>
                                Quyền của bạn (theo Nghị định 13/2023/NĐ-CP)
                            </h2>
                            <ul className="legal-list">
                                <li><strong>Quyền được biết:</strong> Về hoạt động xử lý dữ liệu cá nhân của mình.</li>
                                <li><strong>Quyền đồng ý:</strong> Cho phép hoặc không cho phép xử lý dữ liệu.</li>
                                <li><strong>Quyền truy cập:</strong> Xem, chỉnh sửa thông tin cá nhân trong trang cá nhân.</li>
                                <li><strong>Quyền khiếu nại, tố cáo hoặc khởi kiện:</strong> Theo quy định pháp luật nếu phát hiện vi phạm bảo vệ dữ liệu.</li>
                            </ul>
                        </section>
                    </div>
                ) : (
                    <div className="legal-content">
                        <p className="legal-intro">
                            Chào mừng bạn đến với <strong>JobLink</strong>. Bằng việc truy cập hoặc tạo tài khoản trên JobLink, bạn đồng ý tuân thủ và chịu ràng buộc bởi các Điều khoản sử dụng dịch vụ dưới đây.
                        </p>

                        <section className="legal-section">
                            <h2 className="legal-section-title">
                                <span className="legal-section-num">1</span>
                                Giới thiệu & Chấp thuận điều khoản
                            </h2>
                            <p className="legal-text">
                                JobLink là nền tảng công nghệ kết nối trực tiếp giữa Ứng viên (đặc biệt là sinh viên và người tìm việc bán thời gian) với các Đơn vị tuyển dụng uy tín. Thỏa thuận này xác lập quyền lợi và trách nhiệm pháp lý giữa Người dùng và Ban quản trị JobLink.
                            </p>
                        </section>

                        <section className="legal-section">
                            <h2 className="legal-section-title">
                                <span className="legal-section-num">2</span>
                                Tài khoản & Trách nhiệm bảo mật
                            </h2>
                            <ul className="legal-list">
                                <li>Người dùng phải cung cấp thông tin chính xác, trung thực khi đăng ký tài khoản.</li>
                                <li>Bạn có trách nhiệm tự bảo mật mật khẩu và thiết bị đăng nhập. Mọi hoạt động phát sinh từ tài khoản của bạn được coi là hành động của chính bạn.</li>
                                <li>Nếu phát hiện tài khoản bị xâm phạm, bạn cần thông báo ngay cho đội ngũ hỗ trợ JobLink.</li>
                            </ul>
                        </section>

                        <section className="legal-section">
                            <h2 className="legal-section-title">
                                <span className="legal-section-num">3</span>
                                Quy định dành cho Ứng viên (Candidate)
                            </h2>
                            <ul className="legal-list">
                                <li><strong>Thông tin hồ sơ:</strong> Cam kết toàn bộ thông tin kỹ năng, bằng cấp, kinh nghiệm, trường học, MSSV là đúng sự thật.</li>
                                <li><strong>Thái độ ứng tuyển:</strong> Chỉ nộp đơn vào các vị trí thực sự có nhu cầu làm việc, tôn trọng lịch phỏng vấn và giao tiếp chuyên nghiệp.</li>
                                <li><strong>Bảo mật thông tin:</strong> Không phát tán trái phép các tài liệu, đề thi hoặc thông tin nội bộ của nhà tuyển dụng ra bên ngoài.</li>
                            </ul>
                        </section>

                        <section className="legal-section">
                            <h2 className="legal-section-title">
                                <span className="legal-section-num">4</span>
                                Quy định dành cho Nhà tuyển dụng (Recruiter)
                            </h2>
                            <ul className="legal-list">
                                <li><strong>Tin tuyển dụng minh bạch:</strong> Mô tả rõ ràng vị trí, yêu cầu, địa điểm và mức thù lao/lương thực tế. Không đăng tin sai sự thật.</li>
                                <li><strong>Nghiêm cấm thu phí:</strong> Tuyệt đối cấm hành vi thu tiền đặt cọc, phí phỏng vấn, phí giữ chỗ, phí tài liệu hoặc ép buộc ứng viên mua hàng hóa dưới mọi hình thức.</li>
                                <li><strong>Bảo mật dữ liệu ứng viên:</strong> Chỉ sử dụng dữ liệu ứng viên cho mục đích tuyển dụng của đơn vị mình, không chia sẻ hay thương mại hóa cho bên thứ ba.</li>
                            </ul>
                        </section>

                        <section className="legal-section">
                            <h2 className="legal-section-title">
                                <span className="legal-section-num">5</span>
                                Hệ thống Điểm tin cậy (Trust Score) & Xác minh danh tính
                            </h2>
                            <p className="legal-text">
                                Nhằm xây dựng môi trường tuyển dụng minh bạch và an toàn, JobLink áp dụng hệ thống đánh giá Điểm tin cậy (Trust Score từ 0 – 100 điểm) dựa trên mức độ xác minh và lịch sử tương tác:
                            </p>
                            <ul className="legal-list">
                                <li>
                                    <strong>Xác thực Nhà tuyển dụng:</strong> Có thể xác minh CCCD người đại diện (với loại hình cá nhân) và bổ sung Giấy phép kinh doanh/Mã số thuế (với doanh nghiệp) để được cấp huy hiệu uy tín.
                                </li>
                                <li>
                                    <strong>Chế tài trừ điểm:</strong> Điểm Trust Score sẽ bị khấu trừ nếu người dùng có hành vi bùng lịch phỏng vấn, hủy việc đột ngột không lý do, đăng tin sai sự thật, hoặc nhận đánh giá 1–2 sao và báo cáo vi phạm đã được kiểm duyệt chính xác.
                                </li>
                            </ul>
                        </section>

                        <section className="legal-section">
                            <h2 className="legal-section-title">
                                <span className="legal-section-num">6</span>
                                Các hành vi bị nghiêm cấm
                            </h2>
                            <div className="legal-callout legal-callout--warning">
                                <strong>Nghiêm cấm tuyệt đối các hành vi sau trên JobLink:</strong>
                                <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                                    <li>Lợi dụng nền tảng để môi giới đa cấp trái phép, cờ bạc hoặc các hoạt động phi pháp.</li>
                                    <li>Đăng tin lừa đảo, giả mạo danh tính cá nhân hoặc thương hiệu doanh nghiệp.</li>
                                    <li>Sử dụng công cụ tự động, crawler cào dữ liệu hoặc gây nghẽn hệ thống.</li>
                                    <li>Quấy rối, sử dụng ngôn từ thô tục, xúc phạm người dùng khác.</li>
                                </ul>
                            </div>
                        </section>

                        <section className="legal-section">
                            <h2 className="legal-section-title">
                                <span className="legal-section-num">7</span>
                                Xử lý vi phạm & Khóa tài khoản
                            </h2>
                            <p className="legal-text">
                                JobLink có toàn quyền cảnh cáo, gỡ bỏ tin đăng, thu hồi phiên đăng nhập hoặc khóa tài khoản vĩnh viễn đưa vào danh sách đen đối với các tài khoản có hành vi vi phạm điều khoản dịch vụ.
                            </p>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
