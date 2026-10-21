// Query helpers shared by the list endpoints.
//
// Every value that reaches MongoDB goes through `sanitizeQueryParams` first so
// a client can never inject operators (for example `$ne` or `$where`) through
// the query string.

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const sanitizeQueryParams = (query = {}) => {
    const sanitized = {};

    Object.keys(query).forEach((key) => {
        if (FORBIDDEN_KEYS.has(key)) {
            return;
        }

        // Keys starting with `$` or containing `.` are MongoDB operators and
        // path expressions. They are never allowed to come from a client.
        if (key.startsWith("$") || key.includes(".")) {
            return;
        }

        const value = query[key];

        // Nested objects are how the query parser represents operator
        // injection attempts such as `?price[$ne]=1`. Only flat primitives
        // reach the database.
        if (value !== null && typeof value === "object") {
            return;
        }

        sanitized[key] = value;
    });

    return sanitized;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toNumber = (value) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
};

const toPositiveNumber = (value) => {
    const parsed = toNumber(value);

    return parsed !== null && parsed > 0 ? parsed : null;
};

// FR 2.3: brand, movement, case size, condition, price range and keyword.
// Empty filters are ignored so the endpoint always answers with a valid set.
const buildProductFilter = (rawQuery = {}) => {
    const query = sanitizeQueryParams(rawQuery);
    const filter = { isActive: true };

    const keyword = query.keyword?.trim();

    if (keyword) {
        const safeKeyword = escapeRegex(keyword);
        filter.$or = [
            { name: { $regex: safeKeyword, $options: "i" } },
            { brand: { $regex: safeKeyword, $options: "i" } },
            { category: { $regex: safeKeyword, $options: "i" } },
            { description: { $regex: safeKeyword, $options: "i" } }
        ];
    }

    if (query.brand) {
        filter.brand = String(query.brand).trim();
    }

    if (query.category) {
        filter.category = String(query.category).trim().toLowerCase();
    }

    if (query.movement) {
        filter.movement = String(query.movement).trim().toLowerCase();
    }

    if (query.condition) {
        filter.condition = String(query.condition).trim().toLowerCase();
    }

    // FR 2.3: case size filter. Supports an exact value as well as a
    // min/max range so the catalog can offer both behaviours.
    const caseSize = toPositiveNumber(query.caseSize);
    const minCaseSize = toPositiveNumber(query.minCaseSize);
    const maxCaseSize = toPositiveNumber(query.maxCaseSize);

    if (caseSize !== null) {
        filter.caseSize = caseSize;
    } else if (minCaseSize !== null || maxCaseSize !== null) {
        const caseSizeFilter = {};

        if (minCaseSize !== null) {
            caseSizeFilter.$gte = minCaseSize;
        }

        if (maxCaseSize !== null) {
            caseSizeFilter.$lte = maxCaseSize;
        }

        filter.caseSize = caseSizeFilter;
    }

    const priceFilter = {};
    const minPrice = toNumber(query.minPrice);
    const maxPrice = toNumber(query.maxPrice);

    if (minPrice !== null) {
        priceFilter.$gte = minPrice;
    }

    if (maxPrice !== null) {
        priceFilter.$lte = maxPrice;
    }

    if (Object.keys(priceFilter).length > 0) {
        filter.price = priceFilter;
    }

    const minRating = toNumber(query.minRating);

    if (minRating !== null) {
        filter.ratings = { $gte: minRating };
    }

    const minReviews = toNumber(query.minReviews);

    if (minReviews !== null) {
        filter.numOfReviews = { $gte: minReviews };
    }

    return filter;
};

const buildPagination = (rawQuery = {}, { defaultLimit = 12, maxLimit = 50 } = {}) => {
    const query = sanitizeQueryParams(rawQuery);

    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const requestedLimit = Number.parseInt(query.limit, 10) || defaultLimit;
    const limit = Math.min(Math.max(requestedLimit, 1), maxLimit);

    return {
        page,
        limit,
        skip: (page - 1) * limit
    };
};

module.exports = {
    sanitizeQueryParams,
    escapeRegex,
    buildProductFilter,
    buildPagination
};
