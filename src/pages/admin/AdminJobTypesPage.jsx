import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
    createJobType,
    getJobTypeApiErrorMessage,
    listJobTypes,
    toggleJobTypeStatus,
    updateJobType,
} from '../../apis/AdminJobTypeApi.jsx';
import JobTypeFormModal from '../../components/admin/JobTypeFormModal.jsx';
import { suggestJobTypes } from '../../utils/jobTypeSearchSuggest.js';
import '../../assets/styles/AdminSkillsPageStyle.css';

const PAGE_SIZE = 20;
const SUGGEST_CATALOG_SIZE = 200;

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'true', label: 'Đang hoạt động' },
    { value: 'false', label: 'Đã vô hiệu' },
];

const AdminJobTypesPage = () => {
    const [keywordInput, setKeywordInput] = useState('');
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(0);
    const [items, setItems] = useState([]);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [suggestCatalog, setSuggestCatalog] = useState([]);
    const [keywordFocused, setKeywordFocused] = useState(false);
    const keywordInputRef = useRef(null);
    const skipSuggestOpenRef = useRef(false);
    const [togglingId, setTogglingId] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [editingType, setEditingType] = useState(null);
    const [formSaving, setFormSaving] = useState(false);

    const loadTypes = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = { page, size: PAGE_SIZE };
            if (keyword) params.keyword = keyword;
            if (status !== '') params.status = status === 'true';
            const pageData = await listJobTypes(params);
            setItems(Array.isArray(pageData?.content) ? pageData.content : []);
            setTotalElements(pageData?.totalElements ?? 0);
            setTotalPages(pageData?.totalPages ?? 0);
        } catch (err) {
            setItems([]);
            setTotalElements(0);
            setTotalPages(0);
            setError(getJobTypeApiErrorMessage(err, 'Không thể tải danh sách lĩnh vực.'));
        } finally {
            setLoading(false);
        }
    }, [keyword, page, status]);

    const loadSuggestCatalog = useCallback(async () => {
        try {
            const pageData = await listJobTypes({ page: 0, size: SUGGEST_CATALOG_SIZE });
            setSuggestCatalog(Array.isArray(pageData?.content) ? pageData.content : []);
        } catch {
            // Suggestions are optional and must not block the management page.
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        const params = { page, size: PAGE_SIZE };
        if (keyword) params.keyword = keyword;
        if (status !== '') params.status = status === 'true';

        listJobTypes(params)
            .then((pageData) => {
                if (cancelled) return;
                setItems(Array.isArray(pageData?.content) ? pageData.content : []);
                setTotalElements(pageData?.totalElements ?? 0);
                setTotalPages(pageData?.totalPages ?? 0);
                setError('');
            })
            .catch((err) => {
                if (cancelled) return;
                setItems([]);
                setTotalElements(0);
                setTotalPages(0);
                setError(getJobTypeApiErrorMessage(err, 'Không thể tải danh sách lĩnh vực.'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [keyword, page, status]);

    useEffect(() => {
        let cancelled = false;
        listJobTypes({ page: 0, size: SUGGEST_CATALOG_SIZE })
            .then((pageData) => {
                if (!cancelled) {
                    setSuggestCatalog(Array.isArray(pageData?.content) ? pageData.content : []);
                }
            })
            .catch(() => {
                // Suggestions are optional and must not block the management page.
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const keywordSuggestions = useMemo(
        () => suggestJobTypes(suggestCatalog, keywordInput, 6),
        [suggestCatalog, keywordInput]
    );
    const showSuggestList = keywordFocused && keywordSuggestions.length > 0;

    const openCreate = () => {
        setFormMode('create');
        setEditingType(null);
        setFormOpen(true);
    };

    const openEdit = (row) => {
        setFormMode('edit');
        setEditingType(row);
        setFormOpen(true);
    };

    const closeForm = () => {
        if (formSaving) return;
        setFormOpen(false);
        setEditingType(null);
    };

    const handleFormSubmit = async (payload) => {
        setFormSaving(true);
        try {
            if (formMode === 'edit' && editingType?.id) {
                await updateJobType(editingType.id, payload);
                toast.success('Đã cập nhật lĩnh vực.');
            } else {
                await createJobType(payload);
                toast.success('Đã tạo lĩnh vực.');
            }
            setFormOpen(false);
            setEditingType(null);
            await loadSuggestCatalog();
            if (formMode === 'create' && page !== 0) {
                setLoading(true);
                setPage(0);
            } else {
                await loadTypes();
            }
        } catch (err) {
            toast.error(getJobTypeApiErrorMessage(err, 'Không thể lưu lĩnh vực.'));
        } finally {
            setFormSaving(false);
        }
    };

    const handleToggleStatus = async (row) => {
        if (!row?.id || togglingId != null) return;
        const action = row.active ? 'vô hiệu hóa' : 'kích hoạt';
        if (!window.confirm(`Bạn có chắc muốn ${action} lĩnh vực "${row.name || row.code}"?`)) {
            return;
        }

        setTogglingId(row.id);
        try {
            await toggleJobTypeStatus(row.id);
            toast.success(row.active ? 'Đã vô hiệu hóa lĩnh vực.' : 'Đã kích hoạt lĩnh vực.');
            await loadSuggestCatalog();
            await loadTypes();
        } catch (err) {
            toast.error(getJobTypeApiErrorMessage(err, 'Không thể đổi trạng thái lĩnh vực.'));
        } finally {
            setTogglingId(null);
        }
    };

    const applySearch = (event) => {
        event.preventDefault();
        setKeywordFocused(false);
        setLoading(true);
        setPage(0);
        setKeyword(keywordInput.trim());
    };

    const applySuggestedKeyword = (item) => {
        const value = item.name || item.code;
        skipSuggestOpenRef.current = true;
        setKeywordInput(value);
        setKeywordFocused(false);
        setLoading(true);
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
                    <h1 className="admin-skills-page__title">Quản lý lĩnh vực</h1>
                    <p className="admin-skills-page__subtitle admin-job-types-page__subtitle">
                        Danh mục lĩnh vực được sử dụng khi tìm kiếm, gợi ý và đăng tin tuyển dụng.
                        Lĩnh vực đã vô hiệu hóa không còn xuất hiện trong lựa chọn mới.
                    </p>
                </div>
                <button
                    type="button"
                    className="admin-skills-btn admin-skills-btn--primary"
                    onClick={openCreate}
                >
                    + Thêm lĩnh vực
                </button>
            </header>

            <form className="admin-skills-filters" onSubmit={applySearch}>
                <div className="admin-skills-filters__keyword">
                    <input
                        ref={keywordInputRef}
                        className="admin-skills-filters__search"
                        value={keywordInput}
                        onChange={(event) => {
                            setKeywordInput(event.target.value);
                            setKeywordFocused(true);
                        }}
                        onFocus={() => {
                            if (!skipSuggestOpenRef.current) setKeywordFocused(true);
                        }}
                        onBlur={() => {
                            window.setTimeout(() => setKeywordFocused(false), 180);
                        }}
                        placeholder="Tìm theo mã hoặc tên lĩnh vực..."
                        aria-label="Tìm lĩnh vực"
                        aria-autocomplete="list"
                        autoComplete="off"
                    />
                    {showSuggestList ? (
                        <ul className="admin-skills-filters__suggest-list" role="listbox">
                            {keywordSuggestions.map((item) => (
                                <li key={item.id ?? item.code}>
                                    <button
                                        type="button"
                                        className="admin-skills-filters__suggest-item"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => applySuggestedKeyword(item)}
                                    >
                                        <strong>{item.name || item.code}</strong>
                                        {item.code && item.name ? ` (${item.code})` : ''}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
                <select
                    value={status}
                    onChange={(event) => {
                        setLoading(true);
                        setPage(0);
                        setStatus(event.target.value);
                    }}
                    aria-label="Lọc trạng thái"
                >
                    {STATUS_OPTIONS.map((option) => (
                        <option key={option.value || 'all'} value={option.value}>
                            {option.label}
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
                            <th>Mã</th>
                            <th>Tên lĩnh vực</th>
                            <th>Mô tả</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="admin-skills-table__empty">
                                    Đang tải...
                                </td>
                            </tr>
                        ) : null}
                        {!loading && items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="admin-skills-table__empty">
                                    Không có lĩnh vực nào phù hợp.
                                </td>
                            </tr>
                        ) : null}
                        {items.map((row) => (
                            <tr key={row.id}>
                                <td>
                                    <div className="admin-skills-table__name">{row.code}</div>
                                </td>
                                <td>{row.name || '—'}</td>
                                <td>
                                    {row.description ? (
                                        <div className="admin-skills-table__desc">{row.description}</div>
                                    ) : (
                                        '—'
                                    )}
                                </td>
                                <td>
                                    <span
                                        className={`admin-skills-badge ${
                                            row.active
                                                ? 'admin-skills-badge--active'
                                                : 'admin-skills-badge--inactive'
                                        }`}
                                    >
                                        {row.active ? 'Hoạt động' : 'Vô hiệu'}
                                    </span>
                                </td>
                                <td>
                                    <div className="admin-skills-table__actions">
                                        <button
                                            type="button"
                                            className="admin-skills-btn admin-skills-btn--sm admin-skills-btn--ghost"
                                            onClick={() => openEdit(row)}
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            type="button"
                                            className={`admin-skills-btn admin-skills-btn--sm ${
                                                row.active
                                                    ? 'admin-skills-btn--danger-outline'
                                                    : 'admin-skills-btn--success-outline'
                                            }`}
                                            disabled={togglingId === row.id}
                                            onClick={() => handleToggleStatus(row)}
                                        >
                                            {togglingId === row.id
                                                ? '…'
                                                : row.active
                                                  ? 'Tắt'
                                                  : 'Bật'}
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
                    {totalElements} lĩnh vực · Trang {totalElements === 0 ? 0 : page + 1}/
                    {totalElements === 0 ? 0 : totalPages}
                </span>
                <div className="admin-skills-pagination__btns">
                    <button
                        type="button"
                        className="admin-skills-btn admin-skills-btn--ghost admin-skills-btn--sm"
                        disabled={page <= 0 || loading}
                        onClick={() => {
                            setLoading(true);
                            setPage((current) => Math.max(0, current - 1));
                        }}
                    >
                        Trước
                    </button>
                    <button
                        type="button"
                        className="admin-skills-btn admin-skills-btn--ghost admin-skills-btn--sm"
                        disabled={page + 1 >= totalPages || loading || totalElements === 0}
                        onClick={() => {
                            setLoading(true);
                            setPage((current) => current + 1);
                        }}
                    >
                        Sau
                    </button>
                </div>
            </div>

            <JobTypeFormModal
                key={`${formOpen}-${formMode}-${editingType?.id || 'new'}`}
                open={formOpen}
                mode={formMode}
                initialType={editingType}
                loading={formSaving}
                onSubmit={handleFormSubmit}
                onCancel={closeForm}
            />
        </div>
    );
};

export default AdminJobTypesPage;
