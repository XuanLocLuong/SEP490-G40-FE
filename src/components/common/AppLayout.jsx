import { Outlet } from 'react-router-dom';
import '../../assets/styles/AppLayoutStyle.css';

// Shell dùng chung cho MỌI layout theo role — mỗi role chỉ khác nhau ở việc
// có/không truyền header, sidebar, footer:
//   - Guest / Candidate / Recruiter: header + footer
//   - Internal (Admin/PM/MCT):       header + sidebar
//
// Lưu ý cấu trúc: sidebar nằm NGOÀI header — sidebar cao full từ trên xuống,
// header chỉ nằm phía trên phần content bên phải (không đè/tràn lên sidebar).
const AppLayout = ({ header = null, sidebar = null, footer = null }) => {
    return (
        <div className="app-shell">
            <div className="app-shell__body">
                {sidebar}
                <div className="app-shell__main-col">
                    {header}
                    <main className="app-shell__content">
                        <Outlet />
                    </main>
                </div>
            </div>
            {footer}
        </div>
    );
};

export default AppLayout;