import JobSearchForm from '../common/JobSearchForm.jsx';

const JobListSearch = ({
    initialKeyword = '',
    initialCity = '',
    initialWard = '',
    initialJobType = '',
    initialSalaryMin = null,
    initialSalaryMax = null,
    initialSkillIds = [],
    initialSchedules = [],
    initialNearMe = false,
    initialLatitude = null,
    initialLongitude = null,
    onSearch,
    loading,
}) => (
    <JobSearchForm
        onSearch={onSearch}
        loading={loading}
        initialKeyword={initialKeyword}
        initialCity={initialCity}
        initialWard={initialWard}
        initialJobType={initialJobType}
        initialSalaryMin={initialSalaryMin}
        initialSalaryMax={initialSalaryMax}
        initialSkillIds={initialSkillIds}
        initialSchedules={initialSchedules}
        initialNearMe={initialNearMe}
        initialLatitude={initialLatitude}
        initialLongitude={initialLongitude}
        nearMeLabel="Tìm việc gần tôi"
    />
);

export default JobListSearch;
