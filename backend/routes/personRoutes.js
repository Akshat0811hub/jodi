// src/components/PeopleList.jsx - FIXED VERSION
import React, { useEffect, useState } from "react";
import api from "../api";
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
  "nativePlace"
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
};

const PeopleList = ({ filters }) => {
  const [people, setPeople] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showFieldSelection, setShowFieldSelection] = useState(false);
  const [selectedFields, setSelectedFields] = useState([...availableFields]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ FIXED: Updated fetchPeople function
  const fetchPeople = async () => {
    try {
      setFetchLoading(true);
      setError("");
      
      console.log("🔄 Fetching people with filters:", filters);
      
      // ✅ Build query params properly
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (filters[key] && filters[key].toString().trim() !== '') {
            queryParams.append(key, filters[key]);
          }
        });
      }
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/people?${queryString}` : '/people';
      
      console.log("📤 Making request to:", endpoint);
      
      // ✅ Try different endpoint patterns based on your backend setup
      let response;
      try {
        // First try: /api/people (your current setup)
        response = await api.get(endpoint);
      } catch (err) {
        if (err.response?.status === 404) {
          console.log("🔄 Trying alternative endpoint: /people/");
          // Second try: /people/ (if routes are mounted differently)
          const alternativeEndpoint = queryString ? `/people/?${queryString}` : '/people/';
          response = await api.get(alternativeEndpoint);
        } else {
          throw err;
        }
      }
      
      console.log("✅ Successfully fetched people:", response.data.length);
      setPeople(response.data);
      
    } catch (err) {
      console.error("❌ Failed to fetch people:", err);
      setError("Failed to fetch people. Please check if the server is running.");
      
      // ✅ More detailed error logging
      if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);
      } else if (err.request) {
        console.error("No response received:", err.request);
      }
    } finally {
      setFetchLoading(false);
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
      
      // ✅ Use the correct endpoint for updates
      await api.put(`/people/${formData._id}`, formData);
      
      setPeople((prevPeople) =>
        prevPeople.map((p) =>
          p._id === formData._id ? { ...p, ...formData } : p
        )
      );
      setExpandedRow(formData._id);
      setEditMode(false);
      
    } catch (err) {
      console.error("❌ Error updating person:", err);
      alert(`Failed to update person: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this person?")) {
      try {
        await api.delete(`/people/${id}`);
        alert("Person deleted successfully");
        fetchPeople();
        setExpandedRow(null);
      } catch (error) {
        console.error("❌ Error deleting person:", error);
        alert(`Failed to delete person: ${error.response?.data?.message || error.message}`);
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

  // ✅ FIXED: PDF download function with better error handling
  const handleDownloadStyledPDF = async (personId) => {
    if (selectedFields.length === 0) {
      alert("Please select at least one field to include in the PDF");
      return;
    }

    try {
      setPdfLoading(true);
      console.log("🔄 Generating PDF for person:", personId);
      
      const fieldsQuery = selectedFields.join(",");
      
      // ✅ Use the correct PDF endpoint from your backend setup
      const response = await api.get(`/pdf/person/${personId}/pdf?fields=${fieldsQuery}`, {
        responseType: 'blob',
        timeout: 90000, // 90 second timeout for PDF generation
      });
      
      // ✅ Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // ✅ Get person name for filename
      const person = people.find(p => p._id === personId);
      const filename = `${(person?.name || 'profile').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.pdf`;
      
      link.href = url;
      link.download = filename;
      
      // ✅ Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // ✅ Cleanup
      window.URL.revokeObjectURL(url);
      
      console.log("✅ PDF downloaded successfully");
      alert("PDF downloaded successfully!");
      setShowFieldSelection(false);
      
    } catch (error) {
      console.error("❌ PDF download failed:", error);
      
      let errorMessage = "Failed to generate PDF";
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = "PDF service not available or person not found";
        } else if (error.response.status === 500) {
          errorMessage = "Server error while generating PDF";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "PDF generation timed out - please try again";
      } else if (error.request) {
        errorMessage = "Network error - please check your connection";
      }
      
      alert(`Error: ${errorMessage}`);
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

  // ✅ FIXED: Get the correct base URL for images
  const getImageUrl = (filename) => {
    if (!filename) return null;
    
    // Remove any existing URL if it's already a full URL
    if (filename.startsWith('http')) {
      return filename;
    }
    
    const baseUrl = process.env.REACT_APP_API_URL || "https://jodi-fi4e.onrender.com";
    return `${baseUrl}/uploads/${filename}`;
  };

  // ✅ Loading state
  if (fetchLoading) {
    return (
      <div className="people-container">
        <div className="loading-state">
          <p>Loading people...</p>
        </div>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="people-container">
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={fetchPeople} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="people-container">
      <h2 className="people-heading">
        Showing {people.length} person{people.length !== 1 && "s"}
      </h2>

      {people.length === 0 ? (
        <div className="empty-state">
          <p>No people found matching your criteria.</p>
        </div>
      ) : (
        <table className="people-table">
          <thead>
            <tr>
              {tableHeaders.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <React.Fragment key={person._id}>
                <tr
                  onClick={() =>
                    setExpandedRow(expandedRow === person._id ? null : person._id)
                  }
                  className="people-row"
                >
                  <td>{person.name || "-"}</td>
                  <td>{person.height || "-"}</td>
                  <td>{formatDate(person.dob)}</td>
                  <td>{person.phoneNumber || "-"}</td>
                  <td>{person.nativePlace || person.state || "-"}</td>
                </tr>

                {expandedRow === person._id && (
                  <tr className="expanded-row">
                    <td colSpan={tableHeaders.length}>
                      {!editMode ? (
                        <div>
                          <div className="expanded-details">
                            {person.photos?.length > 0 && (
                              <img
                                src={getImageUrl(person.photos[0])}
                                alt={person.name}
                                className="expanded-photo"
                                onError={(e) => {
                                  console.error("Failed to load image:", e.target.src);
                                  e.target.style.display = 'none';
                                }}
                                onLoad={() => {
                                  console.log("✅ Image loaded successfully");
                                }}
                              />
                            )}
                            <div>
                              {availableFields.map((field) => (
                                <p key={field}>
                                  <strong>{fieldLabels[field]}:</strong>{" "}
                                  {field === "dob"
                                    ? formatDate(person[field])
                                    : (person[field] || "-")}
                                </p>
                              ))}
                            </div>
                          </div>

                          <div className="action-buttons">
                            <button
                              onClick={() => handleEdit(person)}
                              className="edit-btn"
                            >
                              ✏ Edit
                            </button>
                            <button
                              onClick={() =>
                                setShowFieldSelection(
                                  showFieldSelection === person._id
                                    ? false
                                    : person._id
                                )
                              }
                              className="pdf-btn"
                              disabled={pdfLoading}
                            >
                              {pdfLoading ? "🔄 Generating..." : "📄 Download PDF"}
                            </button>
                            <button
                              onClick={() => handleDelete(person._id)}
                              className="delete-btn"
                            >
                              🗑 Delete
                            </button>
                          </div>

                          {showFieldSelection === person._id && (
                            <div className="field-selection">
                              <p className="field-selection-title">
                                Select fields to include:
                              </p>
                              <div className="field-checkboxes">
                                {availableFields.map((field) => (
                                  <label key={field} className="checkbox-label">
                                    <input
                                      type="checkbox"
                                      checked={selectedFields.includes(field)}
                                      onChange={() => toggleField(field)}
                                    />
                                    <span>{fieldLabels[field]}</span>
                                  </label>
                                ))}
                              </div>
                              <div className="pdf-actions">
                                <button
                                  onClick={() => handleDownloadStyledPDF(person._id)}
                                  className="generate-btn"
                                  disabled={pdfLoading || selectedFields.length === 0}
                                >
                                  {pdfLoading ? "🔄 Generating PDF..." : "✅ Generate PDF"}
                                </button>
                                <button
                                  onClick={() => setShowFieldSelection(false)}
                                  className="cancel-btn"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="edit-form">
                          <input
                            name="name"
                            value={formData.name || ""}
                            onChange={handleChange}
                            placeholder="Name"
                          />
                          {availableFields.map((field) => (
                            <input
                              key={field}
                              name={field}
                              value={formData[field] || ""}
                              onChange={handleChange}
                              placeholder={fieldLabels[field]}
                            />
                          ))}

                          <div className="edit-actions">
                            <button
                              onClick={handleConfirmEdit}
                              disabled={loading}
                              className="save-btn"
                            >
                              {loading ? "Saving..." : "Confirm Changes"}
                            </button>
                            <button
                              onClick={() => setEditMode(false)}
                              className="cancel-btn"
                            >
                              Cancel
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
      )}
    </div>
  );
};

export default PeopleList;