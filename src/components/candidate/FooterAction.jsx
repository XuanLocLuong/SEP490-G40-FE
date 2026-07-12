// SECTION 9 — Footer action: nút Hủy + Lưu hồ sơ (PUT Profile -> toast -> reload).
const FooterAction = ({ onCancel, onSave, saving, dirty }) => {
    return (
        <div className="cp-footer-action">
            <button type="button" className="cp-btn cp-btn--ghost" onClick={onCancel} disabled={saving || !dirty}>
                Hủy
            </button>
            <button type="button" className="cp-btn cp-btn--primary" onClick={onSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </button>
        </div>
    );
};

export default FooterAction;
