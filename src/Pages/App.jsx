import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from './Login';
import SignupPage from './SignUp';
import AdminNavbar from '../Components/AdminNavbar';
import OrgNavbar from '../Components/OrgNavbar';
import StudentNavbar from '../Components/StudentNavbar';
import AuthCallback from '../Components/AuthCallback';

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing / Login */}
      <Route path="/" element={!user ? <LoginPage /> : <Navigate to={`/${user.role}`} replace />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* CRITICAL FIX: 
          If your website is hosted at /E-REG/, your path here should just be "auth/callback" 
          because the Router's 'basename' handles the /E-REG/ prefix.
      */}
      <Route path="auth/callback" element={<AuthCallback />} />

      {/* Protected Routes */}
      <Route
        path="/admin/*"
        element={user?.role === 'admin' ? <AdminNavbar /> : <Navigate to="/" replace />}
      />
      <Route
        path="/organization/*"
        element={user?.role === 'organization' ? <OrgNavbar /> : <Navigate to="/" replace />}
      />
      <Route
        path="/student/*"
        element={user?.role === 'student' ? <StudentNavbar /> : <Navigate to="/" replace />}
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;