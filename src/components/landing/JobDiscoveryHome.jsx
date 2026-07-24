import { useState, useRef, useCallback, useEffect } from 'react';
import HeroSection from './HeroSection.jsx';
import SearchResultsSection from './SearchResultsSection.jsx';
import UrgentJobsSection from './UrgentJobsSection.jsx';
import AiRecommendationsSection from './AiRecommendationsSection.jsx';
import FeaturedJobsSection from './FeaturedJobsSection.jsx';
import InteractionHistorySection from './InteractionHistorySection.jsx';
import TopEmployersSection from './TopEmployersSection.jsx';
import WhyJobLinkSection from './WhyJobLinkSection.jsx';
import BookmarkLoginRedirect from '../job/BookmarkLoginRedirect.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { applyCandidateScheduleAccess, isSearchQuery } from '../../utils/jobQuery.js';
import '../../assets/styles/LandingPageStyle.css';

/**
 * Shared discovery home content for guest landing (`/`) and candidate home (`/candidate`).
 * Auth for `/candidate` is enforced by ProtectedRoute; this component only toggles UI pieces.
 */
const JobDiscoveryHome = ({
    heroTitle,
    heroSubtitle,
    showWhySection = true,
    showBookmarkRedirect = false,
    showCandidateSections = false,
    featuredSize,
    featuredCompact = false,
    className = '',
}) => {
    const { auth } = useAuth();
    const isCandidate = auth?.role === USER_ROLES.CANDIDATE;
    const [searchQuery, setSearchQuery] = useState(null);
    const [searchFormResetKey, setSearchFormResetKey] = useState(0);
    const searchResultsRef = useRef(null);

    const handleSearch = useCallback(
        (payload) => {
            const nextQuery = applyCandidateScheduleAccess(payload, isCandidate);
            if (isSearchQuery(nextQuery)) {
                setSearchQuery(nextQuery);
            } else {
                setSearchQuery(null);
            }
        },
        [isCandidate]
    );

    useEffect(() => {
        if (searchQuery) {
            searchResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [searchQuery]);

    return (
        <div className={`landing-page ${className}`.trim()}>
            {showBookmarkRedirect && <BookmarkLoginRedirect />}
            <HeroSection
                onSearch={handleSearch}
                formResetKey={searchFormResetKey}
                title={heroTitle}
                subtitle={heroSubtitle}
            />

            {searchQuery && (
                <div ref={searchResultsRef}>
                    <SearchResultsSection
                        query={searchQuery}
                        onClear={() => {
                            setSearchQuery(null);
                            setSearchFormResetKey((key) => key + 1);
                        }}
                    />
                </div>
            )}

            {showCandidateSections && (
                <>
                    <UrgentJobsSection />
                    <AiRecommendationsSection />
                </>
            )}

            <FeaturedJobsSection size={featuredSize} compact={featuredCompact} />

            {showCandidateSections && <InteractionHistorySection />}

            <TopEmployersSection compact={featuredCompact} />
            {showWhySection && <WhyJobLinkSection />}
        </div>
    );
};

export default JobDiscoveryHome;
