import { useRef, useState } from 'react';
import { CameraIcon } from './profileIcons.jsx';
import { getInitials } from '../../utils/profileFormat.js';

const MAX_AVATAR_MB = 5;
// Backend (CandidateProfileService.ALLOWED_IMAGE_MIME_TYPES) chỉ nhận jpeg/jpg/png.
const ACCEPTED = ['image/jpeg', 'image/png'];

// Avatar + nút edit (icon camera). Validate type/size trước khi upload.
const AvatarUploader = ({ name, avatarUrl, onUpload, disabled }) => {
    const inputRef = useRef(null);
    const [error, setError] = useState('');

    const handlePick = () => inputRef.current?.click();

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (!ACCEPTED.includes(file.type)) {
            setError('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.');
            return;
        }
        if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
            setError(`Ảnh phải nhỏ hơn ${MAX_AVATAR_MB}MB.`);
            return;
        }
        setError('');
        onUpload?.(file);
    };

    return (
        <div className="cp-avatar">
            <div className="cp-avatar__frame">
                {avatarUrl ? (
                    <img className="cp-avatar__img" src={avatarUrl} alt={name || 'Avatar'} />
                ) : (
                    <span className="cp-avatar__initials">{getInitials(name)}</span>
                )}
                <button
                    type="button"
                    className="cp-avatar__edit"
                    onClick={handlePick}
                    disabled={disabled}
                    aria-label="Đổi ảnh đại diện"
                >
                    <CameraIcon />
                </button>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED.join(',')}
                className="cp-avatar__input"
                onChange={handleChange}
                hidden
            />
            {error && <p className="cp-avatar__error">{error}</p>}
        </div>
    );
};

export default AvatarUploader;
