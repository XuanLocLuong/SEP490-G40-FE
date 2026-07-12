// Icon bổ sung riêng cho feature Candidate Profile (không đụng common/icons.jsx).
// Cùng style stroke với icon set chung của project.
const base = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
};

export const PencilIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17.2V20Z" />
        <path d="m13.5 6.5 4 4" />
    </svg>
);

export const PlusIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M12 5v14M5 12h14" />
    </svg>
);

export const CloseIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M6 6l12 12M18 6 6 18" />
    </svg>
);

export const TrashIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
        <path d="M10 11v6M14 11v6" />
    </svg>
);

export const CameraIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
        <circle cx="12" cy="13" r="3.2" />
    </svg>
);

export const MapPinIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
    </svg>
);

export const WalletIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M4 7a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v2" />
        <rect x="3" y="7" width="18" height="12" rx="2" />
        <path d="M16 12.5h2.5" />
    </svg>
);

export const CalendarIcon = (props) => (
    <svg {...base} {...props}>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M4 9h16M9 3v4M15 3v4" />
    </svg>
);

export const UserBadgeIcon = (props) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="9" r="3" />
        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
);

export const HomeAddressIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M4 11.5 12 5l8 6.5" />
        <path d="M6 10.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.5" />
    </svg>
);

export const GenderIcon = (props) => (
    <svg {...base} {...props}>
        <circle cx="10" cy="14" r="5" />
        <path d="m14 10 5-5M15 5h4v4" />
    </svg>
);

export const BriefcaseIcon = (props) => (
    <svg {...base} {...props}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </svg>
);

export const TargetIcon = (props) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.5" />
    </svg>
);

export const StarIcon = (props) => (
    <svg {...base} {...props} fill="currentColor" stroke="none">
        <path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6Z" />
    </svg>
);

export const UploadCloudIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M7 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 9.5a3.5 3.5 0 0 1 .5 8.5" />
        <path d="M12 12v7M9 15l3-3 3 3" />
    </svg>
);
