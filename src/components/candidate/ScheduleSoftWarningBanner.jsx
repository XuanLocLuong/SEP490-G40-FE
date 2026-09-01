import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../routes/path.js';
import { buildAvailabilityFromCurrentLocation } from '../../utils/availabilityNavReturn.js';
import {
    clearScheduleBannerDismissPersist,
    shouldShowScheduleSoftBanner,
} from '../../services/availabilityService.js';
import '../../assets/styles/ScheduleSoftBannerStyle.css';

const buildMessage = (summary) => {
    if (summary?.appliedJobCount > 0) {
        const n = summary.appliedJobCount;
        return n === 1
            ? 'Đã có 1 công việc đang chiếm lịch rảnh của bạn. Nếu đã nghỉ, hãy gỡ lịch để JobLink gợi ý việc mới chính xác hơn.'
            : `Đã có ${n} công việc đang chiếm lịch rảnh của bạn. Nếu đã nghỉ, hãy gỡ lịch để JobLink gợi ý việc mới chính xác hơn.`;
    }
    if (summary?.isTimetableExpired) {
        return 'Lịch bận đang hết hạn nên lịch rảnh có thể không còn đúng. Hãy cập nhật lại để gợi ý chính xác hơn.';
    }
    return 'Lịch rảnh của bạn có thể cần được kiểm tra lại để gợi ý việc chính xác hơn.';
};

/**
 * Soft warning — chỉ hiện khi job đang được áp dụng hoặc TKB có thể làm lệch lịch rảnh.
 * “Để sau” chỉ ẩn tạm đến khi reload / remount.
 */
const ScheduleSoftWarningBanner = ({ summary, loading = false, className = '' }) => {
    const location = useLocation();
    const [dismissed, setDismissed] = useState(false);
    const availabilityLinkState = useMemo(
        () => buildAvailabilityFromCurrentLocation(location),
        [location],
    );

    useEffect(() => {
        clearScheduleBannerDismissPersist();
    }, []);

    if (loading || dismissed || !shouldShowScheduleSoftBanner(summary)) {
        return null;
    }

    return (
        <div
            className={`schedule-soft-banner schedule-soft-banner--attention ${className}`.trim()}
            role="status"
        >
            <div className="schedule-soft-banner__body">
                <p className="schedule-soft-banner__text">{buildMessage(summary)}</p>
                <div className="schedule-soft-banner__actions">
                    <Link
                        to={ROUTES.CANDIDATE_AVAILABILITY}
                        state={availabilityLinkState}
                        className="schedule-soft-banner__cta"
                    >
                        Kiểm tra lịch rảnh
                    </Link>
                    <button
                        type="button"
                        className="schedule-soft-banner__dismiss"
                        onClick={() => setDismissed(true)}
                    >
                        Để sau
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleSoftWarningBanner;
