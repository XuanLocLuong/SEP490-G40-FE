import { useEffect, useState } from 'react';
import recruiterJobApi from '../apis/RecruiterJobApi.jsx';
import { JOB_TYPE_OPTIONS } from '../constants/jobPost.js';

const normalizeJobTypeOptions = (list) => {
    if (!Array.isArray(list)) return [];
    return list
        .map((item) => {
            if (!item) return null;
            if (typeof item === 'string') {
                return { value: item, label: item };
            }
            const value = item.value || item.name || item.code;
            if (!value) return null;
            return {
                value: String(value),
                label: item.label || String(value),
            };
        })
        .filter(Boolean);
};

/**
 * Load JobType từ GET /api/v1/jobs/types.
 * Fallback JOB_TYPE_OPTIONS nếu API lỗi / empty.
 */
export const useJobTypeOptions = () => {
    const [options, setOptions] = useState(JOB_TYPE_OPTIONS);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const list = normalizeJobTypeOptions(await recruiterJobApi.getJobTypes());
                if (!cancelled && list.length > 0) {
                    setOptions(list);
                }
            } catch {
                /* giữ fallback */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return options;
};

export default useJobTypeOptions;
