import React, { useState } from "react";
import api from "../api";
import "../css/addPerson.css";

const PublicForm = () => {
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
  const [photos, setPhotos] = useState([]);
  const [message, setMessage] = useState("");

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    photos.forEach((p) => data.append("photos", p));

    try {
      await api.post("/public-form", data);
      setMessage("Form submitted successfully!");
      setFormData({
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
      setPhotos([]);
    } catch (err) {
      console.error(err);
      setMessage("Error submitting form");
    }
  };

  return (
    <div className="addperson-container">
      <h2 className="form-title">Public Person Form</h2>
      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit} className="person-form">
        <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
        <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} />
        <input type="number" name="height" placeholder="Height (cm)" value={formData.height} onChange={handleChange} />

        {Object.keys(predefinedOptions).map((field) => (
          <select key={field} name={field} value={formData[field]} onChange={handleChange}>
            <option value="">Select {field}</option>
            {predefinedOptions[field].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ))}

        <input type="text" name="area" placeholder="Area" value={formData.area} onChange={handleChange} />
        <input type="file" multiple accept="image/*" onChange={(e) => setPhotos(Array.from(e.target.files))} />

        <button type="submit" className="submit-btn">Submit</button>
      </form>
    </div>
  );
};

export default PublicForm;
