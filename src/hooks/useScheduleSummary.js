import { useCallback, useEffect, useState } from 'react';
import { getHiredJobShifts, getScheduleSummary } from '../apis/AvailabilityApi.jsx';
import {
    fetchHiredJobShifts,
    fetchScheduleSummary,
    normalizeScheduleSummary,
    shouldShowScheduleSoftBanner,
} from '../services/availabilityService.js';

/**
 * Load schedule attention signals for soft banner.
 * Chỉ dùng summary + /jobs/hired — khớp panel Availability (có gì để gỡ/áp).
 * Không dùng applications?status=HIRED (tránh banner hiện khi chưa có record lịch).
 */
export const useScheduleSummary = ({ enabled = true } = {}) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(Boolean(enabled));

    const reload = useCallback(async () => {
        if (!enabled) {
            setSummary(null);
            setLoading(false);
            return null;
        }
        setLoading(true);
        try {
            const [summaryResult, hiredResult] = await Promise.allSettled([
                fetchScheduleSummary(getScheduleSummary),
                fetchHiredJobShifts(getHiredJobShifts),
            ]);

            const base =
                summaryResult.status === 'fulfilled'
                    ? summaryResult.value
                    : normalizeScheduleSummary({});

            const hiredJobs =
                hiredResult.status === 'fulfilled' ? hiredResult.value : [];
            const hiredFromSchedule = hiredJobs.length;
            const appliedFromSchedule = hiredJobs.filter((job) => job.isApplied).length;

            const merged = {
                ...base,
                appliedJobCount: Math.max(base.appliedJobCount || 0, appliedFromSchedule),
                totalHiredJobCount: Math.max(
                    base.totalHiredJobCount || 0,
                    hiredFromSchedule,
                ),
            };

            setSummary(merged);
            return merged;
        } catch {
            setSummary(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        reload();
    }, [reload]);

    return {
        summary,
        loading,
        reload,
        needsAttention: shouldShowScheduleSoftBanner(summary),
    };
};

export default useScheduleSummary;
