// Small line icons used across the storefront and the admin vault.
// They inherit `currentColor`, so they follow the surrounding text colour.

const base = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
};

export const IconHeart = (props) => (
    <svg {...base} {...props}>
        <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z" />
    </svg>
);

export const IconBag = (props) => (
    <svg {...base} {...props}>
        <path d="M5 8h14l-1 12H6L5 8z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
);

export const IconUser = (props) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
);

export const IconArrow = (props) => (
    <svg {...base} {...props}>
        <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
);

export const IconGrid = (props) => (
    <svg {...base} {...props}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
);

export const IconWatch = (props) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="12" r="6" />
        <path d="M12 9v3l2 1.5M9 6.5 9.6 2h4.8l.6 4.5M9 17.5l.6 4.5h4.8l.6-4.5" />
    </svg>
);

export const IconReceipt = (props) => (
    <svg {...base} {...props}>
        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
);

export const IconScale = (props) => (
    <svg {...base} {...props}>
        <path d="M12 3v18M7 21h10M5 7h14" />
        <path d="M5 7 2 13a3 3 0 0 0 6 0L5 7zM19 7l-3 6a3 3 0 0 0 6 0l-3-6z" />
    </svg>
);

export const IconTool = (props) => (
    <svg {...base} {...props}>
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z" />
    </svg>
);

export const IconChat = (props) => (
    <svg {...base} {...props}>
        <path d="M4 5h16v11H8l-4 4V5z" />
        <path d="M8 9h8M8 12h5" />
    </svg>
);

export const IconStore = (props) => (
    <svg {...base} {...props}>
        <path d="M4 9h16l-1-5H5L4 9z" />
        <path d="M5 9v11h14V9M9 20v-6h6v6" />
    </svg>
);

export const IconShield = (props) => (
    <svg {...base} {...props}>
        <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

export const IconTruck = (props) => (
    <svg {...base} {...props}>
        <path d="M2 6h12v10H2zM14 10h4l3 3v3h-7" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
    </svg>
);

export const IconSparkle = (props) => (
    <svg {...base} {...props}>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
    </svg>
);

export const IconTrendUp = (props) => (
    <svg {...base} {...props}>
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
    </svg>
);

export const IconWallet = (props) => (
    <svg {...base} {...props}>
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M3 10h18M16 15h2" />
        <path d="M6 6V5a1 1 0 0 1 1-1h10" />
    </svg>
);

export const IconBox = (props) => (
    <svg {...base} {...props}>
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 7v10l9 4 9-4V7M12 11v10" />
    </svg>
);

export const IconMenu = (props) => (
    <svg {...base} {...props}>
        <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
);

export const IconLogout = (props) => (
    <svg {...base} {...props}>
        <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
    </svg>
);

export const IconStar = (props) => (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
        <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z" />
    </svg>
);
