import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    activateTrustScoreRule,
    createTrustScoreRule,
    deactivateTrustScoreRule,
    getTrustScoreRuleApiErrorMessage,
    getTrustScoreRuleDetail,
    searchTrustScoreRules,
    updateTrustScoreRule,
} from '../../apis/AdminTrustScoreRuleApi.jsx';
import TrustScoreRuleDetailModal from '../../components/admin/TrustScoreRuleDetailModal.jsx';
import TrustScoreRuleFormModal from '../../components/admin/TrustScoreRuleFormModal.jsx';
import TrustScoreRuleStatusModal from '../../components/admin/TrustScoreRuleStatusModal.jsx';
import {
    APPLIES_TO_FILTER_OPTIONS,
    RULE_TYPE_FILTER_OPTIONS,
    formatDateTime,
    formatScoreValue,
    getAppliesToLabel,
    getRuleTypeLabel,
    isSystemRuleType,
    sortRulesForAdminList,
} from '../../utils/trustScoreRuleDisplay.js';
import '../../assets/styles/AdminSkillsPageStyle.css';
import '../../assets/styles/AdminTrustScoreRulesPageStyle.css';

/** Page size hiển thị phía FE. */
const PAGE_SIZE = 10;
/** Fetch theo batch từ BE rồi gom về FE. */
const FETCH_SIZE = 200;

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'true', label: 'Đang hoạt động' },
    { value: 'false', label: 'Đã vô hiệu' },
];

const AdminTrustScoreRulesPage = () => {
    const [keyword, setKeyword] = useState('');
    const [keywordInput, setKeywordInput] = useState('');
    const [ruleType, setRuleType] = useState('');
    const [appliesTo, setAppliesTo] = useState('');
    const [active, setActive] = useState('');
    const [page, setPage] = useState(0);

    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [editingRule, setEditingRule] = useState(null);
    const [formSaving, setFormSaving] = useState(false);

    const [statusRule, setStatusRule] = useState(null);
    const [statusSaving, setStatusSaving] = useState(false);

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState(null);

    const totalElements = allItems.length;
    const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / PAGE_SIZE);

    const pageItems = useMemo(() => {
        const start = page * PAGE_SIZE;
        return allItems.slice(start, start + PAGE_SIZE);
    }, [allItems, page]);

    const loadRules = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const filters = {};
            if (keyword.trim()) filters.keyword = keyword.trim();
            if (ruleType) filters.ruleType = ruleType;
            if (appliesTo) filters.appliesTo = appliesTo;
            if (active === 'true' || active === 'false') filters.active = active === 'true';

            const collected = [];
            let apiPage = 0;
            let totalFromApi = Infinity;

            while (collected.length < totalFromApi && apiPage < 50) {
                const pageData = await searchTrustScoreRules({
                    ...filters,
                    page: apiPage,
                    size: FETCH_SIZE,
                });
                const content = pageData?.content ?? [];
                totalFromApi =
                    typeof pageData?.totalElements === 'number'
                        ? pageData.totalElements
                        : collected.length + content.length;
                collected.push(...content);
                if (content.length === 0 || content.length < FETCH_SIZE) break;
                apiPage += 1;
            }

            setAllItems(sortRulesForAdminList(collected));
        } catch (err) {
            setError(
                getTrustScoreRuleApiErrorMessage(err, 'Không thể tải danh sách quy tắc điểm uy tín.')
            );
            setAllItems([]);
        } finally {
            setLoading(false);
        }
    }, [keyword, ruleType, appliesTo, active]);

    useEffect(() => {
        loadRules();
    }, [loadRules]);

    useEffect(() => {
        if (totalPages === 0) {
            if (page !== 0) setPage(0);
            return;
        }
        if (page > totalPages - 1) setPage(totalPages - 1);
    }, [page, totalPages]);

    const openCreate = () => {
        setFormMode('create');
        setEditingRule(null);
        setFormOpen(true);
    };

    const openEdit = (rule) => {
        if (isSystemRuleType(rule?.ruleType)) {
            toast.info('Quy tắc hệ thống chỉ xem, không chỉnh sửa từ màn này.');
            return;
        }
        setFormMode('edit');
        setEditingRule(rule);
        setFormOpen(true);
        setDetailOpen(false);
    };

    const openStatus = (rule) => {
        if (isSystemRuleType(rule?.ruleType)) {
            toast.info('Quy tắc hệ thống không bật/tắt từ màn này.');
            return;
        }
        setStatusRule(rule);
        setDetailOpen(false);
    };

    const openDetail = async (rule) => {
        if (!rule?.id) return;
        setDetailOpen(true);
        setDetailLoading(true);
        setDetailData({ rule, changeHistory: [] });
        try {
            const data = await getTrustScoreRuleDetail(rule.id);
            setDetailData(data);
        } catch (err) {
            toast.error(getTrustScoreRuleApiErrorMessage(err, 'Không tải được chi tiết quy tắc.'));
            setDetailOpen(false);
            setDetailData(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleFormSubmit = async (payload) => {
        setFormSaving(true);
        try {
            if (formMode === 'edit' && editingRule?.id) {
                await updateTrustScoreRule(editingRule.id, payload);
                toast.success('Đã cập nhật quy tắc điểm uy tín.');
            } else {
                await createTrustScoreRule(payload);
                toast.success('Đã tạo quy tắc điểm uy tín.');
            }
            setFormOpen(false);
            setEditingRule(null);
            if (formMode === 'create') setPage(0);
            await loadRules();
        } catch (err) {
            const status = err?.response?.status;
            const message = getTrustScoreRuleApiErrorMessage(err, 'Không thể lưu quy tắc.');
            toast.error(message);
            if (status === 409 && formMode === 'edit' && editingRule?.id) {
                try {
                    const data = await getTrustScoreRuleDetail(editingRule.id);
                    setEditingRule(data?.rule || editingRule);
                    toast.info('Đã tải lại phiên bản mới nhất của quy tắc.');
                } catch {
                    /* ignore reload failure */
                }
            }
        } finally {
            setFormSaving(false);
        }
    };

    const handleStatusConfirm = async ({ reason, version }) => {
        if (!statusRule?.id) return;
        setStatusSaving(true);
        try {
            const payload = { reason, version };
            if (statusRule.active) {
                await deactivateTrustScoreRule(statusRule.id, payload);
                toast.success('Đã vô hiệu hóa quy tắc.');
            } else {
                await activateTrustScoreRule(statusRule.id, payload);
                toast.success('Đã kích hoạt quy tắc.');
            }
            setStatusRule(null);
            await loadRules();
        } catch (err) {
            const status = err?.response?.status;
            toast.error(getTrustScoreRuleApiErrorMessage(err, 'Không thể đổi trạng thái quy tắc.'));
            if (status === 409 && statusRule?.id) {
                try {
                    const data = await getTrustScoreRuleDetail(statusRule.id);
                    setStatusRule(data?.rule || statusRule);
                    toast.info('Đã tải lại phiên bản mới nhất của quy tắc.');
                } catch {
                    /* ignore */
                }
            }
        } finally {
            setStatusSaving(false);
        }
    };

    const applySearch = (e) => {
        e?.preventDefault?.();
        setPage(0);
        setKeyword(keywordInput);
    };

    return (
        <div className="admin-skills-page admin-trust-rules-page">
            <header className="admin-skills-page__header">
                <div>
                    <h1 className="admin-skills-page__title">Cấu hình điểm uy tín</h1>
                    <p className="admin-skills-page__subtitle">
                        Quản lý quy tắc cộng/trừ điểm uy tín theo đánh giá, báo cáo đã xử lý, ngưỡng
                        cảnh báo và phục hồi uy tín. Thay đổi chỉ áp dụng cho sự kiện mới.
                    </p>
                </div>
                <button
                    type="button"
                    className="admin-skills-btn admin-skills-btn--primary"
                    onClick={openCreate}
                >
                    + Tạo quy tắc
                </button>
            </header>

            <form className="admin-skills-filters" onSubmit={applySearch}>
                <div className="admin-skills-filters__keyword">
                    <input
                        className="admin-skills-filters__search"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        placeholder="Tìm theo mã, sự kiện hoặc tên quy tắc..."
                        aria-label="Tìm quy tắc điểm uy tín"
                    />
                </div>
                <select
                    value={ruleType}
                    onChange={(e) => {
                        setPage(0);
                        setRuleType(e.target.value);
                    }}
                    aria-label="Lọc theo loại quy tắc"
                >
                    {RULE_TYPE_FILTER_OPTIONS.map((opt) => (
                        <option key={opt.value || 'all-types'} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <select
                    value={appliesTo}
                    onChange={(e) => {
                        setPage(0);
                        setAppliesTo(e.target.value);
                    }}
                    aria-label="Lọc theo đối tượng áp dụng"
                >
                    {APPLIES_TO_FILTER_OPTIONS.map((opt) => (
                        <option key={opt.value || 'all-targets'} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <select
                    value={active}
                    onChange={(e) => {
                        setPage(0);
                        setActive(e.target.value);
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
                            <th>Mã quy tắc</th>
                            <th>Tên</th>
                            <th>Loại</th>
                            <th>Sự kiện</th>
                            <th>Đối tượng</th>
                            <th>Giá trị</th>
                            <th>Trạng thái</th>
                            <th>Cập nhật</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && allItems.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="admin-skills-table__empty">
                                    Đang tải...
                                </td>
                            </tr>
                        ) : null}
                        {!loading && allItems.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="admin-skills-table__empty">
                                    Chưa có quy tắc điểm uy tín phù hợp bộ lọc.
                                </td>
                            </tr>
                        ) : null}
                        {pageItems.map((rule) => {
                            const system = isSystemRuleType(rule.ruleType);
                            return (
                                <tr key={rule.id}>
                                    <td>
                                        <code>{rule.ruleCode}</code>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="admin-trust-link"
                                            onClick={() => openDetail(rule)}
                                        >
                                            {rule.displayName || '—'}
                                        </button>
                                    </td>
                                    <td>{getRuleTypeLabel(rule.ruleType)}</td>
                                    <td>
                                        <code>{rule.eventType}</code>
                                    </td>
                                    <td>{getAppliesToLabel(rule.appliesTo)}</td>
                                    <td>{formatScoreValue(rule.scoreValue, rule.ruleType)}</td>
                                    <td>
                                        <span
                                            className={`admin-skills-badge ${
                                                rule.active
                                                    ? 'admin-skills-badge--active'
                                                    : 'admin-skills-badge--inactive'
                                            }`}
                                        >
                                            {rule.active ? 'Đang hoạt động' : 'Đã vô hiệu'}
                                        </span>
                                    </td>
                                    <td>{formatDateTime(rule.updatedAt)}</td>
                                    <td>
                                        <div
                                            className={`admin-trust-actions${
                                                system ? ' admin-trust-actions--detail-only' : ''
                                            }`}
                                        >
                                            <div className="admin-trust-actions__row">
                                                <button
                                                    type="button"
                                                    className="admin-skills-btn admin-skills-btn--ghost admin-skills-btn--sm"
                                                    onClick={() => openDetail(rule)}
                                                >
                                                    Chi tiết
                                                </button>
                                            </div>
                                            {!system ? (
                                                <div className="admin-trust-actions__row">
                                                    <button
                                                        type="button"
                                                        className="admin-skills-btn admin-skills-btn--ghost admin-skills-btn--sm"
                                                        onClick={() => openEdit(rule)}
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`admin-skills-btn admin-skills-btn--sm ${
                                                            rule.active
                                                                ? 'admin-skills-btn--danger'
                                                                : 'admin-skills-btn--primary'
                                                        }`}
                                                        onClick={() => openStatus(rule)}
                                                    >
                                                        {rule.active ? 'Tắt' : 'Bật'}
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="admin-skills-pagination">
                <span>
                    {totalElements} quy tắc · Trang {totalPages === 0 ? 0 : page + 1}/
                    {totalPages || 0} · {PAGE_SIZE}/trang
                </span>
                <div className="admin-skills-pagination__controls">
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

            <TrustScoreRuleFormModal
                open={formOpen}
                mode={formMode}
                initialRule={editingRule}
                loading={formSaving}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                    if (formSaving) return;
                    setFormOpen(false);
                    setEditingRule(null);
                }}
            />

            <TrustScoreRuleStatusModal
                open={Boolean(statusRule)}
                rule={statusRule}
                loading={statusSaving}
                onConfirm={handleStatusConfirm}
                onCancel={() => {
                    if (statusSaving) return;
                    setStatusRule(null);
                }}
            />

            <TrustScoreRuleDetailModal
                open={detailOpen}
                detail={detailData}
                loading={detailLoading}
                onClose={() => {
                    setDetailOpen(false);
                    setDetailData(null);
                }}
                onEdit={openEdit}
                onToggleStatus={openStatus}
            />
        </div>
    );
};

export default AdminTrustScoreRulesPage;
