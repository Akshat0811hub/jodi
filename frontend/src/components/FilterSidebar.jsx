// src/components/FilterSidebar.jsx
import React, { useState } from "react";

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
    <div className="bg-white p-4 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Filter People</h3>
        <button
          className="text-sm text-red-600 hover:underline"
          onClick={handleClearFilters}
        >
          Clear Filters
        </button>
      </div>

      {Object.entries(dropdownOptions).map(([field, options]) => (
        <div className="mb-4" key={field}>
          <label className="block text-sm font-medium mb-1 capitalize">{field}</label>
          <select
            className="w-full p-2 border rounded"
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
              className="w-full mt-2 p-2 border rounded"
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
