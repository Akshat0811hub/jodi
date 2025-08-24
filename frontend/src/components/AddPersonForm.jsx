// src/components/AddPersonFormModal.jsx - SUPABASE ENHANCED VERSION
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

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

    // Enhanced validation
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type)
    );
    const oversizedFiles = files.filter((file) => file.size > maxSize);

    if (invalidFiles.length > 0) {
      setError(
        `Invalid file types: ${invalidFiles
          .map((f) => f.name)
          .join(", ")}. Please select JPEG, PNG, GIF, or WebP images only.`
      );
      return;
    }

    if (oversizedFiles.length > 0) {
      setError(
        `Files too large: ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}. Each file must be under 5MB.`
      );
      return;
    }

    if (files.length > 4) {
      setError("You can upload maximum 4 photos. Please select fewer files.");
      return;
    }

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
    setUploadingPhotos(true);
    setUploadProgress(0);

    try {
      // Enhanced validation
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

      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const invalidFiles = photos.filter(
        (photo) => !validTypes.includes(photo.type)
      );
      if (invalidFiles.length > 0) {
        setError("Please upload only image files (JPEG, PNG, GIF, WebP)");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      const oversizedFiles = photos.filter((photo) => photo.size > maxSize);
      if (oversizedFiles.length > 0) {
        setError("Each photo must be less than 5MB");
        return;
      }
      console.log(
        "📤 Form data being sent:",
        Object.fromEntries(
          Object.keys(formData).map((key) => [key, formData[key]])
        )
      );

      // Create FormData
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        // Convert boolean strings to actual booleans
        if (key === "horoscope" || key === "nri" || key === "vehicle") {
          data.append(
            key,
            value === "true" ? true : value === "false" ? false : ""
          );
        } else {
          data.append(key, value || "");
        }
      });

      if (siblings.length > 0) {
        data.append("siblings", JSON.stringify(siblings));
      } else {
        data.append("siblings", JSON.stringify([]));
      }

      // Add photos with progress tracking
      photos.forEach((photo, index) => {
        console.log(`📸 Adding photo ${index + 1} to FormData:`, {
          name: photo.name,
          size: `${(photo.size / 1024 / 1024).toFixed(2)}MB`,
          type: photo.type,
        });
        data.append("photos", photo);
      });

      console.log("🚀 Uploading photos to Supabase and creating person...");
      setUploadProgress(25);

      // Make API request with progress tracking
      const response = await api.post("/people", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000, // Increased timeout for cloud uploads
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
          console.log(`📊 Upload progress: ${percentCompleted}%`);
        },
      });

      console.log(
        "✅ Person added successfully with Supabase photos:",
        response.data
      );

      // Show success info
      if (response.data.photoUrls && response.data.photoUrls.length > 0) {
        console.log("🖼️ Photo URLs:", response.data.photoUrls);
        console.log("📊 Upload summary:", {
          totalPhotos: response.data.photosUploaded || photos.length,
          storageType: "Supabase Storage (Free Tier)",
          persistent: "Yes - survives server restarts",
        });
      }

      setUploadingPhotos(false);
      onPersonAdded();
      onClose();
    } catch (err) {
      console.error("❌ API Error Details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
      });

      setUploadingPhotos(false);
      setUploadProgress(0);

      // Enhanced error handling for Supabase-specific errors
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 400) {
        setError(
          "Invalid data provided. Please check all fields and try again."
        );
      } else if (err.response?.status === 413) {
        setError("Files too large. Please reduce image sizes and try again.");
      } else if (err.response?.status === 429) {
        setError("Too many requests. Please wait a moment and try again.");
      } else if (err.response?.status === 500) {
        setError(
          "Storage service temporarily unavailable. Please try again in a few minutes."
        );
      } else if (err.message.includes("timeout")) {
        setError(
          "Upload taking too long. Please check your internet connection and try again."
        );
      } else if (err.message.includes("Network Error")) {
        setError(
          "Network connection issue. Please check your internet and try again."
        );
      } else {
        setError("Failed to add person. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
      setUploadingPhotos(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>✨ Add New Person</h2>
          <button
            className="close-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        {error && <div className="error-text">{error}</div>}

        {/* Upload Progress Indicator */}
        {uploadingPhotos && (
          <div className="upload-progress">
            <div className="progress-info">
              <span>🚀 Uploading to Supabase Cloud Storage...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="progress-note">
              📤 Photos are being stored permanently in cloud storage
            </p>
          </div>
        )}

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
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={isSubmitting}
              >
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <input
                name="nativePlace"
                placeholder="Native Place"
                value={formData.nativePlace}
                onChange={handleChange}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <input
                name="religion"
                placeholder="Religion *"
                value={formData.religion}
                onChange={handleChange}
                required
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <input
                name="height"
                placeholder="Height (e.g., 5'8'')"
                value={formData.height}
                onChange={handleChange}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <select
                name="horoscope"
                value={formData.horoscope}
                onChange={handleChange}
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
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <input
                name="drinkingHabits"
                placeholder="Drinking Habits"
                value={formData.drinkingHabits}
                onChange={handleChange}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <input
                name="disability"
                placeholder="Physical Disability (if any)"
                value={formData.disability}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <select
                name="nri"
                value={formData.nri}
                onChange={handleChange}
                disabled={isSubmitting}
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
                onChange={ handleChange }
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <input
                name="fatherOccupation"
                placeholder="Father's Occupation"
                value={formData.fatherOccupation}
                onChange={handleChange}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <input
                name="motherName"
                placeholder="Mother's Name"
                value={formData.motherName}
                onChange={handleChange}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <input
                name="residence"
                placeholder="Current Residence"
                value={formData.residence}
                onChange={handleChange}
                disabled={isSubmitting}
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
              disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
              <input
                placeholder="Relation"
                value={s.relation}
                onChange={(e) =>
                  handleSiblingChange(idx, "relation", e.target.value)
                }
                disabled={isSubmitting}
              />
              <input
                placeholder="Age"
                type="number"
                value={s.age}
                onChange={(e) =>
                  handleSiblingChange(idx, "age", e.target.value)
                }
                disabled={isSubmitting}
              />
              <input
                placeholder="Profession"
                value={s.profession}
                onChange={(e) =>
                  handleSiblingChange(idx, "profession", e.target.value)
                }
                disabled={isSubmitting}
              />
              <select
                value={s.maritalStatus}
                onChange={(e) =>
                  handleSiblingChange(idx, "maritalStatus", e.target.value)
                }
                disabled={isSubmitting}
              >
                <option value="">Status</option>
                <option>Single</option>
                <option>Married</option>
              </select>
              <button
                type="button"
                onClick={() => removeSibling(idx)}
                disabled={isSubmitting}
              >
                🗑️
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSibling}
            className="add-sibling-btn"
            disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                name="graduation"
                placeholder="Graduation Details"
                value={formData.graduation}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <input
                name="schooling"
                placeholder="School/Board"
                value={formData.schooling}
                onChange={handleChange}
                disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                name="personalIncome"
                placeholder="Personal Income (Annual)"
                value={formData.personalIncome}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <input
                name="familyIncome"
                placeholder="Family Income (Annual)"
                value={formData.familyIncome}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Enhanced Photos Section */}
          <h3>
            📸 Photos (1-4 photos required) *
            <span className="storage-info">
              🌟 Stored safely in Supabase Cloud
            </span>
          </h3>
          <div className="photo-upload-section">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handlePhotoChange}
              className="photo-input"
              required
              disabled={isSubmitting}
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
                📝 Supported: JPEG, PNG, GIF, WebP (Max 5MB each)
              </p>
              <div className="storage-benefits">
                <p className="storage-benefit">
                  ☁️ Permanently stored in Supabase
                </p>
                <p className="storage-benefit">
                  ⚡ Fast global delivery via CDN
                </p>
                <p className="storage-benefit">💾 Survives server restarts</p>
              </div>
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
              {isSubmitting
                ? uploadingPhotos
                  ? "☁️ Uploading Photos..."
                  : "✨ Processing..."
                : "🚀 Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPersonForm;
