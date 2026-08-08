import { useState, useRef, useCallback, useEffect } from 'react';
import HeroSection from './HeroSection.jsx';
import SearchResultsSection from './SearchResultsSection.jsx';
import UrgentJobsSection from './UrgentJobsSection.jsx';
import AiRecommendationsSection from './AiRecommendationsSection.jsx';
import FeaturedJobsSection from './FeaturedJobsSection.jsx';
import TopEmployersSection from './TopEmployersSection.jsx';
import WhyJobLinkSection from './WhyJobLinkSection.jsx';
import BookmarkLoginRedirect from '../job/BookmarkLoginRedirect.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { applyCandidateScheduleAccess, isSearchQuery } from '../../utils/jobQuery.js';
import {
    clearHomeSearchQuery,
    peekHomeSearchQuery,
    setHomeSearchQuery,
} from '../../utils/homeSearchStorage.js';
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
    const [searchQuery, setSearchQuery] = useState(() => {
        const saved = peekHomeSearchQuery();
        return saved ? applyCandidateScheduleAccess(saved, isCandidate) : null;
    });
    const [searchFormResetKey, setSearchFormResetKey] = useState(0);
    const searchResultsRef = useRef(null);
    const skipNextScrollRef = useRef(Boolean(searchQuery));

    const handleSearch = useCallback(
        (payload) => {
            const nextQuery = applyCandidateScheduleAccess(payload, isCandidate);
            if (isSearchQuery(nextQuery)) {
                skipNextScrollRef.current = false;
                setSearchQuery(nextQuery);
                setHomeSearchQuery(nextQuery);
            } else {
                setSearchQuery(null);
                clearHomeSearchQuery();
            }
        },
        [isCandidate]
    );

    const handleClearSearch = useCallback(() => {
        setSearchQuery(null);
        clearHomeSearchQuery();
        setSearchFormResetKey((key) => key + 1);
    }, []);

    useEffect(() => {
        if (!searchQuery) return;
        if (skipNextScrollRef.current) {
            skipNextScrollRef.current = false;
            return;
        }
        searchResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [searchQuery]);

    return (
        <div className={`landing-page ${className}`.trim()}>
            {showBookmarkRedirect && <BookmarkLoginRedirect />}
            <HeroSection
                onSearch={handleSearch}
                formResetKey={searchFormResetKey}
                title={heroTitle}
                subtitle={heroSubtitle}
                initialKeyword={searchQuery?.keyword || ''}
                initialCity={searchQuery?.city || ''}
                initialWard={searchQuery?.ward || ''}
                initialJobType={searchQuery?.jobType || ''}
                initialSalaryMin={searchQuery?.salaryMin ?? null}
                initialSalaryMax={searchQuery?.salaryMax ?? null}
                initialSkillIds={searchQuery?.skillIds || []}
                initialSchedules={searchQuery?.schedules || []}
                initialNearMe={Boolean(searchQuery?.nearMe)}
                initialLatitude={searchQuery?.latitude ?? null}
                initialLongitude={searchQuery?.longitude ?? null}
            />

            {searchQuery && (
                <div ref={searchResultsRef}>
                    <SearchResultsSection query={searchQuery} onClear={handleClearSearch} />
                </div>
            )}

            <UrgentJobsSection />

            {showCandidateSections && <AiRecommendationsSection />}

            <FeaturedJobsSection size={featuredSize} compact={featuredCompact} />

            <TopEmployersSection compact={featuredCompact} />
            {showWhySection && <WhyJobLinkSection />}
        </div>
    );
};

export default JobDiscoveryHome;
