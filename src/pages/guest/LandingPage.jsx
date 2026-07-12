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
    const searchResultsRef = useRef(null);

    const handleSearch = useCallback(({ keyword, city, nearMe }) => {
        // Near-me: UI only — teammate sẽ implement sau.
        if (nearMe) {
            return;
        }

        if (keyword || city) {
            setSearchQuery({ keyword, city });
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
            <HeroSection onSearch={handleSearch} />

            {searchQuery && (
                <div ref={searchResultsRef}>
                    <SearchResultsSection
                        query={searchQuery}
                        onClear={() => setSearchQuery(null)}
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
