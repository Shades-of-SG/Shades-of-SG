module.exports = function validateBio(bio) {
    const forbiddenWords = ["fuck", "ass"]; // extend as needed
    //if (!bio) return "Bio is required"; // though default will handle empty
    if (bio.length > 200) return "Bio must be at most 200 characters";

    const lowerBio = bio.toLowerCase();
    for (const word of forbiddenWords) {
        if (lowerBio.includes(word)) {
            return `Bio contains forbidden word: ${word}`;
        }
    }
    return null; // valid
};
