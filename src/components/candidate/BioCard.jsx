import { useState } from 'react';
import ProfileModal from './ProfileModal.jsx';
import { PencilIcon } from './profileIcons.jsx';
import { FileTextIcon } from '../common/icons.jsx';

// SECTION — Giới thiệu bản thân (bio). Edit qua modal -> PUT Profile.
const BioCard = ({ bio = '', onSave, saving }) => {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(bio || '');

    const handleOpen = () => {
        setForm(bio || '');
        setOpen(true);
    };

    const handleSubmit = async () => {
        const ok = await onSave((form || '').trim());
        if (ok) setOpen(false);
    };

    const hasData = Boolean((bio || '').trim());

    return (
        <section className="cp-card">
            <div className="cp-card__head">
                <h2 className="cp-card__title">
                    <FileTextIcon className="cp-card__title-icon" width={18} height={18} />
                    Giới thiệu bản thân
                </h2>
                <button
                    type="button"
                    className="cp-icon-btn"
                    onClick={handleOpen}
                    aria-label="Sửa giới thiệu bản thân"
                >
                    <PencilIcon />
                </button>
            </div>

            {!hasData ? (
                <p className="cp-empty-text">Chưa có giới thiệu bản thân.</p>
            ) : (
                <p className="cp-bio-text">{bio}</p>
            )}

            <ProfileModal
                open={open}
                title="Chỉnh sửa giới thiệu bản thân"
                onClose={() => setOpen(false)}
                footer={
                    <>
                        <button
                            type="button"
                            className="cp-btn cp-btn--ghost"
                            onClick={() => setOpen(false)}
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            className="cp-btn cp-btn--primary"
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </>
                }
            >
                <div className="cp-form-group">
                    <label className="cp-form-label" htmlFor="cp-bio-input">
                        Giới thiệu
                    </label>
                    <textarea
                        id="cp-bio-input"
                        className="cp-input cp-textarea"
                        rows={5}
                        maxLength={500}
                        placeholder="VD: Sinh viên năm 3, tìm việc part-time pha chế."
                        value={form}
                        onChange={(e) => setForm(e.target.value)}
                    />
                    <p className="cp-input-hint">{(form || '').length}/500</p>
                </div>
            </ProfileModal>
        </section>
    );
};

export default BioCard;
