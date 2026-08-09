const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

function positiveInteger(value, fallback) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePagination(query = {}, { defaultLimit = DEFAULT_PAGE_SIZE, maxLimit = MAX_PAGE_SIZE } = {}) {
    const page = positiveInteger(query.page, 1);
    const requestedLimit = positiveInteger(query.limit, defaultLimit);
    const limit = Math.min(requestedLimit, maxLimit);
    return { limit, offset: (page - 1) * limit, page };
}

function paginationMetadata(totalItems, page, limit) {
    const totalPages = Math.ceil(totalItems / limit);
    return {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
    };
}

function paginated(items, totalItems, page, limit) {
    return { items, pagination: paginationMetadata(totalItems, page, limit) };
}

module.exports = { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, paginated, paginationMetadata, parsePagination };
