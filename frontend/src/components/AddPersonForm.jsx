// src/components/AddPersonFormModal.jsx - ENHANCED RICH MODERN VERSION
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
    religion: "",
    phoneNumber: "",
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    console.log("📸 Files selected:", files.length);
    console.log(
      "📸 File details:",
      files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );
    setPhotos(files);
    setError("");
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
    setIsSubmitting(true);

    try {
      // Validation
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

      // Photo validation
      if (!photos || !Array.isArray(photos) || photos.length < 1) {
        setError(
          `Please upload at least 1 photo. Currently selected: ${
            photos ? photos.length : 0
          }`
        );
        return;
      }
      if (photos.length > 4) {
        setError("You can upload a maximum of 4 photos.");
        return;
      }

      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      const invalidFiles = photos.filter(
        (photo) => !validTypes.includes(photo.type)
      );
      if (invalidFiles.length > 0) {
        setError("Please upload only image files (JPEG, PNG, GIF)");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      const oversizedFiles = photos.filter((photo) => photo.size > maxSize);
      if (oversizedFiles.length > 0) {
        setError("Each photo must be less than 5MB");
        return;
      }

      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      if (siblings.length > 0) {
        data.append("siblings", JSON.stringify(siblings));
      } else {
        data.append("siblings", JSON.stringify([]));
      }

      photos.forEach((photo, index) => {
        console.log(`📸 Photo ${index + 1}:`, {
          name: photo.name,
          size: `${(photo.size / 1024 / 1024).toFixed(2)}MB`,
          type: photo.type,
        });
        data.append("photos", photo);
      });

      console.log("📤 Sending request to /people endpoint...");
      const response = await api.post("/people", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
      });

      console.log("✅ Person added successfully:", response.data);
      onPersonAdded();
      onClose();
    } catch (err) {
      console.error("❌ API Error Details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
      });

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 400) {
        setError("Invalid data provided. Please check all fields.");
      } else if (err.response?.status === 413) {
        setError("Files too large. Please reduce image sizes.");
      } else {
        setError("Failed to add person. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>✨ Add New Person</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="error-text">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Personal Details Section */}
          <h3>👤 Personal Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <input
                name="name"
                placeholder="Full Name *"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <select
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleChange}
              >
                <option value="">Marital Status</option>
                <option>Never Married</option>
                <option>Married</option>
                <option>Divorced</option>
                <option>Widowed</option>
              </select>
            </div>
            <div className="form-group">
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                name="birthPlaceTime"
                placeholder="Place of Birth & Time"
                value={formData.birthPlaceTime}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <input
                name="nativePlace"
                placeholder="Native Place"
                value={formData.nativePlace}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                name="gotra"
                placeholder="Gotra"
                value={formData.gotra}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <input
                name="religion"
                placeholder="Religion *"
                value={formData.religion}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                name="phoneNumber"
                placeholder="Phone Number *"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                name="height"
                placeholder="Height (e.g., 5'8'')"
                value={formData.height}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                name="complexion"
                placeholder="Complexion"
                value={formData.complexion}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <select
                name="horoscope"
                value={formData.horoscope}
                onChange={(e) =>
                  setFormData({ ...formData, horoscope: e.target.value === "true" })
                }
              >
                <option value="">Believe in Horoscopes?</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                name="eatingHabits"
                placeholder="Eating Habits (Veg/Non-Veg)"
                value={formData.eatingHabits}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <input
                name="drinkingHabits"
                placeholder="Drinking Habits"
                value={formData.drinkingHabits}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                name="smokingHabits"
                placeholder="Smoking Habits"
                value={formData.smokingHabits}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <input
                name="disability"
                placeholder="Physical Disability (if any)"
                value={formData.disability}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <select
                name="nri"
                value={formData.nri}
                onChange={(e) =>
                  setFormData({ ...formData, nri: e.target.value === "true" })
                }
              >
                <option value="">NRI Status</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="form-group">
              <select
                name="vehicle"
                value={formData.vehicle}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle: e.target.value === "true" })
                }
              >
                <option value="">Own Vehicle?</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          {/* Family Details Section */}
          <h3>👨‍👩‍👧‍👦 Family Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <input
                name="fatherName"
                placeholder="Father's Name"
                value={formData.fatherName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <input
                name="fatherOccupation"
                placeholder="Father's Occupation"
                value={formData.fatherOccupation}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                name="fatherOffice"
                placeholder="Father's Office/Business"
                value={formData.fatherOffice}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <input
                name="motherName"
                placeholder="Mother's Name"
                value={formData.motherName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                name="motherOccupation"
                placeholder="Mother's Occupation"
                value={formData.motherOccupation}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <input
                name="residence"
                placeholder="Current Residence"
                value={formData.residence}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <textarea
              name="otherProperty"
              placeholder="Other Properties/Assets"
              value={formData.otherProperty}
              onChange={handleChange}
              rows="3"
            />
          </div>

          {/* Siblings Section */}
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
                type="number"
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
              <select
                value={s.maritalStatus}
                onChange={(e) =>
                  handleSiblingChange(idx, "maritalStatus", e.target.value)
                }
              >
                <option value="">Status</option>
                <option>Single</option>
                <option>Married</option>
              </select>
              <button type="button" onClick={() => removeSibling(idx)}>
                🗑️
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSibling}
            className="add-sibling-btn"
          >
            Add Family Member
          </button>

          {/* Education Section */}
          <h3>🎓 Education</h3>
          
          <div className="form-group">
            <input
              name="higherQualification"
              placeholder="Higher Qualification (Masters, PhD, etc.)"
              value={formData.higherQualification}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                name="graduation"
                placeholder="Graduation Details"
                value={formData.graduation}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <input
                name="schooling"
                placeholder="School/Board"
                value={formData.schooling}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Profession & Income Section */}
          <h3>💼 Profession & Income</h3>
          
          <div className="form-group">
            <textarea
              name="occupation"
              placeholder="Occupation/Business Details"
              value={formData.occupation}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                name="personalIncome"
                placeholder="Personal Income (Annual)"
                value={formData.personalIncome}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <input
                name="familyIncome"
                placeholder="Family Income (Annual)"
                value={formData.familyIncome}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Photos Section */}
          <h3>📸 Photos (1-4 photos required) *</h3>
          <div className="photo-upload-section">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoChange}
              className="photo-input"
              required
            />

            {photos.length > 0 && (
              <div className="selected-photos-info">
                <p className="photos-count">
                  📷 Selected: {photos.length} photo(s)
                  {photos.length >= 1 && photos.length <= 4 && " ✨ Perfect!"}
                </p>
                <ul className="photos-list">
                  {Array.from(photos).map((file, index) => (
                    <li key={index} className="photo-item">
                      🖼️ {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="photo-requirements">
              <p
                className={`requirement ${
                  photos.length >= 1 ? "valid" : "invalid"
                }`}
              >
                Minimum 1 photo required {photos.length >= 1 ? "✅" : "❌"}
              </p>
              <p
                className={`requirement ${
                  photos.length <= 4 ? "valid" : "invalid"
                }`}
              >
                Maximum 4 photos allowed {photos.length <= 4 ? "✅" : "❌"}
              </p>
              <p className="requirement-note">
                📝 Supported: JPEG, PNG, GIF (Max 5MB each)
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "✨ Adding Person..." : "🚀 Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPersonForm;