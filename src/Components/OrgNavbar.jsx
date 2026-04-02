// src/Components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import logo from '../img/logo/E-Reg.png';
import dashboardIcon from '../img/icons/dashboard.png';
import eventsIcon from '../img/icons/events.png';
import createIcon from '../img/icons/create.png';
import profileIcon from '../img/icons/profile.png';
import notificationIcon from '../img/icons/bell.png';
import logoutIcon from '../img/icons/logout.png';
import membersIcon from '../img/icons/members.png';

// Import Pages
import Dashboard from '../Pages/Organization/Dashboard';
import MyEvents from '../Pages/Organization/MyEvents';
import CreateEvent from '../Pages/Organization/CreateEvent';
import OrgMembers from '../Pages/Organization/OrgMembers';
import EventView from '../Pages/Organization/EventView';
import Profile from '../Pages/Organization/Profile';
import EditEvent from '../Pages/Organization/EditEvent';

const Navbar = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  // Set page titles dynamically
  useEffect(() => {
    const titles = {
      'dashboard': 'E-Reg | Dashboard',
      'my-events': 'E-Reg | My Events',
      'create-events': 'E-Reg | Create Event',
      'org-mem': 'E-Reg | Org Members',
      'profile': 'E-Reg | Profile',
      'event-view': 'E-Reg | Event Details',
      'edit-event': 'E-Reg | Edit Event',
    };
    document.title = titles[activeTab] || 'E-Reg';
  }, [activeTab]);

  // Handle sidebar resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 600) {
        setIsSidebarExpanded(false);
      } else if (window.innerWidth > 1200) {
        setIsSidebarExpanded(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLinkClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth <= 600) setIsSidebarExpanded(false);
  };

  const toggleNotification = () => {
    setIsNotificationOpen(prev => !prev);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: dashboardIcon },
    { id: 'my-events', label: 'My Events', icon: eventsIcon },
    { id: 'create-events', label: 'Create Event', icon: createIcon },
    { id: 'org-mem', label: 'Org Members', icon: membersIcon },
  ];

  return (
    <>
      {/* Top Navbar */}
      <nav className="top-navbar d-flex justify-content-between align-items-center p-2">
        <div className="d-flex align-items-center">
          <button 
            className="sidebar-toggle-top btn btn-link"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <line x1="4" y1="6" x2="20" y2="6" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="4" y1="12" x2="20" y2="12" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="4" y1="18" x2="20" y2="18" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
          <img src={logo} alt="E-Reg Logo" className="navbar-logo-img me-2" style={{ height: '35px' }} />
          <span className="navbar-title fw-bold">E-Reg</span>
        </div>

        <div className="d-flex align-items-center">
          <h3 className="me-3">ORG NAME</h3>

          <button className="profile-container btn btn-link me-2" onClick={() => setActiveTab('profile')}>
            <img src={profileIcon} alt="Profile" className="prof-icon-img" style={{ height: '30px' }} />
          </button>

          <button 
            className={`notification-btn btn btn-link position-relative ${isNotificationOpen ? 'active' : ''}`}
            onClick={toggleNotification}
            aria-label="Notifications"
          >
            <img src={notificationIcon} alt="Notification" style={{ height: '30px' }} />
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <div 
        className={`sidebar-wrapper ${isSidebarExpanded ? 'expanded' : 'collapsed'}`}
        onMouseEnter={() => window.innerWidth > 1200 && setIsSidebarExpanded(true)}
        onMouseLeave={() => window.innerWidth > 1200 && setIsSidebarExpanded(false)}
      >
        <div className="sidebar d-flex flex-column p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link btn d-flex align-items-center mb-2 ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleLinkClick(item.id)}
            >
              <img src={item.icon} alt={item.label} className="sidebar-icon-img me-2" style={{ width: '24px', height: '24px' }} />
              <span>{item.label}</span>
            </button>
          ))}

          <button 
            className="sidebar-link logout btn d-flex align-items-center mt-auto"
            onClick={() => console.log('Logging out...')}
          >
            <img src={logoutIcon} alt="Logout" className="sidebar-icon-img me-2" style={{ width: '24px', height: '24px' }} />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`content-wrapper ${isSidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="page-area p-3">
          {activeTab === 'dashboard' && <Dashboard onTabChange={setActiveTab} />}
          {activeTab === 'my-events' && <MyEvents onTabChange={setActiveTab} />}
          {activeTab === 'create-events' && <CreateEvent onTabChange={setActiveTab} />}
          {activeTab === 'org-mem' && <OrgMembers onTabChange={setActiveTab} />}
          {activeTab === 'event-view' && <EventView onTabChange={setActiveTab} />}
          {activeTab === 'profile' && <Profile onTabChange={setActiveTab} logo={logo} />}
          {activeTab === 'edit-event' && <EditEvent onTabChange={setActiveTab} />}
        </div>
      </div>

      {/* Notification Panel */}
      {isNotificationOpen && (
        <div className="notification-panel position-absolute top-0 end-0 bg-white shadow p-3">
          <div className="notification-header mb-2">
            <h5>Notifications</h5>
          </div>
          <div className="notification-body">
            <div className="empty-notification">No new notifications yet.</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-dark text-light text-center py-3 mt-3">
        <p>&copy; 2023 E-Reg. All rights reserved.</p>
      </footer>
    </>
  );
};

export default Navbar;