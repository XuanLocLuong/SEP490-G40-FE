import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    getMyTrustScore,
    getMyTrustScoreHistory,
    getTrustScoreApiErrorMessage,
} from '../../apis/TrustScoreApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import {
    formatScoreChange,
    formatTrustEventDate,
    formatTrustEventTitle,
    toTrustScoreNumber,
} from '../../utils/trustScoreDisplay.js';
import '../../assets/styles/TrustScoreHistoryPageStyle.css';

const PAGE_SIZE = 20;
const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const COPY = {
    [USER_ROLES.RECRUITER]: {
        title: 'Lịch sử Điểm Uy Tín',
        scoreCaption: 'Điểm uy tín doanh nghiệp',
        historyTitle: 'Lịch sử cập nhật điểm',
        emptyHistory: 'Chưa có thay đổi điểm uy tín.',
    },
    [USER_ROLES.CANDIDATE]: {
        title: 'Lịch sử Điểm Uy Tín',
        scoreCaption: 'Điểm uy tín của bạn',
        historyTitle: 'Lịch sử cập nhật điểm',
        emptyHistory: 'Chưa có thay đổi điểm uy tín.',
    },
};

const DEFAULT_COPY = COPY[USER_ROLES.CANDIDATE];

const TrustScoreRing = ({ score }) => {
    const value = toTrustScoreNumber(score);
    const clamped = value == null ? 0 : Math.max(0, Math.min(100, value));
    const offset = RING_CIRCUMFERENCE * (1 - clamped / 100);
    const display = value == null ? '—' : Math.round(value);

    return (
        <div className="trust-score-page__ring" aria-hidden={value == null}>
            <svg viewBox="0 0 120 120" className="trust-score-page__ring-svg">
                <circle
                    className="trust-score-page__ring-track"
                    cx="60"
                    cy="60"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="10"
                />
                <circle
                    className="trust-score-page__ring-progress"
                    cx="60"
                    cy="60"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={offset}
                    transform="rotate(-90 60 60)"
                />
            </svg>
            <div className="trust-score-page__ring-label">
                <span className="trust-score-page__ring-value">{display}</span>
                <span className="trust-score-page__ring-max">/100</span>
            </div>
        </div>
    );
};

/**
 * Màn lịch sử Trust Score dùng chung Candidate / Recruiter.
 * Data: GET /trust-scores/me + /trust-scores/history
 * (CSS chi tiết: bước 3)
 */
const TrustScoreHistoryPage = () => {
    const { auth } = useAuth();
    const role = auth?.role;
    const copy = COPY[role] || DEFAULT_COPY;

    const [scoreLoading, setScoreLoading] = useState(true);
    const [scoreError, setScoreError] = useState('');
    const [score, setScore] = useState(null);
    const [warningLevel, setWarningLevel] = useState('NORMAL');
    const [warningMessage, setWarningMessage] = useState('');

    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');
    const [events, setEvents] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadScore = useCallback(async () => {
        setScoreLoading(true);
        setScoreError('');
        try {
            const res = await getMyTrustScore();
            const data = res?.data?.data ?? res?.data ?? null;
            setScore(data?.score ?? null);
            setWarningLevel(data?.warningLevel || 'NORMAL');
            setWarningMessage(String(data?.warningMessage || '').trim());
        } catch (err) {
            setScore(null);
            setWarningLevel('NORMAL');
            setWarningMessage('');
            setScoreError(
                getTrustScoreApiErrorMessage(err, 'Không tải được điểm uy tín.')
            );
        } finally {
            setScoreLoading(false);
        }
    }, []);

    const loadHistory = useCallback(async (pageNum, { append = false } = {}) => {
        setHistoryLoading(true);
        setHistoryError('');
        try {
            const res = await getMyTrustScoreHistory({
                page: pageNum,
                size: PAGE_SIZE,
            });
            const pageData = res?.data?.data ?? res?.data;
            const content = Array.isArray(pageData?.content) ? pageData.content : [];
            setEvents((prev) => (append ? [...prev, ...content] : content));
            setTotalPages(pageData?.totalPages ?? 0);
            setPage(pageData?.currentPage ?? pageNum);
        } catch (err) {
            if (!append) setEvents([]);
            setHistoryError(
                getTrustScoreApiErrorMessage(err, 'Không tải được lịch sử điểm.')
            );
            toast.error(
                getTrustScoreApiErrorMessage(err, 'Không tải được lịch sử điểm.')
            );
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        loadScore();
        loadHistory(0);
    }, [loadScore, loadHistory]);

    const canLoadMore = totalPages > 1 && page + 1 < totalPages;

    const showWarning =
        Boolean(warningMessage) &&
        warningLevel &&
        String(warningLevel).toUpperCase() !== 'NORMAL';

    const scoreCaption = useMemo(() => copy.scoreCaption, [copy.scoreCaption]);

    return (
        <div className="trust-score-page">
            <header className="trust-score-page__header">
                <h1 className="trust-score-page__title">{copy.title}</h1>
            </header>

            <section className="trust-score-page__summary" aria-busy={scoreLoading}>
                {scoreLoading ? (
                    <p className="trust-score-page__loading">Đang tải điểm uy tín…</p>
                ) : scoreError ? (
                    <p className="trust-score-page__error">{scoreError}</p>
                ) : (
                    <div className="trust-score-page__summary-card">
                        <TrustScoreRing score={score} />
                        <div className="trust-score-page__summary-text">
                            <p className="trust-score-page__score-caption">{scoreCaption}</p>
                            {showWarning ? (
                                <p
                                    className={`trust-score-page__warning trust-score-page__warning--${String(
                                        warningLevel
                                    )
                                        .toLowerCase()
                                        .replace(/_/g, '-')}`}
                                >
                                    {warningMessage}
                                </p>
                            ) : null}
                        </div>
                    </div>
                )}
            </section>

            <section className="trust-score-page__history">
                <h2 className="trust-score-page__history-title">{copy.historyTitle}</h2>

                {historyError && events.length === 0 ? (
                    <p className="trust-score-page__error">{historyError}</p>
                ) : null}

                {historyLoading && events.length === 0 ? (
                    <p className="trust-score-page__loading">Đang tải lịch sử…</p>
                ) : null}

                {!historyLoading && !historyError && events.length === 0 ? (
                    <p className="trust-score-page__empty">{copy.emptyHistory}</p>
                ) : null}

                {events.length > 0 ? (
                    <ol className="trust-score-page__timeline">
                        {events.map((event) => {
                            const change = formatScoreChange(event.scoreChange);
                            const dateLabel = formatTrustEventDate(event.createdAt);
                            const title = formatTrustEventTitle(event);
                            const note = String(event.note || '').trim();

                            return (
                                <li
                                    key={event.id ?? `${event.createdAt}-${event.eventType}`}
                                    className={`trust-score-page__event trust-score-page__event--${change.tone}`}
                                >
                                    <span
                                        className={`trust-score-page__event-marker trust-score-page__event-marker--${change.tone}`}
                                        aria-hidden="true"
                                    />
                                    <article className="trust-score-page__event-card">
                                        <div className="trust-score-page__event-top">
                                            {dateLabel ? (
                                                <time
                                                    className="trust-score-page__event-date"
                                                    dateTime={event.createdAt || undefined}
                                                >
                                                    {dateLabel}
                                                </time>
                                            ) : (
                                                <span className="trust-score-page__event-date">—</span>
                                            )}
                                            <span
                                                className={`trust-score-page__event-badge trust-score-page__event-badge--${change.tone}`}
                                            >
                                                {change.text}
                                            </span>
                                        </div>
                                        <h3 className="trust-score-page__event-title">{title}</h3>
                                        {note ? (
                                            <p className="trust-score-page__event-note">{note}</p>
                                        ) : null}
                                        {event.oldScore != null && event.newScore != null ? (
                                            <p className="trust-score-page__event-meta">
                                                {Math.round(Number(event.oldScore))} →{' '}
                                                {Math.round(Number(event.newScore))}
                                            </p>
                                        ) : null}
                                    </article>
                                </li>
                            );
                        })}
                    </ol>
                ) : null}

                {canLoadMore ? (
                    <div className="trust-score-page__more">
                        <button
                            type="button"
                            className="trust-score-page__more-btn"
                            disabled={historyLoading}
                            onClick={() => loadHistory(page + 1, { append: true })}
                        >
                            {historyLoading ? 'Đang tải…' : 'Xem thêm'}
                        </button>
                    </div>
                ) : null}
            </section>
        </div>
    );
};

export default TrustScoreHistoryPage;
