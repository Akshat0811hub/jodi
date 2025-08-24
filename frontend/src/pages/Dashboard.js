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
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    // Debug: Check user admin status
    console.log("User loaded:", parsedUser);
    console.log("Is Admin:", parsedUser.isAdmin);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Debug: Check active tab changes
  const handleTabChange = (tab) => {
    console.log("Active tab changed to:", tab);
    setActiveTab(tab);
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="dashboard-container">
      {/* Pass the debug handler instead of direct setActiveTab */}
      <Navbar onSelect={handleTabChange} />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="welcome-box">
            <h2>Welcome, {user.name}</h2>
            <p>
              {user.email} – {user.isAdmin ? "Admin" : "User"}
            </p>
            {/* Debug info */}
            <small style={{color: '#888'}}>
              Active Tab: "{activeTab}" | Is Admin: {user.isAdmin ? "Yes" : "No"}
            </small>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>

        {/* Show content for both admin and non-admin users for debugging */}
        {activeTab && (
          <div className="dashboard-main">
            {activeTab === "people" && (
              <div className="sidebar-section">
                <FilterSidebar onFilter={setFilters} />
                {/* Always show button when people tab is active for debugging */}
                <button
                  onClick={() => {
                    console.log("Add Person button clicked");
                    setShowAddModal(true);
                  }}
                  className="add-person-button"
                  style={{
                    display: 'block', // Force display for debugging
                    marginTop: '16px'
                  }}
                >
                  ➕ Add Person
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
              {activeTab === "users" && user.isAdmin && <UserTable />}
              {activeTab === "people" && (
                <PeopleList filters={filters} key={personRefresh} />
              )}
              
              {/* Debug: Show what should be rendered */}
              {!user.isAdmin && (
                <div style={{padding: '20px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px'}}>
                  <p><strong>Debug:</strong> You are not an admin user. Admin features are hidden.</p>
                </div>
              )}
            </div>

            {showAddModal && (
              <AddPersonForm
                onClose={() => {
                  console.log("Closing add person modal");
                  setShowAddModal(false);
                }}
                onPersonAdded={() => setPersonRefresh((prev) => prev + 1)}
              />
            )}
          </div>
        )}

        {/* Debug: Show current state */}
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          <div>Active Tab: {activeTab || "None"}</div>
          <div>Is Admin: {user.isAdmin ? "Yes" : "No"}</div>
          <div>Show Modal: {showAddModal ? "Yes" : "No"}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;