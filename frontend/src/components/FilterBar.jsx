/*
export default function FilterBar({ filters = ['Era', 'Theme', 'Language', 'Instrument'] }) {
  return (
    <form className="filter-bar">
      <label>
        <span>Search</span>
        <input placeholder="Search songs, stories, or instruments" type="search" />
      </label>
      {filters.map((filter) => (
        <label key={filter}>
          <span>{filter}</span>
          <select defaultValue="">
            <option value="">All</option>
            <option value="placeholder">Placeholder</option>
          </select>
        </label>
      ))}
    </form>
  )
}
*/

import { useState, useEffect } from "react";
import { sampleSongs } from "../pages/pageData";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";

export default function FilterBar({ songs, onResults }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    theme: ["All"],
    language: ["All"],
    moodTags: ["All"],
  });
  const [openDropdown, setOpenDropdown] = useState(null);

  const themeOptions = ["All", "Heritage", "Memory", "Rhythm"];
  const languageOptions = ["All", "Multi", "English", "Malay", "Chinese", "Tamil"];
  const moodOptions = ["All", "Happy", "happy", "Energetic", "Nostalgic"];

  function applyFilters(term, filtersObj) {
    let results = songs;

    if (term) {
      results = results.filter((song) => {
        const title = song.title || "";
        const description = song.description || "";
        return (
          title.toLowerCase().includes(term.toLowerCase()) ||
          description.toLowerCase().includes(term.toLowerCase())
        );
      });
    }


    if (!filtersObj.theme.includes("All")) {
      results = results.filter((song) => filtersObj.theme.includes(song.theme));
    }
    if (!filtersObj.language.includes("All")) {
      results = results.filter((song) => filtersObj.language.includes(song.language));
    }
    if (!filtersObj.moodTags.includes("All")) {
      results = results.filter((song) =>
        song.moodTags.some((m) => filtersObj.moodTags.includes(m))
      );
    }

    onResults(results);
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      applyFilters(searchTerm, selectedFilters);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, selectedFilters, songs]);

  function handleClear() {
    setSearchTerm("");
    setSelectedFilters({
      theme: ["All"],
      language: ["All"],
      moodTags: ["All"],
    });
    onResults(songs);
  }

  function handleCheckboxChange(filterKey, option) {
    setSelectedFilters((prev) => {
      let current = [...prev[filterKey]];
      if (option === "All") {
        current = ["All"];
      } else {
        current = current.filter((v) => v !== "All");
        if (current.includes(option)) {
          current = current.filter((v) => v !== option);
          if (current.length === 0) current = ["All"];
        } else {
          current.push(option);
        }
      }
      return { ...prev, [filterKey]: current };
    });
  }



  // Render dropdown with checkboxes
  function renderDropdown(label, filterKey, options) {
    const selected = selectedFilters[filterKey];
    const displayLabel =
      selected.includes("All") ? "All" : "Filtered";

    return (
      <div className="dropdown-filter">
        <button
          type="button"
          className="dropdown-toggle"
          onClick={() =>
            setOpenDropdown(openDropdown === filterKey ? null : filterKey)
          }
        >
          {label}: {displayLabel} ▼
        </button>
        {openDropdown === filterKey && (
          <div className="dropdown-menu">
            {options.map((opt) => (
              <label key={opt} style={{ display: "block" }}>
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => handleCheckboxChange(filterKey, opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <form className="filter-bar" onSubmit={(e) => e.preventDefault()}>
      <label>
        <span>Search</span>
        <input
          placeholder="Search songs titles or descriptions"
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </label>

      {renderDropdown("Theme", "theme", themeOptions)}
      {renderDropdown("Language", "language", languageOptions)}
      {renderDropdown("Mood", "moodTags", moodOptions)}

      <IconButton
        type="button"
        onClick={handleClear}
        aria-label="clear"
        sx={{ color: "white", p: 0, ml: "auto" }}
        size="small"
      >
        <ClearIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </form>
  );
}
