// src/components/AddPersonForm.jsx
import React, { useState } from "react";
import api from "../api";
import "../css/addPerson.css";

const AddPersonForm = ({ onClose, onPersonAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    height: "",
    religion: "",
    caste: "",
    maritalStatus: "",
    gender: "",
    state: "",
    country: "",
    area: "",
  });

  const [showOther, setShowOther] = useState({});
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");

  const predefinedOptions = {
    religion: ["Hindu", "Muslim", "Christian", "Sikh"],
    caste: ["Brahmin", "Rajput", "SC", "ST", "OBC"],
    maritalStatus: ["Single", "Married", "Divorced", "Widowed"],
    gender: ["Male", "Female"],
    state: ["Uttar Pradesh", "Maharashtra", "Bihar", "Delhi"],
    country: ["India", "USA", "UK", "Canada"],
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value === "Other") {
      setShowOther({ ...showOther, [name]: true });
    } else {
      setShowOther({ ...showOther, [name]: false });
    }
  };

  const handleOtherChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (photos.length <= 2) {
      setError("Please upload at least 3 photos.");
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      photos.forEach((photo) => data.append("photos", photo));

      await api.post("/people", data);
      onPersonAdded();
      onClose();
    } catch (err) {
      setError("Failed to add person");
      console.error(err);
    }
  };

  return (
    <div className="addperson-container">
      <h2 className="form-title">Add New Person</h2>
      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSubmit} className="person-form">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
        />

        <input
          type="number"
          name="height"
          placeholder="Height (cm)"
          value={formData.height}
          onChange={handleChange}
        />

        {Object.keys(predefinedOptions).map((field) => (
          <div key={field}>
            <select
              name={field}
              value={formData[field]}
              onChange={handleChange}
            >
              <option value="">Select {field}</option>
              {predefinedOptions[field].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
            {showOther[field] && (
              <input
                type="text"
                placeholder={`Enter ${field}`}
                value={formData[field]}
                onChange={(e) => handleOtherChange(field, e.target.value)}
              />
            )}
          </div>
        ))}

        <input
          type="text"
          name="area"
          placeholder="Area"
          value={formData.area}
          onChange={handleChange}
        />

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setPhotos(Array.from(e.target.files))}
        />

        <div className="form-buttons">
          <button type="button" onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPersonForm;
