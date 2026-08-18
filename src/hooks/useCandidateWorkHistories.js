import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    fetchWorkHistories,
    getWorkHistoryErrorMessage,
    removeWorkHistory,
    saveWorkHistory,
} from '../services/candidateWorkHistoryService.js';

export const useCandidateWorkHistories = () => {
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadExperiences = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        try {
            const data = await fetchWorkHistories();
            setExperiences(data);
            return data;
        } catch (err) {
            if (!silent) setExperiences([]);
            toast.error(getWorkHistoryErrorMessage(err, 'Không tải được kinh nghiệm làm việc.'));
            return [];
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    const saveExperience = useCallback(async (id, form) => {
        setSaving(true);
        try {
            await saveWorkHistory(id, form);
            await loadExperiences({ silent: true });
            toast.success('Đã lưu kinh nghiệm làm việc.');
            return true;
        } catch (err) {
            toast.error(getWorkHistoryErrorMessage(err));
            return false;
        } finally {
            setSaving(false);
        }
    }, [loadExperiences]);

    const deleteExperience = useCallback(async (id) => {
        setSaving(true);
        try {
            await removeWorkHistory(id);
            await loadExperiences({ silent: true });
            toast.success('Đã xóa kinh nghiệm làm việc.');
            return true;
        } catch (err) {
            toast.error(getWorkHistoryErrorMessage(err, 'Không xóa được kinh nghiệm làm việc.'));
            return false;
        } finally {
            setSaving(false);
        }
    }, [loadExperiences]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadExperiences();
    }, [loadExperiences]);

    return {
        experiences,
        loading,
        saving,
        loadExperiences,
        saveExperience,
        deleteExperience,
    };
};

export default useCandidateWorkHistories;
