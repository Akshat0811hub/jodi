// src/components/AddPersonFormModal.jsx
import React, { useState } from "react";
import api from "../api";
import "../css/addPerson.css";

const AddPersonForm = ({ onClose, onPersonAdded }) => {
  const [formData, setFormData] = useState({
    // Personal Details
    name: "",
    gender: "",
    maritalStatus: "",
    dob: "",
    birthPlaceTime: "",
    nativePlace: "",
    gotra: "",
    height: "",
    complexion: "",
    horoscope: "",
    eatingHabits: "",
    drinkingHabits: "",
    smokingHabits: "",
    disability: "",
    nri: "",
    vehicle: "",
    // Family Details
    fatherName: "",
    fatherOccupation: "",
    fatherOffice: "",
    motherName: "",
    motherOccupation: "",
    residence: "",
    otherProperty: "",
    // Education
    higherQualification: "",
    graduation: "",
    schooling: "",
    // Profession & Income
    occupation: "",
    personalIncome: "",
    familyIncome: "",
  });

  const [siblings, setSiblings] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSiblingChange = (index, field, value) => {
    const updated = [...siblings];
    updated[index][field] = value;
    setSiblings(updated);
  };

  const addSibling = () => {
    setSiblings([
      ...siblings,
      { name: "", relation: "", age: "", profession: "", maritalStatus: "" },
    ]);
  };

  const removeSibling = (index) => {
    setSiblings(siblings.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ Basic validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.religion.trim()) {
      setError("Religion is required");
      return;
    }
    if (!formData.phoneNumber?.trim()) {
      setError("Phone Number is required");
      return;
    }
    if (!/^\d{1,10}$/.test(formData.phoneNumber.trim())) {
      setError("Phone Number must be numeric and max 10 digits");
      return;
    }

    // ✅ Photo validation (minimum 3)
    if (photos.length < 3) {
      setError("Please upload at least 3 photos.");
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));

      // ✅ Allow empty siblings
      if (siblings.length > 0) {
        data.append("siblings", JSON.stringify(siblings));
      } else {
        data.append("siblings", JSON.stringify([]));
      }

      photos.forEach((photo) => data.append("photos", photo));

      // Debug log
      console.log("📤 Sending FormData to backend:");
      for (let [key, value] of data.entries()) {
        console.log(key, value);
      }

      await api.post("/people", data);
      onPersonAdded();
      onClose();
    } catch (err) {
      setError("Failed to add person");
      console.error("❌ API Error:", err.response?.data || err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Add New Person</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Personal Details */}
          <h3>Personal Details</h3>
          <input
            name="name"
            placeholder="Name"
            onChange={handleChange}
            required
          />
          <select name="gender" onChange={handleChange}>
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>
          <select name="maritalStatus" onChange={handleChange}>
            <option value="">Marital Status</option>
            <option>Never Married</option>
            <option>Married</option>
            <option>Divorced</option>
            <option>Widowed</option>
          </select>
          <input type="date" name="dob" onChange={handleChange} />
          <input
            name="birthPlaceTime"
            placeholder="Place of Birth & Time"
            onChange={handleChange}
          />
          <input
            name="nativePlace"
            placeholder="Native Place"
            onChange={handleChange}
          />
          <input name="gotra" placeholder="Gotra" onChange={handleChange} />
          <input
            name="religion"
            placeholder="Religion"
            onChange={handleChange}
          />
          <input
            name="phoneNumber"
            placeholder="Ph No"
            onChange={handleChange}
          />
          <input name="height" placeholder="Height" onChange={handleChange} />
          <input
            name="complexion"
            placeholder="Complexion"
            onChange={handleChange}
          />
          <select name="horoscope" onChange={handleChange}>
            <option value="">Believe in Horoscopes?</option>
            <option>Yes</option>
            <option>No</option>
          </select>
          <input
            name="eatingHabits"
            placeholder="Eating Habits"
            onChange={handleChange}
          />
          <input
            name="drinkingHabits"
            placeholder="Drinking Habits"
            onChange={handleChange}
          />
          <input
            name="smokingHabits"
            placeholder="Smoking Habits"
            onChange={handleChange}
          />
          <input
            name="disability"
            placeholder="Physical Disability"
            onChange={handleChange}
          />
          <select name="nri" onChange={handleChange}>
            <option value="">NRI?</option>
            <option>Yes</option>
            <option>No</option>
          </select>
          <select name="vehicle" onChange={handleChange}>
            <option value="">Vehicle?</option>
            <option>Yes</option>
            <option>No</option>
          </select>

          {/* Family Details */}
          <h3>Family Details</h3>
          <input
            name="fatherName"
            placeholder="Father Name"
            onChange={handleChange}
          />
          <input
            name="fatherOccupation"
            placeholder="Father Occupation Detail"
            onChange={handleChange}
          />
          <input
            name="fatherOffice"
            placeholder="Father Office Detail"
            onChange={handleChange}
          />
          <input
            name="motherName"
            placeholder="Mother Name"
            onChange={handleChange}
          />
          <input
            name="motherOccupation"
            placeholder="Mother Occupation"
            onChange={handleChange}
          />
          <input
            name="residence"
            placeholder="Residence"
            onChange={handleChange}
          />
          <input
            name="otherProperty"
            placeholder="Other Property"
            onChange={handleChange}
          />

          {/* Siblings */}
          <h4>Siblings & Family Members</h4>
          {siblings.map((s, idx) => (
            <div key={idx} className="sibling-row">
              <input
                placeholder="Name"
                value={s.name}
                onChange={(e) =>
                  handleSiblingChange(idx, "name", e.target.value)
                }
              />
              <input
                placeholder="Relation"
                value={s.relation}
                onChange={(e) =>
                  handleSiblingChange(idx, "relation", e.target.value)
                }
              />
              <input
                placeholder="Age"
                value={s.age}
                onChange={(e) =>
                  handleSiblingChange(idx, "age", e.target.value)
                }
              />
              <input
                placeholder="Profession"
                value={s.profession}
                onChange={(e) =>
                  handleSiblingChange(idx, "profession", e.target.value)
                }
              />
              <input
                placeholder="Marital Status"
                value={s.maritalStatus}
                onChange={(e) =>
                  handleSiblingChange(idx, "maritalStatus", e.target.value)
                }
              />
              <button type="button" onClick={() => removeSibling(idx)}>
                ❌
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSibling}
            className="add-sibling-btn"
          >
            + Add Sibling
          </button>

          {/* Education */}
          <h3>Education</h3>
          <input
            name="higherQualification"
            placeholder="Higher Qualification"
            onChange={handleChange}
          />
          <input
            name="graduation"
            placeholder="Graduation"
            onChange={handleChange}
          />
          <input
            name="schooling"
            placeholder="Schooling"
            onChange={handleChange}
          />

          {/* Profession & Income */}
          <h3>Profession & Income</h3>
          <textarea
            name="occupation"
            placeholder="Occupation / Business Details"
            onChange={handleChange}
          ></textarea>
          <input
            name="personalIncome"
            placeholder="Personal Income"
            onChange={handleChange}
          />
          <input
            name="familyIncome"
            placeholder="Family Income"
            onChange={handleChange}
          />

          {/* Photos */}
          <h3>Photos</h3>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setPhotos(Array.from(e.target.files))}
          />

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPersonForm;
