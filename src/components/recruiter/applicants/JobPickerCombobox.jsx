import { useEffect, useId, useMemo, useRef, useState } from 'react';

const normalizeSearchText = (text) =>
    String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

/**
 * Combobox chọn 1 tin OPEN từ list đã load.
 * Gõ chỉ lọc list — không nhận title tự do.
 */
const JobPickerCombobox = ({
    jobs = [],
    value = '',
    onChange,
    id = '',
    placeholder = 'Tìm tin đang tuyển…',
    disabled = false,
}) => {
    const listId = useId();
    const inputRef = useRef(null);
    const blurTimer = useRef(null);

    const selected = useMemo(
        () => jobs.find((job) => String(job.id) === String(value)) ?? null,
        [jobs, value]
    );

    const [inputValue, setInputValue] = useState(selected?.title ?? '');
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    useEffect(() => {
        if (!open) {
            setInputValue(selected?.title ?? '');
        }
    }, [selected, open]);

    const suggestions = useMemo(() => {
        const query = inputValue.trim();
        if (!query) return jobs;
        const normalizedQuery = normalizeSearchText(query);
        return jobs.filter((job) => normalizeSearchText(job.title).includes(normalizedQuery));
    }, [jobs, inputValue]);

    const commitSelection = (job) => {
        if (!job) return;
        onChange(job.id);
        setInputValue(job.title);
        setOpen(false);
        setActiveIndex(-1);
    };

    const revertToSelected = () => {
        setOpen(false);
        setActiveIndex(-1);
        setInputValue(selected?.title ?? '');
    };

    const handleFocus = () => {
        clearTimeout(blurTimer.current);
        if (disabled) return;
        setOpen(true);
        setActiveIndex(-1);
        requestAnimationFrame(() => inputRef.current?.select());
    };

    const handleChange = (e) => {
        setInputValue(e.target.value);
        setOpen(true);
        setActiveIndex(-1);
    };

    const handleBlur = () => {
        blurTimer.current = setTimeout(() => {
            revertToSelected();
        }, 150);
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!open) setOpen(true);
            setActiveIndex((prev) => {
                if (suggestions.length === 0) return -1;
                return Math.min(prev + 1, suggestions.length - 1);
            });
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (!open || suggestions.length === 0) return;
            const pick = activeIndex >= 0 ? suggestions[activeIndex] : suggestions[0];
            commitSelection(pick);
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            revertToSelected();
        }
    };

    const showList = open && !disabled;

    return (
        <div className="job-picker-combobox">
            <input
                ref={inputRef}
                id={id || undefined}
                type="text"
                className="job-picker-combobox__input"
                role="combobox"
                aria-expanded={showList}
                aria-controls={listId}
                aria-autocomplete="list"
                placeholder={placeholder}
                value={inputValue}
                disabled={disabled}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                autoComplete="off"
            />

            {showList && (
                <ul
                    id={listId}
                    role="listbox"
                    className="job-picker-combobox__list"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        clearTimeout(blurTimer.current);
                    }}
                >
                    {suggestions.length === 0 ? (
                        <li className="job-picker-combobox__empty" role="presentation">
                            Không tìm thấy tin phù hợp
                        </li>
                    ) : (
                        suggestions.map((job, index) => (
                            <li key={job.id} role="presentation">
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={String(value) === String(job.id)}
                                    className={
                                        'job-picker-combobox__option' +
                                        (index === activeIndex
                                            ? ' job-picker-combobox__option--active'
                                            : '') +
                                        (String(value) === String(job.id)
                                            ? ' job-picker-combobox__option--selected'
                                            : '')
                                    }
                                    onClick={() => commitSelection(job)}
                                >
                                    {job.title}
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

export default JobPickerCombobox;
