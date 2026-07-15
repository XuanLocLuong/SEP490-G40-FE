import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    getAvailability,
    updateAvailability,
    uploadTimetable,
} from '../../../apis/AvailabilityApi.jsx';
import UploadTimetable from '../../../components/candidate/UploadTimetable.jsx';
import AvailabilityEditor from '../../../components/candidate/AvailabilityEditor.jsx';
import OCRPreview from '../../../components/candidate/OCRPreview.jsx';
import { createEmptyAvailabilitySlot } from '../../../components/candidate/availabilityConstants.js';
import {
    fetchAvailabilitySlots,
    normalizeSlot,
    normalizeSlotsContainer,
    toAvailabilityPayload,
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
    const [ocrSlots, setOcrSlots] = useState(null);
    const [slotErrors, setSlotErrors] = useState({});
    const [ocrErrors, setOcrErrors] = useState({});
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
            const nextSlots = await fetchAvailabilitySlots(getAvailability);
            setSlots(nextSlots);
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

    const saveSlots = async (nextSlots) => {
        const errors = validateAvailabilitySlots(nextSlots);
        if (Object.keys(errors).length > 0) {
            return errors;
        }

        setSaving(true);
        try {
            await updateAvailability(toAvailabilityPayload(nextSlots));
            toast.success('Đã lưu lịch rảnh thành công.');
            await loadAvailability();
            navigate(ROUTES.CANDIDATE_PROFILE);
            return {};
        } catch (error) {
            toast.error(getApiMessage(error, 'Lưu lịch rảnh thất bại.'));
            return null;
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        const source = hasSlots ? slots : renderedSlots;
        const errors = await saveSlots(source);
        if (errors) setSlotErrors(errors);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setOcrSlots(null);
        setOcrErrors({});

        try {
            const res = await uploadTimetable(file);
            const data = res?.data?.data ?? res?.data ?? null;
            const generated = normalizeSlotsContainer(data).map(normalizeSlot);
            if (generated.length === 0) {
                toast.info('Backend không trích xuất được khung giờ nào từ ảnh.');
                return;
            }
            setOcrSlots(generated);
            toast.success('Đã quét thời khóa biểu. Vui lòng kiểm tra trước khi lưu.');
        } catch (error) {
            toast.error(getApiMessage(error, 'Quét thời khóa biểu thất bại.'));
        } finally {
            setUploading(false);
        }
    };

    const handleApplyOcr = async () => {
        const errors = await saveSlots(ocrSlots || []);
        if (errors) setOcrErrors(errors);
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
                    errors={ocrErrors}
                    onChange={(nextSlots) => {
                        setOcrSlots(nextSlots);
                        setOcrErrors({});
                    }}
                    onApply={handleApplyOcr}
                    onCancel={() => setOcrSlots(null)}
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
                <AvailabilityEditor
                    slots={renderedSlots}
                    onChange={handleSlotsChange}
                    errors={slotErrors}
                />
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
                    {saving ? 'Đang lưu...' : 'Lưu lịch rảnh'}
                </button>
            </div>
        </div>
    );
};

export default AvailabilityPage;
