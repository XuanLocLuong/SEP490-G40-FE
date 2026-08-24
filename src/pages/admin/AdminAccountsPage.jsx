import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    changeAdminAccountRole,
    changeAdminAccountStatus,
    createInternalStaffAccount,
    getAdminAccountApiErrorMessage,
    getAdminAccountDetail,
    revokeAdminAccountSessions,
    searchAdminAccounts,
} from '../../apis/AdminAccountApi.jsx';
import AccountActionModal from '../../components/admin/AccountActionModal.jsx';
import CreateStaffModal from '../../components/admin/CreateStaffModal.jsx';
import {
    ACCOUNT_STATUS_OPTIONS,
    USER_ROLE_FILTER_OPTIONS,
    formatAccountDateTime,
    getAccountStatusLabel,
    getAccountStatusTone,
    getChangeRoleOptions,
    canChangeAccountRole,
    getStatusActionsForAccount,
    getUserRoleLabel,
    isViewOnlyAdminAccount,
} from '../../utils/adminAccountDisplay.js';
import '../../assets/styles/AdminAccountsPageStyle.css';

const PAGE_SIZE = 20;

const AdminAccountsPage = () => {
    const [keyword, setKeyword] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({
        keyword: '',
        role: '',
        status: '',
    });

    const [items, setItems] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState('');

    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');

    const [actionModal, setActionModal] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);

    const showDetail = selectedId != null;

    const loadList = useCallback(async (pageNum = 0, filters = appliedFilters) => {
        setListLoading(true);
        setListError('');
        try {
            const params = {
                page: pageNum,
                size: PAGE_SIZE,
            };
            if (filters.keyword) params.keyword = filters.keyword;
            if (filters.role) params.role = filters.role;
            if (filters.status) params.status = filters.status;

            const data = await searchAdminAccounts(params);
            const content = data?.content ?? [];
            setItems(content);
            setPage(data?.currentPage ?? data?.number ?? pageNum);
            setTotalPages(data?.totalPages ?? 0);
            setTotalElements(data?.totalElements ?? content.length);
        } catch (err) {
            setListError(getAdminAccountApiErrorMessage(err, 'Không tải được danh sách tài khoản.'));
            setItems([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setListLoading(false);
        }
    }, [appliedFilters]);

    const loadDetail = useCallback(async (id) => {
        if (!id) {
            setDetail(null);
            setDetailError('');
            return;
        }
        setDetailLoading(true);
        setDetailError('');
        try {
            const data = await getAdminAccountDetail(id);
            setDetail(data);
        } catch (err) {
            setDetail(null);
            setDetailError(getAdminAccountApiErrorMessage(err, 'Không tải được chi tiết tài khoản.'));
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch account list on mount/filter
        loadList(0);
    }, [loadList]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch detail when selection changes
        loadDetail(selectedId);
    }, [selectedId, loadDetail]);

    const statusActions = useMemo(
        () => getStatusActionsForAccount(detail?.status),
        [detail?.status]
    );

    const roleOptions = useMemo(
        () => getChangeRoleOptions(detail?.role),
        [detail?.role]
    );

    const canChangeRole = canChangeAccountRole(detail?.role);
    const isAdminViewOnly = isViewOnlyAdminAccount(detail?.role);

    const handleSearch = (e) => {
        e?.preventDefault?.();
        const next = {
            keyword: keyword.trim(),
            role: roleFilter,
            status: statusFilter,
        };
        setAppliedFilters(next);
        setSelectedId(null);
        setPage(0);
    };

    const handleCloseDetail = () => {
        setSelectedId(null);
        setDetail(null);
        setDetailError('');
        setActionModal(null);
    };

    const refreshAfterMutation = async () => {
        await loadList(page);
        if (selectedId) await loadDetail(selectedId);
    };

    const handleActionConfirm = async ({ reason, status, role }) => {
        if (!selectedId || !actionModal) return;
        setActionLoading(true);
        try {
            if (actionModal.mode === 'status') {
                await changeAdminAccountStatus(selectedId, { status, reason });
                toast.success('Đã cập nhật trạng thái tài khoản.');
            } else if (actionModal.mode === 'revoke') {
                await revokeAdminAccountSessions(selectedId, { reason });
                toast.success('Đã thu hồi phiên đăng nhập.');
            } else if (actionModal.mode === 'role') {
                await changeAdminAccountRole(selectedId, { role, reason });
                toast.success('Đã đổi role tài khoản.');
            }
            setActionModal(null);
            await refreshAfterMutation();
        } catch (err) {
            toast.error(getAdminAccountApiErrorMessage(err, 'Thao tác thất bại.'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateStaff = async (payload) => {
        setCreateLoading(true);
        try {
            const created = await createInternalStaffAccount(payload);
            toast.success('Đã tạo tài khoản nội bộ.');
            setCreateOpen(false);
            await loadList(0, appliedFilters);
            const newId = created?.id;
            if (newId) setSelectedId(newId);
        } catch (err) {
            toast.error(getAdminAccountApiErrorMessage(err, 'Không tạo được tài khoản.'));
        } finally {
            setCreateLoading(false);
        }
    };

    const restrictions = Array.isArray(detail?.restrictions) ? detail.restrictions : [];

    return (
        <div className="admin-accounts-page">
            <header className="admin-accounts-page__header">
                <div>
                    <h1>Quản lý tài khoản</h1>
                    <p>Tìm kiếm, xem chi tiết, đổi trạng thái / role, thu hồi phiên, tạo staff nội bộ.</p>
                </div>
                {!showDetail && (
                    <button
                        type="button"
                        className="admin-accounts-btn admin-accounts-btn--primary"
                        onClick={() => setCreateOpen(true)}
                    >
                        + Tạo staff nội bộ
                    </button>
                )}
            </header>

            {!showDetail && (
                <form className="admin-accounts-filters" onSubmit={handleSearch}>
                    <input
                        type="search"
                        className="admin-accounts-filters__keyword"
                        placeholder="Tìm email, họ tên, SĐT..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        {USER_ROLE_FILTER_OPTIONS.map((opt) => (
                            <option key={opt.value || 'all-role'} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        {ACCOUNT_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value || 'all-status'} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <button type="submit" className="admin-accounts-btn admin-accounts-btn--primary">
                        Tìm kiếm
                    </button>
                </form>
            )}

            {listError && !showDetail ? (
                <p className="admin-accounts-page__error">{listError}</p>
            ) : null}

            {!showDetail && (
                <section className="admin-accounts-list admin-accounts-list--centered">
                    <div className="admin-accounts-list__meta">
                        {listLoading
                            ? 'Đang tải...'
                            : `${totalElements} tài khoản · Trang ${page + 1}/${Math.max(totalPages, 1)}`}
                    </div>

                    <div className="admin-accounts-list__body" aria-busy={listLoading}>
                        {!listLoading && items.length === 0 && (
                            <p className="admin-accounts-list__empty">Không có tài khoản phù hợp.</p>
                        )}
                        {items.map((item) => {
                            const tone = getAccountStatusTone(item.status);
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className="admin-accounts-card"
                                    onClick={() => setSelectedId(item.id)}
                                >
                                    <div className="admin-accounts-card__top">
                                        <strong>{item.fullName || '—'}</strong>
                                        <span className={`admin-accounts-badge admin-accounts-badge--${tone}`}>
                                            {getAccountStatusLabel(item.status)}
                                        </span>
                                    </div>
                                    <p>{item.email || '—'}</p>
                                    <p className="admin-accounts-card__meta">
                                        {getUserRoleLabel(item.role)}
                                        {item.phone ? ` · ${item.phone}` : ''}
                                        {item.trustScore != null ? ` · Trust ${item.trustScore}` : ''}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="admin-accounts-list__pager">
                            <button
                                type="button"
                                className="admin-accounts-btn admin-accounts-btn--ghost"
                                disabled={listLoading || page <= 0}
                                onClick={() => loadList(page - 1)}
                            >
                                Trước
                            </button>
                            <span>
                                Trang {page + 1} / {totalPages}
                            </span>
                            <button
                                type="button"
                                className="admin-accounts-btn admin-accounts-btn--ghost"
                                disabled={listLoading || page + 1 >= totalPages}
                                onClick={() => loadList(page + 1)}
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </section>
            )}

            {showDetail && (
                <section className="admin-accounts-detail admin-accounts-detail--full">
                    <div className="admin-accounts-detail__toolbar">
                        <button
                            type="button"
                            className="admin-accounts-btn admin-accounts-btn--ghost"
                            onClick={handleCloseDetail}
                        >
                            ← Quay lại danh sách
                        </button>
                    </div>

                    {detailLoading && (
                        <p className="admin-accounts-detail__placeholder">Đang tải chi tiết...</p>
                    )}
                    {!detailLoading && detailError && (
                        <p className="admin-accounts-page__error">{detailError}</p>
                    )}
                    {!detailLoading && detail && (
                        <>
                            <header className="admin-accounts-detail__header">
                                <div>
                                    <h2>{detail.fullName || '—'}</h2>
                                    <p>{detail.email}</p>
                                </div>
                                <span
                                    className={`admin-accounts-badge admin-accounts-badge--${getAccountStatusTone(
                                        detail.status
                                    )}`}
                                >
                                    {getAccountStatusLabel(detail.status)}
                                </span>
                            </header>

                            <dl className="admin-accounts-detail__grid">
                                <div>
                                    <dt>Role</dt>
                                    <dd>{getUserRoleLabel(detail.role)}</dd>
                                </div>
                                <div>
                                    <dt>SĐT</dt>
                                    <dd>{detail.phone || '—'}</dd>
                                </div>
                                <div>
                                    <dt>Email verified</dt>
                                    <dd>{detail.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}</dd>
                                </div>
                                <div>
                                    <dt>Trust score</dt>
                                    <dd>{detail.trustScore != null ? detail.trustScore : '—'}</dd>
                                </div>
                                <div>
                                    <dt>Ngày tạo</dt>
                                    <dd>{formatAccountDateTime(detail.createdAt)}</dd>
                                </div>
                                <div>
                                    <dt>ID</dt>
                                    <dd>#{detail.id}</dd>
                                </div>
                            </dl>

                            {!isAdminViewOnly ? (
                                <div className="admin-accounts-detail__actions">
                                    {statusActions.map((action) => (
                                        <button
                                            key={action.status}
                                            type="button"
                                            className={`admin-accounts-btn admin-accounts-btn--${action.variant}`}
                                            onClick={() =>
                                                setActionModal({
                                                    mode: 'status',
                                                    title: action.label,
                                                    confirmLabel: action.label,
                                                    variant:
                                                        action.variant === 'warning'
                                                            ? 'danger'
                                                            : action.variant,
                                                    statusOptions: [action],
                                                    initialStatus: action.status,
                                                })
                                            }
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        className="admin-accounts-btn admin-accounts-btn--ghost"
                                        onClick={() =>
                                            setActionModal({
                                                mode: 'revoke',
                                                title: 'Thu hồi phiên đăng nhập',
                                                confirmLabel: 'Thu hồi phiên',
                                                variant: 'danger',
                                            })
                                        }
                                    >
                                        Thu hồi phiên
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-accounts-btn admin-accounts-btn--ghost"
                                        disabled={!canChangeRole || roleOptions.length === 0}
                                        title={
                                            !canChangeRole
                                                ? 'Không được đổi role tài khoản Candidate / Recruiter / Admin'
                                                : roleOptions.length === 0
                                                  ? 'Không còn role nội bộ khác để đổi'
                                                  : 'Đổi role nội bộ'
                                        }
                                        onClick={() =>
                                            setActionModal({
                                                mode: 'role',
                                                title: 'Đổi role',
                                                confirmLabel: 'Đổi role',
                                                variant: 'primary',
                                                roleOptions,
                                            })
                                        }
                                    >
                                        Đổi role
                                    </button>
                                </div>
                            ) : (
                                <p className="admin-accounts-detail__placeholder">
                                    Tài khoản Admin chỉ xem — không thể khóa, cấm, thu hồi phiên hoặc
                                    đổi role.
                                </p>
                            )}

                            <div className="admin-accounts-detail__restrictions">
                                <h3>Lịch sử hạn chế</h3>
                                {restrictions.length === 0 ? (
                                    <p className="admin-accounts-detail__placeholder">
                                        Chưa có restriction.
                                    </p>
                                ) : (
                                    <ul>
                                        {restrictions.map((item) => (
                                            <li
                                                key={
                                                    item.id ?? `${item.restrictionType}-${item.startAt}`
                                                }
                                            >
                                                <div className="admin-accounts-restriction__head">
                                                    <strong>
                                                        {getAccountStatusLabel(item.restrictionType) ||
                                                            item.restrictionType}
                                                    </strong>
                                                    <span>
                                                        {item.active ? 'Đang hiệu lực' : 'Hết hiệu lực'}
                                                    </span>
                                                </div>
                                                {item.reason ? <p>{item.reason}</p> : null}
                                                <p className="admin-accounts-card__meta">
                                                    Bởi {item.restrictedByName || '—'} ·{' '}
                                                    {formatAccountDateTime(item.startAt)}
                                                    {item.endAt
                                                        ? ` → ${formatAccountDateTime(item.endAt)}`
                                                        : ''}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </>
                    )}
                </section>
            )}

            <AccountActionModal
                open={Boolean(actionModal)}
                mode={actionModal?.mode}
                title={actionModal?.title}
                confirmLabel={actionModal?.confirmLabel}
                variant={actionModal?.variant || 'primary'}
                loading={actionLoading}
                statusOptions={actionModal?.statusOptions || []}
                roleOptions={actionModal?.roleOptions || []}
                initialStatus={actionModal?.initialStatus || ''}
                onConfirm={handleActionConfirm}
                onCancel={() => !actionLoading && setActionModal(null)}
            />

            <CreateStaffModal
                open={createOpen}
                loading={createLoading}
                onConfirm={handleCreateStaff}
                onCancel={() => !createLoading && setCreateOpen(false)}
            />
        </div>
    );
};

export default AdminAccountsPage;
