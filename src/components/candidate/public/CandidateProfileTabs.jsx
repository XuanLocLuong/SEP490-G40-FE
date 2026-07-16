import { CANDIDATE_PROFILE_TABS } from '../../../utils/candidatePublicProfileConstants.js';
import CandidatePersonalTab from './CandidatePersonalTab.jsx';
import CandidateWorkHistoryTab from './CandidateWorkHistoryTab.jsx';
import CandidateReviewsTab from './CandidateReviewsTab.jsx';

const CandidateProfileTabs = ({ profile, activeTab, onTabChange }) => {
    const tabs = [
        { id: CANDIDATE_PROFILE_TABS.PERSONAL, label: 'Thông tin cá nhân' },
        { id: CANDIDATE_PROFILE_TABS.WORK, label: 'Lịch sử làm việc' },
        { id: CANDIDATE_PROFILE_TABS.REVIEWS, label: 'Đánh giá nhận được' },
    ];

    return (
        <div className="cpp-tabs">
            <div className="cpp-tabs__bar" role="tablist">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={
                            'cpp-tabs__btn' + (activeTab === tab.id ? ' cpp-tabs__btn--active' : '')
                        }
                        onClick={() => onTabChange(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div role="tabpanel">
                {activeTab === CANDIDATE_PROFILE_TABS.PERSONAL && (
                    <CandidatePersonalTab profile={profile} />
                )}
                {activeTab === CANDIDATE_PROFILE_TABS.WORK && (
                    <CandidateWorkHistoryTab experiences={profile.experiences} />
                )}
                {activeTab === CANDIDATE_PROFILE_TABS.REVIEWS && <CandidateReviewsTab />}
            </div>
        </div>
    );
};

export default CandidateProfileTabs;
