// src/components/FilterSidebar.jsx
import React, { useState } from "react";
import "../styles/FilterSidebar.css";

const dropdownOptions = {
  age: ["18-25", "26-30", "31-35", "36-40", "41+", "Other"],
  height: ["<150cm", "150-160cm", "161-170cm", "171-180cm", "181cm+", "Other"],
  religion: ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Other"],
  caste: ["General", "OBC", "SC", "ST", "Other"],
  maritalStatus: ["Single", "Married", "Divorced", "Widowed", "Other"],
  gender: ["Male", "Female", "Other"],
  state: ["Uttar Pradesh", "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Other"],
  country: ["India", "USA", "UK", "Canada", "Australia", "Other"],
  area: ["Urban", "Rural", "Suburban", "Other"],
};

const FilterSidebar = ({ onFilter }) => {
  const [filters, setFilters] = useState({});
  const [customInputs, setCustomInputs] = useState({});

  const handleChange = (field, value) => {
    const updated = {
      ...filters,
      [field]: value === "Other" ? customInputs[field] || "" : value,
    };
    setFilters(updated);
    onFilter(updated);
  };

  const handleOtherChange = (field, value) => {
    setCustomInputs({ ...customInputs, [field]: value });
    const updated = { ...filters, [field]: value };
    setFilters(updated);
    onFilter(updated);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCustomInputs({});
    onFilter({});
  };

  return (
    <div className="filter-sidebar">
      <div className="filter-header">
        <h3 className="filter-title">Filter People</h3>
        <button className="clear-btn" onClick={handleClearFilters}>
          Clear Filters
        </button>
      </div>

      {Object.entries(dropdownOptions).map(([field, options]) => (
        <div className="filter-group" key={field}>
          <label className="filter-label">{field}</label>
          <select
            className="filter-select"
            value={filters[field] || ""}
            onChange={(e) => handleChange(field, e.target.value)}
          >
            <option value="">-- Select --</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {filters[field] === "Other" && (
            <input
              type="text"
              className="filter-input"
              placeholder={`Enter custom ${field}`}
              value={customInputs[field] || ""}
              onChange={(e) => handleOtherChange(field, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default FilterSidebar;
