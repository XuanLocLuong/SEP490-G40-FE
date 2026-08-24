import { useMemo, useState } from 'react';
import ProfileModal from './ProfileModal.jsx';
import { CloseIcon, PlusIcon } from './profileIcons.jsx';
import RequiredMark from './RequiredMark.jsx';
import {
    formatRemovedSkillLabels,
    getInactiveSelectedSkillIds,
} from '../../utils/skillDisplay.js';

const skillKey = (skill) => String(skill?.id ?? skill?.name ?? '');

// SECTION 6 — Skill: tag đã chọn + nút mở popup chọn từ catalog GET /skills.
// Chỉ cập nhật draft; lưu thật ở FooterAction "Lưu hồ sơ".
const SkillCard = ({ skills, catalog, catalogReady = true, onChange }) => {
    const [open, setOpen] = useState(false);
    const [draftSkills, setDraftSkills] = useState([]);

    const draftIds = useMemo(() => new Set(draftSkills.map(skillKey)), [draftSkills]);
    const inactiveIds = useMemo(() => {
        if (!catalogReady) return [];
        return getInactiveSelectedSkillIds(
            skills.map((s) => s.id),
            catalog,
        );
    }, [skills, catalog, catalogReady]);
    const inactiveLabels = useMemo(
        () => formatRemovedSkillLabels(inactiveIds, catalog),
        [inactiveIds, catalog],
    );
    const inactiveIdSet = useMemo(
        () => new Set(inactiveIds.map((id) => String(id))),
        [inactiveIds],
    );

    const skillsMissing = skills.length === 0;

    const handleOpen = () => {
        setDraftSkills(skills.filter((s) => !inactiveIdSet.has(String(s.id))));
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setDraftSkills([]);
    };

    const toggleDraftSkill = (skill) => {
        const key = skillKey(skill);
        if (!key) return;
        setDraftSkills((prev) => {
            if (prev.some((s) => skillKey(s) === key)) {
                return prev.filter((s) => skillKey(s) !== key);
            }
            return [...prev, skill];
        });
    };

    const handleApply = () => {
        onChange(draftSkills);
        handleClose();
    };

    const removeSkill = (skill) => {
        const key = skillKey(skill);
        onChange(skills.filter((s) => skillKey(s) !== key));
    };

    return (
        <section className={'cp-card' + (skillsMissing ? ' cp-card--missing-required' : '')}>
            <div className="cp-card__head">
                <h2 className="cp-card__title">
                    Kỹ năng của bạn
                    <RequiredMark />
                </h2>
            </div>

            {skillsMissing && (
                <p className="cp-required-hint">Cần ít nhất 1 kỹ năng để ứng tuyển.</p>
            )}

            {skills.length > 0 && (
                <div className="cp-tags cp-tags--gap">
                    {skills.map((skill) => {
                        const inactive = inactiveIdSet.has(String(skill.id));
                        const inactiveIndex = inactive
                            ? inactiveIds.findIndex((id) => String(id) === String(skill.id))
                            : -1;
                        const label =
                            inactive && inactiveIndex >= 0
                                ? inactiveLabels[inactiveIndex] || skill.name
                                : skill.name;
                        return (
                            <span
                                key={skillKey(skill)}
                                className={
                                    'cp-tag' + (inactive ? ' cp-tag--inactive' : ' cp-tag--skill')
                                }
                                title={inactive ? 'Kỹ năng đã bị vô hiệu hóa' : undefined}
                            >
                                {inactive ? `${label} (đã vô hiệu)` : label}
                                <button
                                    type="button"
                                    className="cp-tag__remove"
                                    onClick={() => removeSkill(skill)}
                                    aria-label={`Xóa ${label}`}
                                >
                                    <CloseIcon width={13} height={13} />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {inactiveIds.length > 0 && (
                <p className="cp-field-hint cp-field-hint--warn">
                    Có kỹ năng đã bị vô hiệu hóa — bấm × để gỡ, hoặc Lưu hồ sơ để hệ thống tự gỡ.
                </p>
            )}

            <button type="button" className="cp-skill-add-btn" onClick={handleOpen}>
                <PlusIcon width={16} height={16} aria-hidden="true" />
                Thêm kỹ năng
            </button>

            <ProfileModal
                open={open}
                title="Thêm kỹ năng"
                onClose={handleClose}
                footer={
                    <>
                        <button type="button" className="cp-btn cp-btn--ghost" onClick={handleClose}>
                            Hủy
                        </button>
                        <button type="button" className="cp-btn cp-btn--primary" onClick={handleApply}>
                            Áp dụng
                        </button>
                    </>
                }
            >
                <p className="cp-skill-picker__hint">
                    Bấm để chọn hoặc bỏ chọn. Chỉ áp dụng vào hồ sơ khi bấm Áp dụng — lưu hệ thống
                    bằng Lưu hồ sơ.
                </p>

                {catalog.length === 0 ? (
                    <p className="cp-empty-text">Không tải được danh mục kỹ năng.</p>
                ) : (
                    <div className="cp-skill-picker" role="listbox" aria-multiselectable="true">
                        {catalog.map((skill) => {
                            const key = skillKey(skill);
                            const selected = draftIds.has(key);
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    className={
                                        'cp-skill-chip' + (selected ? ' cp-skill-chip--selected' : '')
                                    }
                                    onClick={() => toggleDraftSkill(skill)}
                                >
                                    {skill.name}
                                </button>
                            );
                        })}
                    </div>
                )}

                {draftSkills.length > 0 && (
                    <p className="cp-skill-picker__count">Đã chọn {draftSkills.length} kỹ năng</p>
                )}
            </ProfileModal>
        </section>
    );
};

export default SkillCard;
