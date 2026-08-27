import {
    fetchJobReportStatus,
    fetchReportReasons,
    getJobReportApiErrorMessage,
    submitJobReport,
} from '../apis/JobReportApi.jsx';

export { getJobReportApiErrorMessage };

export const MAX_REPORT_EVIDENCE = 3;

export const REPORT_STATUS_LABELS = {
    PENDING: 'Đang chờ xử lý',
    RESOLVED: 'Đã xử lý',
    REJECTED: 'Đã bác bỏ',
};

/** Hiển thị tiếng Việt theo code BE (vẫn gửi code gốc khi submit). */
export const REPORT_REASON_LABELS_VI = {
    SCAM: {
        name: 'Lừa đảo / yêu cầu đặt cọc',
        description: 'Nghi ngờ lừa đảo, gian lận hoặc yêu cầu chuyển khoản/đặt cọc.',
    },
    MISLEADING_INFORMATION: {
        name: 'Thông tin sai lệch',
        description: 'Mức lương, công việc hoặc thông tin doanh nghiệp không đúng.',
    },
    SPAM: {
        name: 'Spam / tin trùng',
        description: 'Tin spam hoặc đăng trùng lặp.',
    },
    HARASSMENT: {
        name: 'Quấy rối / hành vi không phù hợp',
        description: 'Quấy rối hoặc hành vi không phù hợp.',
    },
    OTHER: {
        name: 'Khác',
        description: 'Vi phạm khác liên quan chính sách.',
    },
};

const dynamicReasonsCache = new Map();

export const registerReportReasons = (reasons) => {
    if (Array.isArray(reasons)) {
        reasons.forEach((r) => {
            const code = String(r?.code || '').toUpperCase();
            if (code) {
                dynamicReasonsCache.set(code, {
                    code: r.code,
                    name: r.name,
                    description: r.description,
                });
            }
        });
    }
};

export const getReportReasonDisplay = (reason) => {
    const code = typeof reason === 'string' ? reason.toUpperCase() : String(reason?.code || '').toUpperCase();
    const dynamicReason = dynamicReasonsCache.get(code);
    const mapped = REPORT_REASON_LABELS_VI[code];

    const rawName = typeof reason === 'object' && reason?.name ? reason.name : null;
    const rawDescription = typeof reason === 'object' && reason?.description ? reason.description : null;

    return {
        code: typeof reason === 'object' ? reason?.code : code,
        name: rawName || dynamicReason?.name || mapped?.name || code,
        description: rawDescription || dynamicReason?.description || mapped?.description || '',
    };
};

/** OTHER luôn xuống cuối danh sách. */
export const sortReportReasons = (list) => {
    const items = Array.isArray(list) ? [...list] : [];
    return items.sort((a, b) => {
        const aOther = String(a?.code || '').toUpperCase() === 'OTHER';
        const bOther = String(b?.code || '').toUpperCase() === 'OTHER';
        if (aOther !== bOther) return aOther ? 1 : -1;
        return 0;
    });
};

export const validateJobReportForm = ({ reportReasonCodes, description, evidenceFiles }) => {
    if (!Array.isArray(reportReasonCodes) || reportReasonCodes.length === 0) {
        return 'Vui lòng chọn ít nhất một lý do báo cáo.';
    }
    if (!String(description || '').trim()) {
        return 'Vui lòng cung cấp mô tả chi tiết.';
    }
    if (Array.isArray(evidenceFiles) && evidenceFiles.length > MAX_REPORT_EVIDENCE) {
        return `Chỉ được tải lên tối đa ${MAX_REPORT_EVIDENCE} ảnh minh chứng.`;
    }
    return null;
};

export const loadReportReasons = async () => {
    try {
        const list = await fetchReportReasons();
        registerReportReasons(list);
        return sortReportReasons(list);
    } catch {
        return [];
    }
};

export const loadJobReportStatus = (jobId) => fetchJobReportStatus(jobId);

export const sendJobReport = (jobId, form) => {
    const error = validateJobReportForm(form);
    if (error) return Promise.reject(new Error(error));
    return submitJobReport(
        jobId,
        {
            reportReasonCodes: form.reportReasonCodes,
            description: String(form.description || '').trim(),
        },
        form.evidenceFiles || []
    );
};
