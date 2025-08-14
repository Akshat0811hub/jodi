// src/components/FilterSidebar.jsx
import React, { useState } from "react";
import "../css/filterSidebar.css";

const dropdownOptions = {
  gender: ["Male", "Female"],
  maritalStatus: ["Never Married", "Married", "Divorced", "Widowed"],
  horoscope: ["Yes", "No"],
  nri: ["Yes", "No"],
  vehicle: ["Yes", "No"],
};

const FilterSidebar = ({ onFilter }) => {
  const [filters, setFilters] = useState({});

  const handleChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleClearFilters = () => {
    setFilters({});
    onFilter({});
  };

  const handleSubmit = () => {
    onFilter(filters);
  };

  return (
    <div className="filter-sidebar">
      <div className="filter-header">
        <h3 className="filter-title">Filter People</h3>
        <button className="clear-btn" onClick={handleClearFilters}>
          Clear Filters
        </button>
      </div>

      {/* Gender */}
      <div className="filter-group">
        <label className="filter-label">Gender</label>
        <select
          className="filter-select"
          value={filters.gender || ""}
          onChange={(e) => handleChange("gender", e.target.value)}
        >
          <option value="">-- Select --</option>
          {dropdownOptions.gender.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Marital Status */}
      <div className="filter-group">
        <label className="filter-label">Marital Status</label>
        <select
          className="filter-select"
          value={filters.maritalStatus || ""}
          onChange={(e) => handleChange("maritalStatus", e.target.value)}
        >
          <option value="">-- Select --</option>
          {dropdownOptions.maritalStatus.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Religion */}
      <div className="filter-group">
        <label className="filter-label">Religion</label>
        <input
          type="text"
          className="filter-input"
          placeholder="Religion"
          value={filters.religion || ""}
          onChange={(e) => handleChange("religion", e.target.value)}
        />
      </div>

      {/* Gotra */}
      <div className="filter-group">
        <label className="filter-label">Gotra</label>
        <input
          type="text"
          className="filter-input"
          placeholder="Gotra"
          value={filters.gotra || ""}
          onChange={(e) => handleChange("gotra", e.target.value)}
        />
      </div>

      {/* Height */}
      <div className="filter-group">
        <label className="filter-label">Height</label>
        <input
          type="text"
          className="filter-input"
          placeholder="Height"
          value={filters.height || ""}
          onChange={(e) => handleChange("height", e.target.value)}
        />
      </div>

      {/* Complexion */}
      <div className="filter-group">
        <label className="filter-label">Complexion</label>
        <input
          type="text"
          className="filter-input"
          placeholder="Complexion"
          value={filters.complexion || ""}
          onChange={(e) => handleChange("complexion", e.target.value)}
        />
      </div>

      {/* Horoscope */}
      <div className="filter-group">
        <label className="filter-label">Horoscope</label>
        <select
          className="filter-select"
          value={filters.horoscope || ""}
          onChange={(e) => handleChange("horoscope", e.target.value)}
        >
          <option value="">-- Select --</option>
          {dropdownOptions.horoscope.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Eating Habits */}
      <div className="filter-group">
        <label className="filter-label">Eating Habits</label>
        <input
          type="text"
          className="filter-input"
          placeholder="Eating Habits"
          value={filters.eatingHabits || ""}
          onChange={(e) => handleChange("eatingHabits", e.target.value)}
        />
      </div>

      {/* Drinking Habits */}
      <div className="filter-group">
        <label className="filter-label">Drinking Habits</label>
        <input
          type="text"
          className="filter-input"
          placeholder="Drinking Habits"
          value={filters.drinkingHabits || ""}
          onChange={(e) => handleChange("drinkingHabits", e.target.value)}
        />
      </div>

      {/* Smoking Habits */}
      <div className="filter-group">
        <label className="filter-label">Smoking Habits</label>
        <input
          type="text"
          className="filter-input"
          placeholder="Smoking Habits"
          value={filters.smokingHabits || ""}
          onChange={(e) => handleChange("smokingHabits", e.target.value)}
        />
      </div>

      {/* Disability */}
      <div className="filter-group">
        <label className="filter-label">Disability</label>
        <input
          type="text"
          className="filter-input"
          placeholder="Physical Disability"
          value={filters.disability || ""}
          onChange={(e) => handleChange("disability", e.target.value)}
        />
      </div>

      {/* NRI */}
      <div className="filter-group">
        <label className="filter-label">NRI</label>
        <select
          className="filter-select"
          value={filters.nri || ""}
          onChange={(e) => handleChange("nri", e.target.value)}
        >
          <option value="">-- Select --</option>
          {dropdownOptions.nri.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Vehicle */}
      <div className="filter-group">
        <label className="filter-label">Vehicle</label>
        <select
          className="filter-select"
          value={filters.vehicle || ""}
          onChange={(e) => handleChange("vehicle", e.target.value)}
        >
          <option value="">-- Select --</option>
          {dropdownOptions.vehicle.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <button className="submit-btn" onClick={handleSubmit}>
        Show Results
      </button>
    </div>
  );
};

export default FilterSidebar;
