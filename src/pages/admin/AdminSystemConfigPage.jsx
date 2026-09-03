import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    getAdminSystemConfigApiErrorMessage,
    listAdminSystemConfigurations,
    updateAdminSystemConfiguration,
} from '../../apis/AdminSystemConfigApi.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import {
    ChartIcon,
    ChevronDownIcon,
    LayersIcon,
    SettingsIcon,
    ShieldIcon,
    SparklesIcon,
    TrendingIcon,
} from '../../components/common/icons.jsx';
import { getSystemConfigJsonFieldLabel, getSystemConfigUiMeta } from '../../constants/adminSystemConfigUiMap.js';
import { ROUTES } from '../../routes/path.js';
import {
    CONFIG_DATA_TYPE,
    areConfigValuesEqual,
    buildSystemConfigSubSections,
    buildSystemConfigUiSections,
    cloneConfigDraftValue,
    formatConfigDefaultFieldDisplay,
    getJsonConfigDefaultEntries,
    parseAllowedRange,
    toApiConfigNewValue,
    validateConfigDraftValue,
    validateSystemConfigConstraints,
} from '../../utils/adminSystemConfigDisplay.js';
import '../../assets/styles/AdminAccountsPageStyle.css';
import '../../assets/styles/AdminSystemConfigPageStyle.css';

const GROUP_ICONS = {
    Sparkles: SparklesIcon,
    Trending: TrendingIcon,
    Shield: ShieldIcon,
    Settings: SettingsIcon,
    Chart: ChartIcon,
    Layers: LayersIcon,
};

const resolveGroupIcon = (rows) => {
    const name = rows?.[0]?.meta?.icon || 'Settings';
    return GROUP_ICONS[name] || SettingsIcon;
};

const formatDefaultHint = (value) => {
    if (value == null || value === '') return '—';
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
};

const AdminSystemConfigPage = () => {
    const [items, setItems] = useState([]);
    const [drafts, setDrafts] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [saveOpen, setSaveOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [reasonError, setReasonError] = useState('');
    const [saving, setSaving] = useState(false);
    /** group -> true = thu gọn */
    const [collapsed, setCollapsed] = useState({});

    const initDrafts = useCallback((list) => {
        const next = {};
        list.forEach((item) => {
            const meta = getSystemConfigUiMeta(item.configKey, item.configGroup, item);
            const forceJson = meta.isJson || String(item.dataType || '').toUpperCase() === CONFIG_DATA_TYPE.JSON;
            next[item.configKey] = cloneConfigDraftValue(item.currentValue, item.dataType, forceJson);
        });
        setDrafts(next);
    }, []);

    const loadList = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await listAdminSystemConfigurations();
            const list = Array.isArray(data) ? data : data?.content ?? [];
            setItems(list);
            initDrafts(list);
        } catch (err) {
            setItems([]);
            setDrafts({});
            setError(getAdminSystemConfigApiErrorMessage(err, 'Không tải được danh sách cấu hình.'));
        } finally {
            setLoading(false);
        }
    }, [initDrafts]);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (isMounted) {
                await loadList();
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [loadList]);

    const sections = useMemo(
        () => buildSystemConfigUiSections(items, getSystemConfigUiMeta),
        [items]
    );

    const toggleGroup = (group, currentlyCollapsed) => {
        setCollapsed((prev) => ({ ...prev, [group]: !currentlyCollapsed }));
    };

    const dirtyKeys = useMemo(() => {
        return items
            .filter((item) => {
                const meta = getSystemConfigUiMeta(item.configKey, item.configGroup, item);
                const forceJson = meta.isJson || String(item.dataType || '').toUpperCase() === CONFIG_DATA_TYPE.JSON;
                const dataType = forceJson ? CONFIG_DATA_TYPE.JSON : item.dataType;
                return !areConfigValuesEqual(drafts[item.configKey], item.currentValue, dataType);
            })
            .map((item) => item.configKey);
    }, [items, drafts]);

    const dirtyCount = dirtyKeys.length;

    const dirtyCountByGroup = useMemo(() => {
        const map = {};
        dirtyKeys.forEach((key) => {
            const item = items.find((row) => row.configKey === key);
            const group = getSystemConfigUiMeta(key, item?.configGroup, item).group;
            map[group] = (map[group] || 0) + 1;
        });
        return map;
    }, [dirtyKeys, items]);

    const setScalarDraft = (configKey, value) => {
        setDrafts((prev) => ({ ...prev, [configKey]: value }));
    };

    const setJsonFieldDraft = (configKey, fieldKey, value) => {
        setDrafts((prev) => ({
            ...prev,
            [configKey]: {
                ...(prev[configKey] && typeof prev[configKey] === 'object' ? prev[configKey] : {}),
                [fieldKey]: value,
            },
        }));
    };

    const validation = useMemo(() => {
        return validateSystemConfigConstraints(drafts, items);
    }, [drafts, items]);

    const openSaveModal = () => {
        if (dirtyCount === 0) {
            toast.info('Chưa có thay đổi nào để lưu.');
            return;
        }
        if (!validation.isValid) {
            toast.error(validation.errors[0]?.message || 'Có ràng buộc cấu hình chưa hợp lệ. Vui lòng kiểm tra lại.');
            return;
        }
        setReason('');
        setReasonError('');
        setSaveOpen(true);
    };

    const handleConfirmSave = async () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            setReasonError('Vui lòng nhập lý do.');
            return;
        }

        if (!validation.isValid) {
            setReasonError(validation.errors[0]?.message || 'Vui lòng sửa các lỗi ràng buộc trước khi lưu.');
            return;
        }

        const toSave = items.filter((item) => dirtyKeys.includes(item.configKey));
        const payloads = [];

        for (const item of toSave) {
            const meta = getSystemConfigUiMeta(item.configKey, item.configGroup, item);
            const forceJson = meta.isJson || String(item.dataType || '').toUpperCase() === CONFIG_DATA_TYPE.JSON;
            const configForValidate = forceJson
                ? { ...item, dataType: CONFIG_DATA_TYPE.JSON }
                : item;
            const parsed = validateConfigDraftValue(drafts[item.configKey], configForValidate);
            if (!parsed.ok) {
                setReasonError(parsed.error || `Giá trị không hợp lệ: ${item.configKey}`);
                return;
            }
            payloads.push({
                key: item.configKey,
                newValue: parsed.value,
                forceJson,
                item,
            });
        }

        setSaving(true);
        setReasonError('');
        let successCount = 0;
        try {
            for (const payload of payloads) {
                const apiNewValue = toApiConfigNewValue(
                    payload.newValue,
                    payload.item.dataType,
                    payload.forceJson
                );
                const updated = await updateAdminSystemConfiguration(payload.key, {
                    newValue: apiNewValue,
                    reason: trimmed,
                });
                successCount += 1;
                setItems((prev) =>
                    prev.map((row) =>
                        row.configKey === payload.key
                            ? {
                                ...row,
                                ...(updated || {}),
                                currentValue: updated?.currentValue ?? payload.newValue,
                            }
                            : row
                    )
                );
                setDrafts((prev) => ({
                    ...prev,
                    [payload.key]: cloneConfigDraftValue(
                        updated?.currentValue ?? payload.newValue,
                        payload.item.dataType,
                        payload.forceJson
                    ),
                }));
            }
            toast.success(
                successCount === 1
                    ? 'Đã cập nhật cấu hình.'
                    : `Đã cập nhật ${successCount} cấu hình.`
            );
            setSaveOpen(false);
            setReason('');
        } catch (err) {
            toast.error(getAdminSystemConfigApiErrorMessage(err, 'Cập nhật cấu hình thất bại.'));
        } finally {
            setSaving(false);
        }
    };

    const renderScalarInput = (item, meta) => {
        const type = String(item.dataType || '').toUpperCase();
        const value = drafts[item.configKey];

        if (type === CONFIG_DATA_TYPE.BOOLEAN) {
            const boolVal = value === true || value === 'true' ? 'true' : 'false';
            return (
                <select
                    className="admin-config-inline__control"
                    value={boolVal}
                    onChange={(e) => setScalarDraft(item.configKey, e.target.value === 'true')}
                    aria-label={meta.label}
                >
                    <option value="true">Bật (true)</option>
                    <option value="false">Tắt (false)</option>
                </select>
            );
        }

        if (item.configKey === 'TOP_RECRUITER_ACCOUNT_AGE_REFERENCE') {
            return (
                <select
                    className="admin-config-inline__control"
                    value={value ?? 'VERIFIED_AT'}
                    onChange={(e) => setScalarDraft(item.configKey, e.target.value)}
                    aria-label={meta.label}
                >
                    <option value="VERIFIED_AT">VERIFIED_AT (Tính từ ngày xác thực)</option>
                    <option value="CREATED_AT">CREATED_AT (Tính từ ngày tạo tài khoản)</option>
                </select>
            );
        }

        let inputMin;
        let inputMax;
        let inputStep = 'any';

        if (type === CONFIG_DATA_TYPE.NUMBER) {
            const range = parseAllowedRange(item.allowedRange);
            if (range?.min != null) inputMin = range.min;
            if (range?.max != null) inputMax = range.max;
            if (item.allowedRange === '0-1') {
                inputStep = '0.05';
            } else if (item.allowedRange === '0-100') {
                inputStep = '1';
            }
        }

        return (
            <div className="admin-config-inline__input-wrap">
                <input
                    className="admin-config-inline__control"
                    type={type === CONFIG_DATA_TYPE.NUMBER ? 'number' : 'text'}
                    min={inputMin}
                    max={inputMax}
                    step={inputStep}
                    value={value ?? ''}
                    onChange={(e) => {
                        const raw = e.target.value;
                        if (type === CONFIG_DATA_TYPE.NUMBER) {
                            setScalarDraft(item.configKey, raw === '' ? '' : raw);
                        } else {
                            setScalarDraft(item.configKey, raw);
                        }
                    }}
                    aria-label={meta.label}
                />
                {meta.unit ? <span className="admin-config-inline__unit">{meta.unit}</span> : null}
            </div>
        );
    };

    const renderJsonFields = (item, meta) => {
        const obj = drafts[item.configKey] && typeof drafts[item.configKey] === 'object'
            ? drafts[item.configKey]
            : {};
        const entries = Object.entries(obj);

        if (entries.length === 0) {
            return (
                <div className="admin-config-current-block">
                    <span className="admin-config-current-block__title">Giá trị hiện tại</span>
                    <p className="admin-config-inline__empty-json">
                        Không parse được field con — giá trị trống hoặc không phải object JSON.
                    </p>
                </div>
            );
        }

        return (
            <div className="admin-config-current-block">
                <span className="admin-config-current-block__title">Giá trị hiện tại</span>
                <div className="admin-config-json-grid">
                    {entries.map(([fieldKey, fieldVal]) => {
                    const isNested = fieldVal != null && typeof fieldVal === 'object';
                    return (
                        <label key={fieldKey} className="admin-config-json-field">
                            <span className="admin-config-json-field__label">
                                {getSystemConfigJsonFieldLabel(fieldKey)}
                            </span>
                            {isNested ? (
                                <textarea
                                    className="admin-config-inline__control admin-config-inline__control--json"
                                    rows={3}
                                    value={typeof fieldVal === 'string' ? fieldVal : JSON.stringify(fieldVal, null, 2)}
                                    onChange={(e) => {
                                        const text = e.target.value;
                                        try {
                                            setJsonFieldDraft(item.configKey, fieldKey, JSON.parse(text));
                                        } catch {
                                            setJsonFieldDraft(item.configKey, fieldKey, text);
                                        }
                                    }}
                                    aria-label={`${meta.label} · ${fieldKey}`}
                                />
                            ) : typeof fieldVal === 'boolean' ? (
                                <select
                                    className="admin-config-inline__control"
                                    value={fieldVal ? 'true' : 'false'}
                                    onChange={(e) =>
                                        setJsonFieldDraft(item.configKey, fieldKey, e.target.value === 'true')
                                    }
                                >
                                    <option value="true">true</option>
                                    <option value="false">false</option>
                                </select>
                            ) : (
                                <input
                                    className="admin-config-inline__control"
                                    type={typeof fieldVal === 'number' ? 'number' : 'text'}
                                    step="any"
                                    value={fieldVal ?? ''}
                                    onChange={(e) => {
                                        const raw = e.target.value;
                                        if (typeof fieldVal === 'number') {
                                            setJsonFieldDraft(
                                                item.configKey,
                                                fieldKey,
                                                raw === '' ? '' : Number(raw)
                                            );
                                        } else {
                                            setJsonFieldDraft(item.configKey, fieldKey, raw);
                                        }
                                    }}
                                    aria-label={`${meta.label} · ${fieldKey}`}
                                />
                            )}
                        </label>
                    );
                })}
                </div>
            </div>
        );
    };

    const renderJsonDefaultGrid = (item) => {
        const draftObj =
            drafts[item.configKey] && typeof drafts[item.configKey] === 'object'
                ? drafts[item.configKey]
                : {};
        const entries = getJsonConfigDefaultEntries(item.defaultValue, draftObj);

        if (entries.length === 0) {
            return (
                <span className="admin-config-param__default">
                    Mặc định: —
                    {item.allowedRange ? ` · Phạm vi: ${item.allowedRange}` : ''}
                </span>
            );
        }

        return (
            <div className="admin-config-default-block">
                <span className="admin-config-default-block__title">Mặc định</span>
                <div className="admin-config-json-grid admin-config-json-grid--default">
                    {entries.map(([fieldKey, fieldVal]) => (
                        <div key={fieldKey} className="admin-config-default-field">
                            <span className="admin-config-json-field__label">
                                {getSystemConfigJsonFieldLabel(fieldKey)}
                            </span>
                            <span className="admin-config-default-field__value">
                                {formatConfigDefaultFieldDisplay(fieldVal)}
                            </span>
                        </div>
                    ))}
                </div>
                {item.allowedRange ? (
                    <span className="admin-config-param__default-range">
                        Phạm vi: {item.allowedRange}
                    </span>
                ) : null}
            </div>
        );
    };

    return (
        <div className="admin-config-page">
            <header className="admin-config-page__header">
                <div>
                    <h1>Cấu hình hệ thống</h1>
                    <p>
                        Quản lý tham số nền tảng theo nhóm — chỉnh trên card rồi lưu một lần.
                        {' '}
                        <Link to={ROUTES.ADMIN_AUDIT_LOG}>Nhật ký hoạt động</Link>
                    </p>
                </div>
                <div className="admin-config-page__header-actions">
                    <button
                        type="button"
                        className="admin-accounts-btn admin-accounts-btn--ghost"
                        onClick={loadList}
                        disabled={loading || saving}
                    >
                        Làm mới
                    </button>
                    <button
                        type="button"
                        className="admin-accounts-btn admin-accounts-btn--primary"
                        onClick={openSaveModal}
                        disabled={loading || saving || dirtyCount === 0 || !validation.isValid}
                        title={!validation.isValid ? 'Vui lòng sửa các lỗi ràng buộc trước khi lưu' : ''}
                    >
                        Lưu cấu hình{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
                    </button>
                </div>
            </header>

            {error ? <p className="admin-config-page__error" role="alert">{error}</p> : null}

            {!validation.isValid && items.length > 0 ? (
                <div className="admin-config-global-alert" role="alert">
                    <div className="admin-config-global-alert__header">
                        <span className="admin-config-global-alert__icon" aria-hidden>⚠️</span>
                        <div className="admin-config-global-alert__titles">
                            <strong>Phát hiện {validation.errors.length} vi phạm ràng buộc logic cấu hình:</strong>
                            <p>Các nhóm trọng số cần đạt đúng 100% và tuân thủ thứ tự vòng lọc để đảm bảo thuật toán tính điểm chạy chuẩn xác.</p>
                        </div>
                    </div>
                    <ul className="admin-config-global-alert__list">
                        {validation.errors.map((err, idx) => (
                            <li key={idx}>{err.message}</li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {loading && items.length === 0 ? (
                <p className="admin-config-page__empty">Đang tải cấu hình…</p>
            ) : sections.length === 0 ? (
                <p className="admin-config-page__empty">Chưa có cấu hình nào được phép quản lý.</p>
            ) : (
                <div className="admin-config-dashboard">
                    {sections.map(({ group, rows }, sectionIndex) => {
                        const Icon = resolveGroupIcon(rows);
                        const isCollapsed = collapsed[group] !== undefined
                            ? Boolean(collapsed[group])
                            : sectionIndex !== 0;
                        const groupDirty = dirtyCountByGroup[group] || 0;
                        const hasJson = rows.some(
                            ({ item, meta }) =>
                                meta.isJson
                                || String(item.dataType || '').toUpperCase() === CONFIG_DATA_TYPE.JSON
                        );
                        const isDiscoveryGroup = group === 'Khám phá và Xu hướng';
                        const subSections = isDiscoveryGroup ? buildSystemConfigSubSections(rows) : [];

                        return (
                            <section
                                key={group}
                                className={`admin-config-dash-card${hasJson ? ' admin-config-dash-card--json' : ''}`}
                            >
                                <button
                                    type="button"
                                    className="admin-config-dash-card__head"
                                    onClick={() => toggleGroup(group, isCollapsed)}
                                    aria-expanded={!isCollapsed}
                                >
                                    <span className="admin-config-dash-card__icon" aria-hidden>
                                        <Icon width={18} height={18} />
                                    </span>
                                    <div className="admin-config-dash-card__titles">
                                        <h2>{group}</h2>
                                        <p>
                                            {rows.length} tham số{isDiscoveryGroup ? ` · ${subSections.length} nhóm nghiệp vụ` : ''}
                                            {groupDirty > 0 ? ` · ${groupDirty} chưa lưu` : ''}
                                        </p>
                                    </div>
                                    <span
                                        className={`admin-config-dash-card__chevron${isCollapsed ? ' is-collapsed' : ''}`}
                                        aria-hidden
                                    >
                                        <ChevronDownIcon width={18} height={18} />
                                    </span>
                                </button>

                                {!isCollapsed && (
                                    isDiscoveryGroup ? (
                                        <div className="admin-config-sub-container">
                                            {subSections.map(({ subGroupId, def, rows: subRows }) => {
                                                const status = validation.groupStatuses[subGroupId];
                                                const isSumType = def.type === 'sum100';

                                                return (
                                                    <div key={subGroupId} className="admin-config-sub-section">
                                                        <div className="admin-config-sub-head">
                                                            <div className="admin-config-sub-head__titles">
                                                                <h3>{def.title}</h3>
                                                                {def.description ? (
                                                                    <p className="admin-config-sub-head__desc">{def.description}</p>
                                                                ) : null}
                                                            </div>
                                                            {isSumType && status ? (
                                                                <div className="admin-config-sub-head__badge-wrap">
                                                                    <span
                                                                        className={`admin-config-sum-badge ${
                                                                            status.isValid
                                                                                ? 'admin-config-sum-badge--valid'
                                                                                : 'admin-config-sum-badge--invalid'
                                                                        }`}
                                                                    >
                                                                        {status.isValid
                                                                            ? `✓ Tổng: ${status.sum}% / 100% (Chuẩn)`
                                                                            : `⚠️ Tổng: ${status.sum}% / 100% (${
                                                                                status.diff > 0
                                                                                    ? `Dư +${status.diff}%`
                                                                                    : `Thiếu ${Math.abs(status.diff)}%`
                                                                            })`}
                                                                    </span>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                        <ul className="admin-config-dash-card__list">
                                                            {subRows.map(({ item, meta }) => {
                                                                const forceJson = meta.isJson
                                                                    || String(item.dataType || '').toUpperCase() === CONFIG_DATA_TYPE.JSON;
                                                                const isDirty = dirtyKeys.includes(item.configKey);

                                                                return (
                                                                    <li
                                                                        key={item.configKey}
                                                                        className={`admin-config-param${forceJson ? ' admin-config-param--json' : ' admin-config-param--tile'}${isDirty ? ' is-dirty' : ''}`}
                                                                    >
                                                                        <div className="admin-config-param__label">
                                                                            <div className="admin-config-param__header-row">
                                                                                <strong>{meta.label}</strong>
                                                                                {forceJson && (
                                                                                    <span className="admin-config-pill admin-config-pill--json">JSON</span>
                                                                                )}
                                                                            </div>
                                                                            <small>{item.configKey}</small>
                                                                            {item.description ? (
                                                                                <span
                                                                                    className="admin-config-param__desc"
                                                                                    title={item.affectedFunctions ? `${item.description} (Ảnh hưởng: ${item.affectedFunctions})` : item.description}
                                                                                >
                                                                                    {item.description}
                                                                                </span>
                                                                            ) : null}
                                                                            {item.affectedFunctions ? (
                                                                                <span className="admin-config-param__affected">
                                                                                    ⚙️ {item.affectedFunctions}
                                                                                </span>
                                                                            ) : null}
                                                                        </div>

                                                                        <div className="admin-config-param__editor">
                                                                            {forceJson
                                                                                ? renderJsonFields(item, meta)
                                                                                : renderScalarInput(item, meta)}
                                                                            {forceJson ? (
                                                                                renderJsonDefaultGrid(item)
                                                                            ) : (
                                                                                <div className="admin-config-param__meta-row">
                                                                                    <span className="admin-config-pill admin-config-pill--default">
                                                                                        Mặc định: <strong>{formatDefaultHint(item.defaultValue)}{meta.unit ? ` ${meta.unit}` : ''}</strong>
                                                                                    </span>
                                                                                    {item.allowedRange ? (
                                                                                        <span className="admin-config-pill admin-config-pill--range">
                                                                                            Phạm vi: <strong>{item.allowedRange}</strong>
                                                                                        </span>
                                                                                    ) : null}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <ul className="admin-config-dash-card__list">
                                            {rows.map(({ item, meta }) => {
                                                const forceJson = meta.isJson
                                                    || String(item.dataType || '').toUpperCase() === CONFIG_DATA_TYPE.JSON;
                                                const isDirty = dirtyKeys.includes(item.configKey);

                                                return (
                                                    <li
                                                        key={item.configKey}
                                                        className={`admin-config-param${forceJson ? ' admin-config-param--json' : ' admin-config-param--tile'}${isDirty ? ' is-dirty' : ''}`}
                                                    >
                                                        <div className="admin-config-param__label">
                                                            <div className="admin-config-param__header-row">
                                                                <strong>{meta.label}</strong>
                                                                {forceJson && (
                                                                    <span className="admin-config-pill admin-config-pill--json">JSON</span>
                                                                )}
                                                            </div>
                                                            <small>{item.configKey}</small>
                                                            {item.description ? (
                                                                <span
                                                                    className="admin-config-param__desc"
                                                                    title={item.affectedFunctions ? `${item.description} (Ảnh hưởng: ${item.affectedFunctions})` : item.description}
                                                                >
                                                                    {item.description}
                                                                </span>
                                                            ) : null}
                                                            {item.affectedFunctions ? (
                                                                <span className="admin-config-param__affected">
                                                                    ⚙️ {item.affectedFunctions}
                                                                </span>
                                                            ) : null}
                                                        </div>

                                                        <div className="admin-config-param__editor">
                                                            {forceJson
                                                                ? renderJsonFields(item, meta)
                                                                : renderScalarInput(item, meta)}
                                                            {forceJson ? (
                                                                renderJsonDefaultGrid(item)
                                                            ) : (
                                                                <div className="admin-config-param__meta-row">
                                                                    <span className="admin-config-pill admin-config-pill--default">
                                                                        Mặc định: <strong>{formatDefaultHint(item.defaultValue)}{meta.unit ? ` ${meta.unit}` : ''}</strong>
                                                                    </span>
                                                                    {item.allowedRange ? (
                                                                        <span className="admin-config-pill admin-config-pill--range">
                                                                            Phạm vi: <strong>{item.allowedRange}</strong>
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )
                                )}
                            </section>
                        );
                    })}
                </div>
            )}

            <ConfirmModal
                open={saveOpen}
                title="Xác nhận lưu cấu hình"
                confirmLabel={saving ? 'Đang lưu…' : `Lưu ${dirtyCount} thay đổi`}
                variant="primary"
                loading={saving}
                onConfirm={handleConfirmSave}
                onCancel={() => {
                    if (!saving) setSaveOpen(false);
                }}
            >
                <p className="admin-config__hint">
                    Sẽ gọi cập nhật từng key đã đổi (cùng một lý do). Thay đổi áp dụng ngay sau khi lưu.
                </p>
                <ul className="admin-config-save-keys">
                    {dirtyKeys.map((key) => {
                        const rowItem = items.find((row) => row.configKey === key);
                        return (
                            <li key={key}>
                                {getSystemConfigUiMeta(key, rowItem?.configGroup, rowItem).label} <small>({key})</small>
                            </li>
                        );
                    })}
                </ul>
                <label className="admin-accounts__field">
                    <span>Lý do thay đổi</span>
                    <textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            setReasonError('');
                        }}
                        placeholder="Bắt buộc nhập lý do…"
                        disabled={saving}
                    />
                </label>
                {reasonError ? <p className="admin-accounts__field-error">{reasonError}</p> : null}
            </ConfirmModal>
        </div>
    );
};

export default AdminSystemConfigPage;
