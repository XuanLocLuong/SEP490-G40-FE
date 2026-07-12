// Skeleton loading khi GET Profile (plan yêu cầu Skeleton, không Spinner).
const ProfileSkeleton = () => {
    return (
        <div className="cp-page" aria-busy="true" aria-live="polite">
            <div className="cp-card cp-skeleton__header">
                <div className="cp-skeleton cp-skeleton--avatar" />
                <div className="cp-skeleton__lines">
                    <div className="cp-skeleton cp-skeleton--line cp-skeleton--w40" />
                    <div className="cp-skeleton cp-skeleton--line cp-skeleton--w80" />
                    <div className="cp-skeleton cp-skeleton--line cp-skeleton--w60" />
                </div>
            </div>

            <div className="cp-grid">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="cp-card">
                        <div className="cp-skeleton cp-skeleton--line cp-skeleton--w40" />
                        <div className="cp-skeleton cp-skeleton--line cp-skeleton--w80" />
                        <div className="cp-skeleton cp-skeleton--line cp-skeleton--w60" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfileSkeleton;
