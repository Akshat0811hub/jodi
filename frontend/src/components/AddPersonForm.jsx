// src/components/AddPersonFormModal.jsx - FIXED VERSION (1-4 Photos Support)
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

  // ✅ FIXED: Photo handler for 1-4 photos
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    console.log("📸 Files selected:", files.length);
    console.log(
      "📸 File details:",
      files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );
    setPhotos(files);
    setError(""); // Clear any previous photo errors
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

      // ✅ FIXED: Photo validation for 1-4 photos (minimum 1, maximum 4)
      console.log("📸 Photo validation - Current photos:", photos);
      console.log("📸 Photos length:", photos.length);
      console.log("📸 Photos array:", Array.isArray(photos));

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

      // ✅ Validate file types
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      const invalidFiles = photos.filter(
        (photo) => !validTypes.includes(photo.type)
      );
      if (invalidFiles.length > 0) {
        setError("Please upload only image files (JPEG, PNG, GIF)");
        return;
      }

      // ✅ Validate file sizes (max 5MB each)
      const maxSize = 5 * 1024 * 1024; // 5MB
      const oversizedFiles = photos.filter((photo) => photo.size > maxSize);
      if (oversizedFiles.length > 0) {
        setError("Each photo must be less than 5MB");
        return;
      }

      const data = new FormData();

      // Append form data
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      // ✅ Handle siblings
      if (siblings.length > 0) {
        data.append("siblings", JSON.stringify(siblings));
      } else {
        data.append("siblings", JSON.stringify([]));
      }

      // ✅ IMPROVED: Append photos with detailed logging
      console.log("📤 Appending photos to FormData:");
      photos.forEach((photo, index) => {
        console.log(`📸 Photo ${index + 1}:`, {
          name: photo.name,
          size: `${(photo.size / 1024 / 1024).toFixed(2)}MB`,
          type: photo.type,
        });
        data.append("photos", photo);
      });

      // ✅ Debug: Log FormData contents
      console.log("📤 FormData contents:");
      for (let [key, value] of data.entries()) {
        if (key === "photos") {
          console.log(key, "FILE:", value.name, value.size, value.type);
        } else {
          console.log(key, value);
        }
      }

      console.log("📤 Sending request to /people endpoint...");
      const response = await api.post("/people", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60 second timeout for file upload
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
          <h2>Add New Person</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="error-text">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Personal Details */}
          <h3>Personal Details</h3>
          <input
            name="name"
            placeholder="Name *"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <select name="gender" value={formData.gender} onChange={handleChange}>
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>
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
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
          />
          <input
            name="birthPlaceTime"
            placeholder="Place of Birth & Time"
            value={formData.birthPlaceTime}
            onChange={handleChange}
          />
          <input
            name="nativePlace"
            placeholder="Native Place"
            value={formData.nativePlace}
            onChange={handleChange}
          />
          <input
            name="gotra"
            placeholder="Gotra"
            value={formData.gotra}
            onChange={handleChange}
          />
          <input
            name="religion"
            placeholder="Religion *"
            value={formData.religion}
            onChange={handleChange}
            required
          />
          <input
            name="phoneNumber"
            placeholder="Ph No *"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />
          <input
            name="height"
            placeholder="Height"
            value={formData.height}
            onChange={handleChange}
          />
          <input
            name="complexion"
            placeholder="Complexion"
            value={formData.complexion}
            onChange={handleChange}
          />
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
          <input
            name="eatingHabits"
            placeholder="Eating Habits"
            value={formData.eatingHabits}
            onChange={handleChange}
          />
          <input
            name="drinkingHabits"
            placeholder="Drinking Habits"
            value={formData.drinkingHabits}
            onChange={handleChange}
          />
          <input
            name="smokingHabits"
            placeholder="Smoking Habits"
            value={formData.smokingHabits}
            onChange={handleChange}
          />
          <input
            name="disability"
            placeholder="Physical Disability"
            value={formData.disability}
            onChange={handleChange}
          />
          <select
            name="nri"
            value={formData.nri}
            onChange={(e) =>
              setFormData({ ...formData, nri: e.target.value === "true" })
            }
          >
            <option value="">NRI?</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>

          <select
            name="vehicle"
            value={formData.vehicle}
            onChange={(e) =>
              setFormData({ ...formData, vehicle: e.target.value === "true" })
            }
          >
            <option value="">Vehicle?</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>

          {/* Family Details */}
          <h3>Family Details</h3>
          <input
            name="fatherName"
            placeholder="Father Name"
            value={formData.fatherName}
            onChange={handleChange}
          />
          <input
            name="fatherOccupation"
            placeholder="Father Occupation Detail"
            value={formData.fatherOccupation}
            onChange={handleChange}
          />
          <input
            name="fatherOffice"
            placeholder="Father Office Detail"
            value={formData.fatherOffice}
            onChange={handleChange}
          />
          <input
            name="motherName"
            placeholder="Mother Name"
            value={formData.motherName}
            onChange={handleChange}
          />
          <input
            name="motherOccupation"
            placeholder="Mother Occupation"
            value={formData.motherOccupation}
            onChange={handleChange}
          />
          <input
            name="residence"
            placeholder="Residence"
            value={formData.residence}
            onChange={handleChange}
          />
          <input
            name="otherProperty"
            placeholder="Other Property"
            value={formData.otherProperty}
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
            value={formData.higherQualification}
            onChange={handleChange}
          />
          <input
            name="graduation"
            placeholder="Graduation"
            value={formData.graduation}
            onChange={handleChange}
          />
          <input
            name="schooling"
            placeholder="Schooling"
            value={formData.schooling}
            onChange={handleChange}
          />

          {/* Profession & Income */}
          <h3>Profession & Income</h3>
          <textarea
            name="occupation"
            placeholder="Occupation / Business Details"
            value={formData.occupation}
            onChange={handleChange}
          ></textarea>
          <input
            name="personalIncome"
            placeholder="Personal Income"
            value={formData.personalIncome}
            onChange={handleChange}
          />
          <input
            name="familyIncome"
            placeholder="Family Income"
            value={formData.familyIncome}
            onChange={handleChange}
          />

          {/* ✅ FIXED: Photos Section (1-4 photos) */}
          <h3>Photos (1-4 photos allowed) *</h3>
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
                  ✅ Selected: {photos.length} photo(s)
                  {photos.length >= 1 && photos.length <= 4 && " (Valid)"}
                </p>
                <ul className="photos-list">
                  {Array.from(photos).map((file, index) => (
                    <li key={index} className="photo-item">
                      📸 {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
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
                • Minimum 1 photo required {photos.length >= 1 ? "✅" : "❌"}
              </p>
              <p
                className={`requirement ${
                  photos.length <= 4 ? "valid" : "invalid"
                }`}
              >
                • Maximum 4 photos allowed {photos.length <= 4 ? "✅" : "❌"}
              </p>
              <p className="requirement-note">
                • Supported formats: JPEG, PNG, GIF (Max 5MB each)
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
              {isSubmitting ? "Adding..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPersonForm;