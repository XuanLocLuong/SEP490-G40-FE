import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    createBusinessType,
    getBusinessTypeApiErrorMessage,
    listBusinessTypes,
    toggleBusinessTypeStatus,
    updateBusinessType,
} from '../../apis/AdminBusinessTypeApi.jsx';
import BusinessTypeFormModal from '../../components/admin/BusinessTypeFormModal.jsx';
import '../../assets/styles/AdminSkillsPageStyle.css';

const PAGE_SIZE = 20;
const FETCH_SIZE = 200;

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'true', label: 'Đang hoạt động' },
    { value: 'false', label: 'Đã vô hiệu' },
];

const AdminBusinessTypesPage = () => {
    const [keywordInput, setKeywordInput] = useState('');
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(0);

    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [togglingId, setTogglingId] = useState(null);

    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [editingType, setEditingType] = useState(null);
    const [formSaving, setFormSaving] = useState(false);

    const loadTypes = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const pageData = await listBusinessTypes({
                page: 0,
                size: FETCH_SIZE,
                sort: 'code,asc',
            });
            setAllItems(pageData?.content ?? []);
        } catch (err) {
            setError(getBusinessTypeApiErrorMessage(err, 'Không thể tải danh sách loại hình.'));
            setAllItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTypes();
    }, [loadTypes]);

    const filteredItems = useMemo(() => {
        const q = keyword.trim().toLowerCase();
        return allItems.filter((row) => {
            if (status === 'true' && !row.active) return false;
            if (status === 'false' && row.active) return false;
            if (!q) return true;
            const hay = `${row.code || ''} ${row.name || ''} ${row.description || ''}`.toLowerCase();
            return hay.includes(q);
        });
    }, [allItems, keyword, status]);

    const totalElements = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE) || 0);
    const safePage = Math.min(page, Math.max(0, totalPages - 1));
    const pageItems = useMemo(() => {
        const start = safePage * PAGE_SIZE;
        return filteredItems.slice(start, start + PAGE_SIZE);
    }, [filteredItems, safePage]);

    useEffect(() => {
        if (page !== safePage) setPage(safePage);
    }, [page, safePage]);

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

    const handleFormSubmit = async (payload) => {
        setFormSaving(true);
        try {
            if (formMode === 'edit' && editingType?.id) {
                await updateBusinessType(editingType.id, payload);
                toast.success('Đã cập nhật loại hình doanh nghiệp.');
            } else {
                await createBusinessType(payload);
                toast.success('Đã tạo loại hình doanh nghiệp.');
            }
            setFormOpen(false);
            setEditingType(null);
            if (formMode === 'create') setPage(0);
            await loadTypes();
        } catch (err) {
            toast.error(getBusinessTypeApiErrorMessage(err, 'Không thể lưu loại hình.'));
        } finally {
            setFormSaving(false);
        }
    };

    const handleToggleStatus = async (row) => {
        if (!row?.id || togglingId) return;
        const nextLabel = row.active ? 'vô hiệu hóa' : 'kích hoạt';
        const ok = window.confirm(
            `Bạn có chắc muốn ${nextLabel} loại hình "${row.name || row.code}"?`
        );
        if (!ok) return;

        setTogglingId(row.id);
        try {
            await toggleBusinessTypeStatus(row.id);
            toast.success(row.active ? 'Đã vô hiệu hóa loại hình.' : 'Đã kích hoạt loại hình.');
            await loadTypes();
        } catch (err) {
            toast.error(getBusinessTypeApiErrorMessage(err, 'Không thể đổi trạng thái.'));
        } finally {
            setTogglingId(null);
        }
    };

    const applySearch = (e) => {
        e?.preventDefault?.();
        setPage(0);
        setKeyword(keywordInput);
    };

    return (
        <div className="admin-skills-page">
            <header className="admin-skills-page__header">
                <div>
                    <h1 className="admin-skills-page__title">Loại hình doanh nghiệp</h1>
                    <p className="admin-skills-page__subtitle">
                        Danh mục loại hình dùng khi đăng ký / xác minh recruiter. Cập nhật không làm mất
                        liên kết doanh nghiệp đã chọn.
                    </p>
                </div>
                <button type="button" className="admin-skills-btn admin-skills-btn--primary" onClick={openCreate}>
                    + Thêm loại hình
                </button>
            </header>

            <form className="admin-skills-filters" onSubmit={applySearch}>
                <input
                    className="admin-skills-filters__search"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Tìm theo mã, tên, mô tả..."
                    aria-label="Tìm loại hình"
                />
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
                            <th>Tên</th>
                            <th>Mô tả</th>
                            <th>GPKD</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && allItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="admin-skills-table__empty">
                                    Đang tải...
                                </td>
                            </tr>
                        ) : null}
                        {!loading && pageItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="admin-skills-table__empty">
                                    Không có loại hình nào phù hợp.
                                </td>
                            </tr>
                        ) : null}
                        {pageItems.map((row) => (
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
                                <td>{row.requiresBusinessLicense ? 'Có' : 'Không'}</td>
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
                                            {togglingId === row.id ? '…' : row.active ? 'Tắt' : 'Bật'}
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
                    {totalElements} loại hình · Trang {totalElements === 0 ? 0 : safePage + 1}/
                    {totalElements === 0 ? 0 : totalPages}
                </span>
                <div className="admin-skills-pagination__btns">
                    <button
                        type="button"
                        className="admin-skills-btn admin-skills-btn--ghost admin-skills-btn--sm"
                        disabled={safePage <= 0 || loading}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                        Trước
                    </button>
                    <button
                        type="button"
                        className="admin-skills-btn admin-skills-btn--ghost admin-skills-btn--sm"
                        disabled={safePage + 1 >= totalPages || loading || totalElements === 0}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Sau
                    </button>
                </div>
            </div>

            <BusinessTypeFormModal
                open={formOpen}
                mode={formMode}
                initialType={editingType}
                loading={formSaving}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                    if (formSaving) return;
                    setFormOpen(false);
                    setEditingType(null);
                }}
            />
        </div>
    );
};

export default AdminBusinessTypesPage;
