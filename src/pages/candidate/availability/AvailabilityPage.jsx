import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    createAvailability,
    getAvailability,
    updateAvailability,
    uploadTimetable,
} from '../../../apis/AvailabilityApi.jsx';
import UploadTimetable from '../../../components/candidate/UploadTimetable.jsx';
import AvailabilityEditor from '../../../components/candidate/AvailabilityEditor.jsx';
import OCRPreview from '../../../components/candidate/OCRPreview.jsx';
import { createEmptyAvailabilitySlot } from '../../../components/candidate/availabilityConstants.js';
import {
    fetchAvailability,
    normalizeAvailabilityResponse,
    normalizeSlot,
    toAvailabilityPayload,
    validateAvailabilityRange,
    validateAvailabilitySlots,
} from '../../../services/availabilityService.js';
import { ROUTES } from '../../../routes/path.js';
import '../../../assets/styles/AvailabilityPageStyle.css';

const getApiMessage = (error, fallback) => (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
);

const AvailabilityPage = () => {
    const navigate = useNavigate();
    const [slots, setSlots] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [hasActiveSchedule, setHasActiveSchedule] = useState(false);
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
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const hasSlots = slots.length > 0;
    const renderedSlots = useMemo(
        () => (hasSlots ? slots : [createEmptyAvailabilitySlot()]),
        [hasSlots, slots],
    );

    const loadAvailability = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAvailability(getAvailability);
            setSlots(data.slots);
            setStartDate(data.startDate || '');
            setEndDate(data.endDate || '');
            setHasActiveSchedule(data.slots.length > 0);
        } catch (error) {
            toast.error(getApiMessage(error, 'Không tải được lịch rảnh.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Fetch dữ liệu khi mở page: effect này đồng bộ với backend, không phải derive state từ props.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadAvailability();
    }, [loadAvailability]);

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
            await loadAvailability();
            navigate(ROUTES.CANDIDATE_PROFILE);
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
                await loadAvailability();
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

    return (
        <div className="availability-page">
            <header className="availability-page__header">
                <h1>Quản lý Lịch rảnh &amp; Thời khóa biểu</h1>
                <p>Cập nhật thời gian rảnh để hệ thống đề xuất công việc phù hợp.</p>
            </header>

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
                    onClick={() => navigate(ROUTES.CANDIDATE_PROFILE)}
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
