import { useEffect, useCallback } from 'react';
import { XIcon } from './icons.jsx';
import '../../assets/styles/GalleryLightboxStyle.css';

/**
 * Fullscreen gallery viewer: large image, prev/next, close (X).
 * @param {{ fileUrl: string, id?: number|string }[]} images
 * @param {number|null} index — null = closed
 */
const GalleryLightbox = ({ images = [], index, onClose, onIndexChange }) => {
    const open = index != null && index >= 0 && images.length > 0;
    const current = open ? images[index] : null;
    const hasMultiple = images.length > 1;

    const goPrev = useCallback(() => {
        if (!hasMultiple || index == null) return;
        onIndexChange((index - 1 + images.length) % images.length);
    }, [hasMultiple, index, images.length, onIndexChange]);

    const goNext = useCallback(() => {
        if (!hasMultiple || index == null) return;
        onIndexChange((index + 1) % images.length);
    }, [hasMultiple, index, images.length, onIndexChange]);

    useEffect(() => {
        if (!open) return undefined;

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goPrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                goNext();
            }
        };

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose, goPrev, goNext]);

    if (!open || !current?.fileUrl) return null;

    return (
        <div
            className="gallery-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Xem ảnh không gian làm việc"
            onClick={onClose}
        >
            <button
                type="button"
                className="gallery-lightbox__close"
                onClick={onClose}
                aria-label="Đóng"
            >
                <XIcon width={22} height={22} />
            </button>

            {hasMultiple && (
                <button
                    type="button"
                    className="gallery-lightbox__nav gallery-lightbox__nav--prev"
                    onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                    }}
                    aria-label="Ảnh trước"
                >
                    ‹
                </button>
            )}

            <div
                className="gallery-lightbox__stage"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={current.fileUrl}
                    alt=""
                    className="gallery-lightbox__image"
                />
                {hasMultiple && (
                    <p className="gallery-lightbox__counter" aria-live="polite">
                        {index + 1} / {images.length}
                    </p>
                )}
            </div>

            {hasMultiple && (
                <button
                    type="button"
                    className="gallery-lightbox__nav gallery-lightbox__nav--next"
                    onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                    }}
                    aria-label="Ảnh sau"
                >
                    ›
                </button>
            )}
        </div>
    );
};

export default GalleryLightbox;
