const MAX_COMMENT_LENGTH = 500;

// Keep this deliberately conservative. Whole-token matching avoids false positives
// in names and local terms such as Singapore, Scunthorpe, or assistant.
const PROHIBITED_TOKENS = new Set([
    'asshole', 'bastard', 'bitch', 'cunt', 'dick', 'fuck', 'fucker', 'fucking',
    'motherfucker', 'shit', 'slut', 'whore',
]);

function normalizeCommentContent(value) {
    if (typeof value !== 'string') return '';
    return value.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function containsProhibitedLanguage(value) {
    const tokens = value
        .toLocaleLowerCase('en-SG')
        .replace(/[@4]/g, 'a')
        .replace(/[!1]/g, 'i')
        .replace(/[3]/g, 'e')
        .replace(/[0]/g, 'o')
        .match(/[\p{L}\p{N}]+/gu) || [];
    return tokens.some((token) => PROHIBITED_TOKENS.has(token));
}

function validateCommentContent(value) {
    if (typeof value !== 'string') return { error: 'Write a comment before posting.' };
    const content = normalizeCommentContent(value);
    if (!content) return { error: 'Write a comment before posting.' };
    if ([...content].length > MAX_COMMENT_LENGTH) {
        return { error: `Comments must be ${MAX_COMMENT_LENGTH} characters or fewer.` };
    }
    if (containsProhibitedLanguage(content)) {
        return { error: 'Please revise your comment so it follows our community guidelines.' };
    }
    return { content };
}

module.exports = {
    MAX_COMMENT_LENGTH, containsProhibitedLanguage, normalizeCommentContent, validateCommentContent,
};
