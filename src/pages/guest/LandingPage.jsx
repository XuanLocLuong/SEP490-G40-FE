import { useState, useRef, useCallback, useEffect } from 'react';
import HeroSection from '../../components/landing/HeroSection.jsx';
import SearchResultsSection from '../../components/landing/SearchResultsSection.jsx';
import FeaturedJobsSection from '../../components/landing/FeaturedJobsSection.jsx';
import TopEmployersSection from '../../components/landing/TopEmployersSection.jsx';
import WhyJobLinkSection from '../../components/landing/WhyJobLinkSection.jsx';
import BookmarkLoginRedirect from '../../components/job/BookmarkLoginRedirect.jsx';
import { useAuth } from '../../contexts/authContext.js';
import { USER_ROLES } from '../../utils/Constants.jsx';
import { applyCandidateScheduleAccess, isSearchQuery } from '../../utils/jobQuery.js';
import '../../assets/styles/LandingPageStyle.css';

const LandingPage = () => {
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
        <div className="landing-page">
            <BookmarkLoginRedirect />
            <HeroSection onSearch={handleSearch} formResetKey={searchFormResetKey} />

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

            <FeaturedJobsSection />
            <TopEmployersSection />
            <WhyJobLinkSection />
        </div>
    );
};

export default LandingPage;
