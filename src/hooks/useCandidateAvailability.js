import { useCallback, useEffect, useState } from 'react';
import { getAvailability } from '../apis/AvailabilityApi.jsx';
import { fetchAvailability, resolveScheduleMode } from '../services/availabilityService.js';

// Hook load lịch rảnh cho Candidate Profile (AvailabilityCard summary).
export const useCandidateAvailability = () => {
    const [slots, setSlots] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [scheduleMode, setScheduleMode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadAvailability = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAvailability(getAvailability);
            setSlots(data.slots);
            setStartDate(data.startDate || '');
            setEndDate(data.endDate || '');
            setScheduleMode(resolveScheduleMode(data.scheduleMode));
            return data;
        } catch (err) {
            setError(err);
            setSlots([]);
            setStartDate('');
            setEndDate('');
            setScheduleMode(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadAvailability();
    }, [loadAvailability]);

    return {
        slots,
        startDate,
        endDate,
        scheduleMode,
        loading,
        error,
        hasSchedule: slots.length > 0,
        loadAvailability,
    };
};

export default useCandidateAvailability;
