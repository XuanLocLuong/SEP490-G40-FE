import { useEffect } from 'react';
import { PhoneIcon, MailIcon, MapPinIcon, ClockIcon } from './icons.jsx';
import '../../assets/styles/ContactModal.css';

const ContactModal = ({ open, onClose }) => {
    useEffect(() => {
        if (!open) return undefined;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <button
                type="button"
                className="contact-modal__backdrop"
                aria-label="Đóng cửa sổ liên hệ"
                onClick={onClose}
            />

            <div className="contact-modal__panel">
                <header className="contact-modal__header">
                    <div className="contact-modal__header-content">
                        <h2 id="contact-modal-title" className="contact-modal__title">
                            Liên hệ & Hỗ trợ JobLink
                        </h2>
                        <p className="contact-modal__subtitle">
                            Đội ngũ Chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn
                        </p>
                    </div>
                    <button
                        type="button"
                        className="contact-modal__close"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </header>

                <div className="contact-modal__body">
                    {/* Hotline Card */}
                    <div className="contact-card">
                        <div className="contact-card__icon-wrap">
                            <PhoneIcon width={22} height={22} />
                        </div>
                        <div className="contact-card__info">
                            <span className="contact-card__label">Hotline Chăm sóc khách hàng</span>
                            <span className="contact-card__value">0868848936</span>
                            <a
                                href="tel:0868848936"
                                className="contact-card__btn"
                            >
                                <PhoneIcon width={14} height={14} /> Gọi ngay
                            </a>
                        </div>
                    </div>

                    {/* Email Card */}
                    <div className="contact-card">
                        <div className="contact-card__icon-wrap">
                            <MailIcon width={22} height={22} />
                        </div>
                        <div className="contact-card__info">
                            <span className="contact-card__label">Hộp thư hỗ trợ & Góp ý</span>
                            <span className="contact-card__value">truongnt.studynwork@gmail.com</span>
                            <a
                                href="mailto:truongnt.studynwork@gmail.com"
                                className="contact-card__btn"
                            >
                                <MailIcon width={14} height={14} /> Gửi thư điện tử
                            </a>
                        </div>
                    </div>

                    {/* Address Card */}
                    <div className="contact-card">
                        <div className="contact-card__icon-wrap">
                            <MapPinIcon width={22} height={22} />
                        </div>
                        <div className="contact-card__info">
                            <span className="contact-card__label">Địa chỉ trụ sở / Văn phòng</span>
                            <span className="contact-card__value" style={{ lineHeight: 1.45 }}>
                                Khu Công nghệ cao Hòa Lạc, Km29 Đại lộ Thăng Long, Thạch Thất, Hà Nội
                            </span>
                        </div>
                    </div>

                    {/* Working Hours note */}
                    <div className="contact-modal__note">
                        <ClockIcon width={16} height={16} style={{ flexShrink: 0 }} />
                        <span>Thời gian tiếp nhận: <strong>08:00 – 18:00</strong> (Thứ Hai – Thứ Bảy)</span>
                    </div>
                </div>

                <footer className="contact-modal__footer">
                    <button
                        type="button"
                        className="contact-modal__btn-close"
                        onClick={onClose}
                    >
                        Đóng
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ContactModal;
