// Icon set tối giản, tự vẽ bằng SVG cơ bản (stroke, không fill) — tránh phải
// thêm dependency ngoài (lucide-react...) khi chưa chắc project đã cài.
// Dùng chung cho mọi Sidebar/Header của các Layout.
const base = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
};

export const HomeIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4h4v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
);

export const SparklesIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
);

export const FileTextIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
        <path d="M9 12h6M9 16h6M9 8h3" />
    </svg>
);

export const MailIcon = (props) => (
    <svg {...base} {...props}>
        <rect x="3" y="5" width="18" height="14" rx="1.5" />
        <path d="m4 6.5 8 6 8-6" />
    </svg>
);

export const ChatIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
    </svg>
);

export const BellIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
);

export const SettingsIcon = (props) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.6-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" />
    </svg>
);

export const ClockIcon = (props) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
    </svg>
);

export const GridIcon = (props) => (
    <svg {...base} {...props}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </svg>
);

export const PlusSquareIcon = (props) => (
    <svg {...base} {...props}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
        <path d="M12 8v8M8 12h8" />
    </svg>
);

export const ListIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <circle cx="4" cy="6" r="1" />
        <circle cx="4" cy="12" r="1" />
        <circle cx="4" cy="18" r="1" />
    </svg>
);

export const UsersIcon = (props) => (
    <svg {...base} {...props}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <circle cx="17.5" cy="9.5" r="2.3" />
        <path d="M15.7 14c2.4.4 4.3 2.3 4.3 5.4" />
    </svg>
);

export const ChartIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M4 20V10M11 20V4M18 20v-7" />
        <path d="M2 20h20" />
    </svg>
);

export const StarIcon = (props) => (
    <svg {...base} {...props}>
        <path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6Z" />
    </svg>
);

export const BuildingIcon = (props) => (
    <svg {...base} {...props}>
        <rect x="5" y="3" width="14" height="18" rx="1" />
        <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" />
    </svg>
);

export const ClipboardIcon = (props) => (
    <svg {...base} {...props}>
        <rect x="6" y="4" width="12" height="17" rx="1.5" />
        <rect x="9" y="2.5" width="6" height="3" rx="1" />
    </svg>
);

export const ShieldIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M12 3 5 6v6c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6Z" />
    </svg>
);

export const FlagIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M5 21V4" />
        <path d="M5 4h13l-3 4 3 4H5" />
    </svg>
);

export const LockIcon = (props) => (
    <svg {...base} {...props}>
        <rect x="5" y="11" width="14" height="9" rx="1.5" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
);

export const TrendingIcon = (props) => (
    <svg {...base} {...props}>
        <path d="m3 17 6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
    </svg>
);

export const LogOutIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" />
        <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
);

export const EyeIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export const EyeOffIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M3 3l18 18" />
        <path d="M10.6 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a16.7 16.7 0 0 1-3.7 4.6M6.7 6.7C4 8.4 2 12 2 12s3.5 7 10 7c1.3 0 2.5-.2 3.6-.7" />
        <path d="M9.5 10a3 3 0 0 0 4.2 4.2" />
    </svg>
);

export const GraduationCapIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M2 8.5 12 4l10 4.5-10 4.5-10-4.5Z" />
        <path d="M6 10.5V15c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5" />
        <path d="M21 9v5.5" />
    </svg>
);

export const CheckCircleIcon = (props) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12.5 2.5 2.5L16 9.5" />
    </svg>
);

export const AlertIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M12 3 2 20h20Z" />
        <path d="M12 10v4M12 17h.01" />
    </svg>
);

export const SearchIcon = (props) => (
    <svg {...base} {...props}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16.5 16.5 4 4" />
    </svg>
);

export const MapPinIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
    </svg>
);

export const BookmarkIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z" />
    </svg>
);

export const ChevronDownIcon = (props) => (
    <svg {...base} {...props}>
        <path d="m6 9 6 6 6-6" />
    </svg>
);

export const LayersIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M12 3 3 8l9 5 9-5-9-5Z" />
        <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
    </svg>
);
