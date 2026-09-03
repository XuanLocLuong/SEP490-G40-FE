import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getAdminAuditLogApiErrorMessage,
    getAdminAuditLogDetail,
    getAdminAuditLogFilterOptions,
    searchAdminAuditLogs,
} from '../../apis/AdminAuditLogApi.jsx';
import { ROUTES } from '../../routes/path.js';
import {
    AUDIT_ACTION_OPTIONS,
    AUDIT_RESULT_OPTIONS,
    AUDIT_TARGET_TYPE_OPTIONS,
    formatAuditDateTime,
    getAuditActionLabel,
    getAuditActorDisplay,
    getAuditActorInitials,
    getAuditResultLabel,
    getAuditResultTone,
    getAuditTargetTypeLabel,
    getAuditValueEntries,
    toAuditInstantFromDate,
} from '../../utils/adminAuditLogDisplay.js';
import '../../assets/styles/AdminAuditLogsPageStyle.css';

const PAGE_SIZE = 20;

const AdminAuditLogsPage = () => {
    const [actorName, setActorName] = useState('');
    const [action, setAction] = useState('');
    const [targetType, setTargetType] = useState('');
    const [result, setResult] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({
        actorName: '',
        action: '',
        targetType: '',
        result: '',
        fromDate: '',
        toDate: '',
    });

    const [filterOptions, setFilterOptions] = useState({
        actions: [],
        targetTypes: [],
        results: [],
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

    const showDetail = selectedId != null;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getAdminAuditLogFilterOptions();
                if (!cancelled && data) {
                    setFilterOptions({
                        actions: Array.isArray(data.actions) ? data.actions : [],
                        targetTypes: Array.isArray(data.targetTypes) ? data.targetTypes : [],
                        results: Array.isArray(data.results) ? data.results : [],
                    });
                }
            } catch {
                // Giữ fallback static options nếu API lỗi
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const actionOptions = useMemo(() => {
        if (filterOptions.actions.length > 0) {
            return [
                { value: '', label: 'Tất cả hành động' },
                ...filterOptions.actions.map((act) => ({
                    value: act,
                    label: getAuditActionLabel(act),
                })),
            ];
        }
        return AUDIT_ACTION_OPTIONS;
    }, [filterOptions.actions]);

    const targetTypeOptions = useMemo(() => {
        if (filterOptions.targetTypes.length > 0) {
            return [
                { value: '', label: 'Tất cả đối tượng' },
                ...filterOptions.targetTypes.map((type) => ({
                    value: type,
                    label: getAuditTargetTypeLabel(type),
                })),
            ];
        }
        return AUDIT_TARGET_TYPE_OPTIONS;
    }, [filterOptions.targetTypes]);

    const resultOptions = useMemo(() => {
        if (filterOptions.results.length > 0) {
            return [
                { value: '', label: 'Tất cả kết quả' },
                ...filterOptions.results.map((res) => ({
                    value: res,
                    label: getAuditResultLabel(res),
                })),
            ];
        }
        return AUDIT_RESULT_OPTIONS;
    }, [filterOptions.results]);

    const loadList = useCallback(async (pageNum = 0, filters = appliedFilters) => {
        setListLoading(true);
        setListError('');
        try {
            const params = {
                page: pageNum,
                size: PAGE_SIZE,
            };
            if (filters.actorName) params.actorName = filters.actorName;
            if (filters.action) params.action = filters.action;
            if (filters.targetType) params.targetType = filters.targetType;
            if (filters.result) params.result = filters.result;
            const fromIso = toAuditInstantFromDate(filters.fromDate, false);
            const toIso = toAuditInstantFromDate(filters.toDate, true);
            if (fromIso) params.fromDate = fromIso;
            if (toIso) params.toDate = toIso;

            const data = await searchAdminAuditLogs(params);
            const content = data?.content ?? [];
            setItems(content);
            setPage(data?.currentPage ?? data?.number ?? pageNum);
            setTotalPages(data?.totalPages ?? 0);
            setTotalElements(data?.totalElements ?? content.length);
        } catch (err) {
            setListError(getAdminAuditLogApiErrorMessage(err, 'Không tải được nhật ký hoạt động.'));
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
            const data = await getAdminAuditLogDetail(id);
            setDetail(data);
        } catch (err) {
            setDetail(null);
            setDetailError(getAdminAuditLogApiErrorMessage(err, 'Không tải được chi tiết nhật ký.'));
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        loadList(0);
    }, [loadList]);

    useEffect(() => {
        loadDetail(selectedId);
    }, [selectedId, loadDetail]);

    const handleApplyFilters = (e) => {
        e.preventDefault();
        if (fromDate && toDate && fromDate > toDate) {
            setListError('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
            return;
        }
        setSelectedId(null);
        setAppliedFilters({
            actorName: actorName.trim(),
            action,
            targetType,
            result,
            fromDate,
            toDate,
        });
        setPage(0);
    };

    const handleResetFilters = () => {
        setActorName('');
        setAction('');
        setTargetType('');
        setResult('');
        setFromDate('');
        setToDate('');
        setSelectedId(null);
        setAppliedFilters({
            actorName: '',
            action: '',
            targetType: '',
            result: '',
            fromDate: '',
            toDate: '',
        });
        setPage(0);
    };

    const handleSelect = (id) => setSelectedId(id);
    const handleBackToList = () => setSelectedId(null);

    const renderResultBadge = (value) => {
        const tone = getAuditResultTone(value);
        return (
            <span className={`admin-audit-badge admin-audit-badge--${tone}`}>
                {getAuditResultLabel(value)}
            </span>
        );
    };

    const actorOf = (log) => getAuditActorDisplay(log);

    const detailActor = actorOf(detail);
    const oldValueEntries = getAuditValueEntries(detail?.oldValue);
    const newValueEntries = getAuditValueEntries(detail?.newValue);
    const isUserTarget = String(detail?.targetType || '').toLowerCase() === 'user';

    const renderValueEntries = (entries) => {
        if (!entries.length) {
            return <p className="admin-audit-value-empty">Không có</p>;
        }
        return (
            <ul className="admin-audit-value-list">
                {entries.map((entry) => (
                    <li key={entry.key}>
                        <span className="admin-audit-value-list__label">{entry.label}</span>
                        <span className="admin-audit-value-list__value">{entry.value}</span>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="admin-audit-page">
            <header className="admin-audit-page__header">
                <div>
                    <h1>Nhật ký hoạt động</h1>
                    <p>Theo dõi thao tác quản trị — chỉ xem, không chỉnh sửa.</p>
                </div>
            </header>

            {!showDetail && (
                <form className="admin-audit-filters" onSubmit={handleApplyFilters}>
                    <input
                        type="search"
                        placeholder="Tìm theo người thực hiện (actorName)…"
                        value={actorName}
                        onChange={(e) => setActorName(e.target.value)}
                        aria-label="Tìm người thực hiện"
                    />
                    <select value={action} onChange={(e) => setAction(e.target.value)} aria-label="Hành động">
                        {actionOptions.map((opt) => (
                            <option key={opt.value || 'all-action'} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <select value={targetType} onChange={(e) => setTargetType(e.target.value)} aria-label="Đối tượng">
                        {targetTypeOptions.map((opt) => (
                            <option key={opt.value || 'all-target'} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <select value={result} onChange={(e) => setResult(e.target.value)} aria-label="Kết quả">
                        {resultOptions.map((opt) => (
                            <option key={opt.value || 'all-result'} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        aria-label="Từ ngày"
                    />
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        aria-label="Đến ngày"
                    />
                    <button type="submit" className="admin-audit-btn admin-audit-btn--primary">
                        Lọc
                    </button>
                    <button type="button" className="admin-audit-btn admin-audit-btn--ghost" onClick={handleResetFilters}>
                        Xóa lọc
                    </button>
                </form>
            )}

            {listError && !showDetail && <p className="admin-audit-page__error" role="alert">{listError}</p>}

            {!showDetail ? (
                <section className="admin-audit-panel">
                    <div className="admin-audit-panel__meta">
                        {listLoading ? 'Đang tải…' : `${totalElements} bản ghi`}
                    </div>

                    <div className="admin-audit-table-wrap">
                        {listLoading && items.length === 0 ? (
                            <p className="admin-audit-panel__empty">Đang tải nhật ký…</p>
                        ) : items.length === 0 ? (
                            <p className="admin-audit-panel__empty">Không có nhật ký phù hợp.</p>
                        ) : (
                            <table className="admin-audit-table">
                                <thead>
                                    <tr>
                                        <th>Thời gian</th>
                                        <th>Người thực hiện</th>
                                        <th>Hành động</th>
                                        <th>Kết quả</th>
                                        <th>Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((log) => {
                                        const actor = actorOf(log);
                                        return (
                                            <tr
                                                key={log.id}
                                                onClick={() => handleSelect(log.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        handleSelect(log.id);
                                                    }
                                                }}
                                                tabIndex={0}
                                                role="button"
                                                aria-label={`Xem chi tiết nhật ký ${log.id}`}
                                            >
                                                <td className="admin-audit-table__time">
                                                    {formatAuditDateTime(log.createdAt)}
                                                </td>
                                                <td>
                                                    <div className="admin-audit-actor">
                                                        <span
                                                            className={`admin-audit-actor__avatar${actor.isSystem ? ' is-system' : ''}`}
                                                            aria-hidden
                                                        >
                                                            {getAuditActorInitials(actor.name)}
                                                        </span>
                                                        <span className="admin-audit-actor__text">
                                                            <strong>{actor.name}</strong>
                                                            {actor.email ? <small>{actor.email}</small> : null}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>{getAuditActionLabel(log.action)}</td>
                                                <td>{renderResultBadge(log.result)}</td>
                                                <td className="admin-audit-table__detail">
                                                    {log.targetName ? (
                                                        <div>
                                                            <strong>{log.targetName}</strong>
                                                            <small style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '2px' }}>
                                                                {getAuditTargetTypeLabel(log.targetType)} #{log.targetId ?? '—'}
                                                                {log.reason ? ` · ${log.reason}` : ''}
                                                            </small>
                                                        </div>
                                                    ) : (
                                                        log.reason || `${getAuditTargetTypeLabel(log.targetType)} #${log.targetId ?? '—'}`
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="admin-audit-panel__pager">
                        <button
                            type="button"
                            className="admin-audit-btn admin-audit-btn--ghost"
                            disabled={listLoading || page <= 0}
                            onClick={() => loadList(page - 1)}
                        >
                            Trước
                        </button>
                        <span>
                            Trang {totalPages === 0 ? 0 : page + 1} / {totalPages}
                        </span>
                        <button
                            type="button"
                            className="admin-audit-btn admin-audit-btn--ghost"
                            disabled={listLoading || page + 1 >= totalPages}
                            onClick={() => loadList(page + 1)}
                        >
                            Sau
                        </button>
                    </div>
                </section>
            ) : (
                <section className="admin-audit-panel admin-audit-panel--detail">
                    <div className="admin-audit-detail__toolbar">
                        <button type="button" className="admin-audit-btn admin-audit-btn--ghost" onClick={handleBackToList}>
                            ← Quay lại danh sách
                        </button>
                    </div>

                    {detailLoading ? (
                        <p className="admin-audit-panel__empty">Đang tải chi tiết…</p>
                    ) : detailError ? (
                        <p className="admin-audit-page__error" role="alert">{detailError}</p>
                    ) : !detail ? (
                        <p className="admin-audit-panel__empty">Không có dữ liệu chi tiết.</p>
                    ) : (
                        <>
                            <header className="admin-audit-detail__header">
                                <div>
                                    {detail.category && (
                                        <span className="admin-accounts-badge admin-accounts-badge--active" style={{ marginBottom: '6px', display: 'inline-block' }}>
                                            {detail.category}
                                        </span>
                                    )}
                                    <h2>{getAuditActionLabel(detail.action)}</h2>
                                    <p>{formatAuditDateTime(detail.createdAt)}</p>
                                </div>
                                {renderResultBadge(detail.result)}
                            </header>

                            <dl className="admin-audit-detail__grid">
                                <div>
                                    <dt>Người thực hiện</dt>
                                    <dd>
                                        <div className="admin-audit-actor">
                                            <span
                                                className={`admin-audit-actor__avatar${detailActor.isSystem ? ' is-system' : ''}`}
                                                aria-hidden
                                            >
                                                {getAuditActorInitials(detailActor.name)}
                                            </span>
                                            <span className="admin-audit-actor__text">
                                                <strong>{detailActor.name}</strong>
                                                {detailActor.email ? <small>{detailActor.email}</small> : null}
                                            </span>
                                        </div>
                                    </dd>
                                </div>
                                <div>
                                    <dt>Actor ID</dt>
                                    <dd>{detail.actorId ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt>Đối tượng</dt>
                                    <dd>
                                        {detail.targetName ? (
                                            <div>
                                                <strong>{detail.targetName}</strong>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '2px' }}>
                                                    {getAuditTargetTypeLabel(detail.targetType)} · ID: #{detail.targetId}
                                                    {isUserTarget && detail.targetId != null ? (
                                                        <>
                                                            {' · '}
                                                            <Link to={ROUTES.ADMIN_ACCOUNTS}>Mở quản lý tài khoản</Link>
                                                        </>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {getAuditTargetTypeLabel(detail.targetType) || '—'}
                                                {detail.targetId != null ? ` #${detail.targetId}` : ''}
                                                {isUserTarget && detail.targetId != null ? (
                                                    <>
                                                        {' · '}
                                                        <Link to={ROUTES.ADMIN_ACCOUNTS}>Mở quản lý tài khoản</Link>
                                                    </>
                                                ) : null}
                                            </>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt>IP / User-Agent</dt>
                                    <dd className="admin-audit-detail__mono">
                                        {detail.ipAddress || '—'}
                                        {detail.userAgent ? (
                                            <small title={detail.userAgent}>{detail.userAgent}</small>
                                        ) : null}
                                    </dd>
                                </div>
                                {detail.description ? (
                                    <div className="admin-audit-detail__span">
                                        <dt>Mô tả</dt>
                                        <dd>{detail.description}</dd>
                                    </div>
                                ) : null}
                                <div className="admin-audit-detail__span">
                                    <dt>Lý do</dt>
                                    <dd>{detail.reason?.trim() ? detail.reason : '—'}</dd>
                                </div>
                            </dl>

                            <div className="admin-audit-detail__values">
                                <div>
                                    <h3>Giá trị cũ</h3>
                                    {renderValueEntries(oldValueEntries)}
                                </div>
                                <div>
                                    <h3>Giá trị mới</h3>
                                    {renderValueEntries(newValueEntries)}
                                </div>
                            </div>
                        </>
                    )}
                </section>
            )}
        </div>
    );
};

export default AdminAuditLogsPage;
