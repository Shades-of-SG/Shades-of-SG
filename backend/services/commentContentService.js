const MAX_COMMENT_LENGTH = 500;
const MAX_REFLECTION_LENGTH = 1000;

// Keep this deliberately conservative. Whole-token matching avoids false positives
// in names and local terms such as Singapore, Scunthorpe, or assistant.
const PROHIBITED_TOKENS = new Set([
    'asshole', 'bastard', 'bitch', 'cunt', 'dick', 'fuck', 'fucker', 'fucking',
    'motherfucker', 'shit', 'slut', 'whore',
]);

function normalizeCommunityContent(value) {
    if (typeof value !== 'string') return '';
    return value.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function containsProhibitedLanguage(value) {
    const normalized = normalizeCommunityContent(value)
        .toLocaleLowerCase('en-SG')
        .replace(/[@4]/g, 'a')
        .replace(/[!1|]/g, 'i')
        .replace(/3/g, 'e')
        .replace(/0/g, 'o')
        .replace(/[$5]/g, 's')
        .replace(/7/g, 't');
    const tokens = normalized.match(/[\p{L}\p{N}]+/gu) || [];
    if (tokens.some((token) => PROHIBITED_TOKENS.has(token) || PROHIBITED_TOKENS.has(token.replace(/(.)\1+/gu, '$1')))) {
        return true;
    }

    // Catch simple punctuation/spacing bypasses such as f.u.c.k and f u c k,
    // while retaining token boundaries so innocent longer words are not matched.
    return [...PROHIBITED_TOKENS].some((word) => {
        const separated = [...word].map((character) => `${character}[\\W_]*`).join('').replace(/\[\\W_\]\*$/, '');
        return new RegExp(`(^|[^\\p{L}\\p{N}])${separated}($|[^\\p{L}\\p{N}])`, 'u').test(normalized);
    });
}

function validateCommunityContent(value, { emptyMessage, label, maxLength }) {
    if (typeof value !== 'string') return { error: emptyMessage };
    const content = normalizeCommunityContent(value);
    if (!content) return { error: emptyMessage };
    if ([...content].length > maxLength) {
        return { error: `${label} must be ${maxLength} characters or fewer.` };
    }
    if (containsProhibitedLanguage(content)) {
        return { error: `Please revise your ${label.toLowerCase()} so it follows our community guidelines.` };
    }
    return { content };
}

function validateCommentContent(value) {
    return validateCommunityContent(value, {
        emptyMessage: 'Write a comment before posting.', label: 'Comment', maxLength: MAX_COMMENT_LENGTH,
    });
}

function validateReflectionContent(value) {
    return validateCommunityContent(value, {
        emptyMessage: 'Write a reflection before submitting.', label: 'Reflection', maxLength: MAX_REFLECTION_LENGTH,
    });
}

module.exports = {
    MAX_COMMENT_LENGTH, MAX_REFLECTION_LENGTH, containsProhibitedLanguage,
    normalizeCommentContent: normalizeCommunityContent, normalizeCommunityContent,
    validateCommentContent, validateReflectionContent,
};
