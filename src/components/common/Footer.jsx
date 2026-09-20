import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/path.js';
import ContactModal from './ContactModal.jsx';
import '../../assets/styles/FooterStyle.css';

// Footer dùng chung — xuất hiện giống hệt nhau ở Landing (ảnh 1), Candidate
// Homepage (ảnh 4) và Recruiter Dashboard (ảnh 5). 3 role nội bộ (Admin/
// Post Manager/Manual Check Team) KHÔNG dùng Footer này.
const Footer = () => {
    const [isContactOpen, setIsContactOpen] = useState(false);

    return (
        <>
            <footer className="site-footer">
                <div className="site-footer__inner">
                    <span className="site-footer__brand">JobLink</span>

                    <span className="site-footer__copyright">
                        © 2026 Nền tảng kết nối việc làm uy tín và thông minh
                    </span>

                    <nav className="site-footer__links">
                        <Link to={ROUTES.PRIVACY} className="site-footer__link">
                            Chính sách & Bảo mật
                        </Link>
                        <button
                            type="button"
                            className="site-footer__link"
                            onClick={() => setIsContactOpen(true)}
                        >
                            Liên hệ & Hỗ trợ
                        </button>
                    </nav>
                </div>
            </footer>

            <ContactModal
                open={isContactOpen}
                onClose={() => setIsContactOpen(false)}
            />
        </>
    );
};

export default Footer;
