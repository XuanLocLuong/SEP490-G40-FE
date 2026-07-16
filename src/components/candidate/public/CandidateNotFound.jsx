import { Link } from 'react-router-dom';
import { UserCircleIcon } from '../../common/icons.jsx';
import { ROUTES, getHomePathByRole } from '../../../routes/path.js';
import { useAuth } from '../../../contexts/authContext.js';

const CandidateNotFound = () => {
    const { auth } = useAuth();
    const backPath = auth ? getHomePathByRole(auth.role) : ROUTES.LANDING;

    return (
        <div className="cpp-page cpp-not-found">
            <div className="cpp-not-found__card">
                <span className="cpp-not-found__icon" aria-hidden="true">
                    <UserCircleIcon width={40} height={40} />
                </span>
                <h1 className="cpp-not-found__title">Không tìm thấy ứng viên</h1>
                <p className="cpp-not-found__text">
                    Hồ sơ ứng viên không tồn tại hoặc đã ngừng hiển thị.
                </p>
                <Link to={backPath} className="btn btn--primary">
                    Quay lại
                </Link>
            </div>
        </div>
    );
};

export default CandidateNotFound;
