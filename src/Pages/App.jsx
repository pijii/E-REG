import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Navbar from '../Components/OrgNavbar';
import ProtectedRoute from '../Components/ProtectedRoute';

import '../Styles/App.css';

function App() {
  return (
    <Navbar />
  );
}

export default App;
