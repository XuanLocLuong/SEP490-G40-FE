import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    applyJobSchedule,
    createAvailability,
    getAvailability,
    getHiredJobShifts,
    getScheduleSummary,
    switchScheduleMode,
    unapplyJobSchedule,
    updateAvailability,
    uploadTimetable,
} from '../../../apis/AvailabilityApi.jsx';
import UploadTimetable from '../../../components/candidate/UploadTimetable.jsx';
import AvailabilityEditor from '../../../components/candidate/AvailabilityEditor.jsx';
import HiredJobsPanel from '../../../components/candidate/HiredJobsPanel.jsx';
import OCRPreview from '../../../components/candidate/OCRPreview.jsx';
import { createEmptyAvailabilitySlot } from '../../../components/candidate/availabilityConstants.js';
import {
    fetchAvailability,
    fetchHiredJobShifts,
    fetchScheduleSummary,
    normalizeAvailabilityResponse,
    normalizeSlot,
    toAvailabilityPayload,
    validateAvailabilityRange,
    validateAvailabilitySlots,
} from '../../../services/availabilityService.js';
import {
    buildAvailabilityLeaveNavigate,
    clearAvailabilityReturn,
    resolveAvailabilityBack,
} from '../../../utils/availabilityNavReturn.js';
import '../../../assets/styles/AvailabilityPageStyle.css';

const getApiMessage = (error, fallback) => (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
);

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
    const [slots, setSlots] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [scheduleMode, setScheduleMode] = useState('CALCULATED');
    const [hasActiveSchedule, setHasActiveSchedule] = useState(false);
    const [hiredJobs, setHiredJobs] = useState([]);
    const [isTimetableExpired, setIsTimetableExpired] = useState(false);
    const [ocrSlots, setOcrSlots] = useState(null);
    const [ocrStartDate, setOcrStartDate] = useState('');
    const [ocrEndDate, setOcrEndDate] = useState('');
    const [slotErrors, setSlotErrors] = useState({});
    const [ocrErrors, setOcrErrors] = useState({});
    const [rangeError, setRangeError] = useState('');
    const [ocrRangeError, setOcrRangeError] = useState('');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [hiredLoading, setHiredLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [modeSwitching, setModeSwitching] = useState(false);
    const [busyApplicationId, setBusyApplicationId] = useState(null);

    const hasSlots = slots.length > 0;
    const renderedSlots = useMemo(
        () => (hasSlots ? slots : [createEmptyAvailabilitySlot()]),
        [hasSlots, slots],
    );
    const isManual = String(scheduleMode).toUpperCase() === 'MANUAL';

    const loadAvailability = useCallback(async () => {
        setLoading(true);
        try {
            const [availability, summary] = await Promise.all([
                fetchAvailability(getAvailability),
                fetchScheduleSummary(getScheduleSummary).catch(() => null),
            ]);
            setSlots(availability.slots);
            setStartDate(availability.startDate || summary?.availabilityStartDate || '');
            setEndDate(availability.endDate || summary?.availabilityEndDate || '');
            setHasActiveSchedule(availability.slots.length > 0);
            setScheduleMode(
                availability.scheduleMode || summary?.scheduleMode || 'CALCULATED',
            );
            setIsTimetableExpired(Boolean(summary?.isTimetableExpired));
        } catch (error) {
            toast.error(getApiMessage(error, 'Không tải được lịch rảnh.'));
        } finally {
            setLoading(false);
        }
    }, []);

    const loadHiredJobs = useCallback(async () => {
        setHiredLoading(true);
        try {
            const jobs = await fetchHiredJobShifts(getHiredJobShifts);
            setHiredJobs(jobs);
        } catch {
            setHiredJobs([]);
        } finally {
            setHiredLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadAvailability();
        loadHiredJobs();
    }, [loadAvailability, loadHiredJobs]);

    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const handleSlotsChange = (nextSlots) => {
        setSlots(nextSlots);
        setSlotErrors({});
    };

    const handleFileChange = (nextFile) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setFile(nextFile);
        setPreviewUrl(URL.createObjectURL(nextFile));
    };

    const persistAvailability = async (nextSlots, range) => {
        const slotValidation = validateAvailabilitySlots(nextSlots);
        if (Object.keys(slotValidation).length > 0) {
            return { slotErrors: slotValidation, rangeError: '' };
        }

        const nextRangeError = validateAvailabilityRange(range);
        if (nextRangeError) {
            return { slotErrors: {}, rangeError: nextRangeError };
        }

        setSaving(true);
        try {
            const payload = toAvailabilityPayload(nextSlots, range);
            if (hasActiveSchedule) {
                await updateAvailability(payload);
            } else {
                await createAvailability(payload);
            }
            toast.success('Đã lưu lịch rảnh thành công.');
            await Promise.all([loadAvailability(), loadHiredJobs()]);
            leaveToBack();
            return { slotErrors: {}, rangeError: '' };
        } catch (error) {
            toast.error(getApiMessage(error, 'Lưu lịch rảnh thất bại.'));
            return null;
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        const source = hasSlots ? slots : renderedSlots;
        const result = await persistAvailability(source, { startDate, endDate });
        if (result) {
            setSlotErrors(result.slotErrors);
            setRangeError(result.rangeError);
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
            const parsed = normalizeAvailabilityResponse(data);

            if (parsed.isAutoSaved) {
                toast.success('Đã quét và lưu lịch rảnh thành công.');
                await Promise.all([loadAvailability(), loadHiredJobs()]);
                return;
            }

            if (parsed.slots.length === 0) {
                toast.info('Backend không trích xuất được khung giờ nào từ ảnh.');
                return;
            }

            setOcrSlots(parsed.slots.map(normalizeSlot));
            setOcrStartDate(parsed.startDate || startDate || '');
            setOcrEndDate(parsed.endDate || endDate || '');
            toast.info('AI đã gợi ý khung giờ. Kiểm tra ngày áp dụng rồi lưu chính thức.');
        } catch (error) {
            toast.error(getApiMessage(error, 'Quét thời khóa biểu thất bại.'));
        } finally {
            setUploading(false);
        }
    };

    const handleApplyOcr = async () => {
        const result = await persistAvailability(ocrSlots || [], {
            startDate: ocrStartDate,
            endDate: ocrEndDate,
        });
        if (result) {
            setOcrErrors(result.slotErrors);
            setOcrRangeError(result.rangeError);
        }
    };

    const handleSwitchMode = async (nextMode) => {
        if (modeSwitching || nextMode === scheduleMode) return;
        setModeSwitching(true);
        try {
            await switchScheduleMode(nextMode);
            toast.success(
                nextMode === 'MANUAL'
                    ? 'Đã chuyển sang chế độ Thủ công.'
                    : 'Đã chuyển sang chế độ Tự động.',
            );
            await Promise.all([loadAvailability(), loadHiredJobs()]);
        } catch (error) {
            toast.error(getApiMessage(error, 'Không đổi được chế độ lịch.'));
        } finally {
            setModeSwitching(false);
        }
    };

    const handleUnapplyJob = async (applicationId) => {
        setBusyApplicationId(applicationId);
        try {
            await unapplyJobSchedule(applicationId);
            toast.success('Đã gỡ lịch công việc. Slot rảnh sẽ được cập nhật.');
            await Promise.all([loadAvailability(), loadHiredJobs()]);
        } catch (error) {
            toast.error(getApiMessage(error, 'Gỡ lịch thất bại.'));
        } finally {
            setBusyApplicationId(null);
        }
    };

    const handleApplyJob = async (applicationId) => {
        setBusyApplicationId(applicationId);
        try {
            await applyJobSchedule(applicationId);
            toast.success('Đã áp lịch công việc vào lịch rảnh.');
            await Promise.all([loadAvailability(), loadHiredJobs()]);
        } catch (error) {
            toast.error(getApiMessage(error, 'Áp lịch thất bại.'));
        } finally {
            setBusyApplicationId(null);
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
                <h1>Quản lý Lịch rảnh &amp; Thời khóa biểu</h1>
                <p>Cập nhật thời gian rảnh để hệ thống đề xuất công việc phù hợp.</p>
            </header>

            {!loading && (
                <section className="availability-card schedule-mode-card">
                    <div className="availability-card__header">
                        <div>
                            <h2>Chế độ lịch rảnh</h2>
                            <p>
                                <strong>Tự động</strong> tính từ thời khóa biểu + việc đang làm.
                                <strong> Thủ công</strong> do bạn nhập; lưu tay sẽ gỡ áp lịch job/TKB.
                            </p>
                        </div>
                        <div className="schedule-mode-card__toggle" role="group" aria-label="Chế độ lịch">
                            <button
                                type="button"
                                className={
                                    'schedule-mode-card__btn' +
                                    (!isManual ? ' schedule-mode-card__btn--active' : '')
                                }
                                disabled={modeSwitching}
                                onClick={() => handleSwitchMode('CALCULATED')}
                            >
                                Tự động
                            </button>
                            <button
                                type="button"
                                className={
                                    'schedule-mode-card__btn' +
                                    (isManual ? ' schedule-mode-card__btn--active' : '')
                                }
                                disabled={modeSwitching}
                                onClick={() => handleSwitchMode('MANUAL')}
                            >
                                Thủ công
                            </button>
                        </div>
                    </div>
                    {isTimetableExpired ? (
                        <p className="schedule-mode-card__hint schedule-mode-card__hint--warn">
                            Thời khóa biểu có dấu hiệu hết hạn. Hãy quét/cập nhật lại nếu cần.
                        </p>
                    ) : null}
                </section>
            )}

            <HiredJobsPanel
                jobs={hiredJobs}
                scheduleMode={scheduleMode}
                loading={hiredLoading}
                busyApplicationId={busyApplicationId}
                onApply={handleApplyJob}
                onUnapply={handleUnapplyJob}
            />

            <UploadTimetable
                file={file}
                previewUrl={previewUrl}
                uploading={uploading}
                onFileChange={handleFileChange}
                onUpload={handleUpload}
            />

            {ocrSlots && (
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
                        setOcrSlots(null);
                        setOcrRangeError('');
                    }}
                    saving={saving}
                />
            )}

            {loading ? (
                <section className="availability-card">
                    <div className="availability-skeleton availability-skeleton--title" />
                    <div className="availability-skeleton availability-skeleton--line" />
                    <div className="availability-skeleton availability-skeleton--line" />
                </section>
            ) : (
                <>
                    <section className="availability-card availability-range">
                        <div className="availability-card__header">
                            <div>
                                <h2>Khoảng áp dụng lịch</h2>
                                <p>Bắt buộc khi lưu. Lịch hết hạn sẽ được hệ thống nhắc cập nhật.</p>
                            </div>
                        </div>
                        <div className="availability-range__fields">
                            <label className="availability-range__field">
                                <span>Ngày bắt đầu</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setRangeError('');
                                    }}
                                />
                            </label>
                            <label className="availability-range__field">
                                <span>Ngày kết thúc</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    min={startDate || undefined}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setRangeError('');
                                    }}
                                />
                            </label>
                        </div>
                        {rangeError ? (
                            <p className="availability-range__error">{rangeError}</p>
                        ) : null}
                    </section>

                    <AvailabilityEditor
                        slots={renderedSlots}
                        onChange={handleSlotsChange}
                        errors={slotErrors}
                    />
                </>
            )}

            <div className="availability-page__footer">
                <button
                    type="button"
                    className="availability-btn availability-btn--ghost"
                    onClick={leaveToBack}
                    disabled={saving}
                >
                    Hủy
                </button>
                <button
                    type="button"
                    className="availability-btn availability-btn--primary"
                    onClick={handleSave}
                    disabled={saving || loading}
                >
                    {saving ? 'Đang lưu...' : hasActiveSchedule ? 'Cập nhật lịch rảnh' : 'Tạo lịch rảnh'}
                </button>
            </div>
        </div>
    );
};

export default AvailabilityPage;
