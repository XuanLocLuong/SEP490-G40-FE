import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    BANNED_LIST_TABS,
    createBannedListItem,
    deleteBannedListItem,
    getBannedListApiErrorMessage,
    listBannedListItems,
    updateBannedListItem,
} from '../../apis/AdminBannedListApi.jsx';
import '../../assets/styles/AdminSkillsPageStyle.css';
import '../../assets/styles/AdminBlacklistKeywordsPageStyle.css';

const normalizeValue = (value) => String(value ?? '').trim().toLowerCase();

const AdminBlacklistKeywordsPage = () => {
    const [activeType, setActiveType] = useState(BANNED_LIST_TABS[0].type);
    const activeTab = useMemo(
        () => BANNED_LIST_TABS.find((tab) => tab.type === activeType) || BANNED_LIST_TABS[0],
        [activeType]
    );

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');

    const [addValue, setAddValue] = useState('');
    const [addReason, setAddReason] = useState('');
    const [adding, setAdding] = useState(false);

    const [editingValue, setEditingValue] = useState(null);
    const [editNewValue, setEditNewValue] = useState('');
    const [editReason, setEditReason] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    const [deletingValue, setDeletingValue] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleting, setDeleting] = useState(false);

    const resetForms = () => {
        setAddValue('');
        setAddReason('');
        setFilter('');
        setEditingValue(null);
        setEditNewValue('');
        setEditReason('');
        setDeletingValue(null);
        setDeleteReason('');
    };

    const loadItems = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const list = await listBannedListItems(activeType);
            setItems(list);
        } catch (err) {
            setError(getBannedListApiErrorMessage(err, 'Không thể tải danh sách.'));
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [activeType]);

    useEffect(() => {
        resetForms();
        loadItems();
    }, [loadItems]);

    const filteredItems = useMemo(() => {
        const q = normalizeValue(filter);
        if (!q) return items;
        return items.filter((item) => item.includes(q));
    }, [items, filter]);

    const handleTabChange = (type) => {
        if (type === activeType) return;
        setActiveType(type);
    };

    const handleAdd = async (event) => {
        event.preventDefault();
        const value = normalizeValue(addValue);
        const reason = addReason.trim();
        if (!value) {
            toast.error(`Vui lòng nhập ${activeTab.itemLabel}.`);
            return;
        }
        if (!reason) {
            toast.error('Vui lòng nhập lý do thêm.');
            return;
        }

        setAdding(true);
        try {
            const next = await createBannedListItem(activeType, { value, reason });
            setItems(next);
            setAddValue('');
            setAddReason('');
            toast.success(`Đã thêm ${activeTab.itemLabel}.`);
        } catch (err) {
            toast.error(getBannedListApiErrorMessage(err, `Không thể thêm ${activeTab.itemLabel}.`));
        } finally {
            setAdding(false);
        }
    };

    const openEdit = (value) => {
        setEditingValue(value);
        setEditNewValue(value);
        setEditReason('');
    };

    const closeEdit = () => {
        setEditingValue(null);
        setEditNewValue('');
        setEditReason('');
    };

    const handleEdit = async (event) => {
        event.preventDefault();
        if (!editingValue) return;
        const newValue = normalizeValue(editNewValue);
        const reason = editReason.trim();
        if (!newValue) {
            toast.error('Giá trị mới không được để trống.');
            return;
        }
        if (!reason) {
            toast.error('Vui lòng nhập lý do sửa.');
            return;
        }

        setSavingEdit(true);
        try {
            const next = await updateBannedListItem(activeType, {
                oldValue: editingValue,
                newValue,
                reason,
            });
            setItems(next);
            closeEdit();
            toast.success(`Đã cập nhật ${activeTab.itemLabel}.`);
        } catch (err) {
            toast.error(getBannedListApiErrorMessage(err, `Không thể cập nhật ${activeTab.itemLabel}.`));
        } finally {
            setSavingEdit(false);
        }
    };

    const openDelete = (value) => {
        setDeletingValue(value);
        setDeleteReason('');
    };

    const closeDelete = () => {
        setDeletingValue(null);
        setDeleteReason('');
    };

    const handleDelete = async (event) => {
        event.preventDefault();
        if (!deletingValue) return;
        const reason = deleteReason.trim();
        if (!reason) {
            toast.error('Vui lòng nhập lý do xóa.');
            return;
        }

        setDeleting(true);
        try {
            const next = await deleteBannedListItem(activeType, {
                value: deletingValue,
                reason,
            });
            setItems(next);
            closeDelete();
            toast.success(`Đã xóa ${activeTab.itemLabel}.`);
        } catch (err) {
            toast.error(getBannedListApiErrorMessage(err, `Không thể xóa ${activeTab.itemLabel}.`));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="admin-skills-page admin-blacklist-page">
            <div className="admin-skills-page__header">
                <div>
                    <h1 className="admin-skills-page__title">Cấu hình từ cấm</h1>
                    <p className="admin-skills-page__subtitle">{activeTab.subtitle}</p>
                </div>
            </div>

            <div className="admin-blacklist-page__tabs" role="tablist" aria-label="Loại danh sách cấm">
                {BANNED_LIST_TABS.map((tab) => {
                    const isActive = tab.type === activeType;
                    return (
                        <button
                            key={tab.type}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`admin-blacklist-page__tab${isActive ? ' is-active' : ''}`}
                            onClick={() => handleTabChange(tab.type)}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {error ? <p className="admin-skills-page__error">{error}</p> : null}

            <form className="admin-blacklist-page__add-form" onSubmit={handleAdd}>
                <div className="admin-blacklist-page__field">
                    <label htmlFor="banned-list-add-value">
                        {activeType === 'job-blacklist-urls' ? 'URL cấm mới' : 'Từ cấm mới'}
                    </label>
                    <input
                        id="banned-list-add-value"
                        type="text"
                        value={addValue}
                        onChange={(e) => setAddValue(e.target.value)}
                        placeholder={activeTab.placeholder}
                        autoComplete="off"
                        disabled={adding}
                    />
                </div>
                <div className="admin-blacklist-page__field admin-blacklist-page__field--grow">
                    <label htmlFor="banned-list-add-reason">Lý do thêm</label>
                    <input
                        id="banned-list-add-reason"
                        type="text"
                        value={addReason}
                        onChange={(e) => setAddReason(e.target.value)}
                        placeholder="Bắt buộc — ghi rõ lý do"
                        autoComplete="off"
                        disabled={adding}
                    />
                </div>
                <button
                    type="submit"
                    className="admin-skills-btn admin-skills-btn--primary"
                    disabled={adding}
                >
                    {adding ? 'Đang thêm...' : 'Thêm'}
                </button>
            </form>

            <div className="admin-skills-filters">
                <div className="admin-skills-filters__keyword">
                    <input
                        type="search"
                        className="admin-skills-filters__search"
                        placeholder="Lọc danh sách..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <span className="admin-blacklist-page__count">
                    {filteredItems.length}/{items.length} mục
                </span>
            </div>

            <div className="admin-skills-table-wrap">
                <table className="admin-skills-table">
                    <thead>
                        <tr>
                            <th style={{ width: '56px' }}>#</th>
                            <th>{activeType === 'job-blacklist-urls' ? 'URL cấm' : 'Từ cấm'}</th>
                            <th style={{ width: '180px' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={3} className="admin-skills-table__empty">
                                    Đang tải danh sách...
                                </td>
                            </tr>
                        )}
                        {!loading && filteredItems.length === 0 && (
                            <tr>
                                <td colSpan={3} className="admin-skills-table__empty">
                                    {items.length === 0
                                        ? 'Chưa có mục nào trong danh sách này.'
                                        : 'Không có mục khớp bộ lọc.'}
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            filteredItems.map((item, index) => (
                                <tr key={item}>
                                    <td>{index + 1}</td>
                                    <td className="admin-skills-table__name">{item}</td>
                                    <td>
                                        <div className="admin-skills-table__actions">
                                            <button
                                                type="button"
                                                className="admin-skills-btn admin-skills-btn--ghost"
                                                onClick={() => openEdit(item)}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                type="button"
                                                className="admin-skills-btn admin-skills-btn--danger"
                                                onClick={() => openDelete(item)}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {editingValue ? (
                <div className="admin-blacklist-modal" role="dialog" aria-modal="true">
                    <form className="admin-blacklist-modal__card" onSubmit={handleEdit}>
                        <h2>Sửa {activeTab.itemLabel}</h2>
                        <p className="admin-blacklist-modal__hint">
                            Giá trị hiện tại: <strong>{editingValue}</strong>
                        </p>
                        <div className="admin-blacklist-page__field">
                            <label htmlFor="banned-list-edit-value">Giá trị mới</label>
                            <input
                                id="banned-list-edit-value"
                                type="text"
                                value={editNewValue}
                                onChange={(e) => setEditNewValue(e.target.value)}
                                autoComplete="off"
                                disabled={savingEdit}
                                autoFocus
                            />
                        </div>
                        <div className="admin-blacklist-page__field">
                            <label htmlFor="banned-list-edit-reason">Lý do sửa</label>
                            <input
                                id="banned-list-edit-reason"
                                type="text"
                                value={editReason}
                                onChange={(e) => setEditReason(e.target.value)}
                                placeholder="Bắt buộc"
                                autoComplete="off"
                                disabled={savingEdit}
                            />
                        </div>
                        <div className="admin-blacklist-modal__actions">
                            <button
                                type="button"
                                className="admin-skills-btn admin-skills-btn--ghost"
                                onClick={closeEdit}
                                disabled={savingEdit}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="admin-skills-btn admin-skills-btn--primary"
                                disabled={savingEdit}
                            >
                                {savingEdit ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {deletingValue ? (
                <div className="admin-blacklist-modal" role="dialog" aria-modal="true">
                    <form className="admin-blacklist-modal__card" onSubmit={handleDelete}>
                        <h2>Xóa {activeTab.itemLabel}</h2>
                        <p className="admin-blacklist-modal__hint">
                            Bạn sắp xóa: <strong>{deletingValue}</strong>
                        </p>
                        <div className="admin-blacklist-page__field">
                            <label htmlFor="banned-list-delete-reason">Lý do xóa</label>
                            <input
                                id="banned-list-delete-reason"
                                type="text"
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder="Bắt buộc"
                                autoComplete="off"
                                disabled={deleting}
                                autoFocus
                            />
                        </div>
                        <div className="admin-blacklist-modal__actions">
                            <button
                                type="button"
                                className="admin-skills-btn admin-skills-btn--ghost"
                                onClick={closeDelete}
                                disabled={deleting}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="admin-skills-btn admin-skills-btn--danger"
                                disabled={deleting}
                            >
                                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}
        </div>
    );
};

export default AdminBlacklistKeywordsPage;
