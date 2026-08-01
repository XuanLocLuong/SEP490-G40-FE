import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import JobCard from '../../components/job/JobCard.jsx';
import RichTextContent from '../../components/common/RichTextContent.jsx';
import GalleryLightbox from '../../components/common/GalleryLightbox.jsx';
import ReadonlyMapPreview from '../../components/recruiter/ReadonlyMapPreview.jsx';
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
import { useAuth } from '../../contexts/authContext.js';
import { resolveBusinessProfileBack } from '../../utils/businessNavReturn.js';
import { formatBusinessTypeLabel } from '../../utils/businessTypeDisplay.js';
import '../../assets/styles/PublicBusinessProfileStyle.css';

const TABS = {
    ABOUT: 'about',
    JOBS: 'jobs',
    REVIEWS: 'reviews',
};

const JOB_SUBTABS = {
    OPEN: 'open',
    CLOSED: 'closed',
};

const LOW_TRUST_THRESHOLD = 95;
const JOBS_PAGE_SIZE = 12;
const REVIEWS_PAGE_SIZE = 10;

const formatReviewDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const ReviewStars = ({ rating = 0, size = 14 }) => {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    return (
        <span className="public-business__stars" aria-label={`${value} trên 5 sao`}>
            {Array.from({ length: 5 }, (_, index) => (
                <StarIcon
                    key={index}
                    width={size}
                    height={size}
                    className={
                        index < Math.round(value)
                            ? 'public-business__star public-business__star--filled'
                            : 'public-business__star'
                    }
                    aria-hidden="true"
                />
            ))}
        </span>
    );
};

const isTrustedBadge = (badge) => badge === 'BUSINESS_VERIFIED';

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
    const location = useLocation();
    const { auth } = useAuth();

    const profileBack = useMemo(
        () =>
            resolveBusinessProfileBack({
                fromPath: location.state?.from,
                label: location.state?.label,
                role: auth?.role,
            }),
        [location.state?.from, location.state?.label, auth?.role]
    );

    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState('');

    const [activeTab, setActiveTab] = useState(TABS.ABOUT);
    const [jobsSubTab, setJobsSubTab] = useState(JOB_SUBTABS.OPEN);

    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [jobsError, setJobsError] = useState('');
    const [jobsPage, setJobsPage] = useState(0);
    const [jobsTotalPages, setJobsTotalPages] = useState(0);
    const [jobsTotalElements, setJobsTotalElements] = useState(0);
    const [jobsLoaded, setJobsLoaded] = useState(false);

    const [closedJobs, setClosedJobs] = useState([]);
    const [closedJobsLoading, setClosedJobsLoading] = useState(false);
    const [closedJobsError, setClosedJobsError] = useState('');
    const [closedJobsPage, setClosedJobsPage] = useState(0);
    const [closedJobsTotalPages, setClosedJobsTotalPages] = useState(0);
    const [closedJobsTotalElements, setClosedJobsTotalElements] = useState(0);
    const [closedJobsLoaded, setClosedJobsLoaded] = useState(false);

    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState('');
    const [reviewsPage, setReviewsPage] = useState(0);
    const [reviewsTotal, setReviewsTotal] = useState(0);
    const [reviewsAvg, setReviewsAvg] = useState(0);
    const [reviewsLoaded, setReviewsLoaded] = useState(false);
    const [galleryLightboxIndex, setGalleryLightboxIndex] = useState(null);

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
        setClosedJobs([]);
        setClosedJobsLoaded(false);
        setClosedJobsPage(0);
        setClosedJobsTotalPages(0);
        setClosedJobsTotalElements(0);
        setClosedJobsError('');
        setReviews([]);
        setReviewsLoaded(false);
        setReviewsPage(0);
        setReviewsTotal(0);
        setReviewsAvg(0);
        setReviewsError('');
        setGalleryLightboxIndex(null);
        setJobsSubTab(JOB_SUBTABS.OPEN);
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

    const loadClosedJobs = useCallback(
        async (page, append) => {
            setClosedJobsLoading(true);
            setClosedJobsError('');
            try {
                const pageData = await publicBusinessService.getClosedJobs(
                    businessId,
                    page,
                    JOBS_PAGE_SIZE
                );
                setClosedJobs((prev) =>
                    append ? [...prev, ...pageData.content] : pageData.content
                );
                setClosedJobsPage(pageData.currentPage);
                setClosedJobsTotalPages(pageData.totalPages);
                setClosedJobsTotalElements(pageData.totalElements ?? 0);
                setClosedJobsLoaded(true);
            } catch (err) {
                setClosedJobsError(
                    getApiErrorMessage(err, 'Không tải được tin đã kết thúc.')
                );
            } finally {
                setClosedJobsLoading(false);
            }
        },
        [businessId]
    );

    const loadReviews = useCallback(
        async (page, append) => {
            setReviewsLoading(true);
            setReviewsError('');
            try {
                const data = await publicBusinessService.getReviews(
                    businessId,
                    page,
                    REVIEWS_PAGE_SIZE
                );
                setReviews((prev) =>
                    append ? [...prev, ...data.reviews] : data.reviews
                );
                setReviewsPage(page);
                setReviewsTotal(data.totalReviews ?? 0);
                setReviewsAvg(data.averageRating ?? 0);
                setReviewsLoaded(true);
            } catch (err) {
                setReviewsError(
                    getApiErrorMessage(err, 'Không tải được danh sách đánh giá.')
                );
            } finally {
                setReviewsLoading(false);
            }
        },
        [businessId]
    );

    useEffect(() => {
        if (activeTab !== TABS.JOBS) {
            return;
        }
        if (!jobsLoaded) {
            loadJobs(0, false);
        }
        if (!closedJobsLoaded) {
            loadClosedJobs(0, false);
        }
    }, [activeTab, jobsLoaded, closedJobsLoaded, loadJobs, loadClosedJobs]);

    useEffect(() => {
        if (activeTab !== TABS.REVIEWS || reviewsLoaded) {
            return;
        }
        loadReviews(0, false);
    }, [activeTab, reviewsLoaded, loadReviews]);

    const primaryCity = useMemo(() => {
        const first = profile?.locations?.[0];
        return first?.city || formatLocation(first) || null;
    }, [profile]);

    const trustScoreNumber =
        profile?.trustScore != null ? Number(profile.trustScore) : null;
    /** Đã xác thực đầy đủ theo BE: badge, không dùng verificationStatus (vd. CCCD_PASSED). */
    const showVerified = isTrustedBadge(profile?.badge);
    const showLowTrustWarning =
        trustScoreNumber != null && trustScoreNumber < LOW_TRUST_THRESHOLD;

    const memberSinceLabel = formatMemberSince(profile?.memberSince);
    const hasMoreJobs = jobsPage + 1 < jobsTotalPages;
    const hasMoreClosedJobs = closedJobsPage + 1 < closedJobsTotalPages;
    const hasMoreReviews = reviews.length < reviewsTotal;
    const galleryImages = profile?.galleryImages ?? [];
    const primaryLocation = profile?.locations?.[0] ?? null;
    const primaryMapsUrl = buildMapsUrl(primaryLocation);
    const primaryLocationLabel = primaryLocation ? formatLocation(primaryLocation) : '';
    const primaryAddressLine = primaryLocation?.address?.trim() || '';

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
                    <Link to={profileBack.path} className="btn btn--secondary">
                        ← {profileBack.label}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="public-business-page">
            <div className="public-business__toolbar">
                <Link to={profileBack.path} className="public-business__back">
                    ← {profileBack.label}
                </Link>
            </div>

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
                                {formatBusinessTypeLabel(profile.businessType)}
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
                                <strong>{trustScoreNumber.toFixed(0)}/100</strong>
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
                    <button
                        type="button"
                        role="tab"
                        className={`public-business__tab${
                            activeTab === TABS.REVIEWS ? ' public-business__tab--active' : ''
                        }`}
                        aria-selected={activeTab === TABS.REVIEWS}
                        onClick={() => setActiveTab(TABS.REVIEWS)}
                    >
                        Đánh giá
                        {profile.totalReviews > 0 ? ` (${profile.totalReviews})` : ''}
                    </button>
                </div>

                <main className="public-business__main">
                    {activeTab === TABS.ABOUT && (
                        <section className="public-business__panel">
                            <h2 className="public-business__section-title">Mô tả chung</h2>

                            <div className="public-business__info-list">
                                <div className="public-business__info-card public-business__description">
                                    <RichTextContent
                                        content={profile.description}
                                        emptyText="Doanh nghiệp chưa cập nhật mô tả."
                                    />
                                </div>
                            </div>

                            {galleryImages.length > 0 && (
                                <div className="public-business__gallery">
                                    <h3 className="public-business__gallery-title">
                                        Không gian làm việc
                                    </h3>
                                    <div className="public-business__gallery-grid">
                                        {galleryImages.map((img, imgIndex) => (
                                            <button
                                                key={img.id ?? img.fileUrl}
                                                type="button"
                                                className="public-business__gallery-item"
                                                onClick={() =>
                                                    setGalleryLightboxIndex(imgIndex)
                                                }
                                                aria-label={`Xem ảnh ${imgIndex + 1} phóng to`}
                                            >
                                                <img
                                                    src={img.fileUrl}
                                                    alt=""
                                                    loading="lazy"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    <GalleryLightbox
                        images={galleryImages}
                        index={galleryLightboxIndex}
                        onClose={() => setGalleryLightboxIndex(null)}
                        onIndexChange={setGalleryLightboxIndex}
                    />

                    {activeTab === TABS.JOBS && (
                        <section className="public-business__panel">
                            <div
                                className="public-business__tabs public-business__jobs-subtabs"
                                role="tablist"
                                aria-label="Loại tin tuyển dụng"
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    className={`public-business__tab${
                                        jobsSubTab === JOB_SUBTABS.OPEN
                                            ? ' public-business__tab--active'
                                            : ''
                                    }`}
                                    aria-selected={jobsSubTab === JOB_SUBTABS.OPEN}
                                    onClick={() => setJobsSubTab(JOB_SUBTABS.OPEN)}
                                >
                                    Tin đang tuyển dụng
                                    {jobsLoaded && !jobsError && jobsTotalElements > 0
                                        ? ` (${jobsTotalElements})`
                                        : ''}
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    className={`public-business__tab${
                                        jobsSubTab === JOB_SUBTABS.CLOSED
                                            ? ' public-business__tab--active'
                                            : ''
                                    }`}
                                    aria-selected={jobsSubTab === JOB_SUBTABS.CLOSED}
                                    onClick={() => setJobsSubTab(JOB_SUBTABS.CLOSED)}
                                >
                                    Tin đã kết thúc
                                    {closedJobsLoaded &&
                                    !closedJobsError &&
                                    closedJobsTotalElements > 0
                                        ? ` (${closedJobsTotalElements})`
                                        : ''}
                                </button>
                            </div>

                            {jobsSubTab === JOB_SUBTABS.OPEN && (
                                <>
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
                                </>
                            )}

                            {jobsSubTab === JOB_SUBTABS.CLOSED && (
                                <>
                                    {closedJobsLoading && closedJobs.length === 0 && (
                                        <p className="public-business__jobs-empty">
                                            Đang tải tin đã kết thúc…
                                        </p>
                                    )}

                                    {closedJobsError && (
                                        <div className="public-business__jobs-empty public-business__jobs-error">
                                            <p>{closedJobsError}</p>
                                            <button
                                                type="button"
                                                className="btn btn--secondary"
                                                disabled={closedJobsLoading}
                                                onClick={() => loadClosedJobs(0, false)}
                                            >
                                                {closedJobsLoading ? 'Đang tải…' : 'Thử lại'}
                                            </button>
                                        </div>
                                    )}

                                    {!closedJobsLoading &&
                                        !closedJobsError &&
                                        closedJobs.length === 0 && (
                                            <p className="public-business__jobs-empty">
                                                Chưa có tin tuyển dụng đã kết thúc.
                                            </p>
                                        )}

                                    {closedJobs.length > 0 && (
                                        <div className="public-business__jobs-grid">
                                            {closedJobs.map((job) => (
                                                <JobCard key={job.id} job={job} />
                                            ))}
                                        </div>
                                    )}

                                    {hasMoreClosedJobs && (
                                        <div className="public-business__load-more">
                                            <button
                                                type="button"
                                                className="btn btn--secondary"
                                                disabled={closedJobsLoading}
                                                onClick={() =>
                                                    loadClosedJobs(closedJobsPage + 1, true)
                                                }
                                            >
                                                {closedJobsLoading ? 'Đang tải…' : 'Xem thêm'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    )}

                    {activeTab === TABS.REVIEWS && (
                        <section className="public-business__panel">
                            <div className="public-business__reviews-header">
                                <h2 className="public-business__section-title">
                                    Đánh giá từ ứng viên
                                </h2>
                                {reviewsLoaded && !reviewsError && reviewsTotal > 0 && (
                                    <div className="public-business__reviews-summary">
                                        <ReviewStars rating={reviewsAvg} size={18} />
                                        <strong>{Number(reviewsAvg).toFixed(1)}</strong>
                                        <span>
                                            {reviewsTotal} đánh giá
                                        </span>
                                    </div>
                                )}
                            </div>

                            {reviewsLoading && reviews.length === 0 && (
                                <p className="public-business__jobs-empty">
                                    Đang tải đánh giá…
                                </p>
                            )}

                            {reviewsError && (
                                <div className="public-business__jobs-empty public-business__jobs-error">
                                    <p>{reviewsError}</p>
                                    <button
                                        type="button"
                                        className="btn btn--secondary"
                                        disabled={reviewsLoading}
                                        onClick={() => loadReviews(0, false)}
                                    >
                                        {reviewsLoading ? 'Đang tải…' : 'Thử lại'}
                                    </button>
                                </div>
                            )}

                            {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                                <p className="public-business__jobs-empty">
                                    Doanh nghiệp chưa có đánh giá công khai.
                                </p>
                            )}

                            {reviews.length > 0 && (
                                <ul className="public-business__reviews-list">
                                    {reviews.map((review) => (
                                        <li
                                            key={review.id}
                                            className="public-business__review-item"
                                        >
                                            <div className="public-business__review-top">
                                                {review.reviewerProfilePicture ? (
                                                    <img
                                                        src={review.reviewerProfilePicture}
                                                        alt=""
                                                        className="public-business__review-avatar"
                                                    />
                                                ) : (
                                                    <div
                                                        className="public-business__review-avatar public-business__review-avatar--placeholder"
                                                        aria-hidden="true"
                                                    >
                                                        {(review.reviewerName || '?')
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="public-business__review-meta">
                                                    <strong>
                                                        {review.reviewerName || 'Ứng viên'}
                                                    </strong>
                                                    <div className="public-business__review-rating-row">
                                                        <ReviewStars
                                                            rating={review.rating}
                                                            size={14}
                                                        />
                                                        {formatReviewDate(review.createdAt) && (
                                                            <time dateTime={review.createdAt}>
                                                                {formatReviewDate(
                                                                    review.createdAt
                                                                )}
                                                            </time>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {review.comment ? (
                                                <p className="public-business__review-comment">
                                                    {review.comment}
                                                </p>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {hasMoreReviews && (
                                <div className="public-business__load-more">
                                    <button
                                        type="button"
                                        className="btn btn--secondary"
                                        disabled={reviewsLoading}
                                        onClick={() =>
                                            loadReviews(reviewsPage + 1, true)
                                        }
                                    >
                                        {reviewsLoading ? 'Đang tải…' : 'Xem thêm'}
                                    </button>
                                </div>
                            )}
                        </section>
                    )}
                </main>

                <aside className="public-business__sidebar">
                    <section className="public-business__sidebar-card">
                        <h2 className="public-business__section-title">Thông tin liên hệ</h2>
                        <ul className="public-business__contact-list">
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
                    </section>

                    <section className="public-business__sidebar-card public-business__location-card">
                        <h2 className="public-business__section-title">Địa chỉ</h2>
                        {!primaryLocation ? (
                            <p className="public-business__location-empty">
                                Chưa cập nhật địa chỉ.
                            </p>
                        ) : (
                            <>
                                {primaryLocation.name && (
                                    <strong className="public-business__info-card-label">
                                        {primaryLocation.name}
                                    </strong>
                                )}
                                {primaryAddressLine && (
                                    <p className="public-business__info-card-primary">
                                        {primaryAddressLine}
                                    </p>
                                )}
                                {primaryLocationLabel &&
                                    primaryLocationLabel !== primaryAddressLine && (
                                        <p className="public-business__info-card-secondary">
                                            {primaryLocationLabel}
                                        </p>
                                    )}

                                {primaryMapsUrl &&
                                    primaryLocation.latitude != null &&
                                    primaryLocation.longitude != null && (
                                        <div className="public-business__map-shell">
                                            <ReadonlyMapPreview
                                                latitude={primaryLocation.latitude}
                                                longitude={primaryLocation.longitude}
                                                className="public-business__map-preview"
                                            />
                                            <a
                                                href={primaryMapsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="public-business__map-hitbox"
                                                aria-label="Mở vị trí doanh nghiệp trên Google Maps"
                                            />
                                        </div>
                                    )}

                                {primaryMapsUrl &&
                                    (primaryLocation.latitude == null ||
                                        primaryLocation.longitude == null) && (
                                        <a
                                            href={primaryMapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="public-business__map-placeholder"
                                            aria-label="Mở vị trí doanh nghiệp trên Google Maps"
                                        >
                                            <MapPinIcon width={30} height={30} />
                                        </a>
                                    )}
                            </>
                        )}
                    </section>
                </aside>
            </div>
        </div>
    );
};

export default PublicBusinessProfilePage;
