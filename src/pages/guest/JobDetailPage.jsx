import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../routes/path.js';

const JobDetailPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const handleBack = () => {
        if (location.state?.from) {
            navigate(location.state.from, { replace: true });
            return;
        }
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }
        navigate(ROUTES.LANDING);
    };

    return (
        <div style={{ padding: '32px', maxWidth: 720, margin: '0 auto' }}>
            <button
                type="button"
                onClick={handleBack}
                style={{
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                }}
            >
                ← Quay lại
            </button>
            <h1 style={{ marginTop: 24 }}>Chi tiết việc làm</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
                Job #{jobId} — Trang chi tiết sẽ do teammate implement.
            </p>
        </div>
    );
};

export default JobDetailPage;
