import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import JobCard from '../../components/job/JobCard.jsx';
import RichTextContent from '../../components/common/RichTextContent.jsx';
import {
    CheckCircleIcon,
    GlobeIcon,
    MailIcon,
    MapPinIcon,
    PhoneIcon,
    StarIcon,
} from '../../components/common/icons.jsx';
import publicBusinessService, {
    getApiErrorMessage,
} from '../../services/publicBusinessService.js';
import {
    formatLocation,
    getBusinessInitial,
} from '../../utils/formatters.js';
import { ROUTES } from '../../routes/path.js';
import '../../assets/styles/PublicBusinessProfileStyle.css';

const TABS = {
    ABOUT: 'about',
    JOBS: 'jobs',
    REVIEWS: 'reviews',
};

const LOW_TRUST_THRESHOLD = 40;
const VERIFIED_TRUST_THRESHOLD = 70;
const JOBS_PAGE_SIZE = 12;

const isVerificationPassed = (status) =>
    status === 'BUSSINESS_PASSED' ||
    status === 'CCCD_PASSED' ||
    status === 'FACE_PASSED' ||
    status === 'BUSSINESS_MANUALLY' ||
    status === 'CCCD_MANUALLY';

const isTrustedBadge = (badge) =>
    badge === 'BUSSINESS_VERIFYED' || badge === 'IDENTITY_VERIFYED';

const formatMemberSince = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return `Tham gia từ ${date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}`;
};

const buildMapsUrl = (location) => {
    if (!location) return null;
    if (location.latitude != null && location.longitude != null) {
        return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    }
    const query = [location.address, location.ward, location.city].filter(Boolean).join(', ');
    if (!query) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

const PublicBusinessProfilePage = () => {
    const { businessId } = useParams();
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState('');

    const [activeTab, setActiveTab] = useState(TABS.ABOUT);

    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [jobsError, setJobsError] = useState('');
    const [jobsPage, setJobsPage] = useState(0);
    const [jobsTotalPages, setJobsTotalPages] = useState(0);
    const [jobsTotalElements, setJobsTotalElements] = useState(0);
    const [jobsLoaded, setJobsLoaded] = useState(false);

    useEffect(() => {
        setProfile(null);
        setProfileLoading(true);
        setProfileError('');
        setJobs([]);
        setJobsLoaded(false);
        setJobsPage(0);
        setJobsTotalPages(0);
        setJobsTotalElements(0);
        setJobsError('');
        setActiveTab(TABS.ABOUT);
    }, [businessId]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setProfileLoading(true);
            setProfileError('');
            try {
                const data = await publicBusinessService.getProfile(businessId);
                if (!cancelled) {
                    setProfile(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setProfileError(getApiErrorMessage(err, 'Không tải được thông tin doanh nghiệp.'));
                }
            } finally {
                if (!cancelled) {
                    setProfileLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [businessId]);

    const loadJobs = useCallback(
        async (page, append) => {
            setJobsLoading(true);
            setJobsError('');
            try {
                const pageData = await publicBusinessService.getOpenJobs(
                    businessId,
                    page,
                    JOBS_PAGE_SIZE
                );
                setJobs((prev) =>
                    append ? [...prev, ...pageData.content] : pageData.content
                );
                setJobsPage(pageData.currentPage);
                setJobsTotalPages(pageData.totalPages);
                setJobsTotalElements(pageData.totalElements ?? 0);
                setJobsLoaded(true);
            } catch (err) {
                setJobsError(getApiErrorMessage(err, 'Không tải được danh sách việc làm.'));
            } finally {
                setJobsLoading(false);
            }
        },
        [businessId]
    );

    useEffect(() => {
        if (activeTab !== TABS.JOBS || jobsLoaded) {
            return;
        }
        loadJobs(0, false);
    }, [activeTab, jobsLoaded, loadJobs]);

    const primaryCity = useMemo(() => {
        const first = profile?.locations?.[0];
        return first?.city || formatLocation(first) || null;
    }, [profile]);

    const trustScoreNumber =
        profile?.trustScore != null ? Number(profile.trustScore) : null;
    const showVerified =
        isVerificationPassed(profile?.verificationStatus) ||
        isTrustedBadge(profile?.badge) ||
        (trustScoreNumber != null && trustScoreNumber >= VERIFIED_TRUST_THRESHOLD);
    const showLowTrustWarning =
        trustScoreNumber != null && trustScoreNumber < LOW_TRUST_THRESHOLD;

    const memberSinceLabel = formatMemberSince(profile?.memberSince);
    const hasMoreJobs = jobsPage + 1 < jobsTotalPages;

    if (profileLoading) {
        return (
            <div className="public-business-page">
                <div className="public-business__loading">Đang tải hồ sơ doanh nghiệp…</div>
            </div>
        );
    }

    if (profileError || !profile) {
        return (
            <div className="public-business-page">
                <div className="public-business__error">
                    <p>{profileError || 'Không tìm thấy doanh nghiệp.'}</p>
                    <Link to={ROUTES.LANDING} className="btn btn--secondary">
                        Về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="public-business-page">
            <section className="public-business__hero">
                {profile.logoUrl ? (
                    <img
                        src={profile.logoUrl}
                        alt=""
                        className="public-business__logo"
                    />
                ) : (
                    <div
                        className="public-business__logo public-business__logo--placeholder"
                        aria-hidden="true"
                    >
                        {getBusinessInitial(profile.businessName)}
                    </div>
                )}

                <div className="public-business__hero-main">
                    <div className="public-business__hero-title-row">
                        <div className="public-business__hero-heading">
                            <h1>{profile.businessName}</h1>
                            {primaryCity && (
                                <p className="public-business__hero-city">
                                    <MapPinIcon width={16} height={16} />
                                    {primaryCity}
                                </p>
                            )}
                        </div>
                        {profile.businessType && (
                            <span className="public-business__badge public-business__badge--muted">
                                {profile.businessType}
                            </span>
                        )}
                        {showVerified && (
                            <span className="public-business__badge public-business__badge--verified">
                                <CheckCircleIcon width={14} height={14} />
                                Doanh nghiệp đã xác minh
                            </span>
                        )}
                    </div>

                    <div className="public-business__stats">
                        {trustScoreNumber != null && (
                            <div className="public-business__stat">
                                <strong>{trustScoreNumber.toFixed(0)}</strong>
                                <span>Trust Score</span>
                            </div>
                        )}
                        <div className="public-business__stat">
                            <strong>
                                <StarIcon width={16} height={16} aria-hidden="true" />
                                {profile.averageRating.toFixed(1)}
                            </strong>
                            <span>{profile.totalReviews} đánh giá</span>
                        </div>
                        <div className="public-business__stat">
                            <strong>{profile.hiredCount}</strong>
                            <span>Ứng viên đã tuyển</span>
                        </div>
                    </div>

                    {showLowTrustWarning && (
                        <div className="public-business__trust-warning" role="status">
                            <span aria-hidden="true">⚠</span>
                            <span>
                                Doanh nghiệp có điểm tin cậy thấp. Hãy xem xét kỹ thông tin trước
                                khi ứng tuyển.
                            </span>
                        </div>
                    )}
                </div>
            </section>

            <div className="public-business__layout">
                <div className="public-business__tabs" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        className={`public-business__tab${
                            activeTab === TABS.ABOUT ? ' public-business__tab--active' : ''
                        }`}
                        aria-selected={activeTab === TABS.ABOUT}
                        onClick={() => setActiveTab(TABS.ABOUT)}
                    >
                        Giới thiệu
                    </button>
                    <button
                        type="button"
                        role="tab"
                        className={`public-business__tab${
                            activeTab === TABS.JOBS ? ' public-business__tab--active' : ''
                        }`}
                        aria-selected={activeTab === TABS.JOBS}
                        onClick={() => setActiveTab(TABS.JOBS)}
                    >
                        Tuyển dụng
                    </button>
                    <Link
                        to={ROUTES.LANDING}
                        className="public-business__tab"
                        role="tab"
                    >
                        Đánh giá
                    </Link>
                </div>

                <main className="public-business__main">
                    {activeTab === TABS.ABOUT && (
                        <section className="public-business__panel">
                            <h2 className="public-business__section-title">Mô tả chung</h2>

                            <div className="public-business__info-list">
                                {profile.locations.length === 0 && (
                                    <p className="public-business__jobs-empty">
                                        Chưa cập nhật địa chỉ.
                                    </p>
                                )}
                                {profile.locations.map((location) => {
                                    const mapsUrl = buildMapsUrl(location);
                                    const wardProvince = formatLocation(location);
                                    const addressLine = location.address?.trim() || '';

                                    return (
                                        <div
                                            key={location.id ?? `${location.address}-${location.city}`}
                                            className="public-business__info-card"
                                        >
                                            {location.name && (
                                                <strong className="public-business__info-card-label">
                                                    {location.name}
                                                </strong>
                                            )}
                                            <p className="public-business__info-card-primary">
                                                {wardProvince}
                                            </p>
                                            {addressLine && addressLine !== wardProvince && (
                                                <p className="public-business__info-card-secondary">
                                                    {addressLine}
                                                </p>
                                            )}
                                            {mapsUrl && (
                                                <a
                                                    href={mapsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="public-business__location-link"
                                                >
                                                    Xem trên Google Maps
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}

                                <div className="public-business__info-card public-business__description">
                                    <RichTextContent
                                        content={profile.description}
                                        emptyText="Doanh nghiệp chưa cập nhật mô tả."
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === TABS.JOBS && (
                        <section className="public-business__panel">
                            <h2 className="public-business__section-title">
                                Tin đang tuyển dụng
                                {jobsLoaded && !jobsError && jobsTotalElements > 0
                                    ? ` (${jobsTotalElements})`
                                    : ''}
                            </h2>

                            {jobsLoading && jobs.length === 0 && (
                                <p className="public-business__jobs-empty">
                                    Đang tải tin tuyển dụng…
                                </p>
                            )}

                            {jobsError && (
                                <div className="public-business__jobs-empty public-business__jobs-error">
                                    <p>{jobsError}</p>
                                    <button
                                        type="button"
                                        className="btn btn--secondary"
                                        disabled={jobsLoading}
                                        onClick={() => loadJobs(0, false)}
                                    >
                                        {jobsLoading ? 'Đang tải…' : 'Thử lại'}
                                    </button>
                                </div>
                            )}

                            {!jobsLoading && !jobsError && jobs.length === 0 && (
                                <p className="public-business__jobs-empty">
                                    Doanh nghiệp hiện chưa có tin đang tuyển.
                                </p>
                            )}

                            {jobs.length > 0 && (
                                <div className="public-business__jobs-grid">
                                    {jobs.map((job) => (
                                        <JobCard key={job.id} job={job} />
                                    ))}
                                </div>
                            )}

                            {hasMoreJobs && (
                                <div className="public-business__load-more">
                                    <button
                                        type="button"
                                        className="btn btn--secondary"
                                        disabled={jobsLoading}
                                        onClick={() => loadJobs(jobsPage + 1, true)}
                                    >
                                        {jobsLoading ? 'Đang tải…' : 'Xem thêm'}
                                    </button>
                                </div>
                            )}
                        </section>
                    )}
                </main>

                <aside className="public-business__sidebar">
                    <h2 className="public-business__section-title">Thông tin liên hệ</h2>
                    <ul className="public-business__contact-list">
                        {profile.businessType && (
                            <li className="public-business__contact-item">
                                <MapPinIcon width={18} height={18} />
                                <span>{profile.businessType}</span>
                            </li>
                        )}
                        {profile.phone && (
                            <li className="public-business__contact-item">
                                <PhoneIcon width={18} height={18} />
                                <a href={`tel:${profile.phone}`}>{profile.phone}</a>
                            </li>
                        )}
                        {profile.email && (
                            <li className="public-business__contact-item">
                                <MailIcon width={18} height={18} />
                                <a href={`mailto:${profile.email}`} title={profile.email}>
                                    {profile.email}
                                </a>
                            </li>
                        )}
                        {profile.websiteUrl && (
                            <li className="public-business__contact-item">
                                <GlobeIcon width={18} height={18} />
                                <a
                                    href={profile.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={profile.websiteUrl}
                                >
                                    {profile.websiteUrl.replace(/^https?:\/\//, '')}
                                </a>
                            </li>
                        )}
                    </ul>
                    {memberSinceLabel && (
                        <p className="public-business__member-since">{memberSinceLabel}</p>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default PublicBusinessProfilePage;
