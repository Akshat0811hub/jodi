// src/components/PeopleList.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import "../css/global.css";
import "../css/peopleList.css";
 
const tableHeaders = ["Name", "Height", "DOB", "Phone No.", "Place"];

const availableFields = [
  "age",
  "height",
  "gender",
  "religion",
  "caste",
  "maritalStatus",
  "state",
  "phoneNumber",
  "area",
  "dob",
  "nativePlace",
  "budget" // Added budget field
];

const fieldLabels = {
  age: "Age",
  height: "Height",
  gender: "Gender",
  religion: "Religion",
  caste: "Caste",
  maritalStatus: "Marital Status",
  state: "State",
  area: "Area",
  dob: "Date of Birth",
  nativePlace: "Native Place",
  phoneNumber: "Phone Number",
  budget: "Budget" // Added budget label
};

// Premium notification component
const PremiumNotification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`premium-notification ${type}`}>
      <div className="notification-content">
        <span className="notification-icon">
          {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </span>
        <span className="notification-message">{message}</span>
        <button className="notification-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

// Premium loading overlay
const LoadingOverlay = ({ message }) => (
  <div className="loading-overlay">
    <div className="loading-content">
      <div className="loading-spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  </div>
);

// Image component with Supabase URL handling
const SupabaseImage = ({ photo, alt, className, onError }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setImageError(false);
        
        // If photo is an object with url property (new format)
        if (typeof photo === 'object' && photo.url) {
          setImageUrl(photo.url);
        }
        // If photo is a string (old format or filename)
        else if (typeof photo === 'string') {
          // Check if it's already a full URL
          if (photo.startsWith('http')) {
            setImageUrl(photo);
          } else {
            // Get URL from backend
            try {
              const response = await api.get(`/people/image/${photo}`);
              setImageUrl(response.data.url);
            } catch (error) {
              console.error("Failed to get image URL:", error);
              setImageError(true);
            }
          }
        } else {
          setImageError(true);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading image:", error);
        setImageError(true);
        setLoading(false);
      }
    };

    if (photo) {
      loadImage();
    } else {
      setImageError(true);
      setLoading(false);
    }
  }, [photo]);

  const handleImageError = () => {
    console.error("Image failed to load:", imageUrl);
    setImageError(true);
    if (onError) onError();
  };

  if (loading) {
    return (
      <div className={`${className} image-loading`}>
        <div className="image-skeleton">
          <div className="skeleton-shimmer"></div>
        </div>
      </div>
    );
  }

  if (imageError || !imageUrl) {
    return (
      <div className={`${className} image-error`}>
        <div className="error-placeholder">
          <span className="error-icon">🖼️</span>
          <span className="error-text">Image not available</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={handleImageError}
      loading="lazy"
    />
  );
};

const PeopleList = ({ filters }) => {
  const [people, setPeople] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showFieldSelection, setShowFieldSelection] = useState(false);
  const [selectedFields, setSelectedFields] = useState([...availableFields]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [tableLoading, setTableLoading] = useState(true);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const fetchPeople = async () => {
    try {
      setTableLoading(true);
      console.log("📡 Fetching people with Supabase integration...");
      
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/people?${params}`);
      
      console.log("✅ People fetched successfully:", res.data.length);
      setPeople(res.data);
      
      // Add small delay for smooth loading animation
      setTimeout(() => setTableLoading(false), 300);
    } catch (err) {
      console.error("❌ Failed to fetch people", err);
      showNotification("Failed to fetch people. Please try again.", 'error');
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [filters]);

  const handleEdit = (person) => {
    setFormData({ ...person });
    setEditMode(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleConfirmEdit = async () => {
    try {
      setLoading(true);
      console.log("📝 Updating person with Supabase...");
      
      await api.put(`/people/${formData._id}`, formData);
      
      // Update local state with new data
      setPeople((prevPeople) =>
        prevPeople.map((p) =>
          p._id === formData._id ? { ...formData, photos: p.photos, profilePictureUrl: p.profilePictureUrl } : p
        )
      );
      
      setExpandedRow(formData._id);
      setEditMode(false);
      showNotification("Profile updated successfully! 🎉", 'success');
      
      // Refresh data to get latest from server
      setTimeout(() => fetchPeople(), 500);
      
    } catch (err) {
      console.error("❌ Error updating person:", err);
      showNotification("Failed to update profile. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Custom premium confirmation dialog would be better, but using native for now
    if (window.confirm("⚠️ Are you sure you want to delete this person? This action cannot be undone.")) {
      try {
        console.log("🗑️ Deleting person and Supabase photos...");
        await api.delete(`/people/${id}`);
        showNotification("Person deleted successfully (including photos from Supabase)", 'success');
        fetchPeople();
        setExpandedRow(null);
      } catch (error) {
        console.error("❌ Error deleting person:", error);
        showNotification("Failed to delete person. Please try again.", 'error');
      }
    }
  };

  const toggleField = (field) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

  const handleDownloadStyledPDF = async (personId) => {
    if (selectedFields.length === 0) {
      showNotification("Please select at least one field to include in the PDF", 'error');
      return;
    }

    try {
      setPdfLoading(true);
      console.log("🔄 Generating PDF for person:", personId);
      
      const fieldsQuery = selectedFields.join(",");
      
      const response = await api.get(`/pdf/person/${personId}/pdf?fields=${fieldsQuery}`, {
        responseType: 'blob',
        timeout: 60000,
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const person = people.find(p => p._id === personId);
      const filename = `${(person?.name || 'profile').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.pdf`;
      
      link.href = url;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      console.log("✅ PDF downloaded successfully");
      showNotification("PDF downloaded successfully! 🎉", 'success');
      setShowFieldSelection(false);
      
    } catch (error) {
      console.error("❌ PDF download failed:", error);
      
      let errorMessage = "Failed to generate PDF";
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = "Person not found";
        } else if (error.response.status === 500) {
          errorMessage = "Server error while generating PDF";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = "Network error - please check your connection";
      }
      
      showNotification(`Error: ${errorMessage}`, 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date)) return "-";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Format budget for display
  const formatBudget = (budget) => {
    if (!budget) return "-";
    // If the budget is already formatted with currency symbol, return as is
    if (budget.includes("₹") || budget.includes("$")) return budget;
    // If it's just a number, add currency symbol
    if (!isNaN(budget)) {
      return `₹${budget}`;
    }
    return budget;
  };

  // Select/Deselect all fields functionality
  const handleSelectAllFields = () => {
    setSelectedFields([...availableFields]);
  };

  const handleDeselectAllFields = () => {
    setSelectedFields([]);
  };

  return (
    <div className="app-wrapper">
      {/* Premium Notification */}
      {notification && (
        <PremiumNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Loading Overlay */}
      {(loading || pdfLoading) && (
        <LoadingOverlay 
          message={loading ? "Saving changes..." : "Generating premium PDF..."}
        />
      )}

      <div className="people-container">
        <div className="header-section">
          <h2 className="people-heading">
            ✨ Showing {people.length} person{people.length !== 1 && "s"} (Supabase Storage)
          </h2>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-number">{people.length}</div>
              <div className="stat-label">Total Profiles</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">🆓</div>
              <div className="stat-label">Supabase Free</div>
            </div>
          </div>
        </div>

        {tableLoading ? (
          <div className="table-loading">
            <div className="table-skeleton">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-row">
                  <div className="skeleton-cell"></div>
                  <div className="skeleton-cell"></div>
                  <div className="skeleton-cell"></div>
                  <div className="skeleton-cell"></div>
                  <div className="skeleton-cell"></div>
                </div>
              ))}
            </div>
          </div>
        ) : people.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No profiles found</h3>
            <p>Try adjusting your search filters to find more people.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="people-table">
              <thead>
                <tr>
                  {tableHeaders.map((header, index) => (
                    <th key={header} style={{ animationDelay: `${index * 0.1}s` }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {people.map((person, index) => (
                  <React.Fragment key={person._id}>
                    <tr
                      onClick={() =>
                        setExpandedRow(expandedRow === person._id ? null : person._id)
                      }
                      className={`people-row ${expandedRow === person._id ? 'expanded' : ''}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>
                        <div className="name-cell">
                          <div className="name-avatar">
                            {person.name ? person.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="name-text">{person.name || "-"}</span>
                        </div>
                      </td>
                      <td>
                        <span className="data-value">{person.height || "-"}</span>
                      </td>
                      <td>
                        <span className="data-value">{formatDate(person.dob)}</span>
                      </td>
                      <td>
                        <span className="data-value phone-number">
                          {person.phoneNumber ? `+91 ${person.phoneNumber}` : "-"}
                        </span>
                      </td>
                      <td>
                        <span className="data-value location">
                          {person.nativePlace || person.state || "-"}
                        </span>
                      </td>
                    </tr>

                    {expandedRow === person._id && (
                      <tr className="expanded-row">
                        <td colSpan={tableHeaders.length}>
                          {!editMode ? (
                            <div className="expanded-content">
                              <div className="expanded-details">
                                {person.photos?.length > 0 && (
                                  <div className="photo-section">
                                    <SupabaseImage
                                      photo={person.photos[0]}
                                      alt={person.name}
                                      className="expanded-photo"
                                    />
                                    <div className="photo-overlay">
                                      <span className="photo-icon">📸</span>
                                      <span className="photo-source">Supabase</span>
                                    </div>
                                  </div>
                                )}
                                <div className="details-section">
                                  <div className="details-grid">
                                    {availableFields.map((field) => (
                                      <div key={field} className="detail-item">
                                        <span className="detail-label">
                                          {fieldLabels[field]}
                                        </span>
                                        <span className="detail-value">
                                          {field === "dob"
                                            ? formatDate(person[field])
                                            : field === "budget"
                                            ? formatBudget(person[field])
                                            : (person[field] || "-")}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="action-section">
                                <div className="action-buttons">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(person);
                                    }}
                                    className="action-btn edit-btn"
                                  >
                                    <span className="btn-icon">✏️</span>
                                    <span className="btn-text">Edit Profile</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowFieldSelection(
                                        showFieldSelection === person._id
                                          ? false
                                          : person._id
                                      );
                                    }}
                                    className="action-btn pdf-btn"
                                    disabled={pdfLoading}
                                  >
                                    <span className="btn-icon">
                                      {pdfLoading ? "🔄" : "📄"}
                                    </span>
                                    <span className="btn-text">
                                      {pdfLoading ? "Generating..." : "Download PDF"}
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(person._id);
                                    }}
                                    className="action-btn delete-btn"
                                  >
                                    <span className="btn-icon">🗑️</span>
                                    <span className="btn-text">Delete (+ Supabase)</span>
                                  </button>
                                </div>
                              </div>

                              {showFieldSelection === person._id && (
                                <div className="field-selection">
                                  <div className="field-selection-header">
                                    <h4 className="field-selection-title">
                                      📋 Customize PDF Fields
                                    </h4>
                                    <div className="field-selection-actions">
                                      <button
                                        onClick={handleSelectAllFields}
                                        className="field-action-btn select-all"
                                      >
                                        Select All
                                      </button>
                                      <button
                                        onClick={handleDeselectAllFields}
                                        className="field-action-btn deselect-all"
                                      >
                                        Deselect All
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="field-checkboxes">
                                    {availableFields.map((field) => (
                                      <label key={field} className="checkbox-label">
                                        <input
                                          type="checkbox"
                                          checked={selectedFields.includes(field)}
                                          onChange={() => toggleField(field)}
                                        />
                                        <span className="checkbox-custom"></span>
                                        <span className="checkbox-text">
                                          {fieldLabels[field]}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                  
                                  <div className="field-selection-footer">
                                    <div className="selected-count">
                                      {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected
                                    </div>
                                    <div className="pdf-actions">
                                      <button
                                        onClick={() => handleDownloadStyledPDF(person._id)}
                                        className="pdf-action-btn generate-btn"
                                        disabled={pdfLoading || selectedFields.length === 0}
                                      >
                                        <span className="btn-icon">
                                          {pdfLoading ? "🔄" : "✨"}
                                        </span>
                                        <span className="btn-text">
                                          {pdfLoading ? "Generating PDF..." : "Generate Premium PDF"}
                                        </span>
                                      </button>
                                      <button
                                        onClick={() => setShowFieldSelection(false)}
                                        className="pdf-action-btn cancel-btn"
                                      >
                                        <span className="btn-text">Cancel</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="edit-form">
                              <div className="edit-form-header">
                                <h4 className="edit-title">✏️ Edit Profile</h4>
                                <p className="edit-subtitle">Update the information below</p>
                              </div>
                              
                              <div className="form-grid">
                                <div className="form-group">
                                  <label className="form-label">Full Name</label>
                                  <input
                                    name="name"
                                    value={formData.name || ""}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                    className="form-input"
                                  />
                                </div>
                                
                                {availableFields.map((field) => (
                                  <div key={field} className="form-group">
                                    <label className="form-label">{fieldLabels[field]}</label>
                                    <input
                                      name={field}
                                      value={formData[field] || ""}
                                      onChange={handleChange}
                                      placeholder={`Enter ${fieldLabels[field].toLowerCase()}`}
                                      className="form-input"
                                      type={field === 'dob' ? 'date' : 'text'}
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="edit-actions">
                                <button
                                  onClick={handleConfirmEdit}
                                  disabled={loading}
                                  className="edit-action-btn save-btn"
                                >
                                  <span className="btn-icon">
                                    {loading ? "🔄" : "✅"}
                                  </span>
                                  <span className="btn-text">
                                    {loading ? "Saving Changes..." : "Save Changes"}
                                  </span>
                                </button>
                                <button
                                  onClick={() => setEditMode(false)}
                                  className="edit-action-btn cancel-btn"
                                >
                                  <span className="btn-icon">❌</span>
                                  <span className="btn-text">Cancel</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeopleList;