import { useCallback, useEffect, useState } from 'react';
import {
    getCandidatePublicProfile,
    getApiErrorMessage,
    isCandidateNotFoundError,
} from '../apis/CandidatePublicProfileApi.jsx';
import { fetchCandidatePublicProfile } from '../services/candidatePublicProfileService.js';

export const useCandidatePublicProfile = (candidateId) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState(null);

    const loadProfile = useCallback(async () => {
        if (!candidateId) {
            setNotFound(true);
            setProfile(null);
            setLoading(false);
            return null;
        }

        setLoading(true);
        setError(null);
        setNotFound(false);

        try {
            const mapped = await fetchCandidatePublicProfile(getCandidatePublicProfile, candidateId);
            setProfile(mapped);
            return mapped;
        } catch (err) {
            if (isCandidateNotFoundError(err)) {
                setNotFound(true);
                setProfile(null);
                return null;
            }
            setError(getApiErrorMessage(err, 'Không tải được hồ sơ ứng viên.'));
            setProfile(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, [candidateId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadProfile();
    }, [loadProfile]);

    return { profile, loading, notFound, error, loadProfile };
};

export default useCandidatePublicProfile;
