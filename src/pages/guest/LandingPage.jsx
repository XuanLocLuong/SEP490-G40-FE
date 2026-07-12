import { useState, useRef, useCallback, useEffect } from 'react';
import HeroSection from '../../components/landing/HeroSection.jsx';
import SearchResultsSection from '../../components/landing/SearchResultsSection.jsx';
import FeaturedJobsSection from '../../components/landing/FeaturedJobsSection.jsx';
import TopEmployersSection from '../../components/landing/TopEmployersSection.jsx';
import WhyJobLinkSection from '../../components/landing/WhyJobLinkSection.jsx';
import BookmarkLoginRedirect from '../../components/job/BookmarkLoginRedirect.jsx';
import '../../assets/styles/LandingPageStyle.css';

const LandingPage = () => {
    const [searchQuery, setSearchQuery] = useState(null);
    const [searchFormResetKey, setSearchFormResetKey] = useState(0);
    const searchResultsRef = useRef(null);

    const handleSearch = useCallback(({ keyword, city, ward, nearMe }) => {
        // Near-me: UI only — teammate sẽ implement sau.
        if (nearMe) {
            return;
        }

        if (keyword || city || ward) {
            setSearchQuery({ keyword, city, ward });
        } else {
            setSearchQuery(null);
        }
    }, []);

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
