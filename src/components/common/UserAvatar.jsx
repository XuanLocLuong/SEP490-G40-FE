import { useState } from 'react';
import defaultAvatar from '../../assets/images/default-avatar.png';
import '../../assets/styles/UserAvatarStyle.css';

// Hien anh dai dien: co URL thi dung anh that, khong co thi dung anh mac dinh (silhouette)
const UserAvatar = ({ src, name = '', size = 36, className = '' }) => {
    const [imgError, setImgError] = useState(false);
    const avatarSrc = src && !imgError ? src : defaultAvatar;

    return (
        <img
            src={avatarSrc}
            alt={name ? `Avatar của ${name}` : 'Avatar mặc định'}
            className={`user-avatar ${className}`}
            style={{ width: size, height: size }}
            onError={() => setImgError(true)}
        />
    );
};

export default UserAvatar;
