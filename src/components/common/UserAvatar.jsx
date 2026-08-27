import { useState } from 'react';
import { getInitials, isValidAvatarUrl } from '../../utils/profileFormat.js';
import '../../assets/styles/UserAvatarStyle.css';

// Hiện ảnh đại diện: có URL thì dùng ảnh thật, không có/lỗi/mặc định thì hiển thị chữ cái đại diện
const UserAvatar = ({ src, name = '', size = 36, className = '' }) => {
    const [imgError, setImgError] = useState(false);
    const [prevSrc, setPrevSrc] = useState(src);

    if (prevSrc !== src) {
        setPrevSrc(src);
        setImgError(false);
    }

    const hasImage = isValidAvatarUrl(src) && !imgError;
    const initial = getInitials(name);
    const fontSize = Math.max(12, Math.round(size * 0.42));

    if (hasImage) {
        return (
            <img
                src={src}
                alt={name ? `Avatar của ${name}` : 'Ảnh đại diện'}
                className={`user-avatar ${className}`}
                style={{ width: size, height: size }}
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <span
            className={`user-avatar user-avatar--placeholder ${className}`}
            style={{ width: size, height: size, fontSize }}
            aria-hidden="true"
        >
            {initial}
        </span>
    );
};

export default UserAvatar;
