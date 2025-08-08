// src/components/PeopleList.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import { generateUserPDF } from "../utils/pdfUtils";

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
    <div>
      <h2 className="text-lg font-bold mb-4">
        Showing {people.length} person{people.length !== 1 && "s"}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {people.map((person) => (
          <div
            key={person._id}
            className="bg-white rounded shadow hover:shadow-md cursor-pointer"
            onClick={() => setSelectedPerson(person)}
          >
            {person.photos?.length > 0 && (
              <img
                src={`http://localhost:5000/uploads/${person.photos[0]}`}
                alt={person.name}
                className="w-full h-40 object-cover rounded-t"
              />
            )}
            <div className="p-2">
              <p className="font-bold text-center">{person.name}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedPerson && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full relative">
            <button
              onClick={() => {
                setSelectedPerson(null);
                setShowFieldSelection(false);
              }}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✖
            </button>

            <h3 className="text-xl font-bold mb-2">{selectedPerson.name}</h3>
            <div className="grid grid-cols-2 gap-2">
              {selectedPerson.photos?.map((p, i) => (
                <img
                  key={i}
                  src={`http://localhost:5000/uploads/${p}`}
                  alt="person pic"
                  className="rounded h-28 object-cover"
                />
              ))}
            </div>

            <ul className="mt-4 text-sm space-y-1">
              {availableFields.map((field) => (
                <li key={field}>
                  <strong>{fieldLabels[field]}:</strong> {selectedPerson[field]}
                </li>
              ))}
            </ul>

            <button
              onClick={() => setShowFieldSelection(!showFieldSelection)}
              className="bg-blue-600 text-white px-4 py-1 rounded mt-4"
            >
              📄 Download PDF
            </button>

            {showFieldSelection && (
              <div className="mt-3 border rounded p-2 bg-gray-50">
                <p className="font-semibold text-sm mb-2">Select fields to include:</p>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  {availableFields.map((field) => (
                    <label key={field} className="flex items-center space-x-1">
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
                  className="mt-3 bg-green-600 text-white px-3 py-1 rounded"
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
