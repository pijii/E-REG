import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Initialize with demo data
  useEffect(() => {
    loadDemoData();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  };

  const loadDemoData = () => {
    const demoEvents = [
      {
        id: 1,
        title: 'Tech Summit 2026',
        description: 'Annual technology conference with industry leaders',
        date: '2026-04-15',
        time: '09:00 AM',
        location: 'Convention Center, New York',
        organizer: 'Tech Corp',
        capacity: 500,
        registered: 245,
        image: 'https://via.placeholder.com/300x150?text=Tech+Summit'
      },
      {
        id: 2,
        title: 'Web Development Workshop',
        description: 'Hands-on workshop on modern web development',
        date: '2026-04-20',
        time: '02:00 PM',
        location: 'Tech Hub, San Francisco',
        organizer: 'Dev Academy',
        capacity: 100,
        registered: 85,
        image: 'https://via.placeholder.com/300x150?text=Web+Dev'
      },
      {
        id: 3,
        title: 'AI & Machine Learning Summit',
        description: 'Explore the latest in AI and ML technologies',
        date: '2026-05-10',
        time: '10:00 AM',
        location: 'Innovation Hub, Boston',
        organizer: 'AI Institute',
        capacity: 300,
        registered: 120,
        image: 'https://via.placeholder.com/300x150?text=AI+Summit'
      }
    ];
    setEvents(demoEvents);
  };

  const login = (email, password, role) => {
    const newUser = {
      id: Date.now(),
      email,
      role,
      name: email.split('@')[0],
      createdAt: new Date().toLocaleDateString()
    };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(newUser));
    addNotification('Login successful!', 'success');
    return true;
  };

  const signup = (email, password, name, role) => {
    const newUser = {
      id: Date.now(),
      email,
      name,
      role,
      createdAt: new Date().toLocaleDateString()
    };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(newUser));
    addNotification('Account created successfully!', 'success');
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    addNotification('Logged out successfully', 'info');
  };

  const registerForEvent = (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (event && event.registered < event.capacity) {
      const registration = {
        id: Date.now(),
        eventId,
        userId: user.id,
        eventTitle: event.title,
        registeredDate: new Date().toLocaleDateString(),
        status: 'registered'
      };
      setRegistrations([...registrations, registration]);
      
      setEvents(events.map(e => 
        e.id === eventId 
          ? { ...e, registered: e.registered + 1 }
          : e
      ));
      
      addNotification(`Successfully registered for ${event.title}!`, 'success');
      return true;
    }
    addNotification('Event is full or not available', 'error');
    return false;
  };

  const cancelRegistration = (registrationId) => {
    const registration = registrations.find(r => r.id === registrationId);
    if (registration) {
      setRegistrations(registrations.filter(r => r.id !== registrationId));
      
      setEvents(events.map(e => 
        e.id === registration.eventId 
          ? { ...e, registered: Math.max(0, e.registered - 1) }
          : e
      ));
      
      addNotification('Registration cancelled', 'info');
      return true;
    }
    return false;
  };

  const createEvent = (eventData) => {
    const newEvent = {
      id: Date.now(),
      ...eventData,
      registered: 0,
      organizer: user.name,
      createdBy: user.id
    };
    setEvents([...events, newEvent]);
    addNotification('Event created successfully!', 'success');
    return newEvent;
  };

  const updateProfile = (profileData) => {
    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    addNotification('Profile updated successfully!', 'success');
  };

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications([notification, ...notifications]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getUserRegistrations = () => {
    return registrations.filter(r => r.userId === user?.id);
  };

  const getUserEvents = () => {
    return events.filter(e => e.createdBy === user?.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        events,
        registrations,
        notifications,
        login,
        signup,
        logout,
        registerForEvent,
        cancelRegistration,
        createEvent,
        updateProfile,
        addNotification,
        removeNotification,
        getUserRegistrations,
        getUserEvents
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
