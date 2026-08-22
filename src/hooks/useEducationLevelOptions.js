import { useEffect, useState } from 'react';
import { getEducationLevels } from '../apis/CandidateProfileApi.jsx';
import { EDUCATION_LEVEL_OPTIONS } from '../utils/profileFormat.js';

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

const normalizeEducationLevelOptions = (list) => {
    if (!Array.isArray(list)) return [];
    return list
        .map((item) => {
            if (!item) return null;
            if (typeof item === 'string') {
                return { value: item, label: item, order: 0 };
            }
            const value = item.value || item.code || item.name;
            if (!value) return null;
            return {
                value: String(value),
                label: item.label || String(value),
                order: Number(item.order) || 0,
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'vi'));
};

let cachedOptions = null;
let cachedAt = 0;
let inFlight = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

const loadEducationLevelOptions = async () => {
    if (cachedOptions && Date.now() - cachedAt < CACHE_TTL_MS) {
        return cachedOptions;
    }

    if (!inFlight) {
        inFlight = getEducationLevels()
            .then((res) => normalizeEducationLevelOptions(unwrap(res)))
            .then((list) => {
                if (list.length > 0) {
                    cachedOptions = list;
                    cachedAt = Date.now();
                }
                return list;
            })
            .finally(() => {
                inFlight = null;
            });
    }

    return inFlight;
};

/**
 * Load bậc học từ GET /api/v1/education-levels.
 * Fallback EDUCATION_LEVEL_OPTIONS (đúng enum BE) nếu API lỗi / empty.
 */
export const useEducationLevelOptions = () => {
    const [options, setOptions] = useState(cachedOptions || EDUCATION_LEVEL_OPTIONS);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const list = await loadEducationLevelOptions();
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

export default useEducationLevelOptions;
