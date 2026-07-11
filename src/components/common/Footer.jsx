import '../../assets/styles/FooterStyle.css';

// Footer dùng chung — xuất hiện giống hệt nhau ở Landing (ảnh 1), Candidate
// Homepage (ảnh 4) và Recruiter Dashboard (ảnh 5). 3 role nội bộ (Admin/
// Post Manager/Manual Check Team) KHÔNG dùng Footer này.
const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="site-footer__inner">
                <span className="site-footer__brand">JobLink</span>

                <span className="site-footer__copyright">
                    © 2026 Nền tảng kết nối việc làm uy tín và thông minh
                </span>

                <nav className="site-footer__links">
                    <a href="#" className="site-footer__link">Điều khoản</a>
                    <a href="#" className="site-footer__link">Bảo mật</a>
                    <a href="#" className="site-footer__link">Liên hệ</a>
                    <a href="#" className="site-footer__link">Trợ giúp</a>
                </nav>
            </div>
        </footer>
    );
};

export default Footer;
