import { useMemo, useRef, useState } from 'react';
import { CloseIcon, PlusIcon } from './profileIcons.jsx';

// SECTION 6 — Skill: render tag + ô "Thêm kỹ năng" có autocomplete từ GET /skills.
// Không hardcode. Thay đổi cập nhật draft (lưu qua nút "Lưu hồ sơ" hoặc modal khác).
const SkillCard = ({ skills, catalog, onChange }) => {
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const blurTimer = useRef(null);

    const selectedIds = useMemo(() => new Set(skills.map((s) => String(s.id ?? s.name))), [skills]);

    const suggestions = useMemo(() => {
        const q = query.trim().toLowerCase();
        return catalog
            .filter((s) => !selectedIds.has(String(s.id ?? s.name)))
            .filter((s) => (q ? s.name.toLowerCase().includes(q) : true))
            .slice(0, 8);
    }, [catalog, query, selectedIds]);

    const addSkill = (skill) => {
        if (!skill) return;
        const key = String(skill.id ?? skill.name);
        if (selectedIds.has(key)) return;
        onChange([...skills, skill]);
        setQuery('');
    };

    const removeSkill = (skill) => {
        const key = String(skill.id ?? skill.name);
        onChange(skills.filter((s) => String(s.id ?? s.name) !== key));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Backend chỉ nhận skillIds dạng số từ danh mục có sẵn — không hỗ trợ
            // kỹ năng tự do, nên chỉ thêm khi có gợi ý khớp trong catalog.
            if (suggestions.length > 0) {
                addSkill(suggestions[0]);
            }
        }
    };

    return (
        <section className="cp-card">
            <div className="cp-card__head">
                <h2 className="cp-card__title">Kỹ năng của bạn</h2>
            </div>

            {skills.length > 0 && (
                <div className="cp-tags cp-tags--gap">
                    {skills.map((skill) => (
                        <span key={skill.id ?? skill.name} className="cp-tag cp-tag--skill">
                            {skill.name}
                            <button
                                type="button"
                                className="cp-tag__remove"
                                onClick={() => removeSkill(skill)}
                                aria-label={`Xóa ${skill.name}`}
                            >
                                <CloseIcon width={13} height={13} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="cp-skill-input">
                <div className="cp-skill-input__wrap">
                    <PlusIcon className="cp-skill-input__icon" width={16} height={16} />
                    <input
                        type="text"
                        className="cp-skill-input__field"
                        placeholder="Thêm kỹ năng..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setFocused(true)}
                        onBlur={() => {
                            blurTimer.current = setTimeout(() => setFocused(false), 150);
                        }}
                    />
                </div>

                {focused && suggestions.length > 0 && (
                    <ul
                        className="cp-autocomplete"
                        onMouseDown={() => clearTimeout(blurTimer.current)}
                    >
                        {suggestions.map((s) => (
                            <li key={s.id ?? s.name}>
                                <button
                                    type="button"
                                    className="cp-autocomplete__item"
                                    onClick={() => {
                                        addSkill(s);
                                        setFocused(true);
                                    }}
                                >
                                    {s.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
};

export default SkillCard;
