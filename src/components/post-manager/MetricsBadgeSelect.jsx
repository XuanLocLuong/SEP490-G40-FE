import { useEffect, useId, useRef, useState } from 'react';

/**
 * Select tùy chỉnh hiển thị badge màu giống cột bảng.
 * Native <option> không style màu ổn định nên dùng menu custom.
 */
const MetricsBadgeSelect = ({
    value = '',
    options = [],
    onChange,
    getTone,
    ariaLabel,
    placeholderTone = 'muted',
}) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const listId = useId();

    const selected = options.find((opt) => String(opt.value) === String(value)) || options[0];
    const selectedTone = selected?.value
        ? getTone?.(selected.value) || 'muted'
        : placeholderTone;

    useEffect(() => {
        if (!open) return undefined;

        const onDocClick = (event) => {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        const onKey = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div className="jpm-badge-select" ref={rootRef}>
            <button
                type="button"
                className="jpm-badge-select__trigger"
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className={`jpm-badge jpm-badge--${selectedTone}`}>
                    {selected?.label || 'Tất cả'}
                </span>
                <span className="jpm-badge-select__chevron" aria-hidden="true">
                    ▾
                </span>
            </button>

            {open ? (
                <ul id={listId} className="jpm-badge-select__menu" role="listbox">
                    {options.map((opt) => {
                        const tone = opt.value ? getTone?.(opt.value) || 'muted' : placeholderTone;
                        const active = String(opt.value) === String(value);
                        return (
                            <li key={opt.value || 'all'} role="option" aria-selected={active}>
                                <button
                                    type="button"
                                    className={
                                        'jpm-badge-select__option' +
                                        (active ? ' jpm-badge-select__option--active' : '')
                                    }
                                    onClick={() => {
                                        onChange?.(opt.value);
                                        setOpen(false);
                                    }}
                                >
                                    <span className={`jpm-badge jpm-badge--${tone}`}>{opt.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </div>
    );
};

export default MetricsBadgeSelect;
