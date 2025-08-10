// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import UserTable from "../components/UserTable";
import PeopleList from "../components/PeopleList";
import FilterSidebar from "../components/FilterSidebar";
import AddPersonForm from "../components/AddPersonForm";
import "../css/dashboard.css"; // ✅ CSS file import

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("");
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
    <div className="dashboard-container">
      <Navbar onSelect={setActiveTab} />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="welcome-box">
            <h2>Welcome, {user.name}</h2>
            <p>
              {user.email} – {user.isAdmin ? "Admin" : "User"}
            </p>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>

        {user.isAdmin && activeTab && (
          <div className="dashboard-main">
            {activeTab === "people" && (
              <div className="sidebar-section">
                <FilterSidebar onFilter={setFilters} />
                <button
                  onClick={() => setShowAddModal(true)}
                  className="add-person-button"
                >
                  ➕ Add Person
                </button>
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/public-form`;
                    navigator.clipboard.writeText(link);
                    alert("Public form link copied: " + link);
                  }}
                  className="share-form-button"
                >
                  🔗 Share Public Form
                </button>
              </div>
            )}

            <div
              className={
                activeTab === "people"
                  ? "content-section content-with-sidebar"
                  : "content-section"
              }
            >
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
