import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
    activateSkill,
    createSkill,
    deactivateSkill,
    getApiErrorMessage,
    getSkillCategories,
    searchSkills,
    updateSkill,
} from '../../apis/AdminSkillApi.jsx';
import SkillFormModal from '../../components/admin/SkillFormModal.jsx';
import SkillStatusModal from '../../components/admin/SkillStatusModal.jsx';
import { suggestSkillNames } from '../../utils/skillSearchSuggest.js';
import '../../assets/styles/AdminSkillsPageStyle.css';

const PAGE_SIZE = 20;
const SUGGEST_CATALOG_SIZE = 200;

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'true', label: 'Đang hoạt động' },
    { value: 'false', label: 'Đã vô hiệu' },
];

const AdminSkillsPage = () => {
    const [keyword, setKeyword] = useState('');
    const [keywordInput, setKeywordInput] = useState('');
    const [status, setStatus] = useState('');
    const [category, setCategory] = useState('');
    const [page, setPage] = useState(0);

    const [items, setItems] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState([]);
    const [suggestCatalog, setSuggestCatalog] = useState([]);
    const [keywordFocused, setKeywordFocused] = useState(false);
    const keywordInputRef = useRef(null);
    const skipSuggestOpenRef = useRef(false);

    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [editingSkill, setEditingSkill] = useState(null);
    const [formSaving, setFormSaving] = useState(false);

    const [statusSkill, setStatusSkill] = useState(null);
    const [statusSaving, setStatusSaving] = useState(false);

    const loadCategories = useCallback(async () => {
        try {
            const res = await getSkillCategories();
            const list = res?.data?.data ?? res?.data ?? [];
            setCategories(Array.isArray(list) ? list.filter(Boolean) : []);
        } catch {
            /* filter category là phụ — không chặn trang nếu fail */
        }
    }, []);

    const loadSuggestCatalog = useCallback(async () => {
        try {
            const res = await searchSkills({ page: 0, size: SUGGEST_CATALOG_SIZE });
            const pageData = res?.data?.data ?? res?.data;
            const names = (pageData?.content ?? [])
                .map((s) => s?.name)
                .filter(Boolean);
            setSuggestCatalog(names);
        } catch {
            /* gợi ý là phụ — không chặn trang nếu fail */
        }
    }, []);

    const loadSkills = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                page,
                size: PAGE_SIZE,
            };
            if (keyword.trim()) params.keyword = keyword.trim();
            if (status === 'true' || status === 'false') params.status = status === 'true';
            if (category.trim()) params.category = category.trim();

            const res = await searchSkills(params);
            const pageData = res?.data?.data ?? res?.data;
            setItems(pageData?.content ?? []);
            setTotalPages(pageData?.totalPages ?? 0);
            setTotalElements(pageData?.totalElements ?? 0);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Không thể tải danh sách kỹ năng.'));
            setItems([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }, [page, keyword, status, category]);

    useEffect(() => {
        loadSkills();
    }, [loadSkills]);

    useEffect(() => {
        loadSuggestCatalog();
        loadCategories();
    }, [loadSuggestCatalog, loadCategories]);

    const keywordSuggestions = useMemo(
        () => suggestSkillNames(suggestCatalog, keywordInput, 6),
        [suggestCatalog, keywordInput]
    );
    const showSuggestList = keywordFocused && keywordSuggestions.length > 0;

    const openCreate = () => {
        setFormMode('create');
        setEditingSkill(null);
        setFormOpen(true);
    };

    const openEdit = (skill) => {
        setFormMode('edit');
        setEditingSkill(skill);
        setFormOpen(true);
    };

    const handleFormSubmit = async (payload) => {
        setFormSaving(true);
        try {
            if (formMode === 'edit' && editingSkill?.id) {
                await updateSkill(editingSkill.id, payload);
                toast.success('Đã cập nhật kỹ năng.');
            } else {
                await createSkill(payload);
                toast.success('Đã tạo kỹ năng.');
            }
            setFormOpen(false);
            setEditingSkill(null);
            await Promise.all([loadSuggestCatalog(), loadCategories()]);
            if (page !== 0 && formMode === 'create') setPage(0);
            else await loadSkills();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể lưu kỹ năng.'));
        } finally {
            setFormSaving(false);
        }
    };

    const handleStatusConfirm = async ({ reason }) => {
        if (!statusSkill?.id) return;
        setStatusSaving(true);
        try {
            if (statusSkill.active) {
                await deactivateSkill(statusSkill.id, { reason });
                toast.success('Đã vô hiệu hóa kỹ năng.');
            } else {
                await activateSkill(statusSkill.id, { reason });
                toast.success('Đã kích hoạt kỹ năng.');
            }
            setStatusSkill(null);
            await loadSkills();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể đổi trạng thái kỹ năng.'));
        } finally {
            setStatusSaving(false);
        }
    };

    const applySearch = (e) => {
        e?.preventDefault?.();
        setKeywordFocused(false);
        setPage(0);
        setKeyword(keywordInput);
    };

    const applySuggestedKeyword = (value) => {
        skipSuggestOpenRef.current = true;
        setKeywordInput(value);
        setKeywordFocused(false);
        setPage(0);
        setKeyword(value);
        window.requestAnimationFrame(() => {
            keywordInputRef.current?.focus();
            skipSuggestOpenRef.current = false;
        });
    };

    return (
        <div className="admin-skills-page">
            <header className="admin-skills-page__header">
                <div>
                    <h1 className="admin-skills-page__title">Quản lý kỹ năng</h1>
                    <p className="admin-skills-page__subtitle">
                        Danh mục skill dùng cho hồ sơ ứng viên, yêu cầu job, bộ lọc tìm kiếm và gợi ý.
                    </p>
                </div>
                <button type="button" className="admin-skills-btn admin-skills-btn--primary" onClick={openCreate}>
                    + Thêm kỹ năng
                </button>
            </header>

            <form className="admin-skills-filters" onSubmit={applySearch}>
                <div className="admin-skills-filters__keyword">
                    <input
                        ref={keywordInputRef}
                        className="admin-skills-filters__search"
                        value={keywordInput}
                        onChange={(e) => {
                            setKeywordInput(e.target.value);
                            setKeywordFocused(true);
                        }}
                        onFocus={() => {
                            if (skipSuggestOpenRef.current) return;
                            setKeywordFocused(true);
                        }}
                        onBlur={() => {
                            window.setTimeout(() => setKeywordFocused(false), 180);
                        }}
                        placeholder="Tìm theo tên kỹ năng..."
                        aria-label="Tìm theo tên kỹ năng"
                        aria-autocomplete="list"
                        autoComplete="off"
                    />
                    {showSuggestList ? (
                        <ul className="admin-skills-filters__suggest-list" role="listbox">
                            {keywordSuggestions.map((item) => (
                                <li key={item}>
                                    <button
                                        type="button"
                                        className="admin-skills-filters__suggest-item"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => applySuggestedKeyword(item)}
                                    >
                                        {item}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
                <select
                    value={status}
                    onChange={(e) => {
                        setPage(0);
                        setStatus(e.target.value);
                    }}
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value || 'all'} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <select
                    value={category}
                    onChange={(e) => {
                        setPage(0);
                        setCategory(e.target.value);
                    }}
                >
                    <option value="">Tất cả danh mục</option>
                    {categories.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
                <button type="submit" className="admin-skills-btn admin-skills-btn--ghost">
                    Tìm kiếm
                </button>
            </form>

            {error ? <p className="admin-skills-page__error">{error}</p> : null}

            <div className="admin-skills-table-wrap">
                <table className="admin-skills-table">
                    <thead>
                        <tr>
                            <th>Tên</th>
                            <th>Danh mục</th>
                            <th>Trạng thái</th>
                            <th>Ứng viên</th>
                            <th>Tin tuyển</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="admin-skills-table__empty">
                                    Đang tải...
                                </td>
                            </tr>
                        ) : null}
                        {!loading && items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="admin-skills-table__empty">
                                    Không có kỹ năng nào phù hợp.
                                </td>
                            </tr>
                        ) : null}
                        {items.map((skill) => (
                            <tr key={skill.id}>
                                <td>
                                    <div className="admin-skills-table__name">{skill.name}</div>
                                    {skill.description ? (
                                        <div className="admin-skills-table__desc">{skill.description}</div>
                                    ) : null}
                                </td>
                                <td>{skill.category || '—'}</td>
                                <td>
                                    <span
                                        className={`admin-skills-badge ${
                                            skill.active
                                                ? 'admin-skills-badge--active'
                                                : 'admin-skills-badge--inactive'
                                        }`}
                                    >
                                        {skill.active ? 'Hoạt động' : 'Vô hiệu'}
                                    </span>
                                </td>
                                <td>{skill.candidateUsageCount ?? 0}</td>
                                <td>{skill.jobUsageCount ?? 0}</td>
                                <td>
                                    <div className="admin-skills-table__actions">
                                        <button
                                            type="button"
                                            className="admin-skills-btn admin-skills-btn--sm admin-skills-btn--ghost"
                                            onClick={() => openEdit(skill)}
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            type="button"
                                            className={`admin-skills-btn admin-skills-btn--sm ${
                                                skill.active
                                                    ? 'admin-skills-btn--danger-outline'
                                                    : 'admin-skills-btn--success-outline'
                                            }`}
                                            onClick={() => setStatusSkill(skill)}
                                        >
                                            {skill.active ? 'Tắt' : 'Bật'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="admin-skills-pagination">
                <span className="admin-skills-pagination__meta">
                    {totalElements} kỹ năng · Trang {totalPages === 0 ? 0 : page + 1}/{totalPages}
                </span>
                <div className="admin-skills-pagination__btns">
                    <button
                        type="button"
                        className="admin-skills-btn admin-skills-btn--ghost admin-skills-btn--sm"
                        disabled={page <= 0 || loading}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                        Trước
                    </button>
                    <button
                        type="button"
                        className="admin-skills-btn admin-skills-btn--ghost admin-skills-btn--sm"
                        disabled={page + 1 >= totalPages || loading}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Sau
                    </button>
                </div>
            </div>

            <SkillFormModal
                open={formOpen}
                mode={formMode}
                initialSkill={editingSkill}
                categories={categories}
                loading={formSaving}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                    if (formSaving) return;
                    setFormOpen(false);
                    setEditingSkill(null);
                }}
            />

            <SkillStatusModal
                open={Boolean(statusSkill)}
                skill={statusSkill}
                loading={statusSaving}
                onConfirm={handleStatusConfirm}
                onCancel={() => {
                    if (statusSaving) return;
                    setStatusSkill(null);
                }}
            />
        </div>
    );
};

export default AdminSkillsPage;
