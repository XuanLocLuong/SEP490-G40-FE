import { useEffect, useMemo, useState } from 'react';
import ConfirmModal from '../../common/ConfirmModal.jsx';
import { SearchIcon } from '../../common/icons.jsx';
import { filterSkillsByName } from '../../../utils/skillDisplay.js';

const sameSkillId = (a, b) => a != null && b != null && String(a) === String(b);

/** Popup chọn kỹ năng — pattern giống candidate, chỉ dùng cho form đăng tin recruiter. */
const JobSkillPickerModal = ({
    open,
    catalog = [],
    selectedIds = [],
    onApply,
    onClose,
    disabled = false,
}) => {
    const [draftIds, setDraftIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!open) return;
        setDraftIds([...(selectedIds || [])]);
        setSearchQuery('');
    }, [open, selectedIds]);

    const filteredCatalog = useMemo(
        () => filterSkillsByName(catalog, searchQuery),
        [catalog, searchQuery],
    );

    const toggleDraft = (skillId) => {
        if (disabled) return;
        setDraftIds((prev) => {
            if (prev.some((id) => sameSkillId(id, skillId))) {
                return prev.filter((id) => !sameSkillId(id, skillId));
            }
            return [...prev, skillId];
        });
    };

    const handleApply = () => {
        onApply?.(draftIds);
        onClose?.();
    };

    return (
        <ConfirmModal
            open={open}
            title="Thêm kỹ năng"
            cancelLabel="Hủy"
            confirmLabel="Áp dụng"
            onCancel={onClose}
            onConfirm={handleApply}
        >
            <p className="job-post-skill-picker__hint">
                Bấm để chọn hoặc bỏ chọn. Chỉ cập nhật tin khi bấm Áp dụng.
            </p>

            <div className="job-post-skill-picker__search">
                <SearchIcon
                    className="job-post-skill-picker__search-icon"
                    width={15}
                    height={15}
                    aria-hidden="true"
                />
                <input
                    type="text"
                    className="job-post-skill-picker__search-input"
                    placeholder="Tìm kiếm kỹ năng..."
                    value={searchQuery}
                    disabled={disabled}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery ? (
                    <button
                        type="button"
                        className="job-post-skill-picker__search-clear"
                        disabled={disabled}
                        onClick={() => setSearchQuery('')}
                        aria-label="Xóa tìm kiếm"
                    >
                        ×
                    </button>
                ) : null}
            </div>

            {catalog.length === 0 ? (
                <p className="job-post-skill-picker__empty">Không tải được danh mục kỹ năng.</p>
            ) : filteredCatalog.length === 0 ? (
                <p className="job-post-skill-picker__empty">
                    Không tìm thấy kỹ năng phù hợp với &quot;{searchQuery}&quot;.
                </p>
            ) : (
                <div className="job-post-skill-picker__list" role="listbox" aria-multiselectable="true">
                    {filteredCatalog.map((skill) => {
                        const selected = draftIds.some((id) => sameSkillId(id, skill.id));
                        return (
                            <button
                                key={skill.id}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                disabled={disabled}
                                className={`job-post-skill-picker__chip${
                                    selected ? ' job-post-skill-picker__chip--selected' : ''
                                }`}
                                onClick={() => toggleDraft(skill.id)}
                            >
                                {skill.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {draftIds.length > 0 ? (
                <p className="job-post-skill-picker__count">Đã chọn {draftIds.length} kỹ năng</p>
            ) : null}
        </ConfirmModal>
    );
};

export default JobSkillPickerModal;
