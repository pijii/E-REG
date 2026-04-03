import React, { useState, useEffect } from 'react';
import '../Styles/Navbar.css';
import logo from '../img/logo/E-Reg.png';

// Icons
import dashboardIcon from '../img/icons/dashboard.png';
import studentsIcon from '../img/icons/student.png';
import orgIcon from '../img/icons/members.png';
import eventsIcon from '../img/icons/events.png';
import reportsIcon from '../img/icons/report.png';
import profileIcon from '../img/icons/profile.png';
import notificationIcon from '../img/icons/bell.png';
import logoutIcon from '../img/icons/logout.png';

// Admin Pages
import Dashboard from '../Pages/Admin/Dashboard';
import Students from '../Pages/Admin/Student';
import OrgCreate from '../Pages/Admin/OrgCreate';
import Events from '../Pages/Admin/Events';
import Reports from '../Pages/Admin/Reports';
import Profile from '../Pages/Admin/Profile'; // ✅ kept

const AdminNavbar = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: dashboardIcon },
    { id: 'students', label: 'Students', icon: studentsIcon },
    { id: 'organizations', label: 'Organizations', icon: orgIcon },
    { id: 'events', label: 'Events', icon: eventsIcon },
    { id: 'reports', label: 'Reports', icon: reportsIcon },
  ];

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const handleLinkClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth <= 600) setIsSidebarExpanded(false);
  };

  const toggleNotification = () => {
    setIsNotificationOpen(prev => !prev);
  };

  // ✅ Dynamic Title
  useEffect(() => {
    const titles = {
      'dashboard': 'E-Reg | Admin Dashboard',
      'students': 'E-Reg | Students',
      'organizations': 'E-Reg | Organizations',
      'events': 'E-Reg | Events',
      'reports': 'E-Reg | Reports',
      'profile': 'E-Reg | Profile',
    };
    document.title = titles[activeTab] || 'E-Reg';
  }, [activeTab]);

  // Responsive Sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 600) setIsSidebarExpanded(false);
      else if (window.innerWidth > 1200) setIsSidebarExpanded(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* 🔷 TOP NAVBAR */}
      <nav className="top-navbar">
        <div className="navbar-left">
          <button 
            className="sidebar-toggle-top" 
            onClick={toggleSidebar}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <line x1="4" y1="6" x2="20" y2="6" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="4" y1="12" x2="20" y2="12" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="4" y1="18" x2="20" y2="18" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>

          <img src={logo} alt="E-Reg Logo" className="navbar-logo-img" />
          <span className="navbar-title">E-REG</span>
        </div>

        <div className="navbar-right">
          <h3 className="navbar-btn">ADMIN</h3>

          {/* PROFILE */}
          <button 
            className="profile-container"
            onClick={() => setActiveTab('profile')}
          >
            <img src={profileIcon} alt="Profile" className="prof-icon-img" />
          </button>

          {/* 🔔 NOTIFICATION */}
          <button 
            className={`notification-btn ${isNotificationOpen ? 'active' : ''}`}
            onClick={toggleNotification}
          >
            <img src={notificationIcon} alt="Notification" className="nav-icon-img" />
          </button>
        </div>
      </nav>

      {/* 🔷 SIDEBAR */}
      <div 
        className={`sidebar-wrapper ${isSidebarExpanded ? 'expanded' : 'collapsed'}`}
        onMouseEnter={() => window.innerWidth > 1200 && setIsSidebarExpanded(true)}
        onMouseLeave={() => window.innerWidth > 1200 && setIsSidebarExpanded(false)}
      >
        <div className="sidebar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleLinkClick(item.id)}
            >
              <img src={item.icon} alt={item.label} className="sidebar-icon-img" />
              <span className="label">{item.label}</span>
            </button>
          ))}

          {/* 🔴 LOGOUT */}
          <button className="sidebar-link logout">
            <img src={logoutIcon} alt="Logout" className="sidebar-icon-img" />
            <span className="label">Log out</span>
          </button>
        </div>
      </div>

      {/* 🔷 MAIN CONTENT */}
      <div className={`content-wrapper ${isSidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="page-area">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'students' && <Students />}
          {activeTab === 'organizations' && <OrgCreate />}
          {activeTab === 'events' && <Events />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'profile' && <Profile />}
        </div>
      </div>

      {/* 🔔 NOTIFICATION PANEL */}
      {isNotificationOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
          </div>
          <div className="notification-body">
            <div className="empty-notification">
              No new notifications yet.
            </div>
          </div>
        </div>
      )}

      {/* 🔻 FOOTER */}
      <footer className="bg-dark text-light text-center py-4">
        <p>&copy; 2023 E-Reg Admin. All rights reserved.</p>
      </footer>
    </>
  );
};

export default AdminNavbar;