import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import logo from '../img/logo/E-Reg.png';
import '../Styles/Navbar.css';

// Icons
import dashboardIcon from '../img/icons/dashboard.png';
import eventsIcon from '../img/icons/events.png';
import createIcon from '../img/icons/create.png';
import membersIcon from '../img/icons/members.png';
import profileIcon from '../img/icons/profile.png';
import notificationIcon from '../img/icons/bell.png';
import logoutIcon from '../img/icons/logout.png';

// Pages
import Dashboard from '../Pages/Organization/Dashboard';
import MyEvents from '../Pages/Organization/MyEvents';
import CreateEvent from '../Pages/Organization/CreateEvent';
import OrgMembers from '../Pages/Organization/OrgMembers';
import EventView from '../Pages/Organization/EventView';
import Profile from '../Pages/Organization/Profile';

const OrganizationNavbar = () => {
  const { user, logout } = useAuth();
  const notificationRef = useRef(null);

  // UI & Sidebar States
  const [isManuallyOpen, setIsManuallyOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Notification Data
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Database Mapping based on your Schema
  // org table acts as the profile for this role
  const orgProfile = user?.profile; 
  const account = user?.account;
  const orgName = orgProfile?.name || 'Organization';
  
  // Note: Add a 'profile_img' column to your organization table if not present, 
  // or update this path to where you store the org logo.
  const profileImage = orgProfile?.profile || profileIcon;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: dashboardIcon },
    { id: 'my-events', label: 'My Events', icon: eventsIcon },
    { id: 'create-events', label: 'Create Event', icon: createIcon },
    { id: 'org-mem', label: 'Org Members', icon: membersIcon },
  ];

  const isExpanded = isManuallyOpen || isHovered;

  const navigateTo = (tab, id = null) => {
    setActiveTab(tab);
    if (id) setSelectedEventId(id);
  };

  // Notification Click Outside logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notifications Subscription & Fetching
  useEffect(() => {
    if (!account?.account_id) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notification')
        .select('*')
        .eq('user_id', account.account_id)
        .order('created_at', { ascending: false })
        .limit(15);

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel(`org-notifs-${account.account_id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notification', 
        filter: `user_id=eq.${account.account_id}` 
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 15));
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [account?.account_id]);

  const handleMarkAsRead = async (id) => {
    const { error } = await supabase.from('notification').update({ is_read: true }).eq('id', id);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <>
      <nav className="top-navbar">
        <div className="navbar-left">
          <button className="sidebar-toggle-top" onClick={() => setIsManuallyOpen(!isManuallyOpen)}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <line x1="4" y1="6" x2="20" y2="6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="4" y1="12" x2="20" y2="12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="4" y1="18" x2="20" y2="18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
          <img src={logo} alt="Logo" className="navbar-logo-img" />
          <span className="navbar-title">E-REG</span>
        </div>

        <div className="navbar-right">
          <h3 className="navbar-btn mt-2 d-none d-md-block">{orgName}</h3>

          {/* Profile Section */}
          <button className="profile-container" onClick={() => setActiveTab('profile')}>
            <img 
              src={profileImage} 
              alt="Profile" 
              className="prof-icon-img" 
              onError={(e) => (e.target.src = profileIcon)} 
            />
          </button>

          {/* Notification Section */}
          <div className="notification-wrapper" ref={notificationRef}>
            <button className="notification-btn" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
              <img src={notificationIcon} alt="Bell" className="nav-icon-img" />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>

            {isNotificationOpen && (
              <div className="notification-dropdown">
                <div className="dropdown-header">Notifications</div>
                <div className="dropdown-body">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={() => handleMarkAsRead(n.id)}
                      >
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-message">{n.message}</div>
                        <small className="notif-time text-muted">{new Date(n.created_at).toLocaleDateString()}</small>
                      </div>
                    ))
                  ) : (
                    <div className="no-notif">No new notifications</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div 
        className={`sidebar-wrapper ${isExpanded ? 'expanded' : ''}`} 
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="sidebar">
          {menuItems.map((item) => (
            <button 
              key={item.id} 
              className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`} 
              onClick={() => setActiveTab(item.id)}
            >
              <img src={item.icon} alt="" className="sidebar-icon-img" />
              <span className="label">{item.label}</span>
            </button>
          ))}
          <button className="sidebar-link logout" onClick={() => setShowLogoutModal(true)}>
            <img src={logoutIcon} alt="" className="sidebar-icon-img" />
            <span className="label">Log out</span>
          </button>
        </div>
      </div>

      <div className={`content-wrapper ${isExpanded ? 'expanded' : ''}`}>
        {activeTab === 'dashboard' && <Dashboard onTabChange={navigateTo} />}
        {activeTab === 'my-events' && <MyEvents onTabChange={navigateTo} />}
        {activeTab === 'create-events' && <CreateEvent onTabChange={navigateTo} />}
        {activeTab === 'org-mem' && <OrgMembers onTabChange={navigateTo} />}
        {activeTab === 'profile' && <Profile onTabChange={navigateTo} />}
        {activeTab === 'event-view' && <EventView eventId={selectedEventId} onTabChange={navigateTo} />}
      </div>

      {showLogoutModal && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to sign out?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn-confirm-logout" onClick={logout}>Log Out</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default OrganizationNavbar;