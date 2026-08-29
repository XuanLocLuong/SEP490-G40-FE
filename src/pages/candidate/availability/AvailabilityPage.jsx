import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    createAvailability,
    getAvailability,
    updateAvailability,
    uploadTimetable,
} from '../../../apis/AvailabilityApi.jsx';
import {
    applyTimetable,
    createTimetable,
    getTimetable,
    unapplyTimetable,
    updateTimetable,
} from '../../../apis/CandidateTimetableApi.jsx';
import {
    applyHiredJobSchedule,
    getHiredJobSchedules,
    unapplyHiredJobSchedule,
} from '../../../apis/CandidateJobScheduleApi.jsx';
import {
    getScheduleSummary,
    switchScheduleMode,
} from '../../../apis/CandidateScheduleApi.jsx';
import UploadTimetable from '../../../components/candidate/UploadTimetable.jsx';
import AvailabilityEditor from '../../../components/candidate/AvailabilityEditor.jsx';
import OCRPreview from '../../../components/candidate/OCRPreview.jsx';
import ScheduleModeBanner from '../../../components/candidate/ScheduleModeBanner.jsx';
import ScheduleDateRangeFields from '../../../components/candidate/ScheduleDateRangeFields.jsx';
import TimetableSection from '../../../components/candidate/TimetableSection.jsx';
import HiredJobsScheduleSection from '../../../components/candidate/HiredJobsScheduleSection.jsx';
import {
    AvailabilitySummaryRow,
    formatDateRange,
} from '../../../components/candidate/AvailabilityCard.jsx';
import { CalendarIcon } from '../../../components/candidate/profileIcons.jsx';
import { createEmptyAvailabilitySlot } from '../../../components/candidate/availabilityConstants.js';
import {
    fetchAvailability,
    fetchScheduleSummary,
    fetchTimetable,
    getScheduleApiErrorMessage,
    isCalculatedScheduleMode,
    isTimetableEndDateExpired,
    normalizeHiredJobSchedule,
    normalizeScanResponse,
    normalizeSlot,
    resolveScheduleMode,
    SCHEDULE_MODES,
    toSchedulePayload,
    validateAvailabilityRange,
    validateAvailabilitySlots,
} from '../../../services/availabilityService.js';
import {
    buildAvailabilityLeaveNavigate,
    clearAvailabilityReturn,
    resolveAvailabilityBack,
} from '../../../utils/availabilityNavReturn.js';
import '../../../assets/styles/AvailabilityPageStyle.css';

const TABS = {
    AVAILABILITY: 'availability',
    TIMETABLE: 'timetable',
    JOBS: 'jobs',
};

const TAB_ITEMS = [
    { id: TABS.AVAILABILITY, label: 'Thời gian có thể đi làm' },
    { id: TABS.TIMETABLE, label: 'Lịch bận' },
    { id: TABS.JOBS, label: 'Việc đã nhận' },
];

const AvailabilityPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const back = useMemo(
        () => resolveAvailabilityBack(location.state),
        [location.state],
    );
    const leaveToBack = useCallback(() => {
        const options = buildAvailabilityLeaveNavigate(back);
        clearAvailabilityReturn();
        navigate(back.path, options);
    }, [navigate, back]);
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(
        Object.values(TABS).includes(initialTab) ? initialTab : TABS.AVAILABILITY,
    );

    const [scheduleMode, setScheduleMode] = useState(null);
    const [isTimetableExpired, setIsTimetableExpired] = useState(false);
    const [appliedJobCount, setAppliedJobCount] = useState(0);
    const [totalHiredJobCount, setTotalHiredJobCount] = useState(0);
    const [availabilitySlots, setAvailabilitySlots] = useState([]);
    const [availabilityStartDate, setAvailabilityStartDate] = useState('');
    const [availabilityEndDate, setAvailabilityEndDate] = useState('');
    const [hasActiveAvailability, setHasActiveAvailability] = useState(false);

    const [timetable, setTimetable] = useState({
        startDate: '',
        endDate: '',
        source: null,
        isApplied: false,
        slots: [],
    });
    const [timetableSlots, setTimetableSlots] = useState([]);
    const [timetableStartDate, setTimetableStartDate] = useState('');
    const [timetableEndDate, setTimetableEndDate] = useState('');

    const [hiredJobs, setHiredJobs] = useState([]);

    const [ocrSlots, setOcrSlots] = useState(null);
    const [ocrStartDate, setOcrStartDate] = useState('');
    const [ocrEndDate, setOcrEndDate] = useState('');
    const [ocrErrors, setOcrErrors] = useState({});
    const [ocrRangeError, setOcrRangeError] = useState('');

    const [slotErrors, setSlotErrors] = useState({});
    const [rangeError, setRangeError] = useState('');
    const [timetableSlotErrors, setTimetableSlotErrors] = useState({});
    const [timetableRangeError, setTimetableRangeError] = useState('');

    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [timetableToggling, setTimetableToggling] = useState(false);
    const [jobTogglingId, setJobTogglingId] = useState(null);
    const [modeSwitching, setModeSwitching] = useState(false);

    const isCalculated = isCalculatedScheduleMode(scheduleMode);
    const dateRangeLabel = formatDateRange(availabilityStartDate, availabilityEndDate);
    const hasAvailabilitySlots = availabilitySlots.length > 0;
    const renderedAvailabilitySlots = useMemo(
        () => (hasAvailabilitySlots ? availabilitySlots : [createEmptyAvailabilitySlot()]),
        [hasAvailabilitySlots, availabilitySlots],
    );
    const renderedTimetableSlots = useMemo(
        () =>
            timetableSlots.length > 0 ? timetableSlots : [createEmptyAvailabilitySlot()],
        [timetableSlots],
    );

    const visibleTabs = useMemo(() => {
        if (!isCalculated) {
            return TAB_ITEMS.filter((tab) => tab.id === TABS.AVAILABILITY);
        }
        return TAB_ITEMS;
    }, [isCalculated]);

    useEffect(() => {
        if (!isCalculated && activeTab !== TABS.AVAILABILITY) {
            setActiveTab(TABS.AVAILABILITY);
        }
    }, [isCalculated, activeTab]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryData, availabilityData, timetableData, jobsData] = await Promise.all([
                fetchScheduleSummary(getScheduleSummary).catch(() => null),
                fetchAvailability(getAvailability).catch(() => ({
                    scheduleMode: null,
                    startDate: '',
                    endDate: '',
                    slots: [],
                })),
                fetchTimetable(getTimetable).catch(() => ({
                    startDate: '',
                    endDate: '',
                    source: null,
                    isApplied: false,
                    slots: [],
                })),
                getHiredJobSchedules()
                    .then((res) => {
                        const raw = res?.data?.data ?? res?.data ?? [];
                        return Array.isArray(raw) ? raw.map(normalizeHiredJobSchedule) : [];
                    })
                    .catch(() => []),
            ]);

            const modeFromBe =
                resolveScheduleMode(summaryData?.scheduleMode) ||
                resolveScheduleMode(availabilityData.scheduleMode);
            setScheduleMode(modeFromBe);

            if (summaryData) {
                setAppliedJobCount(summaryData.appliedJobCount);
                setTotalHiredJobCount(summaryData.totalHiredJobCount);
                setAvailabilitySlots(
                    availabilityData.slots.length > 0
                        ? availabilityData.slots
                        : summaryData.freeSlots || [],
                );
                setAvailabilityStartDate(
                    availabilityData.startDate || summaryData.availabilityStartDate || '',
                );
                setAvailabilityEndDate(
                    availabilityData.endDate || summaryData.availabilityEndDate || '',
                );
                setHasActiveAvailability(
                    availabilityData.slots.length > 0 || summaryData.freeSlots?.length > 0,
                );
            } else {
                setAppliedJobCount(jobsData.filter((j) => j.isApplied).length);
                setTotalHiredJobCount(jobsData.length);
                setAvailabilitySlots(availabilityData.slots);
                setAvailabilityStartDate(availabilityData.startDate || '');
                setAvailabilityEndDate(availabilityData.endDate || '');
                setHasActiveAvailability(availabilityData.slots.length > 0);
            }

            setTimetable({
                ...timetableData,
                isApplied:
                    summaryData?.isTimetableApplied != null
                        ? summaryData.isTimetableApplied
                        : timetableData.isApplied,
            });
            setTimetableSlots(timetableData.slots);
            setTimetableStartDate(timetableData.startDate || '');
            setTimetableEndDate(timetableData.endDate || '');
            setIsTimetableExpired(
                Boolean(summaryData?.isTimetableExpired) ||
                    isTimetableEndDateExpired(timetableData.endDate),
            );
            setHiredJobs(jobsData);
        } catch (error) {
            toast.error(getScheduleApiErrorMessage(error, 'Không tải được dữ liệu lịch.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const switchTab = (tabId) => {
        setActiveTab(tabId);
        setSearchParams(tabId === TABS.TIMETABLE ? {} : { tab: tabId }, { replace: true });
    };

    const clearOcrPreview = () => {
        setOcrSlots(null);
        setOcrErrors({});
        setOcrRangeError('');
        setOcrStartDate('');
        setOcrEndDate('');
    };

    const handleFileChange = (nextFile) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setFile(nextFile);
        setPreviewUrl(URL.createObjectURL(nextFile));
    };

    const persistTimetable = async (nextSlots, range, { fromOcr = false } = {}) => {
        const slotValidation = validateAvailabilitySlots(nextSlots);
        if (Object.keys(slotValidation).length > 0) {
            if (fromOcr) return { slotErrors: slotValidation, rangeError: '' };
            setTimetableSlotErrors(slotValidation);
            return false;
        }

        const nextRangeError = validateAvailabilityRange(range, { disallowPastEnd: true });
        if (nextRangeError) {
            if (fromOcr) return { slotErrors: {}, rangeError: nextRangeError };
            setTimetableRangeError(nextRangeError);
            return false;
        }

        setSaving(true);
        try {
            const payload = toSchedulePayload(nextSlots, range);
            const hasTimetable = timetable.slots.length > 0;
            if (hasTimetable) {
                await updateTimetable(payload);
            } else {
                try {
                    await createTimetable(payload);
                } catch (error) {
                    if (error?.response?.status === 400) {
                        await updateTimetable(payload);
                    } else {
                        throw error;
                    }
                }
            }
            toast.success('Đã lưu lịch bận.');
            await loadAll();
            if (fromOcr) {
                setOcrSlots(null);
                setOcrRangeError('');
            }
            return true;
        } catch (error) {
            toast.error(getScheduleApiErrorMessage(error, 'Lưu lịch bận thất bại.'));
            return false;
        } finally {
            setSaving(false);
        }
    };

    const persistAvailability = async (nextSlots, range, { fromOcr = false } = {}) => {
        const slotValidation = validateAvailabilitySlots(nextSlots);
        if (Object.keys(slotValidation).length > 0) {
            if (fromOcr) return { slotErrors: slotValidation, rangeError: '' };
            setSlotErrors(slotValidation);
            return false;
        }

        const nextRangeError = validateAvailabilityRange(range);
        if (nextRangeError) {
            if (fromOcr) return { slotErrors: {}, rangeError: nextRangeError };
            setRangeError(nextRangeError);
            return false;
        }

        setSaving(true);
        try {
            const payload = toSchedulePayload(nextSlots, range);
            if (hasActiveAvailability) {
                await updateAvailability(payload);
            } else {
                await createAvailability(payload);
            }
            toast.success('Đã lưu lịch rảnh. Hệ thống chuyển sang chế độ tự nhập.');
            await loadAll();
            if (fromOcr) {
                setOcrSlots(null);
                setOcrRangeError('');
                switchTab(TABS.AVAILABILITY);
            }
            return true;
        } catch (error) {
            toast.error(getScheduleApiErrorMessage(error, 'Lưu lịch rảnh thất bại.'));
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setOcrSlots(null);
        setOcrErrors({});
        setOcrRangeError('');
        setOcrStartDate('');
        setOcrEndDate('');

        try {
            const res = await uploadTimetable(file);
            const data = res?.data?.data ?? res?.data ?? null;
            const parsed = normalizeScanResponse(data);

            if (parsed.warningMessage) {
                toast.warn(parsed.warningMessage);
                return;
            }

            if (parsed.isAutoSaved) {
                const stillManual = resolveScheduleMode(scheduleMode) === SCHEDULE_MODES.MANUAL;
                clearOcrPreview();
                await loadAll();
                if (stillManual) {
                    toast.info(
                        'Đã lưu lịch bận. Đang ở chế độ tự nhập — bật chế độ tự động hoặc áp dụng lịch bận để tính lại thời gian đi làm.',
                    );
                    switchTab(TABS.TIMETABLE);
                } else {
                    toast.success(
                        'Đã quét và lưu lịch bận thành công. Thời gian có thể đi làm đã được tự động cập nhật.',
                    );
                    switchTab(TABS.AVAILABILITY);
                }
                return;
            }

            if (parsed.slots.length === 0) {
                toast.info('Không trích xuất được khung giờ rảnh từ ảnh.');
                return;
            }

            setOcrSlots(parsed.slots.map(normalizeSlot));
            setOcrStartDate(
                parsed.startDate || availabilityStartDate || timetableStartDate || '',
            );
            setOcrEndDate(parsed.endDate || availabilityEndDate || timetableEndDate || '');
            switchTab(TABS.AVAILABILITY);
            toast.info(
                'AI gợi ý khung giờ đi làm từ lịch bận. Bạn có thể kiểm tra và lưu lại.',
            );
        } catch (error) {
            toast.error(getScheduleApiErrorMessage(error, 'Quét lịch bận thất bại.'));
        } finally {
            setUploading(false);
        }
    };

    const handleApplyOcr = async () => {
        const result = await persistAvailability(
            ocrSlots || [],
            { startDate: ocrStartDate, endDate: ocrEndDate },
            { fromOcr: true },
        );
        if (result && typeof result === 'object') {
            setOcrErrors(result.slotErrors);
            setOcrRangeError(result.rangeError);
        }
    };

    const handleSaveTimetable = async () => {
        setTimetableSlotErrors({});
        setTimetableRangeError('');
        const source = timetableSlots.length > 0 ? timetableSlots : renderedTimetableSlots;
        await persistTimetable(source, {
            startDate: timetableStartDate,
            endDate: timetableEndDate,
        });
    };

    const handleSaveAvailability = async () => {
        setSlotErrors({});
        setRangeError('');
        const source = hasAvailabilitySlots ? availabilitySlots : renderedAvailabilitySlots;
        await persistAvailability(source, {
            startDate: availabilityStartDate,
            endDate: availabilityEndDate,
        });
    };

    const handleApplyTimetable = async () => {
        if (isTimetableEndDateExpired(timetableEndDate) || isTimetableExpired) {
            toast.error(
                'Lịch bận đã hết hạn. Cập nhật ngày kết thúc rồi lưu lại trước khi áp dụng.',
            );
            switchTab(TABS.TIMETABLE);
            return;
        }
        setTimetableToggling(true);
        try {
            await applyTimetable();
            clearOcrPreview();
            toast.success('Đã áp dụng lịch bận. Lịch rảnh được tính lại.');
            await loadAll();
            switchTab(TABS.AVAILABILITY);
        } catch (error) {
            toast.error(getScheduleApiErrorMessage(error, 'Không thể áp dụng lịch bận.'));
        } finally {
            setTimetableToggling(false);
        }
    };

    const handleUnapplyTimetable = async () => {
        setTimetableToggling(true);
        try {
            await unapplyTimetable();
            clearOcrPreview();
            toast.success('Đã ngưng áp dụng lịch bận.');
            await loadAll();
        } catch (error) {
            toast.error(getScheduleApiErrorMessage(error, 'Không thể ngưng áp dụng lịch bận.'));
        } finally {
            setTimetableToggling(false);
        }
    };

    const handleToggleJob = async (job) => {
        if (!job.isApplied && !isCalculated) {
            toast.info('Chuyển sang chế độ tự động trước khi áp dụng lịch việc.');
            return;
        }
        setJobTogglingId(job.applicationId);
        try {
            if (job.isApplied) {
                await unapplyHiredJobSchedule(job.applicationId);
                toast.success('Đã ngưng áp dụng lịch việc.');
            } else {
                await applyHiredJobSchedule(job.applicationId);
                toast.success('Đã áp dụng lịch việc. Lịch rảnh được tính lại.');
            }
            clearOcrPreview();
            await loadAll();
        } catch (error) {
            toast.error(
                getScheduleApiErrorMessage(
                    error,
                    'Không thể đổi trạng thái áp dụng. Có thể đang chế độ tự nhập hoặc xung đột lịch bận / việc đã nhận — ngưng áp dụng cái cũ hoặc đổi chế độ.',
                ),
            );
        } finally {
            setJobTogglingId(null);
        }
    };

    const handleSwitchToManual = async () => {
        setModeSwitching(true);
        try {
            await switchScheduleMode(SCHEDULE_MODES.MANUAL);
            clearOcrPreview();
            toast.success(
                'Đã chuyển sang tự nhập. Lịch bận và việc đã nhận đã được ngưng áp dụng.',
            );
            await loadAll();
            switchTab(TABS.AVAILABILITY);
        } catch (error) {
            toast.error(getScheduleApiErrorMessage(error, 'Không thể chuyển sang chế độ tự nhập.'));
        } finally {
            setModeSwitching(false);
        }
    };

    const handleSwitchToCalculated = async () => {
        setModeSwitching(true);
        try {
            await switchScheduleMode(SCHEDULE_MODES.CALCULATED);
            clearOcrPreview();
            toast.success(
                'Đã bật chế độ tự động. Áp dụng lịch bận / việc đã nhận nếu chưa bật để tính lại lịch rảnh.',
            );
            await loadAll();
            if (!timetable.isApplied) {
                switchTab(TABS.TIMETABLE);
            } else {
                switchTab(TABS.AVAILABILITY);
            }
        } catch (error) {
            toast.error(getScheduleApiErrorMessage(error, 'Không thể bật chế độ tự động.'));
        } finally {
            setModeSwitching(false);
        }
    };

    return (
        <div className="availability-page">
            <header className="availability-page__header">
                <Link
                    to={back.path}
                    state={buildAvailabilityLeaveNavigate(back)?.state}
                    className="availability-page__back"
                    onClick={() => clearAvailabilityReturn()}
                >
                    ← {back.label}
                </Link>
                <h1>Quản lý Lịch rảnh &amp; Lịch bận</h1>
                <p>
                    Lịch bận và việc đã nhận chiếm thời gian; lịch rảnh dùng cho đề xuất việc. Chế độ
                    tự động tính từ lịch bận + việc đang áp dụng.
                </p>
            </header>

            {!loading ? (
                <ScheduleModeBanner
                    scheduleMode={scheduleMode}
                    timetableApplied={timetable.isApplied}
                    isTimetableExpired={isTimetableExpired}
                    appliedJobCount={appliedJobCount}
                    totalHiredJobCount={totalHiredJobCount}
                    modeSwitching={modeSwitching}
                    onSwitchToManual={handleSwitchToManual}
                    onSwitchToCalculated={handleSwitchToCalculated}
                />
            ) : null}

            <nav className="schedule-tabs" aria-label="Quản lý lịch">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`schedule-tabs__btn${activeTab === tab.id ? ' schedule-tabs__btn--active' : ''}`}
                        onClick={() => switchTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {activeTab === TABS.AVAILABILITY ? (
                loading ? (
                    <section className="availability-card">
                        <div className="availability-skeleton availability-skeleton--title" />
                        <div className="availability-skeleton availability-skeleton--line" />
                    </section>
                ) : ocrSlots ? (
                    <OCRPreview
                        slots={ocrSlots}
                        startDate={ocrStartDate}
                        endDate={ocrEndDate}
                        rangeError={ocrRangeError}
                        errors={ocrErrors}
                        onChange={(nextSlots) => {
                            setOcrSlots(nextSlots);
                            setOcrErrors({});
                        }}
                        onRangeChange={({ startDate: nextStart, endDate: nextEnd }) => {
                            setOcrStartDate(nextStart);
                            setOcrEndDate(nextEnd);
                            setOcrRangeError('');
                        }}
                        onApply={handleApplyOcr}
                        onCancel={() => {
                            clearOcrPreview();
                        }}
                        saving={saving}
                    />
                ) : isCalculated ? (
                    <section className="availability-card cp-availability-card">
                        <div className="availability-card__header">
                            <div>
                                <h2>Thời gian có thể đi làm</h2>
                                <p>
                                    Hệ thống đang tự động tính giờ đi làm từ Lịch bận và Việc đã nhận đang áp dụng.
                                </p>
                            </div>
                        </div>

                        {dateRangeLabel ? (
                            <p className="cp-availability-summary__range">
                                Áp dụng: {dateRangeLabel}
                            </p>
                        ) : null}

                        {availabilitySlots.length === 0 ? (
                            <div className="cp-availability-empty">
                                <CalendarIcon width={26} height={26} className="cp-availability-empty__icon" />
                                <p className="cp-availability-empty__text">
                                    Chưa có thời gian đi làm. Hãy áp dụng lịch bận (TKB) hoặc việc đã nhận ở các tab bên cạnh.
                                </p>
                            </div>
                        ) : (
                            <div className="cp-availability-summary">
                                {availabilitySlots.map((slot, index) => (
                                    <AvailabilitySummaryRow
                                        key={slot.clientId || slot.id || index}
                                        slot={slot}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="availability-page__footer" style={{ marginTop: '24px' }}>
                            <button
                                type="button"
                                className="availability-btn availability-btn--ghost"
                                onClick={leaveToBack}
                            >
                                ← {back.label}
                            </button>
                            <button
                                type="button"
                                className="availability-btn availability-btn--secondary"
                                onClick={handleSwitchToManual}
                                disabled={modeSwitching}
                            >
                                {modeSwitching ? 'Đang chuyển...' : 'Chuyển sang tự chỉnh sửa'}
                            </button>
                        </div>
                    </section>
                ) : (
                    <>
                        <section className="availability-card availability-range">
                            <div className="availability-card__header">
                                <div>
                                    <h2>Thời gian có thể đi làm</h2>
                                    <p>
                                        Chế độ tự nhập — bạn có thể chọn ngày và điều chỉnh các khung giờ đi làm trực tiếp.
                                    </p>
                                </div>
                            </div>
                            <ScheduleDateRangeFields
                                startDate={availabilityStartDate}
                                endDate={availabilityEndDate}
                                onChange={({ startDate: nextStart, endDate: nextEnd }) => {
                                    setAvailabilityStartDate(nextStart);
                                    setAvailabilityEndDate(nextEnd);
                                    setRangeError('');
                                }}
                                error={rangeError}
                            />
                        </section>

                        <AvailabilityEditor
                            slots={renderedAvailabilitySlots}
                            onChange={(next) => {
                                setAvailabilitySlots(next);
                                setSlotErrors({});
                            }}
                            errors={slotErrors}
                            title="Khung giờ có thể đi làm trong tuần (Tự nhập)"
                            emptyText="Chưa có khung giờ đi làm. Thêm khung giờ bên dưới hoặc sang tab Lịch bận để quét ảnh TKB."
                            addButtonLabel="Thêm khung giờ đi làm"
                        />

                        <div className="availability-page__footer">
                            <button
                                type="button"
                                className="availability-btn availability-btn--ghost"
                                onClick={leaveToBack}
                                disabled={saving}
                            >
                                ← {back.label}
                            </button>
                            <button
                                type="button"
                                className="availability-btn availability-btn--primary"
                                onClick={handleSaveAvailability}
                                disabled={saving}
                            >
                                {saving
                                    ? 'Đang lưu...'
                                    : hasActiveAvailability
                                      ? 'Cập nhật thời gian đi làm'
                                      : 'Lưu thời gian đi làm'}
                            </button>
                        </div>
                    </>
                )
            ) : null}

            {activeTab === TABS.TIMETABLE ? (
                <TimetableSection
                    timetable={timetable}
                    loading={loading}
                    saving={saving}
                    toggling={timetableToggling}
                    slots={renderedTimetableSlots}
                    startDate={timetableStartDate}
                    endDate={timetableEndDate}
                    rangeError={timetableRangeError}
                    slotErrors={timetableSlotErrors}
                    onSlotsChange={(next) => {
                        setTimetableSlots(next);
                        setTimetableSlotErrors({});
                    }}
                    onRangeChange={({ startDate: nextStart, endDate: nextEnd }) => {
                        setTimetableStartDate(nextStart);
                        setTimetableEndDate(nextEnd);
                        setTimetableRangeError('');
                    }}
                    onSave={handleSaveTimetable}
                    onApply={handleApplyTimetable}
                    onUnapply={handleUnapplyTimetable}
                    file={file}
                    previewUrl={previewUrl}
                    uploading={uploading}
                    onFileChange={handleFileChange}
                    onUpload={handleUpload}
                />
            ) : null}

            {activeTab === TABS.JOBS ? (
                <HiredJobsScheduleSection
                    jobs={hiredJobs}
                    loading={loading}
                    togglingId={jobTogglingId}
                    isCalculatedMode={isCalculated}
                    onToggle={handleToggleJob}
                />
            ) : null}
        </div>
    );
};

export default AvailabilityPage;
