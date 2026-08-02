export default function InterestTagsAccordion({ selectedTags, setSelectedTags }) {
    const sections = {
        Events: ["National Day"],
        Culture: ["Malay Culture", "Chinese Culture", "Tamil Culture"],
    };

    const toggleTag = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    return (
        <div className="tag-picker">
            <span className="tag-picker__title">Interests</span>

            {Object.entries(sections).map(([section, tags]) => (
                <div className="tag-picker__group" key={section}>
                    <h3 className="tag-picker__group-title">{section}</h3>
                    <div className="tag-picker__tags">
                        {tags.map(tag => {
                            const isSelected = selectedTags.includes(tag);

                            return (
                                <button
                                    aria-pressed={isSelected}
                                    className={`tag-chip ${isSelected ? 'is-selected' : ''}`}
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    type="button"
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
