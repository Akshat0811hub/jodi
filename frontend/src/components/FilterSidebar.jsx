// src/components/FilterSidebar.jsx - ENHANCED RICH MODERN VERSION
import React, { useState } from "react";
import "../css/filterSidebar.css";

const dropdownOptions = {
  gender: ["Male", "Female", "Other"],
  maritalStatus: ["Never Married", "Married", "Divorced", "Widowed"],
  horoscope: ["Yes", "No"],
  nri: ["Yes", "No"],
  vehicle: ["Yes", "No"],
  eatingHabits: ["Vegetarian", "Non-Vegetarian", "Vegan", "Jain"],
  drinkingHabits: ["Never", "Occasionally", "Socially", "Regularly"],
  smokingHabits: ["Never", "Occasionally", "Regularly", "Quit"],
};

const FilterSidebar = ({ onFilter }) => {
  const [filters, setFilters] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  const handleChange = (field, value) => {
    const newFilters = { ...filters };
    
    if (value === "") {
      delete newFilters[field];
    } else {
      newFilters[field] = value;
    }
    
    setFilters(newFilters);
    setActiveFilters(Object.keys(newFilters).length);
  };

  const handleClearFilters = () => {
    setFilters({});
    setActiveFilters(0);
    onFilter({});
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      onFilter(filters);
    } finally {
      setIsLoading(false);
    }
  };

  const filterGroups = [
    {
      id: "personal",
      title: "Personal Details",
      filters: [
        { key: "gender", label: "Gender", type: "select", options: dropdownOptions.gender },
        { key: "maritalStatus", label: "Marital Status", type: "select", options: dropdownOptions.maritalStatus },
        { key: "religion", label: "Religion", type: "input", placeholder: "e.g., Hindu, Muslim, Christian" },
        { key: "gotra", label: "Gotra", type: "input", placeholder: "e.g., Bharadwaj, Kashyap" },
      ]
    },
    {
      id: "physical",
      title: "Physical Attributes",
      filters: [
        { key: "height", label: "Height", type: "input", placeholder: "e.g., 5'8\", 170cm" },
        { key: "complexion", label: "Complexion", type: "input", placeholder: "e.g., Fair, Wheatish, Dark" },
      ]
    },
    {
      id: "lifestyle",
      title: "Lifestyle & Habits",
      filters: [
        { key: "horoscope", label: "Believes in Horoscope", type: "select", options: dropdownOptions.horoscope },
        { key: "eatingHabits", label: "Eating Habits", type: "select", options: dropdownOptions.eatingHabits },
        { key: "drinkingHabits", label: "Drinking Habits", type: "select", options: dropdownOptions.drinkingHabits },
        { key: "smokingHabits", label: "Smoking Habits", type: "select", options: dropdownOptions.smokingHabits },
      ]
    },
    {
      id: "other",
      title: "Other Details",
      filters: [
        { key: "disability", label: "Physical Disability", type: "input", placeholder: "Any physical disability" },
        { key: "nri", label: "NRI Status", type: "select", options: dropdownOptions.nri },
        { key: "vehicle", label: "Own Vehicle", type: "select", options: dropdownOptions.vehicle },
      ]
    }
  ];

  const renderFilter = (filter) => {
    const { key, label, type, options, placeholder } = filter;
    
    if (type === "select") {
      return (
        <select
          className="filter-select"
          value={filters[key] || ""}
          onChange={(e) => handleChange(key, e.target.value)}
        >
          <option value="">-- Select {label} --</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    
    return (
      <input
        type="text"
        className="filter-input"
        placeholder={placeholder || label}
        value={filters[key] || ""}
        onChange={(e) => handleChange(key, e.target.value)}
      />
    );
  };

  return (
    <div className="filter-sidebar">
      <div className="filter-header">
        <h3 className="filter-title">Filter People</h3>
        <button 
          className="clear-btn" 
          onClick={handleClearFilters}
          disabled={activeFilters === 0}
          style={{ opacity: activeFilters === 0 ? 0.5 : 1 }}
        >
          Clear All {activeFilters > 0 && `(${activeFilters})`}
        </button>
      </div>

      {filterGroups.map((group, groupIndex) => (
        <div key={group.id} style={{ marginBottom: '30px' }}>
          {/* Group Title */}
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#4a5568',
            marginBottom: '15px',
            paddingLeft: '10px',
            borderLeft: '3px solid #667eea',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {group.id === 'personal' && '👤'}
            {group.id === 'physical' && '📏'}
            {group.id === 'lifestyle' && '🎯'}
            {group.id === 'other' && '📋'}
            {group.title}
          </div>

          {/* Filters in Group */}
          {group.filters.map((filter) => (
            <div 
              key={filter.key} 
              className="filter-group" 
              data-filter={filter.key}
              style={{ 
                animationDelay: `${(groupIndex * 0.1) + (group.filters.indexOf(filter) * 0.05)}s` 
              }}
            >
              <label className="filter-label">
                {filter.label}
                {filters[filter.key] && (
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '12px',
                    color: '#10b981',
                    fontWeight: '500'
                  }}>
                    ✓
                  </span>
                )}
              </label>
              {renderFilter(filter)}
            </div>
          ))}
        </div>
      ))}

      <div style={{
        marginTop: '30px',
        padding: '20px 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          {activeFilters > 0 ? (
            <span style={{ color: '#10b981', fontWeight: '600' }}>
              🎯 {activeFilters} filter{activeFilters !== 1 ? 's' : ''} active
            </span>
          ) : (
            <span>No filters applied</span>
          )}
        </div>
        
        <button 
          className={`submit-btn ${isLoading ? 'loading' : ''}`}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span style={{ 
                display: 'inline-block', 
                marginRight: '8px',
                animation: 'spin 1s linear infinite' 
              }}>
                ⏳
              </span>
              Searching...
            </>
          ) : (
            <>
              🔍 Show Results
              {activeFilters > 0 && ` (${activeFilters} filter${activeFilters !== 1 ? 's' : ''})`}
            </>
          )}
        </button>
      </div>

      {/* Add some CSS for the spin animation */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FilterSidebar;