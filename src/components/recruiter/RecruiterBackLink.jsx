import { Link } from 'react-router-dom';

/** Nút quay lại pill — nằm đầu trang, scroll xuống thì cuộn theo và biến mất. */
const RecruiterBackLink = ({ to, label, state }) => (
    <Link to={to} state={state} className="recruiter-back-overview">
        ← {label}
    </Link>
);

export default RecruiterBackLink;
