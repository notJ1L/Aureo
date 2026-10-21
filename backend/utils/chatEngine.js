const Product = require("../models/product");

// FR 7.1 / FR 7.2: the assistant is rule based. The budget, style, brand and
// movement preferences are extracted from the message with regular
// expressions and matched against the products that are in stock.

const BRANDS = [
    "Rolex",
    "Patek Philippe",
    "Audemars Piguet",
    "Omega",
    "Cartier",
    "Grand Seiko",
    "Tudor",
    "IWC",
    "Seiko",
    "Casio",
    "TAG Heuer",
    "Breitling"
];

const STYLES = {
    dress: ["dress", "formal", "elegant", "black tie", "evening"],
    diver: ["diver", "diving", "underwater", "sport", "sports", "active"],
    chronograph: ["chronograph", "chrono", "stopwatch", "racing"],
    minimalist: ["minimal", "minimalist", "clean", "simple", "slim"]
};

const BUDGET_PATTERNS = [
    /(?:budget|around|about|approximately)\s*(?:of\s*)?(?:php|₱|\$)?\s*([\d,]{3,})/i,
    /(?:under|below|less than|max(?:imum)?|up to|no more than)\s*(?:php|₱|\$)?\s*([\d,]{3,})/i,
    /(?:php|₱|\$)\s*([\d,]{3,})/i,
    /([\d,]{4,})\s*(?:php|₱|\$|pesos?)/i
];

const MOVEMENTS = ["automatic", "quartz", "manual"];

const parseNumber = (value) => {
    const parsed = Number(String(value).replace(/,/g, ""));

    return Number.isFinite(parsed) ? parsed : null;
};

// Extracts the preferences that the collector stated in this message.
const extractPreferences = (message, current = {}) => {
    const text = String(message || "");
    const preferences = { ...current };

    for (const pattern of BUDGET_PATTERNS) {
        const match = text.match(pattern);

        if (match) {
            const budget = parseNumber(match[1]);

            if (budget) {
                preferences.budget = budget;
                break;
            }
        }
    }

    for (const brand of BRANDS) {
        if (new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)) {
            preferences.brand = brand;
            break;
        }
    }

    for (const movement of MOVEMENTS) {
        if (new RegExp(`\\b${movement}\\b`, "i").test(text)) {
            preferences.movement = movement;
            break;
        }
    }

    for (const [style, keywords] of Object.entries(STYLES)) {
        if (keywords.some((keyword) => text.toLowerCase().includes(keyword))) {
            preferences.style = style;
            break;
        }
    }

    return preferences;
};

// Matches the preferences against the products that are currently in stock.
const findMatches = async (preferences) => {
    const filter = { isActive: true, stock: { $gt: 0 } };

    if (preferences.brand) {
        filter.brand = preferences.brand;
    }

    if (preferences.movement) {
        filter.movement = preferences.movement;
    }

    if (preferences.budget) {
        filter.price = { $lte: preferences.budget };
    }

    if (preferences.style) {
        filter.category = preferences.style;
    }

    const matches = await Product.find(filter).sort({ ratings: -1 }).limit(5);

    // A style that no product carries must not hide the other matches.
    if (matches.length === 0 && preferences.style) {
        const relaxed = { ...filter };
        delete relaxed.category;

        return Product.find(relaxed).sort({ ratings: -1 }).limit(5);
    }

    return matches;
};

const formatPrice = (price) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
    }).format(Number(price) || 0);

// Builds the answer of the assistant.
const buildReply = async (message, preferences) => {
    const text = String(message || "").toLowerCase();

    if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(text.trim())) {
        return {
            reply:
                "Welcome to the Aureo vault. Tell me your budget and what you are looking for, for example \"a dive watch under 150000 with an automatic movement\".",
            matches: []
        };
    }

    if (/(thanks|thank you)/.test(text)) {
        return {
            reply: "You are welcome. I will keep your preferences on file for the next visit.",
            matches: []
        };
    }

    const matches = await findMatches(preferences);

    if (matches.length === 0) {
        return {
            reply:
                "I could not find a piece that matches that request in the vault right now. I can widen the search, or you can tell me another budget or style.",
            matches: []
        };
    }

    const lines = matches.map(
        (product) =>
            `  - ${product.name} (${product.brand}, ${product.movement}, ${product.caseSize}mm) - ${formatPrice(product.price)}`
    );

    const criteria = [
        preferences.budget ? `a budget of ${formatPrice(preferences.budget)}` : null,
        preferences.brand ? `the ${preferences.brand} brand` : null,
        preferences.movement ? `a ${preferences.movement} movement` : null,
        preferences.style ? `a ${preferences.style} style` : null
    ].filter(Boolean);

    return {
        reply: [
            `I found ${matches.length} piece(s) in the vault${criteria.length ? ` for ${criteria.join(", ")}` : ""}:`,
            ...lines,
            "",
            "All of them are currently in stock. Would you like more detail on any of these?"
        ].join("\n"),
        matches: matches.map((product) => ({
            _id: product._id,
            name: product.name,
            brand: product.brand,
            price: product.price,
            image: product.images?.[0]?.url || ""
        }))
    };
};

module.exports = {
    extractPreferences,
    findMatches,
    buildReply,
    BRANDS,
    STYLES
};
