// src/components/PeopleList.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import { generateUserPDF } from "../utils/pdfUtils";
import "../css/peopleList.css"

const availableFields = [
  "age",
  "height",
  "gender",
  "religion",
  "caste",
  "maritalStatus",
  "state",
  "country",
  "area"
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
  area: "Area"
};

const PeopleList = ({ filters }) => {
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showFieldSelection, setShowFieldSelection] = useState(false);
  const [selectedFields, setSelectedFields] = useState([...availableFields]);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const params = new URLSearchParams(filters).toString();
        const res = await api.get(`/people?${params}`);
        setPeople(res.data);
      } catch (err) {
        console.error("Failed to fetch people", err);
      }
    };

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
            onClick={() => setSelectedPerson(person)}
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
                  <strong>{fieldLabels[field]}:</strong> {selectedPerson[field]}
                </li>
              ))}
            </ul>

            <button
              onClick={() => setShowFieldSelection(!showFieldSelection)}
              className="download-btn"
            >
              📄 Download PDF
            </button>

            {showFieldSelection && (
              <div className="field-selection">
                <p className="field-selection-title">Select fields to include:</p>
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
                <button
                  onClick={handleDownload}
                  className="generate-btn"
                >
                  ✅ Generate PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleList;
