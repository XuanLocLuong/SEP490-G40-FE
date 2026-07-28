import { useEffect, useState } from 'react';
import { getMyApplications } from '../../apis/ApplicationApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { USER_ROLES } from '../../utils/Constants.jsx';

/**
 * Hiển thị khi UV đang có đơn ACCEPTED (chưa HIRED) — vẫn xem gợi ý nhưng cảnh báo trùng ca.
 */
const AiRecommendationsPendingOfferHint = () => {
    const { auth } = useAuth();
    const [hasPendingOffer, setHasPendingOffer] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (auth?.role !== USER_ROLES.CANDIDATE) {
            setHasPendingOffer(false);
            setReady(true);
            return undefined;
        }

        let cancelled = false;

        (async () => {
            try {
                const res = await getMyApplications({ status: 'ACCEPTED', page: 0, size: 1 });
                const page = res?.data?.data ?? res?.data;
                const total = Number(page?.totalElements);
                const count = Number.isFinite(total)
                    ? total
                    : Array.isArray(page?.content)
                      ? page.content.length
                      : 0;
                if (!cancelled) setHasPendingOffer(count > 0);
            } catch {
                if (!cancelled) setHasPendingOffer(false);
            } finally {
                if (!cancelled) setReady(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [auth?.role]);

    if (!ready || !hasPendingOffer) return null;

    return (
        <p className="ai-profile-hint ai-profile-hint--offer" role="note">
            Bạn đang có offer chờ xác nhận. Các việc gợi ý bên dưới vẫn có thể xem và ứng tuyển;
            nếu trùng ca làm với offer hiện tại, nhà tuyển dụng có thể không mời hoặc hệ thống
            sẽ từ chối khi trùng lịch.
        </p>
    );
};

export default AiRecommendationsPendingOfferHint;
