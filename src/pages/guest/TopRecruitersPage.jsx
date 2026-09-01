import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BuildingIcon } from '../../components/common/icons.jsx';
import EmployerListRow from '../../components/landing/EmployerListRow.jsx';
import {
    fetchTopRecruiters,
    getTopRecruiterErrorMessage,
} from '../../apis/TopRecruiterApi.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { ROUTES, getHomePathByRole } from '../../routes/path.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { HOME_SECTION_IDS } from '../../utils/homeSections.js';
import { buildHomeScrollState } from '../../utils/jobNavReturn.js';
import '../../assets/styles/TopRecruitersPageStyle.css';

const TopRecruitersPage = () => {
    const { auth } = useAuth();
    const [employers, setEmployers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const backPath = useMemo(() => {
        if (auth?.role === USER_ROLES.CANDIDATE) return ROUTES.CANDIDATE_HOME;
        return getHomePathByRole(auth?.role) || ROUTES.LANDING;
    }, [auth?.role]);

    const backState = useMemo(
        () => buildHomeScrollState(HOME_SECTION_IDS.TOP_EMPLOYERS),
        []
    );

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const list = await fetchTopRecruiters();
                if (!cancelled) setEmployers(list);
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
    }, []);

    return (
        <div className="top-recruiters-page">
            <div className="top-recruiters-page__inner">
                <nav className="top-recruiters-page__back">
                    <Link to={backPath} state={backState}>
                        ← Quay lại trang chủ
                    </Link>
                </nav>

                <header className="top-recruiters-page__header">
                    <h1 className="top-recruiters-page__title">
                        <BuildingIcon width={24} height={24} aria-hidden="true" />
                        Top Nhà Tuyển Dụng Uy Tín
                    </h1>
                    <p className="top-recruiters-page__desc">
                        Danh sách do JobLink xếp hạng theo Trust Score, đánh giá ứng viên và lịch sử tuyển dụng.
                        <br /> Thứ tự hiển thị theo kết quả từ hệ thống.
                    </p>
                </header>

                {loading && employers.length === 0 && (
                    <div className="top-recruiters-page__list top-recruiters-page__list--loading">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="employer-list-row employer-list-row--skeleton" />
                        ))}
                    </div>
                )}

                {error && <p className="top-recruiters-page__error">{error}</p>}

                {!error && !loading && employers.length === 0 && (
                    <p className="top-recruiters-page__empty">
                        Chưa có nhà tuyển dụng đủ điều kiện trong bảng xếp hạng.
                    </p>
                )}

                {employers.length > 0 && (
                    <div className="top-recruiters-page__list">
                        {employers.map((employer) => (
                            <EmployerListRow
                                key={employer.businessId}
                                employer={employer}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopRecruitersPage;
