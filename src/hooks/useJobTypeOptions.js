import { useEffect, useState } from 'react';
import { JOB_TYPE_OPTIONS } from '../constants/jobPost.js';
import {
    fetchJobTypeOptions,
    normalizeJobTypeOptions,
} from '../utils/jobTypeDisplay.js';

export {
    fetchJobTypeOptions,
    invalidateJobTypeOptionsCache,
} from '../utils/jobTypeDisplay.js';

/**
 * Load JobType từ GET /api/v1/jobs/types.
 * Fallback JOB_TYPE_OPTIONS nếu API lỗi / empty.
 *
 * @param {{ forceOnMount?: boolean }} [opts]
 *   forceOnMount: bỏ cache khi mount (trang đăng/sửa tin — tránh chip cũ sau admin tắt).
 */
export const useJobTypeOptions = ({ forceOnMount = false } = {}) => {
    const [options, setOptions] = useState(() => normalizeJobTypeOptions(JOB_TYPE_OPTIONS));

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const list = await fetchJobTypeOptions({ force: forceOnMount });
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
    }, [forceOnMount]);

    return options;
};

export default useJobTypeOptions;
