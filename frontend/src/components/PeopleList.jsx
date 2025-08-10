// src/components/PeopleList.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import { generateUserPDF } from "../utils/pdfUtils";
import "../css/peopleList.css";

const availableFields = [
  "age",
  "height",
  "gender",
  "religion",
  "caste",
  "maritalStatus",
  "state",
  "country",
  "area",
];

const fieldLabels = {
  age: "Age",
  height: "Height",
  gender: "Gender",
  religion: "Religion",
  caste: "Caste",
  maritalStatus: "Marital Status",
  state: "State",
  country: "Country",
  area: "Area",
};

const PeopleList = ({ filters }) => {
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showFieldSelection, setShowFieldSelection] = useState(false);
  const [selectedFields, setSelectedFields] = useState([...availableFields]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchPeople = async () => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/people?${params}`);
      setPeople(res.data);
    } catch (err) {
      console.error("Failed to fetch people", err);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [filters]);

  const toggleField = (field) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

  const handleDownload = () => {
    if (selectedPerson && selectedFields.length > 0) {
      generateUserPDF(selectedPerson, selectedFields);
      setShowFieldSelection(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this person?")) {
      try {
        await api.delete(`/people/${id}`);
        alert("Person deleted successfully");
        fetchPeople();
        setSelectedPerson(null);
      } catch (error) {
        console.error("Error deleting person:", error);
        alert("Failed to delete person");
      }
    }
  };

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

    // Send updated person data to backend
    await api.put(`/people/${selectedPerson._id}`, formData);

    // Update the people state so UI refreshes
    setPeople(prevPeople =>
      prevPeople.map(p =>
        p._id === selectedPerson._id ? { ...p, ...formData } : p
      )
    );

    // Update the selected person in modal
    setSelectedPerson(prev => ({ ...prev, ...formData }));

    setEditMode(false);
  } catch (err) {
    console.error("Error updating person:", err);
    alert("Failed to update person");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="people-container">
      <h2 className="people-heading">
        Showing {people.length} person{people.length !== 1 && "s"}
      </h2>

      <div className="people-grid">
        {people.map((person) => (
          <div
            key={person._id}
            className="person-card"
            onClick={() => {
              setSelectedPerson(person);
              setEditMode(false);
            }}
          >
            {person.photos?.length > 0 && (
              <img
                src={`http://localhost:5000/uploads/${person.photos[0]}`}
                alt={person.name}
                className="person-photo"
              />
            )}
            <div className="person-name-container">
              <p className="person-name">{person.name}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedPerson && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              onClick={() => {
                setSelectedPerson(null);
                setShowFieldSelection(false);
              }}
              className="modal-close"
            >
              ✖
            </button>

            {!editMode ? (
              <>
                <h3 className="modal-title">{selectedPerson.name}</h3>
                <div className="modal-photos">
                  {selectedPerson.photos?.map((p, i) => (
                    <img
                      key={i}
                      src={`http://localhost:5000/uploads/${p}`}
                      alt="person pic"
                      className="modal-photo"
                    />
                  ))}
                </div>

                <ul className="modal-details">
                  {availableFields.map((field) => (
                    <li key={field}>
                      <strong>{fieldLabels[field]}:</strong>{" "}
                      {selectedPerson[field]}
                    </li>
                  ))}
                </ul>

                <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleEdit(selectedPerson)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    ✏ Edit
                  </button>

                  <button
                    onClick={() => setShowFieldSelection(!showFieldSelection)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    📄 Download PDF
                  </button>

                  <button
                    onClick={() => handleDelete(selectedPerson._id)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    🗑 Delete
                  </button>
                </div>

                {showFieldSelection && (
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
                    <button onClick={handleDownload} className="generate-btn">
                      ✅ Generate PDF
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="modal-title">Edit Person</h3>
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
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button
                    onClick={handleConfirmEdit}
                    disabled={loading}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    {loading ? "Saving..." : "Confirm Changes"}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleList;
