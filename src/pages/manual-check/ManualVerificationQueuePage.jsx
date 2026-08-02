import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    getManualRejectReasons,
    getManualVerificationApiErrorMessage,
    getManualVerificationDetail,
    getManualVerificationQueue,
    submitManualVerificationDecision,
} from '../../apis/ManualVerificationApi.jsx';
import {
    formatAiRiskLevel,
    formatVerificationType,
    mediaFilesToEntries,
    toLabelValueEntries,
    toReasonList,
} from '../../utils/verificationDisplay.js';
import '../../assets/styles/ManualVerificationQueuePageStyle.css';

const PAGE_SIZE = 20;

const ManualVerificationQueuePage = () => {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [queueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState('');
    const [search, setSearch] = useState('');

    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');

    const [rejectReasons, setRejectReasons] = useState([]);
    const [decision, setDecision] = useState('APPROVE');
    const [rejectReason, setRejectReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadQueue = useCallback(async (pageNum = 0, { append = false } = {}) => {
        setQueueLoading(true);
        setQueueError('');
        try {
            const data = await getManualVerificationQueue({ page: pageNum, size: PAGE_SIZE });
            const content = data?.content ?? (Array.isArray(data) ? data : []);
            setItems((prev) => (append ? [...prev, ...content] : content));
            setPage(data?.currentPage ?? data?.number ?? pageNum);
            setTotalPages(data?.totalPages ?? 1);
        } catch (err) {
            setQueueError(getManualVerificationApiErrorMessage(err, 'Không tải được hàng chờ.'));
            if (!append) {
                setItems([]);
                setTotalPages(0);
            }
        } finally {
            setQueueLoading(false);
        }
    }, []);

    const loadDetail = useCallback(async (id) => {
        if (!id) {
            setDetail(null);
            setDetailError('');
            return;
        }
        setDetailLoading(true);
        setDetailError('');
        try {
            const data = await getManualVerificationDetail(id);
            setDetail(data);
            setDecision('APPROVE');
            setRejectReason('');
            setCustomReason('');
        } catch (err) {
            setDetail(null);
            setDetailError(getManualVerificationApiErrorMessage(err, 'Không tải được chi tiết hồ sơ.'));
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        loadQueue(0);
        getManualRejectReasons()
            .then((list) => setRejectReasons(Array.isArray(list) ? list : []))
            .catch(() => setRejectReasons([]));
    }, [loadQueue]);

    useEffect(() => {
        loadDetail(selectedId);
    }, [selectedId, loadDetail]);

    const filteredItems = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return items;
        return items.filter((item) => {
            const hay = [
                item.businessName,
                item.userFullName,
                item.taxCode,
                item.submittedIdentifier,
                item.verificationType,
                item.status,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return hay.includes(keyword);
        });
    }, [items, search]);

    const mediaEntries = useMemo(
        () => mediaFilesToEntries(detail?.mediaFiles),
        [detail?.mediaFiles]
    );

    const extractedEntries = useMemo(
        () => toLabelValueEntries(detail?.extractedData),
        [detail?.extractedData]
    );

    const failedReasonList = useMemo(
        () => toReasonList(detail?.failedReasons),
        [detail?.failedReasons]
    );

    const reasonOptions = useMemo(() => {
        if (!Array.isArray(rejectReasons) || rejectReasons.length === 0) return [];
        return rejectReasons.map((item) => {
            if (typeof item === 'string') return { value: item, label: item };
            return {
                value: item.code || item.value || item.reason || item.label,
                label: item.label || item.reason || item.message || item.code,
            };
        }).filter((item) => item.value);
    }, [rejectReasons]);

    const handleSubmitDecision = async () => {
        if (!selectedId) return;
        if (decision === 'REJECTED') {
            const finalReason = (customReason.trim() || rejectReason || '').trim();
            if (!finalReason) {
                toast.error('Vui lòng chọn hoặc nhập lý do từ chối.');
                return;
            }
        }

        setSubmitting(true);
        try {
            await submitManualVerificationDecision(selectedId, {
                decision,
                rejectReason:
                    decision === 'REJECTED'
                        ? (customReason.trim() || rejectReason)
                        : undefined,
            });
            toast.success(decision === 'APPROVE' ? 'Đã duyệt hồ sơ.' : 'Đã từ chối hồ sơ.');
            setSelectedId(null);
            setDetail(null);
            loadQueue(0);
        } catch (err) {
            toast.error(getManualVerificationApiErrorMessage(err, 'Gửi quyết định thất bại.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mv-page">
            <header className="mv-page__header">
                <div>
                    <h1>Duyệt xác minh</h1>
                    <p>Hồ sơ CCCD / GPKD được AI chuyển sang chờ duyệt thủ công (chỉ case gán cho bạn).</p>
                </div>
                <button
                    type="button"
                    className="mv-btn mv-btn--ghost"
                    onClick={() => loadQueue(0)}
                    disabled={queueLoading}
                >
                    Làm mới
                </button>
            </header>

            {queueError ? <p className="mv-page__error" role="alert">{queueError}</p> : null}

            <div className="mv-layout">
                <section className="mv-panel">
                    <div className="mv-panel__toolbar">
                        <input
                            type="search"
                            placeholder="Tìm theo tên DN, người nộp, MST…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="mv-list">
                        {queueLoading && items.length === 0 ? (
                            <p className="mv-empty">Đang tải hàng chờ…</p>
                        ) : filteredItems.length === 0 ? (
                            <p className="mv-empty">Không có hồ sơ chờ duyệt.</p>
                        ) : (
                            filteredItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`mv-list__item${selectedId === item.id ? ' is-active' : ''}`}
                                    onClick={() => setSelectedId(item.id)}
                                >
                                    <strong>{item.businessName || item.userFullName || `Hồ sơ #${item.id}`}</strong>
                                    <span>{formatVerificationType(item.verificationType)}</span>
                                    <small>
                                        {item.status || '—'}
                                        {item.createdAt
                                            ? ` · ${new Date(item.createdAt).toLocaleString('vi-VN')}`
                                            : ''}
                                    </small>
                                </button>
                            ))
                        )}
                    </div>
                    {page + 1 < totalPages ? (
                        <div className="mv-panel__footer">
                            <button
                                type="button"
                                className="mv-btn mv-btn--ghost"
                                disabled={queueLoading}
                                onClick={() => loadQueue(page + 1, { append: true })}
                            >
                                Tải thêm
                            </button>
                        </div>
                    ) : null}
                </section>

                <section className="mv-panel mv-panel--detail">
                    {!selectedId ? (
                        <p className="mv-empty">Chọn một hồ sơ để xem chi tiết.</p>
                    ) : detailLoading ? (
                        <p className="mv-empty">Đang tải chi tiết…</p>
                    ) : detailError ? (
                        <p className="mv-page__error" role="alert">{detailError}</p>
                    ) : !detail ? (
                        <p className="mv-empty">Không có dữ liệu.</p>
                    ) : (
                        <>
                            <header className="mv-detail__head">
                                <div>
                                    <h2>{detail.businessName || detail.userFullName || `Hồ sơ #${detail.id}`}</h2>
                                    <p>
                                        {formatVerificationType(detail.verificationType)}
                                        {detail.documentType ? ` · ${detail.documentType}` : ''}
                                    </p>
                                </div>
                                <span className="mv-badge">{detail.status || '—'}</span>
                            </header>

                            <dl className="mv-detail__grid">
                                <div>
                                    <dt>Người nộp</dt>
                                    <dd>{detail.userFullName || '—'}</dd>
                                </div>
                                <div>
                                    <dt>MST / định danh</dt>
                                    <dd>{detail.taxCode || detail.submittedIdentifier || '—'}</dd>
                                </div>
                                <div>
                                    <dt>AI risk</dt>
                                    <dd>{formatAiRiskLevel(detail.aiRiskLevel)}</dd>
                                </div>
                                <div>
                                    <dt>Document score</dt>
                                    <dd>{detail.documentCheckScore ?? '—'}</dd>
                                </div>
                            </dl>

                            {detail.aiNotes ? (
                                <div className="mv-block">
                                    <h3>AI notes</h3>
                                    <p>{detail.aiNotes}</p>
                                </div>
                            ) : null}

                            {failedReasonList.length > 0 ? (
                                <div className="mv-block">
                                    <h3>Lý do AI / failed</h3>
                                    <ul className="mv-reason-list">
                                        {failedReasonList.map((reason) => (
                                            <li key={reason}>{reason}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            {extractedEntries.length > 0 ? (
                                <div className="mv-block">
                                    <h3>OCR / extracted</h3>
                                    <dl className="mv-detail__grid mv-detail__grid--ocr">
                                        {extractedEntries.map((item) => (
                                            <div key={item.label}>
                                                <dt>{item.label}</dt>
                                                <dd>{item.value}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            ) : null}

                            <div className="mv-block">
                                <h3>Ảnh giấy tờ</h3>
                                {mediaEntries.length === 0 ? (
                                    <p className="mv-empty">Không có ảnh.</p>
                                ) : (
                                    <div className="mv-gallery">
                                        {mediaEntries.map((item) => (
                                            <a
                                                key={item.key}
                                                href={item.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mv-gallery__item"
                                                title={item.label}
                                            >
                                                <img src={item.url} alt={item.label} />
                                                <span>{item.label}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mv-decision">
                                <h3>Quyết định</h3>
                                <div className="mv-decision__row">
                                    <label>
                                        <input
                                            type="radio"
                                            name="mv-decision"
                                            checked={decision === 'APPROVE'}
                                            onChange={() => setDecision('APPROVE')}
                                            disabled={submitting}
                                        />
                                        Duyệt (APPROVE)
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="mv-decision"
                                            checked={decision === 'REJECTED'}
                                            onChange={() => setDecision('REJECTED')}
                                            disabled={submitting}
                                        />
                                        Từ chối (REJECTED)
                                    </label>
                                </div>

                                {decision === 'REJECTED' && (
                                    <>
                                        {reasonOptions.length > 0 ? (
                                            <label className="mv-field">
                                                <span>Lý do mẫu</span>
                                                <select
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    disabled={submitting}
                                                >
                                                    <option value="">Chọn lý do…</option>
                                                    {reasonOptions.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        ) : null}
                                        <label className="mv-field">
                                            <span>Lý do chi tiết (hoặc tự nhập)</span>
                                            <textarea
                                                rows={3}
                                                value={customReason}
                                                onChange={(e) => setCustomReason(e.target.value)}
                                                placeholder="Bắt buộc khi từ chối…"
                                                disabled={submitting}
                                            />
                                        </label>
                                    </>
                                )}

                                <button
                                    type="button"
                                    className={`mv-btn ${decision === 'REJECTED' ? 'mv-btn--danger' : 'mv-btn--primary'}`}
                                    onClick={handleSubmitDecision}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Đang gửi…' : 'Gửi quyết định'}
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ManualVerificationQueuePage;
