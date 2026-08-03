import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BuildingIcon } from '../common/icons.jsx';
import {
    fetchTopRecruiters,
    getTopRecruiterErrorMessage,
} from '../../apis/TopRecruiterApi.jsx';
import { ROUTES } from '../../routes/path.js';
import { HOME_SECTION_IDS } from '../../utils/homeSections.js';
import EmployerCard from './EmployerCard.jsx';

const PREVIEW_SIZE = 3;
const COMPACT_PREVIEW_SIZE = 4;

const TopEmployersSection = ({ compact = false }) => {
    const maxPreviewSize = compact ? COMPACT_PREVIEW_SIZE : PREVIEW_SIZE;
    const [employers, setEmployers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const list = await fetchTopRecruiters();
                if (!cancelled) {
                    setEmployers(list.slice(0, maxPreviewSize));
                }
            } catch (err) {
                if (!cancelled) {
                    setError(getTopRecruiterErrorMessage(err));
                    setEmployers([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [maxPreviewSize]);

    const visibleCount =
        employers.length > 0 ? employers.length : maxPreviewSize;

    const gridClass = [
        'landing-employers__grid',
        compact ? 'landing-employers__grid--compact' : '',
        `landing-employers__grid--count-${Math.min(visibleCount, maxPreviewSize)}`,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <section id={HOME_SECTION_IDS.TOP_EMPLOYERS} className="landing-section landing-employers">
            <div className="landing-section__header">
                <div>
                    <h2 className="landing-section__title candidate-home-section__title">
                        <BuildingIcon width={22} height={22} aria-hidden="true" />
                        Top 10 Nhà Tuyển Dụng Uy Tín
                    </h2>
                    <p className="landing-section__desc">
                        Đánh giá dựa trên Trust Score — chỉ số uy tín từ phản hồi ứng viên và lịch sử tuyển dụng.
                    </p>
                </div>
                <Link to={ROUTES.TOP_RECRUITERS} className="landing-section__link">
                    Xem tất cả →
                </Link>
            </div>

            {loading && employers.length === 0 && (
                <div className={`${gridClass} landing-employers__grid--loading`}>
                    {Array.from({ length: visibleCount }).map((_, index) => (
                        <div
                            key={index}
                            className={`employer-card employer-card--skeleton${
                                compact ? ' employer-card--compact' : ''
                            }`}
                        />
                    ))}
                </div>
            )}

            {error && <p className="landing-section__error">{error}</p>}

            {!error && !loading && employers.length === 0 && (
                <p className="landing-section__empty">
                    Chưa có nhà tuyển dụng đủ điều kiện trong bảng xếp hạng.
                </p>
            )}

            {employers.length > 0 && (
                <div className={gridClass}>
                    {employers.map((employer) => (
                        <EmployerCard
                            key={employer.businessId}
                            employer={employer}
                            compact={compact}
                            showRank
                            homeSectionId={HOME_SECTION_IDS.TOP_EMPLOYERS}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default TopEmployersSection;
