// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import UserTable from "../components/UserTable";
import PeopleList from "../components/PeopleList";
import FilterSidebar from "../components/FilterSidebar";
import AddPersonForm from "../components/AddPersonForm";
import "../css/dashboard.css";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(""); // No default view
  const [filters, setFilters] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [personRefresh, setPersonRefresh] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onSelect={setActiveTab} />
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome, {user.name}
            </h2>
            <p className="text-gray-600">
              {user.email} –{" "}
              <span
                className={
                  user.isAdmin
                    ? "text-green-600 font-semibold"
                    : "text-blue-600"
                }
              >
                {user.isAdmin ? "Admin" : "User"}
              </span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        {user.isAdmin && activeTab && (
          <div className="flex">
            {activeTab === "people" && (
              <div className="w-1/4 mr-4 space-y-4">
                <FilterSidebar onFilter={setFilters} />
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full bg-green-600 text-white py-2 rounded"
                >
                  ➕ Add Person
                </button>
              </div>
            )}

            <div className={activeTab === "people" ? "w-3/4" : "w-full"}>
              {activeTab === "users" && <UserTable />}
              {activeTab === "people" && (
                <PeopleList filters={filters} key={personRefresh} />
              )}
            </div>

            {showAddModal && (
              <AddPersonForm
                onClose={() => setShowAddModal(false)}
                onPersonAdded={() => setPersonRefresh((prev) => prev + 1)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
