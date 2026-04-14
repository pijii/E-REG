import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient'; 
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
  const isExpanded = isManuallyOpen || isHovered;

  /**
   * 1. Fetch initial notifications
   */
  const fetchNotifications = async () => {
    if (!user?.account?.account_id) return; // Matches your table schema 'account_id'
    
    const { data, error } = await supabase
      .from('notification')
      .select('*')
      .eq('user_id', user.account.account_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error("Fetch Error:", error.message);
    } else {
      setNotifications(data || []);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  /**
   * 2. Real-time Subscription
   */
  useEffect(() => {
    if (!user?.account?.account_id) return;

    fetchNotifications();

    const channel = supabase
      .channel(`user-notifs-${user.account.account_id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notification', 
          filter: `user_id=eq.${user.account.account_id}` 
        }, 
        (payload) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 10));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.account?.account_id]);

  /**
   * 3. Mark notification as read
   */
  const handleMarkAsRead = async (id) => {
    const { error } = await supabase
      .from('notification')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const toggleSidebar = (e) => {
    e.stopPropagation();
    setIsManuallyOpen(!isManuallyOpen);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isManuallyOpen) setIsManuallyOpen(false);
  };

  const handleLinkClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth <= 600) setIsManuallyOpen(false);
  };

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
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {isNotificationOpen && (
              <div className="notification-dropdown shadow border-0">
                <div className="dropdown-header fw-bold">Notifications</div>
                <div className="dropdown-body">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`notification-item p-2 border-bottom ${!n.is_read ? 'unread-notif' : ''}`}
                        onClick={() => handleMarkAsRead(n.id)}
                        style={{cursor: 'pointer'}}
                      >
                        <div className="fw-bold small">{n.title}</div>
                        <div className="text-muted extra-small">{n.message}</div>
                        <div className="text-end" style={{fontSize: '9px'}}>
                          {new Date(n.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted">No new notifications</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div
        className={`sidebar-wrapper ${isExpanded ? 'expanded' : 'collapsed'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
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
          <button className="sidebar-link logout" onClick={() => setShowLogoutModal(true)}>
            <img src={logoutIcon} alt="Logout" className="sidebar-icon-img" />
            <span className="label">Log out</span>
          </button>
        </div>
      </div>

      <div className={`content-wrapper ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {activeTab === 'dashboard' && <Dashboard onTabChange={setActiveTab} />}
        {activeTab === 'students' && <Students />}
        {activeTab === 'organizations' && <OrgCreate />}
        {activeTab === 'events' && <Events />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'profile' && <Profile />}
      </div>

      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="logout-modal p-4 text-center">
            <h4 className="fw-bold">Confirm Logout</h4>
            <p className="text-secondary">Are you sure you want to sign out?</p>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <button className="btn btn-light px-4" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn btn-danger px-4" onClick={logout}>Log Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNavbar;