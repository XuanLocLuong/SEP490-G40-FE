import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/path.js';

const ManualCheckDashboard = () => {
    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 8px 32px' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800 }}>Manual Check Team</h1>
            <p style={{ margin: '0 0 16px', color: 'var(--color-text-muted)', fontSize: 14 }}>
                Duyệt hồ sơ xác minh CCCD / GPKD được AI chuyển sang chờ kiểm tra thủ công.
            </p>
            <Link
                to={ROUTES.MANUAL_CHECK_VERIFICATION}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: 40,
                    padding: '0 14px',
                    borderRadius: 8,
                    background: 'var(--color-primary, #2563eb)',
                    color: '#fff',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: 14,
                }}
            >
                Mở hàng chờ duyệt xác minh
            </Link>
        </div>
    );
};

export default ManualCheckDashboard;
