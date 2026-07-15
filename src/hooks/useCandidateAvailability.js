import { useCallback, useEffect, useState } from 'react';
import { getAvailability } from '../apis/AvailabilityApi.jsx';
import { fetchAvailabilitySlots } from '../services/availabilityService.js';

// Hook load lịch rảnh cho Candidate Profile (AvailabilityCard summary).
export const useCandidateAvailability = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadAvailability = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAvailabilitySlots(getAvailability);
            setSlots(data);
            return data;
        } catch (err) {
            setError(err);
            setSlots([]);
            return [];
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
        loading,
        error,
        hasSchedule: slots.length > 0,
        loadAvailability,
    };
};

export default useCandidateAvailability;
