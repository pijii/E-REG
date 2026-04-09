import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../img/logo/E-Reg.png';

// Icons
import dashboardIcon from '../img/icons/dashboard.png';
import studentsIcon from '../img/icons/student.png';
import orgIcon from '../img/icons/members.png';
import eventsIcon from '../img/icons/events.png';
import reportsIcon from '../img/icons/report.png';
import defaultProfileIcon from '../img/icons/profile.png';
import notificationIcon from '../img/icons/bell.png';
import logoutIcon from '../img/icons/logout.png';

// Pages
import Dashboard from '../Pages/Admin/Dashboard';
import Students from '../Pages/Admin/Student';
import OrgCreate from '../Pages/Admin/OrgCreate';
import Events from '../Pages/Admin/Events';
import Reports from '../Pages/Admin/Reports';
import Profile from '../Pages/Admin/Profile';

const AdminNavbar = () => {
  const { user, logout } = useAuth();

  // Expansion States
  const [isManuallyOpen, setIsManuallyOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: dashboardIcon },
    { id: 'students', label: 'Students', icon: studentsIcon },
    { id: 'organizations', label: 'Organizations', icon: orgIcon },
    { id: 'events', label: 'Events', icon: eventsIcon },
    { id: 'reports', label: 'Reports', icon: reportsIcon },
  ];

  const adminProfile = user?.profile;
  const account = user?.account;
  const adminName = adminProfile?.name || account?.email || 'Administrator';
  const profileImage = adminProfile?.profile_img || defaultProfileIcon;

  // Final expansion logic
  const isExpanded = isManuallyOpen || isHovered;

  const toggleSidebar = (e) => {
    e.stopPropagation();
    setIsManuallyOpen(!isManuallyOpen);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isManuallyOpen) {
      setIsManuallyOpen(false);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleLinkClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth <= 600) {
      setIsManuallyOpen(false);
    }
  };

  // Close notifications if clicking outside
  useEffect(() => {
    const closePanels = () => setIsNotificationOpen(false);
    if (isNotificationOpen) {
      window.addEventListener('click', closePanels);
    }
    return () => window.removeEventListener('click', closePanels);
  }, [isNotificationOpen]);

  // Document Title Effect
  useEffect(() => {
    const titles = {
      dashboard: 'E-Reg | Admin Dashboard',
      students: 'E-Reg | Students',
      organizations: 'E-Reg | Organizations',
      events: 'E-Reg | Events',
      reports: 'E-Reg | Reports',
      profile: 'E-Reg | Profile',
    };
    document.title = titles[activeTab] || 'E-Reg';
  }, [activeTab]);

  return (
    <>
      {/* Top Navbar */}
      <nav className="top-navbar">
        <div className="navbar-left">
          <button className="sidebar-toggle-top" onClick={toggleSidebar}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <line x1="4" y1="6" x2="20" y2="6" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="4" y1="12" x2="20" y2="12" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="4" y1="18" x2="20" y2="18" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
          <img src={logo} alt="Logo" className="navbar-logo-img" />
          <span className="navbar-title">E-REG</span>
        </div>

        <div className="navbar-right">
          <h3 className="navbar-btn mt-2">{adminName}</h3>
          <button className="profile-container" onClick={() => setActiveTab('profile')}>
            <img 
              src={profileImage} 
              alt="Profile" 
              className="prof-icon-img" 
              onError={e => e.target.src = defaultProfileIcon} 
            />
          </button>
          
          <div className="notification-wrapper" onClick={(e) => e.stopPropagation()}>
            <button 
              className={`notification-btn ${isNotificationOpen ? 'active' : ''}`} 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            >
              <img src={notificationIcon} alt="Bell" className="nav-icon-img" />
            </button>

            {isNotificationOpen && (
              <div className="notification-dropdown">
                <div className="dropdown-header">Notifications</div>
                <div className="dropdown-body no-notif">
                   No notifications
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Overlay to close sidebar on mobile when clicking outside */}
      {isManuallyOpen && window.innerWidth <= 600 && (
        <div className="sidebar-overlay" onClick={() => setIsManuallyOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar-wrapper ${isExpanded ? 'expanded' : 'collapsed'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="sidebar">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleLinkClick(item.id)}
            >
              <img src={item.icon} alt={item.label} className="sidebar-icon-img" />
              <span className="label">{item.label}</span>
            </button>
          ))}

          <button className="sidebar-link logout" onClick={() => logout()}>
            <img src={logoutIcon} alt="Logout" className="sidebar-icon-img" />
            <span className="label">Log out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`content-wrapper ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {activeTab === 'dashboard' && <Dashboard onTabChange={setActiveTab} />}
        {activeTab === 'students' && <Students />}
        {activeTab === 'organizations' && <OrgCreate />}
        {activeTab === 'events' && <Events />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'profile' && <Profile />}
      </div>
    </>
  );
};

export default AdminNavbar;