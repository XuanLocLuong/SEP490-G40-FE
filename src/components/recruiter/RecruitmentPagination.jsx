import { useMemo } from 'react';
import { buildRecruitmentPageItems } from '../../utils/recruitmentPagination.js';
import '../../assets/styles/RecruitmentPaginationStyle.css';

const RecruitmentPagination = ({
    page,
    totalPages,
    onPageChange,
    loading = false,
    ariaLabel = 'Phân trang',
}) => {
    const pageItems = useMemo(
        () => buildRecruitmentPageItems(page, totalPages),
        [page, totalPages]
    );

    if (totalPages <= 1) return null;

    const canGoPrev = page > 0;
    const canGoNext = page + 1 < totalPages;

    const handleChange = (nextPage) => {
        if (loading) return;
        if (nextPage < 0 || nextPage >= totalPages || nextPage === page) return;
        onPageChange(nextPage);
    };

    return (
        <nav className="recruitment-pagination" aria-label={ariaLabel}>
            <button
                type="button"
                className="recruitment-pagination__btn recruitment-pagination__btn--nav"
                disabled={!canGoPrev || loading}
                onClick={() => handleChange(page - 1)}
                aria-label="Trang trước"
            >
                ‹
            </button>
            {pageItems.map((item, index) =>
                item === 'ellipsis' ? (
                    <span
                        key={`ellipsis-${index}`}
                        className="recruitment-pagination__ellipsis"
                        aria-hidden="true"
                    >
                        …
                    </span>
                ) : (
                    <button
                        key={item}
                        type="button"
                        className={`recruitment-pagination__btn${
                            item === page ? ' is-active' : ''
                        }`}
                        disabled={loading}
                        aria-current={item === page ? 'page' : undefined}
                        aria-label={`Trang ${item + 1}`}
                        onClick={() => handleChange(item)}
                    >
                        {item + 1}
                    </button>
                )
            )}
            <button
                type="button"
                className="recruitment-pagination__btn recruitment-pagination__btn--nav"
                disabled={!canGoNext || loading}
                onClick={() => handleChange(page + 1)}
                aria-label="Trang sau"
            >
                ›
            </button>
        </nav>
    );
};

export default RecruitmentPagination;
