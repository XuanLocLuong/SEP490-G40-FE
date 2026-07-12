import { useEffect } from 'react';
import { CloseIcon } from './profileIcons.jsx';

// Modal dùng chung cho các form edit (Job Preference, Personal Info, Education,
// Experience). Đóng bằng nút X, overlay hoặc phím Esc.
const ProfileModal = ({ open, title, onClose, children, footer }) => {
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="cp-modal__overlay" onMouseDown={onClose}>
            <div
                className="cp-modal"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <header className="cp-modal__header">
                    <h3 className="cp-modal__title">{title}</h3>
                    <button type="button" className="cp-modal__close" onClick={onClose} aria-label="Đóng">
                        <CloseIcon />
                    </button>
                </header>
                <div className="cp-modal__body">{children}</div>
                {footer && <footer className="cp-modal__footer">{footer}</footer>}
            </div>
        </div>
    );
};

export default ProfileModal;
