import { useEffect, useId, useMemo, useRef, useState } from 'react';

const normalizeSearchText = (text) =>
    text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

/**
 * Combobox tìm kiếm trong danh sách địa chính (guest job search).
 * Chỉ chọn item có trong options — không nhập tự do.
 */
const LocationCombobox = ({
    options = [],
    value = '',
    onChange,
    placeholder = '',
    disabled = false,
    ariaLabel = '',
    className = '',
    maxResults = 50,
}) => {
    const listId = useId();
    const inputRef = useRef(null);
    const blurTimer = useRef(null);

    const selected = useMemo(
        () => options.find((item) => item.id === value) ?? null,
        [options, value]
    );

    const [inputValue, setInputValue] = useState(selected?.ten ?? '');
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    useEffect(() => {
        if (!open) {
            setInputValue(selected?.ten ?? '');
        }
    }, [selected, open]);

    const suggestions = useMemo(() => {
        const query = inputValue.trim();
        if (!query) {
            return options;
        }
        const normalizedQuery = normalizeSearchText(query);
        return options
            .filter((item) => normalizeSearchText(item.ten).includes(normalizedQuery))
            .slice(0, maxResults);
    }, [options, inputValue, maxResults]);

    const selectOption = (option) => {
        if (!option) {
            onChange('');
            setInputValue('');
        } else {
            onChange(option.id);
            setInputValue(option.ten);
        }
        setOpen(false);
        setActiveIndex(-1);
    };

    const handleFocus = () => {
        clearTimeout(blurTimer.current);
        if (disabled) return;
        setOpen(true);
        setInputValue(selected?.ten ?? '');
    };

    const handleChange = (e) => {
        const next = e.target.value;
        setInputValue(next);
        setOpen(true);
        setActiveIndex(-1);
        if (!next.trim()) {
            onChange('');
        }
    };

    const handleBlur = () => {
        blurTimer.current = setTimeout(() => {
            setOpen(false);
            setActiveIndex(-1);

            const trimmed = inputValue.trim();
            if (!trimmed) {
                onChange('');
                setInputValue('');
                return;
            }

            const exact = options.find((item) => item.ten === trimmed);
            if (exact) {
                onChange(exact.id);
                setInputValue(exact.ten);
                return;
            }

            setInputValue(selected?.ten ?? '');
        }, 150);
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!open) setOpen(true);
            setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
            return;
        }

        if (e.key === 'Enter' && open && suggestions.length > 0) {
            e.preventDefault();
            const pick = activeIndex >= 0 ? suggestions[activeIndex] : suggestions[0];
            selectOption(pick);
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
            setInputValue(selected?.ten ?? '');
            setActiveIndex(-1);
        }
    };

    const showList = open && !disabled && suggestions.length > 0;

    const focusInput = () => {
        if (disabled) return;
        inputRef.current?.focus();
    };

    return (
        <div
            className={`location-combobox ${className}`.trim()}
            onClick={(e) => {
                if (e.target.closest('.location-combobox__clear, .location-combobox__option')) {
                    return;
                }
                focusInput();
            }}
        >
            <input
                ref={inputRef}
                type="text"
                className="location-combobox__input"
                role="combobox"
                aria-expanded={showList}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-label={ariaLabel}
                placeholder={placeholder}
                value={inputValue}
                disabled={disabled}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                autoComplete="off"
            />

            {value && !disabled && (
                <button
                    type="button"
                    className="location-combobox__clear"
                    aria-label="Xóa lựa chọn"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectOption(null)}
                >
                    ×
                </button>
            )}

            {showList && (
                <ul
                    id={listId}
                    role="listbox"
                    className="location-combobox__list"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        clearTimeout(blurTimer.current);
                    }}
                >
                    {suggestions.map((item, index) => (
                        <li key={item.id} role="presentation">
                            <button
                                type="button"
                                role="option"
                                aria-selected={value === item.id}
                                className={
                                    'location-combobox__option' +
                                    (index === activeIndex ? ' location-combobox__option--active' : '') +
                                    (value === item.id ? ' location-combobox__option--selected' : '')
                                }
                                onClick={() => selectOption(item)}
                            >
                                {item.ten}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LocationCombobox;
