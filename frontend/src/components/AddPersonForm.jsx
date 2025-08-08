// src/components/AddPersonForm.jsx
import React, { useState } from "react";
import api from "../api";

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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4">Add New Person</h2>
        {error && <p className="text-red-600 mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border p-2"
          />

          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
            className="w-full border p-2"
          />

          <input
            type="number"
            name="height"
            placeholder="Height (cm)"
            value={formData.height}
            onChange={handleChange}
            className="w-full border p-2"
          />

          {Object.keys(predefinedOptions).map((field) => (
            <div key={field}>
              <select
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="w-full border p-2"
              >
                <option value="">Select {field}</option>
                {predefinedOptions[field].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="Other">Other</option>
              </select>
              {showOther[field] && (
                <input
                  type="text"
                  placeholder={`Enter ${field}`}
                  value={formData[field]}
                  onChange={(e) => handleOtherChange(field, e.target.value)}
                  className="w-full border p-2 mt-1"
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
            className="w-full border p-2"
          />

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setPhotos(Array.from(e.target.files))}
            className="w-full border p-2"
          />

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPersonForm;
