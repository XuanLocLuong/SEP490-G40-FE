import JobSearchForm from '../common/JobSearchForm.jsx';

const JobListSearch = ({
    initialKeyword = '',
    initialCity = '',
    initialWard = '',
    onSearch,
    loading,
}) => (
    <JobSearchForm
        onSearch={onSearch}
        loading={loading}
        initialKeyword={initialKeyword}
        initialCity={initialCity}
        initialWard={initialWard}
        nearMeLabel="Tìm việc gần tôi"
    />
);

export default JobListSearch;
