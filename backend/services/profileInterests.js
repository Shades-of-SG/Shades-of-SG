const INTEREST_TAG_CATEGORIES = Object.freeze([
    Object.freeze({
        label: 'National moments',
        tags: Object.freeze(['National Day', 'Racial Harmony Day', 'Total Defence Day']),
    }),
    Object.freeze({
        label: 'Singapore cultures',
        tags: Object.freeze(['Chinese Culture', 'Malay Culture', 'Indian Culture', 'Peranakan Heritage', 'Eurasian Heritage']),
    }),
    Object.freeze({
        label: 'Music and memories',
        tags: Object.freeze(['National Songs', 'Folk & Traditional Music', 'Community Stories', 'Singapore History', 'Local Languages']),
    }),
]);

const ALLOWED_INTEREST_TAGS = new Set(INTEREST_TAG_CATEGORIES.flatMap((category) => category.tags));
const MAX_INTEREST_TAGS = 6;

function validateInterestTags(value) {
    if (!Array.isArray(value)) return { error: 'Interest tags must be an array.' };
    if (value.length > MAX_INTEREST_TAGS) return { error: `Choose no more than ${MAX_INTEREST_TAGS} interest tags.` };
    if (value.some((tag) => typeof tag !== 'string')) {
        return { error: 'One or more interest tags are not supported.' };
    }
    const normalized = value.map((tag) => tag.trim());
    if (normalized.some((tag) => !ALLOWED_INTEREST_TAGS.has(tag))) {
        return { error: 'One or more interest tags are not supported.' };
    }
    if (new Set(normalized).size !== normalized.length) return { error: 'Interest tags must not contain duplicates.' };
    return { value: normalized };
}

module.exports = { ALLOWED_INTEREST_TAGS, INTEREST_TAG_CATEGORIES, MAX_INTEREST_TAGS, validateInterestTags };
