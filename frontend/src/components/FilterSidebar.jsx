// src/components/FilterSidebar.jsx - FIXED WITH PROPER SCROLLING & BUDGET FILTER
import React, { useState } from "react";
import "../css/filterSidebar.css";
import "../css/global.css";

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
      id: "financial",
      title: "Financial Details",
      filters: [
        { key: "budget", label: "Marriage Budget", type: "input", placeholder: "e.g., ₹5,00,000" },
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
      {/* STICKY HEADER */}
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

      {/* SCROLLABLE CONTENT AREA */}
      <div className="filter-content">
        {filterGroups.map((group, groupIndex) => (
          <div key={group.id} className="filter-group-section">
            {/* Group Title */}
            <div className="group-title">
              <span className="group-icon">
                {group.id === 'personal' && '👤'}
                {group.id === 'physical' && '📏'}
                {group.id === 'lifestyle' && '🎯'}
                {group.id === 'financial' && '💰'}
                {group.id === 'other' && '📋'}
              </span>
              <span className="group-text">{group.title}</span>
            </div>

            {/* Filters in Group */}
            <div className="filters-container">
              {group.filters.map((filter, filterIndex) => (
                <div 
                  key={filter.key} 
                  className="filter-group" 
                  data-filter={filter.key}
                  style={{ 
                    animationDelay: `${(groupIndex * 0.1) + (filterIndex * 0.05)}s` 
                  }}
                >
                  <label className="filter-label">
                    {filter.label}
                    {filters[filter.key] && (
                      <span className="filter-active-indicator">✓</span>
                    )}
                  </label>
                  {renderFilter(filter)}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* FILTER STATUS */}
        <div className="filter-status">
          {activeFilters > 0 ? (
            <span className="active-filters">
              🎯 {activeFilters} filter{activeFilters !== 1 ? 's' : ''} active
            </span>
          ) : (
            <span className="no-filters">No filters applied</span>
          )}
        </div>
      </div>

      {/* STICKY SUBMIT SECTION */}
      <div className="submit-section">
        <button 
          className={`submit-btn ${isLoading ? 'loading' : ''}`}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading-icon">⏳</span>
              <span>Searching...</span>
            </>
          ) : (
            <>
              <span>🔍</span>
              <span>Show Results</span>
              {activeFilters > 0 && (
                <span className="filter-count">
                  ({activeFilters} filter{activeFilters !== 1 ? 's' : ''})
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Loading Animation Styles */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .loading-icon {
          display: inline-block;
          animation: spin 1s linear infinite;
        }
        
        .filter-group-section {
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .filter-group-section:last-child {
          border-bottom: none;
          margin-bottom: 15px;
        }
        
        .group-title {
          font-size: 15px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 15px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 8px;
          border-left: 4px solid #667eea;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .group-icon {
          font-size: 16px;
        }
        
        .group-text {
          flex: 1;
        }
        
        .filters-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .filter-active-indicator {
          margin-left: 8px;
          font-size: 12px;
          color: #10b981;
          font-weight: 500;
        }
        
        .filter-status {
          text-align: center;
          margin: 20px 0;
          padding: 15px;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        
        .active-filters {
          color: #059669;
          font-weight: 600;
          font-size: 14px;
          padding: 4px 8px;
          background: rgba(5, 150, 105, 0.1);
          border-radius: 4px;
          display: inline-block;
        }
        
        .no-filters {
          color: #64748b;
          font-size: 14px;
        }
        
        .filter-count {
          font-size: 12px;
          opacity: 0.8;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .group-title {
            padding: 10px 12px;
            font-size: 14px;
            margin-bottom: 12px;
          }
          
          .filters-container {
            gap: 12px;
          }
          
          .filter-status {
            padding: 12px;
            margin: 15px 0;
          }
        }
      `}</style>
    </div>
  );
};

export default FilterSidebar;